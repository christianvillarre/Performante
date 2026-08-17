/* ============================================================================
   VEHICLE WRAPS — page-specific JS
   Handles: hero entrance animation, scroll-reveal on section content, the
   gallery track (arrow-scroll + drag) and its lightbox. Nav/menu toggling
   still comes from the shared js/navbar.js.
   ============================================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------- hero entrance ---------------- */
  if (window.gsap) {
    gsap.set(".vw-hero__copy, .vw-hero__col--media", { opacity: 0, y: 24 });
    gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out", duration: 1 } })
      .to(".vw-hero__copy", { opacity: 1, y: 0 })
      .to(".vw-hero__col--media", { opacity: 1, y: 0 }, "-=0.7");
  }

  /* ---------------- hero image carousel (dots) ---------------- */
  const heroDots = document.querySelectorAll(".vw-hero__dot");
  const heroSlides = document.querySelectorAll(".vw-hero__slide");
  const heroCaptions = document.querySelectorAll(".vw-hero__media-text");

  if (heroDots.length) {
    let heroTimer = null;

    function showHeroSlide(index) {
      const key = String(index);
      heroDots.forEach((d) => {
        const active = d.dataset.slide === key;
        d.classList.toggle("is-active", active);
        d.setAttribute("aria-selected", active ? "true" : "false");
      });
      heroSlides.forEach((s) => s.classList.toggle("is-active", s.dataset.slide === key));
      heroCaptions.forEach((c) => c.classList.toggle("is-active", c.dataset.slide === key));
    }

    function startHeroAutoplay() {
      clearInterval(heroTimer);
      heroTimer = setInterval(() => {
        const activeDot = document.querySelector(".vw-hero__dot.is-active");
        const current = activeDot ? Number(activeDot.dataset.slide) : 0;
        showHeroSlide((current + 1) % heroDots.length);
      }, 6000);
    }

    heroDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        showHeroSlide(Number(dot.dataset.slide));
        startHeroAutoplay();
      });
    });

    startHeroAutoplay();
  }

  /* ---------------- scroll reveal ---------------- */
  const revealTargets = document.querySelectorAll(
    ".vw-benefit-card, .vw-process__item, .vw-testimonial-card, .vw-gallery__slide"
  );

  if (window.gsap && window.ScrollTrigger && revealTargets.length) {
    gsap.registerPlugin(ScrollTrigger);
    revealTargets.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        }
      );
    });
  } else if ("IntersectionObserver" in window && revealTargets.length) {
    revealTargets.forEach((el) => (el.style.opacity = "0"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.transition = "opacity .6s ease, transform .6s ease";
            entry.target.style.opacity = "1";
            entry.target.style.transform = "none";
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach((el) => io.observe(el));
  }

  /* ---------------- gallery: arrows + drag ---------------- */
  const viewport = document.getElementById("vwGalleryViewport");
  const track = document.getElementById("vwGalleryTrack");
  const prevBtn = document.querySelector(".vw-gallery__arrow--prev");
  const nextBtn = document.querySelector(".vw-gallery__arrow--next");

  if (viewport && track) {
    const slides = Array.from(track.querySelectorAll(".vw-gallery__slide"));

    function slideStep() {
      const first = slides[0];
      const gap = parseFloat(getComputedStyle(track).columnGap || "16");
      return first ? first.getBoundingClientRect().width + gap : 300;
    }

    function scrollByStep(dir) {
      viewport.scrollBy({ left: dir * slideStep(), behavior: "smooth" });
    }

    if (prevBtn) prevBtn.addEventListener("click", () => scrollByStep(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => scrollByStep(1));

    // drag to scroll
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    viewport.addEventListener("pointerdown", (e) => {
      isDown = true;
      startX = e.clientX;
      scrollStart = viewport.scrollLeft;
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      viewport.scrollLeft = scrollStart - (e.clientX - startX);
    });

    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) =>
      viewport.addEventListener(evt, () => (isDown = false))
    );

    /* ---------------- lightbox ---------------- */
    const lightbox = document.getElementById("vwGalleryLightbox");
    if (lightbox) {
      const lightboxImg = document.getElementById("vwGalleryLightboxImg");
      const closeBtn = document.getElementById("vwGalleryLightboxClose");
      const prevLbBtn = document.getElementById("vwGalleryLightboxPrev");
      const nextLbBtn = document.getElementById("vwGalleryLightboxNext");
      let current = 0;

      function openLightbox(i) {
        current = (i + slides.length) % slides.length;
        const img = slides[current].querySelector("img");
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || "";
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
      }

      function closeLightbox() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
      }

      slides.forEach((slide, i) => {
        slide.addEventListener("click", () => openLightbox(i));
        slide.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openLightbox(i);
          }
        });
      });

      if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
      if (prevLbBtn) prevLbBtn.addEventListener("click", () => openLightbox(current - 1));
      if (nextLbBtn) nextLbBtn.addEventListener("click", () => openLightbox(current + 1));

      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
      });

      document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("is-open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") openLightbox(current - 1);
        if (e.key === "ArrowRight") openLightbox(current + 1);
      });
    }
  }
});

/* ============================================================================
   END VEHICLE WRAPS JS
   ============================================================================ */
