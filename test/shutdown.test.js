import test from 'node:test';
import assert from 'node:assert/strict';
import { installShutdown } from '../src/lib/shutdown.js';

const logger = { info() {}, error() {}, fatal() {} };
test('shutdown é idempotente e remove os listeners', async () => {
  const before = process.listenerCount('SIGTERM');
  let stopped = 0;
  const lifecycle = installShutdown({
    logger,
    stop: async () => {
      stopped++;
    },
  });
  assert.equal(lifecycle.isStopping(), false);
  await lifecycle.shutdown('teste');
  await lifecycle.shutdown('teste');
  assert.equal(stopped, 1);
  assert.equal(lifecycle.isStopping(), true);
  assert.equal(process.listenerCount('SIGTERM'), before);
});
