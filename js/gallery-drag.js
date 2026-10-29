(() => {
  const viewport = document.getElementById('pwGallery');
  const track = viewport?.querySelector('.pw-gallery__track');
  const firstSet = track?.querySelector('.pw-gallery__set');
  if (!viewport || !track || !firstSet) return;

  let pointerId = null;
  let startX = 0;
  let startTime = 0;
  let moved = false;
  let animation = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const getAnimation = () => track.getAnimations().find(item => item.animationName === 'pw-gallery-scroll');

  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointerId !== null || reducedMotion.matches) return;
    animation = getAnimation();
    if (!animation) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startTime = animation.currentTime || 0;
    moved = false;
    animation.pause();
    viewport.setPointerCapture(pointerId);
  });

  viewport.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId || !animation) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 6) {
      moved = true;
      viewport.classList.add('is-dragging');
    }
    if (!moved) return;
    const width = firstSet.getBoundingClientRect().width;
    const duration = animation.effect.getTiming().duration;
    if (width && duration) animation.currentTime = ((startTime + delta / width * duration) % duration + duration) % duration;
  });

  const finish = event => {
    if (event.pointerId !== pointerId) return;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
    pointerId = null;
    animation?.play();
    animation = null;
  };
  viewport.addEventListener('pointerup', finish);
  viewport.addEventListener('pointercancel', finish);
  viewport.addEventListener('dragstart', event => event.preventDefault());
})();
