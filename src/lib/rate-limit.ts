import type { FastifyReply, FastifyRequest } from 'fastify';

interface WindowState {
  timestamps: number[];
}

const buckets = new Map<string, WindowState>();

function prune(state: WindowState, windowMs: number) {
  const now = Date.now();
  const cutoff = now - windowMs;
  const kept = state.timestamps.filter((t) => t > cutoff);
  const pruned = kept.length !== state.timestamps.length;
  state.timestamps = kept;
  if (pruned && state.timestamps.length === 0) {
    for (const [key, value] of buckets.entries()) {
      if (value === state) buckets.delete(key);
    }
  }
}

export function rateLimitMiddleware(
  max: number,
  windowMs: number,
): (req: FastifyRequest, reply: FastifyReply) => void {
  return (req, reply) => {
    const routePath = req.routeOptions?.url ?? req.raw.url ?? '';
    const key = `${req.ip}#${routePath}`;
    const state = buckets.get(key) ?? { timestamps: [] };
    prune(state, windowMs);
    if (state.timestamps.length >= max) {
      const oldest = state.timestamps[0] ?? Date.now();
      const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - Date.now()) / 1000));
      reply.header('Retry-After', String(retryAfter));
      reply
        .status(429)
        .send({ error: 'Muitas requisições. Aguarde alguns instantes e tente novamente.', code: 'RATE_LIMITED' });
      return;
    }
    state.timestamps.push(Date.now());
    buckets.set(key, state);
  };
}

export const publicWriteLimiter = rateLimitMiddleware(10, 60_000);
export const generalLimiter = rateLimitMiddleware(120, 60_000);