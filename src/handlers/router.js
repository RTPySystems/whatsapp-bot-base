import { normalizeMessageContent } from '@whiskeysockets/baileys';
import { WindowLimiter } from '../lib/window-limiter.js';
import { createCommands } from '../commands/index.js';

export function parseCommand(text, prefix) {
  if (typeof text !== 'string' || text.length > 1000 || !text.startsWith(prefix)) return null;
  const [name, ...args] = text.slice(prefix.length).trim().split(/\s+/);
  if (!/^[a-z][a-z0-9_-]{0,31}$/i.test(name)) return null;
  return { name: name.toLowerCase(), args };
}

export function createRouter(
  config,
  logger,
  { clock = Date.now, commands = createCommands(config.prefix) } = {},
) {
  const limiter = new WindowLimiter({
    limit: config.rateLimitMax,
    windowMs: config.rateLimitWindowMs,
    clock,
  });
  const seen = new WindowLimiter({ limit: 1, windowMs: 300_000, maxKeys: 20_000, clock });
  return async (socket, message) => {
    const { key } = message;
    const jid = key?.remoteJid;
    if (!key?.id || !jid || key.fromMe) return;
    const group = jid.endsWith('@g.us');
    if (group && !config.allowGroups) return;
    if (!group && !jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@lid')) return;
    const content = normalizeMessageContent(message.message);
    const text = content?.conversation ?? content?.extendedTextMessage?.text;
    const parsed = parseCommand(text, config.prefix);
    if (!parsed) return;
    if (!seen.take(`${jid}:${key.id}`).allowed) return;
    // No v7, remetentes podem usar LID. O limite usa o identificador opaco, sem convertê-lo em telefone.
    const sender = group ? key.participant : jid;
    if (!sender || !limiter.take(sender).allowed) return;
    const command = commands.get(parsed.name);
    const reply = (body) => socket.sendMessage(jid, { text: body });
    try {
      if (!command) {
        await reply(`Não conheço esse comando. Use ${config.prefix}help.`);
        return;
      }
      await command.execute({ args: parsed.args, message, socket, reply, commands });
    } catch (err) {
      // Evitamos responder de novo após uma falha de envio: isso pode gerar duplicatas.
      logger.error({ err, command: parsed.name }, 'Falha ao executar comando.');
    }
  };
}
