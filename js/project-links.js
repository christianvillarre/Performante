// Give project CTAs the same arrow and underline motion as the index links.
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.project-button, .case-intro__cta, .project-card__link');
  const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  links.forEach(link => {
    const name = link.textContent.replace('↗', '').trim();
    link.classList.add('project-motion-link');
    link.innerHTML = `<span class="project-motion-link__arrow project-motion-link__arrow--left" aria-hidden="true">${arrow}</span><span class="project-motion-link__label"></span><span class="project-motion-link__arrow project-motion-link__arrow--right" aria-hidden="true">${arrow}</span><span class="project-motion-link__underline" aria-hidden="true"></span>`;
    const label = link.querySelector('.project-motion-link__label');
    label.textContent = '';
    const letters = [...name].map(char => {
      const span = document.createElement('span');
      span.className = 'project-motion-link__letter';
      span.textContent = char;
      span.setAttribute('aria-hidden', 'true');
      label.appendChild(span);
      return span;
    });
    if (link.tagName === 'A') link.setAttribute('aria-label', name);
    if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rightArrow = link.querySelector('.project-motion-link__arrow--right svg');
    const leftWindow = link.querySelector('.project-motion-link__arrow--left');
    const leftArrow = leftWindow.querySelector('svg');
    const underline = link.querySelector('.project-motion-link__underline');
    gsap.set(leftArrow, { x: -24 });
    const sweep = gsap.timeline({ paused: true })
      .set(underline, { transformOrigin: 'right center', scaleX: 1 })
      .to(underline, { scaleX: 0, duration: .24, ease: 'power2.inOut' })
      .set(underline, { transformOrigin: 'left center' })
      .to(underline, { scaleX: 1, duration: .28, ease: 'power2.out' });
    const motion = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
      .to(rightArrow, { x: 24, duration: .24 }, 0)
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
