/* Public runtime configuration. Never place database passwords or private API keys here. */
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

  loadStylesheet('/assets/css/light-theme.css?v=20260716-1', 'data-vh-light-theme');
  loadStylesheet('/assets/css/icons.css?v=20260716-1', 'data-vh-icons');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    loadIconRuntime();
    return;
  }

  var primary = document.createElement('script');
  primary.src = 'https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js';
  primary.crossOrigin = 'anonymous';
  primary.onload = loadIconRuntime;
  primary.onerror = function () {
    var fallback = document.createElement('script');
    fallback.src = 'https://cdn.jsdelivr.net/npm/lucide@0.468.0/dist/umd/lucide.min.js';
    fallback.crossOrigin = 'anonymous';
    fallback.onload = loadIconRuntime;
    document.head.appendChild(fallback);
  };
  document.head.appendChild(primary);

  function loadIconRuntime() {
    if (document.querySelector('script[data-vh-icons-runtime]')) return;
    var runtime = document.createElement('script');
    runtime.src = '/assets/js/icons.js?v=20260716-1';
    runtime.setAttribute('data-vh-icons-runtime', '');
    document.head.appendChild(runtime);
  }
})();
