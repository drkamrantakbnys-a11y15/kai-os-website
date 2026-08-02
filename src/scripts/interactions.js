const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const REVEAL_SELECTOR = [
  ".reveal",
  ".section-center",
  ".content-card",
  ".article-card",
  ".feature-card",
  ".stat-card",
  ".timeline-item",
  ".about-card",
  ".agent-card",
  ".research-card",
  ".founder-panel",
].join(", ");

function setupReveal() {
  const targets = document.querySelectorAll(REVEAL_SELECTOR);
  if (!targets.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

function animateCounter(el) {
  const raw = el.textContent.trim();
  const match = raw.match(/^(\d+)(.*)$/);
  if (!match) return;

  const target = parseInt(match[1], 10);
  const suffix = match[2];
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function setupCounters() {
  const counters = document.querySelectorAll(".stat-number");
  if (!counters.length || prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((el) => observer.observe(el));
}

function setupHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  let ticking = false;
  function update() {
    header.classList.toggle("scrolled", window.scrollY > 24);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
}

setupReveal();
setupCounters();
setupHeaderScroll();
