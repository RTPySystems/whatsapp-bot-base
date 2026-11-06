import { ConfigError, integer, logLevel, required } from './lib/env.js';

export function loadConfig(env = process.env) {
  if (env.WHATSAPP_ENABLED !== 'true') {
    throw new ConfigError(
      'WHATSAPP_ENABLED está desativado. Leia o README e defina true para conectar.',
    );
  }
  const authMode = env.AUTH_MODE || 'qr';
  if (!['qr', 'pairing'].includes(authMode))
    throw new ConfigError('AUTH_MODE deve ser qr ou pairing.');
  const phone =
    authMode === 'pairing' ? required(env, 'WHATSAPP_PHONE', /^[1-9]\d{7,14}$/) : undefined;
  const prefix = env.COMMAND_PREFIX || '!';
  if (prefix.length > 3 || /\s/.test(prefix))
    throw new ConfigError('COMMAND_PREFIX deve ter de 1 a 3 caracteres sem espaços.');
  const sessionDir = env.SESSION_DIR || './data/session';
  if (!sessionDir.trim()) throw new ConfigError('SESSION_DIR não pode ficar em branco.');
  if (env.ALLOW_GROUPS && !['true', 'false'].includes(env.ALLOW_GROUPS)) {
    throw new ConfigError('ALLOW_GROUPS deve ser true ou false.');
  }
  return {
    authMode,
    phone,
    prefix,
    sessionDir,
    allowGroups: env.ALLOW_GROUPS === 'true',
    rateLimitMax: integer(env, 'RATE_LIMIT_MAX', 4, 1, 100),
    rateLimitWindowMs: integer(env, 'RATE_LIMIT_WINDOW_MS', 10_000, 1000, 3_600_000),
    reconnectMaxAttempts: integer(env, 'RECONNECT_MAX_ATTEMPTS', 8, 1, 20),
    logLevel: logLevel(env),
  };
}
