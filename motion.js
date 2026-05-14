// Koidl's Prater — micro-motion + filter interactions

(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lucide icons init (if loaded)
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // ════════ HERO VIDEO + AUDIO TOGGLE ════════
  const heroVideo  = document.getElementById('hero-video');
  const audioBtn   = document.getElementById('audio-toggle');

  if (heroVideo) {
    // Ensure autoplay starts (some browsers require explicit play after parse)
    const tryPlay = () => {
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => { /* swallow — will start on first interaction */ });
    };
    if (heroVideo.readyState >= 2) tryPlay();
    else heroVideo.addEventListener('loadeddata', tryPlay, { once: true });
  }

  if (heroVideo && audioBtn) {
    const setMuted = (muted) => {
      heroVideo.muted = muted;
      audioBtn.classList.toggle('is-muted', muted);
      audioBtn.setAttribute('aria-pressed', String(!muted));
      audioBtn.setAttribute('aria-label', muted ? 'Ton einschalten' : 'Ton ausschalten');
      const label = audioBtn.querySelector('.audio-toggle-label');
      if (label) label.textContent = muted ? 'Ton an' : 'Ton aus';
      // Ensure playback continues after a state change
      const p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };

    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audioBtn.classList.remove('is-hinting');
      setMuted(!heroVideo.muted);
    });

    // Auto-unmute on first interaction anywhere (one-time)
    const autoUnmute = () => {
      // Only if user hasn't already toggled
      if (heroVideo.muted) setMuted(false);
      cleanup();
    };
    const cleanup = () => {
      document.removeEventListener('pointerdown', autoUnmute, true);
      document.removeEventListener('keydown', autoUnmute, true);
      document.removeEventListener('touchstart', autoUnmute, true);
    };
    document.addEventListener('pointerdown', autoUnmute, { capture: true, once: true });
    document.addEventListener('keydown', autoUnmute, { capture: true, once: true });
    document.addEventListener('touchstart', autoUnmute, { capture: true, once: true });

    // Stop the hint pulse after 5 seconds (or earlier if user clicks)
    if (!prefersReducedMotion) {
      setTimeout(() => audioBtn.classList.remove('is-hinting'), 5000);
    } else {
      audioBtn.classList.remove('is-hinting');
    }
  }

  // ── Reveal-on-scroll (default: opacity 0/y:28 -> 1/0, 800ms ease-out)
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const delay = parseInt(el.dataset.delay || '0', 10);
        setTimeout(() => el.classList.add('is-in'), delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach((el) => io.observe(el));

    // Stagger cards independently
    const gridCards = document.querySelectorAll('#cards-grid .card');
    const cardIO = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (!e.isIntersecting) return;
        const card = e.target;
        const idx = parseInt(card.dataset.idx || '0', 10);
        card.style.opacity = '0';
        card.style.transform = 'translateY(36px)';
        card.style.transition = 'opacity 720ms cubic-bezier(0.22,1,0.36,1), transform 720ms cubic-bezier(0.22,1,0.36,1)';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, (idx % 6) * 70);
        cardIO.unobserve(card);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -80px 0px' });
    gridCards.forEach((card, i) => {
      card.dataset.idx = i;
      cardIO.observe(card);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // ── Nav scroll state
  const navWrap = document.querySelector('.nav-wrap');
  if (navWrap) {
    const onScroll = () => {
      navWrap.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Filter pills (visual filter only, per v1 brief)
  const pills = document.querySelectorAll('.pill');
  const grid = document.getElementById('cards-grid');
  if (pills.length && grid) {
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => { p.classList.remove('is-active'); p.setAttribute('aria-selected', 'false'); });
        pill.classList.add('is-active');
        pill.setAttribute('aria-selected', 'true');
        const cat = pill.dataset.filter;
        const cards = grid.querySelectorAll('.card');
        cards.forEach((card, i) => {
          const show = cat === 'alle' || card.dataset.cat === cat;
          if (show) {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px) scale(0.98)';
            requestAnimationFrame(() => {
              setTimeout(() => {
                card.style.transition = 'opacity 420ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.22,1,0.36,1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
              }, i * 35);
            });
          } else {
            card.style.transition = 'opacity 220ms ease, transform 220ms ease';
            card.style.opacity = '0';
            card.style.transform = 'translateY(8px) scale(0.96)';
            setTimeout(() => { card.style.display = 'none'; }, 220);
          }
        });
      });
    });
  }

  // ── Stat counter animation
  const statNums = document.querySelectorAll('.stat-num');
  if (statNums.length && 'IntersectionObserver' in window) {
    const cIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const original = el.textContent.trim();
        // find leading integer
        const m = original.match(/^(\d+)(.*)$/);
        if (!m) { cIO.unobserve(el); return; }
        const target = parseInt(m[1], 10);
        const suffix = m[2] || '';
        const dur = 1200;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          const v = Math.floor(eased * target);
          // preserve any suffix wrapper (<span>) by reading from data
          el.textContent = v + suffix.replace(/<[^>]+>/g, '');
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    statNums.forEach((el) => {
      // Strip HTML on read; preserve in a data attr for restore
      el.dataset.original = el.innerHTML;
      cIO.observe(el);
    });
  }
})();
