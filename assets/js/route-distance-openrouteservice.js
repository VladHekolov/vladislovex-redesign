/* Server-backed route-distance adapter for the static price calculator. */
(function () {
  'use strict';

  var rootConfig = window.VLADISLOVEX_CONFIG || {};
  var config = rootConfig.openRouteServiceRoute;
  if (!config || !config.enabled) return;

  var nativeFetch = window.fetch && window.fetch.bind(window);
  var routeCache = new Map();
  var patchingDom = false;

  if (!nativeFetch) return;

  function resolveEndpoint() {
    var configured = String(config.endpoint || '/api/public/route-distance').trim();
    if (/^https?:\/\//i.test(configured)) return configured;

    var base = String(rootConfig.apiBaseUrl || '').trim().replace(/\/$/, '');
    if (!base) return '';
    return base + '/' + configured.replace(/^\//, '');
  }

  var endpoint = resolveEndpoint();

  function isConfigured() {
    return /^https?:\/\//i.test(endpoint);
  }

  function parseRequestBody(init) {
    if (!init || typeof init.body !== 'string') return null;
    try {
      return JSON.parse(init.body);
    } catch (error) {
      return null;
    }
  }

  function isDadataAddressRequest(input) {
    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    return url.indexOf('suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address') !== -1;
  }

  function roundToHalf(value) {
    return Math.round(Number(value) * 2) / 2;
  }

  function formatKm(value) {
    return String(roundToHalf(value)).replace('.', ',');
  }

  function formatMoney(value) {
    return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  function getTariffBand(roundTripKm) {
    var bands = Array.isArray(config.tariffBands) ? config.tariffBands : [];
    for (var i = 0; i < bands.length; i += 1) {
      if (roundTripKm <= Number(bands[i].maxRoundTripKm)) return bands[i];
    }
    return { category: 'far', price: 9000 };
  }

  function getSyntheticBeltwayDistance(category) {
    var values = {
      inside: 0,
      to20: 20,
      to35: 35,
      to50: 50,
      to75: 75,
      to100: 100,
      to130: 130,
      far: 131
    };
    return Object.prototype.hasOwnProperty.call(values, category) ? values[category] : 131;
  }

  function getCacheKey(lat, lon) {
    return [Number(lat).toFixed(5), Number(lon).toFixed(5)].join(':');
  }

  function getCachedRoute(lat, lon) {
    var key = getCacheKey(lat, lon);
    var item = routeCache.get(key);
    if (!item) return null;

    if (Date.now() - item.savedAt > Number(config.cacheTtlMs || 600000)) {
      routeCache.delete(key);
      return null;
    }

    return item.value;
  }

  function saveCachedRoute(lat, lon, value) {
    routeCache.set(getCacheKey(lat, lon), {
      savedAt: Date.now(),
      value: value
    });
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    if (typeof AbortController !== 'function') return nativeFetch(url, options);

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    var requestOptions = Object.assign({}, options, { signal: controller.signal });

    return nativeFetch(url, requestOptions).finally(function () {
      clearTimeout(timer);
    });
  }

  function parseBackendRoute(payload) {
    var route = payload && payload.ok ? payload.route : null;
    if (!route) throw new Error('route_backend_invalid_response');

    var oneWayKm = Number(route.oneWayKm);
    var roundTripKm = Number(route.roundTripKm);
    var durationSeconds = Number(route.durationSeconds);

    if (!Number.isFinite(oneWayKm) || oneWayKm <= 0) {
      var distanceMeters = Number(route.distanceMeters);
      if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
        throw new Error('route_backend_distance_missing');
      }
      oneWayKm = distanceMeters / 1000;
    }

    if (!Number.isFinite(roundTripKm) || roundTripKm <= 0) roundTripKm = oneWayKm * 2;

    return {
      source: route.source || 'openrouteservice',
      originLabel: route.originLabel || 'Точка выезда',
      oneWayKm: oneWayKm,
      roundTripKm: roundTripKm,
      oneWayMinutes: Number.isFinite(durationSeconds) && durationSeconds > 0
        ? durationSeconds / 60
        : null
    };
  }

  function requestRoute(destinationLat, destinationLon) {
    var cached = getCachedRoute(destinationLat, destinationLon);
    if (cached) return Promise.resolve(cached);

    return fetchWithTimeout(endpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        lat: Number(destinationLat),
        lon: Number(destinationLon)
      })
    }, Number(config.requestTimeoutMs || 9000))
      .then(function (response) {
        if (!response.ok) throw new Error('route_backend_http_' + response.status);
        return response.json();
      })
      .then(function (payload) {
        var parsed = parseBackendRoute(payload);
        var band = getTariffBand(parsed.roundTripKm);
        var value = {
          source: parsed.source,
          originLabel: parsed.originLabel,
          oneWayKm: parsed.oneWayKm,
          roundTripKm: parsed.roundTripKm,
          oneWayMinutes: parsed.oneWayMinutes,
          category: band.category,
          price: Number(band.price || 0),
          calculatedAt: Date.now()
        };

        saveCachedRoute(destinationLat, destinationLon, value);
        return value;
      });
  }

  function cloneJsonResponse(payload, originalResponse) {
    return new Response(JSON.stringify(payload), {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }

  function enrichFinalDadataResponse(response) {
    return response.clone().json().then(function (payload) {
      var suggestion = payload && Array.isArray(payload.suggestions) ? payload.suggestions[0] : null;
      var data = suggestion && suggestion.data ? suggestion.data : null;
      var lat = data ? Number(data.geo_lat) : NaN;
      var lon = data ? Number(data.geo_lon) : NaN;

      if (!data || !Number.isFinite(lat) || !Number.isFinite(lon)) return response;

      return requestRoute(lat, lon).then(function (routeInfo) {
        window.VH_ROUTE_INFO = routeInfo;
        data.beltway_hit = routeInfo.category === 'inside' ? 'IN_MKAD' : 'OUT_MKAD';
        data.beltway_distance = getSyntheticBeltwayDistance(routeInfo.category);
        data.vh_route_source = routeInfo.source;
        data.vh_route_one_way_km = routeInfo.oneWayKm;
        data.vh_route_round_trip_km = routeInfo.roundTripKm;
        data.vh_route_duration_minutes = routeInfo.oneWayMinutes;
        return cloneJsonResponse(payload, response);
      }).catch(function () {
        window.VH_ROUTE_INFO = null;
        return response;
      });
    }).catch(function () {
      return response;
    });
  }

  window.fetch = function (input, init) {
    var responsePromise = nativeFetch(input, init);

    if (!isConfigured() || !isDadataAddressRequest(input)) return responsePromise;

    var requestBody = parseRequestBody(init);
    var isFinalLookup = requestBody && Number(requestBody.count || 0) === 1;
    if (!isFinalLookup) return responsePromise;

    return responsePromise.then(enrichFinalDadataResponse);
  };

  function getRoadSummary(info) {
    if (!info) return '';

    var priceText = info.price > 0 ? '+' + formatMoney(info.price) : 'без доплаты';
    var timeText = Number.isFinite(info.oneWayMinutes)
      ? ', около ' + Math.max(1, Math.round(info.oneWayMinutes)) + ' мин в одну сторону'
      : '';

    return 'Маршрут по дорогам: около ' + formatKm(info.oneWayKm) +
      ' км в одну сторону (≈' + formatKm(info.roundTripKm) + ' км туда и обратно)' +
      timeText + '. Дорога: ' + priceText + '.';
  }

  function getRoadLabel(info) {
    return '≈' + formatKm(info.oneWayKm) + ' км в одну сторону, ≈' +
      formatKm(info.roundTripKm) + ' км туда и обратно';
  }

  function patchOfferText(text) {
    var info = window.VH_ROUTE_INFO;
    if (!info || typeof text !== 'string') return text;

    var priceText = info.price > 0 ? formatMoney(info.price) : 'Без доплаты';
    var routeLine = '• Дорога: ' + getRoadLabel(info) + ', ' + priceText;
    var breakdownLine = '• Дорога — ' + (info.price > 0 ? '+' + formatMoney(info.price) : 'без доплаты') +
      ' (' + getRoadLabel(info) + ')';

    return text
      .replace(/^• Дорога:.*$/m, routeLine)
      .replace(/^• Дорога —.*$/m, breakdownLine);
  }

  function patchCalculatorDom() {
    if (patchingDom) return;

    var info = window.VH_ROUTE_INFO;
    if (!info) return;

    patchingDom = true;
    try {
      var status = document.getElementById('vhCalcAddressStatus');
      if (status && status.textContent !== getRoadSummary(info)) {
        status.textContent = getRoadSummary(info);
        status.classList.remove('is-error');
        status.classList.add('is-good');
      }

      var breakdown = document.getElementById('vhCalcBreakdown');
      if (breakdown) {
        Array.prototype.forEach.call(breakdown.querySelectorAll('li'), function (item) {
          if (item.textContent.indexOf('Дорога —') !== 0) return;
          item.textContent = 'Дорога — ' +
            (info.price > 0 ? '+' + formatMoney(info.price) : 'без доплаты') +
            ' (' + getRoadLabel(info) + ')';
        });
      }

      var pdfStage = document.getElementById('vhPdfStage');
      if (pdfStage && pdfStage.textContent) patchTextNodes(pdfStage, info);
    } finally {
      patchingDom = false;
    }
  }

  function patchTextNodes(root, info) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var node;

    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(function (textNode) {
      var value = textNode.nodeValue || '';
      if (value.indexOf('Дорога') === -1 && value.indexOf('МКАД') === -1) return;

      if (/Дорога:\s*/i.test(value)) {
        textNode.nodeValue = value.replace(/Дорога:\s*[^\n]*/i,
          'Дорога: ' + getRoadLabel(info) + ', ' + (info.price > 0 ? formatMoney(info.price) : 'без доплаты'));
        return;
      }

      if (/Дорога\s*[—-]/i.test(value)) {
        textNode.nodeValue = value.replace(/Дорога\s*[—-].*/i,
          'Дорога — ' + (info.price > 0 ? '+' + formatMoney(info.price) : 'без доплаты') +
          ' (' + getRoadLabel(info) + ')');
        return;
      }

      textNode.nodeValue = value.replace(/внутри МКАД|за МКАД[^,.\n]*/gi, getRoadLabel(info));
    });
  }

  function installClipboardPatch() {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      var nativeWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      try {
        navigator.clipboard.writeText = function (text) {
          return nativeWriteText(patchOfferText(text));
        };
      } catch (error) {}
    }

    var nativeSelect = window.HTMLTextAreaElement && window.HTMLTextAreaElement.prototype.select;
    if (nativeSelect) {
      window.HTMLTextAreaElement.prototype.select = function () {
        if (typeof this.value === 'string' && this.value.indexOf('ВЫСТУПЛЕНИЕ МУЗЫКАНТА') !== -1) {
          this.value = patchOfferText(this.value);
        }
        return nativeSelect.apply(this, arguments);
      };
    }
  }

  function clearCurrentRoute() {
    window.VH_ROUTE_INFO = null;
  }

  function installSuggestionClickBridge() {
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest
        ? event.target.closest('.vh-price-calc__suggestion')
        : null;
      if (!button || !isConfigured()) return;

      var input = document.getElementById('vhCalcAddress');
      var box = document.getElementById('vhCalcSuggestions');
      if (!input) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      clearCurrentRoute();

      var firstNode = button.childNodes && button.childNodes[0];
      var value = firstNode && firstNode.nodeType === Node.TEXT_NODE
        ? String(firstNode.nodeValue || '').trim()
        : String(button.textContent || '').trim();

      input.value = value;
      if (box) {
        box.innerHTML = '';
        box.classList.remove('is-visible');
      }

      var status = document.getElementById('vhCalcAddressStatus');
      if (status) {
        status.textContent = 'Строю автомобильный маршрут...';
        status.classList.remove('is-good', 'is-error');
      }

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true
      }));
    }, true);
  }

  function installAddressReset() {
    document.addEventListener('input', function (event) {
      if (!event.target || event.target.id !== 'vhCalcAddress') return;
      clearCurrentRoute();
    }, true);
  }

  installClipboardPatch();
  installSuggestionClickBridge();
  installAddressReset();

  var observer = new MutationObserver(function () {
    if (typeof queueMicrotask === 'function') queueMicrotask(patchCalculatorDom);
    else setTimeout(patchCalculatorDom, 0);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  window.VH_ROUTE_ADAPTER = Object.freeze({
    provider: 'backend-openrouteservice',
    endpoint: endpoint,
    isConfigured: isConfigured,
    getTariffBand: getTariffBand,
    parseBackendRoute: parseBackendRoute,
    patchOfferText: patchOfferText
  });
})();
