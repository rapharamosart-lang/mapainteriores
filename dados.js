// Dados do mapa: contorno de Maceió, bairros, tipos de ambiente e clientes.
// Para usar clientes reais, troque PONTOS pela lista real e ponha TOTAL_SIMULADOS = 0.

// Contorno do município de Maceió (IBGE, via github.com/tbrugz/geodata-br), [longitude, latitude].
const CONTORNO = [[-35.6173,-9.46925],[-35.59838,-9.47263],[-35.58977,-9.46869],[-35.57978,-9.47097],[-35.56896,-9.47742],[-35.56207,-9.47933],[-35.5582,-9.48703],[-35.58652,-9.51025],[-35.59091,-9.52859],[-35.59521,-9.52998],[-35.60491,-9.53107],[-35.61378,-9.53965],[-35.61619,-9.54787],[-35.63011,-9.55158],[-35.64641,-9.56741],[-35.64963,-9.56711],[-35.65938,-9.58326],[-35.68641,-9.61351],[-35.69723,-9.63947],[-35.69902,-9.64914],[-35.6945,-9.66436],[-35.70857,-9.66502],[-35.72373,-9.68422],[-35.72899,-9.68227],[-35.72299,-9.68172],[-35.72246,-9.67575],[-35.72948,-9.67093],[-35.74105,-9.67154],[-35.75524,-9.67772],[-35.78802,-9.71081],[-35.79417,-9.71271],[-35.79585,-9.70778],[-35.78216,-9.69728],[-35.79083,-9.68015],[-35.78519,-9.66909],[-35.77991,-9.66649],[-35.77996,-9.65527],[-35.76931,-9.63479],[-35.76962,-9.63419],[-35.78208,-9.62191],[-35.79336,-9.59983],[-35.81552,-9.57667],[-35.80946,-9.56846],[-35.79618,-9.53106],[-35.78403,-9.50621],[-35.78374,-9.50393],[-35.77983,-9.47285],[-35.7693,-9.38936],[-35.74582,-9.3838],[-35.68736,-9.37042],[-35.67646,-9.39802],[-35.67199,-9.40935],[-35.66472,-9.42975],[-35.64155,-9.44393],[-35.62547,-9.44754],[-35.62477,-9.46087]];
const ORLA = [6, 31]; // trecho do contorno voltado para o mar (índices)

// [nome, longitude, latitude, peso na simulação de clientes]
const BAIRROS = [
  ['Ponta Verde', -35.7035, -9.6600, 60], ['Pajuçara', -35.7175, -9.6700, 40], ['Jatiúca', -35.7080, -9.6460, 70],
  ['Cruz das Almas', -35.7010, -9.6300, 40], ['Jacarecica', -35.6960, -9.6150, 20], ['Garça Torta', -35.6800, -9.6000, 12],
  ['Guaxuma', -35.6700, -9.5860, 15], ['Riacho Doce', -35.6560, -9.5650, 10], ['Ipioca', -35.6100, -9.5180, 8],
  ['Centro', -35.7350, -9.6650, 20], ['Farol', -35.7400, -9.6500, 45], ['Trapiche', -35.7520, -9.6700, 15],
  ['Pontal da Barra', -35.7770, -9.6930, 10], ['Bebedouro', -35.7630, -9.6230, 15], ['Serraria', -35.7270, -9.5900, 40],
  ['Tabuleiro', -35.7520, -9.5750, 35], ['Cidade Universitária', -35.7700, -9.5500, 25], ['Benedito Bentes', -35.7150, -9.5520, 35],
  ['Gruta de Lourdes', -35.7370, -9.6320, 30], ['Mangabeiras', -35.7180, -9.6430, 25], ['Poço', -35.7270, -9.6590, 20],
  ['Antares', -35.7450, -9.5920, 15]
];

const TIPOS = {
  cozinha:    { nome: 'Cozinha',         cor: '#e8833a' },
  dormitorio: { nome: 'Dormitório',      cor: '#7b6cf6' },
  sala:       { nome: 'Sala',            cor: '#1fa58f' },
  escritorio: { nome: 'Escritório',      cor: '#3a86e8' },
  banheiro:   { nome: 'Banheiro',        cor: '#e2507f' },
  loja:       { nome: 'Loja / Showroom', cor: '#e0a800' }
};

// Showroom + clientes SIMULADOS (gerados mais abaixo) — troque pelos endereços reais.
const PONTOS = [
  { nome: 'Showroom', bairro: 'Ponta Verde', tipo: 'loja', coord: [-35.7045, -9.6590], descricao: 'Loja principal' }
];
const TOTAL_SIMULADOS = 527;

// Clientes simulados espalhados pelos bairros, mais concentrados onde o peso é maior.
(function simularClientes() {
  // projeção local em km para medir distâncias
  const LNG0 = -35.70, LAT0 = -9.58, KX = 111.32 * Math.cos(LAT0 * Math.PI / 180), KZ = 110.57;
  const km = ([lng, lat]) => [(lng - LNG0) * KX, (lat - LAT0) * KZ];
  const C = CONTORNO.map(km);
  const dentro = (x, y) => {
    let d = false;
    for (let i = 0, j = C.length - 1; i < C.length; j = i++) {
      const [xi, yi] = C[i], [xj, yj] = C[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  const distOrla = (x, y) => {
    let m = Infinity;
    for (let i = ORLA[0]; i < ORLA[1]; i++) {
      const [ax, ay] = C[i], [bx, by] = C[i + 1], dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return m;
  };
  let s = 527;
  const r = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const somaPesos = BAIRROS.reduce((soma, b) => soma + b[3], 0);
  const tipos = [['cozinha', 38], ['dormitorio', 27], ['sala', 15], ['escritorio', 9], ['banheiro', 11]];
  const sortear = (lista, total) => { let x = r() * total; return lista.find(item => (x -= item[item.length - 1]) < 0) || lista[0]; };
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  while (PONTOS.length <= TOTAL_SIMULADOS) {
    const b = sortear(BAIRROS, somaPesos);
    const [cx, cy] = km([b[1], b[2]]);
    const x = cx + gauss() * 0.45, y = cy + gauss() * 0.45;
    if (!dentro(x, y) || distOrla(x, y) < 0.1) continue;
    const tipo = sortear(tipos, 100)[0];
    const num = String(PONTOS.length).padStart(3, '0');
    PONTOS.push({ nome: `Cliente ${num} · ${TIPOS[tipo].nome}`, bairro: b[0], tipo,
      coord: [+(LNG0 + x / KX).toFixed(5), +(LAT0 + y / KZ).toFixed(5)],
      descricao: `Instalado em ${2016 + Math.floor(r() * 11)} · cliente simulado` });
  }
})();
