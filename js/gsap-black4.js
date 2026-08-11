/* ==========================================================================
   Performante Wraps — GSAP / ScrollTrigger animations
   (excludes nav-bar animations, which live in nav.js)
   ========================================================================== */

/* Hero intro entrance timeline */
window.addEventListener("load", () => {
  gsap.set("#cube3d", {
    opacity: 0,
    scale: 0.82,
    filter: "blur(18px)"
  });

  gsap.set("#energyField", { opacity: 0 });

  gsap.set(".hero-bottom-title", {
    opacity: 0,
    y: 30
  });

  const heroIntro = gsap.timeline({
    delay: 0.25,
    defaults: {
      ease: "power3.out"
    }
  });

  heroIntro
    .to("#cube3d", {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 1.6
    })
    .to("#energyField", {
      opacity: 0.9,
      duration: 2.2
    }, "-=0.9")
    .to(".hero-bottom-title", {
      opacity: 1,
      y: 0,
      duration: 1.1
    }, "-=1.2");
});

/* NDT capability box row hover states */
(() => {
  const row = document.querySelector(".ndt-box-row");
  if (!row) return;

  const boxes = Array.from(row.querySelectorAll(".ndt-box"));
  const dots = Array.from(row.querySelectorAll(".dot"));

  const ACTIVE = "#8fd3ff";
  const ACTIVE_EDGE = "rgba(143,211,255,0.38)";
  const IDLE = "#111";
  const IDLE_EDGE = "rgba(17,17,17,0.24)";

  function getBoxCornerDots(index) {
    return [
      dots[index],       // top-left
      dots[index + 1],   // top-right
      dots[index + 7],   // bottom-left
      dots[index + 8]    // bottom-right
    ].filter(Boolean);
  }

  function lightBox(index) {
    const box = boxes[index];
    const glow = box.querySelector(".box-glow");
    const logo = box.querySelector(".partner-logo");
    const cornerDots = getBoxCornerDots(index);

    gsap.to(box, {
      "--ink": ACTIVE,
      "--edge-ink": ACTIVE_EDGE,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto"
    });

    gsap.to(glow, {
      opacity: 1,
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto"
    });
/*
    gsap.to(cornerDots, {
      backgroundColor: ACTIVE,
      boxShadow: "0 0 0 6px rgba(143,211,255,0.16)",
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto"
    });*/

    if (logo) {
      if (logo.classList.contains("is-blur")) {
        gsap.to(logo, {
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto"
        });
      } else {
        gsap.to(logo, {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    }
  }

  function resetBox(index) {
    const box = boxes[index];
    const glow = box.querySelector(".box-glow");
    const logo = box.querySelector(".partner-logo");
    const cornerDots = getBoxCornerDots(index);

    gsap.to(box, {
      "--ink": IDLE,
      "--edge-ink": IDLE_EDGE,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto"
    });

    gsap.to(glow, {
      opacity: 0,
      duration: 0.24,
      ease: "power2.out",
      overwrite: "auto"
    });

    gsap.to(box, {
      "--box-glow-x": "50%",
      "--box-glow-y": "50%",
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto"
    });

    gsap.to(cornerDots, {
      backgroundColor: IDLE,
      boxShadow: "0 0 0 0 rgba(143,211,255,0)",
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto"
    });

    if (logo) {
      if (logo.classList.contains("is-blur")) {
        gsap.to(logo, {
          filter: "blur(4px)",
          opacity: 0.7,
          duration: 0.28,
          ease: "power2.out",
          overwrite: "auto"
        });
      } else {
        gsap.to(logo, {
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.28,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    }
  }

  boxes.forEach((box, index) => {
    box.addEventListener("mouseenter", () => {
      lightBox(index);
    });

    box.addEventListener("mousemove", (e) => {
      const rect = box.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      gsap.to(box, {
        "--box-glow-x": x + "%",
        "--box-glow-y": y + "%",
        duration: 0.14,
        ease: "power2.out",
        overwrite: true
      });
    });

    box.addEventListener("mouseleave", () => {
      resetBox(index);
    });
  });
})();

/* Project image scroller / carousel */
(function () {
  const viewport = document.getElementById("projectScroller");
  if (!viewport || typeof gsap === "undefined") return;

  const navbar = document.querySelector(".navbar");
  const track = viewport.querySelector(".image-scroller-track");
  const cards = Array.from(track.querySelectorAll(".scroller-card"));
  const prevBtn = document.querySelector(".scroller-prev");
  const nextBtn = document.querySelector(".scroller-next");
  const progressBar = document.querySelector(".scroller-progress-bar");
  const lenis = window.lenis || null;

  if (!track || !cards.length) return;

  let currentX = 0;
  let maxX = 0;
  let cardStep = 0;
  let dragStartX = 0;
  let startTrackX = 0;
  let isDragging = false;

  let navHiddenByScroller = false;
  let navLockUntil = 0;
  let lastScrollY = window.scrollY || 0;

  function now() {
    return performance.now();
  }

  function hideNavbar(lockMs = 700) {
    if (!navbar) return;
    navbar.classList.add("navbar--hidden");
    navHiddenByScroller = true;
    navLockUntil = now() + lockMs;
  }

  function showNavbar() {
    if (!navbar) return;
    navbar.classList.remove("navbar--hidden");
    navHiddenByScroller = false;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getCardStep() {
    if (cards.length < 2) return cards[0].offsetWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  }

  function getMaxX() {
    return Math.max(0, track.scrollWidth - viewport.clientWidth);
  }

  function getPages() {
    if (!cardStep) return 1;
    return Math.max(1, Math.round(maxX / cardStep) + 1);
  }

  function getNearestPage() {
    if (!cardStep) return 0;
    return clamp(Math.round(Math.abs(currentX) / cardStep), 0, getPages() - 1);
  }

  function updateArrowState() {
    if (!prevBtn || !nextBtn) return;

    const edgeTolerance = 12;
    const atStart = Math.abs(currentX) <= edgeTolerance;
    const atEnd = maxX === 0 || Math.abs(currentX) >= (maxX - edgeTolerance);

    if (atStart) {
      prevBtn.classList.add("is-disabled");
      prevBtn.classList.remove("is-active");
      prevBtn.setAttribute("aria-disabled", "true");
    } else {
      prevBtn.classList.remove("is-disabled");
      prevBtn.classList.add("is-active");
      prevBtn.setAttribute("aria-disabled", "false");
    }

    if (atEnd) {
      nextBtn.classList.add("is-disabled");
      nextBtn.classList.remove("is-active");
      nextBtn.setAttribute("aria-disabled", "true");
    } else {
      nextBtn.classList.remove("is-disabled");
      nextBtn.classList.add("is-active");
      nextBtn.setAttribute("aria-disabled", "false");
    }
  }

  function updateProgress() {
    if (progressBar) {
      const progress = maxX > 0 ? Math.abs(currentX) / maxX : 0;
      const width = clamp(progress * 100, 5, 100);
      progressBar.style.width = width + "%";
    }

    updateArrowState();
  }

  function animateToPage(index, duration = 0.75) {
  const lastPage = getPages() - 1;
  const page = clamp(index, 0, lastPage);

  let targetX = -(page * cardStep);

  if (page === lastPage) {
    targetX = -maxX;
  } else {
    targetX = Math.max(targetX, -maxX);
  }

  gsap.killTweensOf(track);

  gsap.to(track, {
    x: targetX,
    duration,
    ease: "back.out(1.15)",
    onUpdate: () => {
      currentX = Number(gsap.getProperty(track, "x"));
      updateProgress();
    },
    onComplete: () => {
      currentX = targetX;         // force exact final value
      gsap.set(track, { x: currentX });
      updateProgress();
    }
  });
}

  function refresh() {
    cardStep = getCardStep();
    maxX = getMaxX();
    currentX = -clamp(Math.abs(currentX), 0, maxX);
    gsap.set(track, { x: currentX });
    updateProgress();
  }

  function beginScrollerInteraction(lockMs = 900) {
    hideNavbar(lockMs);
  }

  prevBtn?.addEventListener("click", () => {
    if (prevBtn.classList.contains("is-disabled")) return;
    beginScrollerInteraction(900);
    animateToPage(getNearestPage() - 1);
  });

  nextBtn?.addEventListener("click", () => {
    if (nextBtn.classList.contains("is-disabled")) return;
    beginScrollerInteraction(900);
    animateToPage(getNearestPage() + 1);
  });

  viewport.addEventListener("dragstart", (e) => e.preventDefault());

  cards.forEach((card) => {
    const img = card.querySelector("img");
    if (img) img.addEventListener("dragstart", (e) => e.preventDefault());
  });

  viewport.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    startTrackX = currentX;

    beginScrollerInteraction(1200);

    viewport.classList.add("is-dragging");
    gsap.killTweensOf(track);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const delta = e.clientX - dragStartX;
    let nextX = startTrackX + delta * 1.15;

    if (nextX > 0) nextX = nextX * 0.22;

    if (nextX < -maxX) {
      const over = nextX + maxX;
      nextX = -maxX + over * 0.22;
    }

    currentX = nextX;
    gsap.set(track, { x: currentX });
    updateProgress();

    e.preventDefault();
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;

    isDragging = false;
    viewport.classList.remove("is-dragging");

    navLockUntil = now() + 700;

    if (currentX > 0) {
      gsap.to(track, {
        x: 0,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        },
        onComplete: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        }
      });
      return;
    }

    if (currentX < -maxX) {
      gsap.to(track, {
        x: -maxX,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        },
        onComplete: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        }
      });
      return;
    }

    animateToPage(getNearestPage(), 0.72);
  });

  viewport.addEventListener("touchstart", (e) => {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    startTrackX = currentX;

    beginScrollerInteraction(1200);

    viewport.classList.add("is-dragging");
    gsap.killTweensOf(track);
  }, { passive: true });

  viewport.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    const delta = e.touches[0].clientX - dragStartX;
    let nextX = startTrackX + delta;

    if (nextX > 0) nextX = nextX * 0.22;

    if (nextX < -maxX) {
      const over = nextX + maxX;
      nextX = -maxX + over * 0.22;
    }

    currentX = nextX;
    gsap.set(track, { x: currentX });
    updateProgress();
  }, { passive: true });

  viewport.addEventListener("touchend", () => {
    if (!isDragging) return;

    isDragging = false;
    viewport.classList.remove("is-dragging");

    navLockUntil = now() + 700;

    if (currentX > 0) {
      gsap.to(track, {
        x: 0,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        },
        onComplete: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        }
      });
      return;
    }

    if (currentX < -maxX) {
      gsap.to(track, {
        x: -maxX,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        },
        onComplete: () => {
          currentX = Number(gsap.getProperty(track, "x"));
          updateProgress();
        }
      });
      return;
    }

    animateToPage(getNearestPage(), 0.72);
  }, { passive: true });

  function maybeRestoreNavbar(scrollY) {
    if (!navHiddenByScroller) {
      lastScrollY = scrollY;
      return;
    }

    if (now() < navLockUntil) {
      lastScrollY = scrollY;
      return;
    }

    const delta = scrollY - lastScrollY;

    if (Math.abs(delta) > 2) {
      showNavbar();
    }

    lastScrollY = scrollY;
  }

  if (lenis && typeof lenis.on === "function") {
    lenis.on("scroll", ({ animatedScroll }) => {
      maybeRestoreNavbar(animatedScroll);
    });
  } else {
    window.addEventListener("scroll", () => {
      maybeRestoreNavbar(window.scrollY || window.pageYOffset || 0);
    }, { passive: true });
  }

  window.addEventListener("resize", refresh);
  window.addEventListener("load", refresh);

  refresh();
})();

/* Scroll-triggered rise-in animations */
(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const riseTargets = gsap.utils.toArray([
    "#heroTitle",
    ".hero-scroll-indicator",
    "#criticalTitle",
    ".feature-heading",
    ".feature-title",
    ".feature-text",
    ".image-scroller-eyebrow",
    ".scroller-copy .card-eyebrow",
    ".scroller-copy p",
    ".blue-cta .display-heading",
    ".white-cta .display-heading",
    ".ndt-grid-title",
    ".contact-header h2",
    ".contact-left h3",
    ".contact-left p",
    ".contact-right h3",
    ".contact-form label",
    ".contact-btn",
    ".caps-intro-title",
    ".caps-intro-eyebrow",
    ".stackflow-heading",
    ".insight-grid-title",
    ".insight-grid-eyebrow",
    ".insight-grid-intro",
    
 
    
  ]);

    const riseTargets2 = gsap.utils.toArray([
    ".stackflow-copy p",
    ".stackflow-link",
    ".stackflow-card"
    
  ]);

    const riseTargets3 = gsap.utils.toArray([
    ".insight-card"
    
  ]);
  const footerTitleTargets = gsap.utils.toArray([
    ".footer-title"
  ]);

  const fadeOnlyTargets = gsap.utils.toArray([
    ".footer-logo",
    ".footer-links li",
    ".footer-socials a"
  ]);

  riseTargets.forEach((el) => {
    gsap.fromTo(
      el,
      {
        autoAlpha: 0,
        y: 36
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true
        }
      }
    );
  });

riseTargets2.forEach((el) => {
  gsap.fromTo(
    el,
    {
      autoAlpha: 0,
      y: 36
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1.6,
      delay: 0.3, // 👈 add this
      ease: "power3.out",
      clearProps: "transform,opacity,visibility",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true
      }
    }
  );
});
riseTargets3.forEach((el, i) => {
  gsap.fromTo(
    el,
    {
      autoAlpha: 0,
      y: 36
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1.9,
      delay: i * 0.35, // 👈 stagger effect
      ease: "power3.out",
      clearProps: "transform,opacity,visibility",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true
      }
    }
  );
});
  footerTitleTargets.forEach((el) => {
    gsap.fromTo(
      el,
      {
        opacity: 0
      },
      {
        opacity: 0.5,
        duration: 0.85,
        ease: "power3.out",
        clearProps: "opacity",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          once: true
        }
      }
    );
  });

  fadeOnlyTargets.forEach((el) => {
    gsap.fromTo(
      el,
      {
        autoAlpha: 0
      },
      {
        autoAlpha: 1,
        duration: 0.85,
        ease: "power3.out",
        clearProps: "opacity,visibility",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          once: true
        }
      }
    );
  });

  ScrollTrigger.refresh();
})();

/* Parallax scroll effects (hero title, critical title, blue CTA) */
(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const heroTitle = document.getElementById("heroTitle");
  const criticalTitle = document.getElementById("criticalTitle");
  const blueCta = document.querySelector(".blue-cta");
/*
  if (heroTitle) {
    gsap.to(heroTitle, {
      y: -140,
      ease: "none",
      scrollTrigger: {
        trigger: ".intro-wrap",
        start: "top top",
        end: "bottom top",
        scrub: 0.35
      }
    });
  }*/

  if (criticalTitle) {
    gsap.fromTo(
      criticalTitle,
      { y: 90 },
      {
        y: -150,
        ease: "none",
        scrollTrigger: {
          trigger: ".spacer--dark",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.35
        }
      }
    );
  }

  if (blueCta) {
    gsap.fromTo(
      blueCta,
      { backgroundPosition: "50% 50%" },
      {
        backgroundPosition: "50% 120%",
        ease: "none",
        scrollTrigger: {
          trigger: blueCta,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.45
        }
      }
    );
  }

  ScrollTrigger.refresh();
})();

/* Intro / truck sequence — desktop + mobile */
/* INTRO / TRUCK — DESKTOP + MOBILE */
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const intro = document.querySelector(".intro-wrap");
  const video = document.querySelector(".hero-rise-img");
  const stackflowMain = document.querySelector(".stackflow-main");
  const truckImgs = gsap.utils.toArray(".hero-truck-sequence img");
  const truckTitles = gsap.utils.toArray(".hero-truck-titles h2");
  const whitePanel = document.querySelector(".hero-white-panel");

  if (!intro || !video) return;

  const mm = gsap.matchMedia();

  /* =========================================
     DESKTOP
  ========================================= */
  mm.add("(min-width: 761px)", () => {
    gsap.set(video, {
      yPercent: 60,
      opacity: 0,
      filter:
        "grayscale(100%) contrast(1.15) brightness(0.85) blur(12px)"
    });

    gsap.set(truckImgs, {
      xPercent: -50,
      y: 250,
      opacity: 0,
      filter: "blur(10px)"
    });

    gsap.set(truckTitles, {
      y: 25,
      opacity: 0,
      filter: "blur(12px)"
    });

    if (whitePanel) {
      gsap.set(whitePanel, {
        bottom: "-40vh",
        opacity: 1
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        id: "introTruckDesktop",
        trigger: intro,
        start: "top top",
        end: "+=820%",
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    tl.to(
      video,
      {
        yPercent: 0,
        opacity: 1,
        filter:
          "grayscale(100%) contrast(1.15) brightness(0.85) blur(0px)",
        ease: "none",
        duration: 0.5
      },
      0.1
    );

    if (stackflowMain) {
      tl.to(
        stackflowMain,
        {
          opacity: 0,
          y: -36,
          filter: "blur(8px)",
          ease: "none",
          duration: 0.35
        },
        0.05
      );
    }

    if (whitePanel) {
      tl.to(
        whitePanel,
        {
          bottom: "0vh",
          ease: "none",
          duration: 0.4
        },
        0.18
      );
    }

    /* TRUCK 1 */
    tl.to(
      truckTitles[0],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      0.18
    );

    tl.to(
      truckImgs[0],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      0.1
    );

    tl.to(
      truckTitles[0],
      {
        opacity: 0,
        filter: "blur(10px)",
        ease: "none"
      },
      0.82
    );

    tl.to(
      truckImgs[0],
      {
        xPercent: -300,
        opacity: 0,
        ease: "none"
      },
      0.9
    );

    /* TRUCK 2 */
    tl.to(
      truckTitles[1],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      0.82
    );

    tl.fromTo(
      truckImgs[1],
      {
        xPercent: 300,
        y: 0,
        opacity: 0,
        filter: "blur(0px)"
      },
      {
        xPercent: -50,
        opacity: 1,
        ease: "none"
      },
      0.9
    );

    tl.to(
      truckTitles[1],
      {
        opacity: 0,
        filter: "blur(10px)",
        ease: "none"
      },
      1.48
    );

    tl.to(
      truckImgs[1],
      {
        xPercent: -300,
        opacity: 0,
        ease: "none"
      },
      1.5
    );

    /* TRUCK 3 */
    tl.to(
      truckTitles[2],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none"
      },
      1.28
    );

    tl.fromTo(
      truckImgs[2],
      {
        xPercent: 300,
        y: 0,
        opacity: 0,
        filter: "blur(0px)"
      },
      {
        xPercent: -50,
        opacity: 1,
        ease: "none"
      },
      1.5
    );

    tl.to(
      [truckImgs[2], truckTitles[2]],
      {
        opacity: 1,
        ease: "none",
        duration: 0.3
      },
      1.8
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  });

  /* =========================================
     MOBILE
     Trucks enter bottom-to-top
  ========================================= */
  mm.add("(max-width: 760px)", () => {
    /*
      Video is hidden when the page first loads.
      It only rises into view after scrolling.
    */
    gsap.set(video, {
      yPercent: 75,
      opacity: 0,
      visibility: "visible",
      filter:
        "grayscale(100%) contrast(1.15) brightness(0.8) blur(10px)"
    });

    /*
      Keep every truck centered horizontally.
      Movement happens vertically on mobile.
    */
    gsap.set(truckImgs, {
      xPercent: -50,
      yPercent: 80,
      opacity: 0,
      filter: "blur(8px)"
    });

    gsap.set(truckTitles, {
      y: 30,
      opacity: 0,
      filter: "blur(10px)"
    });

    if (whitePanel) {
      gsap.set(whitePanel, {
        bottom: "-40vh",
        opacity: 1
      });
    }

    const mobileTl = gsap.timeline({
      scrollTrigger: {
        id: "introTruckMobile",
        trigger: intro,
        start: "top top",
        end: "+=520%",
        scrub: 0.35,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    /* Hide original center content */
    if (stackflowMain) {
      mobileTl.to(
        stackflowMain,
        {
          opacity: 0,
          y: -25,
          filter: "blur(6px)",
          ease: "none",
          duration: 0.3
        },
        0
      );
    }

    /* Video rises only once scrolling begins */
    mobileTl.to(
      video,
      {
        yPercent: 0,
        opacity: 1,
        filter:
          "grayscale(100%) contrast(1.15) brightness(0.8) blur(0px)",
        ease: "none",
        duration: 0.5
      },
      0.12
    );

    if (whitePanel) {
      mobileTl.to(
        whitePanel,
        {
          bottom: "0vh",
          ease: "none",
          duration: 0.35
        },
        0.22
      );
    }

    /* MOBILE TRUCK 1 — rises from bottom */
    mobileTl.to(
      truckTitles[0],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.25
      },
      0.3
    );

    mobileTl.to(
      truckImgs[0],
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.45
      },
      0.25
    );

    mobileTl.to(
      [truckTitles[0], truckImgs[0]],
      {
        yPercent: -55,
        opacity: 0,
        filter: "blur(7px)",
        ease: "none",
        duration: 0.35
      },
      0.9
    );

    /* MOBILE TRUCK 2 */
    mobileTl.to(
      truckTitles[1],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.25
      },
      0.9
    );

    mobileTl.to(
      truckImgs[1],
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.45
      },
      0.86
    );

    mobileTl.to(
      [truckTitles[1], truckImgs[1]],
      {
        yPercent: -55,
        opacity: 0,
        filter: "blur(7px)",
        ease: "none",
        duration: 0.35
      },
      1.5
    );

    /* MOBILE TRUCK 3 */
    mobileTl.to(
      truckTitles[2],
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.25
      },
      1.5
    );

    mobileTl.to(
      truckImgs[2],
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "none",
        duration: 0.45
      },
      1.46
    );

    /* Hold the final truck */
    mobileTl.to(
      [truckTitles[2], truckImgs[2]],
      {
        opacity: 1,
        ease: "none",
        duration: 0.4
      },
      2
    );

    return () => {
      mobileTl.scrollTrigger?.kill();
      mobileTl.kill();
    };
  });

  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
});

/* White blinds transition, marquee pin, light-section reveals */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;
  if (typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

/* =====================================================
   WHITE BLINDS + FIRST LIGHT SECTION
===================================================== */

const transition = document.getElementById("wrapTransition");
const blinds = gsap.utils.toArray(".wrap-blinds span");
const marquee = document.querySelector(".wrap-marquee");
const marqueePinGroup = document.querySelector(".wrap-marquee-pin-group");

const firstLightSection = document.querySelector(
  ".wrap-light-section--intro"
);

const firstInner = document.querySelector(
  ".wrap-light-section--intro .wrap-light-section__inner"
);

/*
  How far the entire section is pulled upward.

  Increase the negative number to move it higher:
  -300 = moderate
  -500 = higher
  -700 = much higher
*/
const firstSectionMoveAmount = -window.innerHeight * 1.3;

if (
  transition &&
  blinds.length &&
  marquee &&
  marqueePinGroup &&
  firstLightSection
) {
  gsap.set(transition, {
    autoAlpha: 0,
    visibility: "hidden"
  });

  gsap.set(blinds, {
    scaleY: 0,
    y: 0,
    force3D: false,
    transformOrigin: "center bottom"
  });

  /*
    Start with no negative margin.

    GSAP then changes the actual layout margin while
    the blinds are opening.
  */
  gsap.set(firstLightSection, {
    marginTop: 0
  });

  const transitionTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: marqueePinGroup,
      start: "top 30%",
      end: "+=1800",
      pin: marqueePinGroup,
      pinSpacing: true,
      scrub: 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      onEnter() {
        gsap.set(transition, {
          autoAlpha: 1,
          visibility: "visible"
        });
      },

      onEnterBack() {
        gsap.set(transition, {
          autoAlpha: 1,
          visibility: "visible"
        });
      },

      onLeave() {
        gsap.set(transition, {
          autoAlpha: 1,
          visibility: "visible"
        });
      },

      onLeaveBack() {
        gsap.set(transition, {
          autoAlpha: 0,
          visibility: "hidden"
        });
      },

      onRefresh() {
        /*
          Keep the final layout position correct after
          resize or ScrollTrigger refresh.
        */
        if (this.progress === 0) {
          gsap.set(firstLightSection, {
            marginTop: 0
          });
        }
      }
    }
  });

  /*
    BLINDS START AT 0
  */
  transitionTimeline.to(
    blinds,
    {
      scaleY: 1.02,
      duration: 1,
      ease: "power2.inOut",
      force3D: false,
      stagger: {
        each: 0.12,
        from: "end"
      }
    },
    0
  );

  /*
    ENTIRE SECTION ALSO STARTS AT 0.

    marginTop changes the actual page layout rather
    than only visually transforming the section.
  */
  transitionTimeline.to(
    firstLightSection,
    {
      marginTop: firstSectionMoveAmount,
      duration: 1,
      ease: "power2.inOut"
    },
    0
  );

}

/* =====================================================
   FIRST WHITE INTRO — FADE/UNBLUR TO VIEWPORT CENTER
===================================================== */

if (firstLightSection && firstInner) {
  gsap.fromTo(
    firstInner,
    {
      autoAlpha: 0,
      y: 54,
      filter: "blur(24px)"
    },
    {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      ease: "none",
      immediateRender: true,
      scrollTrigger: {
        trigger: firstLightSection,

        /* Begin while the intro is entering the viewport. */
        start: "top 195%",

        /* Fully visible and sharp when its top reaches center. */
        end: "top 165%",

        scrub: true,
        invalidateOnRefresh: true
      }
    }
  );
}

/* =====================================================
   OTHER WHITE SECTIONS
===================================================== 

const whiteSectionInners = gsap.utils.toArray(
  ".wrap-white-section__inner"
);

whiteSectionInners.forEach((sectionInner, index) => {

  if (index === 0) return;

  gsap.fromTo(
    sectionInner,
    {
      autoAlpha: 0,
      y: 42,
      filter: "blur(18px)"
    },
    {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionInner,
        start: "top 82%",
        once: true
      }
    }
  );
});

 =====================================================
   OTHER LIGHT SECTIONS
===================================================== 

gsap.utils
  .toArray(".wrap-light-section")
  .forEach((section, sectionIndex) => {

    if (
      section === firstLightSection ||
      sectionIndex === 0
    ) {
      return;
    }

    const inner = section.querySelector(
      ".wrap-light-section__inner"
    );

    const targets = section.querySelectorAll(
      ".wrap-light-section__kicker, h2, .wrap-light-section__lead, article"
    );

    if (inner) {
      gsap.fromTo(
        inner,
        {
          autoAlpha: 0,
          y: 34,
          filter: "blur(20px)"
        },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.25,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 88%",
            once: true
          }
        }
      );
    }

    if (targets.length) {
      gsap.from(targets, {
        y: 28,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 87%",
          once: true
        }
      });
    }
  });*/

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});

  window.addEventListener("load", () => ScrollTrigger.refresh());
});

/* ==========================================================
   Performante Gallery Flow — stable horizontal 5-panel showcase
   ========================================================== */
(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const stage = document.getElementById("performanteGalleryFlowStage");
  const track = document.getElementById("performanteGalleryFlowTrack");
  if (!stage || !track) return;

  const getTravel = () => Math.max(0, track.scrollWidth - window.innerWidth);

  gsap.set(track, { x: 0, force3D: true });

  const selectedWorksTimeline = gsap.timeline({
    scrollTrigger: {
      id: "performanteGalleryFlow",
      trigger: stage,

      // First let the sticky section actually reach the top of the viewport.
      start: "top top",

      // Keep the existing ending behavior exactly where it was.
      end: "bottom bottom",

      scrub: true,
      invalidateOnRefresh: true,
      fastScrollEnd: false
    }
  });

  // TRUE LOCK-IN HOLD:
  // During the first 25% of this ScrollTrigger nothing moves horizontally.
  // The section is already sticky at top:0, so it visibly locks in first.
  selectedWorksTimeline.to({}, {
    duration: 0.25
  });

  // After the hold, use the remaining scroll to move through the projects.
  selectedWorksTimeline.to(track, {
    x: () => -getTravel(),
    ease: "none",
    force3D: true,
    duration: 0.75
  });

  /* Selected Works image lift: every project image after the first rises
     slightly as its horizontal panel enters the viewport. */
  const selectedProjectMedia = gsap.utils.toArray(
    stage.querySelectorAll(".selected-works-panel--project .selected-project-card__media img")
  );

  selectedProjectMedia.slice(1).forEach((img) => {
    const panel = img.closest(".selected-works-panel");
    if (!panel) return;

    gsap.fromTo(
      img,
      { y: 52 },
      {
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: panel,
          containerAnimation: selectedWorksTimeline,
          start: "left 102%",
          end: "left 66%",
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    );
  });

  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

  /* --------------------------------------------------------
     Draggable / swipeable navigation (mouse + touch/tablet)
     The panels are normally advanced by page scroll (the
     ScrollTrigger above reads window scroll position and
     drives the track's x). To make the section feel native
     on tablets, we let a horizontal drag directly move the
     page's scroll position through this section's pinned
     range — the drag doesn't move the track itself, it moves
     the scroll, so it stays perfectly in sync with the
     existing scrub timeline.
  -------------------------------------------------------- */
  const st = selectedWorksTimeline.scrollTrigger;
  const lenis = window.lenis || null;

  const setScroll = (value) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const clamped = Math.max(0, Math.min(maxScroll, value));
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(clamped, { immediate: true, force: true });
    } else {
      window.scrollTo(0, clamped);
      ScrollTrigger.update();
    }
  };

  const DRAG_THRESHOLD = 6;
  const DRAG_SENSITIVITY_DESKTOP = 0.9; // mouse — less sensitive
  const DRAG_SENSITIVITY_TABLET = 2.2; // touch/pen — more sensitive

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScroll = 0;
  let direction = null; // "x" | "y" | null (undecided)
  let dragSensitivity = DRAG_SENSITIVITY_DESKTOP;

  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("a, button")) return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startScroll = st.scroll();
    direction = null;
    dragSensitivity = e.pointerType === "mouse" ? DRAG_SENSITIVITY_DESKTOP : DRAG_SENSITIVITY_TABLET;
  });

  stage.addEventListener("pointermove", (e) => {
    if (pointerId === null || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (direction === null) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      direction = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (direction === "x") {
        stage.setPointerCapture(pointerId);
        stage.classList.add("is-dragging");
      }
    }

    if (direction !== "x") return;

    e.preventDefault();
    setScroll(startScroll - dx * dragSensitivity);
  }, { passive: false });

  const endDrag = (e) => {
    if (pointerId === null || (e.pointerId !== undefined && e.pointerId !== pointerId)) return;
    if (direction === "x" && stage.hasPointerCapture?.(pointerId)) {
      stage.releasePointerCapture(pointerId);
    }
    pointerId = null;
    direction = null;
    stage.classList.remove("is-dragging");
  };

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener("dragstart", (e) => e.preventDefault());
})();

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




/* ============================================================================
   NEW — PW INFINITE GALLERY (added by Claude)
   Full-width, arrow-controlled, infinite-loop-in-both-directions image
   gallery. Markup lives in index.html (section#pwInfiniteGallery), CSS
   lives at the end of styles.css under the matching banner.

   How the loop works: the original slide set is cloned once before and
   once after itself, so the track is [clones][originals][clones]. The
   track starts positioned at the first "originals" slide. Clicking an
   arrow animates one slide at a time; once the animation lands on a
   cloned slide, we jump (no transition) back to the matching real slide
   so the loop never shows a blank frame or a hard "reset" in either
   direction.
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const viewport = document.getElementById("pwInfiniteGalleryViewport");
  const track = document.getElementById("pwInfiniteGalleryTrack");
  if (!viewport || !track) return;

  const section = document.getElementById("pwInfiniteGallery");
  const prevBtn = section ? section.querySelector(".pw-infinite-gallery__arrow--prev") : null;
  const nextBtn = section ? section.querySelector(".pw-infinite-gallery__arrow--next") : null;

  const originals = Array.from(track.children);
  const slideCount = originals.length;
  if (!slideCount) return;

  originals.forEach((slide, i) => slide.setAttribute("data-slide-index", String(i)));

  // Build [clones-before][originals][clones-after]
  const cloneSet = () => originals.map((slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    const img = clone.querySelector("img");
    if (img) img.removeAttribute("alt");
    return clone;
  });

  const beforeClones = cloneSet();
  const afterClones = cloneSet();

  track.innerHTML = "";
  [...beforeClones, ...originals, ...afterClones].forEach((el) => track.appendChild(el));

  const allSlides = Array.from(track.children);
  let index = slideCount; // start at the first "real" slide
  let slideWidth = 0;
  let isAnimating = false;

  function measure() {
    const first = allSlides[0];
    const style = window.getComputedStyle(first);
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    slideWidth = first.getBoundingClientRect().width + marginLeft + marginRight;
  }

  function setPosition(withTransition) {
    track.style.transition = withTransition ? "transform .55s cubic-bezier(.65,0,.35,1)" : "none";
    track.style.transform = `translateX(${-index * slideWidth}px)`;
  }

  function goTo(step) {
    if (isAnimating || !slideWidth) return;
    isAnimating = true;
    index += step;
    setPosition(true);
  }

  track.addEventListener("transitionend", () => {
    isAnimating = false;

    // Landed in the trailing clone zone -> snap back into the real set
    if (index >= slideCount * 2) {
      index -= slideCount;
      setPosition(false);
    }

    // Landed in the leading clone zone -> snap forward into the real set
    if (index < slideCount) {
      index += slideCount;
      setPosition(false);
    }
  });

  if (nextBtn) nextBtn.addEventListener("click", () => goTo(1));
  if (prevBtn) prevBtn.addEventListener("click", () => goTo(-1));

  // Basic drag / swipe support
  let dragStartX = 0;
  let dragging = false;
  let dragMoved = false;

  function onDragStart(clientX) {
    if (isAnimating) return;
    dragging = true;
    dragMoved = false;
    dragStartX = clientX;
  }

  function onDragEnd(clientX) {
    if (!dragging) return;
    dragging = false;
    const delta = clientX - dragStartX;
    if (Math.abs(delta) > 40) {
      dragMoved = true;
      goTo(delta < 0 ? 1 : -1);
    }
  }

  viewport.addEventListener("pointerdown", (e) => onDragStart(e.clientX));
  viewport.addEventListener("pointerup", (e) => onDragEnd(e.clientX));
  viewport.addEventListener("pointerleave", () => { dragging = false; });

  function init() {
    measure();
    setPosition(false);
  }

  init();

  // If a slide's image is missing/broken, swap in a visible labeled
  // placeholder instead of leaving a blank/invisible box.
  allSlides.forEach((slide) => {
    const img = slide.querySelector("img");
    if (!img) return;

    const showFallback = () => {
      if (slide.querySelector(".pw-infinite-gallery__slide-fallback")) return;
      const label = img.getAttribute("alt") || "Image coming soon";
      img.style.display = "none";
      const fallback = document.createElement("div");
      fallback.className = "pw-infinite-gallery__slide-fallback";
      fallback.textContent = label;
      slide.appendChild(fallback);
    };

    if (img.complete && img.naturalWidth === 0) {
      showFallback();
    } else {
      img.addEventListener("error", showFallback, { once: true });
    }
  });

  // --- Lightbox ---------------------------------------------------------
  // Reuses the site's existing (previously unwired) .pw-lightbox markup
  // and styles. Clicking any slide (including clones) opens the matching
  // original image; prev/next loop through the original slide set.
  const lightbox = document.getElementById("pwGalleryLightbox");
  if (lightbox) {
    const lightboxImg = document.getElementById("pwGalleryLightboxImg");
    const lightboxClose = document.getElementById("pwGalleryLightboxClose");
    const lightboxPrev = document.getElementById("pwGalleryLightboxPrev");
    const lightboxNext = document.getElementById("pwGalleryLightboxNext");
    let lightboxIndex = 0;

    function renderLightbox() {
      const source = originals[lightboxIndex];
      const sourceImg = source.querySelector("img");
      if (!sourceImg) return;
      lightboxImg.src = sourceImg.getAttribute("src");
      lightboxImg.alt = sourceImg.getAttribute("alt") || "";
    }

    function openLightbox(i) {
      lightboxIndex = ((i % slideCount) + slideCount) % slideCount;
      renderLightbox();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function stepLightbox(step) {
      lightboxIndex = ((lightboxIndex + step) % slideCount + slideCount) % slideCount;
      renderLightbox();
    }

    allSlides.forEach((slide) => {
      const openThis = () => {
        if (dragMoved) { dragMoved = false; return; }
        const i = parseInt(slide.getAttribute("data-slide-index"), 10);
        if (!Number.isNaN(i)) openLightbox(i);
      };
      slide.addEventListener("click", openThis);
      slide.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openThis();
        }
      });
    });

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener("click", () => stepLightbox(-1));
    if (lightboxNext) lightboxNext.addEventListener("click", () => stepLightbox(1));

    // Click on the dark backdrop (not the image/frame/buttons) closes it
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });
});
/* ============================================================================
   END — PW INFINITE GALLERY
   ============================================================================ */


/* ============================================================================
   GLOBAL TYPOGRAPHY + CARD REVEALS
   - headings: letter-by-letter blur / fade / rise
   - about statement: typography-safe scroll-driven white fill
   - Wraps & Branding cards: top-hinged fold-in, staggered
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Split titles by WORD first, then by character.
     This keeps normal word wrapping intact and prevents letters from being
     clipped or scattered across lines while preserving the same reveal look. */
  function splitHeadingIntoChars(el) {
    if (!el || el.dataset.pwSplit === "true") return [];

    const originalLabel = el.textContent.replace(/\s+/g, " ").trim();
    const chars = [];

    function processTextNode(node) {
      const value = node.nodeValue || "";
      const frag = document.createDocumentFragment();
      const parts = value.split(/(\s+)/);

      parts.forEach((part) => {
        if (!part) return;

        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }

        const word = document.createElement("span");
        word.className = "pw-title-word";
        word.setAttribute("aria-hidden", "true");

        [...part].forEach((char) => {
          const span = document.createElement("span");
          span.className = "pw-title-char";
          span.textContent = char;
          chars.push(span);
          word.appendChild(span);
        });

        frag.appendChild(word);
      });

      node.replaceWith(frag);
    }

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
        [...node.childNodes].forEach(walk);
      }
    }

    [...el.childNodes].forEach(walk);
    if (originalLabel) el.setAttribute("aria-label", originalLabel);
    el.classList.add("pw-title-reveal");
    el.dataset.pwSplit = "true";
    return chars;
  }

  /* 1) Special about statement — line-by-line white fill.
        The original heading remains completely untouched. We stack clipped
        white copies over the muted original, one clip per rendered line, so
        each line fills left-to-right before the next line begins. */
  const aboutTitle = document.querySelector(".wrap-about-panel__content h2");
  if (aboutTitle) {
    aboutTitle.classList.remove("pw-scroll-fill-text");
    aboutTitle.classList.add("pw-line-fill-source");

    const buildLineFill = () => {
      aboutTitle.querySelectorAll(":scope > .pw-line-fill-overlay").forEach(el => el.remove());

      const range = document.createRange();
      range.selectNodeContents(aboutTitle);
      const titleRect = aboutTitle.getBoundingClientRect();
      const rawRects = Array.from(range.getClientRects()).filter(r => r.width > 2 && r.height > 2);

      /* Merge fragments that belong to the same rendered line. */
      const lines = [];
      rawRects.forEach(r => {
        const existing = lines.find(line => Math.abs(line.top - r.top) < 3);
        if (existing) {
          existing.left = Math.min(existing.left, r.left);
          existing.right = Math.max(existing.right, r.right);
          existing.top = Math.min(existing.top, r.top);
          existing.bottom = Math.max(existing.bottom, r.bottom);
        } else {
          lines.push({ left:r.left, right:r.right, top:r.top, bottom:r.bottom });
        }
      });
      lines.sort((a,b) => a.top - b.top);

      const overlays = lines.map((line) => {
        const clone = document.createElement("span");
        clone.className = "pw-line-fill-overlay";
        clone.setAttribute("aria-hidden", "true");
        clone.textContent = aboutTitle.textContent;
        aboutTitle.appendChild(clone);

        const left = Math.max(0, line.left - titleRect.left);
        const right = Math.max(0, titleRect.right - line.right);
        const top = Math.max(0, line.top - titleRect.top);
        const bottom = Math.max(0, titleRect.bottom - line.bottom);

        gsap.set(clone, {
          clipPath: `inset(${top}px ${titleRect.width - left}px ${bottom}px ${left}px)`
        });

        clone.dataset.pwClipTop = top;
        clone.dataset.pwClipRight = right;
        clone.dataset.pwClipBottom = bottom;
        clone.dataset.pwClipLeft = left;
        return clone;
      });

      if (reduceMotion) {
        overlays.forEach(clone => {
          gsap.set(clone, {
            clipPath: `inset(${clone.dataset.pwClipTop}px ${clone.dataset.pwClipRight}px ${clone.dataset.pwClipBottom}px ${clone.dataset.pwClipLeft}px)`
          });
        });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".wrap-about-panel",
          start: "top 78%",
          end: "+=640",
          scrub: 0.30,
          invalidateOnRefresh: true
        }
      });

      overlays.forEach((clone, i) => {
        tl.to(clone, {
          clipPath: `inset(${clone.dataset.pwClipTop}px ${clone.dataset.pwClipRight}px ${clone.dataset.pwClipBottom}px ${clone.dataset.pwClipLeft}px)`,
          ease: "none",
          duration: 1
        }, i);
      });
    };

    requestAnimationFrame(buildLineFill);
    window.addEventListener("load", buildLineFill, { once:true });
  }

  /* 2) General title reveal.
        IMPORTANT: the first light section changes real layout (margin-top) while
        the marquee transition is scrubbed. ScrollTrigger positions created for
        descendants can therefore become stale. For Wraps & Branding and normal
        titles below it, use actual viewport intersection instead. Selected Works
        keeps its existing containerAnimation because that timing is already right. */
  const brandingSection = document.querySelector(".wrap-light-section--intro");

  function isAtOrAfterBranding(el) {
    if (!brandingSection || !el) return false;
    return el === brandingSection ||
      !!(brandingSection.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) ||
      brandingSection.contains(el);
  }

  /* Direct viewport watcher.
     This page has pinned/scrubbed sections that change layout while scrolling,
     so we deliberately avoid IntersectionObserver/normal ScrollTrigger for
     headings at and below Wraps & Branding. getBoundingClientRect() gives the
     element's real rendered position every frame. */
  const manualTitleReveals = new Map();

  function queueManualTitleReveal(title, chars, lead = 1.14) {
    gsap.set(chars, { autoAlpha: 0, y: 20, filter: "blur(9px)" });
    manualTitleReveals.set(title, { chars, lead });
  }

  function runManualViewportReveals() {
    if (!manualTitleReveals.size) return;

    manualTitleReveals.forEach((item, title) => {
      const rect = title.getBoundingClientRect();
      const triggerY = window.innerHeight * item.lead;

      /* Start before it enters the viewport, but only after it has approached
         from below. This makes the animation visible right as the title arrives. */
      if (rect.top <= triggerY && rect.bottom >= -80) {
        manualTitleReveals.delete(title);
        gsap.to(item.chars, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.68,
          stagger: 0.018,
          ease: "power3.out",
          overwrite: true
        });
      }
    });
  }

  if (!reduceMotion) gsap.ticker.add(runManualViewportReveals);

  gsap.utils.toArray("h1,h2,h3").forEach((title) => {
    if (title === aboutTitle) return;
    if (title.closest(".wrap-branding-card")) return;
    if (title.closest(".pw-menu")) return;

    const chars = splitHeadingIntoChars(title);
    if (!chars.length) return;

    if (reduceMotion) {
      gsap.set(chars, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    const selectedWorksPanel = title.closest(".selected-works-panel");
    const selectedWorksST = ScrollTrigger.getById("performanteGalleryFlow");

    if (selectedWorksPanel && selectedWorksST?.animation) {
      gsap.fromTo(
        chars,
        { autoAlpha: 0, y: 20, filter: "blur(9px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.68,
          stagger: 0.018,
          ease: "power3.out",
          scrollTrigger: {
            trigger: selectedWorksPanel,
            containerAnimation: selectedWorksST.animation,
            start: "left 97%",
            once: true
          }
        }
      );
      return;
    }

    if (isAtOrAfterBranding(title)) {
      /* Wraps & Branding gets a little extra lead; titles below it start
         roughly 12% before reaching the viewport. */
      const lead = title.closest(".wrap-branding-intro") ? 1.20 : 1.12;
      queueManualTitleReveal(title, chars, lead);
      return;
    }

    /* Earlier-page headings can safely keep normal ScrollTrigger timing. */
    gsap.fromTo(
      chars,
      { autoAlpha: 0, y: 20, filter: "blur(9px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.68,
        stagger: 0.018,
        ease: "power3.out",
        scrollTrigger: {
          trigger: title,
          start: "top 94%",
          once: true
        }
      }
    );
  });

  /* 3) Wraps & Branding cards — use viewport intersection instead of a
        descendant ScrollTrigger because the parent section's layout position is
        changing during the marquee transition. Top stays anchored; bottom folds in. */
  const brandingGrid = document.querySelector(".wrap-branding-grid");
  const brandingCards = brandingGrid
    ? gsap.utils.toArray(brandingGrid.querySelectorAll(".wrap-branding-card"))
    : [];

  if (brandingGrid && brandingCards.length) {
    gsap.set(brandingGrid, { perspective: 1400 });

    if (reduceMotion) {
      gsap.set(brandingCards, { autoAlpha: 1, rotateX: 0 });
    } else {
      gsap.set(brandingCards, {
        autoAlpha: 0,
        rotateX: -72,
        transformOrigin: "50% 0%",
        transformPerspective: 1400
      });

      const revealBrandingCards = () => {
        gsap.to(brandingCards, {
          autoAlpha: 1,
          rotateX: 0,
          duration: 1.05,
          stagger: 0.14,
          ease: "power3.out",
          overwrite: true,
          clearProps: "transform-origin"
        });
      };

      let brandingCardsRevealed = false;
      const checkBrandingCards = () => {
        if (brandingCardsRevealed) return;
        const rect = brandingGrid.getBoundingClientRect();

        /* Begin about 18% before the grid actually reaches the viewport. */
        if (rect.top <= window.innerHeight * 1.18 && rect.bottom >= -80) {
          brandingCardsRevealed = true;
          gsap.ticker.remove(checkBrandingCards);
          revealBrandingCards();
        }
      };

      gsap.ticker.add(checkBrandingCards);
      checkBrandingCards();
    }
  }

  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
});
