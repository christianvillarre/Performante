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
          const glyph=document.createElement('span');
          glyph.className='pw-truck-roll__glyph';
          glyph.textContent=character;
          const halo=document.createElement('span');
          halo.className='pw-truck-roll__halo';
          halo.textContent=character;
          halo.setAttribute('aria-hidden','true');
          // Rasterize the blurred glow once; only its opacity changes on scroll.
          halo.style.setProperty('--glow-radius',`${26+Math.random()*16}px`);
          letter.append(glyph,halo);
          group.append(letter);
        });
        title.append(group);
      });
    });
    section.classList.add('is-animated');
    const letters=section.querySelectorAll('.pw-truck-roll__letter');
    gsap.set(letters,{opacity:0,y:90,force3D:true});
    // The sticky stage releases during the last exit; the remaining scroll
    // continues the same timeline so reversing always retraces every letter.
    const timeline=gsap.timeline({scrollTrigger:{
      trigger:section,start:'top top',
      end:()=>'+='+(section.offsetHeight-innerHeight+innerHeight*.32),
      scrub:.18,invalidateOnRefresh:true
    }});
    // Choose timing once, so refreshes and reverse scrolling retrace the same glow.
    const randomOffsets=(count,amount)=>{
      const values=Array.from({length:count},()=>Math.random());
      const min=Math.min(...values);
      const range=Math.max(...values)-min||1;
      return values.map(value=>(value-min)/range*amount);
    };
    gsap.set(section.querySelectorAll('.pw-truck-roll__halo'),{opacity:0});
    titles.forEach((title,index)=>{
      const chars=[...title.querySelectorAll('.pw-truck-roll__letter')];
      const arrivals=randomOffsets(chars.length,.19);
      const departures=randomOffsets(chars.length,.19);
      const start=index*.88;
      chars.forEach((letter,letterIndex)=>{
        const glyph=letter.querySelector('.pw-truck-roll__glyph');
        const halo=letter.querySelector('.pw-truck-roll__halo');
        const arrival=start+arrivals[letterIndex];
        const departure=start+.70+departures[letterIndex];
        timeline.to(letter,{opacity:1,y:0,duration:.29,ease:'power2.out'},arrival);
        timeline.fromTo(glyph,{opacity:0},{opacity:1,duration:.20,ease:'sine.out'},arrival+.09);
        timeline.to(halo,{opacity:1,duration:.09,ease:'sine.out'},arrival);
        timeline.to(halo,{opacity:0,duration:.23,ease:'sine.in'},arrival+.16);
        timeline.to(letter,{opacity:0,y:-100,duration:.30,ease:'power2.in'},departure);
        timeline.to(glyph,{opacity:0,duration:.20,ease:'sine.in'},departure);
        timeline.to(halo,{opacity:1,duration:.08,ease:'sine.out'},departure);
        timeline.to(halo,{opacity:0,duration:.16,ease:'sine.in'},departure+.14);
      });
    });
    return ()=>{
      section.classList.remove('is-animated');
      titles.forEach((title,index)=>{title.textContent=originals[index];title.removeAttribute('aria-label');});
    };
  });
});
