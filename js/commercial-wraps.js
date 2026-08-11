/* ============================================================================
   COMMERCIAL WRAPS — PAGE-SPECIFIC JS
   Self-contained: hero collage parallax, count-up stats, scroll-reveal,
   fleet showcase scroll-progress, before/after drag slider, and a rotating
   testimonial spotlight. Nothing here depends on gsap.js or vehicle-wraps.js.
   ============================================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* --- Scroll-reveal ------------------------------------------------------ */
  const revealEls = document.querySelectorAll(".cw-reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-inview"));
  }


  /* --- Hero collage parallax (cursor-driven) ------------------------------ */
  const collage = document.querySelector(".cw-hero__collage");
  const collageA = document.querySelector(".cw-hero__collage-img--a img");

  if (collage && collageA && window.matchMedia("(pointer: fine)").matches) {
    let targetX = 0, targetY = 0, curX = 0, curY = 0;

    collage.addEventListener("mousemove", (e) => {
      const rect = collage.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    collage.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
    });

    function tick() {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      collageA.style.transform = `scale(1.08) translate(${curX * -10}px, ${curY * -10}px)`;
      requestAnimationFrame(tick);
    }
    tick();
  }


  /* --- Count-up numbers (hero stat + bento stats) ------------------------- */
  const counters = document.querySelectorAll("[data-count-to]");
  if (counters.length && "IntersectionObserver" in window) {
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        countIo.unobserve(el);

        const to = parseFloat(el.getAttribute("data-count-to")) || 0;
        const suffix = el.getAttribute("data-count-suffix") || "";
        const decimals = parseInt(el.getAttribute("data-count-decimals"), 10) || 0;
        const duration = 1400;
        const start = performance.now();

        function frame(now) {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = to * eased;
          el.textContent = value.toFixed(decimals) + suffix;
          if (progress < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.4 });

    counters.forEach((el) => countIo.observe(el));
  }


  /* --- Fleet showcase: scroll-snap progress bar ---------------------------- */
  const fleetTrack = document.getElementById("cwFleetTrack");
  const fleetProgressBar = document.getElementById("cwFleetProgressBar");

  if (fleetTrack && fleetProgressBar) {
    const updateProgress = () => {
      const max = fleetTrack.scrollWidth - fleetTrack.clientWidth;
      const pct = max > 0 ? (fleetTrack.scrollLeft / max) * 100 : 0;
      fleetProgressBar.style.width = pct + "%";
    };
    fleetTrack.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }


  /* --- Before / after drag slider ------------------------------------------ */
  const compare = document.getElementById("cwCompare");
  if (compare) {
    const afterImg = compare.querySelector(".cw-compare__img--after");
    const handle = compare.querySelector(".cw-compare__handle");
    let dragging = false;

    function setPosition(clientX) {
      const rect = compare.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      afterImg.style.clipPath = `inset(0 0 0 ${pct}%)`;
      handle.style.left = pct + "%";
    }

    function onDown(e) {
      dragging = true;
      compare.classList.add("is-dragging");
      setPosition(e.touches ? e.touches[0].clientX : e.clientX);
    }
    function onMove(e) {
      if (!dragging) return;
      setPosition(e.touches ? e.touches[0].clientX : e.clientX);
    }
    function onUp() {
      dragging = false;
      compare.classList.remove("is-dragging");
    }

    compare.addEventListener("mousedown", onDown);
    compare.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
  }


  /* --- Fleet quote estimator ------------------------------------------------ */
  const slider = document.getElementById("cwEstimatorSlider");
  const countEl = document.getElementById("cwEstimatorCount");
  const priceEl = document.getElementById("cwEstimatorPrice");
  const timeEl = document.getElementById("cwEstimatorTime");

  if (slider && countEl && priceEl && timeEl) {
    const PER_VEHICLE_LOW = 900;
    const PER_VEHICLE_HIGH = 1500;

    function money(n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    }

    function update() {
      const n = parseInt(slider.value, 10);
      countEl.textContent = n;

      const low = n * PER_VEHICLE_LOW;
      const high = n * PER_VEHICLE_HIGH;
      priceEl.textContent = `${money(low)} – ${money(high)}`;

      const weeks = Math.max(1, Math.ceil(n / 3));
      timeEl.textContent = weeks === 1 ? "~1 Week" : `~${weeks} Weeks`;
    }

    slider.addEventListener("input", update);
    update();
  }


  /* --- Testimonial spotlight rotation --------------------------------------- */
  const spotlightItems = Array.from(document.querySelectorAll(".cw-spotlight__item"));
  const spotlightDots = Array.from(document.querySelectorAll(".cw-spotlight__dot"));
  if (spotlightItems.length) {
    let active = 0;
    let timer;

    function show(i) {
      spotlightItems.forEach((el, idx) => el.classList.toggle("is-active", idx === i));
      spotlightDots.forEach((el, idx) => el.classList.toggle("is-active", idx === i));
      active = i;
    }

    function next() {
      show((active + 1) % spotlightItems.length);
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 5000);
    }

    spotlightDots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        show(i);
        restart();
      });
    });

    show(0);
    restart();
  }

});
