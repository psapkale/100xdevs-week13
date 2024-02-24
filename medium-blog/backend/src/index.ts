import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from 'hono/jwt';

// ! try to avoid as many global variables as you can for serverless thingies

// To get the right types on 'c.env', when initializing the Hono app, pass the types of env as a generic
const app = new Hono<{
   Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
   };
}>();

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

app.post('/api/v1/blog', (c) => {
   return c.text('post blog route');
});

app.put('/api/v1/blog', (c) => {
   return c.text('update blog route');
});

export default app;
