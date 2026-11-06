import { DisconnectReason } from '@whiskeysockets/baileys';

const fatalReasons = new Set([
  DisconnectReason.loggedOut,
  DisconnectReason.badSession,
  DisconnectReason.connectionReplaced,
  DisconnectReason.multideviceMismatch,
  DisconnectReason.forbidden,
]);

export function reconnectPolicy(code, attempt, maxAttempts, random = Math.random) {
  if (fatalReasons.has(code) || attempt >= maxAttempts) return { retry: false, delayMs: 0 };
  const base =
    code === DisconnectReason.restartRequired ? 250 : Math.min(30_000, 1000 * 2 ** attempt);
  return { retry: true, delayMs: base + Math.floor(random() * 500) };
}
