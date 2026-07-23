/* Homepage behavior fixes — 2026-07-23. */
(function () {
  'use strict';

  var OLD_EMAIL = 'hekoloff@yandex.ru';
  var NEW_EMAIL = 'hello@vocava.ru';

  function replaceContactEmail() {
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href.toLowerCase().indexOf(OLD_EMAIL) !== -1) {
        link.setAttribute('href', href.replace(new RegExp(OLD_EMAIL, 'ig'), NEW_EMAIL));
      }
    });

    if (!document.body || !window.NodeFilter) return;

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;

    while ((node = walker.nextNode())) {
      var parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/i.test(parent.tagName)) continue;
      if (node.nodeValue && node.nodeValue.toLowerCase().indexOf(OLD_EMAIL) !== -1) {
        node.nodeValue = node.nodeValue.replace(new RegExp(OLD_EMAIL, 'ig'), NEW_EMAIL);
      }
    }
  }

  function keepNativeDatePickerOpenUntilSelection() {
    ['vhCalcDate', 'vhContactDate'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input || input.dataset.vhSinglePickerClick === 'true') return;

      input.dataset.vhSinglePickerClick = 'true';
      input.setAttribute('autocomplete', 'off');

      /*
       * app.js already opens the picker from the calendar button. On a direct
       * input click the browser opens its native picker itself, so the extra
       * showPicker() call from app.js can toggle it closed immediately.
       */
      input.addEventListener('click', function (event) {
        event.stopImmediatePropagation();
      }, true);
    });
  }

  function isMobileDevice() {
    var coarsePointer = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
    return window.innerWidth <= 860 || coarsePointer;
  }

  function eagerlyLoadMobileVideos() {
    document.querySelectorAll('.vh-video-card__preview').forEach(function (video) {
      video.preload = 'auto';
      video.setAttribute('preload', 'auto');
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      try { video.load(); } catch (error) {}
    });
  }

  function eagerlyLoadReviewImages(root) {
    if (!root) return;

    root.querySelectorAll('.vh-reviews-3d__item img').forEach(function (image, index) {
      var deferred = image.getAttribute('data-src') || image.dataset.src;
      if (!image.getAttribute('src') && deferred) image.setAttribute('src', deferred);

      image.loading = 'eager';
      image.setAttribute('loading', 'eager');
      image.decoding = 'async';
      image.setAttribute('decoding', 'async');
      image.setAttribute('fetchpriority', index === 0 ? 'high' : 'auto');
    });
  }

  function eagerlyLoadMobileMedia() {
    if (!isMobileDevice()) return;

    eagerlyLoadMobileVideos();

    var reviews = document.getElementById('reviews');
    if (!reviews) return;

    eagerlyLoadReviewImages(reviews);

    if (reviews.dataset.vhEagerMediaObserver === 'true' || !window.MutationObserver) return;
    reviews.dataset.vhEagerMediaObserver = 'true';

    new MutationObserver(function () {
      eagerlyLoadReviewImages(reviews);
    }).observe(reviews, { childList: true, subtree: true });
  }

  function init() {
    replaceContactEmail();
    keepNativeDatePickerOpenUntilSelection();
    eagerlyLoadMobileMedia();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
