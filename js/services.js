/* ==========================================================================
   Performante Wraps — SERVICES page (page-specific JS)
   Kept separate from js/gsap.js on purpose (that file is wired to the
   homepage hero cube / pinned scroll sections and shouldn't be loaded on
   subpages). This file only does two small, self-contained things:
     1. The same pill-button rollover fill used sitewide on .pw-btn
     2. A lightweight scroll-reveal for .svc-reveal elements
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- pill button rollover fill (matches sitewide .pw-btn) ---------- */
  if (typeof gsap !== "undefined") {
    const pillButtons = gsap.utils.toArray(".pw-btn");

    pillButtons.forEach((btn) => {
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
        const farX = Math.max(x, rect.width - x);
        const farY = Math.max(y, rect.height - y);
        const diameter = Math.hypot(farX, farY) * 2.15;
        gsap.set(fill, { left: x, top: y, width: diameter, height: diameter });
      };

      btn.addEventListener("pointerenter", (event) => {
        setFillGeometry(event);
        gsap.killTweensOf(fill);
        gsap.fromTo(fill, { scale: 0 }, {
          scale: 1,
          duration: .48,
          ease: "power3.out",
          overwrite: true
        });
      });

      btn.addEventListener("pointerleave", (event) => {
        setFillGeometry(event);
        gsap.killTweensOf(fill);
        gsap.to(fill, {
          scale: 0,
          duration: .34,
          ease: "power2.inOut",
          overwrite: true
        });
      });
    });
  }

  /* ---------- scroll reveal for .svc-reveal / .wrap-branding-intro text ---------- */
  const revealTargets = document.querySelectorAll(
    ".svc-reveal, .wrap-branding-intro h2, .wrap-branding-intro__subtitle, .wrap-branding-intro__desc"
  );

  if ("IntersectionObserver" in window && revealTargets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in", "is-inview");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-in", "is-inview"));
  }

  /* ---------- footer year (mirrors homepage) ---------- */
  const yearEl = document.getElementById("pwFooterYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
