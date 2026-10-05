(() => {
  const button=document.getElementById('conceptMenuButton');
  const close=document.getElementById('conceptMenuClose');
  const menu=document.getElementById('conceptMenu');
  function setMenu(open){menu.classList.toggle('is-open',open);document.body.classList.toggle('concept-menu-open',open);menu.setAttribute('aria-hidden',String(!open));button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close menu':'Open menu');}
  button.addEventListener('click',()=>setMenu(!menu.classList.contains('is-open')));
  close.addEventListener('click',()=>setMenu(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false)});
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));

  const hero=document.querySelector('.concept-hero');
  const title=document.getElementById('conceptHeroTitle');
  const showcase=document.getElementById('showcase');
  const first=document.getElementById('conceptWorkOne');
  const second=document.getElementById('conceptWorkTwo');
  const fill=document.getElementById('conceptProgressFill');
  const number=document.getElementById('conceptCurrentNumber');
  const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
  let frame=0;
  function update(){
    frame=0;
    const heroRect=hero.getBoundingClientRect();
    const fade=smooth(0,Math.min(420,innerHeight*.48),-heroRect.top);
    title.style.opacity=String(1-fade);
    title.style.transform=`translateY(${-fade*42}px)`;
    const rect=showcase.getBoundingClientRect();
    const travel=Math.max(1,rect.height-innerHeight);
    const p=clamp(-rect.top/travel);
    const firstAlpha=smooth(.015,.16,p)*(1-smooth(.4,.55,p));
    const secondAlpha=smooth(.46,.62,p)*(1-smooth(.94,1,p)*.1);
    for(const [panel,alpha,offset] of [[first,firstAlpha,1-smooth(.015,.16,p)],[second,secondAlpha,1-smooth(.46,.62,p)]]){
      panel.style.opacity=String(alpha);
      panel.style.visibility=alpha<.005?'hidden':'visible';
      panel.style.transform=`translateY(${offset*55}px) scale(${1-offset*.015})`;
      panel.style.pointerEvents=alpha>.5?'auto':'none';
    }
    fill.style.width=`${p*100}%`;
    number.textContent=p>.51?'02':'01';
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});update();
  addEventListener('pageshow',update);

  // Low, moving digital mesh across the hero's bottom edge.
  const canvas=document.getElementById('conceptWave');
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let w,h,dpr,visible=true;
  function resize(){w=canvas.clientWidth;h=canvas.clientHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  function wave(x,row,time){const nx=x/w;const depth=row/15;return h*.78+depth*depth*h*.23+Math.sin(nx*10-time*1.15+row*.24)*h*(.011+depth*.032)+Math.sin(nx*21+time*.65-row*.3)*h*.006}
  function draw(now){
    if(!visible)return;
    const time=motion.matches?0:now*.001;
    ctx.clearRect(0,0,w,h);
    for(let row=0;row<15;row++){
      const depth=row/15,alpha=(.12+depth*.42)*(1-depth*.22);
      ctx.beginPath();
      for(let x=0;x<=w+22;x+=22){const y=wave(x,row,time);if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
      ctx.strokeStyle=`rgba(92,165,237,${alpha})`;ctx.lineWidth=.7+depth*.8;ctx.stroke();
      if(row%2===0)for(let x=(row%4)*34;x<w;x+=68){
        const y=wave(x,row,time);const pulse=Math.pow(Math.max(0,Math.sin(x*.013+time*2-row*.6)),8);
        ctx.fillStyle=`rgba(154,212,255,${alpha*.45+pulse*.45})`;ctx.fillRect(x-1,y-1,2,2);
      }
    }
    for(let x=0;x<w;x+=68){
      ctx.beginPath();for(let row=0;row<15;row++){const y=wave(x,row,time);if(row===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
      ctx.strokeStyle='rgba(92,165,237,.11)';ctx.lineWidth=.6;ctx.stroke();
    }
    if(!motion.matches)requestAnimationFrame(draw);
  }
  resize();requestAnimationFrame(draw);addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(visible)requestAnimationFrame(draw)});
})();
