/* ONES — site behaviour: lightbox (video + gallery, prev/next), filters, hover previews, header hide, accordion, cities */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Lightbox ─────────────────────────────────────────────── */
  var lb = $('#lb'), frame = $('#lb-frame'), lbTitle = $('#lb-title'), lbCount = $('#lb-count');
  var list = [], idx = 0, lastFocus = null;

  function vimeoSrc(id, h) { return 'https://player.vimeo.com/video/' + id + '?' + (h ? 'h=' + h + '&' : '') + 'autoplay=1&title=0&byline=0&portrait=0&dnt=1'; }

  function render() {
    var it = list[idx]; if (!it) return;
    frame.innerHTML = '';
    if (it.type === 'video') {
      var f = document.createElement('iframe');
      f.src = vimeoSrc(it.id, it.h); f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true; f.title = it.title || 'Video';
      frame.appendChild(f);
    } else {
      var img = document.createElement('img'); img.src = it.src; img.alt = it.title || ''; frame.appendChild(img);
      var nx = list[idx + 1]; if (nx && nx.type === 'image') { var pre = new Image(); pre.src = nx.src; }
    }
    lbTitle.textContent = it.title || '';
    lbCount.textContent = list.length > 1 ? (idx + 1) + ' / ' + list.length : '';
    $('[data-lb-prev]').disabled = idx <= 0; $('[data-lb-next]').disabled = idx >= list.length - 1;
    $('[data-lb-prev]').style.display = $('[data-lb-next]').style.display = list.length > 1 ? '' : 'none';
  }
  function open(items, start) {
    list = items; idx = start || 0; lastFocus = document.activeElement;
    lb.hidden = false; lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    render(); $('.lb__close').focus();
  }
  function close() {
    lb.hidden = true; lb.setAttribute('aria-hidden', 'true'); frame.innerHTML = ''; document.body.style.overflow = '';
    if (history.state && history.state.lb) history.back();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function step(d) { var n = idx + d; if (n < 0 || n >= list.length) return; idx = n; render(); }

  function tilesOf(group) { return $$('.tile[data-group="' + group + '"]').filter(function (t) { return !t.classList.contains('is-hidden'); }); }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-vimeo], a[data-gallery], a[data-video-open]');
    if (a) {
      e.preventDefault();
      if (a.hasAttribute('data-video-open')) { open([{ type: 'video', id: a.getAttribute('data-video-open'), h: a.getAttribute('data-vh') || '', title: a.getAttribute('data-title') }], 0); return; }
      if (a.hasAttribute('data-gallery')) {
        // gallery inside a tile → open that tile's images; standalone gallery link → siblings in same container
        var imgs;
        try { imgs = JSON.parse(a.getAttribute('data-gallery')); } catch (err) { imgs = []; }
        if (imgs.length) { open(imgs.map(function (s) { return { type: 'image', src: s, title: a.getAttribute('data-title') }; }), 0); return; }
        var wrap = a.closest('.gallery'); var links = wrap ? $$('a[data-gallery]', wrap) : [a];
        open(links.map(function (l) { return { type: 'image', src: l.getAttribute('href'), title: l.getAttribute('data-title') || '' }; }), links.indexOf(a));
        return;
      }
      // video tile → sequence = visible tiles of the same group
      var tile = a.closest('.tile'); var group = tile ? tile.getAttribute('data-group') : null;
      var seq = group ? tilesOf(group).map(function (t) { return $('a', t); }).filter(function (l) { return l.hasAttribute('data-vimeo'); }) : [a];
      var items = seq.map(function (l) { return { type: 'video', id: l.getAttribute('data-vimeo'), h: l.getAttribute('data-vh') || '', title: l.getAttribute('data-title') }; });
      open(items, Math.max(0, seq.indexOf(a)));
      return;
    }
    if (e.target.closest('[data-lb-close]')) close();
    else if (e.target.closest('[data-lb-prev]')) step(-1);
    else if (e.target.closest('[data-lb-next]')) step(1);
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
  // touch swipe
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; });

  /* ── Filters ──────────────────────────────────────────────── */
  $$('[data-filter-group]').forEach(function (bar) {
    var group = bar.getAttribute('data-filter-group');
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.filter'); if (!b) return;
      $$('.filter', bar).forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var f = b.getAttribute('data-filter');
      $$('.tile[data-group="' + group + '"]').forEach(function (t) {
        var tags = (t.getAttribute('data-tags') || '').split(' ');
        t.classList.toggle('is-hidden', f !== 'all' && tags.indexOf(f) === -1);
      });
    });
  });

  /* ── Hover previews (webm loops) ──────────────────────────── */
  var canHover = window.matchMedia('(hover:hover)').matches;
  $$('.reel__item').forEach(function (item) {
    var v = $('.reel__preview', item); if (!v) return;
    if (!canHover) return;
    item.addEventListener('mouseenter', function () { item.classList.add('is-playing'); var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    item.addEventListener('mouseleave', function () { item.classList.remove('is-playing'); v.pause(); });
  });

  /* ── Custom video cursor: round aperture with a play mark, follows the pointer over tiles (desktop only) ── */
  /* ── Creative cursor: gradient ring with orbiting label. Video = ▶ + "PLAY", photos = + + "VIEW" ── */
  (function initCursor() {
    if (!canHover) return;
    var SEL_VIDEO = '.reel__poster[data-vimeo], [data-video-open], .tile a[href*="/tv-shows/"]';
    var SEL_SELECT = '.city';
    var SEL_PHOTO = '.reel__poster[data-gallery], .gallery a, .roster a, .team__photo';
    var targets = $$(SEL_VIDEO + ', ' + SEL_PHOTO + ', ' + SEL_SELECT); if (!targets.length) return;
    var el = document.createElement('div');
    el.id = 'vid-cursor'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<svg class="vc" viewBox="0 0 100 100">' +
        '<defs><linearGradient id="vcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FCFF5"/><stop offset=".4" stop-color="#AFB5DE"/><stop offset=".75" stop-color="#E18DAC"/><stop offset="1" stop-color="#F2A1A1"/></linearGradient>' +
        '<path id="vcp" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0"/></defs>' +
        '<circle class="vc__ring" cx="50" cy="50" r="47" fill="none" stroke="url(#vcg)" stroke-width="2"/>' +
        '<g class="vc__orbit"><text class="vc__label"><textPath href="#vcp" startOffset="0"><tspan class="vc__t"></tspan></textPath></text></g>' +
        '<polygon class="vc__play" points="42,36 66,50 42,64" fill="#fff"/>' +
        '<g class="vc__plus" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><line x1="50" y1="40" x2="50" y2="60"/><line x1="40" y1="50" x2="60" y2="50"/></g>' +
        '<circle class="vc__sel-ring" cx="50" cy="50" r="16" fill="none" stroke="url(#vcg)" stroke-width="1.5"/>' +
        '<circle class="vc__sel-dot" cx="50" cy="50" r="5" fill="url(#vcg)"/>' +
      '</svg>';
    document.body.appendChild(el);
    var label = el.querySelector('.vc__t');
    var R = 44, tx = 0, ty = 0, cx = 0, cy = 0, hovering = false, running = false;
    function loop() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      el.style.transform = 'translate3d(' + (cx - R) + 'px,' + (cy - R) + 'px,0)';
      if (hovering || Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) requestAnimationFrame(loop); else running = false;
    }
    function start() { if (!running) { running = true; requestAnimationFrame(loop); } }
    document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (hovering && lb.hidden) { el.classList.add('is-active'); start(); } }, { passive: true });
    targets.forEach(function (t) {
      var mode = t.matches(SEL_SELECT) ? 'select' : t.matches(SEL_VIDEO) ? 'video' : 'photo';
      t.addEventListener('mouseenter', function (e) {
        hovering = true; tx = cx = e.clientX; ty = cy = e.clientY;
        el.classList.toggle('is-video', mode === 'video'); el.classList.toggle('is-photo', mode === 'photo'); el.classList.toggle('is-select', mode === 'select');
        label.textContent = mode === 'video' ? 'PLAY · PLAY · PLAY · PLAY · ' : mode === 'photo' ? 'VIEW · VIEW · VIEW · VIEW · ' : '';
        if (lb.hidden) el.classList.add('is-active'); start();
      });
      t.addEventListener('mouseleave', function () { hovering = false; el.classList.remove('is-active'); });
    });
    document.addEventListener('mouseleave', function () { hovering = false; el.classList.remove('is-active'); });
    document.addEventListener('click', function () { el.classList.remove('is-active'); }, true);
  })();

  /* ── Header: hide on scroll down, show on scroll up ── */
  var header = $('.site-header'), lastY = window.scrollY;
  if (header) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (Math.abs(y - lastY) < 4) return;
      header.classList.toggle('is-hidden', y > lastY && y > 80);
      lastY = y;
    }, { passive: true });
  }

  /* ── Accordion ────────────────────────────────────────────── */
  $$('.acc__head').forEach(function (h) {
    h.addEventListener('click', function () {
      var on = h.getAttribute('aria-expanded') === 'true';
      $$('.acc__head').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); x.closest('.acc__item').classList.remove('is-open'); });
      if (!on) { h.setAttribute('aria-expanded', 'true'); h.closest('.acc__item').classList.add('is-open'); }
    });
  });

  /* ── Cities: whole tile is a link; make sure videos play ─── */
  $$('.city__video').forEach(function (v) { var p = v.play && v.play(); if (p && p.catch) p.catch(function () {}); });

  /* ── Hub pins (from the WEB ONES draft) ───────────────────── */
  var map = $('.hub__map');
  if (map) {
    var pins = $$('.hub__pin', map), active = null;
    function setActive(pin) { pins.forEach(function (p) { p.setAttribute('aria-expanded', p === pin ? 'true' : 'false'); p.classList.toggle('is-active', p === pin); }); active = pin; }
    pins.forEach(function (p) { p.addEventListener('click', function (e) { e.stopPropagation(); setActive(active === p ? null : p); }); });
    document.addEventListener('click', function () { if (active) setActive(null); });
  }
})();
