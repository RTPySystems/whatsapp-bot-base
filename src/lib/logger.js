import pino from 'pino';

export function createLogger(level = 'info', destination) {
  return pino(
    {
      level,
      base: undefined,
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: ['token', 'password', 'authorization', 'session', 'phone', 'qr', 'code'],
      // Erros de rede podem trazer tokens na URL. Não serializamos mensagem ou stack.
      serializers: { err: (err) => ({ type: err?.name || 'Error' }) },
    },
    destination,
  );
}
