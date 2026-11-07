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
      if (response.status === 401) throw new Error('Sua sessão expirou. Saia e entre novamente.');
      if (response.status === 404 || response.status === 400) throw new Error('Verifique o login e se a configuração SQL do Studio foi aplicada no Supabase.');
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
    return Promise.all(rows.map(async r => ({id:r.id,name:r.name,mode:r.mode,createdAt:Date.parse(r.created_at),original:await image(r.original_path),result:r.result_path ? await image(r.result_path) : undefined})));
  }
  async function put(project) {
    const originalPath = pathFor(project.id,'original');
    const resultPath = project.result ? pathFor(project.id,'result') : null;
    await upload(originalPath,project.original);
    if (resultPath) await upload(resultPath,project.result);
    await api('/rest/v1/bartz_projects?on_conflict=id',{method:'POST',headers:{...json,Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:project.id,owner_id:session.user.id,name:project.name,mode:project.mode,created_at:new Date(project.createdAt).toISOString(),original_path:originalPath,result_path:resultPath})});
  }
  async function remove(id) {
    // Remove objects first so a failed delete remains retryable from the project list.
    await api('/storage/v1/object/bartz-renders',{method:'DELETE',headers:json,body:JSON.stringify({prefixes:[pathFor(id,'original'),pathFor(id,'result')]})});
    await api('/rest/v1/bartz_projects?id=eq.'+encodeURIComponent(id),{method:'DELETE'});
  }
  return {login,logout,list,put,remove,get active(){return !!session;}};
})();
