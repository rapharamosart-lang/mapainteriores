# Ativar o Supabase do Bartz Studio

Projeto: `moerbwpubdgjnenczgoq`. A URL e a chave publishable foram configuradas em `studio/cloud.js`; nenhuma chave administrativa é usada no navegador.

## No painel do Supabase

1. Abra **SQL Editor → New query**.
2. Copie e execute o conteúdo completo de `migrations/202611070001_bartz_studio.sql` uma única vez. A transação cria apenas a tabela `bartz_projects`, o bucket privado `bartz-renders` e suas políticas. Se esses nomes já existirem, interrompa e inspecione a configuração; não apague tabelas existentes para aplicar o script.
3. Em **Authentication → Sign In / Providers**, mantenha Email habilitado e desative novos cadastros públicos (**Allow new users to sign up**). O aplicativo não oferece cadastro público.
4. Em **Authentication → Users → Add user**, crie a conta de teste com e-mail e senha e confirme o e-mail pelo fluxo administrativo apropriado. Não envie a senha pelo chat.
5. Inicie o Studio e clique em **Entrar na nuvem**. Use a conta criada. Salve um render; confirme a linha em `bartz_projects` e o arquivo no bucket privado. Saia e entre novamente para verificar a persistência.
6. Teste com uma segunda conta: o projeto da primeira não deve aparecer. Sem autenticação, leituras e uploads devem ser recusados. As políticas ainda precisam de teste real no Supabase.

## Limites da integração atual

- Projetos locais continuam no IndexedDB e não são migrados automaticamente.
- Sessão Supabase fica somente na memória desta aba. Recarregar exige novo login; tokens não são gravados no armazenamento local.
- Isolamento por usuário, sem compartilhamento automático entre funcionários.
- A listagem baixa as imagens completas; implementar paginação e miniaturas antes de volumes maiores.
- Upload e gravação da linha não são uma transação única. Falhas podem deixar objetos órfãos; limpeza automática e recuperação precisam ser implementadas antes de produção.
- Excluir remove primeiro os arquivos; uma falha posterior na exclusão da linha exige nova tentativa. Não há desfazer.
- Não há processamento OpenAI, fila, cotas ou deploy neste passo.
- A aplicação nunca deve receber `service_role`, `sb_secret_…` ou senha de banco.

## Ambiente de desenvolvimento na nuvem

O domínio `moerbwpubdgjnenczgoq.supabase.co` foi proposto na configuração de rede. Revisar e salvar as configurações, depois publicar o ambiente para reutilização. O salvamento do rascunho não aplica automaticamente a permissão. Validar uma conexão nova após a aplicação.

## Direções criativas

Após a migração inicial, aplique também `migrations/202611070002_project_prompt.sql` para guardar o prompt do projeto. Ela adiciona uma coluna opcional sem mudar as políticas de acesso. A API de imagens da OpenAI ainda não é chamada.
