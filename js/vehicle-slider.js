/* Continuous card slider: native scroll, seamless buffers, hover pause and drag. */
(() => {
 document.querySelectorAll('.pw-vehicles').forEach(section=>{
  const track=section.querySelector('.pw-vehicles__track');
  const freeFlow=section.hasAttribute('data-vehicle-free-flow');
  let nudgeVelocity=0;
  // Let the page's smooth-scroll handler receive vertical wheel gestures.
  // Horizontal native scrolling and mouse dragging remain local to the row.
  track.removeAttribute('data-lenis-prevent');
  const cards=[...track.querySelectorAll('.pw-vehicles__card')];
  const pause=section.querySelector('[data-vehicle-pause]');
  const status=section.querySelector('[data-vehicle-status]');
  if(!cards.length)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce) and (max-width: 760px)');
  const mobile=matchMedia('(max-width: 600px)');
  const copy=card=>{const clone=card.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.dataset.copy='true';return clone;};
  const before=cards.map(copy),after=cards.map(copy);
  track.prepend(...before);track.append(...after);
  section.classList.add('is-looping');
  let period=0,step=0,frame=0,last=0,visible=false,hovered=false,focused=false,paused=false,drag=null,manualUntil=0;
  function normalize(){
   if(!period)return;
   if(track.scrollLeft<period || track.scrollLeft>=period*2){
    track.scrollLeft=period+((track.scrollLeft-period)%period+period)%period;
   }
  }
  function measure(){
   const position=period?((track.scrollLeft-period)/period):0;
   period=cards[0].offsetLeft-before[0].offsetLeft;
   step=cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:period;
   track.scrollLeft=period+position*period;normalize();
  }
  function autoEnabled(){return !reduced.matches&&!paused&&(freeFlow||(!hovered&&!focused));}
  function canRun(){return visible&&!document.hidden&&!drag&&(autoEnabled()||Math.abs(nudgeVelocity)>.5);}
  function tick(now){
   frame=0;
   if(!canRun()){last=0;return;}
   const dt=last?Math.min((now-last)/1000,.05):0;last=now;
   if(freeFlow){
    const drift=autoEnabled()&&now>=manualUntil?(mobile.matches?46:30):0;
    track.scrollLeft+=dt*(drift+nudgeVelocity);
    nudgeVelocity*=Math.exp(-5*dt);
    if(Math.abs(nudgeVelocity)<.5)nudgeVelocity=0;
    normalize();
   }else if(now>=manualUntil){track.scrollLeft+=dt*(mobile.matches?46:30);normalize();}
   frame=requestAnimationFrame(tick);
  }
  function sync(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;if(canRun())frame=requestAnimationFrame(tick);}
  function move(direction){
   if(freeFlow){
    if(reduced.matches){track.scrollLeft+=direction*140;normalize();}
    else nudgeVelocity=Math.max(-1200,Math.min(1200,nudgeVelocity+direction*700));
    if(status)status.textContent=direction>0?'Moving vehicles right':'Moving vehicles left';
    sync();return;
   }
   track.scrollLeft+=direction*step;normalize();manualUntil=performance.now()+1800;
   const index=Math.round((track.scrollLeft-period)/step)%cards.length;
   status.textContent=cards[index].dataset.brand;sync();
  }
  section.querySelector('[data-vehicle-prev]').addEventListener('click',()=>move(-1));
  section.querySelector('[data-vehicle-next]').addEventListener('click',()=>move(1));
  pause.addEventListener('click',()=>{
   paused=!paused;pause.textContent=paused?'Play':'Pause';
   pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused?'Play automatic vehicle scrolling':'Pause automatic vehicle scrolling');sync();
  });
  section.addEventListener('pointerenter',event=>{if(!freeFlow&&event.pointerType==='mouse'){hovered=true;sync();}});
  section.addEventListener('pointerleave',()=>{hovered=false;sync();});
  section.addEventListener('focusin',()=>{if(!freeFlow){focused=true;sync();}});
  section.addEventListener('focusout',event=>{focused=section.contains(event.relatedTarget);sync();});
  // Remote desktop apps can send an iPad gesture as a touch pointer to a
  // desktop browser. Handle all pointer types here, leaving vertical swipes
  // to the page and claiming only a horizontal drag.
  track.addEventListener('pointerdown',event=>{
   if(event.pointerType==='mouse'&&event.button!==0)return;
   nudgeVelocity=0;
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,active:false};
   sync();
  });
  track.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   if(!drag.active){
    const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
    if(Math.abs(dx)<6&&Math.abs(dy)<6)return;
    if(Math.abs(dy)>=Math.abs(dx)){drag=null;sync();return;}
    drag.active=true;
    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
   }
   event.preventDefault();
   track.scrollLeft-=event.clientX-drag.x;drag.x=event.clientX;normalize();
  },{passive:false});
  function release(event){
   if(!drag||drag.id!==event.pointerId)return;
   const active=drag.active;
   drag=null;
   if(active)manualUntil=performance.now()+(freeFlow?0:1200);
   track.classList.remove('is-dragging');
   if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);
   sync();
  }
  track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);track.addEventListener('lostpointercapture',release);
  track.addEventListener('wheel',()=>{if(!freeFlow)manualUntil=performance.now()+1800;},{passive:true});
  track.addEventListener('scroll',normalize,{passive:true});
  track.addEventListener('keydown',event=>{
   if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}
  });
  new ResizeObserver(measure).observe(track);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(section);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){drag=null;track.classList.remove('is-dragging');}sync();});
  reduced.addEventListener('change',sync);measure();
 });
})();
