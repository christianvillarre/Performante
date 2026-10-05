/* Reuses index energy-field idle geometry and shine. No pointer input or lightning. */
(() => {
  const canvas = document.getElementById('aboutEnergyField');
  const opening = document.querySelector('.at-opening');
  const hero = document.querySelector('.at-intro');
  if (!canvas || !opening || !hero) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = () => innerWidth <= 760;
  const state = {width: 0, height: 0, impulse: 0, time: 0};
  let width = 0, height = 0, heroHeight = 0, dpr = 1, frame = 0, previous = 0, visible = true;
const lines = [
  {
    index: 0,
    orbitPhase: 0,
    startOffset: -1.02,
    endOffset: 1.12,
    bow: -0.108,
    crossCenter: 0.41,
    crossStrength: 0.075,
    phase: 0.25,
    speed: 0.28,
    amplitude: 10,
    shineOffset: 0.10,
    shineSpeed: 0.18
  },
  {
    index: 1,
    orbitPhase: Math.PI * 2 / 3,
    startOffset: 0.00,
    endOffset: 0.00,
    bow: 0.065,
    crossCenter: 0.55,
    crossStrength: -0.060,
    phase: 2.25,
    speed: 0.65,
    amplitude: 12,
    shineOffset: 0.53,
    shineSpeed: 0.21
  },
  {
    index: 2,
    orbitPhase: Math.PI * 4 / 3,
    startOffset: 1.08,
    endOffset: -1.02,
    bow: 0.128,
    crossCenter: 0.69,
    crossStrength: 0.075,
    phase: 4.10,
    speed: 0.27,
    amplitude: 11,
    shineOffset: 0.82,
    shineSpeed: 0.19
  }
];

  function pointOnCurve(line, progress, time){
    const nx = 0;
    const ny = 0;
    const t = progress;
    const mt = 1 - t;

    const endpointGap = mobile()
      ? state.height * 0.075
      : state.height * 0.105;

    const drift =
      Math.sin(time * line.speed + line.phase) *
      line.amplitude;

    /* Subtle movement only, so every path still reads as one clean long curve. */
    const pointerX = nx * state.width * 0.022;
    const pointerY = ny * state.height * 0.026;

    const startX = -state.width * 0.16 + pointerX * 0.12;
    const startY =
      state.height * 0.91 +
      line.startOffset * endpointGap +
      pointerY * 0.16;

    const endX = state.width * 1.16 + pointerX;
    const endY =
      state.height * 0.09 +
      line.endOffset * endpointGap -
      pointerY * 0.24;

    /* Both handles continue in the same diagonal direction for one long arc. */
    const cp1x = state.width * (0.27 + nx * 0.020);
    const cp2x = state.width * (0.73 + nx * 0.018);

    const diagonalAtCp1 = startY + (endY - startY) * 0.27;
    const diagonalAtCp2 = startY + (endY - startY) * 0.73;

    const bowAmount = line.bow * state.height;

    const cp1y =
      diagonalAtCp1 +
      bowAmount +
      drift +
      pointerY * 0.42;

    const cp2y =
      diagonalAtCp2 -
      bowAmount * 0.72 -
      drift * 0.62 -
      pointerY * 0.34;

    const curveX =
      mt * mt * mt * startX +
      3 * mt * mt * t * cp1x +
      3 * mt * t * t * cp2x +
      t * t * t * endX;

    const curveY =
      mt * mt * mt * startY +
      3 * mt * mt * t * cp1y +
      3 * mt * t * t * cp2y +
      t * t * t * endY;

    /*
      A broad, smooth crossover influence. Each line uses a different center,
      so the crossings happen at staggered positions rather than one bundle.
      It fades completely before either endpoint.
    */
    const distanceFromCross = (t - line.crossCenter) / 0.24;
    const crossoverEnvelope = Math.exp(-distanceFromCross * distanceFromCross);
    const endpointFade = Math.pow(Math.sin(Math.PI * t), 1.25);
    const crossover =
      line.crossStrength *
      state.height *
      crossoverEnvelope *
      endpointFade;

    /*
      Slow intertwined rotation. Each line travels around the same invisible
      center path with a 120-degree phase difference. The envelope keeps the
      endpoints stable while the middle appears to twist in three dimensions.
    */
    const orbitSpeed = 0.22;
    const orbitAngle =
      time * orbitSpeed +
      line.orbitPhase +
      t * Math.PI * 1.45;

    const orbitEnvelope =
      Math.pow(Math.sin(Math.PI * t), 0.82);

    const orbitRadius =
      (mobile() ? state.height * 0.020 : state.height * 0.028) *
      orbitEnvelope;

    const orbitX =
      Math.cos(orbitAngle) *
      orbitRadius * 0.58;

    const orbitY =
      Math.sin(orbitAngle) *
      orbitRadius;

    // A light traveling ripple follows pointer energy while endpoints stay anchored.
    const ripple = Math.sin(t*15-time*1.65+line.phase) *
      Math.sin(t*6+time*.55+line.orbitPhase) * endpointFade *
      (mobile()?2.2:3.8) * (0.25+state.impulse*.75);
    const inertia = state.impulse * Math.sin(t*Math.PI) *
      Math.sin(time*.7+line.phase) * (mobile()?2:5);
    return {
      x: curveX + orbitX + inertia*.35,
      y: curveY + crossover + orbitY + ripple + inertia,
      depth: Math.cos(orbitAngle)
    };
  }

  function drawLine(line, time, sample = pointOnCurve){
    ctx.beginPath();
    for(let i = 0; i <= 100; i++){
      const p = sample(line, i / 100, time);
      if(i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    const midDepth = sample(line, 0.5, time).depth || 0;
    const depthBrightness = 0.16 + (midDepth + 1) * 0.075;
    const depthWidth = 0.90 + (midDepth + 1) * 0.10;

    ctx.strokeStyle = `rgba(222,238,249,${depthBrightness})`;
    ctx.lineWidth = (mobile() ? 0.75 : 1.1) * depthWidth;
    ctx.shadowBlur = 5 + Math.max(0, midDepth) * 3;
    ctx.shadowColor = "rgba(160,213,250,.34)";
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawShine(line, time, sample = pointOnCurve){
    const progress = (time * line.shineSpeed + line.shineOffset) % 1;
    const trail = mobile() ? 0.035 : 0.052;
    ctx.lineCap = "round";
    for(let i = 0; i < 12; i++){
      const local = progress - trail + trail * i / 11;
      if(local < 0 || local > 1) continue;
      const a = sample(line, local, time);
      const b = sample(line, Math.min(1, local + 0.0045), time);
      const weight = 1 - Math.abs(i / 11 * 2 - 1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(237,249,255,${0.08 + weight * 0.48})`;
      ctx.lineWidth = mobile() ? 0.85 : 1.2;
      ctx.shadowBlur = weight * 5;
      ctx.shadowColor = "rgba(190,230,255,.65)";
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }


  // Lower trails enter and exit outside the right edge, with no visible endpoints.
  // Upper trails continue to use the unchanged index curve and translation.
  function lowerCurve(line, progress, time) {
    const angle = -Math.PI / 2 - progress * Math.PI;
    const envelope = Math.sin(Math.PI * progress);
    const orbit = time * .22 + line.orbitPhase + progress * Math.PI * 1.45;
    const drift = Math.sin(time * line.speed + line.phase) * 7 * envelope;
    const radiusX = width * (mobile() ? .43 : .30) + line.index * (mobile() ? 11 : 20);
    const radiusY = heroHeight * .53 + line.index * 16;
    return {
      x: width * 1.12 + Math.cos(angle) * radiusX + Math.cos(orbit) * 7 * envelope + drift,
      y: heroHeight * .77 + Math.sin(angle) * radiusY + Math.sin(orbit) * 10 * envelope,
      depth: Math.cos(orbit)
    };
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(-width * .20, -heroHeight * .28);
    const time = state.time;
    [...lines].sort((a,b) => pointOnCurve(a,.5,time).depth - pointOnCurve(b,.5,time).depth).forEach(line => {
      drawLine(line, time);
      if (!motion.matches) drawShine(line, time);
    });
    ctx.restore();
    const lowerTime = time + 3.6;
    [...lines].sort((a,b) => lowerCurve(a,.5,lowerTime).depth - lowerCurve(b,.5,lowerTime).depth).forEach(line => {
      drawLine(line, lowerTime, lowerCurve);
      if (!motion.matches) drawShine(line, lowerTime, lowerCurve);
    });
  }
  function render(now) {
    frame = 0;
    if (!visible || document.hidden || motion.matches) return;
    state.time += previous ? Math.min((now - previous) / 1000, .05) : 1/60;
    previous = now; draw(); frame = requestAnimationFrame(render);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    if (visible && !document.hidden) {
      draw(); if (!motion.matches) frame = requestAnimationFrame(render);
    }
  }
  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight; heroHeight = hero.offsetHeight;
    dpr = Math.min(devicePixelRatio || 1, mobile() ? 1.25 : 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.width = width * (mobile() ? .9 : .68);
    state.height = Math.min(heroHeight * .86, 900);
    sync();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => {visible = entries[0].isIntersecting; sync();}).observe(opening);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  resize();
})();
