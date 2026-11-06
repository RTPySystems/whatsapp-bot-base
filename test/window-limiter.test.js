import test from 'node:test';
import assert from 'node:assert/strict';
import { WindowLimiter } from '../src/lib/window-limiter.js';

test('limita por chave e libera depois da janela', () => {
  let now = 0;
  const limiter = new WindowLimiter({ limit: 2, windowMs: 100, clock: () => now });
  assert.equal(limiter.take('a').allowed, true);
  assert.equal(limiter.take('a').allowed, true);
  assert.deepEqual(limiter.take('a'), { allowed: false, retryAfterMs: 100 });
  assert.equal(limiter.take('b').allowed, true);
  now = 100;
  assert.equal(limiter.take('a').allowed, true);
});

test('não cresce sem limite e reaproveita entradas expiradas', () => {
  let now = 0;
  const limiter = new WindowLimiter({ maxKeys: 1, windowMs: 100, clock: () => now });
  assert.equal(limiter.take('a').allowed, true);
  assert.equal(limiter.take('b').allowed, false);
  now = 101;
  assert.equal(limiter.take('b').allowed, true);
  assert.throws(() => new WindowLimiter({ limit: 0 }));
});
