'use strict';
let generating=false;
$('generate-ai').onclick=async()=>{
 if(generating||!current)return;
 if(!BartzCloud.active){notify('Entre na nuvem e salve um projeto nessa conta para gerar com IA.');return;}
 if(current.mode==='upscale'){notify('Ampliação exata ainda não disponível. Crie um projeto no modo Melhorar realismo.');return;}
 if(!confirm('Enviar esta imagem à OpenAI para tratamento? A geração tem custo na conta configurada e substituirá o resultado anterior deste projeto.'))return;
 const id=current.id;generating=true;const button=$('generate-ai');button.disabled=true;button.textContent='Gerando imagem…';
 try{await BartzCloud.generate(id);await refresh();const updated=records.find(p=>p.id===id);if(updated&&current?.id===id)detail(updated);notify('Imagem gerada e salva. Revise os detalhes antes de apresentar ao cliente.');}
 catch(error){notify(error.message);}
 finally{generating=false;button.disabled=false;button.textContent='Melhorar imagem com IA';}
};
