import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign, verify } from 'hono/jwt';

// ! try to avoid as many global variables as you can for serverless thingies

// To get the right types on 'c.env', when initializing the Hono app, pass the types of env as a generic
const app = new Hono<{
   Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
   };
   Variables: {
      userId: string;
   };
}>();

app.use('/api/v1/blog/*', async (c, next) => {
   const jwt = c.req.header('Authorization');
   if (!jwt) {
      c.status(401);
      return c.json({ error: 'unauthorized' });
   }
   const token = jwt.split(' ')[1];
   const payload = await verify(token, c.env.JWT_SECRET);
   if (!payload) {
      c.status(401);
      return c.json({ error: 'unauthorized' });
   }
   c.set('userId', payload.id);
   await next();
});

app.get('/', async (c) => {
   return c.text('Hello Hono!');
});

app.post('/api/v1/signup', async (c) => {
   // from 'wrangler.toml'
   const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
   }).$extends(withAccelerate());

   const body = await c.req.json();
   try {
      const user = await prisma.user.create({
         data: {
            email: body.email,
            password: body.password,
         },
      });

      const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({ jwt });
   } catch (e) {
      c.status(403);
      return c.json({ error: 'error while signing up' });
   }
});

app.post('/api/v1/signin', async (c) => {
   const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
   }).$extends(withAccelerate());

   const body = await c.req.json();
   const user = await prisma.user.findUnique({
      where: {
         email: body.email,
      },
   });

   if (!user) {
      c.status(403);
      return c.json({ error: 'user not found' });
   }

   const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
   return c.json({ jwt });
});

app.get('/api/v1/blog/:id', (c) => {
   const id = c.req.param;
   console.log(id);

   return c.text('get blog route');
});

app.post('/api/v1/blog', async (c) => {
   const userId = c.get('userId');
   const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
   }).$extends(withAccelerate());

   const body = await c.req.json();
   const post = await prisma.post.create({
      data: {
         title: body.title,
         content: body.content,
         authorId: userId,
      },
   });
   return c.json({
      id: post.id,
   });
});

app.put('/api/v1/blog', async (c) => {
   const userId = c.get('userId');
   const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
   }).$extends(withAccelerate());

   const body = await c.req.json();
   const post = await prisma.post.update({
      where: {
         id: body.id,
         authorId: userId,
      },
      data: {
         title: body.title,
         content: body.content,
      },
   });
   return c.json({ post });
});

export default app;
