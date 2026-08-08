document.addEventListener("DOMContentLoaded", () => {
  const nav    = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const drawer = document.getElementById("drawer");

  /* ---- Navbar background on scroll ---- */
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 20);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile drawer ---- */
  const setDrawer = (open) => {
    toggle.classList.toggle("open", open);
    drawer.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle.addEventListener("click", () => {
    setDrawer(!drawer.classList.contains("open"));
  });

  drawer.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setDrawer(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setDrawer(false);
  });

  /* ---- Scroll reveal ---- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    reveals.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 0.06 + "s";
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---- Button fill origin (circle grows from pointer, retracts to exit) ---- */
  document.querySelectorAll(".btn").forEach((btn) => {
    const setOrigin = (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--x", (e.clientX - r.left) + "px");
      btn.style.setProperty("--y", (e.clientY - r.top) + "px");
      btn.style.setProperty("--d", (2.2 * Math.hypot(r.width, r.height)) + "px");
    };
    btn.addEventListener("mouseenter", setOrigin);
    btn.addEventListener("mouseleave", setOrigin);
  });

  /* ---- Footer year ---- */
  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
});
