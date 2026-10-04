import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { badRequest, unauthorized } from '../lib/errors';
import { authenticate } from '../middleware/auth';

const AUTH_COOKIE = 'AUTH_COOKIE';

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  stateId: string | null;
  municipalityId: string | null;
  municipality?: { name: string; slug: string } | null;
  state?: { code: string; name: string } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    stateId: user.stateId,
    municipalityId: user.municipalityId,
    municipality: user.municipality ? { name: user.municipality.name, slug: user.municipality.slug } : null,
    state: user.state ? { code: user.state.code, name: user.state.name } : null,
  };
}

export function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const { email, password } = (request.body ?? {}) as { email?: string; password?: string };

    if (!email || !password) {
      throw badRequest('Informe e-mail e senha.');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        municipality: { select: { name: true, slug: true } },
        state: { select: { code: true, name: true } },
      },
    });

    if (!user || !user.active) {
      throw unauthorized('Credenciais inválidas.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw unauthorized('Credenciais inválidas.');
    }

    const token = request.server.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      stateId: user.stateId,
      municipalityId: user.municipalityId,
    });

    reply.setCookie(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      // 7 dias por padrão (mesma janela do JWT)
      maxAge: 60 * 60 * 24 * 7,
    });

    return { user: sanitizeUser(user) };
  });

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie(AUTH_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/me', { preHandler: authenticate }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.id },
      include: {
        municipality: { select: { name: true, slug: true } },
        state: { select: { code: true, name: true } },
      },
    });
    if (!user) throw unauthorized('Usuário não encontrado.');
    return { user: sanitizeUser(user) };
  });
}