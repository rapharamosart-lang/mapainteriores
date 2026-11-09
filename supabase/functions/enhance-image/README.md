# Ativar tratamento OpenAI

A implementação foi testada com respostas controladas. Ainda requer deploy, credencial real e validação no Supabase/OpenAI.

1. Aplique as migrações anteriores e `supabase/migrations/202611090001_generation_limits.sql` no SQL Editor do projeto.
2. No Supabase, abra **Edge Functions → Secrets** e configure `OPENAI_API_KEY` com uma chave do projeto OpenAI com saldo e acesso a `gpt-image-1`. Nunca coloque essa chave no HTML, Git ou chat.
3. Publique a função `enhance-image` a partir de `index.ts`. Com Supabase CLI autenticada: `supabase functions deploy enhance-image --project-ref moerbwpubdgjnenczgoq --no-verify-jwt`. A opção desabilita apenas a verificação antiga do gateway; a função valida o JWT consultando Auth antes de acessar dados ou gastar créditos.
4. No Studio, entre na nuvem, salve um projeto no modo Melhorar realismo, abra-o e clique em Melhorar imagem com IA. A função usa o prompt salvo no projeto, mantém o original e substitui o resultado.
5. Confira uma geração real, salvamento, novo login e isolamento com uma segunda conta antes de liberar para toda a equipe.

Limites: 5 tentativas por usuário/dia UTC, intervalo mínimo de 3 minutos. Tentativas com falha consomem cota para evitar repetição de cobranças. Imagens PNG/JPG até 20 MB. Modelo fixo gpt-image-1, qualidade medium. Ampliação exata de resolução não é oferecida. Se houver timeout, confira o projeto antes de repetir: desconectar o navegador não garante cancelamento da cobrança. Não há fila assíncrona ou recuperação automática de resultados em falha entre upload e atualização do registro. O orçamento global deve ser configurado no projeto OpenAI. A cota não substitui esse orçamento.

CORS permite o GitHub Pages atual; outro domínio exige ajustar a origem. Nenhuma service role é usada: leituras, uploads e atualizações usam JWT do usuário e RLS. A função SQL só reserva cota do próprio auth.uid().
