/* M.P. Hidro Logistics — main.js */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── NAV: compact on scroll ────────────────────────────────────
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── MOBILE NAV TOGGLE ─────────────────────────────────────────
const hamburger = document.getElementById('navHamburger');
const mobileMenu = document.getElementById('navMobile');
function closeMobileNav() {
  if (!hamburger || !mobileMenu) return;
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
}
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    if (isOpen) { closeMobileNav(); } else {
      hamburger.classList.add('open');
      mobileMenu.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
    }
  });
  document.querySelectorAll('#navMobile a').forEach(a => a.addEventListener('click', closeMobileNav));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMobileNav(); });
}

// ── SCROLL REVEAL (fail-safe progressive enhancement) ─────────
// Content is visible by default (CSS: .reveal { opacity: 1 }). We only
// ever hide an element (.reveal-hidden) once an IntersectionObserver is
// standing by to reveal it (.is-visible). If anything below throws, or
// the browser lacks IntersectionObserver, or the user prefers reduced
// motion, we simply never hide anything — content stays fully visible.
try {
  const revealEls = document.querySelectorAll('.reveal');
  if (
    revealEls.length &&
    !prefersReduced &&
    'IntersectionObserver' in window
  ) {
    // 1) Build the observer FIRST — the mechanism that reverses hiding.
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.dataset.delay || '0', 10);
        if (delay) el.style.transitionDelay = delay + 'ms';
        el.classList.add('is-visible');
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    // 2) Only now apply the hidden state, and 3) immediately observe —
    //    every element we hide is guaranteed to be observed & revealed.
    revealEls.forEach(el => {
      el.classList.add('reveal-hidden');
      revealObserver.observe(el);
    });
  }
} catch (err) {
  // Absolute fail-safe: strip any hidden state so nothing is left invisible.
  document.querySelectorAll('.reveal-hidden')
    .forEach(el => el.classList.remove('reveal-hidden'));
}

// ── SHARED COUNTER UTILITY ────────────────────────────────────
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

// Counts el from 0 → target over duration ms, appends suffix at the end.
function animateCounter(el, target, suffix, duration) {
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const value = Math.round(target * eased);
    el.textContent = value.toLocaleString('es-MX') + (progress >= 1 ? suffix : '');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── STATS BAR COUNTERS ────────────────────────────────────────
const statsSection = document.getElementById('stats');
const countEls = document.querySelectorAll('.count-up');
let countersTriggered = false;

function runCounters() {
  if (countersTriggered) return;
  countersTriggered = true;
  countEls.forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    animateCounter(el, target, suffix, 1350);
  });
}

if (statsSection && countEls.length) {
  if (prefersReduced) {
    countEls.forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      el.textContent = target.toLocaleString('es-MX') + suffix;
    });
  } else {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { runCounters(); statsObserver.disconnect(); }
    }, { threshold: 0.25 });
    statsObserver.observe(statsSection);
  }
}

// ── LITROS PHOTO-BAND COUNTER ─────────────────────────────────
const litrosEl = document.querySelector('.litros-count');
let litrosTriggered = false;

if (litrosEl) {
  if (prefersReduced) {
    litrosEl.textContent = (1000000).toLocaleString('es-MX') + '+';
  } else {
    const litrosBand = litrosEl.closest('.photo-band') || litrosEl;
    const litrosObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !litrosTriggered) {
        litrosTriggered = true;
        animateCounter(litrosEl, 1000000, '+', 1350);
        litrosObserver.disconnect();
      }
    }, { threshold: 0.3 });
    litrosObserver.observe(litrosBand);
  }
}

// ── WHATSAPP POPUP ────────────────────────────────────────────
const waFab = document.getElementById('waFab');
const waPopup = document.getElementById('waPopup');

if (waFab && waPopup) {
  function toggleWaPopup(open) {
    waPopup.hidden = !open;
    waFab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  waFab.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleWaPopup(waPopup.hidden);
  });

  document.addEventListener('click', (e) => {
    if (!waPopup.hidden && !waFab.contains(e.target) && !waPopup.contains(e.target)) {
      toggleWaPopup(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !waPopup.hidden) toggleWaPopup(false);
  });
}

// ── CONTACT FORM ──────────────────────────────────────────────
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    const msgEl = document.getElementById('formMsg');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    msgEl.className = 'form-msg';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        msgEl.textContent = '¡Mensaje enviado! Te contactaremos en menos de 24 horas hábiles.';
        msgEl.classList.add('success');
        form.reset();
      } else { throw new Error(); }
    } catch {
      msgEl.textContent = 'Ocurrió un error. Por favor escríbenos directamente a contacto@mphidro.mx';
      msgEl.classList.add('error');
    }
    btn.disabled = false;
    btn.textContent = 'Enviar mensaje';
  });
}

// ── MOUSE-REACTIVE FX: ambient parallax + magnetic CTAs ───────
// Desktop-only decoration. Skipped entirely under prefers-reduced-motion
// or on touch/coarse-pointer devices. A single mousemove listener feeds a
// self-halting rAF loop that eases every layer toward its target (lerp),
// so no expensive work runs per raw event and the loop stops when settled.
(function initMouseFX() {
  if (prefersReduced) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const ambient = document.querySelector('.ambient');
  const magnets = [...document.querySelectorAll('[data-magnetic]')].map(el => ({
    el, tx: 0, ty: 0, cx: 0, cy: 0
  }));
  if (!ambient && !magnets.length) return;

  const PARALLAX_MAX = 12;   // px — max ambient shift
  const MAG_MAX = 7;         // px — max button displacement
  const MAG_REACH = 46;      // px — activation radius beyond button edge
  const EASE = 0.12;         // lerp factor → ~0.5s eased settle

  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  const state = { ptx: 0, pty: 0, pcx: 0, pcy: 0 };
  let running = false;

  function setTargets(mx, my) {
    if (ambient) {
      state.ptx = ((mx / window.innerWidth) - 0.5) * 2 * PARALLAX_MAX;
      state.pty = ((my / window.innerHeight) - 0.5) * 2 * PARALLAX_MAX;
    }
    for (const m of magnets) {
      const r = m.el.getBoundingClientRect();
      const dx = mx - (r.left + r.width / 2);
      const dy = my - (r.top + r.height / 2);
      const reach = Math.max(r.width, r.height) / 2 + MAG_REACH;
      const dist = Math.hypot(dx, dy);
      if (dist < reach) {
        const pull = 1 - dist / reach;           // 0..1, stronger up close
        m.tx = clamp(dx * 0.5 * pull, MAG_MAX);
        m.ty = clamp(dy * 0.5 * pull, MAG_MAX);
      } else { m.tx = 0; m.ty = 0; }
    }
    ensureRunning();
  }

  function tick() {
    let active = false;
    if (ambient) {
      state.pcx += (state.ptx - state.pcx) * EASE;
      state.pcy += (state.pty - state.pcy) * EASE;
      ambient.style.transform = `translate3d(${state.pcx.toFixed(2)}px, ${state.pcy.toFixed(2)}px, 0)`;
      if (Math.abs(state.ptx - state.pcx) > 0.05 || Math.abs(state.pty - state.pcy) > 0.05) active = true;
    }
    for (const m of magnets) {
      m.cx += (m.tx - m.cx) * EASE;
      m.cy += (m.ty - m.cy) * EASE;
      m.el.style.transform = `translate3d(${m.cx.toFixed(2)}px, ${m.cy.toFixed(2)}px, 0)`;
      if (Math.abs(m.tx - m.cx) > 0.05 || Math.abs(m.ty - m.cy) > 0.05) active = true;
    }
    if (active) { requestAnimationFrame(tick); } else { running = false; }
  }

  function ensureRunning() { if (!running) { running = true; requestAnimationFrame(tick); } }

  window.addEventListener('mousemove', (e) => setTargets(e.clientX, e.clientY), { passive: true });
  // Ease everything back to rest when the cursor leaves the window.
  window.addEventListener('mouseleave', () => {
    state.ptx = 0; state.pty = 0;
    for (const m of magnets) { m.tx = 0; m.ty = 0; }
    ensureRunning();
  });
})();
