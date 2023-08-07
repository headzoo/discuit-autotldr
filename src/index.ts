import smmry from 'smmry';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { Discuit } from './Discuit';

dotenv.config();
const communities = ['technology', 'science', 'news', 'Politics', 'programming', 'Entertainment'];

(async () => {
  const summary = smmry({
    SM_API_KEY: process.env.DISCUIT_SMMRY_KEY,
    SM_LENGTH: 5,
    SM_WITH_BREAK: true,
  });

  const client = createClient();
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();

  if (!process.env.DISCUIT_USERNAME || !process.env.DISCUIT_PASSWORD) {
    throw new Error('Missing DISCUIT_USERNAME or DISCUIT_PASSWORD');
  }
  const discuit = new Discuit();
  const bot = await discuit.login(process.env.DISCUIT_USERNAME, process.env.DISCUIT_PASSWORD);
  if (!bot) {
    throw new Error('Failed to login');
  }

  const posts = await discuit.getPosts('latest', 50);
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`Checking ${post.communityName}/${post.id}.`);

    const checked = await client.get(`discuit-autotldr-read-${post.id}`);
    if (checked) {
      console.log(`Skipping ${post.communityName}/${post.id} as it has already been checked.`);
      continue;
    }

    if (communities.indexOf(post.communityName) !== -1 && post.link) {
      console.log(`Fetching summary for ${post.link.url}`);
      await client.set(`discuit-autotldr-read-${post.id}`, 'true');

      const result = await summary.summarizeUrl(post.link.url);
      if (result && result.sm_api_content) {
        const posted = await discuit.postComment(
          post.publicId,
          `This is the best tl;dr I could make, original reduced by ${
            result.sm_api_content_reduced
          }.\n\n----\n\n${result.sm_api_content.replace(
            /\[BREAK]/g,
            '\n\n',
          )}\n\n----\n\nI am a bot.`,
        );

        console.log(`Posted to https://discuit.net/${posted.communityName}/post/${posted.id}.`);
      }
    }
  }

  process.exit(0);
})();
