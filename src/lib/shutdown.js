export function installShutdown({ logger, stop, timeoutMs = 10_000 }) {
  let stopping = false;
  const shutdown = async (signal, exitCode = 0) => {
    if (stopping) return;
    stopping = true;
    process.exitCode = exitCode;
    logger.info({ signal }, 'Encerrando conexões com segurança.');
    const timer = setTimeout(() => process.exit(1), timeoutMs);
    timer.unref();
    try {
      await stop();
    } catch (err) {
      logger.error({ err }, 'Não foi possível encerrar todas as conexões.');
      process.exitCode = 1;
    } finally {
      clearTimeout(timer);
      cleanup();
    }
  };
  const onTerm = () => void shutdown('SIGTERM');
  const onInt = () => void shutdown('SIGINT');
  const onException = (err) => {
    logger.fatal({ err }, 'Falha não recuperável.');
    void shutdown('fatal', 1);
  };
  function cleanup() {
    process.off('SIGTERM', onTerm);
    process.off('SIGINT', onInt);
    process.off('uncaughtException', onException);
    process.off('unhandledRejection', onException);
  }
  process.once('SIGTERM', onTerm);
  process.once('SIGINT', onInt);
  process.once('uncaughtException', onException);
  process.once('unhandledRejection', onException);
  return { shutdown, cleanup };
}
