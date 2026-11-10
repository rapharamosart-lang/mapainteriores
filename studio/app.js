'use strict';
const $ = id => document.getElementById(id);
let db, selectedFile, current, urls = [], records = [];
let statusTimer;
let storageReady; const storageInitialized = new Promise(resolve => { storageReady = resolve; });
function notify(message) { $('status').textContent = message; clearTimeout(statusTimer); statusTimer = setTimeout(() => $('status').textContent = '', 6500); }
function objectURL(blob) { const url = URL.createObjectURL(blob); urls.push(url); return url; }
function revokeURLs() { urls.forEach(URL.revokeObjectURL); urls = []; }
async function request(store, method, value) { await storageInitialized; if (BartzCloud.active) return method === 'getAll' ? BartzCloud.list() : method === 'put' ? BartzCloud.put(value) : BartzCloud.remove(value); if (!db) throw new Error('Armazenamento local indisponível.'); return new Promise((resolve, reject) => { const tx = db.transaction('projects', method === 'getAll' ? 'readonly' : 'readwrite'); const req = tx.objectStore('projects')[method](value); tx.oncomplete = () => resolve(req.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('Operação cancelada')); }); }
async function refresh() { records = (await request('projects', 'getAll')).sort((a,b) => b.createdAt-a.createdAt); $('count').textContent = records.length; }
function show(view) { ['create','projects','detail','dashboard','team','presentation','budget'].forEach(v => $(v+'-view').hidden = v !== view); document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view || view === 'detail' && b.dataset.view === 'projects')); }
async function projects() { await refresh(); revokeURLs(); const container = $('projects'); container.replaceChildren(); if (!records.length) { const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'Seu primeiro projeto começa com um render. Clique em Novo projeto para começar.'; container.append(empty); } for (const project of records) { const card = document.createElement('button'); card.className = 'project-card'; const img = document.createElement('img'); img.src = objectURL(project.original); img.alt = 'Render de '+project.name; const info = document.createElement('span'); info.className = 'card-info'; const title = document.createElement('strong'); title.textContent = project.name; const date = document.createElement('small'); date.textContent = new Date(project.createdAt).toLocaleDateString('pt-BR') + ' · ' + (project.mode === 'realism' ? 'Melhorar realismo' : 'Aumentar resolução'); const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = project.result ? 'Resultado importado' : 'Aguardando integração IA'; info.append(title,date,tag); card.append(img,info); card.onclick = () => detail(project); container.append(card); } show('projects'); }
function detail(project) { current = project; fillProjectInfo(project); fillDesignerOptions(); $('saved-prompt').textContent = project.prompt || 'Este projeto ainda não tem uma direção criativa salva.'; revokeURLs(); $('detail-title').textContent = project.name; $('detail-original').src = objectURL(project.original); const hasResult = !!project.result; ['result-layer','divider','slider-label','download-result'].forEach(id => $(id).hidden = !hasResult); $('result-label').textContent = hasResult ? 'RESULTADO IMPORTADO' : 'RESULTADO NÃO IMPORTADO'; if (hasResult) $('detail-result').src = objectURL(project.result); else $('detail-result').removeAttribute('src'); $('slider').value = 50; compare(); show('detail'); }
function compare() { const value = $('slider').value; $('result-layer').style.clipPath = `inset(0 ${100-value}% 0 0)`; $('divider').style.left = value+'%'; }
async function validate(file) { if (!file || !['image/jpeg','image/png'].includes(file.type)) throw new Error('Selecione uma imagem PNG ou JPG.'); if (file.size > 20*1024*1024) throw new Error('A imagem deve ter no máximo 20 MB.'); const bitmap = await createImageBitmap(file); const size = {width:bitmap.width,height:bitmap.height}; bitmap.close(); return size; }
async function selectFile(file) { try { await validate(file); revokeURLs(); selectedFile = file; $('preview').src = objectURL(file); $('filename').textContent = file.name; $('preview-wrap').hidden = false; $('dropzone').hidden = true; $('save').disabled = !db; if (!$('project').value.trim()) $('project').value = file.name.replace(/\.[^.]+$/, '').slice(0,100); } catch(e) { notify(e.message || 'Não foi possível abrir a imagem.'); } }
$('file').onchange = e => { selectFile(e.target.files[0]); e.target.value = ''; };
$('replace').onclick = () => $('file').click();
const zone = $('dropzone'); ['dragenter','dragover'].forEach(type => zone.addEventListener(type,e => {e.preventDefault();zone.classList.add('drag');})); ['dragleave','drop'].forEach(type => zone.addEventListener(type,e => {e.preventDefault();zone.classList.remove('drag');})); zone.addEventListener('drop',e => selectFile(e.dataTransfer.files[0]));
$('save').onclick = async () => { const name = $('project').value.trim(); if (!name) { $('project').focus(); notify('Dê um nome ao projeto.'); return; } if (!selectedFile || !db) return; $('save').disabled = true; try { const project = {id:crypto.randomUUID(),name,mode:document.querySelector('[name=mode]:checked').value,createdAt:Date.now(),prompt:buildPrompt(),promptPreset:$('prompt-preset').value,promptDetails:$('prompt-details').value,original:selectedFile}; await request('projects','put',project); await refresh(); selectedFile = null; $('project').value = ''; $('preview-wrap').hidden = true; $('dropzone').hidden = false; detail(project); notify(BartzCloud.active ? 'Projeto salvo na nuvem. Abra Melhorar imagem com IA para gerar.' : 'Projeto salvo neste navegador. A geração com IA requer um projeto na nuvem.'); } catch(e) { $('save').disabled = false; notify(BartzCloud.active ? e.message : 'Não foi possível salvar. Verifique o espaço de armazenamento do navegador.'); } };
$('result-file').onchange = async e => { const file = e.target.files[0]; e.target.value = ''; if (!file) return; try { const resultSize = await validate(file); const originalSize = await validate(current.original); if (Math.abs(resultSize.width/resultSize.height - originalSize.width/originalSize.height) > 0.01) throw new Error('Use um resultado com as mesmas proporções do original para comparar.'); const updated = {...current,result:file}; await request('projects','put',updated); detail(updated); notify('Resultado importado e salvo.'); } catch(e) { notify(e.message || 'Não foi possível importar o resultado.'); } };
$('slider').oninput = compare;
function download(blob,suffix) { const a = document.createElement('a'); const url = URL.createObjectURL(blob); a.href = url; a.download = current.name.replace(/[^\p{L}\p{N} _-]/gu,'')+'-'+suffix+(blob.type === 'image/png' ? '.png' : '.jpg'); a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); }
$('download-original').onclick = () => download(current.original,'original'); $('download-result').onclick = () => download(current.result,'resultado');
$('delete').onclick = async () => { if (!confirm('Excluir este projeto e suas imagens'+(BartzCloud.active ? ' da nuvem?' : ' deste navegador?'))) return; try { await request('projects','delete',current.id); current = null; await projects(); notify('Projeto excluído.'); } catch { notify('Não foi possível excluir o projeto.'); } };
function create() { revokeURLs(); if (selectedFile) $('preview').src = objectURL(selectedFile); show('create'); }
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => b.dataset.view === 'budget' ? openBudget().catch(e=>notify(e.message)) : b.dataset.view === 'presentation' ? openPresentationEditor().catch(e=>notify(e.message)) : b.dataset.view === 'team' ? team().catch(e=>notify(e.message)) : b.dataset.view === 'dashboard' ? dashboard().catch(() => notify('Não foi possível carregar as métricas.')) : b.dataset.view === 'projects' ? projects().catch(() => notify('Não foi possível carregar os projetos.')) : create()); $('new-project').onclick = create; $('back').onclick = () => projects();
const opening = indexedDB.open('bartz-studio',1); opening.onupgradeneeded = () => opening.result.createObjectStore('projects',{keyPath:'id'}); opening.onsuccess = async () => { db = opening.result; storageReady(); if (selectedFile) $('save').disabled = false; }; opening.onerror = () => { storageReady(); notify('Armazenamento local indisponível. Habilite o armazenamento do navegador para salvar projetos.'); };
window.addEventListener('beforeunload',revokeURLs);

function resetWorkspace() {
  resetBudget();
  resetPresentationEditor();
  revokeURLs(); selectedFile = null; current = null; records = []; $('count').textContent = '0';
  $('project').value = ''; $('preview').removeAttribute('src'); $('preview-wrap').hidden = true;
  $('dropzone').hidden = false; $('save').disabled = true; $('projects').replaceChildren();
  $('detail-original').removeAttribute('src'); $('detail-result').removeAttribute('src');
  const cloud = BartzCloud.active;
  $('storage-badge').textContent = cloud ? 'Supabase · conectado' : 'Versão local';
  $('account').textContent = cloud ? 'Sair da nuvem' : 'Entrar na nuvem';
  $('storage-description').textContent = cloud ? 'Projetos privados da sua conta no Supabase.' : 'Salvos apenas neste navegador. Baixe os arquivos para manter uma cópia.';
  show('dashboard');
}
$('account').onclick = async () => {
  if (!BartzCloud.active) { $('login-error').textContent = ''; $('login-dialog').showModal(); return; }
  try { await BartzCloud.logout(); } catch { notify('Sessão local encerrada; não foi possível confirmar a saída no servidor.'); }
  resetWorkspace(); await dashboard();
};
$('login-cancel').onclick = () => { $('password').value = ''; $('login-dialog').close(); };
$('login-form').onsubmit = async e => {
  e.preventDefault(); $('login-submit').disabled = true; $('login-error').textContent = '';
  try {
    await BartzCloud.login($('email').value.trim(), $('password').value);
    // Verify table and bucket access before announcing that the cloud is ready.
    await BartzCloud.list();
    resetWorkspace(); $('login-dialog').close(); await dashboard(); notify('Conectado. Seus projetos locais continuam separados.');
  } catch (error) {
    if (BartzCloud.active) { try { await BartzCloud.logout(); } catch {} }
    $('login-error').textContent = error.message;
  } finally { $('password').value = ''; $('login-submit').disabled = false; }
};

const promptPresets = {
 realism: 'Transforme este render em uma imagem de interiores com realismo fotográfico. Preserve rigorosamente geometria, layout, dimensões, marcenaria, posição de câmera e objetos. Aprimore materiais, iluminação e sombras sem inventar elementos.',
 texture: 'Aplique a textura descrita somente na área indicada. Preserve geometria, dimensões, juntas da marcenaria, iluminação, câmera e todos os demais elementos. Se a área ou o material não estiverem claros, solicite esclarecimento antes da edição.',
 object: 'Substitua somente o objeto explicitamente indicado pela alternativa descrita. Preserve a marcenaria, o layout, as proporções, a câmera e os demais objetos. Respeite perspectiva, escala e sombras.',
 lighting: 'Aprimore a iluminação natural deste ambiente, com sombras suaves e exposição equilibrada. Preserve a posição real de janelas, geometria, cores dos materiais, layout e mobiliário. Não crie novas aberturas.'
};
function buildPrompt(){return promptPresets[$('prompt-preset').value] + ($('prompt-details').value.trim() ? '\nInstruções específicas: '+$('prompt-details').value.trim() : '');}
function updatePrompt(){$('prompt-preview').value=buildPrompt();}
$('prompt-preset').onchange=updatePrompt;$('prompt-details').oninput=updatePrompt;updatePrompt();
$('copy-prompt').onclick=async()=>{try{await navigator.clipboard.writeText(buildPrompt());notify('Prompt copiado.');}catch{$('prompt-preview').focus();$('prompt-preview').select();notify('Selecione e copie o prompt acima.');}};

addEventListener('DOMContentLoaded',()=>dashboard().catch(error=>notify(error.message||'Não foi possível abrir o dashboard.')));
