/**
 * ONES Production — site interactions
 * Every module is page-safe: each checks for its required DOM
 * elements and bails out early if they're absent. This means the
 * same script can be loaded on every page without side effects.
 */
(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────────
  // Module: Lightbox player (iframe src swap on URL hash change)
  // Pages that use it: index.html
  // ──────────────────────────────────────────────────────────────
  function initLightbox() {
    if (!document.querySelector('.lightbox iframe')) return;

    function stopAll() {
      document.querySelectorAll('.lightbox iframe').forEach(function (f) {
        f.src = '';
      });
    }

    function startReel(id) {
      var lb = document.getElementById(id);
      if (!lb) return;
      var f = lb.querySelector('iframe');
      if (f && f.dataset.src) f.src = f.dataset.src;
    }

    window.addEventListener('hashchange', function () {
      stopAll();
      var m = location.hash.match(/^#(reel-\d+)$/);
      if (m) startReel(m[1]);
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Module: Hover video previews on reel cards
  // Pages that use it: index.html, tv-shows.html
  // ──────────────────────────────────────────────────────────────
  function initHoverPreviews() {
    document.querySelectorAll('.reel__item').forEach(function (item) {
      var v = item.querySelector('.reel__preview');
      if (!v) return;
      item.addEventListener('mouseenter', function () {
        v.play().catch(function () {});
      });
      item.addEventListener('mouseleave', function () {
        v.pause();
        v.currentTime = 0;
      });
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Module: Scroll-affordance bounce
  // Cinematic loop on the homepage cities hero — buttery ease-in-out
  // scroll synced with a fade-in/fade-out of the "Scroll" cue.
  // Runs every ~4 s until the user scrolls.
  // ──────────────────────────────────────────────────────────────
  function initBounceLoop() {
    if (!document.querySelector('.cities')) return;

    var cue = document.querySelector('.scroll-cue');
    // Hand opacity control to JS so it doesn't fight the CSS transition
    if (cue) cue.style.transition = 'transform .4s ease';

    // Single easing: cubic ease-in-out — smooth on both ends
    function easeInOut(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Generic RAF-driven animation helper
    function animate(setter, from, to, dur) {
      var t0 = performance.now();
      function step(now) {
        var p = Math.min((now - t0) / dur, 1);
        setter(from + (to - from) * easeInOut(p));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function smoothScroll(target, dur) {
      animate(function (v) { window.scrollTo(0, v); },
              window.scrollY, target, dur);
    }

    function fadeCue(to, dur) {
      if (!cue) return;
      var from = cue.style.opacity === '' ? 1 : parseFloat(cue.style.opacity);
      animate(function (v) { cue.style.opacity = v; }, from, to, dur);
    }

    function bounceLoop() {
      if (window.scrollY > 5) return;          // user scrolled — stop loop

      // Phase 1 — peek down + fade cue out  (900 ms, ease-in-out)
      smoothScroll(60, 900);
      fadeCue(0.18, 900);

      setTimeout(function () {
        setTimeout(function () {               // Phase 2 — hold at peek (500 ms)

          // Phase 3 — return up + fade cue back in  (700 ms, ease-in-out)
          smoothScroll(0, 700);
          fadeCue(1, 700);

          setTimeout(bounceLoop, 2000);        // Phase 4 — rest, then repeat
        }, 500);
      }, 900);
    }

    setTimeout(bounceLoop, 300);
  }

  // ──────────────────────────────────────────────────────────────
  // Module: Gooey city-name morph (hero cities — Barcelona, Warsaw, Bangkok)
  // ───────────────────────────────────────────────────────────────
  // On hover, the city name morphs through Barcelona → Warsaw → Bangkok …
  // looping. Uses SVG threshold filter + blur+opacity tween for the
  // classic "metaball" gooey effect. Only animates while hovered.
  // ──────────────────────────────────────────────────────────────
  function initCityMorph() {
    var morphTime = 1;
    var cooldownTime = 0.25;

    document.querySelectorAll('.city .city__morph').forEach(function (morphEl) {
      var textA = morphEl.querySelector('.city__morph-text--a');
      var textB = morphEl.querySelector('.city__morph-text--b');
      if (!textA || !textB) return;

      // Each tile cycles its own 2-text pair (city ↔ country)
      var texts = [textA.textContent.trim(), textB.textContent.trim()];

      var rafId = null, hovering = false;
      var textIndex = texts.length - 1;
      var time = 0, morph = 0, cooldown = cooldownTime;

      function setMorph(fraction) {
        textB.style.filter = 'blur(' + Math.min(8 / fraction - 8, 100) + 'px)';
        textB.style.opacity = Math.pow(fraction, 0.4) * 100 + '%';
        fraction = 1 - fraction;
        textA.style.filter = 'blur(' + Math.min(8 / fraction - 8, 100) + 'px)';
        textA.style.opacity = Math.pow(fraction, 0.4) * 100 + '%';
      }
      function doCooldown() {
        morph = 0;
        textB.style.filter = '';
        textB.style.opacity = '100%';
        textA.style.filter = '';
        textA.style.opacity = '0%';
      }
      function doMorph() {
        morph -= cooldown;
        cooldown = 0;
        var fraction = morph / morphTime;
        if (fraction > 1) { cooldown = cooldownTime; fraction = 1; }
        setMorph(fraction);
      }
      function animate() {
        if (!hovering) { rafId = null; return; }
        rafId = requestAnimationFrame(animate);
        var newTime = performance.now();
        var shouldIncrement = cooldown > 0;
        var dt = (newTime - time) / 1000;
        time = newTime;
        cooldown -= dt;
        if (cooldown <= 0) {
          if (shouldIncrement) {
            textIndex = (textIndex + 1) % texts.length;
            textA.textContent = texts[textIndex % texts.length];
            textB.textContent = texts[(textIndex + 1) % texts.length];
          }
          doMorph();
        } else {
          doCooldown();
        }
      }

      var cityEl = morphEl.closest('.city');
      if (!cityEl) return;
      cityEl.addEventListener('mouseenter', function () {
        hovering = true;
        time = performance.now();
        morph = 0;
        cooldown = 0;          // 0, not cooldownTime — so the first frame
                                // morphs FROM the visible city, instead of
                                // doCooldown jumping straight to textB
        textIndex = 0;          // we're "currently at" index 0 (city);
                                // first cycle morphs to index 1 (country)
        textA.textContent = texts[0];
        textB.textContent = texts[1];
        textA.style.filter = '';
        textA.style.opacity = '1';
        textB.style.filter = '';
        textB.style.opacity = '0';
        if (!rafId) rafId = requestAnimationFrame(animate);
      });
      cityEl.addEventListener('mouseleave', function () {
        hovering = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        textA.textContent = texts[0];
        textB.textContent = texts[1];
        textA.style.filter = '';
        textA.style.opacity = '';
        textB.style.filter = '';
        textB.style.opacity = '';
      });
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Module: Interactive production hub map
  // ─── click a city pin to pin its tooltip (latches open)
  // ─── click outside / press ESC to close
  // ─── mouse-follow parallax shifts the dot grid for depth
  // ──────────────────────────────────────────────────────────────
  function initHubMap() {
    var map = document.querySelector('.hub__map');
    if (!map) return;
    var pins = map.querySelectorAll('.hub__pin');
    if (!pins.length) return;
    var grid = map.querySelector('.hub__grid');
    var active = null;

    function setActive(pin) {
      pins.forEach(function (p) {
        p.classList.toggle('is-active', p === pin);
        p.setAttribute('aria-expanded', p === pin ? 'true' : 'false');
      });
      active = pin;
    }
    function clearActive() {
      pins.forEach(function (p) {
        p.classList.remove('is-active');
        p.setAttribute('aria-expanded', 'false');
      });
      active = null;
    }

    pins.forEach(function (pin) {
      pin.addEventListener('click', function (e) {
        e.stopPropagation();
        if (active === pin) clearActive();
        else setActive(pin);
      });
    });

    // Click anywhere else → close
    document.addEventListener('click', function (e) {
      if (active && !map.contains(e.target)) clearActive();
    });
    // ESC → close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && active) {
        var prev = active;
        clearActive();
        prev.focus();
      }
    });

    // Parallax removed — pins and background stay perfectly still
  }

  // ──────────────────────────────────────────────────────────────
  // Module: Hover image preview — follows the cursor
  // Any element with data-img="..." anywhere on the page gets a
  // floating preview that lerp-follows the pointer. One shared
  // floating panel for every section. Touch devices skip via CSS
  // (@media hover:none → display:none).
  // ──────────────────────────────────────────────────────────────
  function initServicesHoverPreview() {
    var items = document.querySelectorAll('[data-img]');
    if (!items.length) return;

    // Build the floating preview once and append to <body>
    var preview = document.createElement('div');
    preview.className = 'hover-preview';
    preview.setAttribute('aria-hidden', 'true');

    // Pre-create an <img> for each unique source so transitions look smooth
    var imgs = {};
    items.forEach(function (item) {
      var src = item.dataset.img;
      if (!imgs[src]) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        preview.appendChild(img);
        imgs[src] = img;
      }
    });
    document.body.appendChild(preview);

    var targetX = 0, targetY = 0;
    var smoothX = 0, smoothY = 0;
    var raf = null;
    var primed = false;

    function lerp(start, end, factor) {
      return start + (end - start) * factor;
    }

    function tick() {
      smoothX = lerp(smoothX, targetX, 0.15);
      smoothY = lerp(smoothY, targetY, 0.15);
      preview.style.transform =
        'translate3d(' + (smoothX + 20) + 'px,' + (smoothY - 100) + 'px,0)';
      if (Math.abs(targetX - smoothX) > 0.2 || Math.abs(targetY - smoothY) > 0.2) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    function onMouseMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    }

    items.forEach(function (item) {
      item.addEventListener('mouseenter', function (e) {
        // First hover: snap to cursor instead of flying in from (0,0)
        if (!primed) {
          targetX = smoothX = e.clientX;
          targetY = smoothY = e.clientY;
          primed = true;
        }
        // Show only this item's image, hide the rest
        var src = item.dataset.img;
        Object.keys(imgs).forEach(function (k) {
          imgs[k].classList.toggle('is-active', k === src);
        });
        preview.classList.add('is-visible');
      });
      item.addEventListener('mouseleave', function () {
        preview.classList.remove('is-visible');
      });
      item.addEventListener('mousemove', onMouseMove);
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Module: Roads parallax — JS-driven so it works on iOS/Android too
  // (CSS background-attachment:fixed is unsupported on iOS Safari).
  // Pages that use it: index.html
  // ──────────────────────────────────────────────────────────────
  function initRoadsParallax() {
    var roads = document.querySelector('.roads');
    if (!roads) return;
    var bg = roads.querySelector('.roads__bg');
    if (!bg) return;

    var ticking = false;

    function update() {
      ticking = false;
      var rect = roads.getBoundingClientRect();
      var vh = window.innerHeight;
      // Skip when fully off-screen
      if (rect.bottom < 0 || rect.top > vh) return;
      // Progress: 0 when section enters at viewport bottom, 1 when leaves at top
      var progress = (vh - rect.top) / (vh + rect.height);
      if (progress < 0) progress = 0;
      else if (progress > 1) progress = 1;
      // Asymmetric range — full bottom of the photo, top reveal trimmed:
      //   progress 0 → translate = -130% h  (FULL bottom)
      //   progress 1 → translate = +73%  h  (top, with the upper ~44% hidden)
      var down = rect.height * 1.3;    // full bottom reveal
      var up   = rect.height * 0.73;   // trimmed top reveal
      var translate = -down + progress * (down + up);
      bg.style.transform = 'translate3d(0,' + translate + 'px,0)';
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  // ──────────────────────────────────────────────────────────────
  // Module: Photoshoots slideshow — keyboard + click-and-drag swipe
  // Pages that use it: photoshoots.html
  // ──────────────────────────────────────────────────────────────
  function initSlideshow() {
    var track = document.querySelector('.ps-track');
    if (!track) return;

    var slides = function () { return track.querySelectorAll('.ps-slide'); };
    var slideW = function () { return slides()[0].offsetWidth; };

    // Keyboard arrow navigation
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var w   = slideW();
      var cur = Math.round(track.scrollLeft / w);
      var nxt = e.key === 'ArrowRight'
        ? Math.min(cur + 1, slides().length - 1)
        : Math.max(cur - 1, 0);
      track.scrollTo({ left: nxt * w, behavior: 'smooth' });
    });

    // Click-and-drag swipe (desktop)
    var down = false, startX = 0, startScroll = 0, lastDx = 0, moved = 0;
    var THRESHOLD = 40; // px — drag this much and the slide changes

    track.addEventListener('mousedown', function (e) {
      if (e.target.closest('a, button')) return;     // let links fire normally
      down = true; moved = 0; lastDx = 0;
      startX = e.pageX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      track.style.scrollSnapType = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!down) return;
      var dx = e.pageX - startX;
      lastDx = dx;
      moved  = Math.max(moved, Math.abs(dx));
      track.scrollLeft = startScroll - dx;
    });

    function release() {
      if (!down) return;
      down = false;
      track.classList.remove('is-dragging');
      track.style.scrollSnapType = '';
      var w        = slideW();
      var startIdx = Math.round(startScroll / w);
      var total    = slides().length;
      var newIdx   = startIdx;
      if (lastDx < -THRESHOLD)      newIdx = Math.min(startIdx + 1, total - 1);
      else if (lastDx >  THRESHOLD) newIdx = Math.max(startIdx - 1, 0);
      track.scrollTo({ left: newIdx * w, behavior: 'smooth' });
    }
    window.addEventListener('mouseup', release);
    window.addEventListener('mouseleave', release);

    // Suppress the click that fires right after a real drag (prevents
    // accidental link navigation when the user was actually swiping).
    track.addEventListener('click', function (e) {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    }, true);
  }

  // ──────────────────────────────────────────────────────────────
  // Bootstrap — run every module once the DOM is ready.
  // Each module is element-gated so calling them all on every page
  // is harmless.
  // ──────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────
  // Module: Accordion — Apple-style roll out / roll in.
  // Single-open behaviour. Animates `grid-template-rows: 0fr → 1fr`
  // for a real height transition without measuring anything. The
  // .is-open class drives the plus→close icon rotation and the
  // panel reveal in CSS.
  // ──────────────────────────────────────────────────────────────
  function initAccordion() {
    document.querySelectorAll('.acc').forEach(function (acc) {
      var items = Array.prototype.slice.call(acc.querySelectorAll('.acc__item'));
      items.forEach(function (item) {
        var head = item.querySelector('.acc__head');
        if (!head) return;
        head.addEventListener('click', function () {
          var willOpen = !item.classList.contains('is-open');
          items.forEach(function (other) {
            other.classList.remove('is-open');
            var h = other.querySelector('.acc__head');
            if (h) h.setAttribute('aria-expanded', 'false');
          });
          if (willOpen) {
            item.classList.add('is-open');
            head.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Module: Smart header — hide on scroll-down, reveal on scroll-up.
  // Uses rAF throttling to stay silky. A 100px threshold prevents
  // flickering at the very top of the page.
  // ──────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────
  // Module: Photoshoot thumbnail cursor label.
  // One shared fixed div follows the mouse over .ps-thumbs links.
  // Name is parsed from aria-label ("Slide N: NAME" → "NAME").
  // Position is set via rAF, opacity via CSS transition.
  // ──────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────
  // Module: Video aperture cursor.
  // A 72px animated ring replaces the native cursor over every
  // .reel__poster across all pages. Two expanding pulse rings +
  // a breathing main ring + centre dot + play triangle.
  // Lerp-follows the pointer for cinematic smoothness.
  // ──────────────────────────────────────────────────────────────
  function initVideoCursor() {
    var targets = document.querySelectorAll('.reel__poster');
    if (!targets.length) return;

    // Build element
    var el = document.createElement('div');
    el.id = 'vid-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="vc__ring2"></div><div class="vc__dot"></div><div class="vc__play"></div>';
    document.body.appendChild(el);

    var rafId = null, hovering = false;
    var R = 48; // half of 96px — used to centre element on cursor

    function tick(e) {
      el.style.transform = 'translate3d(' + (e.clientX - R) + 'px,' + (e.clientY - R) + 'px,0)';
      rafId = null;
    }

    document.addEventListener('mousemove', function (e) {
      if (!hovering) return;
      if (rafId) return;
      rafId = requestAnimationFrame(tick.bind(null, e));
    }, { passive: true });

    targets.forEach(function (target) {
      target.addEventListener('mouseenter', function (e) {
        hovering = true;
        el.style.transform = 'translate3d(' + (e.clientX - R) + 'px,' + (e.clientY - R) + 'px,0)';
        el.classList.add('is-active');
      });
      target.addEventListener('mouseleave', function () {
        hovering = false;
        el.classList.remove('is-active');
      });
    });
  }

  function initPhotoCursor() {
    var thumbs = document.querySelectorAll('.ps-thumbs a');
    if (!thumbs.length) return;

    var el = document.createElement('div');
    el.className = 'ps-cursor';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);

    var cx = 0, cy = 0, rafId = null;

    function tick() {
      el.style.transform = 'translate(' + (cx + 18) + 'px,' + (cy - 18) + 'px)';
      rafId = null;
    }

    thumbs.forEach(function (thumb) {
      var name = (thumb.getAttribute('aria-label') || '')
        .replace(/^Slide\s*\d+\s*:\s*/i, '').trim();

      thumb.addEventListener('mouseenter', function () {
        el.textContent = name;
        el.classList.add('is-active');
      });
      thumb.addEventListener('mouseleave', function () {
        el.classList.remove('is-active');
      });
      thumb.addEventListener('mousemove', function (e) {
        cx = e.clientX;
        cy = e.clientY;
        if (!rafId) rafId = requestAnimationFrame(tick);
      });
    });
  }

  function initSmartHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var lastY = window.scrollY;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y > lastY && y > 100) {
          header.classList.add('is-hidden');
        } else {
          header.classList.remove('is-hidden');
        }
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  function init() {
    initLightbox();
    initHoverPreviews();
    initBounceLoop();
    initRoadsParallax();
    initSlideshow();
    initServicesHoverPreview();
    initHubMap();
    initCityMorph();
    initAccordion();
    initSmartHeader();
    initVideoCursor();
    initPhotoCursor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
