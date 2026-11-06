import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('conexão exige aceite explícito e telefone válido no modo pairing', () => {
  assert.throws(() => loadConfig({}), /WHATSAPP_ENABLED/);
  const env = { WHATSAPP_ENABLED: 'true' };
  assert.equal(loadConfig(env).authMode, 'qr');
  assert.throws(() => loadConfig({ ...env, AUTH_MODE: 'pairing' }), /WHATSAPP_PHONE/);
  assert.throws(
    () => loadConfig({ ...env, AUTH_MODE: 'pairing', WHATSAPP_PHONE: '+5511999999999' }),
    /WHATSAPP_PHONE/,
  );
  assert.equal(
    loadConfig({ ...env, AUTH_MODE: 'pairing', WHATSAPP_PHONE: '5511999999999' }).authMode,
    'pairing',
  );
  assert.throws(() => loadConfig({ ...env, COMMAND_PREFIX: 'muito' }), /COMMAND_PREFIX/);
  assert.throws(() => loadConfig({ ...env, ALLOW_GROUPS: 'yes' }), /ALLOW_GROUPS/);
});
