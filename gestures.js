const detailDialog=document.querySelector('#detail');
const detailShell=detailDialog.querySelector('.detail-shell');
const detailClose=detailDialog.querySelector('.close');
let swipeStartX=0,swipeStartY=0,swipeStartTime=0,swipeDistance=0,isHorizontalSwipe=false;

function resetDetailPosition(){
  detailShell.style.transition='';
  detailShell.style.transform='';
  detailShell.style.opacity='';
  swipeDistance=0;
  isHorizontalSwipe=false;
}

function closeRecipeDetail(returnHome=false){
  if(detailDialog.open)detailDialog.close();
  resetDetailPosition();
  if(returnHome)requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));
}

detailClose.onclick=()=>closeRecipeDetail(false);
detailDialog.addEventListener('close',resetDetailPosition);

detailShell.addEventListener('touchstart',event=>{
  if(event.touches.length!==1)return;
  const touch=event.touches[0];
  swipeStartX=touch.clientX;
  swipeStartY=touch.clientY;
  swipeStartTime=performance.now();
  swipeDistance=0;
  isHorizontalSwipe=false;
  detailShell.style.transition='none';
},{passive:true});

detailShell.addEventListener('touchmove',event=>{
  if(event.touches.length!==1)return;
  const touch=event.touches[0];
  const dx=touch.clientX-swipeStartX;
  const dy=touch.clientY-swipeStartY;
  if(!isHorizontalSwipe&&dx>10&&Math.abs(dx)>Math.abs(dy)*1.15)isHorizontalSwipe=true;
  if(!isHorizontalSwipe||dx<=0)return;
  event.preventDefault();
  swipeDistance=Math.min(dx,window.innerWidth);
  detailShell.style.transform=`translate3d(${swipeDistance}px,0,0)`;
  detailShell.style.opacity=String(Math.max(.35,1-swipeDistance/window.innerWidth*.65));
},{passive:false});

detailShell.addEventListener('touchend',()=>{
  if(!isHorizontalSwipe){resetDetailPosition();return;}
  const elapsed=Math.max(performance.now()-swipeStartTime,1);
  const fast=swipeDistance/elapsed>.45;
  const far=swipeDistance>Math.min(110,window.innerWidth*.22);
  detailShell.style.transition='transform .24s ease-out,opacity .24s ease-out';
  if(fast||far){
    detailShell.style.transform='translate3d(100vw,0,0)';
    detailShell.style.opacity='0';
    setTimeout(()=>closeRecipeDetail(true),240);
  }else{
    detailShell.style.transform='translate3d(0,0,0)';
    detailShell.style.opacity='1';
    setTimeout(resetDetailPosition,240);
  }
},{passive:true});

detailShell.addEventListener('touchcancel',()=>{
  detailShell.style.transition='transform .2s ease-out,opacity .2s ease-out';
  detailShell.style.transform='translate3d(0,0,0)';
  detailShell.style.opacity='1';
  setTimeout(resetDetailPosition,200);
},{passive:true});
