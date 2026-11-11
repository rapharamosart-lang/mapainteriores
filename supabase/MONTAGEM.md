# Ativação da montagem compartilhada

A implementação foi validada em PostgreSQL 16 local, com quatro identidades de teste e RLS. **A migração não foi aplicada ao Supabase de produção neste ambiente.**

1. No projeto `moerbwpubdgjnenczgoq`, abra SQL Editor.
2. Execute uma vez `migrations/202611100001_installation.sql`, após a criação de `bartz_projects` pelas migrações anteriores.
3. Crie/confirme contas de acesso do projetista e do montador em Authentication. O módulo não cria convites, contas ou senhas.
4. No painel, entre na conta proprietária do projeto e abra Montagem → Criar acompanhamento. Informe os e-mails exatos das contas participantes.
5. Entre como montador em outro navegador, cadastre/confira peças e registre uma pendência. Entre como projetista e confira o aviso em Montagem; o contador é atualizado a cada 30 segundos enquanto o painel está aberto. Use Atualizar para consulta imediata.

O proprietário e os e-mails vinculados acessam somente os dados da montagem. Não é concedido acesso aos orçamentos, contratos ou imagens privadas do projeto. O proprietário gerencia os participantes; a interface atual define os participantes na criação. Peças e pendências podem ser atualizadas pelos participantes. Avisos são criados por trigger, não diretamente pelo cliente, com leitura independente para proprietário e projetista. Alterar participantes remove o acesso de quem deixou de estar vinculado.

Não há envio por e-mail/WhatsApp, push em segundo plano ou serviço externo de assinatura. O modo local e o exemplo não notificam outras contas. Dados locais de montagem ficam no navegador e não são migrados automaticamente para a nuvem.

## Validação reproduzível

Use exclusivamente um PostgreSQL de teste vazio e isolado: execute `tests/installation-policy-fixture.sql`, depois a migração de montagem, depois `tests/installation-policy-test.sql`, todos com `psql -v ON_ERROR_STOP=1`. A fixture cria identidades e funções simuladas de autenticação; **nunca a execute em produção**. Os testes cobrem proprietário, projetista, montador, estranho, acesso anônimo, alteração de responsável, falsificação de autor/aviso e leitura independente dos avisos.
