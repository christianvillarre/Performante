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
