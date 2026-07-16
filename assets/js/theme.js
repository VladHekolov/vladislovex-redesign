/* Shared theme runtime for standalone pages.
   The main page keeps its existing handler for now; all pages use the same storage key. */
(function initSharedTheme() {
  'use strict';

  var STORAGE_KEY = 'vh-color-theme';
  var root = document.documentElement;

  function readTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch (error) {
      return 'dark';
    }
  }

  function updateThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'light' ? '#f5f0e8' : '#050505';
  }

  function updateControls(theme) {
    var isLight = theme === 'light';
    document.querySelectorAll('[data-vh-subpage-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      button.setAttribute('aria-label', isLight ? 'Включить тёмную тему' : 'Включить светлую тему');
      var label = button.querySelector('[data-vh-theme-label]');
      if (label) label.textContent = isLight ? 'Тёмная тема' : 'Светлая тема';
      var sun = button.querySelector('[data-vh-theme-sun]');
      var moon = button.querySelector('[data-vh-theme-moon]');
      if (sun) sun.hidden = isLight;
      if (moon) moon.hidden = !isLight;
    });
  }

  function apply(theme, persist) {
    var next = theme === 'light' ? 'light' : 'dark';
    root.setAttribute('data-vh-theme', next);
    root.style.colorScheme = next;
    updateThemeColor(next);
    updateControls(next);
    root.classList.add('vh-theme-ready');

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, next); } catch (error) {}
    }

    try {
      window.dispatchEvent(new CustomEvent('vh:themechange', { detail: { theme: next } }));
    } catch (error) {}
  }

  function createSubpageToggle() {
    if (!document.body || !document.body.classList.contains('vh-subpage')) return;
    if (document.querySelector('[data-vh-subpage-theme-toggle]')) return;

    var header = document.querySelector('.vh-subpage-header__inner');
    if (!header) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'vh-subpage-theme-toggle vh-button vh-button--sm vh-button--ghost';
    button.setAttribute('data-vh-subpage-theme-toggle', '');
    button.innerHTML =
      '<span class="vh-subpage-theme-toggle__icon" aria-hidden="true">' +
        '<i data-vh-icon="sun" data-vh-theme-sun></i>' +
        '<i data-vh-icon="moon" data-vh-theme-moon hidden></i>' +
      '</span>' +
      '<span class="vh-subpage-theme-toggle__label" data-vh-theme-label>Светлая тема</span>';
    header.appendChild(button);
    updateControls(root.getAttribute('data-vh-theme') || readTheme());

    if (typeof window.VHRefreshIcons === 'function') window.VHRefreshIcons();
  }

  apply(readTheme(), false);

  document.addEventListener('DOMContentLoaded', function () {
    createSubpageToggle();
    updateControls(root.getAttribute('data-vh-theme') || readTheme());
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-vh-subpage-theme-toggle]');
    if (!button) return;
    event.preventDefault();
    apply(root.getAttribute('data-vh-theme') === 'light' ? 'dark' : 'light', true);
  });

  window.VHTheme = Object.freeze({
    get: function () { return root.getAttribute('data-vh-theme') || readTheme(); },
    set: function (theme) { apply(theme, true); },
    toggle: function () { apply(root.getAttribute('data-vh-theme') === 'light' ? 'dark' : 'light', true); }
  });
}());
