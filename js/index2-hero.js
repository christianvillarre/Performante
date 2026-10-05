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
