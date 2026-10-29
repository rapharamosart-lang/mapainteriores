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

## Clientes

`dados.js` tem o contorno de Maceió (IBGE), os bairros, os tipos de ambiente e os pontos.
Hoje há o showroom e 527 clientes **simulados** (`TOTAL_SIMULADOS`).
Para usar clientes reais: troque a lista `PONTOS` (coordenadas em `[longitude, latitude]`) e ponha `TOTAL_SIMULADOS = 0`.
"Baixar lista" exporta todos os pontos em CSV (abre no Excel).

## Fontes

Mapa e prédios: OpenFreeMap / © colaboradores do OpenStreetMap. Satélite: Esri World Imagery.
Contorno do município: IBGE, via github.com/tbrugz/geodata-br.
