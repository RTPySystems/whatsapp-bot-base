import { loadConfig } from './config.js';
import { createLogger } from './lib/logger.js';
import { installShutdown } from './lib/shutdown.js';
import { startupError } from './lib/startup-error.js';
import { createRouter } from './handlers/router.js';
import { createConnection } from './connection/manager.js';

async function main() {
  const config = loadConfig();
  process.umask(0o077);
  const logger = createLogger(config.logLevel);
  let lifecycle;
  const connection = createConnection(config, logger, createRouter(config, logger), {
    onFatal: () => lifecycle.shutdown('connection', 1),
  });
  lifecycle = installShutdown({ logger, stop: connection.stop });
  await connection.start();
}

main().catch(startupError);
