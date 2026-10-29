# Interiores Móveis Planejados — mapa 3D de Maceió

Duas versões:

- `index.html` — **mapa real** (MapLibre + OpenStreetMap): ruas, bairros e prédios reais em 3D,
  botão de satélite. Feita para o GitHub Pages: precisa de Internet e abre por um endereço web.
- `maquete.html` — maquete 3D estilizada (Three.js), tudo embutido; é a versão publicada como artefato no Claude.

As duas abrem com os pinos pipocando pela cidade e o contador subindo até o total de clientes
("Rever abertura" repete; tocar na tela pula a animação).

## Site

https://rapharamosart-lang.github.io/mapainteriores/ (mapa real) ·
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
