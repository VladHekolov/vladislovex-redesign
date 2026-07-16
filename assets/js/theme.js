/* Dark-theme-only runtime for standalone pages. */
(function initDarkThemeOnly() {
  'use strict';

  var root = document.documentElement;

  function applyDarkTheme() {
    root.setAttribute('data-vh-theme', 'dark');
    root.style.colorScheme = 'dark';
    root.classList.add('vh-theme-ready');

    try { localStorage.removeItem('vh-color-theme'); } catch (error) {}

    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = '#050505';

    document.querySelectorAll('[data-vh-subpage-theme-toggle], [data-vh-theme-toggle]').forEach(function (button) {
      button.remove();
    });

    try {
      window.dispatchEvent(new CustomEvent('vh:themechange', { detail: { theme: 'dark' } }));
    } catch (error) {}
  }

  applyDarkTheme();
  document.addEventListener('DOMContentLoaded', applyDarkTheme, { once: true });

  window.VHTheme = Object.freeze({
    get: function () { return 'dark'; },
    set: applyDarkTheme,
    toggle: applyDarkTheme
  });
}());
