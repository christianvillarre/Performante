/* ========================================================================== */
/* js\loader-light.js */
/* ========================================================================== */
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

;

/* ========================================================================== */
/* js\site-loader.js */
/* ========================================================================== */
/* Prepare independent resource groups without waiting for window.load. */
(() => {
  const boot=window.pwBoot;
  if(!boot || boot.released)return;
  const screen=document.getElementById('pwLoader');
  const page=document.getElementById('pwPage');
  const progress=document.getElementById('pwLoadProgress');
  const bar=document.getElementById('pwLoadBar');
  const message=document.getElementById('pwLoadMessage');
  let logoParts=[...document.querySelectorAll('.pw-loader__logo-part')];
  // Keep every logo bar fixed; a white mask fills across its dark silhouette.
  function revealLogo(fraction){
    logoParts.forEach((part,index)=>{
      const start=index/Math.max(1,logoParts.length-1)*.72;
      const amount=Math.max(0,Math.min(1,(fraction-start)/.28));
      const eased=amount*amount*(3-2*amount);
      const ink=part.querySelector('img');
      if(!ink)return;
      if(index===1){
        const top=Number(part.dataset.maskTop ?? index/logoParts.length*100);
        const bottom=Number(part.dataset.maskBottom ?? (index+1)/logoParts.length*100);
        ink.style.clipPath=`inset(0 0 ${100-top-(bottom-top)*eased}% 0)`;
      }else{
        ink.style.clipPath=`inset(0 ${(1-eased)*100}% 0 0)`;
      }
    });
  }
  async function prepareLogoBars(){
    const source=document.querySelector('.pw-loader__logo-ghost');
    const holder=source?.parentElement;
    if(!source || !holder)return;
    if(!source.complete){
      await new Promise(resolve=>{
        const done=()=>{clearTimeout(timer);source.removeEventListener('load',done);source.removeEventListener('error',done);resolve();};
        const timer=setTimeout(done,8000);
        source.addEventListener('load',done,{once:true});source.addEventListener('error',done,{once:true});
      });
    }
    if(!source.naturalWidth || boot.released || finishing)return;
    const width=Math.min(320,source.naturalWidth);
    const height=Math.max(1,Math.round(width*source.naturalHeight/source.naturalWidth));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return;
    context.drawImage(source,0,0,width,height);
    const pixels=context.getImageData(0,0,width,height).data;
    const count=width*height,labels=new Int32Array(count);labels.fill(-1);
    const queue=new Int32Array(count),components=[];
    let transparent=0;
    for(let i=0;i<count;i++)if(pixels[i*4+3]<16)transparent++;
    if(transparent<count*.05)return;
    for(let seed=0;seed<count;seed++){
      if(labels[seed]>=0 || pixels[seed*4+3]<16)continue;
      const id=components.length;let head=0,tail=1,sumX=0,sumY=0;
      queue[0]=seed;labels[seed]=id;
      while(head<tail){
        const pixel=queue[head++],x=pixel%width,y=Math.floor(pixel/width);sumX+=x;sumY+=y;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const xx=x+dx,yy=y+dy;if(xx<0 || xx>=width || yy<0 || yy>=height)continue;
          const next=yy*width+xx;
          if(labels[next]<0 && pixels[next*4+3]>=16){labels[next]=id;queue[tail++]=next;}
        }
      }
      components.push({id,area:tail,x:sumX/tail,y:sumY/tail});
    }
    const biggest=Math.max(0,...components.map(c=>c.area));
    const bars=components.filter(c=>c.area>=biggest*.025).sort((a,b)=>b.area-a.area).slice(0,8).sort((a,b)=>a.y-b.y || a.x-b.x);
    if(bars.length<2)return;
    const nearest=(x,y)=>bars.reduce((best,c,index)=>Math.hypot(c.x-x,c.y-y)<Math.hypot(bars[best].x-x,bars[best].y-y)?index:best,0);
    const componentBars=components.map(c=>{const own=bars.findIndex(bar=>bar.id===c.id);return own>=0?own:nearest(c.x,c.y);});
    const masks=bars.map(()=>context.createImageData(width,height));
    for(let i=0;i<count;i++){
      if(!pixels[i*4+3])continue;
      const bar=labels[i]>=0?componentBars[labels[i]]:nearest(i%width,Math.floor(i/width));
      const data=masks[bar].data;data[i*4]=data[i*4+1]=data[i*4+2]=data[i*4+3]=255;
    }
    const decodedParts=[];
    const parts=masks.map(mask=>{
      context.putImageData(mask,0,0);
      const part=document.createElement('span');part.className='pw-loader__logo-part';
      const maskUrl=canvas.toDataURL();
      const maskImage=new Image();maskImage.src=maskUrl;
      if(maskImage.decode)decodedParts.push(maskImage.decode());
      const url=`url("${maskUrl}")`;
      part.style.maskImage=url;part.style.webkitMaskImage=url;
      const longest=Math.max(width,height);
      let minY=height,maxY=0;
      for(let pixel=0;pixel<width*height;pixel++){
        if(mask.data[pixel*4+3]){
          const y=Math.floor(pixel/width);
          minY=Math.min(minY,y);maxY=Math.max(maxY,y+1);
        }
      }
      // Account for the centered object-fit image within the square logo.
      part.dataset.maskTop=String(((longest-height)/2+minY)/longest*100);
      part.dataset.maskBottom=String(((longest-height)/2+maxY)/longest*100);
      const size=`${width/longest*100}% ${height/longest*100}%`;
      part.style.maskSize=size;part.style.webkitMaskSize=size;
      part.style.maskPosition='center';part.style.webkitMaskPosition='center';
      const img=source.cloneNode(false);img.className='';img.removeAttribute('id');
      if(img.decode)decodedParts.push(img.decode());
      part.appendChild(img);return part;
    });
    // On a cold load, decode the new artwork and masks before starting reveals.
    // Cached images previously skipped this gap, producing a different first run.
    await bounded(Promise.all(decodedParts),8000,'Loader artwork');
    if(boot.released || finishing)return;
    logoParts.forEach(part=>part.remove());
    parts.forEach(part=>holder.appendChild(part));logoParts=parts;
    revealLogo(0);
    // Commit hidden masks before the first progress transition, even from cache.
    void holder.offsetWidth;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  }

  if(page)page.inert=true;
  screen.focus?.({preventScroll:true});
  const state={assets:0,images:0,backgrounds:0,fonts:0,logo:0};
  const failures=new Set(),imageCache=new Map(),backgroundQueue=new Set();
  const pendingWork=new Map();
  // Expose actual pending work for diagnosing a host-specific slow request.
  boot.loadingStatus=()=>({pending:[...pendingWork.values()],failed:[...failures],hero:{...boot.hero},progress:displayed});
  let displayed=0,finishing=false;
  function finish(partial=false){
    if(finishing || boot.released)return;
    finishing=true;clearTimeout(overallDeadline);
    revealLogo(1);
    bar.style.transform='scaleX(1)';
    progress.setAttribute('aria-valuenow','100');
    if(partial || failures.size || boot.hero.error){
      message.textContent='Some content is still unavailable';
      console.warn('Some site assets were unavailable or took too long to load.',[...failures],boot.hero.error || '');
    }else{
      progress.setAttribute('aria-valuenow','100');message.textContent='Welcome to Performante';
    }
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      try{window.ScrollTrigger?.refresh();window.lenis?.resize();}
      catch(error){console.warn('Layout refresh deferred:',error);}
      finally{boot.release();}
    }));
  }
  function paint(){
    if(finishing || boot.released)return;
    const fraction=state.assets*.2+state.images*.27+state.logo*.03+state.backgrounds*.05+state.fonts*.1+boot.hero.fraction*.35;
    displayed=Math.max(displayed,Math.min(99,Math.floor(fraction*100)));
    if(state.logo===1)revealLogo(displayed/100);
    bar.style.transform=`scaleX(${displayed/100})`;
    progress.setAttribute('aria-valuenow',String(displayed));
    if(state.images<1)message.textContent='Preparing the opening images';
    else if(state.assets<1)message.textContent='Preparing the experience';
    else if(state.backgrounds<1 || state.fonts<1)message.textContent='Setting the finishing touches';
    else if(!boot.hero.done)message.textContent='Preparing the 3D logo and lighting';
    // Entry needs the opening artwork and fonts; the rest can finish in-page.
    if(state.images===1 && state.logo===1 && state.fonts===1 &&
      (boot.hero.done || performance.now()-boot.startedAt>=1800))finish();
  }
  // Bounded waits apply to failures.
  const overallDeadline=setTimeout(()=>finish(true),Math.max(0,4400-(performance.now()-boot.startedAt)));
  setTimeout(paint,Math.max(0,1800-(performance.now()-boot.startedAt)));
  window.addEventListener('pw:load-progress',paint);
  function bounded(promise,timeout,label){
    return new Promise(resolve=>{
      let settled=false;pendingWork.set(label,{kind:"readiness",url:label});
      const end=ok=>{if(settled)return;settled=true;clearTimeout(timer);pendingWork.delete(label);if(!ok)failures.add(label);resolve(ok);};
      const timer=setTimeout(()=>end(false),timeout);
      promise.then(()=>end(true),()=>end(false));
    });
  }
  function resourceReady(element){
    const label=element.src || element.href;
    const cached=boot.resources?.get(element);
    if(cached){if(!cached.ok)failures.add(label);return Promise.resolve(cached.ok);}
    if(element.tagName==='LINK' && element.sheet)return Promise.resolve(true);
    return new Promise(resolve=>{
      let settled=false;
      const end=ok=>{
        if(settled)return;settled=true;clearTimeout(timer);
        pendingWork.delete(element);
        element.removeEventListener('load',loaded);element.removeEventListener('error',errored);
        if(!ok)failures.add(label);resolve(ok);
      };
      const loaded=()=>end(true),errored=()=>end(false);
      pendingWork.set(element,{kind:'script/style',url:label});
      const timer=setTimeout(()=>end(false),15000);
      element.addEventListener('load',loaded,{once:true});element.addEventListener('error',errored,{once:true});
    });
  }
  function prepareImage(url,critical=true){
    if(imageCache.has(url))return imageCache.get(url);
    const pending=new Promise(resolve=>{
      const image=new Image();image.decoding='async';image.fetchPriority=critical?'high':'low';let settled=false;
      if(critical)pendingWork.set(image,{kind:'image/decode',url});
      const end=ok=>{
        if(settled)return;settled=true;clearTimeout(timer);image.onload=null;image.onerror=null;
        pendingWork.delete(image);if(!ok && critical)failures.add(url);resolve(ok);
      };
      const timer=setTimeout(()=>end(false),8000);
      image.onload=async()=>{
        try{if(critical && image.decode)await image.decode();end(image.naturalWidth>0);}catch{end(false);}
      };
      image.onerror=()=>end(false);image.src=url;
    });
    imageCache.set(url,pending);return pending;
  }
  async function prepareImages(urls,key){
    let cursor=0,completed=0;
    const worker=async()=>{
      while(cursor<urls.length && !boot.released){
        await prepareImage(urls[cursor++]);state[key]=++completed/urls.length;paint();
      }
    };
    await Promise.all(Array.from({length:Math.min(4,urls.length)},worker));
    state[key]=1;paint();
  }
  function addUrl(urls,raw,base=document.baseURI){
    if(!raw || raw.startsWith('data:'))return;
    try{urls.add(new URL(raw,base).href);}catch{}
  }
  function visibleBackgroundUrls(){
    const urls=new Set();
    const collect=(text,base)=>{
      for(const match of text.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)){
        if(!match[1].startsWith('#') && !/\.(?:woff2?|ttf|otf|css)(?:[?#]|$)/i.test(match[1]))addUrl(urls,match[1].trim(),base);
      }
    };
    // Only backgrounds on opening-view elements gate entry. Offscreen footer
    // and gallery backgrounds download later instead of holding the loader.
    const height=window.innerHeight || 800;
    const scan=rules=>{
      for(const rule of rules){
        if(rule.cssRules){scan(rule.cssRules);continue;}
        if(!rule.selectorText || !rule.style?.backgroundImage || rule.style.backgroundImage==='none')continue;
        try{
          for(const node of document.querySelectorAll(rule.selectorText)){
            const rect=node.getBoundingClientRect();
            if(rect.width>0 && rect.height>0 && rect.top<height*1.3 && rect.bottom>0)collect(getComputedStyle(node).backgroundImage,document.baseURI);
            else collectBackgroundLater(rule.style.backgroundImage);
          }
        }catch{}
      }
    };
    const collectBackgroundLater=text=>{
      for(const match of text.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g))addUrl(backgroundQueue,match[1].trim());
    };
    for(const sheet of document.styleSheets){try{scan(sheet.cssRules);}catch{}}
    for(const node of document.querySelectorAll('[style]')){
      const rect=node.getBoundingClientRect();
      if(rect.width>0 && rect.height>0 && rect.top<height*1.3 && rect.bottom>0)collect(getComputedStyle(node).backgroundImage,document.baseURI);
    }
    return [...urls];
  }
  const urls=new Set();
  for(const img of document.images){
    if(!img.getAttribute('src'))continue;
    const url=img.currentSrc || img.src;
    const opening=img.closest?.('.pw-loader,.pw-nav,.hero');
    if(opening)addUrl(urls,url);
    else addUrl(backgroundQueue,url);
  }
  prepareImages([...urls],'images');
  prepareLogoBars().catch(()=>{}).finally(()=>{state.logo=1;paint();});
  async function warmRemainingImages(){
    const remaining=[...backgroundQueue].filter(url=>!imageCache.has(url));let cursor=0;
    const worker=async()=>{while(cursor<remaining.length)await prepareImage(remaining[cursor++],false);};
    await Promise.all([worker(),worker()]);
  }
  const scheduleBackground=()=>{
    if(window.requestIdleCallback)window.requestIdleCallback(warmRemainingImages,{timeout:1200});
    else setTimeout(warmRemainingImages,250);
  };
  if(boot.ready)boot.ready.then(scheduleBackground);
  else window.addEventListener('pw:ready',scheduleBackground,{once:true});
  const resources=[...document.querySelectorAll('script[src],link[rel="stylesheet"]')];
  let resourceCount=0;
  const tasks=resources.map(element=>({element,promise:resourceReady(element).then(ok=>{
    state.assets=++resourceCount/resources.length;paint();return ok;
  })}));
  if(!resources.length){state.assets=1;paint();}
  Promise.all(tasks.filter(task=>task.element.tagName==='LINK').map(task=>task.promise)).then(()=>{
    void document.body.offsetHeight;
    prepareImages(visibleBackgroundUrls(),'backgrounds');
  });
  bounded(document.fonts?.ready || Promise.resolve(),1200,'Web fonts').then(()=>{state.fonts=1;paint();});
  paint();
})();

;

/* ========================================================================== */
/* js\navbar-black.js */
/* ========================================================================== */
/* =====================================================
   PERFORMANTE WRAPS — NAVBAR JS
   Extracted 1:1 from performante-wraps__9_.html
   Requires: GSAP core (https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js)
   Optional: GSAP ScrollTrigger, for the "light background" section-aware
             pill theming — this block no-ops cleanly if ScrollTrigger
             or .wrap-light-section elements aren't present on the page.
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;
  if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  const nav = document.getElementById("pwNav");
  const drawer = document.getElementById("pwMenu");
  const backdrop = document.getElementById("pwMenuBackdrop");
  const toggle = document.getElementById("pwMenuToggle");
  const close = document.getElementById("pwMenuClose");
  if (!drawer || !backdrop || !toggle || !close) {
    console.error("Performante menu could not initialize: one or more menu elements are missing.");
    return;
  }

  const links = gsap.utils.toArray(".pw-menu__links a");
  const footerItems = gsap.utils.toArray(".pw-menu__footer > *");
  const topItems = gsap.utils.toArray(".pw-menu__top > *");
  const menuContent = [...topItems, ...links, ...footerItems];
  let menuOpen = false;
  const simpleMenu = document.body.classList.contains("index2-menu");
  const mobileMenuMedia=window.matchMedia('(max-width:760px)');
  let browserTheme=document.querySelector('meta[name="theme-color"]');
  if(!browserTheme){
    browserTheme=document.createElement('meta');
    browserTheme.name='theme-color';browserTheme.content='#000000';
    document.head.appendChild(browserTheme);
  }
  const defaultBrowserTheme=browserTheme.content;
  const syncMobileBrowserTheme=()=>{
    const mobileOpen=mobileMenuMedia.matches && menuOpen;
    document.documentElement.dataset.pwMobileMenuOpen=String(mobileOpen);
    // Keep browser chrome stable: mobile browsers can defer dynamic tint updates.
    browserTheme.content=mobileMenuMedia.matches?'#000000':defaultBrowserTheme;
  };
  mobileMenuMedia.addEventListener('change',syncMobileBrowserTheme);
  syncMobileBrowserTheme();

  gsap.set(drawer, {
    display: "none",
    scaleX: 0.96,
    scaleY: 1,
    y: -10,
    autoAlpha: 0,
    borderRadius: 42,
    clipPath: simpleMenu ? "inset(0% 0% 100% 0% round 24px)" : "inset(0% 0% 92% 0% round 42px 42px 120px 120px)",
    visibility: "hidden",
    pointerEvents: "none"
  });
  gsap.set(backdrop, {
    autoAlpha: 0,
    visibility: "hidden",
    pointerEvents: "none"
  });
  gsap.set([links, footerItems], { y: 24, autoAlpha: 0, filter: "blur(10px)" });

  const openMenu = () => {
    if (menuOpen) return;
    menuOpen = true;
    syncMobileBrowserTheme();
    drawer.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    nav?.classList.add("pw-nav--menu-open");
    if(simpleMenu)gsap.set(toggle,{opacity:1,color:"#111"});
    requestAnimationFrame(() => syncHeaderPillColors());
    const toggleLabel = toggle.querySelector(".pw-nav__toggle-label");
    if (toggleLabel) toggleLabel.textContent = "Close";

    const tl = gsap.timeline();
    tl.set(drawer, { display: "flex" })
      .set([drawer, backdrop], { visibility: "visible", pointerEvents: "auto" })
      .to(backdrop, { autoAlpha: 1, duration: .2, ease: "power2.out" }, 0)
      .to(drawer, {
        scaleX: 1,
        scaleY: 1,
        y: 0,
        autoAlpha: 1,
        borderRadius: 24,
        clipPath: "inset(0% 0% 0% 0% round 24px)",
        duration: simpleMenu ? .68 : .86,
        ease: "power4.out"
      }, 0)
      .to(links, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .62, stagger: .06, ease: "power3.out" }, .28)
      .to(footerItems, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .5, stagger: .05, ease: "power2.out" }, .52);
  };

  const closeMenu = () => {
    if (!menuOpen) return;
    menuOpen = false;
    syncMobileBrowserTheme();
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    if(!simpleMenu){
      nav?.classList.remove("pw-nav--menu-open");
      requestAnimationFrame(() => syncHeaderPillColors());
    }else{
      gsap.set(toggle,{opacity:1,color:"#111"});
    }
    const toggleLabel = toggle.querySelector(".pw-nav__toggle-label");
    if (toggleLabel) toggleLabel.textContent = "Menu";

    gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        if(simpleMenu){
          nav?.classList.remove("pw-nav--menu-open");
          gsap.set(toggle,{opacity:1});
          syncHeaderPillColors();
        }
        drawer.setAttribute("aria-hidden", "true");
        backdrop.setAttribute("aria-hidden", "true");
        gsap.set([drawer, backdrop], {
          visibility: "hidden",
          pointerEvents: "none"
        });
        // Remove the white fixed surface after its exit animation. Opacity alone
        // leaves it in the composited page even though the menu looks closed.
        gsap.set(drawer, {
          display: "none",
          overflow: "hidden",
          scaleX: 0.96,
          scaleY: 1,
          y: -10,
          autoAlpha: 0,
          borderRadius: 42,
          clipPath: simpleMenu ? "inset(0% 0% 100% 0% round 24px)" : "inset(0% 0% 92% 0% round 42px 42px 120px 120px)"
        });
        syncMobileBrowserTheme();
        gsap.set(topItems, {
          y: 0,
          autoAlpha: 1,
          filter: "blur(0px)"
        });
        gsap.set([links, footerItems], {
          y: 24,
          autoAlpha: 0,
          filter: "blur(10px)"
        });
      }
    })
    /* Hide every control first, including Menu and Close. */
    .to(menuContent, {
      y: -10,
      autoAlpha: 0,
      filter: "blur(7px)",
      duration: .20,
      stagger: {
        each: .012,
        from: "end"
      },
      ease: "power2.in"
    }, 0)

    /* Only fold the panel after the top-right Close control is gone. */
    .set(drawer, {
      overflow: "hidden",
      clipPath: simpleMenu ? "inset(0% 0% 0% 0% round 24px)" : "none",
      transformOrigin: "top center"
    }, .23)
    .to(drawer, {
      scaleX: 1,
      scaleY: simpleMenu ? 1 : 0.08,
      y: simpleMenu ? 0 : -4,
      autoAlpha: 0,
      clipPath: simpleMenu ? "inset(0% 0% 100% 0% round 24px)" : "none",
      borderRadius: 34,
      duration: .44,
      ease: "power2.inOut"
    }, .24)
    .to(backdrop, {
      autoAlpha: 0,
      duration: .30,
      ease: "power2.inOut"
    }, .30);
  };

  toggle?.addEventListener("click", () => menuOpen ? closeMenu() : openMenu());
  close?.addEventListener("click", closeMenu);
  backdrop?.addEventListener("click", closeMenu);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  const blockPageScroll = (event) => {
    if (!menuOpen) return;
    if (drawer.contains(event.target)) return;
    event.preventDefault();
  };
  window.addEventListener("wheel", blockPageScroll, { passive:false });
  window.addEventListener("touchmove", blockPageScroll, { passive:false });

  /* Single, stable interaction system for pills and menu links. */
  const headerPills = gsap.utils.toArray(".pw-nav__chat, .pw-nav__toggle");

  headerPills.forEach((pill) => {
    const simpleHamburger = document.body.classList.contains("index2-menu") && pill.id === "pwMenuToggle";
    let fill = pill.querySelector(".pw-pill-fill");
    if (!fill) {
      fill = document.createElement("span");
      fill.className = "pw-pill-fill";
      fill.setAttribute("aria-hidden", "true");
      pill.prepend(fill);
    }

    const setFillGeometry = (event) => {
      const rect = pill.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const farX = Math.max(x, rect.width - x);
      const farY = Math.max(y, rect.height - y);
      const diameter = Math.hypot(farX, farY) * 2.15;
      gsap.set(fill, { left:x, top:y, width:diameter, height:diameter });
    };

    const restingPillColor = () =>
      (nav?.classList.contains("pw-nav--menu-open") || nav?.classList.contains("pw-nav--light-bg")) ? "#111" : "#fff";

    const hoverPillColor = () =>
      (nav?.classList.contains("pw-nav--menu-open") || nav?.classList.contains("pw-nav--light-bg")) ? "#fff" : "#111";

    const fillColor = () =>
      (nav?.classList.contains("pw-nav--menu-open") || nav?.classList.contains("pw-nav--light-bg")) ? "#111" : "#fff";

    pill.addEventListener("pointerenter", (event) => {
      if (simpleHamburger) {
        gsap.to(pill, { color:restingPillColor(), opacity:.68, duration:.22, overwrite:true });
        return;
      }
      setFillGeometry(event);
      gsap.killTweensOf([fill, pill]);
      gsap.set(fill, { backgroundColor: fillColor() });
      gsap.to(pill, {
        color: hoverPillColor(),
        duration: .22,
        ease: "power2.out",
        overwrite: true
      });
      gsap.fromTo(fill, { scale:0 }, {
        scale:1,
        duration:.48,
        ease:"power3.out",
        overwrite:true
      });
    });

    pill.addEventListener("pointerleave", (event) => {
      if (simpleHamburger) {
        gsap.to(pill, { color:restingPillColor(), opacity:1, duration:.22, overwrite:true });
        return;
      }
      setFillGeometry(event);
      gsap.killTweensOf([fill, pill]);
      gsap.to(pill, {
        color: restingPillColor(),
        duration: .22,
        ease: "power2.out",
        overwrite: true
      });
      gsap.to(fill, {
        scale:0,
        duration:.34,
        ease:"power2.inOut",
        overwrite:true
      });
    });
  });

  const syncHeaderPillColors = () => {
    const lightState =
      nav?.classList.contains("pw-nav--menu-open") ||
      nav?.classList.contains("pw-nav--light-bg");

    headerPills.forEach((pill) => {
      const hovered = pill.matches(":hover");
      gsap.killTweensOf(pill);
      gsap.set(pill, {
        color: simpleHamburger ? (lightState ? "#111" : "#fff") : hovered
          ? (lightState ? "#fff" : "#111")
          : (lightState ? "#111" : "#fff")
      });

      const fill = pill.querySelector(".pw-pill-fill");
      if (fill) {
        gsap.set(fill, {
          backgroundColor: lightState ? "#111" : "#fff"
        });
      }
    });
  };

  window.syncPerformanteHeaderTheme = syncHeaderPillColors;

  links.forEach((link) => {
    if (!link.dataset.splitReady) {
      const text = link.textContent.trim();
      link.textContent = "";
      [...text].forEach((char) => {
        const span = document.createElement("span");
        span.className = "pw-menu-letter";
        span.textContent = char === " " ? " " : char;
        link.appendChild(span);
      });
      link.dataset.splitReady = "true";
    }

    // Absolute positioning puts every arrow on the same right-hand rail.
    let arrow=link.querySelector('.pw-menu-link-arrow');
    if(!arrow){
      arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');
      arrow.classList.add('pw-menu-link-arrow');
      arrow.setAttribute('viewBox','0 0 24 24');
      arrow.setAttribute('aria-hidden','true');
      arrow.setAttribute('focusable','false');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M4 12h15m-6-6 6 6-6 6');
      arrow.appendChild(path);link.appendChild(arrow);
    }
    gsap.set(arrow,{x:-7,autoAlpha:0});
    const letters = gsap.utils.toArray(".pw-menu-letter", link);
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    // Keep the complete link name available to assistive technology.
    link.setAttribute('aria-label',letters.map(letter=>letter.textContent).join(''));
    letters.forEach(letter=>letter.setAttribute('aria-hidden','true'));
    gsap.set(letters,{x:0,y:0,rotation:0,scale:1,autoAlpha:1,clearProps:'filter'});
    // One reversible animation: no blur, random offsets or jump on re-entry.
    // Animate the letters only, leaving the drawer's link entrance untouched.
    const rollover=gsap.timeline({paused:true});
    if(simpleMenu){
      rollover.to(letters,{x:3,duration:.18,stagger:{each:.012,from:'start'},ease:'power2.out'});
    }else{
      rollover.to(letters,{x:4,y:-1,duration:.32,stagger:{amount:.08,from:'start'},ease:'power3.out'});
    }
    rollover.to(arrow,{x:0,autoAlpha:1,duration:.26,ease:'power3.out'},.04);
    let pointerInside=false;
    function syncRollover(){
      const active=pointerInside || document.activeElement===link;
      if(motion.matches){rollover.pause(0);gsap.set(arrow,{x:0,autoAlpha:active?1:0});return;}
      if(simpleMenu){
        if(active){
          gsap.killTweensOf(letters);
          gsap.fromTo(letters,{x:0},{x:3,duration:.18,stagger:{each:.012,from:'start'},ease:'power2.out',overwrite:true});
          gsap.to(arrow,{x:0,autoAlpha:1,duration:.18,overwrite:true});
        }else{
          gsap.killTweensOf(letters);
          gsap.to(letters,{x:0,scale:1,filter:'blur(0px)',color:'#111',textShadow:'none',duration:.12,overwrite:true});
          gsap.to(arrow,{x:-7,autoAlpha:0,duration:.12,overwrite:true});
        }
        return;
      }
      rollover.timeScale(active?1:1.25);
      if(active)rollover.play();else rollover.reverse();
    }
    link.addEventListener('pointerenter',event=>{
      if(event.pointerType==='touch')return;
      pointerInside=true;syncRollover();
    });
    link.addEventListener('pointerleave',()=>{pointerInside=false;syncRollover();});
    link.addEventListener('focus',syncRollover);
    link.addEventListener('blur',syncRollover);
    motion.addEventListener('change',syncRollover);
  });
});

/* =====================================================
   OPTIONAL: header theme over white/light page sections.
   Requires GSAP ScrollTrigger + elements with class "wrap-light-section".
   Cleanly no-ops if either is absent, so it's safe to include everywhere.
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("pwNav");
  if (!nav) return;
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const whiteSections = gsap.utils.toArray(".wrap-light-section");
  if (!whiteSections.length) return;

  let activeWhiteSections = 0;
/*
  const applyHeaderTheme = () => {
    nav.classList.toggle("pw-nav--light-bg", activeWhiteSections > 0);

    if (typeof window.syncPerformanteHeaderTheme === "function") {
      window.syncPerformanteHeaderTheme();
    } else {
      const lightState =
        nav.classList.contains("pw-nav--light-bg") ||
        nav.classList.contains("pw-nav--menu-open");

      nav.querySelectorAll(".pw-nav__chat, .pw-nav__toggle").forEach((pill) => {
        if (!pill.matches(":hover")) {
          gsap.set(pill, { color: lightState ? "#111" : "#fff" });
        }
        const fill = pill.querySelector(".pw-pill-fill");
        if (fill) gsap.set(fill, { backgroundColor: lightState ? "#111" : "#fff" });
      });
    }
  };*/

  whiteSections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => { activeWhiteSections += 1; applyHeaderTheme(); },
      onEnterBack: () => { activeWhiteSections += 1; applyHeaderTheme(); },
      onLeave: () => { activeWhiteSections = Math.max(0, activeWhiteSections - 1); applyHeaderTheme(); },
      onLeaveBack: () => { activeWhiteSections = Math.max(0, activeWhiteSections - 1); applyHeaderTheme(); }
    });
  });

  ScrollTrigger.refresh();
});

;

/* ========================================================================== */
/* js\gsap.js */
/* ========================================================================== */
/* ========================================================================== 
   Performante Wraps — GSAP / ScrollTrigger animations
   (excludes nav-bar animations, which live in nav.js)
   ========================================================================== */

// iPad can report a fine primary pointer while a trackpad is attached.
const isTabletTouchDevice = () => window.innerWidth > 760 && window.innerWidth <= 1400 &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window || window.matchMedia("(pointer: coarse)").matches);

/* Hero intro entrance timeline */
const startHeroIntro=() => {
  if(typeof gsap==='undefined')return;
  gsap.set("#cube3d", {
    opacity: 0,
    scale: 1,
    filter: "blur(18px)"
  });

  gsap.set("#energyField", { opacity: 0 });

  gsap.set(".hero-bottom-title", {
    opacity: 0,
    y: 30
  });

  const heroIntro = gsap.timeline({
    delay: 0.25,
    defaults: {
      ease: "power3.out"
    }
  });

  heroIntro
    .to("#cube3d", {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 1.6
    })
    .to("#energyField", {
      opacity: 0.9,
      duration: 2.2
    }, "-=0.9")
    .to(".hero-bottom-title", {
      opacity: 1,
      y: 0,
      duration: 1.1
    }, "-=1.2");
};
if(window.pwBoot)window.pwBoot.ready.then(startHeroIntro);
else if(document.readyState==='complete')startHeroIntro();
else window.addEventListener('load',startHeroIntro,{once:true});

/* NDT capability box row hover states */
(() => {
  const row = document.querySelector(".ndt-box-row");
  if (!row) return;

  const boxes = Array.from(row.querySelectorAll(".ndt-box"));
  const dots = Array.from(row.querySelectorAll(".dot"));

  const ACTIVE = "#8fd3ff";
  const ACTIVE_EDGE = "rgba(143,211,255,0.38)";
  const IDLE = "#111";
  const IDLE_EDGE = "rgba(17,17,17,0.24)";

  function getBoxCornerDots(index) {
    return [
      dots[index],       // top-left
      dots[index + 1],   // top-right
      dots[index + 7],   // bottom-left
      dots[index + 8]    // bottom-right
    ].filter(Boolean);
  }

  function lightBox(index) {
    const box = boxes[index];
    const glow = box.querySelector(".box-glow");
    const logo = box.querySelector(".partner-logo");
    const cornerDots = getBoxCornerDots(index);

    gsap.to(box, {
      "--ink": ACTIVE,
      "--edge-ink": ACTIVE_EDGE,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto"
    });

    gsap.to(glow, {
      opacity: 1,
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto"
    });
/*
    gsap.to(cornerDots, {
      backgroundColor: ACTIVE,
      boxShadow: "0 0 0 6px rgba(143,211,255,0.16)",
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto"
    });*/

    if (logo) {
      if (logo.classList.contains("is-blur")) {
        gsap.to(logo, {
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto"
        });
      } else {
        gsap.to(logo, {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    }
  }

  function resetBox(index) {
    const box = boxes[index];
    const glow = box.querySelector(".box-glow");
    const logo = box.querySelector(".partner-logo");
    const cornerDots = getBoxCornerDots(index);

    gsap.to(box, {
      "--ink": IDLE,
      "--edge-ink": IDLE_EDGE,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto"
    });

    gsap.to(glow, {
      opacity: 0,
      duration: 0.24,
      ease: "power2.out",
      overwrite: "auto"
    });

    gsap.to(box, {
      "--box-glow-x": "50%",
      "--box-glow-y": "50%",
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto"
    });

    gsap.to(cornerDots, {
      backgroundColor: IDLE,
      boxShadow: "0 0 0 0 rgba(143,211,255,0)",
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto"
    });

    if (logo) {
      if (logo.classList.contains("is-blur")) {
        gsap.to(logo, {
          filter: "blur(4px)",
          opacity: 0.7,
          duration: 0.28,
          ease: "power2.out",
          overwrite: "auto"
        });
      } else {
        gsap.to(logo, {
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.28,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    }
  }

  boxes.forEach((box, index) => {
    box.addEventListener("mouseenter", () => {
      lightBox(index);
    });

    box.addEventListener("mousemove", (e) => {
      const rect = box.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      gsap.to(box, {
        "--box-glow-x": x + "%",
        "--box-glow-y": y + "%",
        duration: 0.14,
        ease: "power2.out",
        overwrite: true
      });
    });

    box.addEventListener("mouseleave", () => {
      resetBox(index);
    });
  });
})();

/* Project image scroller / carousel */
(function () {
  const viewport = document.getElementById("projectScroller");
  if (!viewport || typeof gsap === "undefined") return;

  const navbar = document.querySelector(".navbar");
  const track = viewport.querySelector(".image-scroller-track");
  const cards = Array.from(track.querySelectorAll(".scroller-card"));
  const prevBtn = document.querySelector(".scroller-prev");
  const nextBtn = document.querySelector(".scroller-next");
  const progressBar = document.querySelector(".scroller-progress-bar");
  const lenis = window.lenis || null;

  if (!track || !cards.length) return;

  let currentX = 0;
  let maxX = 0;
  let cardStep = 0;
  let dragStartX = 0;
  let startTrackX = 0;
  let isDragging = false;

  let navHiddenByScroller = false;
  let navLockUntil = 0;
  let lastScrollY = window.scrollY || 0;

  function now() {
    return performance.now();
  }

  function hideNavbar(lockMs = 700) {
    if (!navbar) return;
    navbar.classList.add("navbar--hidden");
    navHiddenByScroller = true;
    navLockUntil = now() + lockMs;
  }

  function showNavbar() {
    if (!navbar) return;
    navbar.classList.remove("navbar--hidden");
    navHiddenByScroller = false;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getCardStep() {
    if (cards.length < 2) return cards[0].offsetWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  }

  function getMaxX() {
    return Math.max(0, track.scrollWidth - viewport.clientWidth);
  }

  function getPages() {
    if (!cardStep) return 1;
    return Math.max(1, Math.round(maxX / cardStep) + 1);
  }

  function getNearestPage() {
    if (!cardStep) return 0;
    return clamp(Math.round(Math.abs(currentX) / cardStep), 0, getPages() - 1);
  }

  function updateArrowState() {
    if (!prevBtn || !nextBtn) return;

    const edgeTolerance = 12;
    const atStart = Math.abs(currentX) <= edgeTolerance;
    const atEnd = maxX === 0 || Math.abs(currentX) >= (maxX - edgeTolerance);

    if (atStart) {
      prevBtn.classList.add("is-disabled");
      prevBtn.classList.remove("is-active");
      prevBtn.setAttribute("aria-disabled", "true");
    } else {
      prevBtn.classList.remove("is-disabled");
      prevBtn.classList.add("is-active");
      prevBtn.setAttribute("aria-disabled", "false");
    }

    if (atEnd) {
      nextBtn.classList.add("is-disabled");
      nextBtn.classList.remove("is-active");
      nextBtn.setAttribute("aria-disabled", "true");
    } else {
      nextBtn.classList.remove("is-disabled");
      nextBtn.classList.add("is-active");
      nextBtn.setAttribute("aria-disabled", "false");
    }
  }

  function updateProgress() {
    if (progressBar) {
      const progress = maxX > 0 ? Math.abs(currentX) / maxX : 0;
      const width = clamp(progress * 100, 5, 100);
      progressBar.style.width = width + "%";
    }

    updateArrowState();
  }

  function animateToPage(index, duration = 0.75) {
  const lastPage = getPages() - 1;
  const page = clamp(index, 0, lastPage);

  let targetX = -(page * cardStep);

  if (page === lastPage) {
    targetX = -maxX;
  } else {
    targetX = Math.max(targetX, -maxX);
  }

  gsap.killTweensOf(track);

  gsap.to(track, {
    x: targetX,
    duration,
    ease: "back.out(1.15)",
    onUpdate: () => {
      currentX = Number(gsap.getProperty(track, "x"));
      updateProgress();
    },
    onComplete: () => {
      currentX = targetX;         // force exact final value
      gsap.set(track, { x: currentX });
      updateProgress();
    }
  });
}

  function refresh() {
    cardStep = getCardStep();
    maxX = getMaxX();
    currentX = -clamp(Math.abs(currentX), 0, maxX);
    gsap.set(track, { x: currentX });
    updateProgress();
  }

  function beginScrollerInteraction(lockMs = 900) {
    hideNavbar(lockMs);
  }

  prevBtn?.addEventListener("click", () => {
    if (prevBtn.classList.contains("is-disabled")) return;
    beginScrollerInteraction(900);
    animateToPage(getNearestPage() - 1);
  });

  nextBtn?.addEventListener("click", () => {
    if (nextBtn.classList.contains("is-disabled")) return;
    beginScrollerInteraction(900);
    animateToPage(getNearestPage() + 1);
  });

  viewport.addEventListener("dragstart", (e) => e.preventDefault());

  cards.forEach((card) => {
    const img = card.querySelector("img");
    if (img) img.addEventListener("dragstart", (e) => e.preventDefault());
  });

  viewport.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    startTrackX = currentX;

    beginScrollerInteraction(1200);

    viewport.classList.add("is-dragging");
    gsap.killTweensOf(track);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const delta = e.clientX - dragStartX;
    let nextX = startTrackX + delta * 1.15;

    if (nextX > 0) nextX = nextX * 0.22;

    if (nextX < -maxX) {
      const over = nextX + maxX;
      nextX = -maxX + over * 0.22;
    }

    currentX = nextX;
    gsap.set(track, { x: currentX });
    updateProgress();

    e.preventDefault();
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;

    isDragging = false;
    viewport.classList.remove("is-dragging");

    navLockUntil = now() + 700;

    if (currentX > 0) {
      gsap.to(track, {
        x: 0,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        },
        onComplete: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        }
      });
      return;
    }

    if (currentX < -maxX) {
      gsap.to(track, {
        x: -maxX,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        },
        onComplete: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        }
      });
      return;
    }

    animateToPage(getNearestPage(), 0.72);
  });

  viewport.addEventListener("touchstart", (e) => {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    startTrackX = currentX;

    beginScrollerInteraction(1200);

    viewport.classList.add("is-dragging");
    gsap.killTweensOf(track);
  }, { passive: true });

  viewport.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    const delta = e.touches[0].clientX - dragStartX;
    let nextX = startTrackX + delta;

    if (nextX > 0) nextX = nextX * 0.22;

    if (nextX < -maxX) {
      const over = nextX + maxX;
      nextX = -maxX + over * 0.22;
    }

    currentX = nextX;
    gsap.set(track, { x: currentX });
    updateProgress();
  }, { passive: true });

  viewport.addEventListener("touchend", () => {
    if (!isDragging) return;

    isDragging = false;
    viewport.classList.remove("is-dragging");

    navLockUntil = now() + 700;

    if (currentX > 0) {
      gsap.to(track, {
        x: 0,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        },
        onComplete: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        }
      });
      return;
    }

    if (currentX < -maxX) {
      gsap.to(track, {
        x: -maxX,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        },
        onComplete: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        }
      });
      return;
    }

    animateToPage(getNearestPage(), 0.72);
  }, { passive: true });

  function maybeRestoreNavbar(scrollY) {
    if (!navHiddenByScroller) {
      lastScrollY = scrollY;
      return;
    }

    if (now() < navLockUntil) {
      lastScrollY = scrollY;
      return;
    }

    const delta = scrollY - lastScrollY;

    if (Math.abs(delta) > 2) {
      showNavbar();
    }

    lastScrollY = scrollY;
  }

  if (lenis && typeof lenis.on === "function") {
    lenis.on("scroll", ({ animatedScroll }) => {
      maybeRestoreNavbar(animatedScroll);
    });
  } else {
    window.addEventListener("scroll", () => {
      maybeRestoreNavbar(window.scrollY || window.pageYOffset || 0);
    }, { passive: true });
  }

  window.addEventListener("resize", refresh);
  window.addEventListener("load", refresh);

  refresh();
})();

/* Scroll-triggered rise-in animations */
(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)").matches;
  if (reduceMotion) return;

  const riseTargets = gsap.utils.toArray([
    "#heroTitle",
    ".hero-scroll-indicator",
    "#criticalTitle",
    ".feature-heading",
    ".feature-title",
    ".feature-text",
    ".image-scroller-eyebrow",
    ".scroller-copy .card-eyebrow",
    ".scroller-copy p",
    ".blue-cta .display-heading",
    ".white-cta .display-heading",
    ".ndt-grid-title",
    ".contact-header h2",
    ".contact-left h3",
    ".contact-left p",
    ".contact-right h3",
    ".contact-form label",
    ".contact-btn",
    ".caps-intro-title",
    ".caps-intro-eyebrow",
    ".stackflow-heading",
    ".insight-grid-title",
    ".insight-grid-eyebrow",
    ".insight-grid-intro",
    
 
    
  ]);

    const riseTargets2 = gsap.utils.toArray([
    ".stackflow-copy p",
    ".stackflow-link",
    ".stackflow-card"
    
  ]);

    const riseTargets3 = gsap.utils.toArray([
    ".insight-card"
    
  ]);
  const footerTitleTargets = gsap.utils.toArray([
    ".footer-title"
  ]);

  const fadeOnlyTargets = gsap.utils.toArray([
    ".footer-logo",
    ".footer-links li",
    ".footer-socials a"
  ]);

  riseTargets.forEach((el) => {
    gsap.fromTo(
      el,
      {
        autoAlpha: 0,
        y: 36
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true
        }
      }
    );
  });

riseTargets2.forEach((el) => {
  gsap.fromTo(
    el,
    {
      autoAlpha: 0,
      y: 36
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1.6,
      delay: 0.3, // 👈 add this
      ease: "power3.out",
      clearProps: "transform,opacity,visibility",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true
      }
    }
  );
});
riseTargets3.forEach((el, i) => {
  gsap.fromTo(
    el,
    {
      autoAlpha: 0,
      y: 36
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1.9,
      delay: i * 0.35, // 👈 stagger effect
      ease: "power3.out",
      clearProps: "transform,opacity,visibility",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true
      }
    }
  );
});
  footerTitleTargets.forEach((el) => {
    gsap.fromTo(
      el,
      {
        opacity: 0
      },
      {
        opacity: 0.5,
        duration: 0.85,
        ease: "power3.out",
        clearProps: "opacity",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          once: true
        }
      }
    );
  });

  fadeOnlyTargets.forEach((el) => {
    gsap.fromTo(
      el,
      {
        autoAlpha: 0
      },
      {
        autoAlpha: 1,
        duration: 0.85,
        ease: "power3.out",
        clearProps: "opacity,visibility",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          once: true
        }
      }
    );
  });

  ScrollTrigger.refresh();
})();

/* Parallax scroll effects (hero title, critical title, blue CTA) */
(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)").matches;
  if (reduceMotion) return;

  const heroTitle = document.getElementById("heroTitle");
  const criticalTitle = document.getElementById("criticalTitle");
  const blueCta = document.querySelector(".blue-cta");
/*
  if (heroTitle) {
    gsap.to(heroTitle, {
      y: -140,
      ease: "none",
      scrollTrigger: {
        trigger: ".intro-wrap",
        start: "top top",
        end: "bottom top",
        scrub: 0.35
      }
    });
  }*/

  if (criticalTitle) {
    gsap.fromTo(
      criticalTitle,
      { y: 90 },
      {
        y: -150,
        ease: "none",
        scrollTrigger: {
          trigger: ".spacer--dark",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.35
        }
      }
    );
  }

  if (blueCta) {
    gsap.fromTo(
      blueCta,
      { backgroundPosition: "50% 50%" },
      {
        backgroundPosition: "50% 120%",
        ease: "none",
        scrollTrigger: {
          trigger: blueCta,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.45
        }
      }
    );
  }

  ScrollTrigger.refresh();
})();

/* Intro / truck sequence — desktop + mobile */
/* INTRO / TRUCK — DESKTOP + MOBILE */
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const intro = document.querySelector(".intro-wrap");
  const video = document.querySelector(".hero-rise-img");
  const stackflowMain = document.querySelector(".stackflow-main");
  const truckImgs = gsap.utils.toArray(".hero-truck-sequence img");
  const truckTitles = gsap.utils.toArray(".hero-truck-titles h2");
  const whitePanel = document.querySelector(".hero-white-panel");

  if (!intro || !video) return;

  const mm = gsap.matchMedia();

  /* =========================================
     DESKTOP
  ========================================= */
  mm.add("(min-width: 761px)", () => {
    gsap.set(video, {
      yPercent: 60,
      opacity: 0,
      filter:
        "grayscale(100%) contrast(1.15) brightness(0.85) blur(12px)"
    });

    gsap.set(truckImgs, {
      xPercent: -50,
      y: 250,
      opacity: 0,
      filter: "blur(10px)"
    });

    gsap.set(truckTitles, {
      y: 25,
      opacity: 0,
      filter: "blur(12px)"
    });

    if (whitePanel) {
      gsap.set(whitePanel, {
        bottom: "-40vh",
        opacity: 1
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        id: "introTruckDesktop",
        trigger: intro,
        start: "top top",
        end: "+=820%",
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    tl.to(
      video,
      {
        yPercent: 0,
        opacity: 1,
        filter:
          "grayscale(100%) contrast(1.15) brightness(0.85) blur(0px)",
        ease: "none",
        duration: 0.5
      },
      0.1
    );

    if (stackflowMain) {
      tl.to(
        stackflowMain,
        {
          opacity: 0,
          y: -36,
          filter: "blur(8px)",
          ease: "none",
          duration: 0.35
        },
        0.05
      );
    }

    if (whitePanel) {
      tl.to(
        whitePanel,
        {
          bottom: "0vh",
          ease: "none",
          duration: 0.4
        },
        0.18
      );
    }

    /* TRUCK 1 */
    tl.to(
      truckTitles[0],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      0.18
    );

    tl.to(
      truckImgs[0],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      0.1
    );

    tl.to(
      truckTitles[0],
      {
        opacity: 0,
        filter: "blur(10px)",
        ease: "none"
      },
      0.82
    );

    tl.to(
      truckImgs[0],
      {
        xPercent: -300,
        opacity: 0,
        ease: "none"
      },
      0.9
    );

    /* TRUCK 2 */
    tl.to(
      truckTitles[1],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      0.82
    );

    tl.fromTo(
      truckImgs[1],
      {
        xPercent: 300,
        y: 0,
        opacity: 0,
        filter: "blur(0px)"
      },
      {
        xPercent: -50,
        opacity: 1,
        ease: "none"
      },
      0.9
    );

    tl.to(
      truckTitles[1],
      {
        opacity: 0,
        filter: "blur(10px)",
        ease: "none"
      },
      1.48
    );

    tl.to(
      truckImgs[1],
      {
        xPercent: -300,
        opacity: 0,
        ease: "none"
      },
      1.5
    );

    /* TRUCK 3 */
    tl.to(
      truckTitles[2],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      1.28
    );

    tl.fromTo(
      truckImgs[2],
      {
        xPercent: 300,
        y: 0,
        opacity: 0,
        filter: "blur(0px)"
      },
      {
        xPercent: -50,
        opacity: 1,
        ease: "none"
      },
      1.5
    );

    tl.to(
      [truckImgs[2], truckTitles[2]],
      {
        opacity: 1,
        ease: "none",
        duration: 0.3
      },
      1.8
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  });

  /* =========================================
     MOBILE
     Trucks enter bottom-to-top
  ========================================= */
  mm.add("(max-width: 760px)", () => {
    /*
      Video is hidden when the page first loads.
      It only rises into view after scrolling.
    */
    gsap.set(video, {
      yPercent: 75,
      opacity: 0,
      visibility: "visible",
      filter:
        "grayscale(100%) contrast(1.15) brightness(0.8) blur(10px)"
    });

    /*
      Keep every truck centered horizontally.
      Movement happens vertically on mobile.
    */
    gsap.set(truckImgs, {
      xPercent: -50,
      yPercent: 80,
      opacity: 0,
      filter: "blur(8px)"
    });

    gsap.set(truckTitles, {
      y: 30,
      opacity: 0,
      filter: "blur(10px)"
    });

    if (whitePanel) {
      gsap.set(whitePanel, {
        bottom: "-40vh",
        opacity: 1
      });
    }

    const mobileTl = gsap.timeline({
      scrollTrigger: {
        id: "introTruckMobile",
        trigger: intro,
        start: "top top",
        end: "+=520%",
        scrub: 0.35,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    /* Hide original center content */
    if (stackflowMain) {
      mobileTl.to(
        stackflowMain,
        {
          opacity: 0,
          y: -25,
          filter: "blur(6px)",
          ease: "none",
          duration: 0.3
        },
        0
      );
    }

    /* Video rises only once scrolling begins */
    mobileTl.to(
      video,
      {
        yPercent: 0,
        opacity: 1,
        filter:
          "grayscale(100%) contrast(1.15) brightness(0.8) blur(0px)",
        ease: "none",
        duration: 0.5
      },
      0.12
    );

    if (whitePanel) {
      mobileTl.to(
        whitePanel,
        {
          bottom: "0vh",
          ease: "none",
          duration: 0.35
        },
        0.22
      );
    }

    /* MOBILE TRUCK 1 — rises from bottom */
    mobileTl.to(
      truckTitles[0],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.25
      },
      0.3
    );

    mobileTl.to(
      truckImgs[0],
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.45
      },
      0.25
    );

    mobileTl.to(
      [truckTitles[0], truckImgs[0]],
      {
        yPercent: -55,
        opacity: 0,
        filter: "blur(7px)",
        ease: "none",
        duration: 0.35
      },
      0.9
    );

    /* MOBILE TRUCK 2 */
    mobileTl.to(
      truckTitles[1],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.25
      },
      0.9
    );

    mobileTl.to(
      truckImgs[1],
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.45
      },
      0.86
    );

    mobileTl.to(
      [truckTitles[1], truckImgs[1]],
      {
        yPercent: -55,
        opacity: 0,
        filter: "blur(7px)",
        ease: "none",
        duration: 0.35
      },
      1.5
    );

    /* MOBILE TRUCK 3 */
    mobileTl.to(
      truckTitles[2],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.25
      },
      1.5
    );

    mobileTl.to(
      truckImgs[2],
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.45
      },
      1.46
    );

    /* Hold the final truck */
    mobileTl.to(
      [truckTitles[2], truckImgs[2]],
      {
        opacity: 1,
        ease: "none",
        duration: 0.4
      },
      2
    );

    return () => {
      mobileTl.scrollTrigger?.kill();
      mobileTl.kill();
    };
  });

  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
});

/* White blinds transition, marquee pin, light-section reveals */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;
  if (typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

/* =====================================================
   WHITE BLINDS + FIRST LIGHT SECTION
===================================================== */

const transition = document.getElementById("wrapTransition");
const blinds = gsap.utils.toArray(".wrap-blinds span");
const marquee = document.querySelector(".wrap-marquee");
const marqueePinGroup = document.querySelector(".wrap-marquee-pin-group");

const firstLightSection = document.querySelector(
  ".wrap-light-section--intro"
);

const firstInner = document.querySelector(
  ".wrap-light-section--intro .wrap-light-section__inner"
);

const firstSectionMoveAmount = -window.innerHeight * 1.3;

if (
  transition &&
  blinds.length &&
  marquee &&
  marqueePinGroup &&
  firstLightSection
) {
  gsap.set(transition, {
    autoAlpha: 0,
    visibility: "hidden"
  });

  gsap.set(blinds, {
    scaleY: 0,
    y: 0,
    force3D: false,
    transformOrigin: "center bottom"
  });

  gsap.set(firstLightSection, {
    marginTop: 0
  });

  const transitionTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: marqueePinGroup,
      start: "top 30%",
      end: () => "+=" + (window.innerWidth <= 760
        ? Math.round(window.innerHeight * 1.2)
        : isTabletTouchDevice() ? Math.round(window.innerHeight * 1.35) : 1800),
      pin: marqueePinGroup,
      pinSpacing: true,
      scrub: 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      onEnter() {
        gsap.set(transition, {
          autoAlpha: 1,
          visibility: "visible"
        });
      },

      onEnterBack() {
        gsap.set(transition, {
          autoAlpha: 1,
          visibility: "visible"
        });
      },

      onLeave() {
        gsap.set(transition, {
          autoAlpha: 1,
          visibility: "visible"
        });
      },

      onLeaveBack() {
        gsap.set(transition, {
          autoAlpha: 0,
          visibility: "hidden"
        });
      },

      onRefresh() {
        if (this.progress === 0) {
          gsap.set(firstLightSection, { marginTop: 0 });
        }
      }
    }
  });

  /*
    BLINDS START AT 0
  */
  transitionTimeline.to(
    blinds,
    {
      scaleY: 1.02,
      duration: 1,
      ease: "power2.inOut",
      force3D: false,
      stagger: {
        each: 0.12,
        from: "end"
      }
    },
    0
  );

  transitionTimeline.to(
    firstLightSection,
    {
      marginTop: firstSectionMoveAmount,
      duration: 1,
      ease: "power2.inOut"
    },
    0
  );

}

/* =====================================================
   FIRST WHITE INTRO — FADE/UNBLUR TO VIEWPORT CENTER
===================================================== */

if (firstLightSection && firstInner) {
  gsap.fromTo(
    firstInner,
    {
      autoAlpha: 0,
      y: 54,
      filter: "blur(24px)"
    },
    {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      ease: "none",
      immediateRender: true,
      scrollTrigger: {
        trigger: firstLightSection,

        /* Begin while the intro is entering the viewport. */
        start: "top 195%",

        /* Fully visible and sharp when its top reaches center. */
        end: "top 165%",

        scrub: true,
        invalidateOnRefresh: true
      }
    }
  );
}

/* =====================================================
   OTHER WHITE SECTIONS
===================================================== 

const whiteSectionInners = gsap.utils.toArray(
  ".wrap-white-section__inner"
);

whiteSectionInners.forEach((sectionInner, index) => {

  if (index === 0) return;

  gsap.fromTo(
    sectionInner,
    {
      autoAlpha: 0,
      y: 42,
      filter: "blur(18px)"
    },
    {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionInner,
        start: "top 82%",
        once: true
      }
    }
  );
});

 =====================================================
   OTHER LIGHT SECTIONS
===================================================== 

gsap.utils
  .toArray(".wrap-light-section")
  .forEach((section, sectionIndex) => {

    if (
      section === firstLightSection ||
      sectionIndex === 0
    ) {
      return;
    }

    const inner = section.querySelector(
      ".wrap-light-section__inner"
    );

    const targets = section.querySelectorAll(
      ".wrap-light-section__kicker, h2, .wrap-light-section__lead, article"
    );

    if (inner) {
      gsap.fromTo(
        inner,
        {
          autoAlpha: 0,
          y: 34,
          filter: "blur(20px)"
        },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.25,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 88%",
            once: true
          }
        }
      );
    }

    if (targets.length) {
      gsap.from(targets, {
        y: 28,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 87%",
          once: true
        }
      });
    }
  });*/

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});

  window.addEventListener("load", () => ScrollTrigger.refresh());
});

/* ==========================================================
   Performante Gallery Flow — stable horizontal 5-panel showcase
   ========================================================== */
(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const stage = document.getElementById("performanteGalleryFlowStage");
  const track = document.getElementById("performanteGalleryFlowTrack");
  if (!stage || !track || window.innerWidth <= 760) return;
  const sticky = stage.querySelector(".selected-works-sticky");
  const outro = track.querySelector(".selected-works-panel--outro");
  // The sticky distance is the stage height minus one viewport. Shorten the
  // full sideways passage on iPad without changing the desktop section.
  if (isTabletTouchDevice()) {
    stage.style.height = "275vh";
    // Give the final panel enough width to travel the last little stretch
    // while keeping artwork behind the viewport edge.
    if (outro) {
      outro.style.flexBasis = "58vw";
      outro.style.width = "58vw";
    }
  }

  const getTravel = () => Math.max(0, track.scrollWidth - (sticky?.clientWidth || window.innerWidth));

  gsap.set(track, { x: 0, force3D: true });

  const selectedWorksTimeline = gsap.timeline({
    scrollTrigger: {
      id: "performanteGalleryFlow",
      trigger: stage,

      // First let the sticky section actually reach the top of the viewport.
      start: "top top",

      // Keep the existing ending behavior exactly where it was.
      end: "bottom bottom",

      scrub: true,
      invalidateOnRefresh: true,
      fastScrollEnd: false
    }
  });

  // Keep the desktop lock-in hold; start the sideways movement much sooner
  // on iPad, where the same 25% consumes too much finger scrolling.
  const lockInHold = isTabletTouchDevice() ? 0.04 : 0.25;
  const endHold = isTabletTouchDevice() ? 0.08 : 0;
  selectedWorksTimeline.to({}, {
    duration: lockInHold
  });

  // After the hold, use the remaining scroll to move through the projects.
  selectedWorksTimeline.to(track, {
    x: () => -getTravel(),
    ease: "none",
    force3D: true,
    duration: 1 - lockInHold - endHold
  });
  if (endHold) selectedWorksTimeline.to({}, { duration: endHold });

  /* Selected Work: the untransformed horizontal panel determines image depth.
     Paused timelines sample position directly: dragging/reverse scroll also work,
     including the first project during the existing horizontal lock-in hold. */
  const workMotion=window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)");
  const workDepth=gsap.utils.toArray(stage.querySelectorAll(".selected-works-panel--project")).map(panel=>{
    const card=panel.querySelector(".selected-project-card");
    if(!card)return null;
    // Lift the complete project card, including its caption, as it passes.
    // Keep depth/scale fixed and retain only a slight two-degree turn.
    const timeline=gsap.timeline({paused:true});
    timeline.fromTo(card,
      {y:64,z:0,rotationY:-2,rotationX:0,scale:1,transformPerspective:1600,transformOrigin:"50% 50%"},
      {y:-40,z:0,rotationY:0,rotationX:0,scale:1,duration:1,ease:"power2.out"}
    );
    return {panel,card,timeline,last:-1};
  }).filter(Boolean);
  function updateWorkDepth(){
    if(document.hidden || (window.pwBoot && !window.pwBoot.released))return;
    const width=Math.max(1,window.innerWidth);
    workDepth.forEach(item=>{
      const rect=item.panel.getBoundingClientRect();
      // Finish the full rise at screen center, including the last card; hold it up afterward.
      const progress=workMotion.matches?1:gsap.utils.clamp(0,1,2*(width-rect.left)/(width+rect.width));
      if(progress===item.last)return;
      item.last=progress;item.timeline.progress(progress);
    });
  }
  gsap.ticker.add(updateWorkDepth);
  updateWorkDepth();

  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

  /* --------------------------------------------------------
     Draggable / swipeable navigation (mouse + touch/tablet)
     The panels are normally advanced by page scroll (the
     ScrollTrigger above reads window scroll position and
     drives the track's x). To make the section feel native
     on tablets, we let a horizontal drag directly move the
     page's scroll position through this section's pinned
     range — the drag doesn't move the track itself, it moves
     the scroll, so it stays perfectly in sync with the
     existing scrub timeline.
  -------------------------------------------------------- */
  const st = selectedWorksTimeline.scrollTrigger;
  const lenis = window.lenis || null;

  const setScroll = (value) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const clamped = Math.max(0, Math.min(maxScroll, value));
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(clamped, { immediate: true, force: true });
    } else {
      window.scrollTo(0, clamped);
      ScrollTrigger.update();
    }
  };

  const DRAG_THRESHOLD = 6;
  const DRAG_SENSITIVITY_DESKTOP = 0.9; // mouse — less sensitive
  const DRAG_SENSITIVITY_TABLET = 2.2; // touch/pen — more sensitive

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScroll = 0;
  let direction = null; // "x" | "y" | null (undecided)
  let dragSensitivity = DRAG_SENSITIVITY_DESKTOP;

  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("a, button")) return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startScroll = st.scroll();
    direction = null;
    dragSensitivity = e.pointerType === "mouse" ? DRAG_SENSITIVITY_DESKTOP : DRAG_SENSITIVITY_TABLET;
  });

  stage.addEventListener("pointermove", (e) => {
    if (pointerId === null || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (direction === null) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      direction = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (direction === "x") {
        stage.setPointerCapture(pointerId);
        stage.classList.add("is-dragging");
      }
    }

    if (direction !== "x") return;

    e.preventDefault();
    setScroll(startScroll - dx * dragSensitivity);
  }, { passive: false });

  const endDrag = (e) => {
    if (pointerId === null || (e.pointerId !== undefined && e.pointerId !== pointerId)) return;
    if (direction === "x" && stage.hasPointerCapture?.(pointerId)) {
      stage.releasePointerCapture(pointerId);
    }
    pointerId = null;
    direction = null;
    stage.classList.remove("is-dragging");
  };

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener("dragstart", (e) => e.preventDefault());
})();

/* =====================================================
   SHARED PILL BUTTONS — rollover circle fill
   Applies to any .pw-btn element (Start a Project, More About Us,
   View All Projects, View Project). Color is handled purely in CSS
   via the --pw-btn-* custom properties (see styles.css); this only
   drives the circle-fill geometry + scale, same technique as the
   nav pills in navbar.js.
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;

  const pillButtons = gsap.utils.toArray(".pw-btn");
  if (!pillButtons.length) return;

  pillButtons.forEach((btn) => {
    let fill = btn.querySelector(".pw-btn-fill");
    if (!fill) {
      fill = document.createElement("span");
      fill.className = "pw-btn-fill";
      fill.setAttribute("aria-hidden", "true");
      btn.prepend(fill);
    }

    const setFillGeometry = (event) => {
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const farX = Math.max(x, rect.width - x);
      const farY = Math.max(y, rect.height - y);
      const diameter = Math.hypot(farX, farY) * 2.15;
      gsap.set(fill, { left: x, top: y, width: diameter, height: diameter });
    };

    btn.addEventListener("pointerenter", (event) => {
      setFillGeometry(event);
      gsap.killTweensOf(fill);
      gsap.fromTo(fill, { scale: 0 }, {
        scale: 1,
        duration: .48,
        ease: "power3.out",
        overwrite: true
      });
    });

    btn.addEventListener("pointerleave", (event) => {
      setFillGeometry(event);
      gsap.killTweensOf(fill);
      gsap.to(fill, {
        scale: 0,
        duration: .34,
        ease: "power2.inOut",
        overwrite: true
      });
    });
  });
});




/* ============================================================================
   NEW — PW INFINITE GALLERY (added by Claude)
   Full-width, arrow-controlled, infinite-loop-in-both-directions image
   gallery. Markup lives in index.html (section#pwInfiniteGallery), CSS
   lives at the end of styles.css under the matching banner.

   How the loop works: the original slide set is cloned once before and
   once after itself, so the track is [clones][originals][clones]. The
   track starts positioned at the first "originals" slide. Clicking an
   arrow animates one slide at a time; once the animation lands on a
   cloned slide, we jump (no transition) back to the matching real slide
   so the loop never shows a blank frame or a hard "reset" in either
   direction.
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const viewport = document.getElementById("pwInfiniteGalleryViewport");
  const track = document.getElementById("pwInfiniteGalleryTrack");
  if (!viewport || !track) return;

  const section = document.getElementById("pwInfiniteGallery");
  const prevBtn = section ? section.querySelector(".pw-infinite-gallery__arrow--prev") : null;
  const nextBtn = section ? section.querySelector(".pw-infinite-gallery__arrow--next") : null;

  const originals = Array.from(track.children);
  const slideCount = originals.length;
  if (!slideCount) return;

  originals.forEach((slide, i) => slide.setAttribute("data-slide-index", String(i)));

  // Build [clones-before][originals][clones-after]
  const cloneSet = () => originals.map((slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    const img = clone.querySelector("img");
    if (img) img.removeAttribute("alt");
    return clone;
  });

  const beforeClones = cloneSet();
  const afterClones = cloneSet();

  track.innerHTML = "";
  [...beforeClones, ...originals, ...afterClones].forEach((el) => track.appendChild(el));

  const allSlides = Array.from(track.children);
  let index = slideCount; // start at the first "real" slide
  let slideWidth = 0;
  let isAnimating = false;

  function measure() {
    const first = allSlides[0];
    const style = window.getComputedStyle(first);
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    slideWidth = first.getBoundingClientRect().width + marginLeft + marginRight;
  }

  function setPosition(withTransition) {
    track.style.transition = withTransition ? "transform .55s cubic-bezier(.65,0,.35,1)" : "none";
    track.style.transform = `translateX(${-index * slideWidth}px)`;
  }

  function goTo(step) {
    if (isAnimating || !slideWidth) return;
    isAnimating = true;
    index += step;
    setPosition(true);
  }

  track.addEventListener("transitionend", () => {
    isAnimating = false;

    // Landed in the trailing clone zone -> snap back into the real set
    if (index >= slideCount * 2) {
      index -= slideCount;
      setPosition(false);
    }

    // Landed in the leading clone zone -> snap forward into the real set
    if (index < slideCount) {
      index += slideCount;
      setPosition(false);
    }
  });

  if (nextBtn) nextBtn.addEventListener("click", () => goTo(1));
  if (prevBtn) prevBtn.addEventListener("click", () => goTo(-1));

  // Basic drag / swipe support
  let dragStartX = 0;
  let dragging = false;
  let dragMoved = false;

  function onDragStart(clientX) {
    if (isAnimating) return;
    dragging = true;
    dragMoved = false;
    dragStartX = clientX;
  }

  function onDragEnd(clientX) {
    if (!dragging) return;
    dragging = false;
    const delta = clientX - dragStartX;
    if (Math.abs(delta) > 40) {
      dragMoved = true;
      goTo(delta < 0 ? 1 : -1);
    }
  }

  viewport.addEventListener("pointerdown", (e) => onDragStart(e.clientX));
  viewport.addEventListener("pointerup", (e) => onDragEnd(e.clientX));
  viewport.addEventListener("pointerleave", () => { dragging = false; });

  function init() {
    measure();
    setPosition(false);
  }

  init();

  // If a slide's image is missing/broken, swap in a visible labeled
  // placeholder instead of leaving a blank/invisible box.
  allSlides.forEach((slide) => {
    const img = slide.querySelector("img");
    if (!img) return;

    const showFallback = () => {
      if (slide.querySelector(".pw-infinite-gallery__slide-fallback")) return;
      const label = img.getAttribute("alt") || "Image coming soon";
      img.style.display = "none";
      const fallback = document.createElement("div");
      fallback.className = "pw-infinite-gallery__slide-fallback";
      fallback.textContent = label;
      slide.appendChild(fallback);
    };

    if (img.complete && img.naturalWidth === 0) {
      showFallback();
    } else {
      img.addEventListener("error", showFallback, { once: true });
    }
  });

  // --- Lightbox ---------------------------------------------------------
  // Reuses the site's existing (previously unwired) .pw-lightbox markup
  // and styles. Clicking any slide (including clones) opens the matching
  // original image; prev/next loop through the original slide set.
  const lightbox = document.getElementById("pwGalleryLightbox");
  if (lightbox) {
    const lightboxImg = document.getElementById("pwGalleryLightboxImg");
    const lightboxClose = document.getElementById("pwGalleryLightboxClose");
    const lightboxPrev = document.getElementById("pwGalleryLightboxPrev");
    const lightboxNext = document.getElementById("pwGalleryLightboxNext");
    let lightboxIndex = 0;

    function renderLightbox() {
      const source = originals[lightboxIndex];
      const sourceImg = source.querySelector("img");
      if (!sourceImg) return;
      lightboxImg.src = sourceImg.getAttribute("src");
      lightboxImg.alt = sourceImg.getAttribute("alt") || "";
    }

    function openLightbox(i) {
      lightboxIndex = ((i % slideCount) + slideCount) % slideCount;
      renderLightbox();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function stepLightbox(step) {
      lightboxIndex = ((lightboxIndex + step) % slideCount + slideCount) % slideCount;
      renderLightbox();
    }

    allSlides.forEach((slide) => {
      const openThis = () => {
        if (dragMoved) { dragMoved = false; return; }
        const i = parseInt(slide.getAttribute("data-slide-index"), 10);
        if (!Number.isNaN(i)) openLightbox(i);
      };
      slide.addEventListener("click", openThis);
      slide.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openThis();
        }
      });
    });

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener("click", () => stepLightbox(-1));
    if (lightboxNext) lightboxNext.addEventListener("click", () => stepLightbox(1));

    // Click on the dark backdrop (not the image/frame/buttons) closes it
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

    
  // ResizeObserver instead of a plain window "resize" listener — this
  // also catches CSS-only size changes (editing the clamp() width/height,
  // devtools live-edits, etc.), which never fire a window resize event
  // but still leave the cached slideWidth stale and cause a visual jump.
  let resizeTimer;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });
  ro.observe(allSlides[0]);
});
/* ============================================================================
   END — PW INFINITE GALLERY
   ============================================================================ */


/* ============================================================================
   GLOBAL TYPOGRAPHY + CARD REVEALS
   - headings: letter-by-letter blur / fade / rise
   - about statement: typography-safe scroll-driven white fill
   - Wraps & Branding cards: top-hinged fold-in, staggered
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)").matches;

  /* Split titles by WORD first, then by character.
     This keeps normal word wrapping intact and prevents letters from being
     clipped or scattered across lines while preserving the same reveal look. */
  function splitHeadingIntoChars(el) {
    if (!el || el.dataset.pwSplit === "true") return [];

    const originalLabel = el.textContent.replace(/\s+/g, " ").trim();
    const chars = [];

    function processTextNode(node) {
      const value = node.nodeValue || "";
      const frag = document.createDocumentFragment();
      const parts = value.split(/(\s+)/);

      parts.forEach((part) => {
        if (!part) return;

        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }

        const word = document.createElement("span");
        word.className = "pw-title-word";
        word.setAttribute("aria-hidden", "true");

        [...part].forEach((char) => {
          const span = document.createElement("span");
          span.className = "pw-title-char";
          span.textContent = char;
          chars.push(span);
          word.appendChild(span);
        });

        frag.appendChild(word);
      });

      node.replaceWith(frag);
    }

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
        [...node.childNodes].forEach(walk);
      }
    }

    [...el.childNodes].forEach(walk);
    if (originalLabel) el.setAttribute("aria-label", originalLabel);
    el.classList.add("pw-title-reveal");
    el.dataset.pwSplit = "true";
    return chars;
  }

  /* 1) Special about statement — line-by-line white fill.
        The original heading remains completely untouched. We stack clipped
        white copies over the muted original, one clip per rendered line, so
        each line fills left-to-right before the next line begins. */
  const aboutTitle = document.querySelector(".wrap-about-panel__content h2");
  if (aboutTitle) {
    aboutTitle.classList.remove("pw-scroll-fill-text");
    aboutTitle.classList.add("pw-line-fill-source");

    let lineFillTimeline=null;
    const buildLineFill = () => {
      if(lineFillTimeline){
        lineFillTimeline.scrollTrigger?.kill();
        lineFillTimeline.kill();lineFillTimeline=null;
      }
      aboutTitle.querySelectorAll(":scope > .pw-line-fill-overlay").forEach(el => el.remove());

      const originalText=aboutTitle.textContent;
      const range = document.createRange();
      range.selectNodeContents(aboutTitle);
      const titleRect = aboutTitle.getBoundingClientRect();
      if(!titleRect.width || !titleRect.height)return;
      const localWidth=aboutTitle.clientWidth,localHeight=aboutTitle.clientHeight;
      const scaleY=localHeight/titleRect.height;
      const rawRects = Array.from(range.getClientRects()).filter(r => r.width > 2 && r.height > 2);

      /* Merge fragments that belong to the same rendered line. */
      const lines = [];
      rawRects.forEach(r => {
        const existing = lines.find(line => Math.abs(line.top - r.top) < 3);
        if (existing) {
          existing.left = Math.min(existing.left, r.left);
          existing.right = Math.max(existing.right, r.right);
          existing.top = Math.min(existing.top, r.top);
          existing.bottom = Math.max(existing.bottom, r.bottom);
        } else {
          lines.push({ left:r.left, right:r.right, top:r.top, bottom:r.bottom });
        }
      });
      lines.sort((a,b) => a.top - b.top);

      const overlays = lines.map((line,index) => {
        const clone = document.createElement("span");
        clone.className = "pw-line-fill-overlay";
        clone.setAttribute("aria-hidden", "true");
        clone.textContent = originalText;
        aboutTitle.appendChild(clone);

        // Each line gets its own vertical band, but its final reveal spans
        // the full heading width so glyph overhangs cannot be clipped short.
        const left=0,right=0;
        const top=index===0?0:Math.max(0,((lines[index-1].bottom+line.top)/2-titleRect.top)*scaleY);
        const bottom=index===lines.length-1?0:Math.max(0,localHeight-((line.bottom+lines[index+1].top)/2-titleRect.top)*scaleY);

        gsap.set(clone, {
          clipPath: `inset(${top}px ${localWidth}px ${bottom}px ${left}px)`
        });

        clone.dataset.pwClipTop = top;
        clone.dataset.pwClipRight = right;
        clone.dataset.pwClipBottom = bottom;
        clone.dataset.pwClipLeft = left;
        return clone;
      });

      if (reduceMotion) {
        overlays.forEach(clone => {
          gsap.set(clone, {
            clipPath: `inset(${clone.dataset.pwClipTop}px ${clone.dataset.pwClipRight}px ${clone.dataset.pwClipBottom}px ${clone.dataset.pwClipLeft}px)`
          });
        });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".wrap-about-panel",
          start: "top 78%",
          end: "+=640",
          scrub: 0.30,
          invalidateOnRefresh: true
        }
      });

      lineFillTimeline=tl;
      overlays.forEach((clone, i) => {
        tl.to(clone, {
          clipPath: `inset(${clone.dataset.pwClipTop}px ${clone.dataset.pwClipRight}px ${clone.dataset.pwClipBottom}px ${clone.dataset.pwClipLeft}px)`,
          ease: "none",
          duration: 1
        }, i);
      });
    };

    let rebuildFrame=0;
    const queueLineFill=()=>{
      cancelAnimationFrame(rebuildFrame);
      rebuildFrame=requestAnimationFrame(buildLineFill);
    };
    queueLineFill();
    window.addEventListener("load",queueLineFill,{once:true});
    document.fonts?.ready.then(queueLineFill);
    new ResizeObserver(queueLineFill).observe(aboutTitle);
  }

  /* 2) General title reveal.
        IMPORTANT: the first light section changes real layout (margin-top) while
        the marquee transition is scrubbed. ScrollTrigger positions created for
        descendants can therefore become stale. For Wraps & Branding and normal
        titles below it, use actual viewport intersection instead. Selected Works
        keeps its existing containerAnimation because that timing is already right. */
  const brandingSection = document.querySelector(".wrap-light-section--intro");

  function isAtOrAfterBranding(el) {
    if (!brandingSection || !el) return false;
    return el === brandingSection ||
      !!(brandingSection.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) ||
      brandingSection.contains(el);
  }

  /* Direct viewport watcher.
     This page has pinned/scrubbed sections that change layout while scrolling,
     so we deliberately avoid IntersectionObserver/normal ScrollTrigger for
     headings at and below Wraps & Branding. getBoundingClientRect() gives the
     element's real rendered position every frame. */
  const manualTitleReveals = new Map();

  function queueManualTitleReveal(title, chars, lead = 1.14) {
    gsap.set(chars, { autoAlpha: 0, y: 20, filter: "blur(9px)" });
    manualTitleReveals.set(title, { chars, lead });
  }

  function runManualViewportReveals() {
    if (!manualTitleReveals.size) return;

    manualTitleReveals.forEach((item, title) => {
      const rect = title.getBoundingClientRect();
      const triggerY = window.innerHeight * item.lead;

      /* Start before it enters the viewport, but only after it has approached
         from below. This makes the animation visible right as the title arrives. */
      if (rect.top <= triggerY && rect.bottom >= -80) {
        manualTitleReveals.delete(title);
        gsap.to(item.chars, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.68,
          stagger: 0.018,
          ease: "power3.out",
          overwrite: true
        });
      }
    });
  }

  if (!reduceMotion) gsap.ticker.add(runManualViewportReveals);

  gsap.utils.toArray("h1,h2,h3").forEach((title) => {
    if (title === aboutTitle) return;
    if (title.closest(".wrap-branding-card")) return;
    if (title.closest(".pw-menu")) return;

    const chars = splitHeadingIntoChars(title);
    if (!chars.length) return;

    if (reduceMotion) {
      gsap.set(chars, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    const selectedWorksPanel = title.closest(".selected-works-panel");
    const selectedWorksST = ScrollTrigger.getById("performanteGalleryFlow");

    if (selectedWorksPanel?.classList.contains("selected-works-panel--intro")) {
      // The opening title is already in the first panel; reveal it before sideways travel.
      queueManualTitleReveal(title, chars, 1.5);
      return;
    }

    if (selectedWorksPanel && selectedWorksST?.animation) {
      gsap.fromTo(
        chars,
        { autoAlpha: 0, y: 20, filter: "blur(9px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.68,
          stagger: 0.018,
          ease: "power3.out",
          scrollTrigger: {
            trigger: selectedWorksPanel,
            containerAnimation: selectedWorksST.animation,
            start: "left 97%",
            once: true
          }
        }
      );
      return;
    }

    if (isAtOrAfterBranding(title)) {
      /* Wraps & Branding gets a little extra lead; titles below it start
         roughly 12% before reaching the viewport. */
      const lead = title.closest(".wrap-branding-intro") ? 1.20 : 1.12;
      queueManualTitleReveal(title, chars, lead);
      return;
    }

    /* Earlier-page headings can safely keep normal ScrollTrigger timing. */
    gsap.fromTo(
      chars,
      { autoAlpha: 0, y: 20, filter: "blur(9px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.68,
        stagger: 0.018,
        ease: "power3.out",
        scrollTrigger: {
          trigger: title,
          start: "top 94%",
          once: true
        }
      }
    );
  });

  /* 3) Wraps & Branding: reversible scroll-controlled folds.
     Measure the grid plus each card's untransformed layout offset because the
     preceding marquee moves this section. Never measure the animated card. */
  const brandingGrid=document.querySelector(".wrap-branding-grid");
  const brandingCards=brandingGrid?gsap.utils.toArray(brandingGrid.querySelectorAll(".wrap-branding-card")):[];
  if(brandingGrid && brandingCards.length){
    const motion=window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)");
    gsap.set(brandingGrid,{perspective:1400});
    const folds=brandingCards.map(card=>gsap.fromTo(card,
      {autoAlpha:0,rotateX:-72,transformOrigin:"50% 0%",transformPerspective:1400},
      {autoAlpha:1,rotateX:0,duration:1,ease:"none",paused:true}
    ));
    const previous=brandingCards.map(()=>-1);
    let lastScroll=NaN,lastWidth=0,lastHeight=0,lastReduced=null;
    ScrollTrigger.addEventListener("refresh",()=>{lastScroll=NaN;});
    function updateBrandingScroll(){
      if(document.hidden || (window.pwBoot && !window.pwBoot.released))return;
      const height=Math.max(1,window.innerHeight);
      const scroll=window.scrollY;
      if(scroll===lastScroll && window.innerWidth===lastWidth && height===lastHeight && motion.matches===lastReduced)return;
      lastScroll=scroll;lastWidth=window.innerWidth;lastHeight=height;lastReduced=motion.matches;
      const top=brandingGrid.getBoundingClientRect().top;
      const firstOffset=brandingCards[0].offsetTop;
      brandingCards.forEach((card,index)=>{
        const cardTop=top+card.offsetTop-firstOffset;
        const fraction=(height*.98-cardTop)/(height*.60);
        const progress=motion.matches?1:gsap.utils.clamp(0,1,(fraction-index*.055)/.89);
        if(progress===previous[index])return;
        previous[index]=progress;folds[index].progress(progress);
      });
    }
    gsap.ticker.add(updateBrandingScroll);
    updateBrandingScroll();
  }

  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
});


/* ============================================================================
   BLACK5 — WHY / PROCESS / PROOF / CLOSING CTA MOTION
   Uses live rendered viewport positions so the existing pinned sections above
   cannot throw the timing off. Selected Works is intentionally untouched.
   ============================================================================ */
(() => {
  if (typeof gsap === "undefined") return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)").matches;
  /* visibility-safe Black5: no pre-hide class */
  if (reduced) return;

  const jobs = [];

  function liveReveal(trigger, targets, fromVars, toVars, lead = 1.08) {
    if (!trigger || !targets || !targets.length) return;
    gsap.set(targets, fromVars);
    jobs.push({ trigger, targets, toVars, lead, done:false });
  }

  const why = document.querySelector(".pw5-why");
  const whyItems = gsap.utils.toArray(".pw5-why-item");
  liveReveal(
    why,
    whyItems,
    { autoAlpha:0, y:56, filter:"blur(8px)" },
    { autoAlpha:1, y:0, filter:"blur(0px)", duration:.9, stagger:.11, ease:"power3.out" },
    1.08
  );

  const proof = document.querySelector(".pw5-proof");
  const proofItems = gsap.utils.toArray(".pw5-proof-item");
  liveReveal(
    proof,
    proofItems,
    { autoAlpha:0, y:30 },
    { autoAlpha:1, y:0, duration:.65, stagger:.08, ease:"power3.out" },
    1.10
  );

  const cta = document.querySelector(".pw5-closing-cta");
  const ctaImage = document.querySelector(".pw5-closing-cta__media img");
  if (cta && ctaImage && typeof ScrollTrigger !== "undefined") {
    gsap.fromTo(ctaImage,
      { yPercent:-3, scale:1.06 },
      {
        yPercent:3,
        scale:1.02,
        ease:"none",
        scrollTrigger:{
          trigger:cta,
          start:"top bottom",
          end:"bottom top",
          scrub:.8,
          invalidateOnRefresh:true
        }
      }
    );
  }

  function tick() {
    if (!jobs.length) {
      gsap.ticker.remove(tick);
      return;
    }

    for (let i = jobs.length - 1; i >= 0; i--) {
      const job = jobs[i];
      const rect = job.trigger.getBoundingClientRect();
      if (rect.top <= window.innerHeight * job.lead && rect.bottom >= -100) {
        gsap.to(job.targets, { ...job.toVars, overwrite:true });
        jobs.splice(i, 1);
      }
    }
  }

  gsap.ticker.add(tick);
  tick();
})();
/* ============================================================================
   END BLACK5 MOTION
   ============================================================================ */


/* BLACK5 — Process timeline live viewport progress (zoom/pin safe) */
(() => {
  if (typeof gsap === "undefined") return;

  const timeline = document.querySelector(".pw5-process-timeline");
  const fill = document.querySelector(".pw5-process-line__fill");
  const milestones = gsap.utils.toArray(".pw5-process-milestone");
  if (!timeline || !fill || !milestones.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)").matches) {
    gsap.set(fill, { scaleY: 1, transformOrigin: "top center" });
    milestones.forEach((m) => m.classList.add("is-active"));
    return;
  }

  gsap.set(fill, { scaleY: 0, transformOrigin: "top center" });
  const setScale = gsap.quickSetter(fill, "scaleY");

  let thresholds = [];

  function measureThresholds() {
    const h = Math.max(1, timeline.offsetHeight);
    thresholds = milestones.map((m) => {
      const center = m.offsetTop + m.offsetHeight * 0.5;
      return gsap.utils.clamp(0, 1, center / h);
    });
  }

  function updateProcessLine() {
    const rect = timeline.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Start filling when the top of the timeline reaches 72% of the viewport.
    // Finish when the bottom reaches 28% of the viewport.
    // Uses live rendered geometry, so pinning, Lenis and browser zoom do not
    // invalidate the relationship between scroll position and line progress.
    const startY = vh * 0.72;
    const endBottomY = vh * 0.28;
    const travel = Math.max(1, rect.height + startY - endBottomY);
    const progress = gsap.utils.clamp(0, 1, (startY - rect.top) / travel);

    setScale(progress);

    milestones.forEach((milestone, index) => {
      const threshold = thresholds[index] ?? 1;
      milestone.classList.toggle("is-active", progress >= threshold - 0.02);
    });
  }

  measureThresholds();
  gsap.ticker.add(updateProcessLine);
  updateProcessLine();

  window.addEventListener("resize", () => {
    measureThresholds();
    updateProcessLine();
  }, { passive: true });

  window.addEventListener("load", () => {
    measureThresholds();
    updateProcessLine();
  }, { once: true });
})();

/* ============================================================================
   BLACK5 — CLOSING CTA WORDMARK: exact full-width fit + reveal + parallax
   ============================================================================ */
(function () {
  const wrap = document.querySelector(".pw5-closing-cta__wordmark");
  const el = wrap ? wrap.querySelector("span") : null;
  if (!wrap || !el) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce) and (max-width: 760px)").matches;

  function fitWordmark() {
    el.style.transform = "none";
    const wrapRect = wrap.getBoundingClientRect();
    const textRect = el.getBoundingClientRect();
    if (wrapRect.width > 0 && textRect.width > 0) {
      const scale = wrapRect.width / textRect.width;
      // Correct for any residual left offset (whitespace, font side-bearing,
      // etc.) so the visible glyphs — not just the box — touch the left edge.
      const leftOffset = textRect.left - wrapRect.left;
      el.style.transform =
        "translateX(" + -leftOffset + "px) scaleX(" + scale + ")";
    }
  }

  fitWordmark();
  window.addEventListener("resize", fitWordmark, { passive: true });
  window.addEventListener("load", fitWordmark, { once: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitWordmark).catch(function () {});
  }

  if (reduceMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Curtain-style reveal: the word opens up from the center as the section
  // scrolls into view, echoing the rest of the page's scroll-triggered reveals.
  gsap.set(wrap, { clipPath: "inset(0% 100% 0% 0%)" });
  gsap.to(wrap, {
    clipPath: "inset(0% 0% 0% 0%)",
    ease: "power3.out",
    scrollTrigger: {
      trigger: wrap,
      start: "top 90%",
      end: "top 45%",
      scrub: 0.6,
    },
  });

  // Subtle parallax pan on the image-through-text fill so it feels alive
  // rather than a static cutout.
  gsap.fromTo(
    el,
    { backgroundPosition: "center, 0% 42%" },
    {
      backgroundPosition: "center, 100% 42%",
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
      },
    }
  );
})();

;

/* ========================================================================== */
/* js\index-copy-trucks.js */
/* ========================================================================== */
document.addEventListener('DOMContentLoaded',()=>{
  const section=document.querySelector('.pw-truck-roll');
  if(!section||!window.gsap||!window.ScrollTrigger||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  gsap.registerPlugin(ScrollTrigger);
  const trucks=gsap.utils.toArray('.pw-truck-roll__truck');
  const caption=section.querySelector('.pw-truck-roll__caption');
  const description=section.querySelector('.pw-truck-roll__description');
  let activeIndex=-1;
  const showTruck=index=>{
    if(index===activeIndex)return;
    activeIndex=index;
    caption.textContent=`0${index+1} / 03  —  ${trucks[index].dataset.title}`;
    description.textContent=trucks[index].dataset.copy;
  };
  const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:'top top',end:'bottom bottom',scrub:1,invalidateOnRefresh:true,onUpdate:self=>showTruck(Math.min(trucks.length-1,Math.floor(self.animation.time()/1.45)))}});
  trucks.forEach((truck,index)=>{
    const start=index*1.45;
    timeline.fromTo(truck,{x:()=>-truck.offsetWidth-40,opacity:0,scale:.9,rotationY:-22},{x:()=>(innerWidth-truck.offsetWidth)/2,opacity:1,scale:1,rotationY:0,duration:.52,ease:'power2.out',onStart:()=>showTruck(index),onReverseComplete:()=>showTruck(Math.max(0,index-1))},start);
    timeline.to(truck,{x:()=>innerWidth+40,opacity:0,scale:.9,rotationY:22,duration:.6,ease:'power2.in'},start+.78);
  });
});

;

/* ========================================================================== */
/* js\index2-hero.js */
/* ========================================================================== */
// Upgrade the other CTAs before the legacy pill initializer runs.
document.querySelectorAll('.about-project-link, .pw-truck-roll__project, .selected-works-button, .selected-project-card__link').forEach(link=>{
  const name=link.textContent.trim();
  link.classList.remove('pw-btn');
  link.classList.add('index2-text-link','index2-motion-link');
  link.innerHTML=`<span class="hero-project-link__arrow-window hero-project-link__arrow-window--left" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="index2-text-link__label"></span><span class="hero-project-link__arrow-window hero-project-link__arrow-window--right" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="hero-project-link__underline" aria-hidden="true"></span>`;
  link.querySelector('.index2-text-link__label').textContent=name;
});

document.addEventListener('DOMContentLoaded',()=>{
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.index2-text-link').forEach(link=>{
    const label=link.querySelector('.index2-text-link__label');
    const arrow=link.querySelector('svg');
    if(!label||!arrow)return;
    const name=label.textContent.trim();
    label.textContent='';
    link.setAttribute('aria-label',name);
    const letters=[...name].map(char=>{
      const span=document.createElement('span');
      span.className='index2-text-link__letter';
      span.textContent=char;
      span.setAttribute('aria-hidden','true');
      label.appendChild(span);
      return span;
    });
    if(reduced||!window.gsap)return;
    if(link.classList.contains('index2-motion-link')){
      link.style.width=`${link.offsetWidth}px`;
      const rightArrow=link.querySelector('.hero-project-link__arrow-window--right svg');
      const leftWindow=link.querySelector('.hero-project-link__arrow-window--left');
      const leftArrow=leftWindow.querySelector('svg');
      const underline=link.querySelector('.hero-project-link__underline');
      gsap.set(leftArrow,{x:-24});
      const sweep=gsap.timeline({paused:true})
        .set(underline,{transformOrigin:'right center',scaleX:1})
        .to(underline,{scaleX:0,duration:.24,ease:'power2.inOut'})
        .set(underline,{transformOrigin:'left center'})
        .to(underline,{scaleX:1,duration:.28,ease:'power2.out'});
      const motion=gsap.timeline({paused:true,defaults:{ease:'power2.inOut'}});
      motion.to(rightArrow,{x:24,duration:.24},0)
        .to(letters,{x:34,duration:.23,stagger:{each:.025,from:'end'}},.04)
        .to(leftWindow,{opacity:1,duration:.01},.19)
        .to(leftArrow,{x:0,duration:.24},.2);
      link.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){motion.play();sweep.restart();}});
      link.addEventListener('pointerleave',()=>motion.reverse());
      link.addEventListener('focus',()=>{motion.play();sweep.restart();});
      link.addEventListener('blur',()=>motion.reverse());
      return;
    }
    const enter=()=>{
      gsap.killTweensOf(letters);
      gsap.fromTo(letters,{x:0},{x:3,duration:.18,stagger:{each:.012,from:'start'},ease:'power2.out',overwrite:true});
      gsap.to(arrow,{x:0,opacity:1,duration:.18,overwrite:true});
    };
    const leave=()=>{
      gsap.killTweensOf(letters);
      gsap.to(letters,{x:0,duration:.12,overwrite:true});
      gsap.to(arrow,{x:-5,opacity:.65,duration:.12,overwrite:true});
    };
    link.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')enter();});
    link.addEventListener('pointerleave',leave);
    link.addEventListener('focus',enter);
    link.addEventListener('blur',leave);
  });
  const image=document.querySelector('.wrap-about-panel__motto-media');
  if(image&&!reduced&&window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(image,{clipPath:'inset(0 100% 0 0)'},{
      clipPath:'inset(0 0% 0 0)',ease:'none',
      scrollTrigger:{trigger:image,start:'top 90%',end:'bottom 45%',scrub:true,invalidateOnRefresh:true}
    });
  }
});
