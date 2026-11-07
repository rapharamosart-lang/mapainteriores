# Bartz Studio — primeira versão

Interface estática independente do mapa existente. Não requer instalação de pacotes.

## Executar

Na raiz do repositório:

```sh
python3 -m http.server 4173 --bind 0.0.0.0
```

Abrir o caminho `/studio/` no servidor. Use o checkout existente; não é necessário criar worktrees.

## Funcionalidades disponíveis

- Upload e arraste de PNG/JPG até 20 MB, com validação de decodificação.
- Nome de projeto e escolha de tratamento.
- Projetos e imagens persistidos em IndexedDB, somente no navegador atual.
- Importação manual de um resultado de mesmas proporções, comparação deslizante e download.
- Exclusão com confirmação e layout responsivo.

A interface não processa imagens por IA. O modo local não envia renders à rede. O modo nuvem oferece login por e-mail/senha e armazenamento no Supabase, pendente de aplicação do SQL e validação no projeto real. Veja `../supabase/SETUP.md`. A fonte Poppins é carregada do Google Fonts com fallback local. O logotipo está representado provisoriamente por texto; substituir pelo arquivo oficial, sem redesenhar a marca.

## Integração de produção planejada

1. Supabase Auth: acesso da equipe por convite, sem cadastro público irrestrito.
2. Supabase Postgres: projetos e tarefas com proprietário, status, modo, caminhos privados, modelo, uso e timestamps. RLS restringindo acesso à equipe autorizada.
3. Supabase Storage: bucket privado e URLs assinadas de curta duração. Definir retenção, limites e exclusão de originais e resultados.
4. Cloudflare Worker: validar JWT do Supabase, autorização, MIME/tamanho, cotas e limites antes de aceitar tarefas. Segredos OpenAI e credenciais administrativas ficam apenas no servidor.
5. Cloudflare Queues + consumidor: criar tarefa idempotente, chamar API de edição de imagens compatível com o modo, salvar resultado e atualizar status. Aplicar tentativas limitadas, tratamento de erros e controle de custo. Escolher modelo e parâmetros após avaliar renders reais; o modo de upscaling exige validar suporte de um provedor apropriado.
6. Frontend: trocar repositório IndexedDB por adaptador autenticado e consultar status. Não apresentar envio local como processamento real.

A URL do Supabase e a chave pública publishable estão configuradas em `cloud.js`. O banco e as políticas foram preparados em SQL, mas ainda não foram aplicados por este ambiente. Nenhum deploy foi realizado. GitHub Pages existente publica a árvore do repositório: arquivos em `studio/` podem ser publicados pelo workflow atual se as alterações forem enviadas. Não incluir segredos nesses arquivos.

## Identidade

Grafite #2D2D2E, amarelo #F3BC2E, branco #FFFFFF; Poppins; linhas verticais com destaque amarelo. Manual fornecido pelo cliente. Os textos de segurança sobre revisão de detalhes são específicos do produto.
