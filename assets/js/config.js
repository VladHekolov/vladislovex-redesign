/* Public runtime configuration. Never place database passwords or private server credentials here. */
/* Homepage CSS is linked synchronously in index.html so the first paint already uses final styles. */
try { localStorage.removeItem('vh-color-theme'); } catch (error) {}
document.documentElement.setAttribute('data-vh-theme', 'dark');
document.documentElement.style.colorScheme = 'dark';

(function applyBrandAssets() {
  'use strict';

  var logoUrl = '/assets/images/logo-vlad.svg?v=20260728-2';
  var faviconUrl = '/favicon.svg?v=20260728-2';
  var brandSelectors = [
    '.vh-premium-logo__image',
    '.vh-site-footer__brand img',
    '.vh-subpage-brand img'
  ].join(',');

  function setFavicon() {
    document.head.querySelectorAll('link[rel~="icon"]').forEach(function (link) {
      link.remove();
    });

    var icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/svg+xml';
    icon.sizes = 'any';
    icon.href = faviconUrl;
    document.head.appendChild(icon);

    var shortcut = document.createElement('link');
    shortcut.rel = 'shortcut icon';
    shortcut.type = 'image/svg+xml';
    shortcut.href = faviconUrl;
    document.head.appendChild(shortcut);

    var mask = document.head.querySelector('link[rel="mask-icon"]');
    if (!mask) {
      mask = document.createElement('link');
      mask.rel = 'mask-icon';
      document.head.appendChild(mask);
    }
    mask.href = logoUrl;
    mask.setAttribute('color', '#f68a1f');
  }

  function isLegacyLogo(src) {
    var raw = String(src || '');
    var normalized = raw.toLowerCase();
    var decoded = normalized;

    try {
      decoded = decodeURIComponent(raw).toLowerCase();
    } catch (error) {}

    return decoded.indexOf('/лого.png') !== -1 ||
      normalized.indexOf('%d0%9b%d0%be%d0%b3%d0%be.png') !== -1 ||
      normalized.indexOf('%d0%bb%d0%be%d0%b3%d0%be.png') !== -1;
  }

  function useNewLogo(image) {
    if (!image) return;
    image.setAttribute('src', logoUrl);
    image.removeAttribute('srcset');
  }

  function replaceBrandLogos(scope) {
    var root = scope || document;

    root.querySelectorAll(brandSelectors).forEach(useNewLogo);

    root.querySelectorAll('img').forEach(function (image) {
      if (isLegacyLogo(image.getAttribute('src'))) useNewLogo(image);
    });
  }

  setFavicon();
  replaceBrandLogos(document);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setFavicon();
      replaceBrandLogos(document);
    }, { once: true });
  }

  window.addEventListener('pageshow', function () {
    setFavicon();
    replaceBrandLogos(document);
  });
})();

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
    loadStyle('/assets/css/home-ui-fixes.css?v=20260728-1', 'data-vh-home-ui-fixes');
    loadScript('/assets/js/home-ui-fixes.js?v=20260723-1', 'data-vh-home-ui-fixes');
    loadScript('/assets/js/home-copy.js?v=20260716-1', 'data-vh-home-copy');
    loadScript('/assets/js/mobile-cleanup.js?v=20260716-2', 'data-vh-mobile-cleanup');
    loadScript('/assets/js/mobile-benefits-carousel.js?v=20260716-3', 'data-vh-mobile-benefits');
    loadScript('/assets/js/mobile-video-previews.js?v=20260716-2', 'data-vh-mobile-video-previews');
    loadScript('/assets/js/mobile-reviews-autoplay.js?v=20260716-3', 'data-vh-mobile-reviews-autoplay');
    loadScript('/assets/js/mobile-faq-lite.js?v=20260716-1', 'data-vh-mobile-faq-lite');
    loadScript('/assets/js/mobile-offer-fixes.js?v=20260717-3', 'data-vh-mobile-offer-fixes');
    loadScript('/assets/js/contact-form-submit.js?v=20260727-4', 'data-vh-contact-form-submit');
  }

  loadScript('/assets/vendor/vh-icons.bundle.js?v=20260716-1', 'data-vh-icon-bundle', function () {
    if (window.VHIcons) loadScript('/assets/js/icons.js?v=20260724-5', 'data-vh-icons-runtime');
  });
})();
