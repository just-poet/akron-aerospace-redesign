function createLogisticsMesh(model) {
  const { faces, box, cylinder, loft } = createMeshBuilder();
  const ivory = [213, 224, 219];
  const slate = [65, 103, 116];
  const dark = [37, 59, 73];
  const copper = [246, 179, 118];
  const mint = [120, 243, 223];

  switch (model) {
    case "pod":
      box(0, -0.14, 0, 2.25, 0.94, 1.48, ivory, 0, 0.17);
      box(0, 0.37, 0, 2.29, 0.27, 1.52, slate, 0, 0.15);
      box(0, 0.22, 0, 2.27, 0.07, 1.50, dark);
      box(0, 0.54, 0, 0.69, 0.10, 0.13, dark, 0, 0.04);
      box(0, -0.19, 0.75, 0.45, 0.36, 0.04, slate, 0, 0.07);
      box(0, -0.19, 0.78, 0.27, 0.057, 0.025, mint);
      box(0, -0.19, 0.78, 0.057, 0.24, 0.026, mint);
      for (const side of [-1, 1]) {
        box(side * 0.74, 0.18, 0.76, 0.17, 0.24, 0.09, copper, 0, 0.04);
        box(side * 0.72, -0.65, 0, 0.26, 0.12, 1.22, dark);
      }
      break;

    case "dock": {
      box(0, -0.36, 0, 2.85, 0.41, 2.6, dark, 0, 0.29);
      box(0, -0.05, 0, 2.72, 0.22, 2.47, slate, 0, 0.28);
      cylinder(0, 0.08, 0, 0.90, 0.06, copper);
      cylinder(0, 0.13, 0, 0.78, 0.06, dark);
      const marking = [
        [-.34, -.35], [-.34, .35], [-.22, .35], [-.22, .06],
        [.22, .06], [.22, .35], [.34, .35], [.34, -.35],
        [.22, -.35], [.22, -.06], [-.22, -.06], [-.22, -.35],
      ];
      const markingRing = (height) => marking.map(([x, z]) => [x, height, z]);
      loft([markingRing(0.16), markingRing(0.17)], ivory);
      for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
          cylinder(side * 1.08, 0.10, end * 0.92, 0.10, 0.11, mint);
          box(side * 0.92, -0.65, end * 0.80, 0.35, 0.20, 0.34, slate);
        }
      }
      break;
    }

    case "relay": {
      box(0, -0.82, 0, 1.58, 0.24, 1.30, slate, 0, 0.14);
      box(0, -0.53, 0, 0.88, 0.41, 0.75, ivory, 0, 0.10);
      box(0, -0.50, 0.385, 0.43, 0.12, 0.031, dark);
      box(0, -0.50, 0.407, 0.21, 0.041, 0.024, mint);
      cylinder(0, 0.02, 0, 0.115, 0.86, slate);
      box(0, 0.44, 0.12, 0.23, 0.25, 0.42, dark);
      const dish = (radius, depth) => Array.from({ length: 20 }, (_, index) => {
        const angle = index * Math.PI / 10;
        const vertical = Math.sin(angle) * radius;
        return [Math.cos(angle) * radius, 0.51 + vertical * 0.87 + depth * 0.49,
          0.13 - vertical * 0.49 + depth * 0.87];
      });
      loft([dish(0.16, 0.02), dish(0.53, 0.20), dish(0.61, 0.34)], ivory);
      loft([dish(0.61, 0.34), dish(0.54, 0.34), dish(0.22, 0.23)], slate);
      loft([dish(0.044, 0.24), dish(0.044, 0.58)], copper);
      loft([dish(0.10, 0.56), dish(0.10, 0.62)], mint);
      break;
    }
  }

  return faces;
}

for (const card of document.querySelectorAll("[data-model]")) {
  const stage = card.querySelector(".model-stage");
  const canvas = stage.querySelector("canvas");
  const context = canvas.getContext("2d");
  if (!context) continue;

  const controls = stage.querySelector(".model-controls");
  const faces = createLogisticsMesh(card.dataset.model);
  let yaw = -0.61;
  let pitch = 0.53;
  let drag;

  function draw() {
    const { clientWidth: width, clientHeight: height } = stage;
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width / 4, height / 3.7);
    const project = createAircraftProjection(width / 2, height * 0.51, scale, yaw, pitch);
    drawAircraftMesh(context, faces, project);
  }

  function fit() {
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(stage.clientWidth * density);
    canvas.height = Math.round(stage.clientHeight * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    draw();
  }

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rotation]");
    if (!button) return;
    yaw += Number(button.dataset.rotation) * Math.PI / 5;
    draw();
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    yaw = drag.yaw + (event.clientX - drag.x) * 0.012;
    pitch = Math.max(-0.45, Math.min(1.1, drag.pitch + (event.clientY - drag.y) * 0.01));
    draw();
  });

  canvas.addEventListener("lostpointercapture", () => { drag = undefined; });
  canvas.hidden = false;
  controls.hidden = false;
  new ResizeObserver(fit).observe(stage);
  fit();
}
