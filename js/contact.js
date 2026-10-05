(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactStatus');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get('name')).trim();
    const email = String(data.get('email')).trim();
    const phone = String(data.get('phone') || '').trim();
    const project = String(data.get('project')).trim();
    const details = String(data.get('details')).trim();
    const subject = `New ${project} inquiry from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      `Project type: ${project}`,
      '',
      'Project details:',
      details,
    ].join('\n');

    status.textContent = 'Your email app should open with your inquiry ready to send. Please press Send there to complete it.';
    window.location.href = `mailto:enrico@performantewraps.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  const year = document.getElementById('pwFooterYear');
  if (year) year.textContent = new Date().getFullYear();

  if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  gsap.from('.ct-hero .ct-reveal', {
    opacity: 0, y: 46, duration: 1.05, stagger: 0.13, ease: 'power3.out', delay: 0.15,
  });
  if (window.ScrollTrigger) {
    gsap.utils.toArray('.ct-inquiry .ct-reveal').forEach((element) => {
      gsap.from(element, {opacity: 0, y: 55, duration: 1.05, ease: 'power3.out', scrollTrigger: {trigger: element, start: 'top 86%', toggleActions: 'play none none reverse'}});
    });
    gsap.from('.ct-outro p', {opacity: 0, y: 45, duration: 1, ease: 'power3.out', scrollTrigger: {trigger: '.ct-outro', start: 'top 75%', toggleActions: 'play none none reverse'}});
  }
})();
