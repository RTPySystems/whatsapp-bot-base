import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSession } from '../src/auth/session.js';

test('sessão persiste credenciais e mantém diretório privado', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rtbot-session-'));
  try {
    const first = await loadSession(directory);
    await first.saveCreds();
    const second = await loadSession(directory);
    assert.deepEqual(second.state.creds.noiseKey, first.state.creds.noiseKey);
    assert.equal((await stat(directory)).mode & 0o777, 0o700);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
