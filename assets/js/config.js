/* Public runtime configuration. Never place database passwords or private server credentials here. */
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
  formSubmitFallbackEnabled: true,
  openRouteServiceRoute: Object.freeze({
    enabled: true,
    /* The server reads OPENROUTESERVICE_API_KEY; no routing key is exposed in the browser. */
    endpoint: '/api/public/route-distance',
    requestTimeoutMs: 9000,
    cacheTtlMs: 10 * 60 * 1000,
    /* The road-price buckets are applied to the approximate round trip. */
    tariffBands: Object.freeze([
      Object.freeze({ maxRoundTripKm: 40, category: 'inside', price: 0 }),
      Object.freeze({ maxRoundTripKm: 70, category: 'to20', price: 3000 }),
      Object.freeze({ maxRoundTripKm: 100, category: 'to35', price: 4000 }),
      Object.freeze({ maxRoundTripKm: 150, category: 'to50', price: 5000 }),
      Object.freeze({ maxRoundTripKm: 200, category: 'to75', price: 6000 }),
      Object.freeze({ maxRoundTripKm: 260, category: 'to100', price: 7000 }),
      Object.freeze({ maxRoundTripKm: 320, category: 'to130', price: 8000 }),
      Object.freeze({ maxRoundTripKm: Infinity, category: 'far', price: 9000 })
    ])
  })
});

/* Load synchronously before app.js so the adapter can intercept the final DaData address lookup. */
(function loadOpenRouteServiceAdapter() {
  var routeConfig = window.VLADISLOVEX_CONFIG && window.VLADISLOVEX_CONFIG.openRouteServiceRoute;
  if (!routeConfig || !routeConfig.enabled) return;
  document.write('<script src="/assets/js/route-distance-openrouteservice.js?v=20260720-2"></script>');
})();

(function loadVisualScripts() {
  function loadStyle(href, marker) {
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

  if (document.body && document.body.id === 'top') {
    loadStyle('/assets/css/home-ui-fixes.css?v=20260724-2', 'data-vh-home-ui-fixes');
    loadScript('/assets/js/home-ui-fixes.js?v=20260723-1', 'data-vh-home-ui-fixes');
    loadScript('/assets/js/home-copy.js?v=20260716-1', 'data-vh-home-copy');
    loadScript('/assets/js/mobile-cleanup.js?v=20260716-2', 'data-vh-mobile-cleanup');
    loadScript('/assets/js/mobile-benefits-carousel.js?v=20260716-3', 'data-vh-mobile-benefits');
    loadScript('/assets/js/mobile-video-previews.js?v=20260716-2', 'data-vh-mobile-video-previews');
    loadScript('/assets/js/mobile-reviews-autoplay.js?v=20260716-3', 'data-vh-mobile-reviews-autoplay');
    loadScript('/assets/js/mobile-faq-lite.js?v=20260716-1', 'data-vh-mobile-faq-lite');
    loadScript('/assets/js/mobile-offer-fixes.js?v=20260717-3', 'data-vh-mobile-offer-fixes');
  }

  loadScript('/assets/vendor/vh-icons.bundle.js?v=20260716-1', 'data-vh-icon-bundle', function () {
    if (window.VHIcons) loadScript('/assets/js/icons.js?v=20260716-2', 'data-vh-icons-runtime');
  });
})();
