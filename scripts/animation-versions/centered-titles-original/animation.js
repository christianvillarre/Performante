document.addEventListener('DOMContentLoaded',()=>{
  const section=document.querySelector('.pw-truck-roll');
  if(!section||!window.gsap||!window.ScrollTrigger)return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)',()=>{
    const titles=[...section.querySelectorAll('.pw-truck-roll__title')];
    const originals=titles.map(title=>title.textContent);
    titles.forEach(title=>{
      title.setAttribute('aria-label',title.textContent);
      const words=title.textContent.split(' ');
      title.replaceChildren();
      words.forEach((word,index)=>{
        if(index)title.append(' ');
        const group=document.createElement('span');
        group.className='pw-truck-roll__word';
        group.setAttribute('aria-hidden','true');
        [...word].forEach(character=>{
          const letter=document.createElement('span');
          letter.className='pw-truck-roll__letter';
          letter.textContent=character;
          group.append(letter);
        });
        title.append(group);
      });
    });
    section.classList.add('is-animated');
    const letters=section.querySelectorAll('.pw-truck-roll__letter');
    gsap.set(letters,{opacity:0,y:32,filter:'blur(12px)'});
    // The sticky stage releases during the last exit; the remaining scroll
    // continues the same timeline so reversing always retraces every letter.
    const timeline=gsap.timeline({scrollTrigger:{
      trigger:section,start:'top top',
      end:()=>'+='+(section.offsetHeight-innerHeight+innerHeight*.32),
      scrub:true,invalidateOnRefresh:true
    }});
    titles.forEach((title,index)=>{
      const chars=title.querySelectorAll('.pw-truck-roll__letter');
      const start=index*1.15;
      timeline.to(chars,{opacity:1,y:0,filter:'blur(0px)',duration:.38,
        stagger:{amount:.28,from:'start'},ease:'power2.out'},start);
      timeline.to(chars,{opacity:0,y:-38,filter:'blur(12px)',duration:.4,
        stagger:{amount:.26,from:'end'},ease:'power2.in'},start+.92);
    });
    return ()=>{
      section.classList.remove('is-animated');
      titles.forEach((title,index)=>{title.textContent=originals[index];title.removeAttribute('aria-label');});
    };
  });
});
