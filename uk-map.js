(() => {
  const map = document.querySelector(".uk-map");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  function sync() {
    if (reduced.matches || document.hidden) map.pauseAnimations();
    else map.unpauseAnimations();
  }

  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();

  // Let SVG motion place the drones on their routes before revealing them.
  requestAnimationFrame(() => requestAnimationFrame(() => map.classList.add("running")));
})();
