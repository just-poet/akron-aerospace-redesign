(() => {
 const map = document.querySelector(".uk-map");
 const reduced = matchMedia("(prefers-reduced-motion: reduce)");
 let started = false;
 function sync() {
  if (!started) {
   map.querySelectorAll("animateMotion").forEach(animation => animation.beginElement());
   started = true;
  }
  const playing = !reduced.matches && !document.hidden;
  map.classList.add("running");
  if (playing) map.unpauseAnimations();
  else map.pauseAnimations();
 }
 reduced.addEventListener("change", sync);
 document.addEventListener("visibilitychange", sync);
 sync();
})();