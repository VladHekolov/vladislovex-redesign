/* Public runtime configuration. Never place database passwords or private API keys here. */
try { localStorage.removeItem('vh-color-theme'); } catch (error) {}
document.documentElement.setAttribute('data-vh-theme', 'dark');
document.documentElement.style.colorScheme = 'dark';

window.VLADISLOVEX_CONFIG = Object.freeze({
  apiBaseUrl: 'https://vladhekolov-vocava-platform-0623.twc1.net',
  artistSlug: 'vladislav-hekolov',
  leadEndpoint: '/api/public/leads',
  artistsEndpoint: '/api/public/artists',
  repertoireEndpointTemplate: '/api/public/artists/{artistId}/repertoire',
  publicDataCacheTtlMs: 30000,
  publicDataRequestTimeoutMs: 5500,
  useVocavaApi: true,
  formSubmitFallbackEnabled: true
});

(function loadVisualAssets() {
  function loadStylesheet(href, marker) {
    if (document.querySelector('link[' + marker + ']')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, '');
    document.head.appendChild(link);
  }

  function loadScript(src, marker, onload) {
    var existing = document.querySelector('script[' + marker + ']');
    if (existing) {
      if (typeof onload === 'function') {
        if (existing.dataset.loaded === 'true') onload();
        else existing.addEventListener('load', onload, { once: true });
      }
      return;
    }

    var script = document.createElement('script');
    script.src = src;
    script.setAttribute(marker, '');
    script.addEventListener('load', function () {
      script.dataset.loaded = 'true';
      if (typeof onload === 'function') onload();
    }, { once: true });
    document.head.appendChild(script);
  }

  loadStylesheet('/assets/css/design-tokens.css?v=20260716-2', 'data-vh-design-tokens');
  loadStylesheet('/assets/css/typography.css?v=20260716-1', 'data-vh-typography');
  loadStylesheet('/assets/css/components.css?v=20260716-1', 'data-vh-components');
  loadStylesheet('/assets/css/themes.css?v=20260716-1', 'data-vh-themes');
  loadStylesheet('/assets/css/icons.css?v=20260716-2', 'data-vh-icons');

  var isHomepage = document.body && document.body.id === 'top';
  if (isHomepage) {
    loadStylesheet('/assets/css/home-system.css?v=20260716-1', 'data-vh-home-system');
    loadStylesheet('/assets/css/visual-fixes.css?v=20260716-3', 'data-vh-visual-fixes');
    loadStylesheet('/assets/css/mobile-layout.css?v=20260716-1', 'data-vh-mobile-layout');
    loadStylesheet('/assets/css/mobile-components.css?v=20260716-1', 'data-vh-mobile-components');
    loadStylesheet('/assets/css/mobile-performance.css?v=20260716-1', 'data-vh-mobile-performance');
    loadStylesheet('/assets/css/mobile-hotfix.css?v=20260716-1', 'data-vh-mobile-hotfix');
    loadStylesheet('/assets/css/mobile-tap-color.css?v=20260716-1', 'data-vh-mobile-tap-color');

    loadScript('/assets/js/home-copy.js?v=20260716-1', 'data-vh-home-copy');
    loadScript('/assets/js/mobile-cleanup.js?v=20260716-2', 'data-vh-mobile-cleanup');
    loadScript('/assets/js/mobile-benefits-carousel.js?v=20260716-2', 'data-vh-mobile-benefits');
    loadScript('/assets/js/mobile-video-previews.js?v=20260716-2', 'data-vh-mobile-video-previews');
    loadScript('/assets/js/mobile-reviews-autoplay.js?v=20260716-3', 'data-vh-mobile-reviews-autoplay');
    loadScript('/assets/js/mobile-faq-lite.js?v=20260716-1', 'data-vh-mobile-faq-lite');
  }

  /* Same delivery principle as VOCAVA: selected icons are bundled with the site. */
  loadScript('/assets/vendor/vh-icons.bundle.js?v=20260716-1', 'data-vh-icon-bundle', function () {
    if (!window.VHIcons) return;
    loadScript('/assets/js/icons.js?v=20260716-2', 'data-vh-icons-runtime');
  });
})();