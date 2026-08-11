/* =====================================================
   PERFORMANTE WRAPS — NAVBAR JS
   Extracted 1:1 from performante-wraps__9_.html
   Requires: GSAP core (https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js)
   Optional: GSAP ScrollTrigger, for the "light background" section-aware
             pill theming — this block no-ops cleanly if ScrollTrigger
             or .wrap-light-section elements aren't present on the page.
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;
  if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  const nav = document.getElementById("pwNav");
  const drawer = document.getElementById("pwMenu");
  const backdrop = document.getElementById("pwMenuBackdrop");
  const toggle = document.getElementById("pwMenuToggle");
  const close = document.getElementById("pwMenuClose");
  if (!drawer || !backdrop || !toggle || !close) {
    console.error("Performante menu could not initialize: one or more menu elements are missing.");
    return;
  }

  const links = gsap.utils.toArray(".pw-menu__links a");
  const footerItems = gsap.utils.toArray(".pw-menu__footer > *");
  const topItems = gsap.utils.toArray(".pw-menu__top > *");
  const menuContent = [...topItems, ...links, ...footerItems];
  let menuOpen = false;

  gsap.set(drawer, {
    scaleX: 0.96,
    scaleY: 1,
    y: -10,
    autoAlpha: 0,
    borderRadius: 42,
    clipPath: "inset(0% 0% 92% 0% round 42px 42px 120px 120px)",
    visibility: "hidden",
    pointerEvents: "none"
  });
  gsap.set(backdrop, {
    autoAlpha: 0,
    visibility: "hidden",
    pointerEvents: "none"
  });
  gsap.set([links, footerItems], { y: 24, autoAlpha: 0, filter: "blur(10px)" });

  const openMenu = () => {
    if (menuOpen) return;
    menuOpen = true;
    drawer.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    nav?.classList.add("pw-nav--menu-open");
    requestAnimationFrame(() => syncHeaderPillColors());
    const toggleLabel = toggle.querySelector(".pw-nav__toggle-label");
    if (toggleLabel) toggleLabel.textContent = "Close";

    const tl = gsap.timeline();
    tl.set([drawer, backdrop], { visibility: "visible", pointerEvents: "auto" })
      .to(backdrop, { autoAlpha: 1, duration: .2, ease: "power2.out" }, 0)
      .to(drawer, {
        scaleX: 1,
        scaleY: 1,
        y: 0,
        autoAlpha: 1,
        borderRadius: 24,
        clipPath: "inset(0% 0% 0% 0% round 24px)",
        duration: .86,
        ease: "power4.out"
      }, 0)
      .to(links, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .62, stagger: .06, ease: "power3.out" }, .28)
      .to(footerItems, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .5, stagger: .05, ease: "power2.out" }, .52);
  };

  const closeMenu = () => {
    if (!menuOpen) return;
    menuOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    nav?.classList.remove("pw-nav--menu-open");
    requestAnimationFrame(() => syncHeaderPillColors());
    const toggleLabel = toggle.querySelector(".pw-nav__toggle-label");
    if (toggleLabel) toggleLabel.textContent = "Menu";

    gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        drawer.setAttribute("aria-hidden", "true");
        backdrop.setAttribute("aria-hidden", "true");
        gsap.set([drawer, backdrop], {
          visibility: "hidden",
          pointerEvents: "none"
        });
        gsap.set(drawer, {
          overflow: "hidden",
          scaleX: 0.96,
          scaleY: 1,
          y: -10,
          autoAlpha: 0,
          borderRadius: 42,
          clipPath: "inset(0% 0% 92% 0% round 42px 42px 120px 120px)"
        });
        gsap.set(topItems, {
          y: 0,
          autoAlpha: 1,
          filter: "blur(0px)"
        });
        gsap.set([links, footerItems], {
          y: 24,
          autoAlpha: 0,
          filter: "blur(10px)"
        });
      }
    })
    /* Hide every control first, including Menu and Close. */
    .to(menuContent, {
      y: -10,
      autoAlpha: 0,
      filter: "blur(7px)",
      duration: .20,
      stagger: {
        each: .012,
        from: "end"
      },
      ease: "power2.in"
    }, 0)

    /* Only fold the panel after the top-right Close control is gone. */
    .set(drawer, {
      overflow: "hidden",
      clipPath: "none",
      transformOrigin: "top center"
    }, .23)
    .to(drawer, {
      scaleX: 1,
      scaleY: 0.08,
      y: -4,
      autoAlpha: 0,
      borderRadius: 34,
      duration: .44,
      ease: "power2.inOut"
    }, .24)
    .to(backdrop, {
      autoAlpha: 0,
      duration: .30,
      ease: "power2.inOut"
    }, .30);
  };

  toggle?.addEventListener("click", () => menuOpen ? closeMenu() : openMenu());
  close?.addEventListener("click", closeMenu);
  backdrop?.addEventListener("click", closeMenu);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  const blockPageScroll = (event) => {
    if (!menuOpen) return;
    if (drawer.contains(event.target)) return;
    event.preventDefault();
  };
  window.addEventListener("wheel", blockPageScroll, { passive:false });
  window.addEventListener("touchmove", blockPageScroll, { passive:false });

  /* Single, stable interaction system for pills and menu links. */
  const headerPills = gsap.utils.toArray(".pw-nav__chat, .pw-nav__toggle");

  headerPills.forEach((pill) => {
    let fill = pill.querySelector(".pw-pill-fill");
    if (!fill) {
      fill = document.createElement("span");
      fill.className = "pw-pill-fill";
      fill.setAttribute("aria-hidden", "true");
      pill.prepend(fill);
    }

    const setFillGeometry = (event) => {
      const rect = pill.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const farX = Math.max(x, rect.width - x);
      const farY = Math.max(y, rect.height - y);
      const diameter = Math.hypot(farX, farY) * 2.15;
      gsap.set(fill, { left:x, top:y, width:diameter, height:diameter });
    };

    const restingPillColor = () =>
      (nav?.classList.contains("pw-nav--menu-open") || nav?.classList.contains("pw-nav--light-bg")) ? "#111" : "#fff";

    const hoverPillColor = () =>
      (nav?.classList.contains("pw-nav--menu-open") || nav?.classList.contains("pw-nav--light-bg")) ? "#fff" : "#111";

    const fillColor = () =>
      (nav?.classList.contains("pw-nav--menu-open") || nav?.classList.contains("pw-nav--light-bg")) ? "#111" : "#fff";

    pill.addEventListener("pointerenter", (event) => {
      setFillGeometry(event);
      gsap.killTweensOf([fill, pill]);
      gsap.set(fill, { backgroundColor: fillColor() });
      gsap.to(pill, {
        color: hoverPillColor(),
        duration: .22,
        ease: "power2.out",
        overwrite: true
      });
      gsap.fromTo(fill, { scale:0 }, {
        scale:1,
        duration:.48,
        ease:"power3.out",
        overwrite:true
      });
    });

    pill.addEventListener("pointerleave", (event) => {
      setFillGeometry(event);
      gsap.killTweensOf([fill, pill]);
      gsap.to(pill, {
        color: restingPillColor(),
        duration: .22,
        ease: "power2.out",
        overwrite: true
      });
      gsap.to(fill, {
        scale:0,
        duration:.34,
        ease:"power2.inOut",
        overwrite:true
      });
    });
  });

  const syncHeaderPillColors = () => {
    const lightState =
      nav?.classList.contains("pw-nav--menu-open") ||
      nav?.classList.contains("pw-nav--light-bg");

    headerPills.forEach((pill) => {
      const hovered = pill.matches(":hover");
      gsap.killTweensOf(pill);
      gsap.set(pill, {
        color: hovered
          ? (lightState ? "#fff" : "#111")
          : (lightState ? "#111" : "#fff")
      });

      const fill = pill.querySelector(".pw-pill-fill");
      if (fill) {
        gsap.set(fill, {
          backgroundColor: lightState ? "#111" : "#fff"
        });
      }
    });
  };

  window.syncPerformanteHeaderTheme = syncHeaderPillColors;

  links.forEach((link) => {
    if (!link.dataset.splitReady) {
      const text = link.textContent.trim();
      link.textContent = "";
      [...text].forEach((char) => {
        const span = document.createElement("span");
        span.className = "pw-menu-letter";
        span.textContent = char === " " ? " " : char;
        link.appendChild(span);
      });
      link.dataset.splitReady = "true";
    }

    const letters = gsap.utils.toArray(".pw-menu-letter", link);
    gsap.set(letters, { x:0, y:0, rotation:0, autoAlpha:1, filter:"blur(0px)" });

    link.addEventListener("pointerenter", () => {
      /* Only clear tweens on the letters + the link's own hover-x tween —
         never a blanket kill on `link`, which would also cancel the
         drawer's still-running entrance/exit tween on that same element
         (its y/autoAlpha/filter) and leave it frozen mid-blur. */
      gsap.killTweensOf(letters);
      gsap.killTweensOf(link, "x");
      gsap.to(link, { x:5, duration:.38, ease:"power3.out", overwrite:"auto" });
      gsap.fromTo(letters,
        {
          x:(i) => (i % 2 ? 1.5 : -1.5),
          y:(i) => ((i % 3) - 1) * 1.4,
          filter:"blur(2.5px)",
          autoAlpha:.78
        },
        {
          x:0,
          y:0,
          rotation:0,
          filter:"blur(0px)",
          autoAlpha:1,
          duration:.52,
          stagger:.014,
          ease:"power4.out",
          overwrite:"auto"
        }
      );
    });

    link.addEventListener("pointerleave", () => {
      gsap.killTweensOf(letters);
      gsap.killTweensOf(link, "x");
      gsap.to(link, { x:0, duration:.3, ease:"power3.out", overwrite:"auto" });
      gsap.to(letters, {
        x:0,
        y:0,
        rotation:0,
        autoAlpha:1,
        filter:"blur(0px)",
        duration:.24,
        ease:"power2.out",
        overwrite:"auto"
      });
    });
  });
});

/* =====================================================
   OPTIONAL: header theme over white/light page sections.
   Requires GSAP ScrollTrigger + elements with class "wrap-light-section".
   Cleanly no-ops if either is absent, so it's safe to include everywhere.
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("pwNav");
  if (!nav) return;
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const whiteSections = gsap.utils.toArray(".wrap-light-section");
  if (!whiteSections.length) return;

  let activeWhiteSections = 0;
/*
  const applyHeaderTheme = () => {
    nav.classList.toggle("pw-nav--light-bg", activeWhiteSections > 0);

    if (typeof window.syncPerformanteHeaderTheme === "function") {
      window.syncPerformanteHeaderTheme();
    } else {
      const lightState =
        nav.classList.contains("pw-nav--light-bg") ||
        nav.classList.contains("pw-nav--menu-open");

      nav.querySelectorAll(".pw-nav__chat, .pw-nav__toggle").forEach((pill) => {
        if (!pill.matches(":hover")) {
          gsap.set(pill, { color: lightState ? "#111" : "#fff" });
        }
        const fill = pill.querySelector(".pw-pill-fill");
        if (fill) gsap.set(fill, { backgroundColor: lightState ? "#111" : "#fff" });
      });
    }
  };*/

  whiteSections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => { activeWhiteSections += 1; applyHeaderTheme(); },
      onEnterBack: () => { activeWhiteSections += 1; applyHeaderTheme(); },
      onLeave: () => { activeWhiteSections = Math.max(0, activeWhiteSections - 1); applyHeaderTheme(); },
      onLeaveBack: () => { activeWhiteSections = Math.max(0, activeWhiteSections - 1); applyHeaderTheme(); }
    });
  });

  ScrollTrigger.refresh();
});
