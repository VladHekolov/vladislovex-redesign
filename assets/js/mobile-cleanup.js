/* Final public-site cleanup: dark theme only and removed booking block. */
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

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = '#040404';
  }

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  }
}());
