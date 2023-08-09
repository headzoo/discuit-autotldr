import os from 'os';
import './config';
import { logger } from './logger';
import { createSmmry } from './smmry';
import { createRedis } from './redis';
import { createDiscuit } from './discuit';
import { createDatabase } from './database';
import { Communities, BannedSites } from './modals';

// Run the bot without posting comments. Primarily for testing.
const isCommentingDisabled = os.hostname() === 'sean-ubuntu';

(async () => {
  await createDatabase();
  const summary = await createSmmry();
  const client = await createRedis();
  const discuit = await createDiscuit(client);

  // The communities that should be summarized.
  const communities: string[] = [];
  const c = await Communities.findAll();
  c.forEach((community) => {
    communities.push(community.dataValues.name);
  });

  // The domains that shouldn't be summarized because smmry breaks.
  const bannedDomains: string[] = [];
  const b = await BannedSites.findAll();
  b.forEach((site) => {
    bannedDomains.push(site.dataValues.hostname);
  });

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
      const result = await summary.summarizeUrl(post.link.url);
      if (!isCommentingDisabled && result && result.sm_api_content) {
        const posted = await discuit.comment(
          post.publicId,
          `This is the best tl;dr I could make, original reduced by ${
            result.sm_api_content_reduced
          }.\n\n----\n\n${result.sm_api_content.replace(
            /\[BREAK]/g,
            '\n\n',
          )}\n\n----\n\nI am a bot. Submit comments to the [discuit community](https://discuit.net/autotldr).`,
        );

        logger.info(
          `Posted to https://discuit.net/${posted.communityName}/post/${posted.postPublicId}.`,
        );
      }
    } catch (error) {
      logger.error(error);
    }
  });
})();
