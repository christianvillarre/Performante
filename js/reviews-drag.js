(() => {
  const marquee = document.querySelector('.wrap-testimonials__marquee');
  const track = marquee?.querySelector('.wrap-testimonials__track');
  if (!track) return;

  let pointerId = null;
  let startX = 0;
  let startTime = 0;
  let moved = false;
  let suppressClick = false;
  let animation = null;

  const getAnimation = () => track.getAnimations().find(item => item.animationName === 'pw-testimonials-scroll');
  const cycleWidth = () => track.getBoundingClientRect().width / 2;

  marquee.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointerId !== null) return;
    animation = getAnimation();
    if (!animation) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startTime = animation.currentTime || 0;
    moved = false;
    animation.pause();
    marquee.setPointerCapture(pointerId);
  });

  marquee.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId || !animation) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 6) {
      moved = true;
      marquee.classList.add('is-dragging');
    }
    if (!moved) return;
    const duration = animation.effect.getTiming().duration;
    const width = cycleWidth();
    if (width && duration) animation.currentTime = ((startTime - delta / width * duration) % duration + duration) % duration;
  });

  const finish = event => {
    if (event.pointerId !== pointerId) return;
    suppressClick = moved;
    marquee.classList.remove('is-dragging');
    if (marquee.hasPointerCapture(pointerId)) marquee.releasePointerCapture(pointerId);
    pointerId = null;
    if (animation && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) animation.play();
    animation = null;
  };
  marquee.addEventListener('pointerup', finish);
  marquee.addEventListener('pointercancel', finish);

  marquee.addEventListener('click', event => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
      return;
    }
    if (event.target.closest('a')) return;
    const link = event.target.closest('.wrap-testimonials__card')?.querySelector('a.wrap-testimonials__role');
    if (link) window.open(link.href, '_blank', 'noopener,noreferrer');
  }, true);
})();
