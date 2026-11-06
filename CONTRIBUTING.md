# Como contribuir

Obrigado por fortalecer esta base! Mudanças pequenas e bem explicadas são mais fáceis de revisar.

1. Abra uma issue descrevendo o problema, sem tokens, dados de clientes ou sessões.
2. Crie uma branch: `git switch -c feat/minha-melhoria`.
3. Instale com `npm ci` e escreva testes para o comportamento alterado.
4. Rode `npm run lint`, `npm run format:check`, `npm test` e `npm run test:startup`.
5. Abra um pull request com contexto, passos de teste e eventuais mudanças de configuração.

## Padrão do projeto

- JavaScript ESM, Node.js 24 LTS, funções pequenas e nomes que expliquem a intenção.
- Comentários em português quando explicarem uma decisão, não o óbvio.
- Commits no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).
- Nunca envie `.env`, credenciais, números de telefone, QR codes ou arquivos de autenticação.
- Não adicione disparos em massa, coleta de dados pessoais ou contorno de limites das plataformas.

## Segurança

Não publique vulnerabilidades ou credenciais em issues. Use o canal de contato disponível
em [rtcloud.com.br](https://rtcloud.com.br) para combinar um relato privado. Se uma chave
vazar, revogue-a na plataforma de origem antes de qualquer outra coisa.
