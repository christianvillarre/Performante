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
  const simpleMenu = document.body.classList.contains("index2-menu");
  const mobileMenuMedia=window.matchMedia('(max-width:760px)');
  let browserTheme=document.querySelector('meta[name="theme-color"]');
  if(!browserTheme){
    browserTheme=document.createElement('meta');
    browserTheme.name='theme-color';browserTheme.content='#000000';
    document.head.appendChild(browserTheme);
  }
  const defaultBrowserTheme=browserTheme.content;
  const syncMobileBrowserTheme=()=>{
    const mobileOpen=mobileMenuMedia.matches && menuOpen;
    document.documentElement.dataset.pwMobileMenuOpen=String(mobileOpen);
    // Keep browser chrome stable: mobile browsers can defer dynamic tint updates.
    browserTheme.content=mobileMenuMedia.matches?'#000000':defaultBrowserTheme;
  };
  mobileMenuMedia.addEventListener('change',syncMobileBrowserTheme);
  syncMobileBrowserTheme();

  gsap.set(drawer, {
    display: "none",
    scaleX: 0.96,
    scaleY: 1,
    y: -10,
    autoAlpha: 0,
    borderRadius: 42,
    clipPath: simpleMenu ? "inset(0% 0% 100% 0% round 24px)" : "inset(0% 0% 92% 0% round 42px 42px 120px 120px)",
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
    syncMobileBrowserTheme();
    drawer.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    nav?.classList.add("pw-nav--menu-open");
    if(simpleMenu)gsap.set(toggle,{opacity:1,color:"#111"});
    requestAnimationFrame(() => syncHeaderPillColors());
    const toggleLabel = toggle.querySelector(".pw-nav__toggle-label");
    if (toggleLabel) toggleLabel.textContent = "Close";

    const tl = gsap.timeline();
    tl.set(drawer, { display: "flex" })
      .set([drawer, backdrop], { visibility: "visible", pointerEvents: "auto" })
      .to(backdrop, { autoAlpha: 1, duration: .2, ease: "power2.out" }, 0)
      .to(drawer, {
        scaleX: 1,
        scaleY: 1,
        y: 0,
        autoAlpha: 1,
        borderRadius: 24,
        clipPath: "inset(0% 0% 0% 0% round 24px)",
        duration: simpleMenu ? .68 : .86,
        ease: "power4.out"
      }, 0)
      .to(links, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .62, stagger: .06, ease: "power3.out" }, .28)
      .to(footerItems, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .5, stagger: .05, ease: "power2.out" }, .52);
  };

  const closeMenu = () => {
    if (!menuOpen) return;
    menuOpen = false;
    syncMobileBrowserTheme();
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    if(!simpleMenu){
      nav?.classList.remove("pw-nav--menu-open");
      requestAnimationFrame(() => syncHeaderPillColors());
    }else{
      gsap.set(toggle,{opacity:1,color:"#111"});
    }
    const toggleLabel = toggle.querySelector(".pw-nav__toggle-label");
    if (toggleLabel) toggleLabel.textContent = "Menu";

    gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        if(simpleMenu){
          nav?.classList.remove("pw-nav--menu-open");
          gsap.set(toggle,{opacity:1});
          syncHeaderPillColors();
        }
        drawer.setAttribute("aria-hidden", "true");
        backdrop.setAttribute("aria-hidden", "true");
        gsap.set([drawer, backdrop], {
          visibility: "hidden",
          pointerEvents: "none"
        });
        // Remove the white fixed surface after its exit animation. Opacity alone
        // leaves it in the composited page even though the menu looks closed.
        gsap.set(drawer, {
          display: "none",
          overflow: "hidden",
          scaleX: 0.96,
          scaleY: 1,
          y: -10,
          autoAlpha: 0,
          borderRadius: 42,
          clipPath: simpleMenu ? "inset(0% 0% 100% 0% round 24px)" : "inset(0% 0% 92% 0% round 42px 42px 120px 120px)"
        });
        syncMobileBrowserTheme();
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
      clipPath: simpleMenu ? "inset(0% 0% 0% 0% round 24px)" : "none",
      transformOrigin: "top center"
    }, .23)
    .to(drawer, {
      scaleX: 1,
      scaleY: simpleMenu ? 1 : 0.08,
      y: simpleMenu ? 0 : -4,
      autoAlpha: 0,
      clipPath: simpleMenu ? "inset(0% 0% 100% 0% round 24px)" : "none",
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
    const simpleHamburger = document.body.classList.contains("index2-menu") && pill.id === "pwMenuToggle";
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
      if (simpleHamburger) {
        gsap.to(pill, { color:restingPillColor(), opacity:.68, duration:.22, overwrite:true });
        return;
      }
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
      if (simpleHamburger) {
        gsap.to(pill, { color:restingPillColor(), opacity:1, duration:.22, overwrite:true });
        return;
      }
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
        color: simpleHamburger ? (lightState ? "#111" : "#fff") : hovered
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

    // Absolute positioning puts every arrow on the same right-hand rail.
    let arrow=link.querySelector('.pw-menu-link-arrow');
    if(!arrow){
      arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');
      arrow.classList.add('pw-menu-link-arrow');
      arrow.setAttribute('viewBox','0 0 24 24');
      arrow.setAttribute('aria-hidden','true');
      arrow.setAttribute('focusable','false');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M4 12h15m-6-6 6 6-6 6');
      arrow.appendChild(path);link.appendChild(arrow);
    }
    gsap.set(arrow,{x:-7,autoAlpha:0});
    const letters = gsap.utils.toArray(".pw-menu-letter", link);
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    // Keep the complete link name available to assistive technology.
    link.setAttribute('aria-label',letters.map(letter=>letter.textContent).join(''));
    letters.forEach(letter=>letter.setAttribute('aria-hidden','true'));
    gsap.set(letters,{x:0,y:0,rotation:0,scale:1,autoAlpha:1,clearProps:'filter'});
    // One reversible animation: no blur, random offsets or jump on re-entry.
    // Animate the letters only, leaving the drawer's link entrance untouched.
    const rollover=gsap.timeline({paused:true});
    if(simpleMenu){
      rollover.to(letters,{x:3,duration:.18,stagger:{each:.012,from:'start'},ease:'power2.out'});
    }else{
      rollover.to(letters,{x:4,y:-1,duration:.32,stagger:{amount:.08,from:'start'},ease:'power3.out'});
    }
    rollover.to(arrow,{x:0,autoAlpha:1,duration:.26,ease:'power3.out'},.04);
    let pointerInside=false;
    function syncRollover(){
      const active=pointerInside || document.activeElement===link;
      if(motion.matches){rollover.pause(0);gsap.set(arrow,{x:0,autoAlpha:active?1:0});return;}
      if(simpleMenu){
        if(active){
          gsap.killTweensOf(letters);
          gsap.fromTo(letters,{x:0},{x:3,duration:.18,stagger:{each:.012,from:'start'},ease:'power2.out',overwrite:true});
          gsap.to(arrow,{x:0,autoAlpha:1,duration:.18,overwrite:true});
        }else{
          gsap.killTweensOf(letters);
          gsap.to(letters,{x:0,scale:1,filter:'blur(0px)',color:'#111',textShadow:'none',duration:.12,overwrite:true});
          gsap.to(arrow,{x:-7,autoAlpha:0,duration:.12,overwrite:true});
        }
        return;
      }
      rollover.timeScale(active?1:1.25);
      if(active)rollover.play();else rollover.reverse();
    }
    link.addEventListener('pointerenter',event=>{
      if(event.pointerType==='touch')return;
      pointerInside=true;syncRollover();
    });
    link.addEventListener('pointerleave',()=>{pointerInside=false;syncRollover();});
    link.addEventListener('focus',syncRollover);
    link.addEventListener('blur',syncRollover);
    motion.addEventListener('change',syncRollover);
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
