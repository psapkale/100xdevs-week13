import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/extension';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient({
   datasourseUrl: env.DATABASE_URL,
}).$extends(withAccelerate());

const app = new Hono();

app.get('/', (c) => {
   return c.text('Hello Hono!');
});

app.post('/api/v1/signup', (c) => {
   return c.text('signup route');
});

app.post('/api/v1/signin', (c) => {
   return c.text('signin route');
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
