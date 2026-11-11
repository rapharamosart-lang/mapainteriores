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

## Atualização Interiores Bart Studio

O editor agora prioriza uma área maior para a imagem no desktop. Direções criativas incluem realismo fotográfico, textura localizada, substituição de objeto e iluminação natural, com instruções personalizadas, cópia e persistência do prompt no projeto. O modo nuvem exige a segunda migração SQL para persistir esse campo. Os presets preparam instruções; não processam imagens nem chamam a OpenAI. Links na barra lateral levam ao site público e ao mapa existente.

## Gestão de projetos

Abra um projeto para editar cliente, telefone, endereço, responsável, tipo de imóvel, ambiente, prazo e situação. Marcar como concluído registra a data; reabrir limpa a conclusão, e concluir novamente registra uma nova data. O Dashboard mostra totais, atrasos e duração média decorrida, com ranking por quantidade concluída e desempate alfabético. Os dados locais persistem no IndexedDB. Na nuvem, aplique a migração 003; a visibilidade continua restrita ao proprietário. Login de produção, permissões compartilhadas da equipe e processamento OpenAI ainda exigem ativação/integração.

## Projetistas

O menu Projetistas permite cadastrar e editar nome, foto, função e descrição. Os perfis ficam no localStorage, separados por ID da conta ou modo local; não são sincronizados pelo Supabase e não criam contas de acesso. O dashboard lista também perfis sem entregas. Selecione o nome cadastrado no campo Projetista responsável para vincular o ID do perfil ao projeto. Fotos são limitadas a 5 MB e reduzidas no navegador. O perfil reúne os projetos acessíveis e links para seus detalhes.

## Apresentação ao cliente

Abra um projeto e clique em Gerar apresentação em PDF. O Studio reúne os projetos acessíveis com o mesmo nome de cliente (cadastre nomes distintos para clientes diferentes), utiliza resultado importado ou original e monta capa oficial, introdução, lista de ambientes e uma página por imagem. Confira a prévia e use Salvar apresentação em PDF: o navegador oferece a opção Salvar como PDF, A4 paisagem e sem cabeçalhos. Nada é enviado ao cliente automaticamente. `apresentacao.html` e `apresentacao-exemplo.pdf` demonstram o layout com cliente/projetista fictícios e imagens geradas por IA.

## Continuidade

Instagram: duas publicações selecionadas pelo usuário estão incorporadas no site, com links alternativos. Não existe sincronização automática de posts recentes. Banco, autenticação real e processamento OpenAI seguem pendentes de integração/validação conforme supabase/SETUP.md.

## Editor da apresentação

A aba Apresentação carrega projetos e permite montar até 20 páginas de imagens. Cada página tem ambiente, título e descrição (até 240 caracteres), substituição de PNG/JPG até 20 MB, remoção e ordenação com Subir/Descer. Salvar edição persiste um rascunho no IndexedDB separado por conta e projeto. Não sincroniza o rascunho com o Supabase. Os renders dos projetos não são modificados. Prévia / gerar PDF exporta o estado atual, inclusive alterações ainda não salvas; use Salvar edição para retomá-las depois. O editor trabalha nos dados da apresentação e gera um novo PDF, não importa PDFs externos para edição.

## Orçamentos

Menu Orçamentos, atalho no Dashboard e botão nos detalhes do projeto. Itens por ambiente com quantidade, valor unitário, desconto em reais, validade, situação e observações. Valores calculados em centavos e totais arredondados por item. Salva em `metadata.budget` do projeto: localmente no navegador ou no Supabase quando conectado, sob as políticas existentes. Não exige coluna nova além de metadata. O status Enviado é registro manual e não envia mensagem ao cliente. Aprovado também é marcação manual. Edição do cadastro do projeto preserva o orçamento. Testes locais cobrem cálculos, persistência, desconto inválido e mobile; sincronização real depende do Supabase configurado.

## Dashboard e exemplo comercial

O painel abre no Dashboard, inclusive após login. Resumo dos projetos, valores aprovados, situação dos orçamentos (rascunho, enviado, aprovado e não aprovado), progresso, prazos, projetos recentes e ranking compacto com nome, função e foto. As métricas utilizam somente projetos acessíveis da conta ou navegador; aprovação não indica receita recebida. O total comercial é recalculado pelos itens e desconto salvos.

`orcamento-exemplo.html` e `orcamento-exemplo.pdf` apresentam um modelo com cliente, projetista, escopo e preços fictícios. O exemplo não grava dados nem participa das métricas. A validade da prévia HTML é ilustrativa, de 15 dias; o PDF é uma amostra fixa. Em um orçamento real, Visualizar / PDF abre os dados preenchidos em uma página com a identidade Interiores Bartz. Imprima em A4 sem cabeçalhos/rodapés do navegador. A prévia usa os campos atuais; salvar o orçamento é uma ação separada. Não envia propostas nem altera o status automaticamente.

## Propostas detalhadas e acompanhamento comercial

O orçamento inclui referência, revisão, objetivo, escopo incluso/excluído, prazo, condições de pagamento, garantia e observações. Cada item pode ter medidas, materiais, acabamentos e ferragens. Os campos ficam em `metadata.budget.details` e nos itens existentes, sem migração adicional. Orçamentos anteriores continuam abrindo; campos não preenchidos são apresentados como “A definir”.

Até 12 etapas de pagamento com nome, percentual e marco de cobrança. Quando preenchidas, devem somar 100%. Os valores são calculados sobre o total após desconto; centavos restantes são distribuídos pelos maiores resíduos, preservando o total e evitando parcelas negativas em valores pequenos. O exemplo tem 10 páginas com capa, cinco grupos, resumo comercial, pagamento, condições e conferência. Fotos do exemplo são conceituais; nos projetos reais a capa usa o resultado/original do projeto. A imagem é usada temporariamente na prévia, sem ser copiada para o orçamento. Nenhuma condição comercial ou garantia é preenchida automaticamente nos projetos reais.

O dashboard possui busca por projeto/cliente/projetista, filtros de situação e orçamento, valor médio das propostas, valor aguardando decisão e taxa de aprovação apenas entre decisões registradas. A lista de atenção destaca projetos atrasados, prazos dos próximos sete dias, orçamentos vencidos, responsáveis ausentes e projetos sem orçamento. O gráfico mensal conta a criação dos projetos nos seis meses recentes; não representa histórico de vendas. Todos os indicadores usam os projetos acessíveis e não incluem o exemplo.

Validação local: campos técnicos e comerciais salvos/recarregados, compatibilidade com orçamentos antigos, parcelas de 100% e rejeição de distribuição incompleta, preservação de centavos, filtros, métricas, ausência de erros JS, larguras de celular/desktop e PDF de exemplo sem páginas de rodapé isoladas. A sincronização autenticada real depende do Supabase existente.

## Contratos e montagem

Contratos acompanha apresentação gerada → aceite da apresentação → aceite do orçamento → versão para assinatura → assinatura registrada. Aceites são manuais, com nome/data/referência; não são assinaturas digitais. Mudanças de orçamento ou versão salva da apresentação invalidam o respectivo aceite. A emissão final exige dados preenchidos, condições comerciais e identificação de revisão jurídica declarada. Snapshots emitidos e versões anteriores ficam preservados em `metadata.contract`; a assinatura é apenas registro manual do documento externo. `contrato-exemplo.html` / `.pdf` são minutas com campos em aberto. Leia `CONTRATO-REFERENCIAS.md` para os limites de pesquisa e revisão.

Montagem permite conferir quantidades por ambiente/móvel/peça, registrar motivos de falta/avaria, acompanhar pedido da fábrica e previsão, alterar o andamento e ler avisos. Demo e modo local ficam em localStorage separados; não notificam outros usuários. A sincronização usa as tabelas com RLS e triggers da migração de montagem. **A ativação no Supabase de produção está pendente**, conforme `../supabase/MONTAGEM.md`. O proprietário e os participantes vinculados por e-mail veem a montagem sem receber acesso a outros dados privados do projeto. Notificações são internas, consultadas a cada 30 segundos com o painel aberto.
