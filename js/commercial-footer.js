(function () {
  const wrap = document.querySelector(".pw5-closing-cta__wordmark");
  const el = wrap ? wrap.querySelector("span") : null;
  if (!wrap || !el) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fitWordmark() {
    el.style.transform = "none";
    const wrapRect = wrap.getBoundingClientRect();
    const textRect = el.getBoundingClientRect();
    if (wrapRect.width > 0 && textRect.width > 0) {
      const scale = wrapRect.width / textRect.width;
      // Correct for any residual left offset (whitespace, font side-bearing,
      // etc.) so the visible glyphs — not just the box — touch the left edge.
      const leftOffset = textRect.left - wrapRect.left;
      el.style.transform =
        "translateX(" + -leftOffset + "px) scaleX(" + scale + ")";
    }
  }

  fitWordmark();
  window.addEventListener("resize", fitWordmark, { passive: true });
  window.addEventListener("load", fitWordmark, { once: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitWordmark).catch(function () {});
  }

  if (reduceMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Keep the complete wordmark visible throughout scrolling.
  wrap.style.clipPath = 'none';

  // Subtle parallax pan on the image-through-text fill so it feels alive
  // rather than a static cutout.
  gsap.fromTo(
    el,
    { backgroundPosition: "center, 0% 42%" },
    {
      backgroundPosition: "center, 100% 42%",
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
      },
    }
  );
})();