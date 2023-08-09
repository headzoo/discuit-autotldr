import { hostname } from 'os';
import { Discuit } from '@headz/discuit';
import { createRedis, Redis } from './redis';
import { createSmmry } from './smmry';
import { RedisSeenChecker } from './RedisSeenChecker';
import { logger } from './logger';

// Run the bot without posting comments. Primarily for testing.
const isCommentingDisabled = hostname() === 'sean-ubuntu';

/**
 * Creates a new Discuit instance and logs in the bot.
 */
export const createDiscuit = async (redis: Redis): Promise<Discuit> => {
  if (!process.env.DISCUIT_USERNAME || !process.env.DISCUIT_PASSWORD) {
    logger.error('Missing DISCUIT_USERNAME or DISCUIT_PASSWORD');
    process.exit(1);
  }

  try {
    const discuit = new Discuit();
    discuit.logger = logger;
    discuit.watchTimeout = 1000 * 60 * 10; // 10 minutes
    discuit.seenChecker = new RedisSeenChecker(redis);
    const bot = await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);
    if (!bot) {
      logger.error('Failed to login');
      process.exit(1);
    }

    return discuit;
  } catch (error) {
    logger.error('Failed to login');
    process.exit(1);
  }
};

/**
 * Watches for new posts in the given communities.
 *
 * @param communities The communities to watch.
 * @param bannedDomains The domains that should not be summarized.
 */
export const runWatchLoop = async (communities: string[], bannedDomains: string[]) => {
  const client = await createRedis();
  const summary = await createSmmry();
  const discuit = await createDiscuit(client);

  // Start watching for new posts.
  discuit.watch(communities, async (community, post) => {
    logger.info(`Checking https://discuit.net/${post.communityName}/post/${post.publicId}`);

    // Has the post already been summaried?
    const isSummaried = await client.get(`discuit-autotldr-read-${post.id}`);
    if (isSummaried) {
      logger.info(
        `Skipping https://discuit.net/${post.communityName}/post/${post.publicId} as it has already been checked.`,
      );
      return;
    }

    // Skip when the post does not include a link.
    if (!post.link) {
      logger.info(
        `Skipping https://discuit.net/${post.communityName}/post/${post.publicId} as it does not have a link.`,
      );
      return;
    }

    // Skip when the post is a banned domain.
    if (bannedDomains.includes(post.link.hostname)) {
      logger.info(
        `Skipping https://discuit.net/${post.communityName}/post/${post.publicId} as it is a banned domain.`,
      );
      return;
    }

    // Flag the post as summaried. Whether it has a link or whether the bot successfully
    // writes a comment doesn't matter. We'll flag it now, so it doesn't keep coming back
    // around in case posting the comment is failing for some reason. We'll just skip it
    // when it's failing.
    await client.set(`discuit-autotldr-read-${post.id}`, 'true');

    try {
      // Summarize!
      logger.info(`Fetching summary for ${post.link.url}`);
      if (!isCommentingDisabled) {
        const result = await summary.summarizeUrl(post.link.url);
        if (result && result.sm_api_content) {
          const posted = await discuit.postComment(
            post.publicId,
            `This is the best tl;dr I could make, original reduced by ${
              result.sm_api_content_reduced
            }.\n\n----\n\n${result.sm_api_content.replace(
              /\[BREAK]/g,
              '\n\n',
            )}\n\n----\n\nI am a bot. Submit comments to the [discuit community](https://discuit.net/autotldr).`,
          );

          if (!posted) {
            logger.error(`Failed to submit post for ${post.link.url}`);
          } else {
            logger.info(
              `Posted to https://discuit.net/${posted.communityName}/post/${posted.postPublicId}.`,
            );
          }
        }
      }
    } catch (error) {
      logger.error(error);
    }
  });
};
