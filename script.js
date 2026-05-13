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
  function init() {
    initLightbox();
    initHoverPreviews();
    initBounceLoop();
    initRoadsParallax();
    initSlideshow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
