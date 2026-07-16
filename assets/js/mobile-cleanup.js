/* Final public-site cleanup: dark theme only, simplified calculator and local arrows. */
(function () {
  'use strict';

  function apply() {
    var root = document.documentElement;
    root.setAttribute('data-vh-theme', 'dark');
    root.style.colorScheme = 'dark';

    try { localStorage.removeItem('vh-color-theme'); } catch (error) {}

    document.querySelectorAll('[data-vh-theme-toggle], [data-vh-subpage-theme-toggle]').forEach(function (node) {
      node.remove();
    });

    var booking = document.getElementById('booking');
    if (booking) booking.remove();

    document.querySelectorAll('a[href="#booking"]').forEach(function (link) {
      link.remove();
    });

    var durationText = document.getElementById('vhCalcDurationText');
    if (durationText) {
      durationText.removeAttribute('role');
      durationText.removeAttribute('tabindex');
      durationText.removeAttribute('title');
      durationText.setAttribute('aria-live', 'polite');
    }

    var durationScale = document.querySelector('.vh-price-calc__range-scale');
    if (durationScale && durationScale.lastElementChild) {
      durationScale.lastElementChild.textContent = '5';
    }

    document.querySelectorAll('.vh-contact-card__arrow').forEach(function (arrow) {
      if (arrow.querySelector('[data-vh-icon="arrow-right"], [data-vh-icon-name="arrow-right"]')) return;
      arrow.textContent = '';
      var placeholder = document.createElement('i');
      placeholder.setAttribute('data-vh-icon', 'arrow-right');
      placeholder.setAttribute('aria-hidden', 'true');
      arrow.appendChild(placeholder);
    });

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = '#040404';

    if (typeof window.VHRefreshIcons === 'function') window.VHRefreshIcons();
  }

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  }
  window.addEventListener('load', apply, { once: true });
}());
