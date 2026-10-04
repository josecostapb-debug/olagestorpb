import 'dotenv/config';
import { loadEnv } from './config/env';
import { buildApp } from './app';
import { prisma } from './lib/prisma';
import { ApiError } from './lib/errors';

async function bootstrap() {
  const env = loadEnv();

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[boot] Conexão com o banco OK.');
  } catch (error) {
    console.error('[boot] Falha ao conectar ao banco de dados:', error);
  }

  const app = buildApp();

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      reply.status(error.statusCode).send({ error: error.message, code: error.code });
      return;
    }
    request.log.error({ err: error }, 'erro não tratado');
    reply
      .status(500)
      .send({ error: 'Erro interno do servidor.', code: 'INTERNAL_ERROR' });
  });

  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
  } catch (error) {
    console.error('[boot] Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

bootstrap();