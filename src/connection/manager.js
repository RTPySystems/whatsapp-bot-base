import makeWASocket, { Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { loadSession } from '../auth/session.js';
import { reconnectPolicy } from './policy.js';

export function createConnection(
  config,
  logger,
  route,
  {
    makeSocket = makeWASocket,
    loadAuth = loadSession,
    renderQr = (qr) => qrcode.generate(qr, { small: true }),
    showPairingCode = (code) => console.log(`Código de pareamento (privado): ${code}`),
    schedule = setTimeout,
    cancel = clearTimeout,
    onFatal = () => {
      process.exitCode = 1;
    },
  } = {},
) {
  let socket;
  let timer;
  let stopped = false;
  let attempts = 0;
  let queue = Promise.resolve();
  let saves = Promise.resolve();
  let pending = 0;

  function retire(current) {
    current.ev.removeAllListeners('connection.update');
    current.ev.removeAllListeners('messages.upsert');
    current.ev.removeAllListeners('creds.update');
    current.end(new Error('Conexão encerrada localmente.'));
  }

  async function fail(err) {
    logger.error({ err }, 'Conexão interrompida. Confira sessão, permissões e conectividade.');
    await stop();
    await onFatal();
  }

  async function connect() {
    if (stopped) return;
    try {
      await saves;
      const { state, saveCreds } = await loadAuth(config.sessionDir);
      if (stopped) return;
      const current = makeSocket({
        auth: state,
        // Os logs internos podem conter dados pessoais. Só os logs da aplicação ficam ativos.
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });
      socket = current;
      let pairingRequested = false;
      current.ev.on('creds.update', () => {
        saves = saves.then(() => saveCreds());
        saves.catch((err) => void fail(err));
      });
      current.ev.on('messages.upsert', ({ type, messages }) => {
        if (stopped || socket !== current || type !== 'notify') return;
        for (const message of messages) {
          if (pending >= 100) {
            logger.warn('Fila cheia; mensagem descartada para proteger o processo.');
            break;
          }
          pending += 1;
          queue = queue
            .then(async () => {
              if (!stopped && socket === current) await route(current, message);
            })
            .catch((err) => logger.error({ err }, 'Falha no roteador.'))
            .finally(() => {
              pending -= 1;
            });
        }
      });
      current.ev.on('connection.update', (update) => {
        void handleUpdate(current, update).catch((err) => fail(err));
      });
      async function handleUpdate(current, { connection, qr, lastDisconnect }) {
        if (stopped || socket !== current) return;
        if (qr && !state.creds.registered) {
          if (config.authMode === 'qr') renderQr(qr);
          else if (!pairingRequested) {
            pairingRequested = true;
            const code = await current.requestPairingCode(config.phone);
            if (!stopped && socket === current) showPairingCode(code);
          }
        }
        if (connection === 'open') {
          attempts = 0;
          logger.info('WhatsApp conectado. Aguardando comandos.');
        }
        if (connection === 'close') {
          const code = lastDisconnect?.error?.output?.statusCode;
          const policy = reconnectPolicy(code, attempts, config.reconnectMaxAttempts);
          retire(current);
          socket = undefined;
          if (!policy.retry) {
            logger.error(
              { status: code },
              'Sessão inválida, substituída ou limite de tentativas atingido. Reautentique manualmente se necessário.',
            );
            stopped = true;
            await onFatal();
            return;
          }
          attempts += 1;
          logger.warn(
            { attempt: attempts, delayMs: policy.delayMs },
            'Reconectando com espera progressiva.',
          );
          timer = schedule(() => {
            timer = undefined;
            void connect();
          }, policy.delayMs);
        }
      }
    } catch (err) {
      await fail(err);
    }
  }

  async function stop() {
    stopped = true;
    if (timer) cancel(timer);
    timer = undefined;
    if (socket) {
      const current = socket;
      socket = undefined;
      retire(current);
    }
    await Promise.allSettled([queue, saves]);
  }

  return { start: connect, stop };
}
