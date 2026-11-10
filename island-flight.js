(() => {
  const stage = document.querySelector(".island-stage");
  const canvas = stage.querySelector(".island-aircraft");
  const context = canvas.getContext("2d");
  if (!context) return;

  const path = stage.querySelector("#island-flight-path");
  const trail = stage.querySelector(".island-flight-trail");
  const replay = document.querySelector(".flight-replay");
  const length = path.getTotalLength();
  const mesh = createAircraftMesh("cargo");
  const duration = 4600;
  let elapsed = 0;
  let previousTime = 0;
  let frame = 0;
  let visible = !("IntersectionObserver" in window);

  trail.setAttribute("d", path.getAttribute("d"));
  canvas.hidden = false;

  function draw(progress) {
    const eased = progress * progress * (3 - 2 * progress);
    const { x, y } = path.getPointAtLength(length * eased);
    const airborne = Math.sin(progress * Math.PI);
    const scale = 29 + airborne * 10;
    const yaw = 0.72 + airborne * 0.68;
    const pitch = 0.48 + airborne * 0.12;
    const project = createAircraftProjection(x, y - 17 - airborne * 13, scale, yaw, pitch);

    context.clearRect(0, 0, 720, 425);
    context.fillStyle = `rgb(91 229 254 / ${0.12 + airborne * 0.11})`;
    context.beginPath();
    context.ellipse(x, y + 19, 22 + airborne * 7, 7, 0, 0, 2 * Math.PI);
    context.fill();

    if (airborne > 0.02) {
      context.strokeStyle = `rgb(158 236 255 / ${airborne * 0.32})`;
      context.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
          const [rotorX, rotorY] = project([side * 1.39, 0.42, end * 0.91]);
          context.beginPath();
          context.ellipse(rotorX, rotorY, scale * 0.49, scale * 0.22, 0, 0, Math.PI * 2);
          context.stroke();
        }
      }
    }

    drawAircraftMesh(context, mesh, project);
    trail.style.strokeDashoffset = String(1 - eased);
  }

  function motionReduced() {
    return document.documentElement.classList.contains("motion-off");
  }

  function fit() {
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(stage.clientWidth * density);
    canvas.height = Math.round(stage.clientHeight * density);
    context.setTransform(canvas.width / 720, 0, 0, canvas.height / 425, 0, 0);
    draw(motionReduced() ? 0.52 : elapsed / duration);
  }

  function advance(time) {
    if (previousTime) elapsed = Math.min(duration, elapsed + time - previousTime);
    previousTime = time;
    draw(elapsed / duration);
    frame = elapsed < duration ? requestAnimationFrame(advance) : 0;
  }

  function syncMotion() {
    const reduced = motionReduced();
    replay.hidden = reduced;
    const playing = visible && !document.hidden && !reduced && elapsed < duration;
    if (playing && !frame) frame = requestAnimationFrame(advance);
    if (!playing && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
    if (reduced) draw(0.52);
    else if (!playing) draw(elapsed / duration);
  }

  replay.addEventListener("click", () => {
    elapsed = 0;
    previousTime = 0;
    draw(0);
    syncMotion();
  });
  document.addEventListener("visibilitychange", syncMotion);
  document.addEventListener("akron-motion-change", syncMotion);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.4;
      syncMotion();
    }, { threshold: 0.4 }).observe(stage);
  }
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(stage);
  else window.addEventListener("resize", fit);
  fit();
  syncMotion();
})();