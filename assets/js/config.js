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

/* Load the light-theme redesign after the main stylesheet so its scoped rules win safely. */
(function loadLightThemeStyles() {
  if (document.querySelector('link[data-vh-light-theme]')) return;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/light-theme.css?v=20260716-1';
  link.setAttribute('data-vh-light-theme', '');
  document.head.appendChild(link);
})();
