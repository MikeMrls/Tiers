/*
 * Single-entry navigation.
 *
 * Each tier opens in a fresh tab, which starts with no back history. Every
 * internal link on the tier sites replaces the current history entry instead
 * of adding one, and in-page anchors scroll without pushing a hash. The tab
 * therefore never gains a previous entry and the browser's back button stays
 * disabled. External links (retailers, socials) open in a new tab.
 *
 * Pages that want an exit transition set data-leave="<ms>" on <html>; the
 * class "is-leaving" is added for that long before navigating.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function headerOffset() {
    var h = document.querySelector('[data-sticky-header]');
    return h ? h.getBoundingClientRect().height : 0;
  }

  function scrollToHash(hash) {
    var id = decodeURIComponent((hash || '').replace(/^#/, ''));
    var el = id ? document.getElementById(id) : null;
    var top = el ? el.getBoundingClientRect().top + window.pageYOffset - headerOffset() : 0;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    history.replaceState(history.state, '', id ? '#' + id : location.pathname + location.search);
    if (el) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  }

  function go(href) {
    var delay = parseInt(document.documentElement.getAttribute('data-leave') || '0', 10);
    if (delay > 0 && !reduceMotion.matches) {
      document.documentElement.classList.add('is-leaving');
      window.setTimeout(function () { location.replace(href); }, delay);
    } else {
      location.replace(href);
    }
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.hasAttribute('download')) return;
    if (a.target && a.target !== '_self') return;

    var url = new URL(a.getAttribute('href'), location.href);
    if (url.protocol !== location.protocol || url.host !== location.host) return;

    e.preventDefault();
    var samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage) {
      scrollToHash(url.hash);
    } else {
      go(url.href);
    }
  });

  // A page restored from the back-forward cache should not stay faded out.
  window.addEventListener('pageshow', function () {
    document.documentElement.classList.remove('is-leaving');
  });

  window.Stay = { go: go, scrollToHash: scrollToHash };
})();
