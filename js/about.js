/* ============================================================================
   ABOUT — page-specific JS
   Handles the two scroll-locked sections: the Values line-draw sequence
   and the Process rise-up-from-below sequence. Both pin the section in
   place with GSAP ScrollTrigger and drive a scrubbed timeline off scroll
   position, so the animation tracks the scrollbar directly rather than
   playing on a timer.
   ============================================================================ */

document.addEventListener("DOMContentLoaded", () => {

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Values: line draws across, 3 points reveal in turn --------------- */
  const valuesSection = document.querySelector(".ab-values");
  if (valuesSection) {
    const line = valuesSection.querySelector(".ab-values__line");
    const points = gsap.utils.toArray(".ab-values__point", valuesSection);
    const dots = gsap.utils.toArray(".ab-values__dot", valuesSection);

    gsap.set(points, { opacity: 0, y: 24 });
    gsap.set(dots, { opacity: 0 });

    const valuesTl = gsap.timeline({
      scrollTrigger: {
        trigger: valuesSection,
        start: "top top",
        end: "+=220%",
        pin: true,
        scrub: 1
      }
    });

    valuesTl
      .to(line, { scaleX: 1, ease: "none", duration: 3 })
      .to(dots[0], { opacity: 1, duration: 0.2, ease: "power1.out" }, 0.15)
      .to(points[0], { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" }, 0.15)
      .to(dots[1], { opacity: 1, duration: 0.2, ease: "power1.out" }, 0.9)
      .to(points[1], { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" }, 0.9)
      .to(dots[2], { opacity: 1, duration: 0.2, ease: "power1.out" }, 1.7)
      .to(points[2], { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" }, 1.7);
  }

  /* ---------------- Process: 3 cards rise up from below the viewport --------------- */
  const riseSection = document.querySelector(".ab-rise");
  if (riseSection) {
    const cards = gsap.utils.toArray(".ab-rise__card", riseSection);

    gsap.set(cards, { yPercent: 130, opacity: 0 });

    gsap.timeline({
      scrollTrigger: {
        trigger: riseSection,
        start: "top top",
        end: "+=180%",
        pin: true,
        scrub: 1
      }
    }).to(cards, {
      yPercent: 0,
      opacity: 1,
      stagger: 0.5,
      ease: "none"
    });
  }

  /* ---------------- Story sections: simple fade-in as they scroll into view --------------- */
  const storyTargets = document.querySelectorAll(".ab-story__eyebrow, .ab-story__headline, .ab-story__media");
  if (storyTargets.length) {
    storyTargets.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          ease: "power1.out",
          scrollTrigger: { trigger: el, start: "top 85%" }
        }
      );
    });
  }

  /* ---------------- Gallery grid: simple fade-in --------------- */
  const galleryItems = document.querySelectorAll(".ab-gallery__item");
  if (galleryItems.length) {
    gsap.fromTo(
      galleryItems,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.6,
        ease: "power1.out",
        stagger: 0.08,
        scrollTrigger: { trigger: ".ab-gallery__grid", start: "top 85%" }
      }
    );
  }
});

/* ============================================================================
   END ABOUT JS
   ============================================================================ */
