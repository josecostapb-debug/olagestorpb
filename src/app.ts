import Fastify, { type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from './config/env';
import { generalLimiter } from './lib/rate-limit';
import { authRoutes } from './routes/auth.routes';
import { catalogRoutes } from './routes/catalog.routes';
import { evaluationRoutes } from './routes/evaluation.routes';
import { adminRoutes } from './routes/admin.routes';

export function buildApp(options: FastifyServerOptions = {}) {
  const env = loadEnv();
  const app = Fastify({ logger: true, ...options });

  app.register(helmet);
  app.register(cors, {
    origin: env.corsOrigin.length === 0 ? true : env.corsOrigin,
    credentials: true,
  });
  app.register(cookie);
  app.register(jwt, {
    secret: env.jwtSecret,
    sign: { expiresIn: env.jwtExpiresIn },
    cookie: {
      cookieName: 'AUTH_COOKIE',
      signed: false,
    },
  });

  app.addHook('onRequest', (request, reply, done) => {
    if (request.raw.url?.startsWith('/api')) {
      generalLimiter(request, reply);
    }
    done();
  });

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(catalogRoutes, { prefix: '/api' });
  app.register(evaluationRoutes, { prefix: '/api' });
  app.register(adminRoutes, { prefix: '/api/admin' });

  app.get('/api/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // Frontend estático (dist/public dentro de dist/index.js)
  const candidates = [
    path.join(process.cwd(), 'dist', 'public'),
    path.join(__dirname, 'public'),
    path.join(process.cwd(), 'public'),
  ];
  const publicDir = candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')));

  if (publicDir) {
    app.register(fastifyStatic, {
      root: publicDir,
      prefix: '/',
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api/')) {
        reply.status(404).send({ error: 'Recurso não encontrado', code: 'NOT_FOUND' });
        return;
      }
      reply.type('text/html').send(fs.readFileSync(path.join(publicDir, 'index.html')));
    });
  }

  return app;
}