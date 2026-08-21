/* ============================================================================
   VEHICLE WRAPS — page-specific JS
   Handles: hero entrance animation, scroll-reveal fades on section titles/
   text, and the gallery track (arrow-scroll + drag) with its lightbox, if
   present. Nav/menu toggling still comes from the shared js/navbar.js.

   Animation approach: plain opacity fades only, no y-offset movement. The
   earlier version moved elements on a y-axis during entrance, which could
   clip or shift text (titles especially) against their containers. Every
   fade below is opacity 0 -> 1 with a short, consistent duration.
   ============================================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const hasGsap = !!window.gsap;
  const hasScrollTrigger = hasGsap && !!window.ScrollTrigger;
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------- hero entrance: simple opacity fade ---------------- */
  const heroFadeTargets = [
    ".vw-hero__eyebrow",
    ".vw-hero__title",
    ".vw-hero__desc",
    ".vw-hero__cta",
    ".vw-hero__marquee",
    ".vw-hero__col--media"
  ].filter((sel) => document.querySelector(sel));

  if (hasGsap && heroFadeTargets.length) {
    gsap.set(heroFadeTargets, { opacity: 0 });
    gsap.timeline({ delay: 0.15, defaults: { ease: "power1.out", duration: 0.7 } })
      .to(heroFadeTargets, { opacity: 1, stagger: 0.12 });
  }

  /* ---------------- hero image carousel (dots) ----------------
     Rotation is off for now, kept manual — the autoplay function stays
     defined below but commented out, and calls to it are guarded by
     ROTATION_ENABLED so nothing throws while it's disabled. Flip that
     flag (and uncomment the function) to bring rotation back later. */
  const heroDots = document.querySelectorAll(".vw-hero__dot");
  const heroSlides = document.querySelectorAll(".vw-hero__slide");
  const heroCaptions = document.querySelectorAll(".vw-hero__media-text");
  const ROTATION_ENABLED = false;

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
/*
    function startHeroAutoplay() {
      clearInterval(heroTimer);
      heroTimer = setInterval(() => {
        const activeDot = document.querySelector(".vw-hero__dot.is-active");
        const current = activeDot ? Number(activeDot.dataset.slide) : 0;
        showHeroSlide((current + 1) % heroDots.length);
      }, 6000);
    }*/

    heroDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        showHeroSlide(Number(dot.dataset.slide));
        if (ROTATION_ENABLED) startHeroAutoplay();
      });
    });

    if (ROTATION_ENABLED) startHeroAutoplay();
  }

  /* ---------------- scroll reveal: titles & text, opacity-only ----------------
     One simple fade treatment reused across every section's headings, body
     copy and cards. */
  const revealSelector = [
    ".vws-intro-kicker", ".vws-intro-title", ".vws-intro-text", ".vws-intro-list",
    ".vws-title", ".vws-text", ".vws-cta", ".vws-links",
    ".vw-benefits-row__left", ".vw-benefit-card",
    ".wrap-branding-intro", ".vw-faq-item"
  ].join(", ");

  const revealTargets = document.querySelectorAll(revealSelector);

  if (revealTargets.length) {
    if (hasScrollTrigger) {
      revealTargets.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.7,
            ease: "power1.out",
            scrollTrigger: { trigger: el, start: "top 90%" }
          }
        );
      });
    } else if ("IntersectionObserver" in window) {
      revealTargets.forEach((el) => { el.style.opacity = "0"; });
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.transition = "opacity .7s ease";
              entry.target.style.opacity = "1";
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealTargets.forEach((el) => io.observe(el));
    }
  }

  /* ---------------- gallery: arrows + drag (only runs if present on page) ---------------- */
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
/* =====================================================
   SHARED PILL BUTTONS — rollover circle fill
   Applies to any .pw-btn element (Start a Project, More About Us,
   View All Projects, View Project). Color is handled purely in CSS
   via the --pw-btn-* custom properties (see styles.css); this only
   drives the circle-fill geometry + scale, same technique as the
   nav pills in navbar.js.
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;

  const pillButtons = gsap.utils.toArray(".pw-btn");
  if (!pillButtons.length) return;

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
});

