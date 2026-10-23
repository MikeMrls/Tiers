(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = root.classList.contains('reduce');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function inView(el, cb, margin) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }, { rootMargin: margin || '0px' }).observe(el);
  }
  function restartAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  // One rAF-batched scroll/resize dispatcher for every scroll-driven effect.
  var scrollFns = [];
  var ticking = false;
  function tick() {
    ticking = false;
    var y = window.pageYOffset;
    var vh = window.innerHeight;
    for (var i = 0; i < scrollFns.length; i++) scrollFns[i](y, vh);
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);

  /* ---------- Menu ---------- */
  var menuBtn = $('.menu-btn');
  var menu = $('#menu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var first = $('nav a', menu); if (first) first.focus({ preventScroll: true }); }
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ---------- Intro (home, once per session) ---------- */
  var intro = $('.intro');
  if (intro) {
    var seen = false;
    try { seen = sessionStorage.getItem('awm-intro') === '1'; } catch (err) { /* storage unavailable */ }
    if (reduce || seen) {
      intro.remove();
    } else {
      try { sessionStorage.setItem('awm-intro', '1'); } catch (err) { /* storage unavailable */ }
      setTimeout(function () {
        intro.classList.add('is-done');
        setTimeout(function () { intro.remove(); }, 1100);
      }, 1900);
    }
  }

  /* ---------- Cursor ---------- */
  if (fine && !reduce) {
    root.classList.add('has-cursor');
    var ring = document.createElement('div');
    var dot = document.createElement('div');
    ring.className = 'cursor';
    dot.className = 'cursor-dot';
    ring.innerHTML = '<span></span>';
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    var ringLabel = ring.firstChild;
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      ring.classList.remove('is-hidden'); dot.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('mouseleave', function () { ring.classList.add('is-hidden'); dot.classList.add('is-hidden'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-cursor], a, button, summary, .place, label');
      var label = t && t.getAttribute('data-cursor');
      ring.classList.toggle('is-label', !!label);
      ring.classList.toggle('is-link', !!t && !label);
      ringLabel.textContent = label || '';
    });
    (function follow() {
      rx = lerp(rx, mx, 0.2); ry = lerp(ry, my, 0.2);
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- Reveals ---------- */
  var revealTargets = $$('[data-reveal], .reveal-cover, [data-split]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero: two histories (spotlight + parallax + letter weight) ---------- */
  var hero = $('[data-spotlight]');
  if (hero && !reduce) {
    var layers = $('.hero-layers', hero);
    var mem = $('.layer-memory', hero);
    var title = $('.hero-title', hero);
    var letters = $$('[data-proximity] span', hero);
    var layerShift = 0, titleShift = 0;
    var tx = hero.clientWidth * 0.62, ty = hero.clientHeight * 0.66;
    var cx = tx, cy = ty, r = 0;
    var lastMove = -1e9;
    var heroVisible = true;
    var centers = [];
    var hint = $('.hero-hint', hero);
    if (hint && !fine) hint.textContent = 'Touch to remember';

    function measureLetters() {
      var hb = hero.getBoundingClientRect();
      centers = letters.map(function (l) {
        var b = l.getBoundingClientRect();
        return { x: b.left + b.width / 2 - hb.left, y: b.top + b.height / 2 - hb.top - titleShift };
      });
    }
    function pointer(e) {
      var b = hero.getBoundingClientRect();
      tx = e.clientX - b.left;
      ty = e.clientY - b.top;
      lastMove = performance.now();
      hero.classList.add('is-touched');
    }
    hero.addEventListener('pointermove', pointer, { passive: true });
    hero.addEventListener('pointerdown', pointer, { passive: true });
    window.addEventListener('resize', measureLetters);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureLetters);
    measureLetters();

    scrollFns.push(function (y, vh) {
      if (y > vh * 1.3) return;
      layerShift = y * 0.18;
      titleShift = y * -0.32;
      layers.style.transform = 'translate3d(0,' + layerShift.toFixed(1) + 'px,0)';
      title.style.transform = 'translate3d(0,' + titleShift.toFixed(1) + 'px,0)';
    });

    function heroLoop(now) {
      if (!heroVisible) return;
      var w = hero.clientWidth, h = hero.clientHeight;
      if (now - lastMove > 2600) {
        var k = now / 1000;
        tx = w * (0.56 + 0.3 * Math.sin(k * 0.45));
        ty = h * (0.66 + 0.14 * Math.sin(k * 0.8 + 1));
      }
      cx = lerp(cx, tx, 0.09);
      cy = lerp(cy, ty, 0.09);
      r = lerp(r, Math.min(200, w * 0.3), 0.04);
      mem.style.setProperty('--x', cx.toFixed(1) + 'px');
      mem.style.setProperty('--y', (cy - layerShift).toFixed(1) + 'px');
      mem.style.setProperty('--r', r.toFixed(1) + 'px');
      for (var i = 0; i < letters.length; i++) {
        var c = centers[i];
        if (!c) continue;
        var d = Math.hypot(c.x - cx, c.y + titleShift - cy);
        var wgt = Math.round(100 + 800 * clamp(1 - d / 280));
        if (letters[i]._w !== wgt) { letters[i]._w = wgt; letters[i].style.fontWeight = wgt; }
      }
      requestAnimationFrame(heroLoop);
    }
    inView(hero, function (v) {
      var was = heroVisible;
      heroVisible = v;
      if (v && !was) requestAnimationFrame(heroLoop);
    });
    requestAnimationFrame(heroLoop);
  }

  /* ---------- Quote: words light up with scroll ---------- */
  $$('[data-words]').forEach(function (q) {
    if (reduce) return;
    var words = $$('.w', q);
    var sec = q.closest('section');
    scrollFns.push(function (y, vh) {
      var b = sec.getBoundingClientRect();
      if (b.bottom < 0 || b.top > vh) return;
      var p = clamp((vh * 0.82 - b.top) / (b.height * 0.75));
      var n = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    });
  });

  /* ---------- Scroll story ---------- */
  $$('[data-story]').forEach(function (story) {
    if (reduce) return;
    var pin = $('.story-pin', story);
    var steps = $$('.story-step', story);
    var bar = $('.story-progress', story);
    var count = $('.story-count', story);
    var current = -1;
    scrollFns.push(function (y, vh) {
      var b = story.getBoundingClientRect();
      if (b.bottom < 0 || b.top > vh) return;
      var p = clamp(-b.top / (b.height - vh));
      var seg = p * steps.length;
      for (var i = 1; i <= 4; i++) pin.style.setProperty('--p' + i, clamp((seg - (i - 1)) * 1.25).toFixed(3));
      bar.style.setProperty('--p', p.toFixed(3));
      var idx = Math.min(steps.length - 1, Math.floor(seg));
      if (idx !== current) {
        current = idx;
        steps.forEach(function (s, j) { s.classList.toggle('is-active', j === idx); });
        count.textContent = '0' + (idx + 1) + ' / 0' + steps.length;
      }
    });
  });

  /* ---------- Generic parallax ---------- */
  $$('[data-parallax]').forEach(function (el) {
    if (reduce) return;
    var f = parseFloat(el.getAttribute('data-parallax')) || 0.1;
    scrollFns.push(function (y, vh) {
      var b = el.parentNode.getBoundingClientRect();
      if (b.bottom < -200 || b.top > vh + 200) return;
      var off = (b.top + b.height / 2 - vh / 2) * f;
      el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
    });
  });

  /* ---------- Timeline progress ---------- */
  $$('[data-timeline]').forEach(function (tl) {
    if (reduce) { tl.style.setProperty('--p', 1); return; }
    scrollFns.push(function (y, vh) {
      var b = tl.getBoundingClientRect();
      tl.style.setProperty('--p', clamp((vh * 0.9 - b.top) / (vh * 0.6)).toFixed(3));
    });
  });

  /* ---------- Cover tilt + glare ---------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(function (card) {
      var frame = $('.frame', card);
      card.addEventListener('pointermove', function (e) {
        var b = card.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width - 0.5;
        var y = (e.clientY - b.top) / b.height - 0.5;
        frame.style.transform = 'rotateY(' + (x * 14).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg) scale(1.02)';
        frame.style.setProperty('--glare', (x * 220).toFixed(0) + '%');
      });
      card.addEventListener('pointerleave', function () {
        frame.style.transform = '';
        frame.style.setProperty('--glare', '-100%');
      });
    });
  }

  /* ---------- Vanishing city map ---------- */
  $$('[data-map]').forEach(function (map) {
    var range = $('input.year', map);
    var yearEl = $('.map-year', map);
    var places = $$('.place', map);
    var card = $('.map-card', map);
    var standingEl = $('[data-standing]', map);
    var lostEl = $('[data-lost]', map);
    var playBtn = $('.map-play', map);
    var min = +range.min, max = +range.max;
    var year = +range.value;
    var active = null;
    var playing = false;
    var lastStep = 0;

    function status(p) {
      var gone = +p.getAttribute('data-gone') || 0;
      if (!gone) return p.getAttribute('data-status') || 'Still standing';
      return year >= gone ? 'Lost in ' + gone : 'Still standing in ' + year;
    }
    function show(p) {
      active = p;
      places.forEach(function (x) { x.classList.toggle('is-active', x === p); });
      card.innerHTML = '';
      var lbl = document.createElement('p');
      lbl.className = 'label';
      lbl.textContent = 'No. ' + p.getAttribute('data-n') + ' · ' + p.getAttribute('data-area');
      var h = document.createElement('h4');
      h.textContent = p.getAttribute('data-name');
      var meta = document.createElement('p');
      meta.className = 'label muted';
      meta.style.marginBottom = '12px';
      meta.textContent = p.getAttribute('data-years') + ' — ' + status(p);
      var note = document.createElement('p');
      note.textContent = p.getAttribute('data-note');
      card.appendChild(lbl); card.appendChild(h); card.appendChild(meta); card.appendChild(note);
      restartAnim(card, 'is-swap');
    }
    function render(fromPlay) {
      yearEl.textContent = year;
      range.value = year;
      range.style.setProperty('--fill', ((year - min) / (max - min) * 100).toFixed(1) + '%');
      range.setAttribute('aria-valuetext', String(year));
      var standing = 0, lost = 0, newlyLost = null;
      places.forEach(function (p) {
        var g = +p.getAttribute('data-gone') || 0;
        var gone = g && year >= g;
        if (gone && !p.classList.contains('gone')) newlyLost = p;
        p.classList.toggle('gone', !!gone);
        if (gone) lost++; else standing++;
      });
      standingEl.textContent = standing;
      lostEl.textContent = lost;
      if (fromPlay && newlyLost) show(newlyLost);
      else if (active) { var meta = card.children[2]; if (meta) meta.textContent = active.getAttribute('data-years') + ' — ' + status(active); }
    }
    function setPlaying(on) {
      playing = on;
      playBtn.setAttribute('aria-pressed', String(on));
      playBtn.setAttribute('aria-label', on ? 'Pause the years' : 'Play through the years');
      playBtn.innerHTML = on
        ? '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3.5" height="12"/><rect x="9.5" y="2" width="3.5" height="12"/></svg>'
        : '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6z"/></svg>';
      if (on) { if (year >= max) { year = min; render(false); } lastStep = 0; requestAnimationFrame(step); }
    }
    function step(now) {
      if (!playing) return;
      if (!lastStep) lastStep = now;
      if (now - lastStep > 110) {
        lastStep = now;
        year = Math.min(max, year + 1);
        render(true);
        if (year >= max) { setPlaying(false); return; }
      }
      requestAnimationFrame(step);
    }

    range.addEventListener('input', function () { if (playing) setPlaying(false); year = +range.value; render(false); });
    playBtn.addEventListener('click', function () { setPlaying(!playing); });
    places.forEach(function (p) {
      p.addEventListener('click', function () { show(p); });
      p.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(p); }
      });
    });

    render(false);
    // Play once automatically the first time the map scrolls into view.
    if (!reduce && 'IntersectionObserver' in window) {
      var auto = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { auto.disconnect(); setTimeout(function () { if (year === min) setPlaying(true); }, 600); }
      }, { threshold: 0.45 });
      auto.observe(map);
    }
  });

  /* ---------- Ordinary objects ---------- */
  $$('[data-objects]').forEach(function (box) {
    var btns = $$('.object', box);
    var note = $('.object-note', box);
    function select(b) {
      if (b.getAttribute('aria-pressed') === 'true') return;
      btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      note.innerHTML = '';
      var lbl = document.createElement('p');
      lbl.className = 'label num';
      lbl.textContent = b.getAttribute('data-essay');
      var q = document.createElement('blockquote');
      q.textContent = b.getAttribute('data-line');
      note.appendChild(lbl); note.appendChild(q);
      restartAnim(note, 'is-swap');
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { select(b); });
      if (fine) b.addEventListener('mouseenter', function () { select(b); });
    });
  });

  /* ---------- Plumb bob: swings with pointer movement ---------- */
  var plumb = $('.plumb');
  if (plumb && !reduce) {
    var ang = 0, vel = 0, lastX = null, plumbOn = false;
    window.addEventListener('pointermove', function (e) {
      if (lastX !== null && plumbOn) vel += clamp((e.clientX - lastX) * 0.01, -0.6, 0.6);
      lastX = e.clientX;
    }, { passive: true });
    var swing = function (now) {
      if (!plumbOn) return;
      vel += -ang * 0.018 + Math.sin(now / 900) * 0.004;
      vel *= 0.985;
      ang = clamp(ang + vel, -32, 32);
      plumb.style.transform = 'rotate(' + ang.toFixed(2) + 'deg)';
      requestAnimationFrame(swing);
    };
    inView(plumb.parentNode, function (v) { var was = plumbOn; plumbOn = v; if (v && !was) requestAnimationFrame(swing); });
  }

  /* ---------- Audiobook sample (device narration) ---------- */
  $$('[data-player]').forEach(function (pl) {
    var btn = $('.play-btn', pl);
    var speedBtn = $('.speed', pl);
    var tc = $('.timecode', pl);
    var tape = $('.tape', pl);
    var transcript = $('.transcript', pl);
    var note = $('.player-note', pl);
    var synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') {
      btn.disabled = true;
      note.textContent = 'This browser cannot play the narration preview. The transcript is below.';
      return;
    }

    var words = [];
    $$('p', transcript).forEach(function (p) {
      var text = p.textContent;
      p.textContent = '';
      text.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { p.appendChild(document.createTextNode(tok)); return; }
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = tok;
        p.appendChild(s);
        words.push(s);
      });
    });
    var sentences = [];
    var cur = [];
    words.forEach(function (w, i) {
      cur.push(i);
      if (/[.!?:;]["”’)]*$/.test(w.textContent)) { sentences.push(cur); cur = []; }
    });
    if (cur.length) sentences.push(cur);

    var rates = [1, 1.25, 0.85];
    var rateIdx = 0;
    var voice = null;
    var si = 0;
    var session = 0;
    var playing = false;
    var WPS = 2.6;

    function pickVoice() {
      var vs = synth.getVoices();
      voice = vs.filter(function (v) { return /en[-_]GB/i.test(v.lang) && /daniel|arthur|oliver|george|male/i.test(v.name); })[0] ||
        vs.filter(function (v) { return /en[-_]GB/i.test(v.lang); })[0] ||
        vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
    }
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);

    function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function mark(i) {
      for (var j = 0; j < words.length; j++) {
        words[j].classList.toggle('said', j < i);
        words[j].classList.toggle('now', j === i);
      }
      var rate = rates[rateIdx];
      tape.style.setProperty('--p', (Math.min(i, words.length) / words.length).toFixed(3));
      tc.innerHTML = fmt(i / (WPS * rate)) + ' <small>/ ' + fmt(words.length / (WPS * rate)) + '</small>';
      var w = words[i];
      if (w) {
        var top = w.offsetTop - transcript.offsetTop;
        if (top < transcript.scrollTop + 40 || top > transcript.scrollTop + transcript.clientHeight - 80) {
          transcript.scrollTo({ top: Math.max(0, top - 80), behavior: 'smooth' });
        }
      }
    }
    function speak() {
      if (si >= sentences.length) { stop(); si = 0; mark(words.length); return; }
      var token = ++session;
      var idxs = sentences[si];
      var offsets = [];
      var pos = 0;
      var text = idxs.map(function (i) { offsets.push(pos); pos += words[i].textContent.length + 1; return words[i].textContent; }).join(' ');
      var u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-GB'; }
      u.rate = rates[rateIdx] * 0.92;
      u.pitch = 0.92;
      u.onstart = function () { if (token === session) mark(idxs[0]); };
      u.onboundary = function (e) {
        if (token !== session || (e.name && e.name !== 'word')) return;
        var k = 0;
        while (k + 1 < offsets.length && offsets[k + 1] <= e.charIndex) k++;
        mark(idxs[k]);
      };
      u.onend = function () { if (token !== session || !playing) return; si++; speak(); };
      u.onerror = function (e) { if (token !== session || e.error === 'interrupted' || e.error === 'canceled') return; stop(); };
      synth.speak(u);
    }
    function play() {
      playing = true;
      pl.classList.add('is-playing');
      btn.setAttribute('aria-label', 'Pause narration');
      synth.cancel();
      speak();
    }
    function stop() {
      playing = false;
      session++;
      pl.classList.remove('is-playing');
      btn.setAttribute('aria-label', 'Play narration');
      synth.cancel();
    }
    btn.addEventListener('click', function () { if (playing) stop(); else play(); });
    speedBtn.addEventListener('click', function () {
      rateIdx = (rateIdx + 1) % rates.length;
      speedBtn.textContent = rates[rateIdx] + '×';
      if (playing) play();
      else mark(sentences[si] ? sentences[si][0] : 0);
    });
    $$('.w', transcript).forEach(function (w, i) {
      w.addEventListener('click', function () {
        for (var s = 0; s < sentences.length; s++) if (sentences[s].indexOf(i) !== -1) { si = s; break; }
        if (playing) play(); else mark(sentences[si][0]);
      });
    });
    window.addEventListener('pagehide', function () { synth.cancel(); });
    mark(0);
    words[0].classList.remove('now');
  });

  /* ---------- Character cards ---------- */
  $$('.card').forEach(function (c) {
    c.addEventListener('click', function () {
      c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    });
  });

  /* ---------- Letterbox: lead magnet signup ---------- */
  // Set data-endpoint on the form (Mailchimp, ConvertKit, Formspree, etc.) to
  // send the address to a real list. Without one the download unlocks directly.
  var KEY = 'awm-free-chapter';
  function remembered() { try { return localStorage.getItem(KEY) === '1'; } catch (err) { return false; } }
  function remember() { try { localStorage.setItem(KEY, '1'); } catch (err) { /* storage unavailable */ } }
  $$('form[data-letterbox]').forEach(function (form) {
    var box = form.closest('.letterbox');
    var envelope = $('.envelope', box);
    var done = $('.signup-done', box);
    var input = $('input[type="email"]', form);
    var msg = $('.form-msg', form);
    var button = $('button[type="submit"]', form);
    function open() { form.hidden = true; done.hidden = false; envelope.classList.add('is-open'); }
    if (remembered()) open();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok) { msg.textContent = 'That address doesn’t look quite right.'; input.focus(); return; }
      msg.textContent = '';
      button.disabled = true;
      var endpoint = form.getAttribute('data-endpoint');
      var req = endpoint
        ? fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        : Promise.resolve();
      req.then(function (res) {
        if (res && !res.ok) throw new Error('Signup failed');
        remember();
        open();
      }).catch(function () {
        button.disabled = false;
        msg.textContent = 'Something went wrong. Please try again.';
      });
    });
  });

  requestTick();
})();
