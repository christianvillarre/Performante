(function () {
  const initFooterTicker = () => {
    document.querySelectorAll('.pw6-final-cta').forEach(footer => {
      if (footer.querySelector('.pw6-footer-ticker')) return;
      const ticker = document.createElement('div');
      ticker.className = 'pw6-footer-ticker';
      ticker.setAttribute('aria-hidden', 'true');
      const mark = '<svg class="pw6-footer-ticker__mark" viewBox="0 0 52 44" fill="none" aria-hidden="true"><ellipse cx="26" cy="22" rx="20" ry="9" transform="rotate(-40 26 22)"/><ellipse cx="26" cy="22" rx="20" ry="9" transform="rotate(40 26 22)"/></svg>';
      const group = '<span class="pw6-footer-ticker__group">' + Array(3).fill('<span class="pw6-footer-ticker__item">Start Your Project</span>' + mark).join('') + '</span>';
      ticker.innerHTML = '<div class="pw6-footer-ticker__track">' + group + group + '</div>';
      const heading = footer.querySelector('.pw6-final-cta__top h2');
      const headingWrap = footer.querySelector('.pw6-final-cta__heading');
      if (headingWrap) {
        headingWrap.classList.add('pw6-final-cta__heading--ticker');
        headingWrap.after(ticker);
      }
      else footer.prepend(ticker);
      if (heading?.textContent.trim().toLowerCase() === 'start your project') {
        heading.classList.add('pw6-footer-ticker__sr-only');
      }
      const button = footer.querySelector('.pw6-final-cta__button.pw-btn');
      if (button?.querySelector('.pw-btn__label')?.textContent.trim().toLowerCase() === 'contact performante') {
        const name = button.querySelector('.pw-btn__label').textContent.trim();
        button.classList.remove('pw-btn');
        button.classList.add('pw6-final-cta__button--index-link');
        button.setAttribute('aria-label', name);
        const arrow = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        button.innerHTML = '<span class="hero-project-link__arrow-window hero-project-link__arrow-window--left" aria-hidden="true">' + arrow + '</span><span class="index2-text-link__label"></span><span class="hero-project-link__arrow-window hero-project-link__arrow-window--right" aria-hidden="true">' + arrow + '</span><span class="hero-project-link__underline" aria-hidden="true"></span>';
        const label = button.querySelector('.index2-text-link__label');
        const letters = [...name].map(char => {
          const span = document.createElement('span');
          span.className = 'index2-text-link__letter';
          span.textContent = char;
          span.setAttribute('aria-hidden', 'true');
          label.appendChild(span);
          return span;
        });
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce) and (max-width: 760px)').matches;
        if (!reduced && window.gsap) {
          const rightArrow = button.querySelector('.hero-project-link__arrow-window--right svg');
          const leftWindow = button.querySelector('.hero-project-link__arrow-window--left');
          const leftArrow = leftWindow.querySelector('svg');
          const underline = button.querySelector('.hero-project-link__underline');
          gsap.set(leftArrow, {x: -24});
          const sweep = gsap.timeline({paused: true})
            .set(underline, {transformOrigin: 'right center', scaleX: 1})
            .to(underline, {scaleX: 0, duration: .24, ease: 'power2.inOut'})
            .set(underline, {transformOrigin: 'left center'})
            .to(underline, {scaleX: 1, duration: .28, ease: 'power2.out'});
          const motion = gsap.timeline({paused: true, defaults: {ease: 'power2.inOut'}});
          motion.to(rightArrow, {x: 24, duration: .24}, 0)
            .to(letters, {x: 48, duration: .23, stagger: {each: .018, from: 'end'}}, .04)
            .to(leftWindow, {opacity: 1, duration: .01}, .56)
            .to(leftArrow, {x: 0, duration: .24}, .57);
          button.addEventListener('pointerenter', () => {motion.play(); sweep.restart();});
          button.addEventListener('pointerleave', () => motion.reverse());
          button.addEventListener('pointerup', event => {if (event.pointerType === 'touch') motion.reverse();});
          button.addEventListener('pointercancel', () => motion.reverse());
          button.addEventListener('focus', () => {motion.play(); sweep.restart();});
          button.addEventListener('blur', () => motion.reverse());
        }
      }
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterTicker, {once: true});
  } else {
    initFooterTicker();
  }
})();

(function () {
  const initContactRollover = () => {
    if (typeof gsap === "undefined") return;

    document.querySelectorAll(".pw6-final-cta__button.pw-btn").forEach((btn) => {
      if (btn.classList.contains('pw6-final-cta__button--index-link')) return;
      let fill = btn.querySelector(".pw-btn-fill");
      if (!fill) {
        fill = document.createElement("span");
        fill.className = "pw-btn-fill";
        fill.setAttribute("aria-hidden", "true");
        btn.prepend(fill);
      }

      const setFillGeometry = (event) => {
        const rect = btn.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const diameter = Math.hypot(
          Math.max(x, rect.width - x),
          Math.max(y, rect.height - y)
        ) * 2.15;
        gsap.set(fill, { left: x, top: y, width: diameter, height: diameter });
      };

      btn.addEventListener("pointerenter", (event) => {
        setFillGeometry(event);
        gsap.killTweensOf(fill);
        gsap.fromTo(fill, { scale: 0 }, {
          scale: 1, duration: .48, ease: "power3.out", overwrite: true
        });
      });

      btn.addEventListener("pointerleave", (event) => {
        setFillGeometry(event);
        gsap.killTweensOf(fill);
        gsap.to(fill, {
          scale: 0, duration: .34, ease: "power2.inOut", overwrite: true
        });
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactRollover, { once: true });
  } else {
    initContactRollover();
  }
})();

(function () {
  const wrap = document.querySelector(".pw5-closing-cta__wordmark");
  const el = wrap ? wrap.querySelector("span") : null;
  if (!wrap || !el) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fitWordmark() {
    el.style.transform = "none";
    const wrapRect = wrap.getBoundingClientRect();
    const textRect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context || wrapRect.width <= 0 || textRect.width <= 0) return;
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const ink = context.measureText(el.textContent.trim());
    const inkWidth = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
    if (inkWidth <= 0) return;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const bleed = mobile ? 3 : 0;
    const bottomOffset = mobile ? 4 : 9;
    const scale = (wrapRect.width + bleed * 2 - (mobile ? 0 : 13)) / inkWidth;
    const left = wrapRect.left - textRect.left - bleed - ink.actualBoundingBoxLeft * scale - (mobile ? 0 : 17);
    el.style.transform = `translate(${left}px, ${bottomOffset}px) scaleX(${scale})`;
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
