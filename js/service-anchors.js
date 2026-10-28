(() => {
  const links = document.querySelectorAll('.vws-intro-list a[href^="#"]');
  if (!links.length) return;

  links.forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const hash = link.getAttribute('href');
      const target = hash && document.getElementById(hash.slice(1));
      if (!target) return;

      event.preventDefault();
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const top = window.scrollY + target.getBoundingClientRect().top - offset;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (location.hash !== hash) history.pushState(null, '', hash);
      if (window.matchMedia('(min-width: 761px)').matches && window.serviceLenis && !reduceMotion) {
        window.serviceLenis.scrollTo(top, { duration: 1.25 });
      } else {
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  });
})();
