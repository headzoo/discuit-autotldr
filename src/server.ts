import express, { Request, Response } from 'express';
import basicAuth from 'express-basic-auth';
import path from 'path';
import { logger } from './logger';
import { Communities, BannedSites } from './modals';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'twig');

app.set('twig options', {
  allowAsync: true, // Allow asynchronous compiling
  strict_variables: false,
});

/**
 *
 */
app.get('/', async (req: Request, res: Response) => {
  // The communities that should be summarized.
  const communities: string[] = [];
  const c = await Communities.findAll();
  c.forEach((community) => {
    communities.push(community.dataValues);
  });

  // The domains that shouldn't be summarized because smmry breaks.
  const bannedDomains: string[] = [];
  const b = await BannedSites.findAll();
  b.forEach((site) => {
    bannedDomains.push(site.dataValues);
  });

  res.render('index.html.twig', {
    message: 'Hello World',
    communities,
    bannedDomains,
  });
});

/**
 *
 */
app.post('/addCommunity', async (req: Request, res: Response) => {
  if (!req.body.community) {
    res.redirect('/');
    return;
  }

  await Communities.create({
    name: req.body.community,
  });

  res.redirect('/');
});

/**
 *
 */
app.get('/removeCommunity', async (req: Request, res: Response) => {
  if (!req.query.community) {
    res.redirect('/');
    return;
  }

  const row = await Communities.findOne({
    where: {
      id: req.query.community,
    },
  });
  if (row) {
    await row.destroy();
  }

  res.redirect('/');
});

/**
 *
 */
app.post('/addBanned', async (req: Request, res: Response) => {
  if (!req.body.hostname || !req.body.reason) {
    res.redirect('/');
    return;
  }

  await BannedSites.create({
    hostname: req.body.hostname,
    reason: req.body.reason,
  });

  res.redirect('/');
});

/**
 *
 */
app.get('/removeBanned', async (req: Request, res: Response) => {
  if (!req.query.banned) {
    res.redirect('/');
    return;
  }

  const row = await BannedSites.findOne({
    where: {
      id: req.query.banned,
    },
  });
  if (row) {
    await row.destroy();
  }

  res.redirect('/');
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
