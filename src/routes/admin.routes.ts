import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { badRequest, conflict, notFound } from '../lib/errors';
import { authenticate, requireRole } from '../middleware/auth';
import { slugify } from '../lib/slug';

const requireSuperAdmin = requireRole('SUPER_ADMIN');

export function adminRoutes(app: FastifyInstance) {
  app.register(async (adminApp) => {
    adminApp.addHook('preHandler', authenticate);

    // ===== Usuários (gestores de município + outros super admins) =====
    adminApp.get('/users', { preHandler: requireSuperAdmin }, async () => {
      const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          state: { select: { code: true, name: true } },
          municipality: { select: { name: true, slug: true } },
          createdAt: true,
        },
      });
      return { users };
    });

    adminApp.post('/users', { preHandler: requireSuperAdmin }, async (request) => {
      const body = request.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: 'SUPER_ADMIN' | 'GESTOR_MUNICIPIO';
        stateCode?: string;
        municipalitySlug?: string;
      };
      const name = body.name?.trim();
      const email = body.email?.trim().toLowerCase();
      const password = body.password ?? '';

      if (!name || name.length < 2) throw badRequest('Informe o nome.');
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest('E-mail inválido.');
      if (password.length < 6) throw badRequest('Senha deve ter ao menos 6 caracteres.');

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw conflict('Já existe um usuário com este e-mail.');

      let stateId: string | null = null;
      let municipalityId: string | null = null;

      if (body.role !== 'SUPER_ADMIN') {
        if (!body.stateCode) throw badRequest('Informe o Estado do gestor.');
        const state = await prisma.state.findUnique({ where: { code: body.stateCode.toUpperCase() } });
        if (!state) throw notFound('Estado não encontrado.');
        stateId = state.id;
        if (body.municipalitySlug) {
          const municipality = await prisma.municipality.findUnique({
            where: { stateId_slug: { stateId: state.id, slug: body.municipalitySlug } },
          });
          if (!municipality) throw notFound('Município não encontrado.');
          municipalityId = municipality.id;
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: body.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GESTOR_MUNICIPIO',
          stateId,
          municipalityId,
          active: true,
        },
      });
      return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    });

    adminApp.put('/users/:id', { preHandler: requireSuperAdmin }, async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        role?: 'SUPER_ADMIN' | 'GESTOR_MUNICIPIO';
        stateCode?: string;
        municipalitySlug?: string;
        password?: string;
        active?: boolean;
      };

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) throw notFound('Usuário não encontrado.');

      let data: Record<string, unknown> = {};
      if (body.name) data.name = body.name.trim();
      if (typeof body.active === 'boolean') data.active = body.active;
      if (body.password && body.password.length >= 6) {
        data.passwordHash = await bcrypt.hash(body.password, 10);
      }

      if (body.role) {
        if (body.role === 'SUPER_ADMIN') {
          data.role = 'SUPER_ADMIN';
          data.stateId = null;
          data.municipalityId = null;
        } else {
          data.role = 'GESTOR_MUNICIPIO';
          if (!body.stateCode) throw badRequest('Informe o Estado do gestor.');
          const state = await prisma.state.findUnique({ where: { code: body.stateCode.toUpperCase() } });
          if (!state) throw notFound('Estado não encontrado.');
          data.stateId = state.id;
          data.municipalityId = null;
          if (body.municipalitySlug) {
            const municipality = await prisma.municipality.findUnique({
              where: { stateId_slug: { stateId: state.id, slug: body.municipalitySlug } },
            });
            if (!municipality) throw notFound('Município não encontrado.');
            data.municipalityId = municipality.id;
          }
        }
      }

      const user = await prisma.user.update({ where: { id }, data });
      return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    });

    adminApp.delete('/users/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
      const { id } = request.params as { id: string };
      if (id === request.auth!.id) {
        reply.status(400).send({ error: 'Você não pode excluir a si mesmo.', code: 'BAD_REQUEST' });
        return;
      }
      await prisma.user.delete({ where: { id } });
      return { ok: true };
    });

    // ===== Estados =====
    adminApp.get('/states', async () => {
      const states = await prisma.state.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          slug: true,
          active: true,
          _count: { select: { municipalities: true, secretaries: true, evaluations: true, users: true } },
        },
      });
      return { states };
    });

    adminApp.post('/states', { preHandler: requireSuperAdmin }, async (request) => {
      const body = request.body as { code?: string; name?: string; active?: boolean };
      const code = body.code?.trim().toUpperCase();
      const name = body.name?.trim();
      if (!code || !/^[A-Z]{2}$/.test(code)) throw badRequest('Informe a UF (2 letras).');
      if (!name) throw badRequest('Informe o nome do Estado.');

      const slug = slugify(name);
      const existing = await prisma.state.findFirst({ where: { OR: [{ code }, { slug }] } });
      if (existing) throw conflict('Já existe um Estado com esta UF ou nome.');

      const state = await prisma.state.create({
        data: { code, name, slug, active: body.active ?? true },
      });
      return { state };
    });

    adminApp.put('/states/:id', { preHandler: requireSuperAdmin }, async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { name?: string; active?: boolean };
      const existing = await prisma.state.findUnique({ where: { id } });
      if (!existing) throw notFound('Estado não encontrado.');
      const state = await prisma.state.update({
        where: { id },
        data: {
          ...(body.name ? { name: body.name.trim() } : {}),
          ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
        },
      });
      return { state };
    });

    // ===== Municípios =====
    adminApp.get('/municipalities', async (request) => {
      const query = request.query as { stateCode?: string };
      const where = query.stateCode
        ? { state: { code: query.stateCode.toUpperCase() } }
        : undefined;
      const municipalities = await prisma.municipality.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          active: true,
          sortOrder: true,
          state: { select: { code: true, name: true } },
          _count: { select: { evaluations: true } },
        },
      });
      return { municipalities };
    });

    adminApp.post('/municipalities', { preHandler: requireSuperAdmin }, async (request) => {
      const body = request.body as { name?: string; stateCode?: string; sortOrder?: number; active?: boolean };
      const name = body.name?.trim();
      if (!name) throw badRequest('Informe o nome do município.');
      if (!body.stateCode) throw badRequest('Informe o Estado.');
      const state = await prisma.state.findUnique({ where: { code: body.stateCode.toUpperCase() } });
      if (!state) throw notFound('Estado não encontrado.');

      const slug = slugify(name);
      const existing = await prisma.municipality.findUnique({
        where: { stateId_slug: { stateId: state.id, slug } },
      });
      if (existing) throw conflict('Este município já existe neste Estado.');

      const municipality = await prisma.municipality.create({
        data: {
          name,
          slug,
          stateId: state.id,
          sortOrder: body.sortOrder ?? 0,
          active: body.active ?? true,
        },
      });
      return { municipality };
    });

    adminApp.put('/municipalities/:id', { preHandler: requireSuperAdmin }, async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { name?: string; sortOrder?: number; active?: boolean };
      const existing = await prisma.municipality.findUnique({ where: { id } });
      if (!existing) throw notFound('Município não encontrado.');
      const municipality = await prisma.municipality.update({
        where: { id },
        data: {
          ...(body.name ? { name: body.name.trim() } : {}),
          ...(typeof body.sortOrder === 'number' ? { sortOrder: body.sortOrder } : {}),
          ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
        },
      });
      return { municipality };
    });

    adminApp.delete('/municipalities/:id', { preHandler: requireSuperAdmin }, async (request) => {
      const { id } = request.params as { id: string };
      await prisma.municipality.delete({ where: { id } });
      return { ok: true };
    });

    // ===== Secretarias =====
    adminApp.get('/secretaries', async (request) => {
      const query = request.query as { stateCode?: string };
      const where = query.stateCode
        ? { state: { code: query.stateCode.toUpperCase() } }
        : undefined;
      const secretaries = await prisma.secretary.findMany({
        where,
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          emoji: true,
          order: true,
          active: true,
          state: { select: { code: true } },
          _count: { select: { evaluations: true } },
        },
      });
      return { secretaries };
    });

    adminApp.post('/secretaries', { preHandler: requireSuperAdmin }, async (request) => {
      const body = request.body as {
        name?: string;
        emoji?: string;
        order?: number;
        stateCode?: string;
        active?: boolean;
      };
      const name = body.name?.trim();
      if (!name) throw badRequest('Informe o nome da secretaria.');
      if (!body.stateCode) throw badRequest('Informe o Estado.');
      const state = await prisma.state.findUnique({ where: { code: body.stateCode.toUpperCase() } });
      if (!state) throw notFound('Estado não encontrado.');

      const existing = await prisma.secretary.findUnique({
        where: { stateId_name: { stateId: state.id, name } },
      });
      if (existing) throw conflict('Esta secretaria já existe neste Estado.');

      const secretary = await prisma.secretary.create({
        data: {
          name,
          emoji: body.emoji ?? null,
          order: body.order ?? 0,
          stateId: state.id,
          active: body.active ?? true,
        },
      });
      return { secretary };
    });

    adminApp.put('/secretaries/:id', { preHandler: requireSuperAdmin }, async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { name?: string; emoji?: string; order?: number; active?: boolean };
      const existing = await prisma.secretary.findUnique({ where: { id } });
      if (!existing) throw notFound('Secretaria não encontrada.');
      const secretary = await prisma.secretary.update({
        where: { id },
        data: {
          ...(body.name ? { name: body.name.trim() } : {}),
          ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
          ...(typeof body.order === 'number' ? { order: body.order } : {}),
          ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
        },
      });
      return { secretary };
    });

    adminApp.delete('/secretaries/:id', { preHandler: requireSuperAdmin }, async (request) => {
      const { id } = request.params as { id: string };
      await prisma.secretary.delete({ where: { id } });
      return { ok: true };
    });
  });
}