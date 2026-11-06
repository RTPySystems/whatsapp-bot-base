# Operação e diagnóstico

## Sessão e dados persistentes

A pasta `SESSION_DIR` contém chaves privadas de longa duração. O processo usa `umask 0077` e cria a pasta com permissão `0700`. Não monte a sessão em armazenamento público, não faça commit e não envie a pasta para suporte. Configure um volume persistente e backups criptografados sob seu controle.

`useMultiFileAuthState` grava os dados de `creds.update` e mantém o Signal key store. É um adaptador de desenvolvimento. Para produção, substitua `src/auth/session.js` por um adaptador de banco que preserve `creds` e `keys` de forma consistente, conforme a documentação oficial do Baileys.

## Desconectou e não voltou

Logout, sessão inválida, conexão substituída e incompatibilidade entre dispositivos exigem intervenção. O bot não apaga credenciais nem inicia loop infinito. Interrompa o processo, confira os aparelhos conectados e guarde uma cópia privada da sessão antes de decidir reautenticar. Não rode duas instâncias usando a mesma pasta.

Para falhas transitórias, o bot tenta até `RECONNECT_MAX_ATTEMPTS`, com espera exponencial limitada a 30 segundos mais jitter. O contador reinicia quando a conexão abre. Na plataforma de hospedagem, evite política de reinício sem limite após falhas de autenticação.

## Não responde ao próprio !ping

Mensagens `fromMe` são ignoradas para evitar loops. Teste a partir de outra conta. Status e broadcast são ignorados; grupos só são aceitos com `ALLOW_GROUPS=true`. Eventos de histórico (`append`) não passam pelo roteador, apenas mensagens notificadas (`notify`).

## Fila e spam

Cada remetente tem uma janela de comandos. IDs de mensagem são deduplicados por 5 minutos. A fila processa mensagens em sequência e descarta entradas novas quando há 100 pendentes. O limite de memória também nega novas chaves quando saturado. Isso não substitui consentimento, política da plataforma ou proteção de borda.

## QR no console da hospedagem

Restrinja o acesso ao console durante a autenticação. Não use serviços públicos para renderizar o QR. A base usa `qrcode-terminal`, localmente. Se o QR expirar, aguarde o próximo evento; não publique a sequência bruta do QR em ferramentas de suporte.

## Antes de publicar uma alteração

- Rode lint, formatação, testes e smoke test de startup.
- Verifique `git diff --staged` para confirmar que não há segredos ou dados pessoais.
- Confira mudanças de dependências e o lockfile. Não troque versões maiores sem revisar a API.
- Teste com uma conta dedicada e permissões mínimas antes de promover a alteração.
- Use os logs da hospedagem para acompanhar reinícios e consumo real; não há SLA de aplicação nesta base.

## Segredos e logs

As variáveis do painel têm preferência prática sobre arquivos empacotados. Não envie `.env`
para repositórios, imagens Docker ou issues. O logger registra apenas metadados operacionais,
não o conteúdo das conversas. Para investigar um problema, reproduza com dados fictícios e
não habilite logs brutos de SDK em produção.

## Encerramento e reinício

`SIGINT` e `SIGTERM` interrompem conexões e removem listeners. Há um prazo máximo de 10 segundos
para tarefas pendentes. Reinicie o processo após mudar variáveis de ambiente. Verifique a política
de reinício da hospedagem para não transformar erro permanente de credenciais em loop contínuo.

[Voltar ao README](../README.md)
