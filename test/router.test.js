import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { createRouter, parseCommand } from '../src/handlers/router.js';

const logger = { error() {} };
const config = loadConfig({ WHATSAPP_ENABLED: 'true' });
const message = (id, text, extra = {}) => ({
  key: { id, remoteJid: '123@lid', fromMe: false, ...extra },
  message: { conversation: text },
});
function setup(options = {}) {
  const sent = [];
  return {
    route: createRouter({ ...config, ...options }, logger),
    socket: {
      sendMessage: async (jid, payload) => {
        sent.push({ jid, ...payload });
      },
    },
    sent,
  };
}

test('parser extrai argumentos e recusa texto longo ou sem prefixo', () => {
  assert.deepEqual(parseCommand('!PING agora', '!'), { name: 'ping', args: ['agora'] });
  assert.equal(parseCommand('oi', '!'), null);
  assert.equal(parseCommand('!', '!'), null);
  assert.equal(parseCommand('!' + 'x'.repeat(1001), '!'), null);
});

test('responde ping apenas uma vez por ID e aceita LID', async () => {
  const { route, socket, sent } = setup();
  await route(socket, message('1', '!ping'));
  await route(socket, message('1', '!ping'));
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /Pong/);
});

test('ignora mensagens próprias, status e grupos por padrão', async () => {
  const { route, socket, sent } = setup();
  await route(socket, message('1', '!ping', { fromMe: true }));
  await route(socket, message('2', '!ping', { remoteJid: 'status@broadcast' }));
  await route(socket, message('3', '!ping', { remoteJid: '123@g.us', participant: '456@lid' }));
  assert.equal(sent.length, 0);
});

test('limita spam por remetente e não por grupo', async () => {
  const { route, socket, sent } = setup({ rateLimitMax: 1, allowGroups: true });
  await route(socket, message('1', '!ping', { remoteJid: '123@g.us', participant: '456@lid' }));
  await route(socket, message('2', '!ping', { remoteJid: '123@g.us', participant: '456@lid' }));
  await route(socket, message('3', '!ping', { remoteJid: '123@g.us', participant: '789@lid' }));
  assert.equal(sent.length, 2);
});

test('responde ajuda, sobre e comando desconhecido', async () => {
  const { route, socket, sent } = setup();
  for (const [i, cmd] of ['!help', '!about', '!inexistente'].entries())
    await route(socket, message(String(i), cmd));
  assert.match(sent[0].text, /Central/);
  assert.match(sent[1].text, /RTPySystems/);
  assert.match(sent[2].text, /Não conheço/);
});

test('falha de envio é capturada sem reenvio automático', async () => {
  const { route } = setup();
  let calls = 0;
  await route(
    {
      sendMessage: async () => {
        calls++;
        throw new Error('offline');
      },
    },
    message('1', '!ping'),
  );
  assert.equal(calls, 1);
});
