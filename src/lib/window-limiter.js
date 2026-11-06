export class WindowLimiter {
  #entries = new Map();

  constructor({ limit = 5, windowMs = 10_000, maxKeys = 10_000, clock = Date.now } = {}) {
    if (![limit, windowMs, maxKeys].every((value) => Number.isInteger(value) && value > 0)) {
      throw new TypeError('Os limites precisam ser inteiros positivos.');
    }
    Object.assign(this, { limit, windowMs, maxKeys, clock });
  }

  take(key) {
    const now = this.clock();
    if (this.#entries.size >= this.maxKeys) {
      for (const [id, entry] of this.#entries) {
        if (entry.until <= now) this.#entries.delete(id);
      }
    }
    let entry = this.#entries.get(key);
    if (!entry || entry.until <= now) {
      // Sob carga extrema, negar novas chaves é mais seguro que crescer sem limite.
      if (!entry && this.#entries.size >= this.maxKeys) {
        return { allowed: false, retryAfterMs: this.windowMs };
      }
      entry = { count: 0, until: now + this.windowMs };
      this.#entries.set(key, entry);
    }
    if (entry.count >= this.limit) {
      return { allowed: false, retryAfterMs: Math.max(1, entry.until - now) };
    }
    entry.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }
}
