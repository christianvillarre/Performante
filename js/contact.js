(() => {
  const form = document.getElementById('contactForm');
  const captchaError = document.getElementById('ctCaptchaError');
  if (form && captchaError) {
    form.addEventListener('submit', event => {
      const token = form.querySelector('[name="g-recaptcha-response"]')?.value.trim()
        || window.grecaptcha?.getResponse?.()?.trim();
      if (token) {
        captchaError.hidden = true;
        return;
      }
      event.preventDefault();
      captchaError.hidden = false;
    });
  }
  const year = document.getElementById('pwFooterYear');
  if (year) year.textContent = new Date().getFullYear();

  if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const reviewLink = document.querySelector('.ct-reviews__link');
  if (reviewLink) {
    const label = reviewLink.querySelector('.ct-reviews__link-label');
    const name = label.textContent.trim();
    label.textContent = '';
    const letters = [...name].map(char => {
      const letter = document.createElement('span');
      letter.className = 'ct-reviews__link-letter';
      letter.textContent = char;
      letter.setAttribute('aria-hidden', 'true');
      label.appendChild(letter);
      return letter;
    });
    reviewLink.style.width = `${reviewLink.offsetWidth}px`;
    const leftWindow = reviewLink.querySelector('.ct-reviews__arrow-window--left');
    const leftArrow = leftWindow.querySelector('svg');
    const rightArrow = reviewLink.querySelector('.ct-reviews__arrow-window--right svg');
    const underline = reviewLink.querySelector('.ct-reviews__underline');
    gsap.set(leftArrow, {x: -24});
    const sweep = gsap.timeline({paused: true})
      .set(underline, {transformOrigin: 'right center', scaleX: 1})
      .to(underline, {scaleX: 0, duration: .24, ease: 'power2.inOut'})
      .set(underline, {transformOrigin: 'left center'})
      .to(underline, {scaleX: 1, duration: .28, ease: 'power2.out'});
    const motion = gsap.timeline({paused: true, defaults: {ease: 'power2.inOut'}})
      .to(rightArrow, {x: 24, duration: .24}, 0)
      .to(letters, {x: 34, duration: .23, stagger: {each: .025, from: 'end'}}, .04)
      .to(leftWindow, {opacity: 1, duration: .01}, .19)
      .to(leftArrow, {x: 0, duration: .24}, .2);
    const enter = () => { motion.play(); sweep.restart(); };
    const leave = () => motion.reverse();
    reviewLink.addEventListener('pointerenter', enter);
    reviewLink.addEventListener('pointerleave', leave);
    reviewLink.addEventListener('pointerup', event => { if (event.pointerType === 'touch') leave(); });
    reviewLink.addEventListener('pointercancel', leave);
    reviewLink.addEventListener('focus', enter);
    reviewLink.addEventListener('blur', leave);
  }
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollTrigger) {
    gsap.utils.toArray('.ct-inquiry .ct-reveal').forEach((element) => {
      gsap.from(element, {opacity: 0, y: 55, duration: 1.05, ease: 'power3.out', scrollTrigger: {trigger: element, start: 'top 86%', toggleActions: 'play none none reverse'}});
    });
    gsap.from('.ct-outro p', {opacity: 0, y: 45, duration: 1, ease: 'power3.out', scrollTrigger: {trigger: '.ct-outro', start: 'top 75%', toggleActions: 'play none none reverse'}});
  }
})();
