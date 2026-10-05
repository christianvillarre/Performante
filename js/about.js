/* Typography-led About. Animation is enhancement; static content stays complete. */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add({motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width:761px) and (min-height:650px)', wide: '(min-width:761px)'}, context => {
    if (!context.conditions.motion) return;
    const desktop = context.conditions.desktop;
    const horizontal = context.conditions.wide;
    const restore = [];
    const split = heading => {
      const original = heading.innerHTML;
      const oldLabel = heading.getAttribute('aria-label');
      heading.setAttribute('aria-label', heading.innerText.replace(/\s+/g, ' ').trim());
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(word => {
          if (!word.trim()) return frag.append(document.createTextNode(word));
          const clip = document.createElement('span');
          clip.className = 'at-word-clip'; clip.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span'); inner.className = 'at-word'; inner.textContent = word;
          clip.append(inner); frag.append(clip);
        });
        node.replaceWith(frag);
      });
      restore.push(() => {
        heading.innerHTML = original;
        if (oldLabel === null) heading.removeAttribute('aria-label'); else heading.setAttribute('aria-label', oldLabel);
      });
      return heading.querySelectorAll('.at-word');
    };
    document.querySelectorAll('[data-words]').forEach(heading => {
      const words = split(heading);
      if (heading.classList.contains('at-title')) {
        gsap.from(words, {yPercent: 105, rotation: 2, opacity: 0, duration: 1.2, stagger: {amount: .8}, ease: 'power4.out', delay: .15});
      } else if (heading.classList.contains('at-manifesto')) {
        gsap.fromTo(words, {color: '#4e4d4a'}, {color: '#f2f0ed', stagger: .15, ease: 'none',
          scrollTrigger: {trigger: heading, start: 'top 78%', end: 'bottom 48%', scrub: .35}});
      } else {
        gsap.from(words, {yPercent: 108, rotation: 3, duration: .9, stagger: .055, ease: 'power3.out',
          scrollTrigger: {trigger: heading, start: 'top 87%', toggleActions: 'play none none reverse'}});
      }
    });
    gsap.from('.at-intro .at-kicker, .at-intro__description, .at-scroll', {opacity: 0, y: 15, stagger: .12, duration: 1, delay: .45});
    gsap.to('.at-intro__inner', {y: -55, opacity: .2, ease: 'none', scrollTrigger: {trigger: '.at-intro', start: 'top top', end: 'bottom 20%', scrub: .5}});
    gsap.utils.toArray('.at-service').forEach((row, i) => {
      gsap.from(row.querySelectorAll('h3, p, .at-index, .at-service__arrow'), {
        x: i % 2 ? 20 : -20, opacity: 0, stagger: .05, ease: 'none',
        scrollTrigger: {trigger: row, start: 'top 90%', end: 'top 62%', scrub: .4}
      });
    });
    const photo = document.querySelector('.at-photo-break__frame');
    gsap.fromTo(photo, {clipPath: 'inset(14% 16% 14% 16%)'}, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: {
        trigger: '.at-photo-break', start: 'top 92%', end: 'top 18%', scrub: .65
      }
    });
    gsap.fromTo(photo.querySelector('img'), {scale: 1.12, yPercent: -4}, {
      scale: 1, yPercent: 4, ease: 'none', scrollTrigger: {
        trigger: '.at-photo-break', start: 'top bottom', end: 'bottom top', scrub: .8
      }
    });
    gsap.from('.at-ambition__foot', {y: 35, opacity: 0, ease: 'none', scrollTrigger: {
      trigger: '.at-ambition__foot', start: 'top 92%', end: 'top 62%', scrub: .4
    }});
    const points = gsap.utils.toArray('.ab-values__point');
    const dots = gsap.utils.toArray('.ab-values__dot');
    const track = document.querySelector('.ab-values__line-track');
    const fractions = [];
    const measure = () => {
      const length = horizontal ? track.offsetWidth : track.offsetHeight;
      points.forEach((point, i) => {
        const position = horizontal ? point.offsetLeft + 4 : point.offsetTop + 4;
        fractions[i] = Math.min(.99, position / Math.max(1, length));
        gsap.set(dots[i], horizontal ? {left: position, top: 0} : {left: 0, top: position});
      });
    };
    measure(); ScrollTrigger.addEventListener('refreshInit', measure);
    const axis = horizontal ? 'scaleX' : 'scaleY';
    gsap.set('.ab-values__line', {[axis]: 0});
    gsap.set(dots, {opacity: 0, scale: .5});
    gsap.set(points, {opacity: 0, y: 24});
    const values = gsap.timeline({scrollTrigger: {trigger: '.ab-values', start: desktop ? 'top top' : 'top 25%',
      end: desktop ? '+=1000' : 'bottom 65%', pin: desktop, scrub: .35, invalidateOnRefresh: true}});
    values.to({}, {duration: .25});
    points.forEach((point, i) => {
      values.to('.ab-values__line', {[axis]: () => fractions[i], duration: i ? 1 : .15, ease: 'none'})
        .to(dots[i], {opacity: 1, scale: 1, duration: .12})
        .to(point, {opacity: 1, y: 0, duration: .5, ease: 'power2.out'});
    });
    values.to('.ab-values__line', {[axis]: 1, duration: .5, ease: 'none'}).to({}, {duration: .2});
    gsap.utils.toArray('.at-step').forEach(step => {
      const sequence = gsap.timeline({scrollTrigger: {trigger: step, start: 'top 88%', end: 'top 40%', scrub: .5}});
      sequence.from(step.querySelector('h3'), {yPercent: 65, opacity: 0, clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'power2.out'})
        .from(step.querySelector('.at-step__num'), {x: -25, opacity: 0, duration: .7}, 0)
        .from(step.querySelector('p'), {y: 25, opacity: 0, duration: .6}, .5)
        .fromTo(step.querySelector('.at-step__media'), {clipPath: 'inset(0% 0% 100% 0%)', y: 35},
          {clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.1, ease: 'power2.out'}, .15)
        .fromTo(step.querySelector('img'), {scale: 1.16}, {scale: 1, duration: 1.1, ease: 'none'}, .15);
    });
    gsap.from('.at-process__closing', {y: 30, opacity: 0, duration: 1, scrollTrigger: {trigger: '.at-process__closing', start: 'top 88%', toggleActions: 'play none none reverse'}});
    gsap.from('.at-founder__role, .at-founder__bio p', {y: 22, opacity: 0, stagger: .14, duration: .9, ease: 'power2.out',
      scrollTrigger: {trigger: '.at-founder__content', start: 'top 82%', toggleActions: 'play none none reverse'}});
    let lenis;
    const tick = time => lenis.raf(time * 1000);
    if (window.Lenis) {
      lenis = new Lenis({autoRaf: false}); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(tick);
    }
    return () => {
      if (lenis) {gsap.ticker.remove(tick); lenis.destroy();}
      ScrollTrigger.removeEventListener('refreshInit', measure);
      restore.forEach(fn => fn());
    };
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), {once:true});
})();
