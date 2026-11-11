# Interiores Móveis Planejados — mapa 3D de Maceió

Duas versões:

- `index.html` — site institucional Interiores Bart Studio, com parallax, ambientes e resumo de briefing local.
- `mapa.html` — **mapa real** (MapLibre + OpenStreetMap): ruas, bairros e prédios reais em 3D,
  botão de satélite. Feita para o GitHub Pages: precisa de Internet e abre por um endereço web.
- `maquete.html` — maquete 3D estilizada (Three.js), tudo embutido; é a versão publicada como artefato no Claude.

As duas abrem com os pinos pipocando pela cidade e o contador subindo até o total de clientes
("Rever abertura" repete; tocar na tela pula a animação).

## Site

https://rapharamosart-lang.github.io/mapainteriores/ (site institucional) ·
https://rapharamosart-lang.github.io/mapainteriores/maquete.html (maquete)

Para ativar: **Settings → Pages → Deploy from a branch → `main` / (root)**.

## Cadastrar clientes reais

No mapa, **＋ Cadastrar cliente** abre o formulário: nome, endereço, bairro, ambiente, mês de instalação,
telefone e observações. A localização vem de **Localizar endereço** (busca no OpenStreetMap; se não achar,
usa o centro do bairro) ou de **Marcar no mapa**; o marcador pode ser arrastado para ajustar.
No cartão do cliente há **Editar** e **Excluir**.

Os cadastros ficam salvos **no navegador do aparelho** onde foram feitos. Para levar para outro aparelho
ou guardar cópia: **Baixar planilha** (CSV, abre no Excel) e **Importar planilha** no outro aparelho.
A planilha aceita as colunas nome, endereco, bairro, ambiente, instalacao, telefone, observacoes,
latitude, longitude (só "nome" é obrigatória; sem coordenadas, o endereço é buscado).

Para deixar os clientes fixos no site para todo mundo, eles entram na lista `PONTOS` de `dados.js`.
Atenção: o site é público — não coloque telefone nem nome completo de cliente em `dados.js` sem autorização.

## Fotos dos ambientes

No cartão de cada cliente cadastrado: escolha o ambiente (Cozinha, Dormitório, Closet…) e toque em
**＋ Adicionar fotos** (pode escolher várias, ou tirar na hora pelo celular). As fotos são reduzidas para
1600 px e guardadas no navegador do aparelho, agrupadas por ambiente; toque numa foto para ver em tela cheia
(setas ou deslize para passar, "Apagar foto" para remover).

### Fotos e clientes fixos (aparecem para todo mundo)

1. **Clientes:** edite `clientes.csv` no GitHub (ou suba a planilha baixada pelo botão "Baixar planilha"
   com esse nome). Colunas: nome, endereco, bairro, ambiente, instalacao (AAAA-MM), observacoes, latitude, longitude.
   Sem latitude/longitude, o endereço é localizado automaticamente. A coluna telefone é removida, porque o site é público.
2. **Fotos:** em `fotos/`, crie uma pasta com o nome do cliente e suba as fotos com o nome do ambiente
   (`fotos/Maria Souza/Cozinha 1.jpg`). Veja `fotos/LEIA-ME.md`.
3. A cada envio, o GitHub Actions (`.github/workflows/publicar.yml`) reduz as fotos, gera `fotos.json`,
   completa `clientes.csv` e publica o site.

O GitHub Pages precisa estar em **Settings → Pages → Source: GitHub Actions**.

"Mostrar clientes simulados" liga e desliga os 527 clientes de exemplo (`TOTAL_SIMULADOS` em `dados.js`).

## Fontes

Mapa e prédios: OpenFreeMap / © colaboradores do OpenStreetMap. Satélite: Esri World Imagery.
Contorno do município: IBGE, via github.com/tbrugz/geodata-br.

## Desenvolvimento do site institucional

Execute `python3 -m http.server 8000 --bind 127.0.0.1` na raiz do repositório.
A página inicial usa `assets/site.css`, `assets/site.js` e uma ilustração SVG local; não exige instalação nem build.
O mapa anterior está preservado em `mapa.html`.

O parallax respeita a preferência de movimento reduzido. As abas oferecem navegação por setas, Home e End.
O formulário prepara um resumo local para copiar: não envia contatos nem grava dados no servidor.
Substitua a ilustração conceitual por fotografias autorizadas e configure um contato real antes de usar o site como canal comercial.
Login, dashboard e integrações OpenAI/Supabase ainda não foram implementados nesta página.
A referência https://www.bartzmoveis.com.br/lojas foi informada pelo usuário, mas sua inspeção foi bloqueada pela política de rede durante esta implementação.

## Abertura com mapa

Antes do mapa, a página inicial apresenta uma abertura 2D sobre fundo claro.
A marca positiva original do brand book aparece sem retângulo de fundo;
barras de um pódio crescem em sequência, uma seta sobe e um pequeno troféu
vetorial entra no alto. A frase é “Interiores Bartz — Maceió. Sempre no topo
do ranking nacional de vendas.” O gráfico é ilustrativo, sem métricas ou posições.
A abertura dura 5,2 segundos mais a transição e aparece uma vez por sessão
da aba. “Entrar no site” ou Esc encerram imediatamente; tocar no gráfico
repete a animação e reinicia o prazo. Tab alterna entre os dois controles.
Links para seções pulam a abertura. Movimento reduzido mantém o desenho
estático e sem interação de movimento. Sem JavaScript, o site abre normalmente.
Arquivos: `assets/award-intro.js` e `assets/award-intro.css`; sem Canvas,
WebGL ou dependências externas. Ao sair, a animação do mapa é reiniciada.

O primeiro bloco do site incorpora `mapa.html?publico=1`: exibe mapa e contador, sem os controles de cadastro. Esse modo não lê clientes privados do localStorage. Usa clientes publicados no repositório e, quando não há nenhum, identifica explicitamente os pontos simulados como demonstração. A contagem representa os registros localizáveis publicados, sem incluir showroom.

`assets/public-map.js` fornece uma abertura esquemática local com o contorno de Maceió e os mesmos pontos se a cartografia externa não carregar. O mapa 3D substitui essa abertura somente após estar inicializado. O botão Rever abertura reinicia o efeito; movimento reduzido exibe o total sem animação. As fontes Poppins são locais também no mapa. Rótulos cartográficos do provedor conservam suas fontes próprias.

MapLibre GL 4.7.1 está em `assets/vendor/`, com licenças, obtido do npm e verificado com a integridade SHA-512 do pacote. A cartografia continua dependendo de tiles.openfreemap.org e dos recursos indicados pelo estilo. Testes de integração verificaram o mapa incorporado com um estilo controlado; não estabelecem acesso ao provedor real no ambiente restrito.
