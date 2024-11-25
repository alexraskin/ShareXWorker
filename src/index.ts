import { Hono, Context, Next } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { cache } from 'hono/cache';
import { nanoid } from 'nanoid';

type Bindings = {
  R2: R2Bucket;
  AUTH_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Auth middleware
app.use('/upload/*', async (c: Context, next: Next) => {
  const auth = bearerAuth({
    token: c.env.AUTH_KEY,
    invalidTokenMessage: 'Unauthorized',
    invalidAuthenticationHeaderMessage: 'Unauthorized',
    noAuthenticationHeaderMessage: 'Unauthorized',
  });
  return auth(c, next);
});

app.get(
  '*',
  cache({
    cacheName: 'ShareXWorker', // is this a good name?
    cacheControl: 'max-age=604800', // 1 week
  })
);

// Error handler
app.onError((err: Error, c: Context) => {
  console.error(`${err}`);
  return c.json({ success: false, message: 'An error occurred' }, 500);
});

// index route
app.get('/', async (c: Context) => {
  return c.json({
    statusCode: 200,
    healthy: true,
  });
});

// upload route
app.post('/upload', async (c: Context) => {
  const fileslug = nanoid(6);

  const contentType = c.req.header('content-type');
  const contentLength = c.req.header('content-length');
  if (!contentLength || !contentType) {
    return c.json(
      { success: false, message: 'Missing content-length or content-type' },
      400
    );
  }
  // i don't like this
  const extensionMap: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  const fileExt = extensionMap[contentType] || '';

  const filename = fileExt ? `${fileslug}.${fileExt}` : fileslug;

  try {
    await c.env.R2.put(filename, await c.req.blob());
  } catch (e) {
    return c.json({ success: false, message: 'Error uploading file' }, 500);
  }

  const returnUrl = new URL(c.req.url);
  returnUrl.searchParams.delete('filename');
  returnUrl.pathname = `/${filename}`;

  const deleteUrl = new URL(c.req.url);
  deleteUrl.pathname = '/delete';
  deleteUrl.searchParams.set('authkey', c.env.AUTH_KEY);
  deleteUrl.searchParams.set('filename', filename);

  return c.json({
    success: true,
    image: returnUrl.href,
    deleteUrl: deleteUrl.href,
  });
});

// delete route
app.get('/delete', async (c: Context) => {
  const authKey = c.req.query('authkey');
  const filename = c.req.query('filename');

  // doing auth twice is so ugly
  if (authKey !== c.env.AUTH_KEY) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  if (!filename) {
    return c.json({ success: false, message: 'Missing filename' }, 400);
  }

  try {
    await c.env.R2.delete(filename);
  } catch (error) {
    return c.json({ success: false, message: 'Error deleting file' }, 500);
  }

  return c.json({ success: true });
});

// get route
app.get('/:id', async (c: Context) => {
  const url = new URL(c.req.url);
  const id = url.pathname.slice(1);

  if (!id) {
    return c.json({ success: false, message: 'Missing file id' }, 400);
  }

  const file = await c.env.R2.get(id);
  if (!file) {
    return c.json({ success: false, message: 'File not found' }, 404);
  }

  return c.body(file.body, 200);
});

export default app;
