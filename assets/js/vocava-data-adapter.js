/*
 * VLADISLOVEX public data adapter.
 * Primary source: VOCAVA public API backed by PostgreSQL.
 * Fallback source: the legacy Google Apps Script / JSON feeds already configured in the page.
 */
(function () {
  'use strict';

  var config = window.VLADISLOVEX_CONFIG || {};
  var apiBaseUrl = String(config.apiBaseUrl || 'https://api.vocava.ru').replace(/\/$/, '');
  var artistsEndpoint = String(config.artistsEndpoint || '/api/public/artists');
  var repertoireEndpointTemplate = String(config.repertoireEndpointTemplate || '/api/public/artists/{artistId}/repertoire');
  var cacheTtlMs = Math.max(0, Number(config.publicDataCacheTtlMs || 30000));
  var requestTimeoutMs = Math.max(1000, Number(config.publicDataRequestTimeoutMs || 5500));
  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  var nativeAppendChild = Node.prototype.appendChild;

  function joinUrl(base, path) {
    if (/^https?:\/\//i.test(path)) return path;
    return base + (path.charAt(0) === '/' ? path : '/' + path);
  }

  function readPath(source, path) {
    return String(path || '').split('.').reduce(function (value, key) {
      return value && value[key] != null ? value[key] : undefined;
    }, source);
  }

  function firstValue(source, paths, fallback) {
    for (var i = 0; i < paths.length; i += 1) {
      var value = readPath(source, paths[i]);
      if (value != null && value !== '') return value;
    }
    return fallback;
  }

  function extractArray(payload, paths) {
    if (Array.isArray(payload)) return payload;
    for (var i = 0; i < paths.length; i += 1) {
      var value = readPath(payload, paths[i]);
      if (Array.isArray(value)) return value;
    }
    return null;
  }

  function boolString(value, fallback) {
    if (value == null || value === '') return fallback ? 'true' : 'false';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value ? 'true' : 'false';
    return /^(true|1|yes|да|active|актив|published|on)$/i.test(String(value).trim()) ? 'true' : 'false';
  }

  function normalizePhotoValue(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object') {
      return String(firstValue(value, ['url', 'publicUrl', 'public_url', 'src', 'fileUrl', 'file_url'], '') || '').trim();
    }
    return '';
  }

  function normalizeArtist(raw, index) {
    raw = raw || {};
    var artist = {};
    Object.keys(raw).forEach(function (key) {
      var value = raw[key];
      artist[key] = value == null ? '' : value;
    });

    artist.id = String(firstValue(raw, ['id', 'artistId', 'artist_id', 'slug', 'uuid'], 'artist-' + (index + 1)) || '').trim();
    artist.name = String(firstValue(raw, ['name', 'displayName', 'display_name', 'title'], artist.id) || '').trim();
    artist.active = boolString(firstValue(raw, ['active', 'isActive', 'is_active', 'isPublished', 'is_published', 'published'], true), true);
    artist.category = String(firstValue(raw, ['category', 'categoryName', 'category_name', 'type', 'role', 'roleName', 'role_name'], '') || '').trim();
    artist.category_slug = String(firstValue(raw, ['category_slug', 'categorySlug', 'role_slug', 'roleSlug', 'type_slug', 'typeSlug'], '') || '').trim();
    artist.gender = String(firstValue(raw, ['gender', 'sex'], '') || '').trim();
    artist.age = String(firstValue(raw, ['age', 'years'], '') || '').trim();
    artist.sort = String(firstValue(raw, ['sort', 'sortOrder', 'sort_order', 'position', 'priority'], index + 1) || index + 1);
    artist.short_text = String(firstValue(raw, ['short_text', 'shortText', 'subtitle', 'tagline', 'shortDescription', 'short_description'], '') || '').trim();
    artist.about = String(firstValue(raw, ['about', 'description', 'bio', 'biography'], artist.short_text) || '').trim();
    artist.video_url = String(firstValue(raw, ['video_url', 'videoUrl', 'video', 'promoVideoUrl', 'promo_video_url'], '') || '').trim();
    artist.format = String(firstValue(raw, ['format', 'performanceFormat', 'performance_format'], '') || '').trim();
    artist.repertoire = String(firstValue(raw, ['repertoire', 'repertoireSummary', 'repertoire_summary'], '') || '').trim();
    artist.repertoire_description = String(firstValue(raw, ['repertoire_description', 'repertoireDescription', 'repertoire_desc', 'repertoireDesc'], '') || '').trim();

    var photos = extractArray(raw, ['photos', 'media.photos', 'gallery', 'images']) || [];
    photos = photos.map(normalizePhotoValue).filter(Boolean);
    var primaryPhoto = normalizePhotoValue(firstValue(raw, ['photo_1', 'photoUrl', 'photo_url', 'avatarUrl', 'avatar_url', 'coverUrl', 'cover_url', 'imageUrl', 'image_url'], ''));
    if (primaryPhoto && photos.indexOf(primaryPhoto) === -1) photos.unshift(primaryPhoto);
    for (var i = 0; i < Math.min(photos.length, 12); i += 1) {
      artist['photo_' + (i + 1)] = photos[i];
    }

    return artist;
  }

  function normalizeArtistsPayload(payload) {
    var rows = extractArray(payload, [
      'rows',
      'artists',
      'items',
      'data.rows',
      'data.artists',
      'data.items',
      'result.rows',
      'result.artists',
      'result.items'
    ]);
    if (!rows) throw new Error('VOCAVA API returned no artists array');
    return {
      ok: true,
      rows: rows.map(normalizeArtist)
    };
  }

  function normalizeSong(raw, index) {
    raw = raw || {};
    var song = {};
    Object.keys(raw).forEach(function (key) {
      var value = raw[key];
      song[key] = value == null ? '' : value;
    });

    song.song_id = String(firstValue(raw, ['song_id', 'songId', 'id', 'uuid', 'slug'], 'song-' + (index + 1)) || '').trim();
    song.title = String(firstValue(raw, ['title', 'name', 'songTitle', 'song_title'], 'Без названия') || '').trim();
    song.original_artist = String(firstValue(raw, ['original_artist', 'originalArtist', 'performer', 'artist', 'artistName', 'artist_name'], '') || '').trim();
    song.genre = String(firstValue(raw, ['genre', 'genreName', 'genre_name'], '') || '').trim();
    song.mood = String(firstValue(raw, ['mood', 'moodName', 'mood_name'], '') || '').trim();
    song.energy = String(firstValue(raw, ['energy', 'energyName', 'energy_name', 'tempo'], '') || '').trim();
    song.tempo = String(firstValue(raw, ['tempo', 'energy'], song.energy) || '').trim();
    song.language = String(firstValue(raw, ['language', 'languageName', 'language_name'], '') || '').trim();
    song.tags = Array.isArray(raw.tags) ? raw.tags.join(', ') : String(firstValue(raw, ['tags', 'tagList', 'tag_list'], '') || '').trim();
    song.client_filter = String(firstValue(raw, ['client_filter', 'clientFilter'], '') || '').trim();
    song.sort = String(firstValue(raw, ['sort', 'sortOrder', 'sort_order', 'position'], index + 1) || index + 1);
    return song;
  }

  function normalizeRepertoirePayload(payload, artistId) {
    var songs = extractArray(payload, [
      'songs',
      'items',
      'rows',
      'data.songs',
      'data.items',
      'data.rows',
      'result.songs',
      'result.items',
      'result.rows'
    ]);
    if (!songs) throw new Error('VOCAVA API returned no repertoire array');

    var rawArtist = firstValue(payload, ['artist', 'data.artist', 'result.artist'], {}) || {};
    var artist = normalizeArtist(rawArtist, 0);
    if ((!rawArtist || !Object.keys(rawArtist).length) && artistId) artist.id = String(artistId);

    return {
      ok: true,
      data: {
        artist: artist,
        songs: songs.map(normalizeSong)
      }
    };
  }

  function cacheKey(kind, id) {
    return 'vladislovex:public-api:v1:' + kind + ':' + (id || 'all');
  }

  function readCache(kind, id, allowStale) {
    try {
      var raw = localStorage.getItem(cacheKey(kind, id));
      if (!raw) return null;
      var item = JSON.parse(raw);
      var age = Date.now() - Number(item.savedAt || 0);
      if (!allowStale && age > cacheTtlMs) return null;
      if (allowStale && age > 86400000) return null;
      return item.value;
    } catch (error) {
      return null;
    }
  }

  function writeCache(kind, id, value) {
    try {
      localStorage.setItem(cacheKey(kind, id), JSON.stringify({ savedAt: Date.now(), value: value }));
    } catch (error) {}
  }

  function fetchJson(url) {
    if (!nativeFetch) return Promise.reject(new Error('Fetch is unavailable'));
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = setTimeout(function () {
      if (controller) controller.abort();
    }, requestTimeoutMs);

    return nativeFetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).finally(function () {
      clearTimeout(timeout);
    });
  }

  function fetchFirst(urls) {
    var index = 0;
    function next(lastError) {
      if (index >= urls.length) return Promise.reject(lastError || new Error('VOCAVA API unavailable'));
      var url = urls[index++];
      return fetchJson(url).catch(next);
    }
    return next();
  }

  function loadArtistsFromApi() {
    var cached = readCache('artists', '', false);
    if (cached) return Promise.resolve(cached);
    var urls = [
      joinUrl(apiBaseUrl, artistsEndpoint),
      joinUrl(apiBaseUrl, '/api/public/musicians')
    ];
    return fetchFirst(urls).then(function (payload) {
      var normalized = normalizeArtistsPayload(payload);
      writeCache('artists', '', normalized);
      return normalized;
    }).catch(function (error) {
      var stale = readCache('artists', '', true);
      if (stale) return stale;
      throw error;
    });
  }

  function repertoireUrls(artistId) {
    var encoded = encodeURIComponent(String(artistId || '').trim());
    var templated = repertoireEndpointTemplate.replace('{artistId}', encoded);
    return [
      joinUrl(apiBaseUrl, templated),
      joinUrl(apiBaseUrl, '/api/public/repertoire?artist_id=' + encoded),
      joinUrl(apiBaseUrl, '/api/public/repertoire/' + encoded)
    ];
  }

  function loadRepertoireFromApi(artistId) {
    var cached = readCache('repertoire', artistId, false);
    if (cached) return Promise.resolve(cached);
    return fetchFirst(repertoireUrls(artistId)).then(function (payload) {
      var normalized = normalizeRepertoirePayload(payload, artistId);
      writeCache('repertoire', artistId, normalized);
      return normalized;
    }).catch(function (error) {
      var stale = readCache('repertoire', artistId, true);
      if (stale) return stale;
      throw error;
    });
  }

  function jsonResponse(value) {
    return new Response(JSON.stringify(value), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  if (nativeFetch) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var cleanUrl = String(url).split('?')[0].replace(/\/$/, '');
      var primaryArtistsUrl = joinUrl(apiBaseUrl, artistsEndpoint).split('?')[0].replace(/\/$/, '');
      if (cleanUrl === primaryArtistsUrl) {
        return loadArtistsFromApi().then(jsonResponse);
      }
      return nativeFetch(input, init);
    };
  }

  Node.prototype.appendChild = function (node) {
    var parent = this;
    if (!node || node.tagName !== 'SCRIPT' || !node.src) {
      return nativeAppendChild.call(parent, node);
    }

    var callbackName = '';
    var action = '';
    var artistId = '';
    try {
      var src = new URL(node.src, document.baseURI);
      callbackName = src.searchParams.get('callback') || '';
      action = src.searchParams.get('action') || '';
      artistId = src.searchParams.get('artist_id') || src.searchParams.get('artistId') || '';
    } catch (error) {
      return nativeAppendChild.call(parent, node);
    }

    if (!callbackName || (action !== 'publicList' && action !== 'publicRepertoire')) {
      return nativeAppendChild.call(parent, node);
    }

    var loader = action === 'publicList' ? loadArtistsFromApi() : loadRepertoireFromApi(artistId);
    loader.then(function (payload) {
      if (typeof window[callbackName] === 'function') window[callbackName](payload);
    }).catch(function () {
      nativeAppendChild.call(parent, node);
    });

    return node;
  };

  window.VocavaPublicData = Object.freeze({
    loadArtists: loadArtistsFromApi,
    loadRepertoire: loadRepertoireFromApi,
    apiBaseUrl: apiBaseUrl
  });
}());
