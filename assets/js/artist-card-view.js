(function initArtistCardView() {
  'use strict';

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
              '<p class="vh-artist-modal__about" id="vhArtistModalAbout">Собираю информацию, фотографии и видео.</p>' +
              '<div class="vh-artist-modal__info-grid">' +
                '<div class="vh-artist-modal__info-card" id="vhArtistModalRepertoireDescriptionCard" hidden><span>Описание репертуара</span><p id="vhArtistModalRepertoireDescription"></p></div>' +
                '<div class="vh-artist-modal__info-card vh-artist-modal__repertoire-card" id="vhArtistModalRepertoireCard"><span>Репертуар</span><p id="vhArtistModalRepertoire"></p></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="vh-artist-modal__photos" id="vhArtistModalPhotos" aria-label="Фотографии музыканта"></div>' +
        '</section>' +
      '</div>' +
      '<div class="vh-artist-modal__photo-preview" id="vhArtistPhotoPreview" aria-hidden="true">' +
        '<button type="button" data-vh-artist-photo-close aria-label="Закрыть фотографию">×</button>' +
        '<img id="vhArtistPhotoPreviewImage" src="" alt="">' +
      '</div>';
  }

  render();

  window.VHArtistCardView = Object.freeze({
    render: render
  });
}());
