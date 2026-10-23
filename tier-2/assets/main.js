(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Header shadow once the page scrolls.
  var header = document.querySelector('.site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu.
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
  });

  // Scroll reveal.
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Cover tilt on hover.
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(function (stage) {
      var card = stage.querySelector('.tilt');
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateY(' + (x * 16).toFixed(2) + 'deg) rotateX(' + (-y * 12).toFixed(2) + 'deg) translateZ(20px)';
      });
      stage.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  // Lead magnet email capture.
  // Set data-endpoint on the form (Mailchimp, ConvertKit, Formspree, etc.) to post
  // the address to a real list. Without one, the form unlocks the download directly.
  var STORAGE_KEY = 'awm-free-chapter';
  function remember() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (err) { /* storage unavailable */ }
  }
  function remembered() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (err) { return false; }
  }

  document.querySelectorAll('form[data-lead]').forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var msg = form.querySelector('.form-msg');
    var success = form.parentNode.querySelector('.lead-success');
    var button = form.querySelector('button[type="submit"]');

    function unlock() {
      form.hidden = true;
      success.hidden = false;
    }
    if (remembered()) unlock();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = input.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      input.setAttribute('aria-invalid', String(!valid));
      if (!valid) {
        msg.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }
      msg.textContent = '';
      button.disabled = true;

      var endpoint = form.getAttribute('data-endpoint');
      var request = endpoint
        ? fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        : Promise.resolve();

      request.then(function (res) {
        if (res && !res.ok) throw new Error('Signup failed');
        remember();
        unlock();
      }).catch(function () {
        button.disabled = false;
        msg.textContent = 'Something went wrong. Please try again.';
      });
    });
  });
})();
