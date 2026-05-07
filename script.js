/* ────────────────────────────────────────────────
   Sandesh Pandey — cinematic portfolio
   Lenis smooth scroll + GSAP ScrollTrigger
   ──────────────────────────────────────────────── */

document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// Wait for DOM + libs
window.addEventListener('load', init);

function init() {
  if (typeof gsap === 'undefined') {
    console.warn('GSAP not loaded; falling back to static layout.');
    document.querySelectorAll('.reveal-line > span, .reveal-text, .reveal-up, .reveal-line-block')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    hideLoader();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  setupSmoothScroll();
  runLoader();
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
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links
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

/* ─── loader ───────────────────────────────────── */

function runLoader() {
  const loader = document.getElementById('loader');
  const counter = loader.querySelector('[data-count]');

  if (prefersReducedMotion) { hideLoader(); return; }

  const tl = gsap.timeline({ onComplete: hideLoader });

  // count 00 → 99
  const obj = { val: 0 };
  tl.to(obj, {
    val: 99,
    duration: 1.4,
    ease: 'power2.inOut',
    onUpdate: () => { counter.textContent = String(Math.floor(obj.val)).padStart(2, '0'); }
  });

  tl.to(loader, {
    yPercent: -100,
    duration: 1.0,
    ease: 'expo.inOut',
  });
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

/* ─── 01 · HERO entrance ───────────────────────── */

function setupHero() {
  const tl = gsap.timeline({ delay: 1.6, defaults: { ease: 'expo.out' } });

  // line-mask reveal on hero title
  tl.to('.hero__title .reveal-line > span', {
    yPercent: 0,
    duration: 1.4,
    stagger: 0.12,
  });

  // subtitle lines fade up
  tl.to('.hero__sub .reveal-text', {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.12,
  }, '-=0.7');

  // meta + scroll cue fade
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

  // hero parallax on scroll
  if (!prefersReducedMotion) {
    gsap.to('.hero__title', {
      yPercent: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to('.hero__sub', {
      yPercent: -40,
      opacity: 0.3,
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

/* ─── 02 · MANIFESTO word reveal ───────────────── */

function setupManifesto() {
  const heading = document.querySelector('[data-words]');
  if (!heading) return;

  // split into words while preserving punctuation
  const text = heading.textContent.trim();
  const words = text.split(/\s+/);
  heading.textContent = '';

  const accentWords = new Set(['brand,', 'content,', 'culture']);

  words.forEach((w) => {
    const span = document.createElement('span');
    span.className = 'word';
    if (accentWords.has(w.toLowerCase())) span.dataset.accent = 'true';
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
    end: 'bottom 30%',
    scrub: 0.6,
    onUpdate: (self) => {
      const total = words.length;
      const reached = Math.floor(self.progress * total);
      heading.querySelectorAll('.word').forEach((w, i) => {
        if (i < reached) {
          w.classList.add('is-active');
          if (w.dataset.accent === 'true') w.classList.add('is-accent');
        } else {
          w.classList.remove('is-active', 'is-accent');
        }
      });
    },
  });
}

/* ─── 03 / 05 / 06 · scroll-triggered reveals ──── */

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
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
      },
    });
  });

  // about big number parallax (kept for safety if reused later)
  if (document.querySelector('.about__bignum')) {
    gsap.to('.about__bignum', {
      yPercent: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // editorial portrait: clip-path mask reveal + slow parallax
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
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    // image inside drifts slightly faster — subtle dolly effect
    const portraitImg = portrait.querySelector('img');
    if (portraitImg) {
      gsap.to(portraitImg, {
        yPercent: -10,
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

  // generic .reveal-up — staggered groups inside parent
  gsap.utils.toArray('.reveal-up').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
      },
    });
  });

  // section eyebrows pop-up
  gsap.utils.toArray('section .eyebrow').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // section h2 letters via line-by-line
  gsap.utils.toArray('.exp__heading, .init__head h2, .skills__head h2').forEach((heading) => {
    gsap.from(heading, {
      opacity: 0,
      y: 40,
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
    stagger: 0.12,
    scrollTrigger: {
      trigger: '.finale__title',
      start: 'top 75%',
    },
  });

  // finale email + sub fade
  gsap.from('.finale__sub, .finale__email, .finale__socials', {
    opacity: 0,
    y: 30,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.15,
    scrollTrigger: { trigger: '.finale__email', start: 'top 90%' },
  });
}

/* ─── 04 · EXPERIENCE horizontal scroll ────────── */

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

  // each card scales/fades as it crosses center
  gsap.utils.toArray('.exp__card').forEach((card) => {
    gsap.fromTo(card,
      { opacity: 0.4, scale: 0.94 },
      {
        opacity: 1,
        scale: 1,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: card,
          containerAnimation: ScrollTrigger.getAll().find(st => st.trigger === pin),
          start: 'left center',
          end: 'right center',
          scrub: true,
        },
      }
    );
  });
}

/* ─── refresh on resize for safety ─────────────── */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }, 200);
});
