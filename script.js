/* =========================================================
   DJ G&V — Interactions
   Vanilla JS, sans dépendance. Performant et accessible.
   - Année footer
   - Header qui s'opacifie au scroll
   - Navigation mobile (burger)
   - Lien de nav actif selon la section visible
   - Reveal au scroll (Intersection Observer)
   - Parallaxe discret du hero (rAF + respect reduced-motion)
   - Lightbox de la galerie (clavier + navigation)
========================================================== */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Année dynamique dans le footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header : état "scrollé" (fond plus opaque) ---------- */
  const header = document.getElementById('header');
  const onScrollHeader = () => {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScrollHeader();

  /* ---------- Navigation mobile ---------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  const closeMenu = () => {
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Ouvrir le menu');
  };
  const toggleMenu = () => {
    const open = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', toggleMenu);
    // Fermer le menu après un clic sur un lien
    navMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  /* ---------- Reveal au défilement (Intersection Observer) ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  // Applique le délai d'apparition (effet de cascade) via variable CSS
  revealEls.forEach((el) => {
    const delay = el.getAttribute('data-reveal-delay');
    if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
  });

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // une seule fois
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Pas d'IO ou mouvement réduit : tout est visible immédiatement
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Lien de navigation actif selon la section ---------- */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  const linkFor = (id) =>
    document.querySelector('.nav__link[href="#' + id + '"]');

  if ('IntersectionObserver' in window) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove('is-active'));
            const active = linkFor(entry.target.id);
            if (active) active.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spyObserver.observe(s));
  }

  /* ---------- Parallaxe discret du hero ---------- */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  let ticking = false;

  const applyParallax = () => {
    const y = window.scrollY;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      el.style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
    });
    ticking = false;
  };

  const onScroll = () => {
    onScrollHeader();
    if (!prefersReducedMotion && parallaxEls.length && !ticking) {
      window.requestAnimationFrame(applyParallax);
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Lightbox galerie ---------- */
  let galleryItems = Array.from(document.querySelectorAll('.gallery__item'));
  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbCaption = document.getElementById('lbCaption');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  let currentIndex = 0;
  let lastFocused = null;

  // Reprend le visuel (dégradé) du placeholder cliqué pour l'afficher en grand
  const showImage = (index) => {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    const placeholder = item.querySelector('.gallery__placeholder');
    const caption = item.getAttribute('data-caption') || '';
    if (placeholder) {
      const bg = getComputedStyle(placeholder).backgroundImage;
      lbImage.style.backgroundImage = bg;
      lbImage.style.backgroundSize = 'cover';
      lbImage.style.backgroundPosition = 'center';
    }
    lbCaption.textContent = caption;
  };

  const openLightbox = (index) => {
    lastFocused = document.activeElement;
    showImage(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  // (Re)lie les vignettes de la galerie au lightbox
  const bindGallery = () => {
    galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
    galleryItems.forEach((item, i) => { item.onclick = () => openLightbox(i); });
  };
  bindGallery();

  // Construit la galerie depuis data/gallery.json (géré par l'admin).
  // Fichier vide/absent -> on garde les vignettes par défaut.
  const renderGallery = () => {
    const grid = document.getElementById('gallery');
    if (!grid) return;
    fetch('data/gallery.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const photos = Array.isArray(data) ? data : (data && data.photos) || [];
        if (!photos.length) return;
        const sizeClass = { wide: ' gallery__item--wide', tall: ' gallery__item--tall' };
        grid.innerHTML = photos.map((p) => {
          const cls = sizeClass[p.size] || '';
          const cap = String(p.caption || '').replace(/"/g, '&quot;');
          const src = String(p.image || '');
          return '<button class="gallery__item' + cls + '" role="listitem" data-caption="' + cap + '">' +
                   '<span class="gallery__placeholder" style="background-image:url(\'' + src + '\');background-size:cover;background-position:center"></span>' +
                   '<span class="gallery__hint">Voir</span>' +
                 '</button>';
        }).join('');
        bindGallery();
      })
      .catch(() => {});
  };
  renderGallery();

  /* ---------- Contenus gérés par l'admin : portrait, setup, partenaires ---------- */
  const setBgImage = (el, src) => {
    if (!el || !src) return;
    el.style.backgroundImage = "url('" + src + "')";
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.classList.add('has-img');
  };

  // Portrait (présentation) + visuel matériel (équipement)
  fetch('data/site.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((s) => {
      if (!s) return;
      setBgImage(document.getElementById('portrait'), s.portrait);
      setBgImage(document.getElementById('setup'), s.setup);
    })
    .catch(() => {});

  // Logos partenaires : une liste par catégorie
  fetch('data/partners.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data) return;
      ['planners', 'lieux', 'traiteurs', 'photographes'].forEach((cat) => {
        const grid = document.querySelector('.partners__grid[data-cat="' + cat + '"]');
        const items = (data[cat]) || [];
        if (!grid || !items.length) return; // catégorie vide -> on garde les placeholders
        grid.innerHTML = items.map((p) => {
          const name = String(p.name || '').replace(/"/g, '&quot;');
          if (p.logo) {
            return '<div class="partner partner--logo" title="' + name + '">' +
                     '<img src="' + p.logo + '" alt="' + name + '" loading="lazy">' +
                   '</div>';
          }
          return '<div class="partner"><span>' + name + '</span></div>';
        }).join('');
      });
    })
    .catch(() => {});

  if (lightbox) {
    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => showImage(currentIndex - 1));
    lbNext.addEventListener('click', () => showImage(currentIndex + 1));
    // Clic sur le fond (hors figure) = fermeture
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    // Navigation clavier
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      else if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    });
  }

  /* ---------- Particules dorées flottantes (hero) ---------- */
  const canvas = document.getElementById('heroParticles');
  if (canvas && canvas.getContext && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    const COLORS = ['rgba(156,122,38,', 'rgba(124,138,85,', 'rgba(184,146,51,'];
    let particles = [], raf = null, w = 0, h = 0;

    const makeParticle = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.6,          // rayon
      vy: -(Math.random() * 0.25 + 0.07),    // monte doucement
      vx: (Math.random() - 0.5) * 0.18,      // dérive latérale
      a: Math.random() * 0.5 + 0.2,          // opacité de base
      tw: Math.random() * 0.02 + 0.004,      // vitesse de scintillement
      ph: Math.random() * Math.PI * 2,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, (w * h) / 16000)); // densité plafonnée
      particles = Array.from({ length: count }, makeParticle);
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y += p.vy; p.x += p.vx; p.ph += p.tw;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
        const alpha = p.a * (0.6 + 0.4 * Math.sin(p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); }, { passive: true });

    // Économie : on coupe l'animation quand le hero sort de l'écran
    const heroEl = document.getElementById('accueil');
    if ('IntersectionObserver' in window && heroEl) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { if (!raf) tick(); }
          else if (raf) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(heroEl);
    }
  }
})();
