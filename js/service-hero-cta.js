document.addEventListener('DOMContentLoaded', () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.vw-hero__cta.index2-motion-link').forEach(link => {
    const label = link.querySelector('.index2-text-link__label');
    const rightArrow = link.querySelector('.hero-project-link__arrow-window--right svg');
    const leftWindow = link.querySelector('.hero-project-link__arrow-window--left');
    const leftArrow = leftWindow?.querySelector('svg');
    const underline = link.querySelector('.hero-project-link__underline');
    if (!label || !rightArrow || !leftWindow || !leftArrow || !underline) return;

    const name = label.textContent.trim();
    link.setAttribute('aria-label', name);
    label.textContent = '';
    const letters = [...name].map(char => {
      const span = document.createElement('span');
      span.className = 'index2-text-link__letter';
      span.textContent = char;
      span.setAttribute('aria-hidden', 'true');
      label.appendChild(span);
      return span;
    });

    if (reduced || !window.gsap) return;
    link.style.width = `${link.offsetWidth}px`;
    gsap.set(leftArrow, { x: -24 });

    const sweep = gsap.timeline({ paused: true })
      .set(underline, { transformOrigin: 'right center', scaleX: 1 })
      .to(underline, { scaleX: 0, duration: .24, ease: 'power2.inOut' })
      .set(underline, { transformOrigin: 'left center' })
      .to(underline, { scaleX: 1, duration: .28, ease: 'power2.out' });
    const motion = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    motion.to(rightArrow, { x: 24, duration: .24 }, 0)
      .to(letters, { x: 34, duration: .23, stagger: { each: .025, from: 'end' } }, .04)
      .to(leftWindow, { opacity: 1, duration: .01 }, .19)
      .to(leftArrow, { x: 0, duration: .24 }, .2);

    const enter = () => { motion.play(); sweep.restart(); };
    const leave = () => motion.reverse();
    link.addEventListener('pointerenter', enter);
    link.addEventListener('pointerleave', leave);
    link.addEventListener('pointerup', event => { if (event.pointerType === 'touch') leave(); });
    link.addEventListener('pointercancel', leave);
    link.addEventListener('focus', enter);
    link.addEventListener('blur', leave);
  });
});
