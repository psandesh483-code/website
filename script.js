/* ────────────────────────────────────────────────
   Sandesh Pandey — premium minimal portfolio
   Lenis smooth scroll + GSAP ScrollTrigger
   ──────────────────────────────────────────────── */

document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;

window.addEventListener('load', init);

function init() {
  setupContactForm();

  if (typeof gsap === 'undefined') {
    document.querySelectorAll('.reveal-line > span, .reveal-text, .reveal-up, .reveal-line-block')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  setupSmoothScroll();
  setupHero();
  setupManifesto();
  setupReveals();
  setupExperienceHorizontal();
}

/* ─── Lenis smooth scroll ──────────────────────── */

function setupSmoothScroll() {
  if (prefersReducedMotion) return;
  if (typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.2,
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

/* ─── HERO entrance ────────────────────────────── */

function setupHero() {
  const tl = gsap.timeline({ delay: 0.25, defaults: { ease: 'expo.out' } });

  tl.to('.hero__title .reveal-line > span', {
    yPercent: 0,
    duration: 1.4,
    stagger: 0.1,
  });

  tl.to('.hero__sub .reveal-text', {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.1,
  }, '-=0.7');

  tl.from('.hero__meta', {
    opacity: 0,
    y: -10,
    duration: 0.8,
  }, '-=0.6');

  tl.from('.hero__scroll', {
    opacity: 0,
    y: 20,
    duration: 0.8,
  }, '-=0.4');

  if (!prefersReducedMotion) {
    gsap.to('.hero__title', {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to('.hero__sub', {
      yPercent: -30,
      opacity: 0.4,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
}

/* ─── MANIFESTO word reveal ────────────────────── */

function setupManifesto() {
  const heading = document.querySelector('[data-words]');
  if (!heading) return;

  const text = heading.textContent.trim();
  const words = text.split(/\s+/);
  heading.textContent = '';

  words.forEach((w) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = w;
    heading.appendChild(span);
    heading.appendChild(document.createTextNode(' '));
  });

  if (prefersReducedMotion) {
    heading.querySelectorAll('.word').forEach(w => w.classList.add('is-active'));
    return;
  }

  ScrollTrigger.create({
    trigger: heading,
    start: 'top 80%',
    end: 'bottom 35%',
    scrub: 0.8,
    onUpdate: (self) => {
      const total = words.length;
      const reached = Math.floor(self.progress * total);
      heading.querySelectorAll('.word').forEach((w, i) => {
        if (i < reached) w.classList.add('is-active');
        else w.classList.remove('is-active');
      });
    },
  });
}

/* ─── Generic scroll-triggered reveals ─────────── */

function setupReveals() {
  if (prefersReducedMotion) {
    gsap.set('.reveal-up, .reveal-line-block, .reveal-text', { opacity: 1, y: 0 });
    return;
  }

  // about: line blocks
  gsap.utils.toArray('.about__body .reveal-line-block').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // editorial portrait: clip-path mask reveal + slow drift
  const portrait = document.querySelector('[data-portrait]');
  if (portrait) {
    gsap.fromTo(portrait,
      { clipPath: 'inset(100% 0 0 0)' },
      {
        clipPath: 'inset(0% 0 0 0)',
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: portrait, start: 'top 82%' },
      }
    );

    gsap.to(portrait, {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    const portraitImg = portrait.querySelector('img');
    if (portraitImg) {
      gsap.to(portraitImg, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
  }

  // generic .reveal-up
  gsap.utils.toArray('.reveal-up').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // section eyebrows pop-up
  gsap.utils.toArray('section .eyebrow').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 14,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // section h2 fade-up
  gsap.utils.toArray('.exp__heading, .init__head h2, .skills__head h2').forEach((heading) => {
    gsap.from(heading, {
      opacity: 0,
      y: 30,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: heading, start: 'top 85%' },
    });
  });

  // finale title line-mask reveal
  gsap.to('.finale__title .reveal-line > span', {
    yPercent: 0,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.1,
    scrollTrigger: { trigger: '.finale__title', start: 'top 75%' },
  });

  // finale form, email, socials fade
  gsap.from('.finale__sub, .form, .finale__or, .finale__email, .socials', {
    opacity: 0,
    y: 20,
    duration: 0.9,
    ease: 'expo.out',
    stagger: 0.12,
    scrollTrigger: { trigger: '.form', start: 'top 92%' },
  });
}

/* ─── EXPERIENCE horizontal scroll ─────────────── */

function setupExperienceHorizontal() {
  if (prefersReducedMotion || isMobile) return;

  const pin = document.querySelector('[data-exp-pin]');
  const track = document.querySelector('[data-exp-track]');
  if (!pin || !track) return;

  const getDistance = () => track.scrollWidth - window.innerWidth;

  gsap.to(track, {
    x: () => -getDistance(),
    ease: 'none',
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${getDistance()}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
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
