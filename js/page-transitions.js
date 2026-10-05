/* Shared cross-document blinds. Never takes ownership of page scrolling. */
(() => {
  const key='pw-page-transition';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let arrival=false,overlay,busy=false,failsafe;
  try {
    const saved=JSON.parse(sessionStorage.getItem(key)||'null');
    sessionStorage.removeItem(key);
    arrival=!!saved && Date.now()-saved.time<15000 && saved.url===location.href;
  } catch {}
  arrival=arrival || performance.getEntriesByType('navigation')[0]?.type==='back_forward';
  if(arrival)document.documentElement.classList.add('pw-page-entering');
  function reset(){
    clearTimeout(failsafe);busy=false;
    document.documentElement.classList.remove('pw-page-entering');
    overlay?.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
    overlay?.classList.remove('is-active','is-covered');
  }
  async function animate(cover){
    overlay.classList.add('is-active');
    const jobs=[...overlay.children].map((strip,index)=>strip.animate(
      [{transform:`scaleY(${cover?0:1})`},{transform:`scaleY(${cover?1:0})`}],
      {duration:reduced.matches?1:600,delay:reduced.matches?0:(cover?7-index:index)*45,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'}
    ));
    await Promise.all(jobs.map(job=>job.finished.catch(()=>{})));
  }
  document.addEventListener('DOMContentLoaded',()=>{
    overlay=document.createElement('div');overlay.className='pw-page-blinds';overlay.setAttribute('aria-hidden','true');
    for(let i=0;i<8;i++){const strip=document.createElement('span');strip.style.setProperty('--i',i);overlay.appendChild(strip);}
    document.body.appendChild(overlay);
    if(arrival){
      overlay.classList.add('is-active','is-covered');
      document.documentElement.classList.remove('pw-page-entering');
      const ready=window.pwBoot?.ready || (document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true})));
      const limit=window.pwBoot?5000:1200;
      Promise.race([ready,new Promise(resolve=>setTimeout(resolve,limit))]).then(()=>animate(false)).finally(reset);
    }
    document.addEventListener('click',async event=>{
      if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
      const link=event.target.closest?.('a[href]');
      if(!link || link.hasAttribute('download') || (link.target && link.target!=='_self') || link.hasAttribute('data-no-transition'))return;
      const url=new URL(link.href,location.href);
      if(url.origin!==location.origin || !/^https?:$/.test(url.protocol) || (!url.pathname.endsWith('/') && !/\.html$/i.test(url.pathname)))return;
      if(url.pathname===location.pathname && url.search===location.search)return;
      event.preventDefault();if(busy)return;busy=true;
      // Release the cover if a cancelled navigation leaves this document alive.
      failsafe=setTimeout(reset,6000);
      await animate(true);
      try{sessionStorage.setItem(key,JSON.stringify({url:url.href,time:Date.now()}));}catch{}
      location.assign(url.href);
    });
  },{once:true});
  window.addEventListener('pageshow',event=>{
    if(!event.persisted)return;
    reset();
    const toggle=document.getElementById('pwMenuToggle');
    if(toggle?.getAttribute('aria-expanded')==='true')toggle.click();
    if(overlay){overlay.classList.add('is-covered');animate(false).finally(reset);}
  });
})();
