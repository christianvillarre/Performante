(() => {
 const list=document.getElementById('cwFaqList');
 const refresh=()=>{if(window.ScrollTrigger)ScrollTrigger.refresh();};
 if(list){
  const items=[...list.querySelectorAll('.vw-faq-item')];
  function setOpen(item,open){const button=item.querySelector('button'),answer=item.querySelector('.vw-faq-answer');item.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open));answer.setAttribute('aria-hidden',String(!open));answer.style.maxHeight=open?answer.scrollHeight+'px':'0px';}
  list.addEventListener('click',event=>{const button=event.target.closest('.vw-faq-question');if(!button)return;const item=button.closest('.vw-faq-item'),open=!item.classList.contains('is-open');items.forEach(other=>setOpen(other,other===item&&open));});
  list.addEventListener('transitionend',event=>{if(event.propertyName==='max-height')refresh();});
  new ResizeObserver(()=>items.forEach(item=>{if(item.classList.contains('is-open'))setOpen(item,true);})).observe(list);
  if(document.fonts)document.fonts.ready.then(()=>items.forEach(item=>{if(item.classList.contains('is-open'))setOpen(item,true);}));
 }
 const dots=[...document.querySelectorAll('#cwHeroDots button')];
 dots.forEach((button,index)=>{
  const activate=()=>{dots.forEach((dot,i)=>{dot.classList.toggle('is-active',i===index);dot.setAttribute('aria-selected',String(i===index));dot.tabIndex=i===index?0:-1;});document.querySelectorAll('#cwHeroMedia .vw-hero__slide,.vw-hero__media-text').forEach(slide=>{const active=Number(slide.dataset.slide)===index;slide.classList.toggle('is-active',active);if(slide.tagName==='VIDEO'){if(active)slide.play().catch(()=>{});else slide.pause();}});};
  button.tabIndex=index===0?0:-1;button.addEventListener('click',activate);
  button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const next=dots[(index+(event.key==='ArrowRight'?1:-1)+dots.length)%dots.length];next.focus();next.click();});
 });
})();
