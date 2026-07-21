(function initSharedArtistModal() {
  'use strict';

  var trigger = document.querySelector('[data-vh-artist-modal-trigger]');
  var modal = document.getElementById('vhArtistModal');
  if (!trigger || !modal) return;

  var root = document.getElementById('vr');
  var artistSelect = document.getElementById('vrArtistSelect');
  var closeButton = modal.querySelector('[data-vh-artist-modal-close]');
  var media = document.getElementById('vhArtistModalMedia');
  var type = document.getElementById('vhArtistModalType');
  var name = document.getElementById('vhArtistModalName');
  var age = document.getElementById('vhArtistModalAge');
  var ageCard = document.getElementById('vhArtistModalAgeCard');
  var about = document.getElementById('vhArtistModalAbout');
  var photos = document.getElementById('vhArtistModalPhotos');
  var repertoire = document.getElementById('vhArtistModalRepertoire');
  var repertoireCard = document.getElementById('vhArtistModalRepertoireCard');
  var repertoireDescription = document.getElementById('vhArtistModalRepertoireDescription');
  var repertoireDescriptionCard = document.getElementById('vhArtistModalRepertoireDescriptionCard');
  var preview = document.getElementById('vhArtistPhotoPreview');
  var previewImage = document.getElementById('vhArtistPhotoPreviewImage');
  var previewClose = preview ? preview.querySelector('[data-vh-artist-photo-close]') : null;

  var lastFocused = null;
  var openScrollY = 0;
  var requestSerial = 0;

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function isActive(value) {
    if (value == null || value === '') return true;
    return /^(true|1|yes|да|active|актив|published|on)$/i.test(text(value));
  }

  function currentArtistId() {
    var fromUrl = '';
    try { fromUrl = new URLSearchParams(window.location.search).get('artist') || ''; }
    catch (error) {}

    var selectedOption = document.querySelector('#vrArtistDropdownMenu [aria-selected="true"]');

    return text(fromUrl) ||
      text(root && root.getAttribute('data-artist-id')) ||
      text(artistSelect && artistSelect.value) ||
      text(selectedOption && selectedOption.getAttribute('data-artist-id'));
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

  function loadArtist(id) {
    var api = window.VocavaPublicData;
    if (!api || typeof api.loadArtists !== 'function') {
      return Promise.reject(new Error('Каталог артистов ещё загружается'));
    }

    var listPromise = api.loadArtists().catch(function () { return { rows: [] }; });
    var detailsPromise = typeof api.loadRepertoire === 'function'
      ? api.loadRepertoire(id).catch(function () { return null; })
      : Promise.resolve(null);

    return Promise.all([listPromise, detailsPromise]).then(function (responses) {
      var rows = responses[0] && (responses[0].rows || responses[0].artists || []);
      var fromList = (rows || []).find(function (artist) { return artistMatches(artist, id); }) || null;
      var fromRepertoire = responses[1] && responses[1].data && responses[1].data.artist
        ? responses[1].data.artist
        : null;
      var artist = mergeArtist(fromList, fromRepertoire);

      if (!artist || !Object.keys(artist).length || !isActive(artist.active)) {
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
    if (typeof value === 'object') return text(value.url || value.publicUrl || value.public_url || value.src || value.fileUrl || value.file_url);
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

  function openPhoto(url, artistName) {
    if (!preview || !previewImage || !url) return;
    previewImage.src = url;
    previewImage.alt = artistName || 'Фотография артиста';
    preview.classList.add('is-open');
    preview.setAttribute('aria-hidden', 'false');
  }

  function closePhoto() {
    if (!preview || !preview.classList.contains('is-open')) return;
    preview.classList.remove('is-open');
    preview.setAttribute('aria-hidden', 'true');
    if (previewImage) previewImage.removeAttribute('src');
  }

  function renderPhotos(artist, availablePhotos) {
    if (!photos) return;
    photos.innerHTML = '';
    photos.classList.toggle('is-visible', availablePhotos.length > 0);
    if (!availablePhotos.length) return;

    availablePhotos.slice(0, 9).forEach(function (url, index) {
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

  function setCard(card, value) {
    if (!card) return;
    card.hidden = !text(value);
  }

  function renderArtist(artist) {
    var availablePhotos = artistPhotos(artist);
    var category = text(artist.category || artist.role || artist.type || 'Музыкант VOCAVA');
    var artistName = text(artist.name || artist.title || 'Музыкант');
    var artistAge = formatAge(artist.age || artist.years);
    var aboutText = text(artist.short_text || artist.shortText || artist.about || artist.description || artist.bio);
    var repertoireText = text(artist.repertoire || artist.repertoireSummary || artist.repertoire_summary);
    var repertoireDescriptionText = text(artist.repertoire_description || artist.repertoireDescription || artist.repertoire_desc || artist.repertoireDesc);

    if (type) type.textContent = category;
    if (name) name.textContent = artistName;
    if (age) age.textContent = artistAge;
    if (ageCard) ageCard.hidden = !artistAge;
    if (about) about.textContent = aboutText || 'Информация об артисте скоро появится.';
    if (repertoire) repertoire.textContent = repertoireText;
    if (repertoireDescription) repertoireDescription.textContent = repertoireDescriptionText;
    setCard(repertoireCard, repertoireText);
    setCard(repertoireDescriptionCard, repertoireDescriptionText);

    renderMedia(artist, availablePhotos);
    renderPhotos(artist, availablePhotos);
  }

  function showLoading() {
    if (media) media.innerHTML = '<div class="vh-artist-modal__loading">Загружаю карточку артиста…</div>';
    if (type) type.textContent = 'VOCAVA';
    if (name) name.textContent = 'Карточка артиста';
    if (ageCard) ageCard.hidden = true;
    if (about) about.textContent = 'Собираю информацию, фотографии и видео.';
    if (photos) {
      photos.innerHTML = '';
      photos.classList.remove('is-visible');
    }
    setCard(repertoireCard, '');
    setCard(repertoireDescriptionCard, '');
  }

  function showError(error) {
    var message = error && error.message ? error.message : 'Не удалось загрузить карточку артиста';
    if (media) media.innerHTML = '<div class="vh-artist-modal__error"></div>';
    var errorBox = media && media.querySelector('.vh-artist-modal__error');
    if (errorBox) errorBox.textContent = message;
    if (type) type.textContent = 'VOCAVA';
    if (name) name.textContent = 'Карточка недоступна';
    if (about) about.textContent = 'Обновите страницу или попробуйте открыть карточку немного позже.';
  }

  function lockPage() {
    openScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function unlockPage() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    window.scrollTo(0, openScrollY);
  }

  function openModal() {
    var id = currentArtistId();
    if (!id) {
      trigger.setAttribute('aria-disabled', 'true');
      return;
    }

    lastFocused = document.activeElement;
    requestSerial += 1;
    var currentRequest = requestSerial;
    showLoading();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockPage();
    if (closeButton) closeButton.focus({ preventScroll: true });

    loadArtist(id).then(function (artist) {
      if (currentRequest !== requestSerial || !modal.classList.contains('is-open')) return;
      renderArtist(artist);
    }).catch(function (error) {
      if (currentRequest !== requestSerial || !modal.classList.contains('is-open')) return;
      showError(error);
    });
  }

  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    requestSerial += 1;
    closePhoto();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (media) media.innerHTML = '';
    unlockPage();
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try { lastFocused.focus({ preventScroll: true }); }
      catch (error) { lastFocused.focus(); }
    }
  }

  trigger.addEventListener('click', function (event) {
    event.preventDefault();
    if (trigger.classList.contains('is-disabled') || trigger.getAttribute('aria-disabled') === 'true') return;
    openModal();
  });

  modal.addEventListener('click', function (event) {
    if (event.target.closest('[data-vh-artist-modal-close]')) closeModal();
  });

  if (preview) {
    preview.addEventListener('click', function (event) {
      if (event.target === preview || event.target.closest('[data-vh-artist-photo-close]')) closePhoto();
    });
  }

  if (previewClose) previewClose.addEventListener('click', closePhoto);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (preview && preview.classList.contains('is-open')) {
      closePhoto();
      return;
    }
    closeModal();
  });
}());
