/* Public runtime configuration. Never place database passwords or private API keys here. */
/* Homepage CSS is linked synchronously in index.html so the first paint already uses final styles. */
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

(function loadVisualScripts() {
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

  if (document.body && document.body.id === 'top') {
    loadScript('/assets/js/home-copy.js?v=20260716-1', 'data-vh-home-copy');
    loadScript('/assets/js/mobile-cleanup.js?v=20260716-2', 'data-vh-mobile-cleanup');
    loadScript('/assets/js/mobile-benefits-carousel.js?v=20260716-3', 'data-vh-mobile-benefits');
    loadScript('/assets/js/mobile-video-previews.js?v=20260716-2', 'data-vh-mobile-video-previews');
    loadScript('/assets/js/mobile-reviews-autoplay.js?v=20260716-3', 'data-vh-mobile-reviews-autoplay');
    loadScript('/assets/js/mobile-faq-lite.js?v=20260716-1', 'data-vh-mobile-faq-lite');
    loadScript('/assets/js/mobile-offer-fixes.js?v=20260717-1', 'data-vh-mobile-offer-fixes');
  }

  loadScript('/assets/vendor/vh-icons.bundle.js?v=20260716-1', 'data-vh-icon-bundle', function () {
    if (window.VHIcons) loadScript('/assets/js/icons.js?v=20260716-2', 'data-vh-icons-runtime');
  });
})();
