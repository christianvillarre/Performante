(() => {
  const media = window.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
  let lenis;
  let tick;

  function stop() {
    if (!lenis) return;
    if (tick && window.gsap) gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = undefined;
    tick = undefined;
  }

  function sync() {
    stop();
    if (!media.matches || !window.Lenis) return;

    lenis = new Lenis({autoRaf: false});
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      tick = time => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
    } else {
      const current = lenis;
      const raf = time => {
        if (lenis !== current) return;
        current.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  media.addEventListener('change', sync);
  sync();
})();
