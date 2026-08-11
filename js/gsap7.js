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

/* ==========================================================
   Gallery filmstrip — click to open lightbox
   (drag/swipe for the filmstrip itself lives in animations.js,
   inside its existing step-based carousel — see the "Before/after
   filmstrip carousel" block there. It exposes
   window.__filmstripDragMoved so this click handler can tell a
   drag-release apart from a genuine click.)
   ========================================================== */
(() => {
  const lightbox = document.getElementById("pwLightbox");
  const lightboxImg = document.getElementById("pwLightboxImg");
  const frame = document.querySelector(".pw-lightbox__frame");
  const closeBtn = document.getElementById("pwLightboxClose");

  // Only the real photos, not the aria-hidden loop duplicates, and de-duped
  // by src so dragging cycles through each photo once.
  const seen = new Set();
  const slides = [];
  document.querySelectorAll(".wrap-filmstrip__item img").forEach((img) => {
    if (img.closest('[aria-hidden="true"]')) return;
    if (seen.has(img.src)) return;
    seen.add(img.src);
    slides.push({ src: img.src, alt: img.alt });
  });

  if (!lightbox || !lightboxImg || !frame || !closeBtn || !slides.length) return;

  // Guarantee the lightbox is a direct child of <body>, not nested inside
  // any section — a transformed/will-change ancestor anywhere in the tree
  // would otherwise turn `position: fixed` into something scoped to that
  // ancestor instead of the viewport.
  if (lightbox.parentElement !== document.body) {
    document.body.appendChild(lightbox);
  }

  let currentIndex = 0;

  const showSlide = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    const slide = slides[currentIndex];
    lightboxImg.src = slide.src;
    lightboxImg.alt = slide.alt || "";
  };

  const openLightbox = (src) => {
    const startIndex = slides.findIndex((s) => s.src === src);
    showSlide(startIndex === -1 ? 0 : startIndex);
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  document.querySelectorAll(".wrap-filmstrip__item img").forEach((img) => {
    img.addEventListener("click", () => {
      if (window.__filmstripDragMoved) return;
      openLightbox(img.src);
    });
  });

  closeBtn.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showSlide(currentIndex + 1);
    if (e.key === "ArrowLeft") showSlide(currentIndex - 1);
  });

  /* ---- Drag / swipe to move between photos ---- */
  const DRAG_THRESHOLD = 70;
  let pointerId = null;
  let startX = 0;
  let dragX = 0;
  let dragging = false;

  frame.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    dragX = 0;
    dragging = true;
    frame.classList.add("is-dragging");
    frame.setPointerCapture(pointerId);
  });

  frame.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragX = e.clientX - startX;
    frame.style.transform = `translateX(${dragX}px)`;
  });

  const endDrag = (e) => {
    if (!dragging || (e.pointerId !== undefined && e.pointerId !== pointerId)) return;
    dragging = false;
    frame.classList.remove("is-dragging");
    frame.style.transform = "";

    if (dragX <= -DRAG_THRESHOLD) {
      showSlide(currentIndex + 1);
    } else if (dragX >= DRAG_THRESHOLD) {
      showSlide(currentIndex - 1);
    }

    pointerId = null;
    dragX = 0;
  };

  frame.addEventListener("pointerup", endDrag);
  frame.addEventListener("pointercancel", endDrag);
  frame.addEventListener("dragstart", (e) => e.preventDefault());
})();

/* Wraps & Branding cards — slide down + fade in, one by one, scrubbed to scroll */
(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  const grid = document.querySelector(".wrap-branding-grid");
  const cards = gsap.utils.toArray(".wrap-branding-card");
  if (!grid || !cards.length) return;

  gsap.set(cards, { opacity: 0, y: -60 });

  gsap.timeline({
    scrollTrigger: {
      trigger: grid,
      start: "top 90%",
      end: "top 25%",
      scrub: 0.6
    }
  }).to(cards, {
    opacity: 1,
    y: 0,
    ease: "power1.out",
    stagger: 0.4
  });
})();
