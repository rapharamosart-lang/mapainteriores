// Supabase Edge Function. Deploy with --no-verify-jwt: authentication is verified below.
const cors = {'Access-Control-Allow-Origin':'https://rapharamosart-lang.github.io','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return json({error:'Método não permitido.'},405);
 const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),key=Deno.env.get('OPENAI_API_KEY');
 if(!url||!anon||!key)return json({error:'Processamento ainda não configurado pelo administrador.'},503);
 const authorization=req.headers.get('authorization')||'';
 if(!authorization.startsWith('Bearer '))return json({error:'Entre na sua conta.'},401);
 const headers={apikey:anon,Authorization:authorization};
 try{
  const auth=await fetch(url+'/auth/v1/user',{headers});
  if(!auth.ok)return json({error:'Sessão inválida. Entre novamente.'},401);
  const user=await auth.json();
  if(Number(req.headers.get('content-length')||0)>2048)return json({error:'Solicitação muito grande.'},413);
  const input=await req.text();if(input.length>2048)return json({error:'Solicitação muito grande.'},413);
  let body;try{body=JSON.parse(input);}catch{return json({error:'Solicitação inválida.'},400);}
  if(typeof body.projectId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.projectId))return json({error:'Projeto inválido.'},400);
  const read=await fetch(url+'/rest/v1/bartz_projects?id=eq.'+body.projectId+'&select=*',{headers});
  if(!read.ok)return json({error:'Não foi possível consultar o projeto.'},502);
  const [project]=await read.json();
  if(!project||project.owner_id!==user.id)return json({error:'Projeto não encontrado.'},404);
  if(project.mode==='upscale')return json({error:'Ampliação exata de resolução ainda não disponível. Use realismo.'},400);
  if(!project.prompt||project.prompt.length>12000)return json({error:'Salve uma direção criativa válida no projeto.'},400);
  const originalPath=user.id+'/'+project.id+'/original';
  if(project.original_path!==originalPath)return json({error:'Arquivo inválido.'},400);
  const original=await fetch(url+'/storage/v1/object/authenticated/bartz-renders/'+originalPath,{headers});
  if(!original.ok)return json({error:'Não foi possível ler a imagem original.'},502);
  const blob=await original.blob();
  if(!['image/png','image/jpeg'].includes(blob.type)||blob.size>20*1024*1024)return json({error:'Use PNG ou JPG de até 20 MB.'},400);
  // Atomic user-based reservation: max 5 attempts / UTC day, at least 3 minutes apart.
  const reserve=await fetch(url+'/rest/v1/rpc/bartz_reserve_generation',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}'});
  if(!reserve.ok)return json({error:'O administrador precisa aplicar a migração de geração.'},503);
  if(await reserve.json()!==true)return json({error:'Limite de 5 tentativas por dia ou intervalo de 3 minutos atingido.'},429);
  const form=new FormData();form.append('model','gpt-image-1');form.append('image',blob,blob.type==='image/png'?'original.png':'original.jpg');form.append('prompt',project.prompt);form.append('n','1');form.append('size','auto');form.append('quality','medium');form.append('output_format','png');
  const generated=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+key},body:form,signal:AbortSignal.timeout(180000)});
  if(!generated.ok)return json({error:'A OpenAI não concluiu a geração. Verifique saldo, acesso ao modelo e tente novamente mais tarde.'},502);
  const data=await generated.json();const encoded=data.data?.[0]?.b64_json;
  if(typeof encoded!=='string'||encoded.length>28*1024*1024)return json({error:'A resposta da geração está inválida ou excede o limite do armazenamento.'},502);
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const path=user.id+'/'+project.id+'/result';
  const upload=await fetch(url+'/storage/v1/object/bartz-renders/'+path,{method:'POST',headers:{...headers,'Content-Type':'image/png','x-upsert':'true'},body:bytes});
  if(!upload.ok)return json({error:'Imagem gerada, mas não foi possível armazená-la. Não gere novamente antes de verificar o armazenamento.'},502);
  const patch=await fetch(url+'/rest/v1/bartz_projects?id=eq.'+project.id,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({result_path:path})});
  if(!patch.ok)return json({error:'Imagem salva, mas o vínculo com o projeto falhou. Contate o administrador.'},502);
  return json({ok:true});
 }catch{return json({error:'A operação não terminou. Aguarde e confira o projeto antes de tentar novamente.'},502);}
});
