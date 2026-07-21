(function initArtistCardView() {
  'use strict';

  var activeCard = null;
  var requestSerial = 0;

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function descriptionText(value) {
    var raw = text(value);
    if (!raw || raw.indexOf('<') === -1) return raw;

    var normalized = raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p\s*>/gi, '\n')
      .replace(/<\/li\s*>/gi, '\n');
    var box = document.createElement('div');
    box.innerHTML = normalized;

    return text(box.textContent || box.innerText || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
  }

  function render() {
    var mount = document.querySelector('[data-vh-artist-card-mount]');
    if (!mount || document.getElementById('vhArtistModal')) return;

    mount.innerHTML = '' +
      '<div class="vh-artist-modal" id="vhArtistModal" aria-hidden="true">' +
        '<div class="vh-artist-modal__overlay" data-modal-close data-vh-artist-modal-close></div>' +
        '<section class="vh-artist-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="vhArtistModalName">' +
          '<button class="vh-artist-modal__close" type="button" data-modal-close data-vh-artist-modal-close aria-label="Закрыть карточку">×</button>' +
          '<div class="vh-artist-modal__main">' +
            '<div class="vh-artist-modal__media" id="vhArtistModalMedia">' +
              '<div class="vh-artist-modal__loading">Загружаю карточку артиста…</div>' +
            '</div>' +
            '<div class="vh-artist-modal__content">' +
              '<div class="vh-artist-modal__label" id="vhArtistModalType">VOCAVA</div>' +
              '<div class="vh-artist-modal__age-pill" id="vhArtistModalAgeCard" hidden><span id="vhArtistModalAge"></span></div>' +
              '<div class="vh-artist-modal__title-row"><h2 class="vh-title vh-title--card" id="vhArtistModalName">Карточка артиста</h2></div>' +
              '<p class="vh-artist-modal__short" id="vhArtistModalShortText" hidden></p>' +
              '<div class="vh-artist-modal__info-grid">' +
                '<div class="vh-artist-modal__info-card" id="vhArtistModalRepertoireDescriptionCard" hidden><span>Описание репертуара</span><p id="vhArtistModalRepertoireDescription"></p></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<section class="vh-artist-modal__about-section" id="vhArtistModalAboutSection" hidden>' +
            '<p class="vh-artist-modal__about" id="vhArtistModalLongAbout"></p>' +
          '</section>' +
          '<div class="vh-artist-modal__photos" id="vhArtistModalPhotos" aria-label="Фотографии музыканта"></div>' +
        '</section>' +
      '</div>' +
      '<div class="vh-artist-modal__photo-preview" id="vhArtistPhotoPreview" aria-hidden="true">' +
        '<button type="button" data-vh-artist-photo-close aria-label="Закрыть фотографию">×</button>' +
        '<img id="vhArtistPhotoPreviewImage" src="" alt="">' +
      '</div>';
  }

  function normalizeId(value) {
    return text(value).toLocaleLowerCase('ru-RU');
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

  function currentArtistId() {
    if (activeCard) {
      var cardId = text(activeCard.getAttribute('data-id'));
      if (cardId) return cardId;
    }

    var fromUrl = '';
    try { fromUrl = new URLSearchParams(window.location.search || '').get('artist') || ''; }
    catch (error) {}

    var root = document.getElementById('vr');
    var select = document.getElementById('vrArtistSelect');
    var selectedOption = document.querySelector('#vrArtistDropdownMenu [aria-selected="true"]');

    return text(fromUrl) ||
      text(root && root.getAttribute('data-artist-id')) ||
      text(select && select.value) ||
      text(selectedOption && selectedOption.getAttribute('data-artist-id'));
  }

  function cardArtist(card) {
    if (!card) return null;
    var shortNode = card.querySelector('.vh-artist-card__text');
    return {
      id: text(card.getAttribute('data-id')),
      short_text: text(shortNode && shortNode.textContent),
      about: text(card.getAttribute('data-about')),
      repertoire_description: text(card.getAttribute('data-repertoire-description'))
    };
  }

  function setBlock(element, value) {
    if (!element) return;
    var finalValue = descriptionText(value);
    element.textContent = finalValue;
    element.hidden = !finalValue;
  }

  function applyDescriptions(artist) {
    if (!artist) return;
    var shortText = descriptionText(
      artist.short_text || artist.shortText || artist.short_description || artist.shortDescription || artist.description
    );
    var about = descriptionText(artist.about || artist.bio || artist.full_description || artist.fullDescription);
    var repertoireDescription = descriptionText(
      artist.repertoire_description || artist.repertoireDescription || artist.repertoire_desc || artist.repertoireDesc
    );

    var shortElement = document.getElementById('vhArtistModalShortText');
    var aboutElement = document.getElementById('vhArtistModalLongAbout');
    var aboutSection = document.getElementById('vhArtistModalAboutSection');
    var repertoireElement = document.getElementById('vhArtistModalRepertoireDescription');
    var repertoireCard = document.getElementById('vhArtistModalRepertoireDescriptionCard');

    setBlock(shortElement, shortText);
    if (aboutElement) aboutElement.textContent = about;
    if (aboutSection) aboutSection.hidden = !about;
    if (repertoireElement) repertoireElement.textContent = repertoireDescription;
    if (repertoireCard) repertoireCard.hidden = !repertoireDescription;
  }

  function loadArtist(id, seed) {
    var api = window.VocavaPublicData;
    if (!api || typeof api.loadArtists !== 'function') return Promise.resolve(seed || null);

    var listPromise = api.loadArtists().catch(function () { return { rows: [] }; });
    var detailsPromise = typeof api.loadRepertoire === 'function'
      ? api.loadRepertoire(id).catch(function () { return null; })
      : Promise.resolve(null);

    return Promise.all([listPromise, detailsPromise]).then(function (responses) {
      var rows = responses[0] && (responses[0].rows || responses[0].artists || []);
      var fromList = (rows || []).find(function (artist) { return artistMatches(artist, id); }) || null;
      var details = responses[1] && responses[1].data ? responses[1].data : responses[1];
      var fromRepertoire = details && details.artist ? details.artist : null;
      return mergeArtist(seed, mergeArtist(fromList, fromRepertoire));
    });
  }

  function syncDescriptions() {
    var modal = document.getElementById('vhArtistModal');
    if (!modal || !modal.classList.contains('is-open')) return;

    var id = currentArtistId();
    var seed = cardArtist(activeCard);
    requestSerial += 1;
    var serial = requestSerial;

    applyDescriptions(seed);
    if (!id) return;

    loadArtist(id, seed).then(function (artist) {
      if (serial !== requestSerial || !modal.classList.contains('is-open')) return;
      applyDescriptions(artist);
    }).catch(function () {});
  }

  function installSync() {
    document.addEventListener('click', function (event) {
      var card = event.target.closest && event.target.closest('.vh-artist-card');
      if (card) activeCard = card;
    }, true);

    var modal = document.getElementById('vhArtistModal');
    if (!modal) return;

    var observer = new MutationObserver(function () {
      if (modal.classList.contains('is-open')) {
        window.setTimeout(syncDescriptions, 0);
      } else {
        requestSerial += 1;
        activeCard = null;
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }

  render();
  installSync();

  window.VHArtistCardView = Object.freeze({
    render: render,
    syncDescriptions: syncDescriptions
  });
}());
