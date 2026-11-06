import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { setImmediate } from 'node:timers/promises';
import { DisconnectReason } from '@whiskeysockets/baileys';
import { reconnectPolicy } from '../src/connection/policy.js';
import { createConnection } from '../src/connection/manager.js';
import { loadConfig } from '../src/config.js';

const logger = { info() {}, warn() {}, error() {} };
const config = loadConfig({ WHATSAPP_ENABLED: 'true' });

function setup(extra = {}, configExtra = {}) {
  const sockets = [];
  let saved = 0;
  let fatal = 0;
  const manager = createConnection({ ...config, ...configExtra }, logger, async () => {}, {
    makeSocket: () => {
      const socket = {
        ev: new EventEmitter(),
        end() {},
        requestPairingCode: async () => '00000000',
      };
      sockets.push(socket);
      return socket;
    },
    loadAuth: async () => ({
      state: { creds: { registered: false } },
      saveCreds: async () => {
        saved++;
      },
    }),
    renderQr() {},
    showPairingCode() {},
    onFatal: () => {
      fatal++;
    },
    ...extra,
  });
  return {
    manager,
    sockets,
    get saved() {
      return saved;
    },
    get fatal() {
      return fatal;
    },
  };
}

test('política limita tentativas, aplica backoff e não reconecta sessão revogada', () => {
  assert.equal(reconnectPolicy(DisconnectReason.loggedOut, 0, 8).retry, false);
  assert.equal(reconnectPolicy(DisconnectReason.connectionReplaced, 0, 8).retry, false);
  assert.equal(reconnectPolicy(undefined, 8, 8).retry, false);
  assert.equal(reconnectPolicy(undefined, 3, 8, () => 0).delayMs, 8000);
  assert.equal(reconnectPolicy(DisconnectReason.restartRequired, 0, 8, () => 0).delayMs, 250);
});

test('persiste credenciais e encerra sem fazer logout', async () => {
  const ctx = setup();
  await ctx.manager.start();
  ctx.sockets[0].ev.emit('creds.update', {});
  await setImmediate();
  assert.equal(ctx.saved, 1);
  await ctx.manager.stop();
  assert.equal(ctx.sockets[0].ev.listenerCount('connection.update'), 0);
});

test('código de pareamento é solicitado uma vez após QR', async () => {
  const shown = [];
  const ctx = setup(
    { showPairingCode: (code) => shown.push(code) },
    { authMode: 'pairing', phone: '5511999999999' },
  );
  await ctx.manager.start();
  ctx.sockets[0].ev.emit('connection.update', { qr: 'primeiro' });
  ctx.sockets[0].ev.emit('connection.update', { qr: 'segundo' });
  await setImmediate();
  assert.deepEqual(shown, ['00000000']);
  await ctx.manager.stop();
});

test('agendamento é cancelado no shutdown', async () => {
  let canceled = false;
  const ctx = setup({
    schedule: () => 123,
    cancel: () => {
      canceled = true;
    },
  });
  await ctx.manager.start();
  ctx.sockets[0].ev.emit('connection.update', { connection: 'close' });
  await setImmediate();
  await ctx.manager.stop();
  assert.equal(canceled, true);
});

test('logout é fatal e não apaga a sessão automaticamente', async () => {
  const ctx = setup();
  await ctx.manager.start();
  ctx.sockets[0].ev.emit('connection.update', {
    connection: 'close',
    lastDisconnect: { error: { output: { statusCode: DisconnectReason.loggedOut } } },
  });
  await setImmediate();
  assert.equal(ctx.fatal, 1);
  assert.equal(ctx.sockets.length, 1);
  await ctx.manager.stop();
});
