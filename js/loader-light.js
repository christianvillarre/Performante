/* Match the index energy field line and traveling shine renderer. */
(() => {
  const scene=document.querySelector('.pw-loader__scene');
  if(!scene)return;
  const paths=[...scene.querySelectorAll('path:not(.pw-loader__line--moving)')];
  if(!paths.length)return;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  canvas.className='pw-loader__light-canvas';scene.appendChild(canvas);scene.classList.add('has-light-canvas');
  const tracks=paths.map(path=>({path,length:path.getTotalLength()}));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,frame=0,stopped=false;
  function resize(){width=scene.clientWidth;height=scene.clientHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  function point(track,t){const p=track.path.getPointAtLength(Math.max(0,Math.min(1,t))*track.length);return {x:p.x/1000*width,y:p.y/700*height};}
  function draw(time){
    if(stopped)return;
    ctx.clearRect(0,0,width,height);
    ctx.globalCompositeOperation='source-over';ctx.lineCap='round';ctx.lineJoin='round';
    const mobile=width<=760;
    tracks.forEach((track,index)=>{
      // Same drawLine / drawShine treatment as the index energy lines.
      ctx.beginPath();
      for(let i=0;i<=100;i++){
        const p=point(track,i/100);
        if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
      }
      ctx.strokeStyle='rgba(222,238,249,.235)';
      ctx.lineWidth=(mobile?.75:1.1);
      ctx.shadowBlur=5;ctx.shadowColor='rgba(160,213,250,.34)';ctx.stroke();ctx.shadowBlur=0;
      const progress=reduced.matches ? .35+index*.15 : (time/[4600,5700,6600][index]+index*.31)%1;
      const trail=mobile?.035:.052;
      for(let i=0;i<12;i++){
        const local=progress-trail+trail*i/11;
        if(local<0 || local>1)continue;
        const a=point(track,local),b=point(track,Math.min(1,local+.0045));
        const weight=1-Math.abs(i/11*2-1);
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(237,249,255,${.08+weight*.48})`;
        ctx.lineWidth=mobile?.85:1.2;
        ctx.shadowBlur=weight*5;ctx.shadowColor='rgba(190,230,255,.65)';ctx.stroke();
      }
      ctx.shadowBlur=0;
    });
    if(!reduced.matches)frame=requestAnimationFrame(draw);
  }
  function stop(){stopped=true;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);}
  resize();frame=requestAnimationFrame(draw);window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('pw:ready',stop,{once:true});window.addEventListener('pagehide',stop,{once:true});
})();
