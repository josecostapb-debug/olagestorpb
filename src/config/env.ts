export function loadEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'] as const;
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Variável de ambiente ausente: ${key}. Copie .env.example para .env e configure.`);
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const corsVar = process.env.CORS_ORIGIN;
  const corsSetExplicitly = corsVar !== undefined && corsVar.trim() !== '';
  const corsOrigin = corsSetExplicitly
    ? corsVar!.split(',').map((s) => s.trim()).filter(Boolean)
    : isProduction ? [] : ['*'];

  if (isProduction && corsSetExplicitly && corsOrigin.length === 1 && corsOrigin[0] === '*') {
    throw new Error('CORS_ORIGIN não pode ser "*" em produção.');
  }

  return {
    databaseUrl: process.env.DATABASE_URL as string,
    jwtSecret: process.env.JWT_SECRET as string,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    port: Number(process.env.PORT ?? 3000),
    corsOrigin,
    appUrl: process.env.APP_URL ?? 'http://localhost:5173',
    isProduction,
  };
}

export type Env = ReturnType<typeof loadEnv>;