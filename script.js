/* ────────────────────────────────────────────────
   Sandesh Pandey — editorial broadsheet
   Minimal, considered motion
   ──────────────────────────────────────────────── */

document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('load', init);

function init() {
  setupContactForm();

  if (typeof gsap === 'undefined') {
    document.querySelectorAll('.reveal-line > span, .reveal-fade').forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  setupSmoothScroll();
  setupCover();
  setupReveals();
  setupReel();
}

/* ─── Lenis smooth scroll ──────────────────────── */

function setupSmoothScroll() {
  if (prefersReducedMotion) return;
  if (typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.25,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -10, duration: 1.4 });
        }
      }
    });
  });
}

/* ─── COVER entrance ───────────────────────────── */

function setupCover() {
  const tl = gsap.timeline({ delay: 0.2, defaults: { ease: 'expo.out' } });

  tl.to('.cover__title .reveal-line > span', {
    yPercent: 0,
    duration: 1.3,
    stagger: 0.08,
  });

  tl.to('.cover__sub', {
    opacity: 1,
    y: 0,
    duration: 0.9,
  }, '-=0.7');
}

/* ─── REEL — sliced strip parallax ─────────────── */

function setupReel() {
  const portrait = document.querySelector('[data-reel-portrait]');
  if (!portrait) return;

  const strips = portrait.querySelectorAll('.reel__strip');
  if (!strips.length) return;

  if (prefersReducedMotion) return; // strips render in place; image is whole

  // Each strip parallaxes vertically with its own speed/direction.
  // Result: the image is whole only at one scroll moment; before/after,
  // strips drift apart at slightly different speeds.
  strips.forEach((strip, i) => {
    const direction = i % 2 === 0 ? -1 : 1;
    const intensity = 14 + Math.abs(i - 2.5) * 5; // 14 → 26.5%
    const offset = direction * intensity;

    gsap.fromTo(strip,
      { yPercent: offset },
      {
        yPercent: -offset,
        ease: 'none',
        scrollTrigger: {
          trigger: '.reel',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      }
    );
  });

  // The whole portrait gently inhales — slight scale shift across the section.
  gsap.fromTo(portrait,
    { scale: 0.94 },
    {
      scale: 1.05,
      ease: 'none',
      scrollTrigger: {
        trigger: '.reel',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
    }
  );

  // Stage labels (N° 01, Kathmandu) drift opposite directions on scroll.
  const stage = document.querySelector('[data-reel-stage]');
  if (stage) {
    const num = stage.querySelector('.reel__num');
    const date = stage.querySelector('.reel__date');

    if (num) {
      gsap.fromTo(num,
        { yPercent: 25, opacity: 0 },
        {
          yPercent: -25,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.reel',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        }
      );
    }

    if (date) {
      gsap.fromTo(date,
        { yPercent: -25, opacity: 0 },
        {
          yPercent: 25,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.reel',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        }
      );
    }
  }
}

/* ─── REVEALS — soft, editorial ─────────────────── */

function setupReveals() {
  if (prefersReducedMotion) {
    gsap.set('.reveal-fade', { opacity: 1, y: 0 });
    return;
  }

  // batch reveal-fade elements (excluding cover ones already handled)
  gsap.utils.toArray('.reveal-fade').forEach((el) => {
    if (el.closest('.cover')) return; // skip — handled in setupCover
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });
}

/* ─── CONTACT FORM (Netlify Forms via AJAX) ────── */

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
      if (submitText) submitText.textContent = 'Sending...';
    }

    form.classList.remove('is-error');

    const formData = new FormData(form);

    try {
      const response = await fetch('/', {
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

/* ─── refresh on resize ────────────────────────── */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }, 200);
});
