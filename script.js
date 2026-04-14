/* ===================================================
   PANKY BARBER — script.js
   v1.0 | Travanj 2026.
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── AOS INIT ──────────────────────────────────── */
  AOS.init({
    duration: 650,
    easing: 'ease-out-quad',
    once: true,
    offset: 60,
    delay: 0,
  });


  /* ── ANIMATED PILL NAVBAR ─────────────────────── */
  // Replicates the Framer Motion collapse/expand behaviour in vanilla JS.
  // Collapses when scrolling DOWN past 150px.
  // Expands when scrolling UP by 80px from the collapse position.
  // Clicking the collapsed pill expands it.

  const navPill = document.getElementById('navPill');
  let isNavExpanded = true;
  let lastScrollY   = 0;
  let collapseScrollY = 0; // scroll position when pill was collapsed
  let expandedWidth   = 0;

  // After fonts are loaded, measure natural pill width & lock it in px
  // (required for CSS transition to work — can't transition from 'auto')
  const initNavWidth = () => {
    navPill.classList.remove('is-collapsed');
    navPill.style.transition = 'none';
    navPill.style.width      = 'auto';

    // Force layout so scrollWidth is accurate
    void navPill.offsetWidth;
    expandedWidth = navPill.scrollWidth;

    navPill.style.width = expandedWidth + 'px';

    // Re-enable transitions next frame
    requestAnimationFrame(() => {
      navPill.style.transition = '';
    });
  };

  // Wait for fonts before measuring (prevents undersized measurement)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initNavWidth);
  } else {
    // Fallback for older browsers
    window.addEventListener('load', initNavWidth);
  }

  // Re-measure on resize so collapsed → expanded stays accurate
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isNavExpanded) initNavWidth();
    }, 150);
  }, { passive: true });

  // ── Collapse ──
  const collapseNav = () => {
    if (!isNavExpanded) return;
    isNavExpanded = false;

    // Ensure explicit px width before starting transition
    navPill.style.width = expandedWidth + 'px';

    requestAnimationFrame(() => {
      navPill.classList.add('is-collapsed');
      navPill.style.width = '48px';
    });
  };

  // ── Expand ──
  const expandNav = () => {
    if (isNavExpanded) return;
    isNavExpanded = true;

    navPill.classList.remove('is-collapsed');
    navPill.style.width = expandedWidth + 'px';
  };

  // ── Click collapsed pill to expand ──
  navPill.addEventListener('click', (e) => {
    if (!isNavExpanded) {
      e.preventDefault();
      expandNav();
      // Reset reference so the pill doesn't immediately re-collapse
      collapseScrollY = window.scrollY;
    }
  });

  // Links propagate their own click (smooth scroll) without triggering expand
  document.querySelectorAll('.np-link').forEach(link => {
    link.addEventListener('click', (e) => e.stopPropagation());
  });

  // ── Scroll-driven collapse / expand ──
  const COLLAPSE_AFTER_PX  = 150; // minimum scroll depth before collapsing
  const EXPAND_SCROLL_DELTA = 80; // how far user must scroll back up to re-expand

  const onNavScroll = () => {
    const current = window.scrollY;

    if (isNavExpanded && current > lastScrollY && current > COLLAPSE_AFTER_PX) {
      // Scrolling down past threshold → collapse
      collapseScrollY = current;
      collapseNav();
    } else if (!isNavExpanded && current < lastScrollY &&
               (collapseScrollY - current > EXPAND_SCROLL_DELTA)) {
      // Scrolled back up enough → expand
      expandNav();
    }

    lastScrollY = current;
  };

  window.addEventListener('scroll', onNavScroll, { passive: true });


  /* ── HERO PARALLAX ─────────────────────────────── */
  const heroBg = document.querySelector('.hero-bg');

  if (heroBg) {
    const parallax = () => {
      const scrolled = window.scrollY;
      heroBg.style.transform = `scale(1.05) translateY(${scrolled * 0.3}px)`;
    };

    window.addEventListener('scroll', parallax, { passive: true });
  }


  /* ── SMOOTH SCROLL (anchor links) ─────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const navH = 88; // pill top(24) + height(48) + breathing room(16)
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ── ACTIVE NAV LINK (highlight on scroll) ─────── */
  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.np-link[href^="#"]');

  const setActiveNav = () => {
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top    = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < bottom) {
        navAnchors.forEach(a => {
          if (a.classList.contains('np-cta')) return; // leave CTA unstyled
          a.style.color = '';
          if (a.getAttribute('href') === `#${id}`) {
            a.style.color = 'var(--text)';
          }
        });
      }
    });
  };

  window.addEventListener('scroll', setActiveNav, { passive: true });


  /* ── STATS COUNTER ANIMATION ───────────────────── */
  const statNums = document.querySelectorAll('.stat-num[data-target]');

  const animateCounter = (el) => {
    const target  = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start   = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased   = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      el.textContent = current;

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  // Use IntersectionObserver to trigger on scroll
  if ('IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNums.forEach(el => statsObserver.observe(el));
  } else {
    // Fallback: just show the target value
    statNums.forEach(el => { el.textContent = el.dataset.target; });
  }


  /* ── GALLERY LIGHTBOX ──────────────────────────── */
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox     = document.getElementById('lightbox');
  const lbImg        = document.getElementById('lbImg');
  const lbClose      = document.getElementById('lbClose');
  const lbBackdrop   = document.getElementById('lbBackdrop');
  const lbPrev       = document.getElementById('lbPrev');
  const lbNext       = document.getElementById('lbNext');
  const lbCounter    = document.getElementById('lbCounter');

  let currentIndex = 0;
  let prevFocusEl  = null;

  const openLightbox = (index) => {
    currentIndex = index;
    prevFocusEl = document.activeElement;

    updateLightbox();

    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';

    setTimeout(() => lbClose.focus(), 50);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    lbImg.src = '';

    if (prevFocusEl) prevFocusEl.focus();
  };

  const updateLightbox = () => {
    const item  = galleryItems[currentIndex];
    const src   = item.dataset.src || item.querySelector('img').src;
    const alt   = item.querySelector('img').alt;

    lbImg.src = src;
    lbImg.alt = alt;
    lbCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
  };

  const prevItem = () => {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightbox();
  };

  const nextItem = () => {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    updateLightbox();
  };

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', prevItem);
  lbNext.addEventListener('click', nextItem);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;

    switch (e.key) {
      case 'Escape':   closeLightbox(); break;
      case 'ArrowLeft':  prevItem(); break;
      case 'ArrowRight': nextItem(); break;
    }
  });

  // Touch/swipe support on lightbox
  let touchStartX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextItem() : prevItem();
    }
  }, { passive: true });



  /* ── BACK-TO-TOP (scroll to hero on logo click) ── */
  // Already handled by smooth scroll above (href="#hero")



  /* ── TYPEWRITER ─────────────────────────────────── */
  const twEl = document.getElementById('typewriterText');
  if (twEl) {
    const phrases = [
      'Rezervirajte termin danas.',
      'Vaš novi stil čeka vas.',
      'Premium iskustvo po mjeri.',
      'Neka brada govori za sebe.'
    ];
    let pIdx = 0, cIdx = 0, deleting = false;

    const tick = () => {
      const phrase = phrases[pIdx];
      if (deleting) {
        cIdx--;
        twEl.textContent = phrase.substring(0, cIdx);
        if (cIdx === 0) {
          deleting = false;
          pIdx = (pIdx + 1) % phrases.length;
          setTimeout(tick, 400);
          return;
        }
        setTimeout(tick, 35);
      } else {
        cIdx++;
        twEl.textContent = phrase.substring(0, cIdx);
        if (cIdx === phrase.length) {
          deleting = true;
          setTimeout(tick, 2200);
          return;
        }
        setTimeout(tick, 70);
      }
    };
    setTimeout(tick, 600);
  }


  /* ── TESTIMONIALS SLIDER ────────────────────────── */
  (function () {
    const data = [
      {
        name: 'Marko Kovačić',  since: 'Klijent od 2021.',
        quote: 'Panky Barber je jedino mjesto gdje se zaista opustim. Svaki posjet je pravo iskustvo — od kave na početku do savršenog rezultata na kraju.',
        img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&q=80'
      },
      {
        name: 'Luka Petrović',  since: 'Klijent od 2022.',
        quote: 'Dolazim svaka dva tjedna i uvijek odlazim zadovoljan. Majstor savršeno razumije što hoćeš bez previše objašnjavanja. Jedino pravo barbershop iskustvo u gradu.',
        img: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500&h=500&fit=crop&q=80'
      },
      {
        name: 'Ivan Horvat',  since: 'Klijent od 2023.',
        quote: 'Konačno brijačnica koja razumije premium uslugu. Atmosfera je odlična, osoblje profesionalno, a rezultat uvijek impresivan. Preporučujem bez razmišljanja.',
        img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&q=80'
      },
      {
        name: 'Tomislav Marić',  since: 'Klijent od 2020.',
        quote: 'Godinama sam tražio pravi barbershop i pronašao ga ovdje. Svaki detalj je promišljen — od ambijenta do načina na koji se brinu o klijentu.',
        img: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&h=500&fit=crop&q=80'
      },
      {
        name: 'Dario Kušić',  since: 'Klijent od 2022.',
        quote: 'Moja brada nikad bolje nije izgledala. Pravi majstori svog zanata koji se ponose rezultatom. Obavezna destinacija za svakog tko cijeni pravi muški stil.',
        img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&q=80'
      },
      {
        name: 'Stjepan Blažević',  since: 'Klijent od 2021.',
        quote: 'Šišanje koje je postalo ritual. Svaki put izlazim s uzdignnutom glavom. Panky Barber je više od brijačnice — to je mjesto gdje se osjetiš posebno.',
        img: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=500&h=500&fit=crop&q=80'
      },
      {
        name: 'Matej Vuković',  since: 'Klijent od 2023.',
        quote: 'Rezervirani sam klijent već godinu dana i ne planiram mijenjati. Brzina, preciznost i stil — sve na jednom mjestu. Panky Barber je dio moje tjedne rutine.',
        img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&h=500&fit=crop&q=80'
      },
    ];

    const imgsWrap   = document.getElementById('testimonialsImgs');
    const quotesWrap = document.getElementById('testimonialsQuotes');
    if (!imgsWrap || !quotesWrap) return;

    let active = 0;
    let autoTimer;

    data.forEach((t, i) => {
      /* image card */
      const div = document.createElement('div');
      div.className = 'ti-img';
      const rot = ((Math.random() * 12) - 6).toFixed(1);
      div.style.cssText = i === 0
        ? `z-index:${data.length};opacity:1;transform:scale(1) rotate(0deg) translateY(0)`
        : `z-index:1;opacity:0.3;transform:scale(0.88) rotate(${rot}deg) translateY(16px)`;
      const img = document.createElement('img');
      img.src = t.img; img.alt = t.name; img.loading = 'lazy';
      img.onerror = function () {
        this.style.display = 'none';
        const fb = document.createElement('span');
        fb.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:4rem;font-weight:700;color:var(--gold);background:var(--bg-card)';
        fb.textContent = t.name.charAt(0);
        div.appendChild(fb);
      };
      div.appendChild(img);
      imgsWrap.appendChild(div);

      /* quote card */
      const qDiv = document.createElement('div');
      qDiv.className = 'testimonials-quote-item' + (i === 0 ? ' active' : '');
      qDiv.innerHTML = `<h3 class="tq-name">${t.name}</h3><p class="tq-since">${t.since}</p><p class="tq-text">\u201C${t.quote}\u201D</p>`;
      quotesWrap.appendChild(qDiv);
    });

    const imgEls   = imgsWrap.querySelectorAll('.ti-img');
    const quoteEls = quotesWrap.querySelectorAll('.testimonials-quote-item');

    const go = (newIdx) => {
      active = newIdx;
      imgEls.forEach((el, i) => {
        if (i === active) {
          el.style.opacity = '1';
          el.style.transform = 'scale(1) rotate(0deg) translateY(0)';
          el.style.zIndex = data.length;
        } else {
          const rot = ((Math.random() * 12) - 6).toFixed(1);
          el.style.opacity = '0.3';
          el.style.transform = `scale(0.88) rotate(${rot}deg) translateY(16px)`;
          el.style.zIndex = Math.max(1, data.length - Math.abs(i - active));
        }
      });
      quoteEls.forEach((el, i) => el.classList.toggle('active', i === active));
    };

    const nextSlide = () => go((active + 1) % data.length);
    const prevSlide = () => go((active - 1 + data.length) % data.length);

    const resetTimer = () => { clearInterval(autoTimer); autoTimer = setInterval(nextSlide, 5000); };

    const btnNext = document.getElementById('tcNext');
    const btnPrev = document.getElementById('tcPrev');
    if (btnNext) btnNext.addEventListener('click', () => { nextSlide(); resetTimer(); });
    if (btnPrev) btnPrev.addEventListener('click', () => { prevSlide(); resetTimer(); });

    resetTimer();
  })();

  /* ── INIT COMPLETE ──────────────────────────────── */
  console.log('%cPanky Barber 💈', 'color:#C9A84C;font-size:16px;font-weight:700;');
  console.log('%cWebsite loaded successfully.', 'color:#8A8070;font-size:12px;');

});
