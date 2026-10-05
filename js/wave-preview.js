(() => {
  'use strict';
  const canvas = document.getElementById('smokeWave');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  // Continuous surfaces share a traveling displacement, keeping their folds
  // coherent. All geometry is drawn directly at the display's pixel density.
  const sheets = [
    { base: .665, amplitude: .036, spread: .136, phase: 1.55, frequency: 1.78, rows: 42, light: .63 },
    { base: .704, amplitude: .048, spread: .170, phase: 3.95, frequency: 1.43, rows: 48, light: .76 },
    { base: .777, amplitude: .070, spread: .226, phase: .40, frequency: 1.18, rows: 65, light: 1 },
    { base: .870, amplitude: .082, spread: .243, phase: 3.48, frequency: 1.06, rows: 62, light: .84 },
    { base: 1.006, amplitude: .082, spread: .192, phase: 5.80, frequency: 1.23, rows: 54, light: .70 }
  ];
  const tau = Math.PI * 2;
  let width = 0, height = 0, frame = 0, last = 0, elapsed = 0;
  let count = 0, points = [], wash, edgeLight, shade;
  let previousTime = 0;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    count = Math.ceil(width / 4) + 2;
    points = Array.from({ length: 67 }, () => new Float32Array(count + 1));
    wash = ctx.createLinearGradient(0, height * .54, 0, height * 1.15);
    wash.addColorStop(0, 'rgba(255,42,12,.065)');
    wash.addColorStop(.26, 'rgba(255,43,15,.20)');
    wash.addColorStop(.65, 'rgba(170,20,12,.15)');
    wash.addColorStop(1, 'rgba(30,2,3,.015)');
    edgeLight = ctx.createLinearGradient(0, 0, width, 0);
    edgeLight.addColorStop(0, '#ff6240');
    edgeLight.addColorStop(.22, '#ff4a24');
    edgeLight.addColorStop(.49, '#ffc0a4');
    edgeLight.addColorStop(.62, '#ff8053');
    edgeLight.addColorStop(1, '#ff4f2b');
    shade = ctx.createLinearGradient(0, height * .87, 0, height);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,.28)');
  }

  function sampleSheet(sheet, time) {
    for (let row = 0; row <= sheet.rows; row++) {
      const v = row / sheet.rows;
      const spread = Math.pow(v, 1.05) * sheet.spread;
      const amplitude = sheet.amplitude * (1 - v * .21);
      for (let col = 0; col <= count; col++) {
        const x = col / count;
        const flow = x - time * .038;
        const broad = tau * flow * sheet.frequency + sheet.phase + v * 1.75;
        const fold = tau * flow * (sheet.frequency * 1.83) + sheet.phase * .63 - v * .78;
        const ripple = tau * flow * (sheet.frequency * 3.18) + sheet.phase * 1.17 + v * 1.20;
        points[row][col] = height * (sheet.base + spread
          + Math.sin(broad) * amplitude
          + Math.sin(fold) * amplitude * .31
          + Math.sin(ripple) * amplitude * .075);
      }
    }
  }

  function rowPath(row) {
    ctx.beginPath();
    ctx.moveTo(-2, points[row][0]);
    for (let col = 1; col <= count; col++) {
      ctx.lineTo(col / count * (width + 4) - 2, points[row][col]);
    }
  }

  function drawSheet(sheet, time) {
    sampleSheet(sheet, time);
    // The transparent membrane gives the fine contour ribs volume.
    rowPath(0);
    for (let col = count; col >= 0; col--) {
      ctx.lineTo(col / count * (width + 4) - 2, points[sheet.rows][col]);
    }
    ctx.closePath();
    ctx.fillStyle = wash;
    ctx.globalAlpha = sheet.light;
    ctx.fill();

    // Restrict bloom to the crest; keep the contour geometry crisp.
    ctx.save();
    rowPath(0);
    ctx.strokeStyle = '#ff3014';
    ctx.globalAlpha = .46 * sheet.light;
    ctx.lineWidth = Math.max(3, height * .009);
    ctx.shadowColor = '#ff3014';
    ctx.shadowBlur = Math.min(32, height * .035);
    ctx.stroke();
    ctx.globalAlpha = .21 * sheet.light;
    ctx.lineWidth = Math.max(7, height * .015);
    ctx.shadowBlur = Math.min(55, height * .06);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = edgeLight;
    for (let row = sheet.rows; row >= 0; row--) {
      const v = row / sheet.rows;
      const crest = Math.exp(-v * 8.5);
      const ribs = Math.pow(1 - v, .80) * .36;
      ctx.globalAlpha = (crest * .58 + ribs) * sheet.light;
      ctx.lineWidth = row < 3 ? 1.15 : .75;
      rowPath(row);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(now) {
    frame = requestAnimationFrame(draw);
    if (now - last < 1000 / 45) return;
    const delta = previousTime ? Math.min((now - previousTime) / 1000, .1) : 0;
    elapsed += delta;
    previousTime = now;
    last = now;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    sheets.forEach(sheet => drawSheet(sheet, elapsed));
    ctx.fillStyle = shade;
    ctx.fillRect(0, height * .87, width, height * .13);
  }

  resize();
  frame = requestAnimationFrame(draw);
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    previousTime = 0;
    if (!document.hidden) frame = requestAnimationFrame(draw);
  });
})();
