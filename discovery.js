const tasteOptions=['清爽','酸甜','偏甜','苦甜','果香','醇厚','辛辣','奶油','咖啡'];
const easeOptions=[['two','两种材料'],['three','三种以内'],['noShaker','无需摇壶'],['quick','5分钟内'],['shake','需要摇和'],['blender','需要搅拌机']];
const strengthOptions=['全部','轻盈','适中','强劲'];
const discoveryState={tastes:new Set(),ease:new Set(),strength:'全部'};

function ingredientAlcohol(name){
  if(/阿佩罗/.test(name))return 11;
  if(/起泡酒|普罗塞克/.test(name))return 12;
  if(/味美思/.test(name))return 16;
  if(/蓝橙力娇酒|咖啡利口酒/.test(name))return 20;
  if(/金巴利/.test(name))return 25;
  if(/橙味利口酒/.test(name))return 30;
  if(/苦精/.test(name))return 45;
  if(/金酒|朗姆|伏特加|龙舌兰|威士忌/.test(name))return 40;
  return 0;
}
function estimateAlcohol(recipe){
  let total=0,alcohol=0;
  recipe.ingredients.forEach(([name,amount])=>{
    let volume=/ml/i.test(amount)?parseFloat(amount):0;
    if(!volume&&/适量/.test(amount)&&/可乐|汽水|苏打水|姜汁啤酒/.test(name))volume=90;
    total+=volume;alcohol+=volume*ingredientAlcohol(name)/100;
  });
  const abv=total?Math.round(alcohol/total*100):0;
  return{abv,strength:abv<15?'轻盈':abv<25?'适中':'强劲'};
}

function recipeFacts(recipe){
  const text=[...recipe.profile,recipe.intro,...recipe.steps,...recipe.ingredients.flat()].join(' ');
  const ingredientCount=recipe.ingredients.filter(([name])=>!basic.has(name)&&!basic.has(clean(name))).length;
  const blender=/搅拌机|搅打/.test(text),shake=/摇和|摇壶|干摇/.test(text),stir=!shake&&/调酒杯|搅拌约|充分搅拌|平稳搅拌/.test(text);
  const alcohol=estimateAlcohol(recipe);
  const tastes=new Set();
  recipe.profile.forEach(tag=>{
    if(tasteOptions.includes(tag))tastes.add(tag);
    if(/微甜|甜美/.test(tag))tastes.add('偏甜');
    if(/微苦/.test(tag))tastes.add('苦甜');
    if(/果香|橙香|柑橘|莓果|热带/.test(tag))tastes.add('果香');
    if(/醇厚|麦芽|焦糖|浓烈/.test(tag))tastes.add('醇厚');
    if(/奶油|绵滑/.test(tag))tastes.add('奶油');
  });
  if(/咖啡/.test(text))tastes.add('咖啡');
  if(/苏打|汽水|汤力水|起泡酒|姜汁啤酒/.test(text))tastes.add('清爽');
  return{ingredientCount,blender,shake,stir,strength:alcohol.strength,abv:alcohol.abv,tastes,time:parseInt(recipe.time)||99};
}

function recipeMatchesDiscovery(recipe){
  const f=recipeFacts(recipe);
  if(discoveryState.tastes.size&&![...discoveryState.tastes].some(x=>f.tastes.has(x)))return false;
  if(discoveryState.strength!=='全部'&&f.strength!==discoveryState.strength)return false;
  for(const key of discoveryState.ease){
    if(key==='two'&&f.ingredientCount!==2)return false;
    if(key==='three'&&f.ingredientCount>3)return false;
    if(key==='noShaker'&&f.shake)return false;
    if(key==='quick'&&f.time>5)return false;
    if(key==='shake'&&!f.shake)return false;
    if(key==='blender'&&!f.blender)return false;
  }
  return true;
}

function renderDiscoveryControls(){
  $('#tasteFilters').innerHTML=tasteOptions.map(x=>`<button data-taste="${x}" class="${discoveryState.tastes.has(x)?'active':''}">${x}</button>`).join('');
  $('#easeFilters').innerHTML=easeOptions.map(([key,label])=>`<button data-ease="${key}" class="${discoveryState.ease.has(key)?'active':''}">${label}</button>`).join('');
  $('#strengthFilters').innerHTML=strengthOptions.map(x=>`<button data-strength="${x}" class="${discoveryState.strength===x?'active':''}">${x}</button>`).join('');
}

function applyDiscovery(){
  const cards=[...grid.querySelectorAll('.recipe-card')];
  let visible=0;
  cards.forEach(card=>{
    const recipe=recipes.find(r=>r.name===card.dataset.name),facts=recipeFacts(recipe),show=recipeMatchesDiscovery(recipe);
    card.classList.toggle('discovery-hidden',!show);
    if(show)visible++;
    if(!card.querySelector('.discovery-meta')){
      const meta=document.createElement('div');meta.className='discovery-meta';meta.innerHTML=`<span>${facts.strength} · 约 ${facts.abv}%</span><span>${facts.ingredientCount} 种材料</span>`;
      card.querySelector('.intro').after(meta);
    }
  });
  $('#resultCount').textContent=`${visible} 款酒`;
  const empty=$('#empty');
  if(cards.length&&visible===0){empty.hidden=false;empty.classList.add('discovery-empty');empty.querySelector('b').textContent='没有符合全部条件的酒';empty.querySelector('p').textContent='减少一个口味、便捷条件或酒精强度试试。'}
  else if(visible>0){empty.hidden=true;empty.classList.remove('discovery-empty')}
}

$('#tasteFilters').onclick=e=>{const b=e.target.closest('[data-taste]');if(!b)return;discoveryState.tastes.has(b.dataset.taste)?discoveryState.tastes.delete(b.dataset.taste):discoveryState.tastes.add(b.dataset.taste);renderDiscoveryControls();applyDiscovery()};
$('#easeFilters').onclick=e=>{const b=e.target.closest('[data-ease]');if(!b)return;discoveryState.ease.has(b.dataset.ease)?discoveryState.ease.delete(b.dataset.ease):discoveryState.ease.add(b.dataset.ease);renderDiscoveryControls();applyDiscovery()};
$('#strengthFilters').onclick=e=>{const b=e.target.closest('[data-strength]');if(!b)return;discoveryState.strength=b.dataset.strength;renderDiscoveryControls();applyDiscovery()};
new MutationObserver(applyDiscovery).observe(grid,{childList:true});
renderDiscoveryControls();applyDiscovery();
