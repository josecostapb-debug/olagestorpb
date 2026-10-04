import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { badRequest } from '../lib/errors';

export function catalogRoutes(app: FastifyInstance) {
  // Lista os Estados ativos (multiestado)
  app.get('/states', async () => {
    const states = await prisma.state.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, slug: true },
    });
    return { states };
  });

  // Municípios de um Estado
  app.get('/states/:code/municipalities', async (request, reply) => {
    const { code } = request.params as { code: string };
    const state = await prisma.state.findUnique({ where: { code: code.toUpperCase() } });
    if (!state) {
      reply.status(404).send({ error: 'Estado não encontrado', code: 'NOT_FOUND' });
      return;
    }
    const municipalities = await prisma.municipality.findMany({
      where: { stateId: state.id, active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true },
    });
    return { state: { id: state.id, code: state.code, name: state.name, slug: state.slug }, municipalities };
  });

  // Secretarias de um Estado
  app.get('/states/:code/secretaries', async (request, reply) => {
    const { code } = request.params as { code: string };
    const state = await prisma.state.findUnique({ where: { code: code.toUpperCase() } });
    if (!state) {
      reply.status(404).send({ error: 'Estado não encontrado', code: 'NOT_FOUND' });
      return;
    }
    const secretaries = await prisma.secretary.findMany({
      where: { stateId: state.id, active: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, emoji: true },
    });
    return { state: { id: state.id, code: state.code, name: state.name }, secretaries };
  });

  // Validação auxiliar usada pelo POST de avaliação
  app.get('/meta', async () => {
    const states = await prisma.state.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        secretaries: {
          where: { active: true },
          orderBy: { order: 'asc' },
          select: { id: true, name: true, emoji: true },
        },
      },
    });
    if (states.length === 0) {
      throw badRequest('Nenhum Estado configurado. Rode o seed primeiro.');
    }
    return { states };
  });
}