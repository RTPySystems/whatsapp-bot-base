export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function required(env, key, pattern) {
  const value = env[key]?.trim();
  if (!value || (pattern && !pattern.test(value))) {
    throw new ConfigError(`Configure ${key} corretamente no .env (consulte .env.example).`);
  }
  return value;
}

export function integer(env, key, fallback, min = 1, max = 1_000_000) {
  const raw = env[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new ConfigError(`${key} deve ser um inteiro entre ${min} e ${max}.`);
  }
  return value;
}

export function logLevel(env) {
  const level = env.LOG_LEVEL || 'info';
  if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'].includes(level)) {
    throw new ConfigError('LOG_LEVEL inválido. Use info, warn, error, debug, trace, fatal ou silent.');
  }
  return level;
}
