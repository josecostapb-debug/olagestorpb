import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '@prisma/client';
import { unauthorized } from '../lib/errors';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  stateId?: string | null;
  municipalityId?: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthUser;
  }
}

export function authenticate(request: FastifyRequest, reply: FastifyReply) {
  let token: string | undefined;
  const cookieToken = request.cookies?.AUTH_COOKIE;
  if (cookieToken) {
    token = cookieToken;
  } else {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      token = header.slice(7);
    }
  }
  if (!token) {
    throw unauthorized('Faça login para continuar.');
  }
  try {
    const payload = request.server.jwt.verify<{
      sub: string;
      email: string;
      role: UserRole;
      stateId?: string | null;
      municipalityId?: string | null;
    }>(token);
    request.auth = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      stateId: payload.stateId,
      municipalityId: payload.municipalityId,
    };
  } catch {
    throw unauthorized('Sessão expirada. Faça login novamente.');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (request: FastifyRequest) => {
    if (!request.auth) {
      throw unauthorized('Faça login para continuar.');
    }
    if (!roles.includes(request.auth.role)) {
      const error = unauthorized('Você não tem permissão para acessar este recurso.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }
  };
}