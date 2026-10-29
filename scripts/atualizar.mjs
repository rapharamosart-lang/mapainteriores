// Roda no GitHub Actions a cada envio: reduz as fotos, monta fotos.json e completa clientes.csv.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const normalizar = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const AMBIENTES = [['area gourmet', 'Área gourmet'], ['gourmet', 'Área gourmet'], ['cozinha', 'Cozinha'], ['dormitorio', 'Dormitório'],
  ['quarto', 'Dormitório'], ['suite', 'Dormitório'], ['sala', 'Sala'], ['home', 'Sala'], ['escritorio', 'Escritório'],
  ['banheiro', 'Banheiro'], ['lavabo', 'Banheiro'], ['closet', 'Closet'], ['lavanderia', 'Lavanderia'], ['varanda', 'Varanda']];
const IMAGEM = /\.(jpe?g|png|webp)$/i;

// "Cozinha 2.jpg" → Cozinha; nomes desconhecidos viram o próprio nome do arquivo
function ambienteDe(arquivo) {
  const base = normalizar(path.parse(arquivo).name).replace(/[-_]+/g, ' ').replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
  const achado = AMBIENTES.find(([k]) => base.startsWith(k));
  if (achado) return achado[1];
  const nome = path.parse(arquivo).name.replace(/[-_]+/g, ' ').replace(/\d+/g, '').trim();
  return nome ? nome[0].toUpperCase() + nome.slice(1) : 'Outro';
}

// ---------- Fotos ----------
const fotos = {};
if (fs.existsSync('fotos')) {
  const pastas = fs.readdirSync('fotos', { withFileTypes: true }).filter(d => d.isDirectory());
  for (const pasta of pastas) {
    const dir = path.join('fotos', pasta.name);
    const arquivos = fs.readdirSync(dir).filter(f => IMAGEM.test(f)).sort((a, b) => a.localeCompare(b, 'pt', { numeric: true }));
    const lista = [];
    for (const arquivo of arquivos) {
      const caminho = path.join(dir, arquivo);
      if (fs.statSync(caminho).size > 700 * 1024) {
        execFileSync('mogrify', ['-auto-orient', '-resize', '1600x1600>', '-quality', '84', '-strip', caminho]);
        console.log('reduzida:', caminho);
      }
      lista.push({ src: `fotos/${pasta.name}/${arquivo}`, ambiente: ambienteDe(arquivo) });
    }
    if (lista.length) fotos[normalizar(pasta.name)] = lista;
  }
}
fs.writeFileSync('fotos.json', JSON.stringify(fotos, null, 2) + '\n');
console.log('fotos.json:', Object.keys(fotos).length, 'cliente(s)');

// ---------- clientes.csv ----------
function lerCSV(texto) {
  const primeira = texto.split('\n')[0];
  const sep = (primeira.match(/;/g) || []).length >= (primeira.match(/,/g) || []).length ? ';' : ',';
  const linhas = [];
  let linha = [], campo = '', aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') aspas = false; else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some(v => v.trim())) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some(v => v.trim())) linhas.push(linha);
  return linhas;
}
if (fs.existsSync('clientes.csv')) {
  const [cab, ...linhas] = lerCSV(fs.readFileSync('clientes.csv', 'utf8').replace(/^﻿/, ''));
  // o site é público: telefone não fica no arquivo
  const fora = new Set(cab.map((c, i) => (/^(tel|fone|cel|whats)/.test(normalizar(c)) ? i : -1)).filter(i => i >= 0));
  let cabecalho = cab.filter((_, i) => !fora.has(i));
  let dados = linhas.map(l => l.filter((_, i) => !fora.has(i)));
  for (const nome of ['latitude', 'longitude']) if (!cabecalho.some(c => normalizar(c).startsWith(nome.slice(0, 3)))) {
    cabecalho.push(nome); dados.forEach(l => l.push(''));
  }
  const col = p => cabecalho.findIndex(c => normalizar(c).startsWith(p));
  const [iEnd, iBairro, iLat, iLng] = [col('ender'), col('bairro'), col('lat'), col('lon')];
  for (const l of dados) {
    if ((l[iLat] || '').trim() && (l[iLng] || '').trim()) continue;
    const q = [l[iEnd], l[iBairro], 'Maceió', 'Alagoas', 'Brasil'].filter(v => v && v.trim()).join(', ');
    if (!l[iEnd]?.trim()) continue;
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br'
        + '&viewbox=-35.82,-9.36,-35.55,-9.72&bounded=1&q=' + encodeURIComponent(q);
      const r = await fetch(url, { headers: { 'User-Agent': 'mapainteriores (GitHub Actions)', 'Accept-Language': 'pt-BR' } });
      const [achou] = await r.json();
      if (achou) { l[iLat] = (+achou.lat).toFixed(5); l[iLng] = (+achou.lon).toFixed(5); console.log('localizado:', q); }
      else console.log('não encontrado (usa o centro do bairro):', q);
    } catch (e) { console.log('busca falhou:', q, e.message); }
    await new Promise(r => setTimeout(r, 1100));
  }
  for (const l of dados) while (l.length < cabecalho.length) l.push('');
  const csv = [cabecalho, ...dados].map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  fs.writeFileSync('clientes.csv', '﻿' + csv + '\r\n');
  console.log('clientes.csv:', dados.length, 'cliente(s)');
}
