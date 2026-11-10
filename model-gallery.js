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

    case "propulsion": {
      box(0, -0.77, -0.41, 0.67, 0.21, 1.77, dark, 0, 0.14);
      cylinder(0, -0.68, 0, 0.43, 0.16, slate);
      box(0, -0.65, -0.96, 0.35, 0.08, 0.19, mint, 0, 0.03);
      cylinder(0, -0.22, 0, 0.38, 0.48, slate);
      cylinder(0, -0.43, 0, 0.40, 0.08, dark);
      cylinder(0, 0.02, 0, 0.40, 0.09, copper);
      cylinder(0, 0.12, 0, 0.14, 0.16, ivory);

      const bladeOutline = [
        [0.14, -0.08], [0.21, 0.14], [0.64, 0.26], [1.17, 0.19],
        [1.53, 0.03], [1.56, -0.08], [1.41, -0.15], [0.78, -0.11],
      ];
      for (const side of [-1, 1]) {
        const blade = (height) => bladeOutline.map(([x, z]) => [
          side * x, height - 0.07 * x, side * z,
        ]);
        loft([blade(0.59), blade(0.68)], ivory);
      }
      cylinder(0, 0.62, 0, 0.23, 0.16, dark);
      cylinder(0, 0.73, 0, 0.11, 0.075, copper);
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
