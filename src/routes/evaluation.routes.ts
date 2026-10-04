import type { FastifyInstance } from 'fastify';
import { Prisma, type FeedbackType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { badRequest, notFound } from '../lib/errors';
import { authenticate } from '../middleware/auth';
import { publicWriteLimiter } from '../lib/rate-limit';

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FEEDBACK_TYPES: FeedbackType[] = ['RECLAMACAO', 'SUGESTAO', 'SOLICITACAO', 'ELOGIO'];

interface CreateEvaluationBody {
  stateCode?: string;
  scope?: 'MUNICIPIO' | 'ESTADO';
  municipalitySlug?: string;
  secretaryId?: string;
  citizenName?: string;
  citizenCpf?: string;
  citizenWhatsapp?: string;
  bairro?: string;
  locationType?: 'URBANA' | 'RURAL';
  rating?: number;
  feedbackType?: FeedbackType;
  comment?: string;
}

function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, '');
  let w = digits;
  if (w.startsWith('0')) w = w.slice(1);
  if (w.length === 10) w = `55${w}`;
  if (w.length === 11) w = `55${w}`;
  return w;
}

export function evaluationRoutes(app: FastifyInstance) {
  // Cidadão: envia a avaliação
  app.post('/evaluations', { preHandler: [publicWriteLimiter] }, async (request) => {
    const body = request.body as CreateEvaluationBody | null;

    if (!body || typeof body !== 'object') throw badRequest('Dados inválidos.');

    const stateCode = body.stateCode?.trim().toUpperCase();
    if (!stateCode) throw badRequest('Informe o Estado.');
    const state = await prisma.state.findUnique({ where: { code: stateCode } });
    if (!state) throw notFound('Estado não encontrado.');

    const scope = body.scope === 'ESTADO' ? 'ESTADO' : 'MUNICIPIO';

    let municipalityId: string | null = null;
    if (scope === 'MUNICIPIO') {
      if (!body.municipalitySlug) throw badRequest('Informe o município.');
      const municipality = await prisma.municipality.findUnique({
        where: { stateId_slug: { stateId: state.id, slug: body.municipalitySlug } },
      });
      if (!municipality) throw notFound('Município não encontrado.');
      municipalityId = municipality.id;
    }

    let secretaryId: string | null = null;
    if (body.secretaryId) {
      const secretary = await prisma.secretary.findUnique({ where: { id: body.secretaryId } });
      if (!secretary || secretary.stateId !== state.id) throw notFound('Secretaria não encontrada.');
      secretaryId = secretary.id;
    }

    const name = body.citizenName?.trim();
    const whatsapp = normalizeWhatsapp(body.citizenWhatsapp ?? '');
    const bairro = body.bairro?.trim();
    const comment = body.comment?.trim();

    if (!name || name.length < 2) throw badRequest('Informe seu nome completo.');
    if (!/^\d{10,13}$/.test(whatsapp)) {
      throw badRequest('Informe um número de WhatsApp válido (com DDD).');
    }
    if (!bairro) throw badRequest('Informe o bairro.');
    if (!comment || comment.length < 5) throw badRequest('Conte sua avaliação (mínimo 5 caracteres).');

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || !RATINGS.includes(rating)) {
      throw badRequest('Nota deve ser um número inteiro de 1 a 10.');
    }
    const feedbackType = body.feedbackType ?? 'RECLAMACAO';
    if (!FEEDBACK_TYPES.includes(feedbackType)) throw badRequest('Tipo de feedback inválido.');
    const locationType = body.locationType ?? 'URBANA';
    if (locationType !== 'URBANA' && locationType !== 'RURAL') {
      throw badRequest('Localização inválida.');
    }

    const citizenCpfHash = body.citizenCpf?.trim()
      ? Buffer.from(body.citizenCpf.replace(/\D/g, ''), 'utf8').toString('base64')
      : null;

    const evaluation = await prisma.evaluation.create({
      data: {
        scope,
        stateId: state.id,
        municipalityId,
        secretaryId,
        citizenName: name,
        citizenCpfHash,
        citizenWhatsapp: whatsapp,
        bairro,
        locationType,
        rating,
        feedbackType,
        comment,
      },
      select: {
        id: true,
        createdAt: true,
        rating: true,
        comment: true,
      },
    });

    return { evaluation, message: 'Avaliação registrada. Obrigado por participar!' };
  });

  // Lista de avaliações do painel
  app.get('/evaluations', { preHandler: authenticate }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.auth!.id } });
    if (!user) throw notFound('Usuário não encontrado.');
    if (user.role === 'GESTOR_MUNICIPIO' && !user.municipalityId) {
      throw badRequest('Usuário de município sem município vinculado.');
    }

    const query = request.query as {
      stateId?: string;
      municipalityId?: string;
      feedbackType?: FeedbackType;
      page?: string;
      pageSize?: string;
    };

    const where: Prisma.EvaluationWhereInput = {};
    if (user.role === 'GESTOR_MUNICIPIO' && user.municipalityId) {
      where.municipalityId = user.municipalityId;
    } else {
      if (query.stateId) where.stateId = query.stateId;
      if (query.municipalityId) where.municipalityId = query.municipalityId;
    }
    if (query.feedbackType && FEEDBACK_TYPES.includes(query.feedbackType)) {
      where.feedbackType = query.feedbackType;
    }

    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(50, Math.max(10, Number(query.pageSize ?? 20) || 20));

    const [total, evaluations] = await Promise.all([
      prisma.evaluation.count({ where }),
      prisma.evaluation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          scope: true,
          rating: true,
          feedbackType: true,
          comment: true,
          bairro: true,
          locationType: true,
          citizenName: true,
          citizenWhatsapp: true,
          createdAt: true,
          municipality: { select: { name: true } },
          secretary: { select: { name: true, emoji: true } },
        },
      }),
    ]);

    return {
      evaluations,
      pagination: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  });

  // Estatísticas do painel (velocímetro + secretarias + tipos)
  app.get('/evaluations/stats', { preHandler: authenticate }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.auth!.id } });
    if (!user) throw notFound('Usuário não encontrado.');

    const query = request.query as {
      stateId?: string;
      municipalityId?: string;
    };

    const where: Prisma.EvaluationWhereInput = {};
    if (user.role === 'GESTOR_MUNICIPIO' && user.municipalityId) {
      where.municipalityId = user.municipalityId;
    } else {
      if (query.stateId) where.stateId = query.stateId;
      if (query.municipalityId) where.municipalityId = query.municipalityId;
    }

    const [total, ratings, byType, bySecretary, byLocation] = await Promise.all([
      prisma.evaluation.count({ where }),
      prisma.evaluation.aggregate({ where, _avg: { rating: true }, _min: { createdAt: true } }),
      prisma.evaluation.groupBy({
        where,
        by: ['feedbackType'],
        _count: { _all: true },
      }),
      prisma.evaluation.groupBy({
        where: { ...where, secretaryId: { not: null } },
        by: ['secretaryId'],
        _count: { _all: true },
        _avg: { rating: true },
      }),
      prisma.evaluation.groupBy({
        where,
        by: ['locationType'],
        _count: { _all: true },
      }),
    ]);

    const secretaryIds = bySecretary.map((s) => s.secretaryId as string);
    const secretaries = secretaryIds.length
      ? await prisma.secretary.findMany({
          where: { id: { in: secretaryIds } },
          select: { id: true, name: true, emoji: true },
        })
      : [];
    const secretaryMap = new Map(secretaries.map((s) => [s.id, s]));

    const average = total > 0 ? Number((ratings._avg.rating ?? 0).toFixed(1)) : 0;
    const percentage = Math.round(average * 10);

    return {
      total,
      average,
      percentage,
      firstEvaluationAt: ratings._min.createdAt,
      byType: {
        RECLAMACAO: 0,
        SUGESTAO: 0,
        SOLICITACAO: 0,
        ELOGIO: 0,
        ...Object.fromEntries(byType.map((t) => [t.feedbackType, t._count._all])),
      },
      byLocation: Object.fromEntries(byLocation.map((l) => [l.locationType, l._count._all])),
      bySecretary: bySecretary.map((s) => {
        const sec = secretaryMap.get(s.secretaryId as string);
        return {
          secretaryId: s.secretaryId,
          name: sec?.name ?? 'Sem secretaria',
          emoji: sec?.emoji ?? null,
          count: s._count._all,
          average: Number((s._avg.rating ?? 0).toFixed(1)),
        };
      }),
    };
  });

  // Detalhe de uma avaliação (para responder via WhatsApp)
  app.get('/evaluations/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        municipality: { select: { name: true, slug: true } },
        secretary: { select: { name: true, emoji: true } },
        state: { select: { code: true, name: true } },
      },
    });
    if (!evaluation) {
      reply.status(404).send({ error: 'Avaliação não encontrada', code: 'NOT_FOUND' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: request.auth!.id } });
    if (user?.role === 'GESTOR_MUNICIPIO' && evaluation.municipalityId !== user.municipalityId) {
      reply.status(403).send({ error: 'Sem permissão', code: 'FORBIDDEN' });
      return;
    }
    return { evaluation };
  });
}