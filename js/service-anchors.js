(() => {
  const links = document.querySelectorAll('.vws-intro-list a[href^="#"]');
  if (!links.length) return;
  // Stable flow markers retain each card's original position after it sticks.
  const markers = new Map();
  links.forEach(link => {
    const hash = link.getAttribute('href');
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    if (!markers.has(target)) {
      const marker = document.createElement('span');
      marker.setAttribute('aria-hidden', 'true');
      marker.style.cssText = 'display:block;height:0;pointer-events:none';
      target.before(marker);
      markers.set(target, marker);
    }
    link.addEventListener('click', event => {
      if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const nav = document.querySelector('.pw-nav');
      const navStyle = nav && getComputedStyle(nav);
      const navBottom = navStyle && ['fixed', 'sticky'].includes(navStyle.position)
        ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const offset = mobile ? Math.max(padding, navBottom + 8) : 0;
      const top = Math.max(0, window.scrollY + markers.get(target).getBoundingClientRect().top - offset + (mobile ? 0 : 20));
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (location.hash !== hash) history.pushState(null, '', hash);
      if (mobile) {
        // Use the native element destination for touch layouts; the cards are
        // normal flow blocks here, so browser scrolling handles their height.
        target.style.scrollMarginTop = `${offset}px`;
        target.scrollIntoView({block: 'start', behavior: reduced ? 'instant' : 'smooth'});
      } else if (window.serviceLenis && !reduced) {
        window.serviceLenis.scrollTo(top, {duration: 1.1, force: true});
      } else {
        window.scrollTo({top, behavior: reduced ? 'instant' : 'smooth'});
      }
    }, {capture: true});
  });
})();
