/* Three card groups keep the vehicle collection continuous in both directions. */
(() => {
  document.querySelectorAll('.pw-vehicles').forEach(section => {
    const track = section.querySelector('.pw-vehicles__track');
    const cards = [...track.querySelectorAll('.pw-vehicles__card')];
    if (!track || !cards.length) return;

    cards.forEach(card => card.querySelectorAll('img').forEach(image => { image.loading = 'eager'; }));
    const firstGroup = document.createElement('div');
    firstGroup.className = 'pw-vehicles__group';
    cards.forEach(card => firstGroup.appendChild(card));
    track.appendChild(firstGroup);
    const secondGroup = firstGroup.cloneNode(true);
    secondGroup.setAttribute('aria-hidden', 'true');
    secondGroup.querySelectorAll('.pw-vehicles__card').forEach(card => { card.dataset.copy = 'true'; });
    track.appendChild(secondGroup);
    const thirdGroup = secondGroup.cloneNode(true);
    track.appendChild(thirdGroup);
    const groups = [firstGroup, secondGroup, thirdGroup];

    if (matchMedia('(max-width: 600px)').matches) {
      // Keep two complete sets ready on either side of the visible set.
      for (let index = 0; index < 2; index++) {
        const extraGroup = secondGroup.cloneNode(true);
        track.appendChild(extraGroup);
        groups.push(extraGroup);
      }
      const pause = section.querySelector('[data-vehicle-pause]');
      const status = section.querySelector('[data-vehicle-status]');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      let groupWidth = 0;
      let paused = false;
      let touching = false;
      let touchStartX = 0;
      let touchStartY = 0;
      let dragged = false;
      let oppositeDrag = false;
      let userScrolling = false;
      let manualUntil = 0;
      let lastFrame = 0;
      let scrollRemainder = 0;
      let settleTimer = 0;
      let lastVisibilityCheck = 0;
      let nearScreen = false;

      const setScroll = value => {
        track.scrollLeft = value;
      };
      const measureMobile = () => {
        const nextWidth = cards.reduce((sum, card) => sum + card.getBoundingClientRect().width, 0);
        if (!nextWidth) return;
        const progress = groupWidth ? (track.scrollLeft - groupWidth * 2) / groupWidth : 0;
        groups.forEach(group => {
          group.style.width = `${nextWidth}px`;
          group.style.flexBasis = `${nextWidth}px`;
        });
        track.style.height = `${firstGroup.offsetHeight}px`;
        groupWidth = nextWidth;
        setScroll(groupWidth * (2 + progress));
      };
      const recenterMobile = force => {
        if (!groupWidth) return;
        const position = track.scrollLeft;
        if (position >= groupWidth * 1.5 && position <= groupWidth * 3.5) return;
        if (touching && !force) return;
        const offset = ((position % groupWidth) + groupWidth) % groupWidth;
        setScroll(groupWidth * 2 + offset);
      };
      const scheduleRecenter = () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          userScrolling = false;
          recenterMobile(false);
        }, 180);
      };

      section.classList.add('is-mobile-loop');
      measureMobile();
      new ResizeObserver(measureMobile).observe(firstGroup);
      track.addEventListener('scroll', () => {
        if (userScrolling) scheduleRecenter();
      }, { passive: true });
      track.addEventListener('touchstart', event => {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        dragged = false;
        oppositeDrag = false;
      }, { passive: true });
      track.addEventListener('touchmove', event => {
        const dx = event.touches[0].clientX - touchStartX;
        const dy = event.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          touching = true;
          dragged = true;
          userScrolling = true;
          if (dx > 0) oppositeDrag = true;
        }
      }, { passive: true });
      const finishTouch = () => {
        touching = false;
        if (dragged) manualUntil = performance.now() + (oppositeDrag ? 2000 : 250);
        scheduleRecenter();
      };
      track.addEventListener('touchend', finishTouch, { passive: true });
      track.addEventListener('touchcancel', finishTouch, { passive: true });
      const frameMobile = now => {
        const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0;
        lastFrame = now;
        if (now - lastVisibilityCheck > 250) {
          const bounds = section.getBoundingClientRect();
          nearScreen = bounds.bottom > -200 && bounds.top < window.innerHeight + 200;
          lastVisibilityCheck = now;
        }
        if (nearScreen && groupWidth && !paused && !touching && !userScrolling && !reduced.matches && !document.hidden && now >= manualUntil) {
          const distance = scrollRemainder + dt * Math.max(36, groupWidth / 110);
          const wholePixels = Math.floor(distance);
          scrollRemainder = distance - wholePixels;
          if (wholePixels) setScroll(track.scrollLeft + wholePixels);
          recenterMobile(false);
        } else if (groupWidth && (track.scrollLeft < groupWidth * .25 || track.scrollLeft > groupWidth * 4.5)) {
          recenterMobile(true);
        }
        requestAnimationFrame(frameMobile);
      };
      requestAnimationFrame(frameMobile);
      const moveMobile = direction => {
        const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
        setScroll(track.scrollLeft + direction * step);
        scheduleRecenter();
        if (status) status.textContent = direction > 0 ? 'Moving vehicles right' : 'Moving vehicles left';
      };
      section.querySelector('[data-vehicle-prev]')?.addEventListener('click', () => moveMobile(-1));
      section.querySelector('[data-vehicle-next]')?.addEventListener('click', () => moveMobile(1));
      track.addEventListener('keydown', event => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        moveMobile(event.key === 'ArrowRight' ? 1 : -1);
      });
      pause?.addEventListener('click', () => {
        paused = !paused;
        pause.textContent = paused ? 'Play' : 'Pause';
        pause.setAttribute('aria-pressed', String(paused));
        pause.setAttribute('aria-label', paused ? 'Play automatic vehicle scrolling' : 'Pause automatic vehicle scrolling');
      });
      return;
    }

    const pause = section.querySelector('[data-vehicle-pause]');
    const status = section.querySelector('[data-vehicle-status]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 600px)');
    let width = 0;
    let positions = [];
    let ready = false;
    let visible = false;
    let paused = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let dragged = false;
    let manualUntil = 0;
    let lastFrame = 0;

    const render = () => {
      if (!width) return;
      groups.forEach((group, index) => {
        if (mobile.matches) {
          group.style.transform = 'none';
          group.style.left = `${positions[index]}px`;
        } else {
          group.style.left = '0px';
          group.style.transform = `translate3d(${positions[index]}px,0,0)`;
        }
      });
    };
    const measure = () => {
      const oldWidth = width;
      width = firstGroup.offsetWidth;
      track.style.height = `${firstGroup.offsetHeight}px`;
      if (!positions.length || (oldWidth && width !== oldWidth)) positions = [-width, 0, width];
      render();
    };
    const shift = distance => {
      if (!width || !distance) return;
      positions = positions.map(position => position + distance);
      if (distance > 0) {
        while (Math.min(...positions) > -width / 2) {
          const smallest = Math.min(...positions);
          positions[positions.indexOf(Math.max(...positions))] = smallest - width;
        }
      } else {
        while (Math.max(...positions) < track.clientWidth + width / 2) {
          const largest = Math.max(...positions);
          positions[positions.indexOf(Math.min(...positions))] = largest + width;
        }
      }
      render();
    };
    const stepWidth = () => cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
    const speed = () => width / (mobile.matches ? 110 : 300);

    measure();
    new ResizeObserver(measure).observe(firstGroup);
    Promise.allSettled([...track.querySelectorAll('img')].map(image => image.decode())).then(() => {
      ready = true;
      measure();
      section.classList.add('is-looping');
    });
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(section);

    const frame = now => {
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0;
      lastFrame = now;
      if (ready && visible && !paused && !reduced.matches && !document.hidden && pointerId === null && now >= manualUntil) {
        shift(-dt * speed());
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    track.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointerId !== null) return;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = event.clientY;
      dragged = false;
      track.setPointerCapture(pointerId);
    });
    track.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!dragged) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
          pointerId = null;
          return;
        }
        dragged = true;
        track.classList.add('is-dragging');
      }
      event.preventDefault();
      shift(event.clientX - lastX);
      lastX = event.clientX;
    }, { passive: false });
    const finish = event => {
      if (event.pointerId !== pointerId) return;
      if (dragged && event.clientX - startX > 6) manualUntil = performance.now() + 2000;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
      pointerId = null;
    };
    track.addEventListener('pointerup', finish);
    track.addEventListener('pointercancel', finish);

    track.addEventListener('wheel', event => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || !event.deltaX) return;
      event.preventDefault();
      shift(-event.deltaX);
      if (event.deltaX < 0) manualUntil = performance.now() + 2000;
    }, { passive: false });

    const move = direction => {
      shift(direction * stepWidth());
      if (direction > 0) manualUntil = performance.now() + 2000;
      if (status) status.textContent = direction > 0 ? 'Moving vehicles right' : 'Moving vehicles left';
    };
    section.querySelector('[data-vehicle-prev]')?.addEventListener('click', () => move(-1));
    section.querySelector('[data-vehicle-next]')?.addEventListener('click', () => move(1));
    track.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    pause?.addEventListener('click', () => {
      paused = !paused;
      pause.textContent = paused ? 'Play' : 'Pause';
      pause.setAttribute('aria-pressed', String(paused));
      pause.setAttribute('aria-label', paused ? 'Play automatic vehicle scrolling' : 'Pause automatic vehicle scrolling');
    });
  });
})();
