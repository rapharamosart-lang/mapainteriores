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

"Mostrar clientes simulados" liga e desliga os 527 clientes de exemplo (`TOTAL_SIMULADOS` em `dados.js`).

## Fontes

Mapa e prédios: OpenFreeMap / © colaboradores do OpenStreetMap. Satélite: Esri World Imagery.
Contorno do município: IBGE, via github.com/tbrugz/geodata-br.
