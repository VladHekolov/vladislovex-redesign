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

/* Load the experimental experience after the stable site bundle. Keeping it separate makes rollback instant. */
(function loadExperienceV2() {
  var experienceStyles = document.createElement('link');
  experienceStyles.rel = 'stylesheet';
  experienceStyles.href = '/assets/css/experience-v2.css?v=20260801-2';
  document.head.appendChild(experienceStyles);

  var portraitFixStyles = document.createElement('link');
  portraitFixStyles.rel = 'stylesheet';
  portraitFixStyles.href = '/assets/css/hero-portrait-fix.css?v=20260801-1';
  document.head.appendChild(portraitFixStyles);

  var runnerStyles = document.createElement('link');
  runnerStyles.rel = 'stylesheet';
  runnerStyles.href = '/assets/css/runner-game.css?v=20260801-1';
  document.head.appendChild(runnerStyles);

  function addRunnerFixScript() {
    var fix = document.createElement('script');
    fix.src = '/assets/js/runner-game-fix.js?v=20260801-1';
    fix.async = false;
    document.body.appendChild(fix);
  }

  function addRunnerScript() {
    if (document.querySelector('script[data-runner-game]')) return;
    var runnerScript = document.createElement('script');
    runnerScript.src = '/assets/js/runner-game.js?v=20260801-1';
    runnerScript.async = false;
    runnerScript.dataset.runnerGame = 'true';
    runnerScript.addEventListener('load', addRunnerFixScript, { once: true });
    document.body.appendChild(runnerScript);
  }

  function addPortraitFixScript() {
    var fixScript = document.createElement('script');
    fixScript.src = '/assets/js/hero-portrait-fix.js?v=20260801-1';
    fixScript.async = false;
    fixScript.addEventListener('load', addRunnerScript, { once: true });
    fixScript.addEventListener('error', addRunnerScript, { once: true });
    document.body.appendChild(fixScript);
  }

  function addExperienceScript() {
    var experienceScript = document.createElement('script');
    experienceScript.src = '/assets/js/experience-v2.js?v=20260801-2';
    experienceScript.async = false;
    experienceScript.addEventListener('load', addPortraitFixScript, { once: true });
    document.body.appendChild(experienceScript);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addExperienceScript, { once: true });
  } else {
    addExperienceScript();
  }
})();
