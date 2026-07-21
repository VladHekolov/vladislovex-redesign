(function initSharedArtistCard() {
  'use strict';

  var CARD_PARAM = 'card';
  var CARD_OPEN_VALUES = /^(artist|card|modal|1|true)$/i;
  var api = window.VocavaPublicData || null;
  var modal = null;
  var dialog = null;
  var closeButton = null;
  var media = null;
  var type = null;
  var age = null;
  var ageWrap = null;
  var name = null;
  var about = null;
  var aboutWrap = null;
  var repertoireDescription = null;
  var repertoireDescriptionWrap = null;
  var repertoire = null;
  var repertoireWrap = null;
  var photos = null;
  var preview = null;
  var previewImage = null;
  var previewClose = null;

  var currentArtistId = '';
  var requestSerial = 0;
  var lastFocused = null;
  var openScrollY = 0;
  var pageLockSnapshot = null;
  var originalDocumentTitle = document.title;

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char];
    });
  }

  function createMarkup() {
    if (document.getElementById('vhArtistCardModal')) return;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = '' +
      '<div class="vh-artist-modal" id="vhArtistCardModal" aria-hidden="true">' +
        '<div class="vh-artist-modal__overlay" data-vh-artist-card-close></div>' +
        '<section class="vh-artist-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="vhArtistCardName">' +
          '<button class="vh-artist-modal__close" type="button" data-vh-artist-card-close aria-label="Закрыть карточку">×</button>' +
          '<div class="vh-artist-modal__top">' +
            '<div class="vh-artist-modal__media" id="vhArtistCardMedia">' +
              '<div class="vh-artist-modal__loading">Загружаю карточку артиста…</div>' +
            '</div>' +
            '<div class="vh-artist-modal__content" id="vhArtistCardContent">' +
              '<div class="vh-artist-modal__label" id="vhArtistCardType">VOCAVA</div>' +
              '<div class="vh-artist-modal__age-pill" id="vhArtistCardAgeWrap" hidden><span id="vhArtistCardAge"></span></div>' +
              '<div class="vh-artist-modal__title-row"><h2 class="vh-title vh-title--card" id="vhArtistCardName">Карточка артиста</h2></div>' +
              '<section class="vh-artist-modal__text-block" id="vhArtistCardAboutWrap" hidden>' +
                '<p class="vh-artist-modal__about" id="vhArtistCardAbout"></p>' +
              '</section>' +
              '<section class="vh-artist-modal__text-block" id="vhArtistCardRepertoireDescriptionWrap" hidden>' +
                '<span>Описание репертуара</span>' +
                '<p id="vhArtistCardRepertoireDescription"></p>' +
              '</section>' +
              '<section class="vh-artist-modal__text-block" id="vhArtistCardRepertoireWrap" hidden>' +
                '<span>Репертуар</span>' +
                '<p id="vhArtistCardRepertoire"></p>' +
              '</section>' +
            '</div>' +
          '</div>' +
          '<div class="vh-artist-modal__photos" id="vhArtistCardPhotos" aria-label="Фотографии музыканта"></div>' +
        '</section>' +
      '</div>' +
      '<div class="vh-artist-modal__photo-preview" id="vhArtistCardPhotoPreview" aria-hidden="true">' +
        '<button type="button" data-vh-artist-photo-close aria-label="Закрыть фотографию">×</button>' +
        '<img id="vhArtistCardPhotoPreviewImage" src="" alt="">' +
      '</div>';

    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);
  }

  function cacheElements() {
    modal = document.getElementById('vhArtistCardModal');
    dialog = modal ? modal.querySelector('.vh-artist-modal__dialog') : null;
    closeButton = modal ? modal.querySelector('[data-vh-artist-card-close].vh-artist-modal__close') : null;
    media = document.getElementById('vhArtistCardMedia');
    type = document.getElementById('vhArtistCardType');
    age = document.getElementById('vhArtistCardAge');
    ageWrap = document.getElementById('vhArtistCardAgeWrap');
    name = document.getElementById('vhArtistCardName');
    about = document.getElementById('vhArtistCardAbout');
    aboutWrap = document.getElementById('vhArtistCardAboutWrap');
    repertoireDescription = document.getElementById('vhArtistCardRepertoireDescription');
    repertoireDescriptionWrap = document.getElementById('vhArtistCardRepertoireDescriptionWrap');
    repertoire = document.getElementById('vhArtistCardRepertoire');
    repertoireWrap = document.getElementById('vhArtistCardRepertoireWrap');
    photos = document.getElementById('vhArtistCardPhotos');
    preview = document.getElementById('vhArtistCardPhotoPreview');
    previewImage = document.getElementById('vhArtistCardPhotoPreviewImage');
    previewClose = preview ? preview.querySelector('[data-vh-artist-photo-close]') : null;
  }

  function normalizeId(value) {
    return text(value).toLowerCase();
  }

  function artistMatches(artist, id) {
    var target = normalizeId(id);
    if (!target || !artist) return false;
    return [artist.id, artist.slug, artist.artist_id, artist.artistId, artist.name]
      .map(normalizeId)
      .indexOf(target) !== -1;
  }

  function mergeArtist(base, extra) {
    var result = {};
    [base || {}, extra || {}].forEach(function (source) {
      Object.keys(source).forEach(function (key) {
        var value = source[key];
        if (value !== undefined && value !== null && value !== '') result[key] = value;
      });
    });
    return result;
  }

  function loadArtist(id, seedArtist) {
    api = window.VocavaPublicData || api;

    if (!api || typeof api.loadArtists !== 'function') {
      if (seedArtist && Object.keys(seedArtist).length) return Promise.resolve(seedArtist);
      return Promise.reject(new Error('Каталог артистов ещё загружается'));
    }

    var listPromise = api.loadArtists().catch(function () { return { rows: [] }; });
    var detailsPromise = typeof api.loadRepertoire === 'function'
      ? api.loadRepertoire(id).catch(function () { return null; })
      : Promise.resolve(null);

    return Promise.all([listPromise, detailsPromise]).then(function (responses) {
      var rows = responses[0] && (responses[0].rows || responses[0].artists || []);
      var fromList = (rows || []).find(function (artist) { return artistMatches(artist, id); }) || null;
      var details = responses[1] && responses[1].data ? responses[1].data : responses[1];
      var fromRepertoire = details && details.artist ? details.artist : null;
      var artist = mergeArtist(fromRepertoire, mergeArtist(fromList, seedArtist));

      if (!artist || !Object.keys(artist).length) {
        throw new Error('Карточка этого артиста недоступна');
      }

      return artist;
    });
  }

  function formatAge(value) {
    var raw = text(value);
    if (!raw) return '';
    if (/[^0-9\s]/.test(raw)) return raw;

    var number = parseInt(raw, 10);
    if (!number) return raw;
    var mod100 = Math.abs(number) % 100;
    var mod10 = mod100 % 10;
    var word = 'лет';
    if (mod100 < 11 || mod100 > 19) {
      if (mod10 === 1) word = 'год';
      else if (mod10 >= 2 && mod10 <= 4) word = 'года';
    }
    return number + ' ' + word;
  }

  function photoUrl(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object') {
      return text(value.url || value.publicUrl || value.public_url || value.src || value.fileUrl || value.file_url);
    }
    return '';
  }

  function artistPhotos(artist) {
    var result = [];
    var sourcePhotos = Array.isArray(artist.photos) ? artist.photos : [];

    sourcePhotos.forEach(function (item) {
      var url = photoUrl(item);
      if (url && result.indexOf(url) === -1) result.push(url);
    });

    [artist.photo_url, artist.photoUrl, artist.avatar_url, artist.avatarUrl, artist.image_url, artist.imageUrl].forEach(function (item) {
      var url = photoUrl(item);
      if (url && result.indexOf(url) === -1) result.push(url);
    });

    for (var index = 1; index <= 12; index += 1) {
      var url = photoUrl(artist['photo_' + index] || artist['photo_' + index + '_card']);
      if (url && result.indexOf(url) === -1) result.push(url);
    }

    return result;
  }

  function convertEmbedUrl(url) {
    var raw = text(url);
    if (!raw) return '';

    try {
      var parsed = new URL(raw, window.location.href);
      var host = parsed.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') {
        return 'https://www.youtube.com/embed/' + encodeURIComponent(parsed.pathname.replace(/^\//, '')) + '?autoplay=1&mute=1&playsinline=1';
      }

      if (/youtube\.com$/.test(host)) {
        var youtubeId = parsed.searchParams.get('v');
        if (youtubeId) return 'https://www.youtube.com/embed/' + encodeURIComponent(youtubeId) + '?autoplay=1&mute=1&playsinline=1';
      }
    } catch (error) {}

    return raw;
  }

  function renderMedia(artist, availablePhotos) {
    if (!media) return;
    media.innerHTML = '';
    var videoUrl = text(artist.video_url || artist.videoUrl || artist.video);

    if (videoUrl && (/storage\.yandexcloud\.net|\.(mp4|webm|mov)($|\?)/i.test(videoUrl))) {
      var video = document.createElement('video');
      video.src = videoUrl;
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('playsinline', '');
      media.appendChild(video);
      window.setTimeout(function () { video.play().catch(function () {}); }, 60);
      return;
    }

    if (videoUrl) {
      var iframe = document.createElement('iframe');
      iframe.src = convertEmbedUrl(videoUrl);
      iframe.title = 'Видео артиста ' + text(artist.name || '');
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      media.appendChild(iframe);
      return;
    }

    if (availablePhotos.length) {
      var image = document.createElement('img');
      image.src = availablePhotos[0];
      image.alt = text(artist.name || 'Музыкант');
      media.appendChild(image);
      return;
    }

    media.innerHTML = '<div class="vh-artist-modal__media-placeholder">Видео и фотографии пока не добавлены.</div>';
  }

  function setTextBlock(wrapper, element, value) {
    var finalValue = text(value);
    if (element) element.textContent = finalValue;
    if (wrapper) wrapper.hidden = !finalValue;
  }

  function openPhoto(url, artistName) {
    if (!preview || !previewImage || !url) return;
    previewImage.src = url;
    previewImage.alt = artistName || 'Фотография артиста';
    preview.classList.add('is-open');
    preview.setAttribute('aria-hidden', 'false');
    if (previewClose) previewClose.focus({ preventScroll: true });
  }

  function closePhoto() {
    if (!preview || !preview.classList.contains('is-open')) return false;
    preview.classList.remove('is-open');
    preview.setAttribute('aria-hidden', 'true');
    if (previewImage) previewImage.removeAttribute('src');
    return true;
  }

  function renderPhotos(artist, availablePhotos) {
    if (!photos) return;
    photos.innerHTML = '';
    photos.classList.toggle('is-visible', availablePhotos.length > 0);
    if (!availablePhotos.length) return;

    availablePhotos.slice(0, 12).forEach(function (url, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'vh-artist-modal__photo';
      button.setAttribute('aria-label', 'Открыть фотографию ' + (index + 1));

      var image = document.createElement('img');
      image.src = url;
      image.alt = '';
      image.loading = 'lazy';
      button.appendChild(image);

      button.addEventListener('click', function () {
        openPhoto(url, text(artist.name));
      });

      photos.appendChild(button);
    });
  }

  function renderArtist(artist) {
    var availablePhotos = artistPhotos(artist);
    var category = text(artist.category || artist.role || artist.type || 'Музыкант VOCAVA');
    var artistName = text(artist.name || artist.title || 'Музыкант');
    var artistAge = formatAge(artist.age || artist.years);
    var aboutText = text(artist.short_text || artist.shortText || artist.about || artist.description || artist.bio);
    var repertoireDescriptionText = text(
      artist.repertoire_description || artist.repertoireDescription || artist.repertoire_desc || artist.repertoireDesc
    );
    var repertoireText = text(artist.repertoire || artist.repertoireSummary || artist.repertoire_summary);

    if (type) type.textContent = category;
    if (age) age.textContent = artistAge;
    if (ageWrap) ageWrap.hidden = !artistAge;
    if (name) name.textContent = artistName;
    setTextBlock(aboutWrap, about, aboutText);
    setTextBlock(repertoireDescriptionWrap, repertoireDescription, repertoireDescriptionText);
    setTextBlock(repertoireWrap, repertoire, repertoireText);

    renderMedia(artist, availablePhotos);
    renderPhotos(artist, availablePhotos);
    document.title = artistName + ' — музыкант VOCAVA';
  }

  function showLoading() {
    if (media) media.innerHTML = '<div class="vh-artist-modal__loading">Загружаю карточку артиста…</div>';
    if (type) type.textContent = 'VOCAVA';
    if (ageWrap) ageWrap.hidden = true;
    if (name) name.textContent = 'Карточка артиста';
    setTextBlock(aboutWrap, about, '');
    setTextBlock(repertoireDescriptionWrap, repertoireDescription, '');
    setTextBlock(repertoireWrap, repertoire, '');
    if (photos) {
      photos.innerHTML = '';
      photos.classList.remove('is-visible');
    }
  }

  function showError(error) {
    var message = error && error.message ? error.message : 'Не удалось загрузить карточку артиста';
    if (media) media.innerHTML = '<div class="vh-artist-modal__error">' + escapeHtml(message) + '</div>';
    if (type) type.textContent = 'VOCAVA';
    if (name) name.textContent = 'Карточка недоступна';
    setTextBlock(aboutWrap, about, 'Обновите страницу или попробуйте открыть карточку немного позже.');
  }

  function lockPage() {
    if (pageLockSnapshot) return;
    openScrollY = window.scrollY || window.pageYOffset || 0;
    pageLockSnapshot = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width
    };

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + openScrollY + 'px';
    document.body.style.width = '100%';
  }

  function unlockPage(scrollY) {
    if (!pageLockSnapshot) return;
    document.documentElement.style.overflow = pageLockSnapshot.htmlOverflow;
    document.body.style.overflow = pageLockSnapshot.bodyOverflow;
    document.body.style.position = pageLockSnapshot.bodyPosition;
    document.body.style.top = pageLockSnapshot.bodyTop;
    document.body.style.width = pageLockSnapshot.bodyWidth;
    pageLockSnapshot = null;

    var targetY = Number.isFinite(Number(scrollY)) ? Number(scrollY) : openScrollY;
    window.requestAnimationFrame(function () {
      window.scrollTo(0, Math.max(0, targetY));
    });
  }

  function cardIdFromLocation() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var explicit = text(params.get(CARD_PARAM));
      if (explicit) return explicit;

      var legacyOpen = text(params.get('open') || params.get('modal'));
      if (CARD_OPEN_VALUES.test(legacyOpen)) return text(params.get('artist'));
    } catch (error) {}
    return '';
  }

  function buildCardUrl(id) {
    var url = new URL(window.location.href);
    url.searchParams.set(CARD_PARAM, id);
    url.searchParams.delete('open');
    url.searchParams.delete('modal');

    if (/\/repertoire\/?$/i.test(url.pathname)) {
      url.searchParams.set('artist', id);
    }

    return url.toString();
  }

  function buildClosedUrl() {
    var url = new URL(window.location.href);
    url.searchParams.delete(CARD_PARAM);

    var legacyOpen = text(url.searchParams.get('open') || url.searchParams.get('modal'));
    if (CARD_OPEN_VALUES.test(legacyOpen)) {
      url.searchParams.delete('open');
      url.searchParams.delete('modal');
    }

    return url.toString();
  }

  function replaceReturnState() {
    if (!window.history || !window.history.replaceState) return;
    var current = window.history.state && typeof window.history.state === 'object'
      ? Object.assign({}, window.history.state)
      : {};
    current.vhArtistCardReturn = true;
    current.vhScrollY = openScrollY;
    window.history.replaceState(current, '', window.location.href);
  }

  function pushCardState(id) {
    if (!window.history || !window.history.pushState) return;
    replaceReturnState();
    window.history.pushState({
      vhArtistCard: true,
      vhArtistId: id,
      vhScrollY: openScrollY,
      vhSourceUrl: buildClosedUrl()
    }, '', buildCardUrl(id));
  }

  function isOpen() {
    return !!(modal && modal.classList.contains('is-open'));
  }

  function openArtist(id, options) {
    options = options || {};
    id = text(id);
    if (!id || !modal) return Promise.resolve(null);

    lastFocused = document.activeElement;
    currentArtistId = id;
    requestSerial += 1;
    var currentRequest = requestSerial;

    showLoading();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockPage();

    if (options.pushHistory !== false && cardIdFromLocation() !== id) {
      pushCardState(id);
    }

    if (closeButton) closeButton.focus({ preventScroll: true });
    if (dialog) dialog.scrollTop = 0;

    if (options.artist && Object.keys(options.artist).length) {
      renderArtist(options.artist);
    }

    return loadArtist(id, options.artist || null).then(function (artist) {
      if (currentRequest !== requestSerial || currentArtistId !== id) return null;
      renderArtist(artist);
      return artist;
    }).catch(function (error) {
      if (currentRequest !== requestSerial || currentArtistId !== id) return null;
      showError(error);
      return null;
    });
  }

  function closeWithoutNavigation(scrollY) {
    if (!isOpen()) return;
    requestSerial += 1;
    currentArtistId = '';
    closePhoto();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (media) media.innerHTML = '';
    if (photos) {
      photos.innerHTML = '';
      photos.classList.remove('is-visible');
    }
    document.title = originalDocumentTitle;
    unlockPage(scrollY);

    if (lastFocused && document.contains(lastFocused) && typeof lastFocused.focus === 'function') {
      window.setTimeout(function () {
        try { lastFocused.focus({ preventScroll: true }); } catch (error) {}
      }, 0);
    }
  }

  function closeArtist() {
    if (closePhoto()) return;
    if (!isOpen()) return;

    var state = window.history && window.history.state;
    if (state && state.vhArtistCard) {
      window.history.back();
      return;
    }

    if (document.referrer) {
      var fallbackUrl = buildClosedUrl();
      window.history.back();
      window.setTimeout(function () {
        if (isOpen()) window.location.assign(fallbackUrl);
      }, 500);
      return;
    }

    window.location.assign(buildClosedUrl());
  }

  function seedArtistFromCard(card) {
    if (!card) return null;
    var seed = {
      id: text(card.getAttribute('data-id')),
      category: text(card.getAttribute('data-type')),
      name: text(card.getAttribute('data-name')),
      age: text(card.getAttribute('data-age')),
      short_text: text(card.querySelector('.vh-artist-card__text') && card.querySelector('.vh-artist-card__text').textContent),
      about: text(card.getAttribute('data-about')),
      repertoire: text(card.getAttribute('data-repertoire')),
      repertoire_description: text(card.getAttribute('data-repertoire-description')),
      video_url: text(card.getAttribute('data-video')),
      photos: []
    };

    card.querySelectorAll('.vh-artist-card__slide[data-photo]').forEach(function (slide) {
      var url = text(slide.getAttribute('data-photo'));
      if (url && seed.photos.indexOf(url) === -1) seed.photos.push(url);
    });

    return seed;
  }

  function currentRepertoireArtistId(trigger) {
    var direct = text(trigger && (trigger.getAttribute('data-artist-id') || trigger.getAttribute('data-vh-artist-id')));
    if (direct) return direct;

    var root = document.getElementById('vr');
    var select = document.getElementById('vrArtistSelect');
    var selectedOption = document.querySelector('#vrArtistDropdownMenu [aria-selected="true"]');
    var fromUrl = '';

    try { fromUrl = new URLSearchParams(window.location.search).get('artist') || ''; } catch (error) {}

    return text(fromUrl) ||
      text(root && root.getAttribute('data-artist-id')) ||
      text(select && select.value) ||
      text(selectedOption && selectedOption.getAttribute('data-artist-id'));
  }

  function shouldOpenCatalogCard(event, card) {
    if (!card) return false;
    var target = event.target;
    if (target.closest('.vh-artist-card__favorite')) return false;
    if (target.closest('.vh-artist-card__gallery')) return false;
    if (target.closest('.vh-artist-card__repertoire')) return false;
    if (target.closest('.vh-artist-card__choose')) return true;
    if (target.closest('.vh-artist-card__body')) return !target.closest('a,button');
    return false;
  }

  function initDelegatedTriggers() {
    document.addEventListener('click', function (event) {
      var explicitTrigger = event.target.closest('[data-vh-artist-modal-trigger]');
      if (explicitTrigger) {
        var repertoireArtistId = currentRepertoireArtistId(explicitTrigger);
        if (!repertoireArtistId) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        openArtist(repertoireArtistId, { pushHistory: true });
        return;
      }

      var card = event.target.closest('.vh-artist-card');
      if (!shouldOpenCatalogCard(event, card)) return;
      var artistId = text(card.getAttribute('data-id'));
      if (!artistId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openArtist(artistId, { pushHistory: true, artist: seedArtistFromCard(card) });
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (closePhoto()) {
          event.preventDefault();
          return;
        }
        if (isOpen()) {
          event.preventDefault();
          closeArtist();
        }
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') return;
      var body = event.target.closest && event.target.closest('.vh-artist-card__body');
      if (!body) return;
      var card = body.closest('.vh-artist-card');
      var artistId = text(card && card.getAttribute('data-id'));
      if (!artistId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openArtist(artistId, { pushHistory: true, artist: seedArtistFromCard(card) });
    }, true);
  }

  function initControls() {
    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target.hasAttribute('data-vh-artist-card-close')) closeArtist();
      });
    }

    if (preview) {
      preview.addEventListener('click', function (event) {
        if (event.target === preview || event.target.hasAttribute('data-vh-artist-photo-close')) closePhoto();
      });
    }

    window.addEventListener('popstate', function (event) {
      var artistId = cardIdFromLocation();
      if (artistId) {
        openArtist(artistId, { pushHistory: false });
        return;
      }

      var restoreY = event.state && Number.isFinite(Number(event.state.vhScrollY))
        ? Number(event.state.vhScrollY)
        : openScrollY;
      closeWithoutNavigation(restoreY);
    });
  }

  function syncFromLocation() {
    var artistId = cardIdFromLocation();
    if (!artistId) return;
    openArtist(artistId, { pushHistory: false });
  }

  createMarkup();
  cacheElements();
  initControls();
  initDelegatedTriggers();

  window.VHArtistCard = Object.freeze({
    open: function (id, options) { return openArtist(id, options || {}); },
    close: closeArtist,
    isOpen: isOpen,
    currentId: function () { return currentArtistId; },
    urlFor: function (id) { return buildCardUrl(text(id)); }
  });

  window.setTimeout(syncFromLocation, 0);
})();
