/* A publishable key identifies the project; authorization comes from user JWT + RLS. */
window.BartzCloud = (() => {
  const url = 'https://moerbwpubdgjnenczgoq.supabase.co';
  const key = 'sb_publishable_dsBPm6Qiu4XAXH4HeBEJXA_tNr3qj41';
  let session = null;
  async function api(path, options = {}, authenticated = true) {
    if (authenticated && !session) throw new Error('Entre na sua conta para continuar.');
    if (authenticated && session.expires_at < Date.now()/1000 + 60) await renew();
    let response;
    try { response = await fetch(url+path, {...options, headers:{apikey:key,...(authenticated ? {Authorization:'Bearer '+session.access_token} : {}), ...options.headers}}); }
    catch { throw new Error('Não foi possível conectar ao Supabase. Verifique sua conexão.'); }
    if (!response.ok) {
      if(path.startsWith('/functions/')){let info;try{info=await response.json();}catch{} throw new Error(info?.error||'Processamento indisponível. Verifique a ativação da função no Supabase.');}
      let detail={};try{detail=await response.json();}catch{}
      const code=detail.code||detail.error_code||'';
      const message=String(detail.message||detail.error||'');
      if(path.startsWith('/auth/'))throw new Error(code==='email_not_confirmed'?'Confirme o e-mail do usuário no Supabase.':'Não foi possível entrar. Confira e-mail, senha e confirmação do usuário no Supabase.');
      if (response.status === 401) throw new Error('Sua sessão expirou. Saia e entre novamente.');
      if(code==='PGRST204'||code==='42703')throw new Error('Faltam colunas do Studio no banco. Aplique as migrações prompt e metadata no SQL Editor.');
      if(code==='PGRST205'||code==='42P01')throw new Error('A tabela bartz_projects não foi encontrada. Aplique a configuração inicial do Studio no SQL Editor.');
      if(path.startsWith('/storage/')&&/bucket.*not found/i.test(message))throw new Error('O bucket privado bartz-renders não foi criado. Aplique a configuração inicial do Studio.');
      if(code==='42501'||response.status===403||/row.level security/i.test(message))throw new Error('Permissão recusada. Confira as políticas da tabela bartz_projects e do bucket bartz-renders.');
      if (response.status === 404 || response.status === 400) throw new Error('Falha no '+(path.startsWith('/storage/')?'armazenamento':'banco')+' do Supabase (HTTP '+response.status+(code?', código '+code:'')+').');
      throw new Error('O Supabase não concluiu a operação ('+response.status+'). Verifique as permissões e a configuração.');
    }
    return response;
  }
  function keep(data) { session = {...data,expires_at:Date.now()/1000+data.expires_in}; }
  async function renew() { const data = await (await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})},false)).json(); keep(data); }
  async function login(email,password) { const response = await api('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})},false); keep(await response.json()); }
  async function logout() { try { if (session) await api('/auth/v1/logout',{method:'POST'}); } finally { session = null; } }
  const bucket = '/storage/v1/object/bartz-renders/';
  const pathFor = (id,type) => session.user.id+'/'+id+'/'+type;
  const json = {'Content-Type':'application/json'};
  async function upload(path,blob) { await api(bucket+path,{method:'POST',headers:{'Content-Type':blob.type,'x-upsert':'true'},body:blob}); }
  async function image(path) { return (await api('/storage/v1/object/authenticated/bartz-renders/'+path)).blob(); }
  async function list() {
    const rows = await (await api('/rest/v1/bartz_projects?select=*&order=created_at.desc')).json();
    return Promise.all(rows.map(async r => ({id:r.id,name:r.name,mode:r.mode,createdAt:Date.parse(r.created_at),prompt:r.prompt || '',metadata:r.metadata || {},original:await image(r.original_path),result:r.result_path ? await image(r.result_path) : undefined})));
  }
  async function put(project) {
    // Check required schema before uploading, avoiding orphan files on missing migrations.
    await api('/rest/v1/bartz_projects?select=id,prompt,metadata&limit=0');
    const originalPath = pathFor(project.id,'original');
    const resultPath = project.result ? pathFor(project.id,'result') : null;
    await upload(originalPath,project.original);
    if (resultPath) await upload(resultPath,project.result);
    await api('/rest/v1/bartz_projects?on_conflict=id',{method:'POST',headers:{...json,Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:project.id,owner_id:session.user.id,name:project.name,mode:project.mode,prompt:project.prompt || null,metadata:project.metadata || {},created_at:new Date(project.createdAt).toISOString(),original_path:originalPath,result_path:resultPath})});
  }
  async function remove(id) {
    // Remove objects first so a failed delete remains retryable from the project list.
    await api('/storage/v1/object/bartz-renders',{method:'DELETE',headers:json,body:JSON.stringify({prefixes:[pathFor(id,'original'),pathFor(id,'result')]})});
    await api('/rest/v1/bartz_projects?id=eq.'+encodeURIComponent(id),{method:'DELETE'});
  }
  async function generate(projectId) {
    const response = await api('/functions/v1/enhance-image',{method:'POST',headers:json,body:JSON.stringify({projectId})});
    return response.json();
  }
  return {login,logout,list,put,remove,generate,get active(){return !!session;},get userId(){return session?.user?.id || null;}};
})();
