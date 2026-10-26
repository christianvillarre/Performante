(() => {
  const year = document.getElementById('pwFooterYear');
  if (year) year.textContent = new Date().getFullYear();

  if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollTrigger) {
    gsap.utils.toArray('.ct-inquiry .ct-reveal').forEach((element) => {
      gsap.from(element, {opacity: 0, y: 55, duration: 1.05, ease: 'power3.out', scrollTrigger: {trigger: element, start: 'top 86%', toggleActions: 'play none none reverse'}});
    });
    gsap.from('.ct-outro p', {opacity: 0, y: 45, duration: 1, ease: 'power3.out', scrollTrigger: {trigger: '.ct-outro', start: 'top 75%', toggleActions: 'play none none reverse'}});
  }
})();
