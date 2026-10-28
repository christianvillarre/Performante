(() => {
  document.querySelectorAll('.vw-hero__marquee').forEach(marquee => {
    const track = marquee.querySelector('.vw-hero__marquee-track');
    const firstGroup = track?.querySelector('.vw-hero__marquee-group');
    if (!track || !firstGroup) return;

    const fill = () => {
      const groupWidth = firstGroup.getBoundingClientRect().width;
      if (!groupWidth) return;

      // The animated half must be wider than the visible window. Appending
      // matching pairs keeps both halves identical at the loop boundary.
      while ((track.children.length / 2) * groupWidth < marquee.clientWidth + groupWidth && track.children.length < 20) {
        for (let copy = 0; copy < 2; copy++) {
          const group = firstGroup.cloneNode(true);
          group.setAttribute('aria-hidden', 'true');
          track.appendChild(group);
        }
      }

      const loopDistance = (track.children.length / 2) * groupWidth;
      track.style.setProperty('--marquee-duration', `${loopDistance / 40}s`);
      track.classList.add('is-ready');
    };

    fill();
    document.fonts?.ready.then(fill);
    new ResizeObserver(fill).observe(marquee);
    new ResizeObserver(fill).observe(firstGroup);
  });
})();
