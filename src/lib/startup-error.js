import { ConfigError } from './env.js';
import { createLogger } from './logger.js';

export function startupError(err) {
  const logger = createLogger();
  if (err instanceof ConfigError) logger.error(err.message);
  else logger.error({ err }, 'Falha ao iniciar. Confira credenciais, conexão e a documentação.');
  process.exitCode = 1;
}
