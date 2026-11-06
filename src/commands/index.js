export function createCommands(prefix) {
  return new Map([
    [
      'ping',
      {
        description: 'Conferir se o bot está online',
        execute: async ({ reply }) => reply('Pong! Tudo certo por aqui.'),
      },
    ],
    [
      'help',
      {
        description: 'Mostrar os comandos disponíveis',
        execute: async ({ reply, commands }) =>
          reply(
            [
              '*Central de comandos*',
              ...[...commands].map(
                ([name, command]) => `${prefix}${name} — ${command.description}`,
              ),
            ].join('\n'),
          ),
      },
    ],
    [
      'about',
      {
        description: 'Conhecer o projeto',
        execute: async ({ reply }) =>
          reply('Base de bot por RTPySystems • RTCloud\nhttps://rtcloud.com.br'),
      },
    ],
  ]);
}
