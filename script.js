/* ════════════════════════════════════════════════
   Sandesh Pandey — Liquid Glass portfolio
   Interactions: smooth scroll · reveals · tilt ·
   cursor glow · nav · form
   ════════════════════════════════════════════════ */

document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;

window.addEventListener('load', init);

function init() {
  setupNav();
  setupContactForm();

  // If GSAP failed to load, just show everything.
  if (typeof gsap === 'undefined') {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  setupSmoothScroll();
  setupReveals();
  setupTilt();
  setupCursorGlow();
}

/* ─── Lenis smooth scroll ──────────────────────── */
function setupSmoothScroll() {
  if (!reduceMotion && typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;

      // "#top" (nav brand + back-to-top) points at the fixed header, which
      // Lenis can't resolve a scroll position for — send it to the very top.
      if (id === '#top') {
        e.preventDefault();
        if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
        else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }

      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        if (window.__lenis) window.__lenis.scrollTo(target, { offset: -8, duration: 1.2 });
        else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  });
}

/* ─── Reveals ──────────────────────────────────── */
function setupReveals() {
  if (reduceMotion) {
    gsap.set('[data-reveal]', { opacity: 1, y: 0 });
    return;
  }

  // Group elements by their nearest section so siblings stagger together.
  const items = gsap.utils.toArray('[data-reveal]');
  items.forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // Hero items: orchestrate a staggered entrance on load instead of waiting.
  const heroItems = gsap.utils.toArray('.hero [data-reveal]');
  if (heroItems.length) {
    gsap.killTweensOf(heroItems);
    gsap.set(heroItems, { opacity: 0, y: 28 });
    gsap.to(heroItems, {
      opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.15,
    });
  }
}

/* ─── 3D tilt on glass cards ───────────────────── */
function setupTilt() {
  if (reduceMotion || isTouch) return;
  const MAX = 6; // degrees

  document.querySelectorAll('[data-tilt]').forEach((el) => {
    let raf = null;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform =
          `perspective(900px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) translateZ(0)`;
      });
    });
    el.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  });
}

/* ─── Cursor glow ──────────────────────────────── */
function setupCursorGlow() {
  if (reduceMotion || isTouch) return;
  const glow = document.querySelector('.cursor-glow');
  if (!glow) return;

  let visible = false;
  window.addEventListener('mousemove', (e) => {
    if (!visible) { glow.style.opacity = '1'; visible = true; }
    gsap.to(glow, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power2.out' });
  });
  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; visible = false; });
}

/* ─── Mobile nav drawer ────────────────────────── */
function setupNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const drawer = document.querySelector('[data-nav-drawer]');
  if (!toggle || !drawer) return;

  const close = () => {
    drawer.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
}

/* ─── Contact form (Netlify Forms via AJAX) ────── */
function setupContactForm() {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.form__submit');
    const submitText = form.querySelector('.form__submit-text');
    const originalText = submitText ? submitText.textContent : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Sending…';
    }
    form.classList.remove('is-error');

    try {
      const formData = new FormData(form);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      });
      if (!response.ok) throw new Error('Network error');
      form.classList.add('is-sent');
    } catch (err) {
      console.error('Form submission failed:', err);
      form.classList.add('is-error');
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = originalText;
    }
  });
}

/* ─── Refresh ScrollTrigger on resize ──────────── */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }, 200);
});
