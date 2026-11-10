const toggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");
const mobile = matchMedia("(max-width: 780px)");

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("is-open", open);
}

toggle.addEventListener("click", () => {
  setMenu(toggle.getAttribute("aria-expanded") !== "true");
});

navigation.addEventListener("click", (event) => {
  if (!mobile.matches || !event.target.closest("a")) return;
  setMenu(false);
  const section = document.querySelector(event.target.closest("a").hash);
  if (section) {
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
  setMenu(false);
  toggle.focus();
});

mobile.addEventListener("change", () => setMenu(false));
document.documentElement.classList.add("enhanced");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const flight = document.querySelector(".route svg");
const flightMotion = flight.querySelector("animateMotion");
let flightVisible = false;
let flightStarted = false;

function updateFlight() {
  const playing = !reduceMotion.matches && flightVisible && !document.hidden;
  if (playing && !flightStarted && typeof flightMotion.beginElement === "function") {
    flightMotion.beginElement();
    flightStarted = true;
  }
  flight.classList.toggle("is-playing", playing && flightStarted);
  if (playing) flight.unpauseAnimations?.();
  else flight.pauseAnimations?.();
}

function updateMotion() {
  document.documentElement.classList.toggle("motion-off", reduceMotion.matches);
  document.dispatchEvent(new Event("akron-motion-change"));
  updateFlight();
}

reduceMotion.addEventListener("change", updateMotion);
document.addEventListener("visibilitychange", updateFlight);

if ("IntersectionObserver" in window) {
  const flightObserver = new IntersectionObserver(([entry]) => {
    flightVisible = entry.isIntersecting;
    updateFlight();
  });
  flightObserver.observe(flight);

  const entranceObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reduceMotion.matches) entry.target.classList.add("entered");
      entranceObserver.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll(".section-intro, .photo-card, .payload, .application-grid, .contact-banner")
    .forEach((element) => entranceObserver.observe(element));
}

updateMotion();
document.documentElement.classList.add("motion-ready");