function createMeshBuilder() {
  const faces = [];

  function addFace(points, color) {
    const [a, b, c] = points;
    const u = b.map((value, axis) => value - a[axis]);
    const v = c.map((value, axis) => value - a[axis]);
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const length = Math.hypot(...normal) || 1;
    const light = (normal[0] * -0.38 + normal[1] * 0.8 + normal[2] * 0.44) / length;
    const channels = color.map((value) => Math.min(255, Math.round(value * (0.75 + 0.32 * light))));
    faces.push({ points, fill: `rgb(${channels.join(",")})` });
  }

  function loft(rings, color) {
    const first = rings[0];
    const last = rings[rings.length - 1];
    addFace([...first].reverse(), color);
    addFace(last, color);
    for (let level = 1; level < rings.length; level++) {
      for (let side = 0; side < first.length; side++) {
        const next = (side + 1) % first.length;
        addFace([rings[level - 1][side], rings[level - 1][next], rings[level][next], rings[level][side]], color);
      }
    }
  }

  function box(x, y, z, w, h, d, color, angle = 0, bevel = 0) {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const ring = (level, halfWidth, halfDepth, corner) => {
      const outline = corner
        ? [[-halfWidth, -halfDepth + corner], [-halfWidth, halfDepth - corner],
           [-halfWidth + corner, halfDepth], [halfWidth - corner, halfDepth],
           [halfWidth, halfDepth - corner], [halfWidth, -halfDepth + corner],
           [halfWidth - corner, -halfDepth], [-halfWidth + corner, -halfDepth]]
        : [[-halfWidth, -halfDepth], [-halfWidth, halfDepth], [halfWidth, halfDepth], [halfWidth, -halfDepth]];
      return outline.map(([a, b]) => [x + a * cosine - b * sine, y + level, z + a * sine + b * cosine]);
    };
    const rings = bevel
      ? [ring(-h / 2, w / 2, d / 2, bevel), ring(h / 2 - bevel / 2, w / 2, d / 2, bevel),
         ring(h / 2, w / 2 - bevel / 2, d / 2 - bevel / 2, bevel / 2)]
      : [ring(-h / 2, w / 2, d / 2, 0), ring(h / 2, w / 2, d / 2, 0)];
    loft(rings, color);
  }

  function cylinder(x, y, z, radius, h, color) {
    const ring = (level) => Array.from({ length: 12 }, (_, index) => {
      const angle = index * Math.PI / 6;
      return [x + radius * Math.cos(angle), y + level, z - radius * Math.sin(angle)];
    });
    loft([ring(-h / 2), ring(h / 2)], color);
  }

  return { faces, box, cylinder, loft };
}

function createAircraftMesh(loadout) {
  const paint = {
    shell: [182, 212, 226],
    carbon: [45, 66, 81],
    motor: [75, 109, 127],
    light: [116, 239, 255],
    cargo: [71, 105, 123],
    amber: [252, 189, 111],
    medical: [189, 222, 229],
    cross: [225, 78, 86],
  };
  const { faces, box, cylinder } = createMeshBuilder();

  box(0, 0.13, 0, 1.18, 0.4, 1.62, paint.shell, 0, 0.19);
  box(0, 0.39, -0.11, 0.68, 0.14, 0.85, paint.motor, 0, 0.1);
  box(0, -0.13, 0, 0.83, 0.18, 1.21, paint.carbon, 0, 0.11);
  box(0, 0.09, 0.815, 0.58, 0.07, 0.04, paint.carbon);
  box(0, 0.09, 0.839, 0.35, 0.027, 0.017, paint.light);
  for (const side of [-1, 1]) {
    box(side * 0.46, -0.56, 0, 0.1, 0.78, 0.1, paint.carbon);
    box(side * 0.59, -0.96, 0, 0.105, 0.085, 1.32, paint.motor);
    box(side * 0.525, -0.86, 0.39, 0.21, 0.11, 0.09, paint.motor);
    box(side * 0.525, -0.86, -0.39, 0.21, 0.11, 0.09, paint.motor);
    for (const end of [-1, 1]) {
      const x = side * 1.39;
      const z = end * 0.91;
      const dx = x - side * 0.37;
      const dz = z - end * 0.27;
      box(side * 0.37 + dx / 2, 0.12, end * 0.27 + dz / 2, Math.hypot(dx, dz), 0.12, 0.16, paint.carbon, Math.atan2(dz, dx));
      cylinder(x, 0.23, z, 0.18, 0.21, paint.motor);
      cylinder(x, 0.35, z, 0.185, 0.025, end === 1 ? paint.light : paint.amber);
      box(x, 0.405, z, 0.94, 0.039, 0.085, paint.carbon, side * end * 0.52);
      cylinder(x, 0.442, z, 0.085, 0.06, paint.shell);
    }
  }
  const medical = loadout === "medical";
  box(0, -0.51, 0.035, 0.85, 0.64, 1.04, medical ? paint.medical : paint.cargo, 0, 0.10);
  box(0, -0.34, 0.035, 0.867, 0.038, 1.057, paint.carbon);
  for (const side of [-1, 1]) {
    box(side * 0.27, -0.35, 0.575, 0.094, 0.12, 0.04, medical ? paint.motor : paint.amber);
    box(side * 0.425, -0.62, 0.035, 0.038, 0.09, 0.81, paint.motor);
  }
  if (medical) {
    box(0, -0.56, 0.567, 0.25, 0.063, 0.018, paint.cross);
    box(0, -0.56, 0.572, 0.063, 0.22, 0.018, paint.cross);
  } else {
    box(0, -0.57, 0.567, 0.29, 0.085, 0.018, paint.amber);
  }
  return faces;
}

function createAircraftProjection(x, yCenter, scale, yaw, pitch) {
  const cosine = Math.cos(yaw);
  const sine = Math.sin(yaw);
  const tilt = Math.cos(pitch);
  const lift = Math.sin(pitch);

  return function project([modelX, y, z]) {
    const side = modelX * cosine + z * sine;
    const depth = z * cosine - modelX * sine;
    return [
      x + side * scale,
      yCenter - (y * tilt - depth * lift) * scale,
      depth * tilt + y * lift,
    ];
  };
}

function drawAircraftMesh(context, faces, project) {
  const projected = faces.map(({ points, fill }) => {
    const polygon = points.map(project);
    const depth = polygon.reduce((total, point) => total + point[2], 0) / polygon.length;
    return { polygon, depth, fill };
  });
  projected.sort((a, b) => a.depth - b.depth);
  context.lineWidth = 0.7;
  context.strokeStyle = "#04132094";
  for (const { polygon, fill } of projected) {
    context.beginPath();
    context.moveTo(polygon[0][0], polygon[0][1]);
    for (const [x, y] of polygon.slice(1)) context.lineTo(x, y);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.stroke();
  }
}

(() => {
  const stage = document.querySelector(".aircraft-stage");
  const canvas = stage.querySelector("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  const controls = stage.querySelector(".aircraft-controls");
  const selector = document.querySelector(".loadout-selector");
  const choices = [...selector.querySelectorAll("button")];
  const panels = [...document.querySelectorAll("[data-loadout-copy]")];
  const startYaw = -0.58;
  const startPitch = 0.53;

  let faces = [];
  let width = 0;
  let height = 0;
  let yaw = startYaw;
  let pitch = startPitch;
  let visible = false;
  let manual = false;
  let frame = 0;
  let previousTime = 0;
  let drag;

  function draw() {
    if (!width || !height) return;
    const scale = Math.min(width / 4.85, height / 3.8);
    const project = createAircraftProjection(width / 2, height * 0.46, scale, yaw, pitch);

    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.strokeStyle = "#61c7ed24";
    context.beginPath();
    for (let line = -5; line <= 5; line++) {
      const coordinate = line * 0.42;
      for (const endpoints of [
        [[-2.1, -1.07, coordinate], [2.1, -1.07, coordinate]],
        [[coordinate, -1.07, -2.1], [coordinate, -1.07, 2.1]],
      ]) {
        const [a, b] = endpoints.map(project);
        context.moveTo(a[0], a[1]);
        context.lineTo(b[0], b[1]);
      }
    }
    context.stroke();

    drawAircraftMesh(context, faces, project);
  }

  function fit() {
    const bounds = stage.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    draw();
  }

  function rotate(time) {
    const elapsed = previousTime ? Math.min(time - previousTime, 32) : 0;
    previousTime = time;
    yaw += elapsed * 0.00034;
    draw();
    frame = requestAnimationFrame(rotate);
  }

  function syncAnimation() {
    const play = visible && !manual && !document.hidden && !document.documentElement.classList.contains("motion-off");
    if (play && !frame) frame = requestAnimationFrame(rotate);
    if (!play && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
  }

  function setLoadout(loadout) {
    for (const choice of choices) choice.setAttribute("aria-pressed", String(choice.dataset.loadout === loadout));
    for (const panel of panels) panel.hidden = panel.dataset.loadoutCopy !== loadout;
    stage.dataset.configuration = loadout;
    faces = createAircraftMesh(loadout);
    draw();
  }

  for (const choice of choices) choice.addEventListener("click", () => setLoadout(choice.dataset.loadout));
  for (const link of document.querySelectorAll("[data-loadout-link]")) {
    link.addEventListener("click", () => setLoadout(link.dataset.loadoutLink));
  }
  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-turn]");
    if (!button) return;
    const direction = Number(button.dataset.turn);
    manual = true;
    syncAnimation();
    if (direction === 0) {
      yaw = startYaw;
      pitch = startPitch;
    } else {
      yaw += direction * Math.PI / 6;
    }
    draw();
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    manual = true;
    syncAnimation();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    yaw += (event.clientX - drag.x) * 0.014;
    pitch = Math.max(0.12, Math.min(1.22, pitch + (event.clientY - drag.y) * 0.012));
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    draw();
  });
  canvas.addEventListener("lostpointercapture", () => { drag = undefined; });
  document.addEventListener("visibilitychange", syncAnimation);
  document.addEventListener("akron-motion-change", syncAnimation);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    }).observe(stage);
  }

  stage.classList.add("has-model");
  canvas.hidden = false;
  controls.hidden = false;
  selector.hidden = false;
  stage.querySelector(".aircraft-fallback").hidden = true;
  setLoadout("cargo");
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(stage);
  else window.addEventListener("resize", fit);
  fit();
})();