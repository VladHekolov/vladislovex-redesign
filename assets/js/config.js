/* Public runtime configuration. Never place database passwords or private server credentials here. */
/* Homepage CSS is linked synchronously in index.html so the first paint already uses final styles. */
try { localStorage.removeItem('vh-color-theme'); } catch (error) {}
document.documentElement.setAttribute('data-vh-theme', 'dark');
document.documentElement.style.colorScheme = 'dark';

window.VLADISLOVEX_CONFIG = Object.freeze({
  apiBaseUrl: 'https://api.vocava.ru',
  artistSlug: 'vladislav-hekolov',
  leadEndpoint: '/api/public/leads',
  artistsEndpoint: '/api/public/artists',
  repertoireEndpointTemplate: '/api/public/artists/{artistId}/repertoire',
  publicDataCacheTtlMs: 30000,
  publicDataRequestTimeoutMs: 5500,
  leadRequestTimeoutMs: 10000,
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

/* Load experimental visual layers after the stable site bundle. Each layer can be disabled independently. */
(function loadExperienceV2() {
  function addStylesheet(path) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = path;
    document.head.appendChild(link);
  }

  addStylesheet('/assets/css/experience-v2.css?v=20260801-2');
  addStylesheet('/assets/css/hero-portrait-fix.css?v=20260801-1');
  addStylesheet('/assets/css/section-worlds.css?v=20260801-1');

  function addScript(path, onLoad) {
    var script = document.createElement('script');
    script.src = path;
    script.async = false;
    if (onLoad) script.addEventListener('load', onLoad, { once: true });
    document.body.appendChild(script);
  }

  function addPostExperienceScripts() {
    addScript('/assets/js/hero-portrait-fix.js?v=20260801-1');
    addScript('/assets/js/section-worlds.js?v=20260801-1');
  }

  function addExperienceScript() {
    addScript('/assets/js/experience-v2.js?v=20260801-2', addPostExperienceScripts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addExperienceScript, { once: true });
  } else {
    addExperienceScript();
  }
})();