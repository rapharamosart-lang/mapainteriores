'use strict';
const quoteToday=new Date(),quoteExpiry=new Date();quoteExpiry.setDate(quoteExpiry.getDate()+15);
renderBudgetReport(document,{
 demo:true,client:'Ana Costa (cliente fictícia)',designer:'Marina Alves (projetista fictícia)',project:'Apartamento Aurora · Maceió / AL',issuedAt:quoteToday.toLocaleDateString('sv-SE'),validUntil:quoteExpiry.toLocaleDateString('sv-SE'),stage:'draft',discountCents:250000,
 items:[
  {room:'Cozinha',description:'Armários inferiores e aéreos em MDF, torre de eletrodomésticos e ferragens. Bancada e eletrodomésticos não inclusos.',quantity:1,unitCents:1850000},
  {room:'Dormitório',description:'Guarda-roupa planejado, cabeceira e dois criados. Acabamentos a definir no projeto executivo.',quantity:1,unitCents:1420000},
  {room:'Sala de estar',description:'Painel para TV, rack suspenso e nichos em acabamento amadeirado.',quantity:1,unitCents:920000},
  {room:'Banheiro',description:'Gabinete sob bancada e armário espelhado. Louças, metais e pedra não inclusos.',quantity:1,unitCents:480000},
  {room:'Serviços',description:'Entrega e montagem dos móveis deste exemplo, no endereço do projeto em Maceió.',quantity:1,unitCents:280000}
 ],
 notes:'Condições fictícias para demonstração:\n40% de entrada (R$ 18.800,00) e 60% na entrega (R$ 28.200,00).\nPrazo ilustrativo: 60 dias úteis após aprovação do projeto executivo e conferência das medidas.\nMateriais, ferragens, medidas e cronograma sujeitos à definição com o projetista. Obras civis, elétrica e hidráulica não inclusas.'
}).catch(error=>{const p=document.createElement('p');p.textContent=error.message;document.body.append(p);});
