import express, { Request, Response } from 'express';
import basicAuth from 'express-basic-auth';
import path from 'path';
import { Community, BannedSite, Link } from './modals';
import { logger } from './logger';
import { eventDispatcher } from './events';
import packageJson from '../package.json';
import { createRedis } from './redis';

if (!process.env.DISCUIT_ADMIN_USERNAME || !process.env.DISCUIT_ADMIN_PASSWORD) {
  logger.error('Missing DISCUIT_ADMIN_USERNAME or DISCUIT_ADMIN_PASSWORD');
  process.exit(1);
}

const app = express();
app.use(
  basicAuth({
    users: {
      [process.env.DISCUIT_ADMIN_USERNAME]: process.env.DISCUIT_ADMIN_PASSWORD,
    },
    challenge: true,
    realm: 'autotldr',
  }),
);
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'twig');
app.set('twig options', {
  allowAsync: true, // Allow asynchronous compiling
  strict_variables: false,
});

/**
 * Gets the bot stats.
 */
const getStats = async (): Promise<{
  watchCount: number;
  bannedCount: number;
  summarizedCount: number;
  runCount: number;
}> => {
  const redis = await createRedis();
  const watchCount = parseInt((await redis.get('discuit-autotldr-watch-count')) || '0', 10);
  const bannedCount = parseInt((await redis.get('discuit-autotldr-banned-count')) || '0', 10);
  const summarizedCount = parseInt(
    (await redis.get('discuit-autotldr-summarize-count')) || '0',
    10,
  );

  const runCount = parseInt((await redis.get('discuit-autotldr-run-count')) || '0', 10);

  return {
    runCount,
    watchCount,
    bannedCount,
    summarizedCount,
  };
};

/**
 * Homepage.
 */
app.get('/', async (req: Request, res: Response) => {
  const links: (typeof Link)[] = [];
  (await Link.findAll({ order: [['createdAt', 'DESC']] })).forEach((link) => {
    links.push(link.dataValues);
  });

  res.render('index.html.twig', {
    stats: await getStats(),
    version: packageJson.version,
    activeTab: 'home',
    links,
  });
});

/**
 * Communities.
 */
app.get('/communities', async (req: Request, res: Response) => {
  const communities: string[] = [];
  const c = await Community.findAll();
  c.forEach((community) => {
    communities.push(community.dataValues);
  });

  res.render('communities.html.twig', {
    version: packageJson.version,
    activeTab: 'communities',
    communities,
  });
});

/**
 * Banned.
 */
app.get('/banned', async (req: Request, res: Response) => {
  const bannedDomains: string[] = [];
  const b = await BannedSite.findAll();
  b.forEach((site) => {
    bannedDomains.push(site.dataValues);
  });

  res.render('banned.html.twig', {
    version: packageJson.version,
    activeTab: 'banned',
    bannedDomains,
  });
});

/**
 * Add community.
 */
app.post('/community', async (req: Request, res: Response) => {
  if (!req.body.community) {
    res.redirect('/communities');
    return;
  }

  await Community.create({
    name: req.body.community,
  });
  eventDispatcher.trigger('rewatch');

  res.redirect('/communities');
});

/**
 * Delete community.
 */
app.get('/removeCommunity', async (req: Request, res: Response) => {
  if (!req.query.community) {
    res.redirect('/communities');
    return;
  }

  const row = await Community.findOne({
    where: {
      id: req.query.community,
    },
  });
  if (row) {
    await row.destroy();
  }
  eventDispatcher.trigger('rewatch');

  res.redirect('/communities');
});

/**
 * Add banned domain.
 */
app.post('/banned', async (req: Request, res: Response) => {
  if (!req.body.hostname || !req.body.reason) {
    res.redirect('/banned');
    return;
  }

  await BannedSite.create({
    hostname: req.body.hostname,
    reason: req.body.reason,
  });
  eventDispatcher.trigger('rewatch');

  res.redirect('/banned');
});

/**
 * Delete banned domain.
 */
app.get('/removeBanned', async (req: Request, res: Response) => {
  if (!req.query.banned) {
    res.redirect('/banned');
    return;
  }

  const row = await BannedSite.findOne({
    where: {
      id: req.query.banned,
    },
  });
  if (row) {
    await row.destroy();
  }
  eventDispatcher.trigger('rewatch');

  res.redirect('/banned');
});

/**
 * Starts the admin web server.
 */
export const runAdminSite = (): Promise<void> => {
  if (!process.env.DISCUIT_ADMIN_PORT) {
    logger.error('Missing DISCUIT_ADMIN_PORT');
    process.exit(1);
  }

  app.listen(process.env.DISCUIT_ADMIN_PORT, () => {
    console.log(`Listening on port ${process.env.DISCUIT_ADMIN_PORT}`);
  });

  return Promise.resolve();
};
