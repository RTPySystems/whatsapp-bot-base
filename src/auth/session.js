import { mkdir, chmod } from 'node:fs/promises';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';

export async function loadSession(directory) {
  // Persistência local para uma única instância. Veja os limites no README.
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  return useMultiFileAuthState(directory);
}
