import test from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { createLogger } from '../src/lib/logger.js';

test('não expõe token nem URL de erro nos logs', () => {
  let output = '';
  const stream = new Writable({
    write(chunk, _, done) {
      output += chunk;
      done();
    },
  });
  const logger = createLogger('info', stream);
  logger.error({ token: 'segredo', err: new Error('https://api.example/botsegredo') }, 'Falha.');
  assert.doesNotMatch(output, /segredo/);
  assert.match(output, /Error/);
});
