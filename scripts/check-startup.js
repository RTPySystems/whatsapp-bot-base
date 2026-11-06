import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const env = { ...process.env };
for (const key of [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'TELEGRAM_BOT_TOKEN',
  'WHATSAPP_ENABLED',
]) {
  delete env[key];
}
const result = spawnSync(process.execPath, ['src/index.js'], {
  env,
  encoding: 'utf8',
  timeout: 8_000,
});
assert.ifError(result.error);
assert.equal(result.status, 1, 'Sem credenciais, deve encerrar com código 1.');
assert.match(result.stdout + result.stderr, /Configure|WHATSAPP_ENABLED/);
assert.doesNotMatch(result.stdout + result.stderr, /at file:|UnhandledPromiseRejection/);
console.log('Inicialização sem credenciais: erro claro, sem rede e sem stack exposta.');
