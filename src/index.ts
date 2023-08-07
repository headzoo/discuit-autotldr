import smmry from 'smmry';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { Discuit } from './Discuit';
import { logger } from './logger';

dotenv.config({
  path: `${__dirname}/../.env`,
});

// The communities that should be summarized.
const communities = ['technology', 'science', 'news', 'Politics', 'programming', 'Entertainment'];

// The domains that shouldn't be summarized because smmry breaks.
const bannedDomains = [
  'news.yahoo.com', // It's asking the bot to login.
  'www.nbcnews.com', // Complains about cookies.
  'archive.is', // Compiling about the connection.
];

(async () => {
  // Summaries are created by https://smmry.com
  if (!process.env.DISCUIT_SMMRY_KEY) {
    logger.error('Missing DISCUIT_SMMRY_KEY');
    process.exit(1);
  }
  const summary = smmry({
    SM_API_KEY: process.env.DISCUIT_SMMRY_KEY,
    SM_LENGTH: 5,
    SM_WITH_BREAK: true,
  });

  // Redis to keep track of which posts have been already been summaried.
  const client = createClient();
  client.on('error', (err) => {
    logger.error(err.toString());
    process.exit(1);
  });
  await client.connect();

  // Set up the discuit api and login the bot.
  if (!process.env.DISCUIT_USERNAME || !process.env.DISCUIT_PASSWORD) {
    logger.error('Missing DISCUIT_USERNAME or DISCUIT_PASSWORD');
    process.exit(1);
  }
  const discuit = new Discuit();
  const bot = await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);
  if (!bot) {
    logger.error('Failed to login');
    process.exit(1);
  }

  // Check the latest posts and summarize them.
  const posts = await discuit.getPosts('latest', 50);
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(post);
    logger.info(`Checking https://discuit.net/${post.communityName}/post/${post.publicId}`);

    // Are we watching this community?
    if (!communities.includes(post.communityName)) {
      logger.info(
        `Skipping https://discuit.net/${post.communityName}/post/${post.publicId} as it is not in the list of communities to summarize.`,
      );
      continue;
    }

    // Has the post already been summaried?
    const isSummaried = await client.get(`discuit-autotldr-read-${post.id}`);
    if (isSummaried) {
      logger.info(
        `Skipping https://discuit.net/${post.communityName}/post/${post.publicId} as it has already been checked.`,
      );
      continue;
    }

    // Skip when the post does not include a link.
    if (!post.link) {
      logger.info(
        `Skipping https://discuit.net/${post.communityName}/post/${post.publicId} as it does not have a link.`,
      );
      continue;
    }

    // Skip when the post is a banned domain.
    if (bannedDomains.includes(post.link.hostname)) {
      logger.info(
        `Skipping https://discuit.net/${post.communityName}/post/${post.publicId} as it is a banned domain.`,
      );
      continue;
    }

    // Flag the post as summaried. Whether it has a link or whether the bot successfully
    // writes a comment doesn't matter. We'll flag it now, so it doesn't keep coming back
    // around in case posting the comment is failing for some reason. We'll just skip it
    // when it's failing.
    await client.set(`discuit-autotldr-read-${post.id}`, 'true');

    // Summarize!
    logger.info(`Fetching summary for ${post.link.url}`);
    const result = await summary.summarizeUrl(post.link.url);
    if (result && result.sm_api_content) {
      const posted = await discuit.postComment(
        post.publicId,
        `This is the best tl;dr I could make, original reduced by ${
          result.sm_api_content_reduced
        }.\n\n----\n\n${result.sm_api_content.replace(/\[BREAK]/g, '\n\n')}\n\n----\n\nI am a bot.`,
      );

      logger.info(
        `Posted to https://discuit.net/${posted.communityName}/post/${posted.postPublicId}.`,
      );
    }
  }

  logger.info('Done.');
  process.exit(0);
})();
