/* VLADISLOVEX — external JavaScript for Tilda
   Upload to: vocava/site/vladislovex/vladislovex.js
*/
'use strict';

(function () {
  var STORAGE_KEY = 'vh-color-theme';
  var root = document.documentElement;

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch (error) {
      return 'dark';
    }
  }

  function updateButtons(theme) {
    document.querySelectorAll('[data-vh-theme-toggle]').forEach(function (button) {
      var isLight = theme === 'light';
      button.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      button.setAttribute('aria-label', isLight ? 'Включить тёмную тему' : 'Включить светлую тему');
      var label = button.querySelector('[data-vh-theme-label]');
      if (label) label.textContent = isLight ? 'Тёмная тема' : 'Светлая тема';
    });
  }

  function applyTheme(theme, persist) {
    root.setAttribute('data-vh-theme', theme);
    root.style.colorScheme = theme;
    updateButtons(theme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'light' ? '#f2eee7' : '#040404';

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (error) {}
    }
  }

  applyTheme(getSavedTheme(), false);

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-vh-theme-toggle]');
    if (!button) return;
    event.preventDefault();
    var next = root.getAttribute('data-vh-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next, true);
  });
})();


(function () {
  'use strict';

  var owners = new Set();
  var scrollY = 0;
  var focusReturn = new WeakMap();

  function lock(owner) {
    owner = owner || document.body;
    if (owners.has(owner)) return;
    owners.add(owner);
    focusReturn.set(owner, document.activeElement);

    if (owners.size === 1) {
      scrollY = window.scrollY || window.pageYOffset || 0;
      document.body.classList.add('vh-overlay-open');
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }
  }

  function unlock(owner) {
    owner = owner || document.body;
    if (!owners.has(owner)) return;
    owners.delete(owner);

    var returnTarget = focusReturn.get(owner);
    focusReturn.delete(owner);

    if (owners.size === 0) {
      var html = document.documentElement;
      var previousScrollBehavior = html.style.scrollBehavior;

      html.style.scrollBehavior = 'auto';
      document.body.classList.remove('vh-overlay-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';

      if (returnTarget && typeof returnTarget.focus === 'function') {
        try { returnTarget.focus({ preventScroll: true }); }
        catch (e) { try { returnTarget.focus(); } catch (ignore) {} }
      }

      window.scrollTo(0, scrollY);

      requestAnimationFrame(function () {
        window.scrollTo(0, scrollY);
        requestAnimationFrame(function () {
          html.style.scrollBehavior = previousScrollBehavior;
        });
      });
      return;
    }

    if (returnTarget && typeof returnTarget.focus === 'function') {
      try { returnTarget.focus({ preventScroll: true }); }
      catch (e) {}
    }
  }

  function getActiveOverlay() {
    var selectors = [
      '.vh-contact-modal.is-open',
      '.vh-video-modal.is-open',
      '.vh-reviews-lightbox.vh-reviews-lightbox--open',
      '.vh-premium-header.is-menu-open .vh-premium-mobile-dropdown'
    ];
    var all = document.querySelectorAll(selectors.join(','));
    return all.length ? all[all.length - 1] : null;
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var overlay = getActiveOverlay();
    if (!overlay) return;

    var focusable = Array.from(overlay.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
      .filter(function (el) { return el.offsetParent !== null; });
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  window.VHUI = { lock: lock, unlock: unlock };

  // Safe single-pass scroll restoration.
  var key = 'vh_scroll_' + location.pathname + location.search;
  var type = 'navigate';
  try {
    var entry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (entry && entry.type) type = entry.type;
  } catch (e) {}
  var restore = type === 'reload' || type === 'back_forward';
  var cancelled = false;
  var saved = 0;
  try { saved = Number(sessionStorage.getItem(key) || 0); } catch (e) {}
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  ['wheel','touchstart','pointerdown'].forEach(function (name) {
    addEventListener(name, function () { cancelled = true; }, { passive:true, once:true });
  });

  addEventListener('pageshow', function () {
    if (!restore || cancelled || !saved) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!cancelled) scrollTo(0, Math.min(saved, Math.max(0, document.documentElement.scrollHeight - innerHeight)));
      });
    });
  }, { once:true });

  var saveTimer;
  addEventListener('scroll', function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { try { sessionStorage.setItem(key, String(window.scrollY || window.pageYOffset || 0)); } catch (e) {} }, 140);
  }, { passive:true });
  addEventListener('pagehide', function () { try { sessionStorage.setItem(key, String(window.scrollY || 0)); } catch (e) {} });
})();

;

(function () {
  var header = document.getElementById('vhPremiumHeader');
  var burger = document.getElementById('vhPremiumBurger');
  var dropdown = document.getElementById('vhPremiumMobileDropdown');
  var links = dropdown ? dropdown.querySelectorAll('a') : [];

  function openMenu() {
    if (!header || !burger || !dropdown) return;

    header.classList.add('is-menu-open');
    burger.classList.add('is-open');

    dropdown.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');

    if (window.VHUI) window.VHUI.lock(header);
  }

  function closeMenu() {
    if (!header || !burger || !dropdown) return;

    header.classList.remove('is-menu-open');
    burger.classList.remove('is-open');

    dropdown.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');

    if (window.VHUI) window.VHUI.unlock(header);
  }

  function toggleMenu() {
    if (!header) return;

    if (header.classList.contains('is-menu-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (burger) {
    burger.addEventListener('click', toggleMenu);
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var href = link.getAttribute('href') || '';

      if (href.charAt(0) === '#' && href.length > 1) {
        event.preventDefault();
        event.stopPropagation();

        var id;
        try { id = decodeURIComponent(href.slice(1)); }
        catch (error) { id = href.slice(1); }

        closeMenu();

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

            if (typeof window.VHScrollToAnchor === 'function') {
              window.VHScrollToAnchor(id, behavior);
            }

            if (history.pushState) {
              history.pushState(null, '', '#' + encodeURIComponent(id));
            } else {
              window.location.hash = id;
            }
          });
        });

        return;
      }

      closeMenu();
    });
  });

  document.addEventListener('click', function (e) {
    if (!header) return;

    var isClickInside = header.contains(e.target);

    if (!isClickInside && header.classList.contains('is-menu-open')) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  function keepHeaderStable() {
    if (!header) return;
    header.classList.remove('is-scrolled');
  }

  keepHeaderStable();
})();

;

(function () {
  var rail = document.getElementById('vhBenefitsRail');
  var track = document.getElementById('vhBenefitsTrack');

  if (!rail || !track) return;

  var original = track.querySelector('[data-vh-benefits-original]');
  if (!original) return;

  var offset = 0;
  var baseWidth = 1;
  var lastTime = performance.now();

  var isDragging = false;
  var startX = 0;
  var startOffset = 0;
  var lastX = 0;
  var lastMoveTime = 0;
  var inertiaVelocity = 0;

  var autoSpeed = window.innerWidth <= 640 ? 30 : 36;
  var resizeTimer = null;
  var animationFrame = null;
  var isVisible = true;
  var reduceMotionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = !!(reduceMotionQuery && reduceMotionQuery.matches) || window.innerWidth <= 860;

  function getGap() {
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap || 0);
    return isNaN(gap) ? 0 : gap;
  }

  function normalize(value) {
    if (!baseWidth || baseWidth <= 0) return 0;
    return ((value % baseWidth) + baseWidth) % baseWidth;
  }

  function removeClones() {
    var clones = track.querySelectorAll('[data-vh-benefits-clone]');
    clones.forEach(function (clone) {
      clone.remove();
    });
  }

  function buildInfiniteTrack() {
    removeClones();

    var railWidth = rail.getBoundingClientRect().width;
    var originalWidth = original.getBoundingClientRect().width;

    if (!railWidth || !originalWidth) {
      setTimeout(buildInfiniteTrack, 300);
      return;
    }

    var copiesNeeded = window.innerWidth <= 860 ? 1 : Math.max(4, Math.ceil((railWidth * 2.2) / originalWidth) + 1);

    for (var i = 0; i < copiesNeeded; i++) {
      var clone = original.cloneNode(true);
      clone.removeAttribute('data-vh-benefits-original');
      clone.setAttribute('data-vh-benefits-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }

    baseWidth = original.getBoundingClientRect().width + getGap();
    offset = normalize(offset);
    applyTransform();
  }

  function applyTransform() {
    track.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';
  }

  function animate(now) {
    if (!isVisible || document.hidden || reduceMotion) {
      animationFrame = null;
      return;
    }

    var delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (!isDragging) {
      var totalSpeed = autoSpeed + inertiaVelocity;
      offset = normalize(offset + totalSpeed * delta);
      inertiaVelocity *= Math.pow(0.92, delta * 60);

      if (Math.abs(inertiaVelocity) < 0.4) inertiaVelocity = 0;
      applyTransform();
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animationFrame || !isVisible || document.hidden || reduceMotion) return;
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(animate);
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    isDragging = true;
    startX = event.clientX;
    lastX = event.clientX;
    startOffset = offset;
    lastMoveTime = performance.now();
    inertiaVelocity = 0;

    rail.classList.add('is-dragging');

    try {
      rail.setPointerCapture(event.pointerId);
    } catch (e) {}
  }

  function onPointerMove(event) {
    if (!isDragging) return;

    event.preventDefault();

    var now = performance.now();
    var deltaX = event.clientX - startX;
    var moveDelta = event.clientX - lastX;
    var moveTime = Math.max(now - lastMoveTime, 16);

    offset = normalize(startOffset - deltaX);
    inertiaVelocity = -(moveDelta / moveTime) * 1000;

    lastX = event.clientX;
    lastMoveTime = now;

    applyTransform();
  }

  function endDrag(event) {
    if (!isDragging) return;

    isDragging = false;
    rail.classList.remove('is-dragging');

    try {
      rail.releasePointerCapture(event.pointerId);
    } catch (e) {}
  }

  function onResize() {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(function () {
      autoSpeed = window.innerWidth <= 640 ? 30 : 36;
      reduceMotion = !!(reduceMotionQuery && reduceMotionQuery.matches) || window.innerWidth <= 860;
      if (reduceMotion && animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      buildInfiniteTrack();
      startAnimation();
    }, 180);
  }

  rail.addEventListener('pointerdown', onPointerDown);
  rail.addEventListener('pointermove', onPointerMove);
  rail.addEventListener('pointerup', endDrag);
  rail.addEventListener('pointercancel', endDrag);
  rail.addEventListener('lostpointercapture', endDrag);

  window.addEventListener('resize', onResize);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      isVisible = !!(entries[0] && entries[0].isIntersecting);
      if (isVisible) startAnimation();
    }, { rootMargin: '180px 0px' }).observe(rail);
  }

  document.addEventListener('visibilitychange', startAnimation);
  buildInfiniteTrack();
  startAnimation();
})();

;

(function () {
  var modal = document.getElementById('vhVideoModal');
  var player = document.getElementById('vhVideoPlayer');
  var title = document.getElementById('vhVideoModalTitle');
  var cards = document.querySelectorAll('.vh-video-card');
  var closeBtn = modal ? modal.querySelector('.vh-video-modal__close') : null;
  var overlay = modal ? modal.querySelector('.vh-video-modal__overlay') : null;
  var canHoverPreview = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var previewStart = 0.2;
  var previewLength = 5.8;

  function formatDuration(seconds) {
    if (!seconds || !isFinite(seconds)) return '--:--';

    var total = Math.round(seconds);
    var minutes = Math.floor(total / 60);
    var secs = total % 60;

    return minutes + ':' + String(secs).padStart(2, '0');
  }

  function setRealDurations() {
    cards.forEach(function (card) {
      var preview = card.querySelector('.vh-video-card__preview');
      var time = card.querySelector('.vh-video-card__time');

      if (!preview || !time) return;

      function updateTime() {
        time.textContent = formatDuration(preview.duration);
      }

      if (preview.readyState >= 1) {
        updateTime();
      } else {
        preview.addEventListener('loadedmetadata', updateTime, { once: true });
      }

      preview.addEventListener('error', function () {
        time.textContent = '--:--';
      });
    });
  }

  function stopAllPreviews() {
    cards.forEach(function (card) {
      var preview = card.querySelector('.vh-video-card__preview');
      var progress = card.querySelector('.vh-video-card__progress span');

      card.classList.remove('is-previewing');

      if (progress) {
        progress.style.animation = 'none';
        progress.offsetHeight;
        progress.style.animation = '';
      }

      if (preview) {
        preview.pause();

        try {
          preview.currentTime = previewStart;
        } catch (e) {}
      }
    });
  }

  function setupHoverPreviews() {
    if (!canHoverPreview) return;

    cards.forEach(function (card) {
      var preview = card.querySelector('.vh-video-card__preview');
      var progress = card.querySelector('.vh-video-card__progress span');

      if (!preview) return;

      preview.muted = true;
      preview.loop = false;

      card.addEventListener('mouseenter', function () {
        stopAllPreviews();

        card.classList.add('is-previewing');

        if (progress) {
          progress.style.animation = 'none';
          progress.offsetHeight;
          progress.style.animation = '';
        }

        try {
          preview.currentTime = previewStart;
        } catch (e) {}

        preview.play().catch(function () {});
      });

      card.addEventListener('mouseleave', function () {
        card.classList.remove('is-previewing');
        preview.pause();

        try {
          preview.currentTime = previewStart;
        } catch (e) {}

        if (progress) {
          progress.style.animation = 'none';
          progress.offsetHeight;
          progress.style.animation = '';
        }
      });

      preview.addEventListener('timeupdate', function () {
        if (!card.classList.contains('is-previewing')) return;

        if (preview.currentTime >= previewStart + previewLength) {
          try {
            preview.currentTime = previewStart;
          } catch (e) {}
        }
      });
    });
  }

  function openVideo(videoUrl, videoTitle) {
    if (!modal || !player) return;

    stopAllPreviews();

    player.src = videoUrl;
    title.textContent = videoTitle || 'Видео выступления';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (window.VHUI) window.VHUI.lock(modal);

    setTimeout(function () {
      player.play().catch(function () {});
    }, 180);
  }

  function closeVideo() {
    if (!modal || !player) return;

    player.pause();
    player.removeAttribute('src');
    player.load();

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (window.VHUI) window.VHUI.unlock(modal);
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      openVideo(card.getAttribute('data-video'), card.getAttribute('data-title'));
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeVideo);
  }

  if (overlay) {
    overlay.addEventListener('click', closeVideo);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeVideo();
    }
  });

  function activatePreviews() {
    if (window.innerWidth <= 860) {
      cards.forEach(function (card) {
        var time = card.querySelector('.vh-video-card__time');
        if (time) time.textContent = 'Смотреть';
      });
      return;
    }

    cards.forEach(function (card) {
      var preview = card.querySelector('.vh-video-card__preview');
      if (preview && preview.preload === 'none') {
        preview.preload = 'metadata';
        preview.load();
      }
    });
    setRealDurations();
    setupHoverPreviews();
  }

  var videoSection = document.getElementById('video');
  if ('IntersectionObserver' in window && videoSection) {
    var videoObserver = new IntersectionObserver(function (entries) {
      if (entries[0] && entries[0].isIntersecting) {
        activatePreviews();
        videoObserver.disconnect();
      }
    }, { rootMargin: '280px 0px' });
    videoObserver.observe(videoSection);
  } else {
    activatePreviews();
  }
})();

;

(function () {
  var root = document.getElementById('vhPriceCalc');
  if (!root) return;

  var DADATA_TOKEN = 'a892cfca8da7cbe521efabaf6a6d511c4a2bc084';
  var DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';
  var MAX_URL = 'https://max.ru/u/f9LHodD0cOLPxapfZcahRoy6woOQBErgRvugFSq8XUK2cZxjjnIt_r9ru7A';

  var PRICES = {
    guitaristHourly: 5000,
    guitaristMinimum: 8000,
    equipmentFixed: 4000,
    cajonHourly: 3000,
    cajonMinimum: 5000,
    discountMinTotal: 16000,
    videoReviewDiscount: 1000,
    photoReviewDiscount: 1000
  };

  var ROAD_RULES = {
    inside: 0,
    to20: 3000,
    to35: 4000,
    to50: 5000,
    to75: 6000,
    to100: 7000,
    to130: 8000,
    far: 9000
  };

  var CAJON_ROAD_RULES = {
    unknown: 0,
    inside: 0,
    to20: 1000,
    to35: 2000,
    to50: 3000,
    to75: 3000,
    to100: 3000,
    to130: 3000,
    far: 3000
  };

  var LABELS = {
    event: {
      birthday: 'день рождения',
      wedding: 'свадьба',
      corporate: 'корпоратив',
      anniversary: 'юбилей',
      restaurant: 'ресторан / бар',
      proposal: 'предложение / сюрприз',
      private: 'камерный вечер',
      online: 'онлайн-поздравление',
      other: 'другое'
    },
    format: {
      acoustic: '1. Камерный вечер: акустическая гитара + вокал',
      party: '2. Живая вечеринка: гитара + колонка + микрофон',
      mini: '3. Мини-группа: гитара + оборудование + кахон'
    },
    formatDescription: {
      acoustic: '1. гитара + вокал',
      party: '2. гитара + колонка + микрофон',
      mini: '3. гитара + оборудование + кахон'
    },
    road: {
      unknown: 'адрес не указан',
      inside: 'внутри МКАД',
      to20: 'за МКАД до 20 км',
      to35: 'за МКАД 20–35 км',
      to50: 'за МКАД 35–50 км',
      to75: 'за МКАД 50–75 км',
      to100: 'за МКАД 75–100 км',
      to130: 'за МКАД 100–130 км',
      far: 'за МКАД от 130 км'
    }
  };

  var ADVANTAGES = [
    'Живое исполнение: гитара и вокал без ощущения фоновой музыки',
    'Репертуар 240+ песен: можно выбрать заранее или ориентироваться по гостям на месте',
    'Интерактив с гостями: подпевание, живое караоке и песни по настроению вечера',
    'Можно выступить со своим оборудованием: колонка, микрофон и всё необходимое для звука'
  ];

  var MOSCOW_CENTER = [55.755864, 37.617698];
  var MKAD_APPROX_RADIUS_KM = 17.5;

  var dateField = document.getElementById('vhCalcDateField');
  var addressField = document.getElementById('vhCalcAddressField');
  var eventSelect = document.getElementById('vhCalcEventType');

  var formatInputs = root.querySelectorAll('input[name="vhCalcFormat"]');
  var formatCards = root.querySelectorAll('.vh-price-calc__format');
  var formatSelectMobile = document.getElementById('vhCalcFormatMobile');
  var formatInfoToggle = document.getElementById('vhCalcFormatInfoToggle');
  var formatInfo = document.getElementById('vhCalcFormatInfo');

  var durationInput = document.getElementById('vhCalcDuration');
  var durationText = document.getElementById('vhCalcDurationText');

  var dateInput = document.getElementById('vhCalcDate');
  var dateOpen = document.getElementById('vhCalcDateOpen');
  var dateStatus = document.getElementById('vhCalcDateStatus');

  var addressInput = document.getElementById('vhCalcAddress');
  var addressStatus = document.getElementById('vhCalcAddressStatus');
  var suggestionsBox = document.getElementById('vhCalcSuggestions');

  var discountBlock = document.getElementById('vhCalcDiscountBlock');
  var discountToggle = document.getElementById('vhCalcDiscountToggle');
  var discountHint = document.getElementById('vhCalcDiscountHint');
  var videoReviewInput = document.getElementById('vhCalcVideoReview');
  var photoReviewInput = document.getElementById('vhCalcPhotoReview');

  var priceEl = document.getElementById('vhCalcPrice');
  var oldRowEl = document.getElementById('vhCalcOldRow');
  var oldPriceEl = document.getElementById('vhCalcOldPrice');
  var oldReasonEl = document.getElementById('vhCalcOldReason');
  var summaryEl = document.getElementById('vhCalcSummary');
  var breakdownEl = document.getElementById('vhCalcBreakdown');
  var tgLink = document.getElementById('vhCalcTelegram');
  var maxLink = document.getElementById('vhCalcMax');

  var pdfButton = document.getElementById('vhCalcPdfDownload');
  var copyButton = document.getElementById('vhCalcCopyOffer');
  var actionStatus = document.getElementById('vhCalcActionStatus');
  var pdfStage = document.getElementById('vhPdfStage');

  var suggestTimer = null;
  var activeSuggestRequest = 0;
  var selectedSuggestion = null;

  var roadInfo = {
    category: 'unknown',
    label: LABELS.road.unknown,
    price: 0,
    kmFromMkad: null
  };

  function setFieldState(field, isFilled) {
    if (!field) return;
    field.classList.remove('is-needed');
    if (!isFilled) field.classList.add('is-needed');
  }

  function isOfferReady() {
    return !!(
      dateInput &&
      dateInput.value &&
      addressInput &&
      addressInput.value.trim() &&
      roadInfo.category !== 'unknown'
    );
  }

  function getOfferMissingText() {
    var parts = [];

    if (!dateInput || !dateInput.value) {
      parts.push('дату');
    }

    if (!addressInput || !addressInput.value.trim() || roadInfo.category === 'unknown') {
      parts.push('адрес из подсказок');
    }

    return 'Заполните ' + parts.join(' и ') + ', чтобы создать коммерческое предложение.';
  }

  function updateOfferActionState() {
    var ready = isOfferReady();

    [pdfButton, copyButton].forEach(function (button) {
      if (!button) return;
      button.classList.toggle('is-disabled', !ready);
    });

    if (pdfButton) {
      pdfButton.setAttribute('data-tooltip', ready ? 'Скачать КП в PDF' : 'Заполните дату и адрес');
    }

    if (copyButton) {
      copyButton.setAttribute('data-tooltip', ready ? 'Скопировать КП' : 'Заполните дату и адрес');
    }
  }

  function touchRequiredFields() {
    if (dateField) dateField.classList.add('is-touched');
    if (addressField) addressField.classList.add('is-touched');
  }

  function updateFieldStates() {
    setFieldState(dateField, !!(dateInput && dateInput.value));
    setFieldState(addressField, roadInfo.category !== 'unknown' && !!addressInput.value.trim());
    updateOfferActionState();
  }

  function openDatePicker() {
    if (!dateInput) return;
    dateInput.focus();

    if (typeof dateInput.showPicker === 'function') {
      try {
        dateInput.showPicker();
      } catch (e) {}
    }
  }

  function getFormat() {
    var checked = root.querySelector('input[name="vhCalcFormat"]:checked');
    return checked ? checked.value : 'acoustic';
  }

  function syncFormat(format) {
    formatInputs.forEach(function (input) {
      input.checked = input.value === format;
    });

    formatCards.forEach(function (card) {
      var input = card.querySelector('input');
      card.classList.toggle('is-active', input && input.value === format);
    });

    if (formatSelectMobile) formatSelectMobile.value = format;
  }

  function normalizeDurationValue(value) {
    var normalized = String(value || '')
      .replace(',', '.')
      .replace(/[^0-9.]/g, '');

    var numberValue = parseFloat(normalized);

    if (isNaN(numberValue)) {
      numberValue = Number(durationInput && durationInput.value ? durationInput.value : 2);
    }

    numberValue = Math.round(numberValue * 2) / 2;
    numberValue = Math.max(0, Math.min(5, numberValue));

    return numberValue;
  }

  function getRealHoursByValue(value) {
    var numberValue = normalizeDurationValue(value);
    if (numberValue === 0) return 0.25;
    return numberValue;
  }

  function formatDurationNumber(value) {
    return String(value).replace('.', ',');
  }

  function getDurationLabelByValue(value) {
    var numberValue = normalizeDurationValue(value);

    if (numberValue === 0) return 'пара песен';
    if (numberValue === 0.5) return '30 минут';
    if (numberValue === 1) return '1 час';
    if (numberValue % 1 !== 0) return formatDurationNumber(numberValue) + ' часа';
    if (numberValue >= 2 && numberValue <= 4) return numberValue + ' часа';

    return '5 часов';
  }

  function getDurationLabel() {
    return getDurationLabelByValue(durationInput.value);
  }

  function setDurationValue(value) {
    if (!durationInput) return;

    var normalized = normalizeDurationValue(value);
    durationInput.value = normalized;

    calculate();
  }

  function formatMoney(value) {
    var rounded = Math.round(value / 500) * 500;
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  function capitalizeFirst(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function formatDateRu(date) {
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var yyyy = date.getFullYear();
    return dd + '.' + mm + '.' + yyyy;
  }

  function getWeekdayRu(date) {
    return date.toLocaleDateString('ru-RU', { weekday: 'long' });
  }

  function getDayInfo() {
    var value = dateInput ? dateInput.value : '';

    if (!value) {
      return {
        type: 'weekend',
        formatted: '',
        weekday: ''
      };
    }

    var parts = value.split('-');
    var year = Number(parts[0]);
    var month = Number(parts[1]) - 1;
    var day = Number(parts[2]);
    var date = new Date(year, month, day);
    var dayNumber = date.getDay();
    var isWeekendTariff = dayNumber === 5 || dayNumber === 6 || dayNumber === 0;

    return {
      type: isWeekendTariff ? 'weekend' : 'weekday',
      formatted: formatDateRu(date),
      weekday: getWeekdayRu(date)
    };
  }

  function updateDateStatus(dayInfo) {
    if (!dateStatus) return;
    dateStatus.classList.remove('is-good');

    if (!dateInput.value) {
      dateStatus.textContent = 'Дата нужна для проверки занятости и не влияет на стоимость.';
      return;
    }

    dateStatus.textContent =
      'Дата подтверждена: ' +
      dayInfo.formatted +
      (dayInfo.weekday ? '. ' + capitalizeFirst(dayInfo.weekday) + '.' : '.');
    dateStatus.classList.add('is-good');
  }

  function calculateGuitaristPrice(hours) {
    return Math.max(PRICES.guitaristMinimum, hours * PRICES.guitaristHourly);
  }

  function calculateCajonPrice(hours) {
    return Math.max(PRICES.cajonMinimum, hours * PRICES.cajonHourly);
  }

  function getNextHourPrice(format) {
    var price = PRICES.guitaristHourly;
    if (format === 'mini') price += PRICES.cajonHourly;
    return price;
  }

  function calculatePriceModel(durationValue, format, dayType, useClientDiscounts) {
    durationValue = normalizeDurationValue(durationValue);
    var hours = getRealHoursByValue(durationValue);
    var guitaristPrice = calculateGuitaristPrice(hours);
    var equipmentPrice = (format === 'party' || format === 'mini') ? PRICES.equipmentFixed : 0;
    var cajonPrice = format === 'mini' ? calculateCajonPrice(hours) : 0;
    var cajonRoadPrice = format === 'mini' ? getCajonRoadPriceByCategory(roadInfo.category) : 0;
    var roadPrice = roadInfo.price || 0;
    var totalBeforeClientDiscount = guitaristPrice + equipmentPrice + cajonPrice + cajonRoadPrice + roadPrice;
    var discountsAvailable = totalBeforeClientDiscount >= PRICES.discountMinTotal;
    var clientDiscount = 0;

    if (useClientDiscounts && discountsAvailable && videoReviewInput && videoReviewInput.checked) {
      clientDiscount += PRICES.videoReviewDiscount;
    }
    if (useClientDiscounts && discountsAvailable && photoReviewInput && photoReviewInput.checked) {
      clientDiscount += PRICES.photoReviewDiscount;
    }

    var total = Math.max(0, totalBeforeClientDiscount - clientDiscount);

    return {
      durationValue: Number(durationValue),
      durationLabel: getDurationLabelByValue(durationValue),
      hours: hours,
      guitaristPrice: guitaristPrice,
      actualArtistWithMinimum: guitaristPrice,
      equipmentPrice: equipmentPrice,
      cajonPrice: cajonPrice,
      cajonRoadPrice: cajonRoadPrice,
      roadPrice: roadPrice,
      totalWithoutDiscounts: totalBeforeClientDiscount,
      totalBeforeClientDiscount: totalBeforeClientDiscount,
      clientDiscount: clientDiscount,
      totalDiscount: clientDiscount,
      total: total,
      discountsAvailable: discountsAvailable,
      amountLeft: Math.max(0, PRICES.discountMinTotal - totalBeforeClientDiscount)
    };
  }

  function updateDiscountVisibility(isVisible, amountLeft) {
    if (!discountBlock || !discountHint) return;

    discountBlock.classList.toggle('is-visible', isVisible);
    discountHint.classList.toggle('is-good', isVisible);

    if (isVisible) {
      discountHint.textContent = 'Скидка доступна: можно выбрать вариант выше.';
    } else {
      discountHint.textContent = 'До скидки осталось ' + formatMoney(amountLeft) + '.';
      discountBlock.classList.remove('is-open');

      if (videoReviewInput) videoReviewInput.checked = false;
      if (photoReviewInput) photoReviewInput.checked = false;
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderSummary(items) {
    summaryEl.innerHTML = items.map(function (item) {
      return '<span>' + escapeHtml(item.text) + '</span>';
    }).join('');
  }

  function renderBreakdown(items) {
    breakdownEl.innerHTML = items.map(function (item) {
      var className = item.isDiscount ? ' class="is-discount"' : '';
      return '<li' + className + '>' + escapeHtml(item.text) + '</li>';
    }).join('');
  }

  function getBreakdownItems(model) {
    var breakdown = [];

    breakdown.push({
      text: 'Выступление гитариста — ' + formatMoney(model.guitaristPrice),
      label: 'Выступление гитариста',
      value: formatMoney(model.guitaristPrice)
    });

    if (model.equipmentPrice > 0) {
      breakdown.push({
        text: 'Оборудование — +' + formatMoney(model.equipmentPrice),
        label: 'Оборудование',
        value: '+' + formatMoney(model.equipmentPrice)
      });
    }

    if (model.cajonPrice > 0) {
      breakdown.push({
        text: 'Кахонист — +' + formatMoney(model.cajonPrice),
        label: 'Кахонист',
        value: '+' + formatMoney(model.cajonPrice)
      });
    }

    if (model.cajonRoadPrice > 0) {
      breakdown.push({
        text: 'Дорога кахониста — +' + formatMoney(model.cajonRoadPrice) + ' (не более 3 000 ₽)',
        label: 'Дорога кахониста',
        value: '+' + formatMoney(model.cajonRoadPrice)
      });
    }

    if (roadInfo.category === 'unknown') {
      breakdown.push({
        text: 'Дорога — внутри МКАД без доплат, за МКАД от 3 000 ₽',
        label: 'Дорога',
        value: 'от 3 000 ₽'
      });
    } else if (model.roadPrice > 0) {
      breakdown.push({
        text: 'Дорога — +' + formatMoney(model.roadPrice) + ' (' + roadInfo.label + ')',
        label: 'Дорога',
        value: '+' + formatMoney(model.roadPrice)
      });
    } else {
      breakdown.push({
        text: 'Дорога — без доплаты (' + roadInfo.label + ')',
        label: 'Дорога',
        value: '0 ₽'
      });
    }


    if (model.clientDiscount > 0) {
      breakdown.push({
        text: 'Скидка за отзыв — −' + formatMoney(model.clientDiscount),
        label: 'Скидка за отзыв',
        value: '−' + formatMoney(model.clientDiscount),
        isDiscount: true
      });
    }

    return breakdown;
  }

  function calculate() {
    var eventType = eventSelect ? eventSelect.value : 'birthday';
    var format = getFormat();
    var dayInfo = getDayInfo();
    var address = addressInput.value.trim();

    updateDateStatus(dayInfo);

    var model = calculatePriceModel(normalizeDurationValue(durationInput.value), format, dayInfo.type, true);

    updateDiscountVisibility(model.discountsAvailable, model.amountLeft);

    model = calculatePriceModel(normalizeDurationValue(durationInput.value), format, dayInfo.type, true);

    priceEl.textContent = formatMoney(model.total);

    if (model.totalDiscount > 0) {
      var oldReasons = [];

      if (model.clientDiscount > 0) oldReasons.push('отзыв');

      oldPriceEl.textContent = formatMoney(model.totalWithoutDiscounts);
      oldReasonEl.textContent = oldReasons.length ? 'скидка: ' + oldReasons.join(' + ') : '';
      oldRowEl.classList.add('is-visible');
    } else {
      oldPriceEl.textContent = '';
      oldReasonEl.textContent = '';
      oldRowEl.classList.remove('is-visible');
    }

    var summaryItems = [];

    summaryItems.push({ text: LABELS.event[eventType] });
    summaryItems.push({ text: LABELS.formatDescription[format] });

    if (dateInput.value) summaryItems.push({ text: dayInfo.formatted });

    summaryItems.push({ text: model.durationLabel });

    if (address) summaryItems.push({ text: address });

    renderSummary(summaryItems);
    renderBreakdown(getBreakdownItems(model));

    tgLink.href = 'https://t.me/vladislove_xv';
    maxLink.href = MAX_URL;

    updateRangeFill();
    updateFieldStates();
  }

  function getOfferDurationValues() {
    var selected = normalizeDurationValue(durationInput.value);
    var isWholeHour = Math.abs(selected - Math.round(selected)) < 0.01 && selected >= 1;
    var step = isWholeHour ? 1 : 0.5;
    var minValue = 0.5;
    var maxValue = 5;

    if (selected <= minValue) return [0.5, 1, 1.5];
    if (selected >= maxValue) return [3, 4, 5];

    var values = [selected - step, selected, selected + step]
      .map(normalizeDurationValue)
      .filter(function (value) { return value >= minValue && value <= maxValue; });

    while (values.length < 3 && values[0] > minValue) {
      values.unshift(normalizeDurationValue(values[0] - step));
    }
    while (values.length < 3 && values[values.length - 1] < maxValue) {
      values.push(normalizeDurationValue(values[values.length - 1] + step));
    }

    return values.slice(0, 3);
  }

  function buildOfferData() {
    var eventType = eventSelect ? eventSelect.value : 'birthday';
    var format = getFormat();
    var dayInfo = getDayInfo();
    var address = addressInput.value.trim();
    var durationValues = getOfferDurationValues();
    var selectedDurationValue = normalizeDurationValue(durationInput.value);
    var nextHourPrice = getNextHourPrice(format);

    var options = durationValues.map(function (value) {
      var model = calculatePriceModel(value, format, dayInfo.type, true);

      return {
        durationValue: value,
        durationLabel: capitalizeFirst(model.durationLabel),
        price: model.total,
        priceText: formatMoney(model.total),
        isSelected: Math.abs(value - selectedDurationValue) < 0.01,
        totalDiscount: model.totalDiscount
      };
    });

    var selectedModel = calculatePriceModel(selectedDurationValue, format, dayInfo.type, true);

    return {
      event: capitalizeFirst(LABELS.event[eventType]),
      formatTitle: capitalizeFirst(LABELS.formatDescription[format].replace(/^\d+\.\s*/, '')),
      formatShort: LABELS.formatDescription[format],
      date: dayInfo.formatted,
      weekday: dayInfo.weekday ? capitalizeFirst(dayInfo.weekday) : '',
      address: capitalizeFirst(address),
      road: roadInfo.category === 'unknown'
        ? 'Внутри МКАД без доплат, за МКАД от 3 000 ₽'
        : capitalizeFirst(roadInfo.label),
      roadPrice: roadInfo.category === 'unknown'
        ? ''
        : (roadInfo.price > 0 ? formatMoney(roadInfo.price) : 'Без доплаты'),
      nextHourText: formatMoney(nextHourPrice),
      selectedModel: selectedModel,
      options: options,
      breakdown: getBreakdownItems(selectedModel),
      advantages: ADVANTAGES
    };
  }

  function buildOfferText() {
    var data = buildOfferData();
    var lines = [];

    lines.push('ВЫСТУПЛЕНИЕ МУЗЫКАНТА');
    lines.push('Гитарист-вокалист');
    lines.push('');
    lines.push('Владислав Хеколов');
    lines.push('Телефон: +7 999 800 31-91');
    lines.push('Telegram: @vladislove_xv');
    lines.push('');
    lines.push('Детали мероприятия:');
    lines.push('• Мероприятие: ' + data.event);
    lines.push('• Формат: ' + data.formatTitle);
    lines.push('• Дата: ' + data.date + (data.weekday ? ', ' + data.weekday : ''));
    lines.push('• Адрес: ' + data.address);
    lines.push('• Дорога: ' + data.road + (data.roadPrice ? ', ' + data.roadPrice : ''));
    lines.push('• Стоимость продления: ' + data.nextHourText + ' в час');
    lines.push('');
    lines.push('Варианты стоимости:');

    data.options.forEach(function (option) {
      lines.push(
        '• ' +
        option.durationLabel +
        ' — ' +
        option.priceText +
        (option.isSelected ? ' — выбранный вариант' : '')
      );
    });

    lines.push('');
    lines.push('Преимущества:');

    data.advantages.forEach(function (item) {
      lines.push('• ' + item);
    });

    lines.push('');
    lines.push('Как считаем стоимость:');

    data.breakdown.forEach(function (item) {
      lines.push('• ' + item.text);
    });

    lines.push('');
    lines.push('Стоимость указана по выбранным условиям. Дата закрепляется после подтверждения бронирования.');

    return lines.join('\n');
  }

  function setActionStatus(text, type) {
    if (!actionStatus) return;

    actionStatus.textContent = text || '';
    actionStatus.classList.toggle('is-error', type === 'error');

    if (text) {
      clearTimeout(setActionStatus.timer);

      setActionStatus.timer = setTimeout(function () {
        actionStatus.textContent = '';
        actionStatus.classList.remove('is-error');
      }, 3000);
    }
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement('textarea');

        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';

        document.body.appendChild(textarea);
        textarea.select();

        var ok = document.execCommand('copy');

        document.body.removeChild(textarea);

        if (ok) resolve();
        else reject(new Error('copy_failed'));
      } catch (error) {
        reject(error);
      }
    });
  }

  function copyOffer() {
    if (!isOfferReady()) {
      touchRequiredFields();
      setActionStatus(getOfferMissingText(), 'error');
      updateFieldStates();
      return;
    }

    copyTextToClipboard(buildOfferText())
      .then(function () {
        setActionStatus('Коммерческое предложение скопировано.');
      })
      .catch(function () {
        setActionStatus('Не получилось скопировать. Попробуйте ещё раз.', 'error');
      });
  }

  function renderOfferTemplate() {
    var data = buildOfferData();
    var selectedOption = data.options.filter(function (option) {
      return option.isSelected;
    })[0] || data.options[1] || data.options[0];

    var detailItems = [
      { label: 'Мероприятие', value: data.event },
      { label: 'Формат', value: data.formatTitle },
      { label: 'Дата', value: data.date + (data.weekday ? ', ' + data.weekday : '') },
      { label: 'Адрес', value: data.address },
      { label: 'Дорога', value: data.road + (data.roadPrice ? ', ' + data.roadPrice : '') }
    ];

    var priceOptionsHtml = data.options.map(function (option) {
      return (
        '<div class="vh-offer-option ' + (option.isSelected ? 'is-selected' : '') + '">' +
          (option.isSelected ? '<div class="vh-offer-option-check">✓</div>' : '') +
          '<div>' + escapeHtml(option.durationLabel) + ' —</div>' +
          '<div>' + escapeHtml(option.priceText) + '</div>' +
        '</div>'
      );
    }).join('');

    var detailsHtml = detailItems.map(function (item) {
      return (
        '<div class="vh-offer-detail">' +
          '<span class="vh-offer-detail-label">' + escapeHtml(item.label) + '</span>' +
          '<span class="vh-offer-detail-value">' + escapeHtml(item.value) + '</span>' +
        '</div>'
      );
    }).join('');

    var advantagesHtml = data.advantages.map(function (item, index) {
      return (
        '<div class="vh-offer-adv">' +
          '<span class="vh-offer-adv-number">0' + (index + 1) + '</span>' +
          escapeHtml(item) +
        '</div>'
      );
    }).join('');

    var breakdownHtml = data.breakdown.map(function (item) {
      return (
        '<div class="vh-offer-cost-row ' + (item.isDiscount ? 'is-discount' : '') + '">' +
          '<span>' + escapeHtml(item.label || '') + '</span>' +
          '<b>' + escapeHtml(item.value || '') + '</b>' +
        '</div>'
      );
    }).join('');

    pdfStage.innerHTML =
      '<div class="vh-offer-page" id="vhOfferPage">' +

        '<div class="vh-offer-header">' +
          '<div>' +
            '<h1 class="vh-offer-title">Выступление музыканта</h1>' +
            '<div class="vh-offer-title-line"></div>' +
            '' +
          '</div>' +

          '<div class="vh-offer-person">' +
            '<div class="vh-offer-name">Владислав Хеколов</div>' +
            '<div class="vh-offer-role">Гитарист-вокалист</div>' +
            '<div class="vh-offer-contacts">' +
              '<div class="vh-offer-contact-row"><span class="vh-offer-contact-label">Телефон</span><span>+7 999 800 31-91</span></div>' +
              '<div class="vh-offer-contact-row"><span class="vh-offer-contact-label">Telegram</span><span>@vladislove_xv</span></div>' +
              '<div class="vh-offer-contact-row"><span class="vh-offer-contact-label">Город</span><span>Москва и МО</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="vh-offer-price-card">' +
          '<div>' +
            '<div class="vh-offer-total-label">Итого:</div>' +
            '<div class="vh-offer-total-price">' + escapeHtml(selectedOption ? selectedOption.priceText : '') + '</div>' +
            '<div class="vh-offer-total-note">Стоимость по выбранным условиям</div>' +
          '</div>' +

          '<div>' +
            '<div class="vh-offer-options">' +
              priceOptionsHtml +
              '<div class="vh-offer-next">Стоимость продления — <span>' + escapeHtml(data.nextHourText) + '/час</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="vh-offer-event-grid">' +
          '<div class="vh-offer-card">' +
            '<h2 class="vh-offer-section-title">Детали мероприятия</h2>' +
            detailsHtml +
          '</div>' +
          '<div class="vh-offer-card">' +
            '<h2 class="vh-offer-section-title">Как считаем стоимость</h2>' +
            breakdownHtml +
          '</div>' +
        '</div>' +

        '<div class="vh-offer-value-card">' +
          '<div class="vh-offer-value-copy">' +
            '<div class="vh-offer-value-kicker">Что получат гости</div>' +
            '<h2 class="vh-offer-section-title">Живая музыка, которая объединяет людей</h2>' +
          '</div>' +
          '<div class="vh-offer-advantages">' + advantagesHtml + '</div>' +
          '<div class="vh-offer-small-info">Дата закрепляется после подтверждения бронирования.</div>' +
        '</div>' +

      '</div>';

    return document.getElementById('vhOfferPage');
  }


  function loadExternalScript(src, test) {
    if (test()) return Promise.resolve();

    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-vh-src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.vhSrc = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadPdfLibraries() {
    return loadExternalScript(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      function () { return !!window.html2canvas; }
    ).then(function () {
      return loadExternalScript(
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        function () { return !!(window.jspdf && window.jspdf.jsPDF); }
      );
    });
  }

  function downloadOfferPdf() {
    if (!isOfferReady()) {
      touchRequiredFields();
      setActionStatus(getOfferMissingText(), 'error');
      updateFieldStates();
      return;
    }

    setActionStatus('Загружаю PDF-модуль...');

    loadPdfLibraries().then(function () {
      var page = renderOfferTemplate();
      setActionStatus('Готовлю PDF...');
      return window.html2canvas(page, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#fbf7f1',
      logging: false,
      width: 794,
      height: 1123
      });
    }).then(function (canvas) {
      var imgData = canvas.toDataURL('image/jpeg', 0.96);
      var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save('vystuplenie-muzykanta-vladislav-hekolov.pdf');

      setActionStatus('PDF скачивается.');
    }).catch(function () {
      setActionStatus('Не получилось создать PDF. Попробуйте ещё раз.', 'error');
    });
  }

  function updateRangeFill() {
    if (!durationInput || !durationText) return;

    var min = Number(durationInput.min);
    var max = Number(durationInput.max);
    var value = normalizeDurationValue(durationInput.value);

    durationInput.value = value;

    var percent = ((value - min) / (max - min)) * 100;

    durationInput.style.setProperty('--vh-range-progress', percent + '%');

    if (!durationText.querySelector('input')) {
      durationText.textContent = getDurationLabel();
    }
  }

  function setStatus(text, type) {
    addressStatus.textContent = text;
    addressStatus.classList.remove('is-good', 'is-error');
    if (type) addressStatus.classList.add(type);
  }

  function clearSuggestions() {
    if (!suggestionsBox) return;
    suggestionsBox.innerHTML = '';
    suggestionsBox.classList.remove('is-visible');
  }

  function requestDadata(query, count) {
    return fetch(DADATA_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Token ' + DADATA_TOKEN
      },
      body: JSON.stringify({
        query: query,
        count: count || 6,
        locations_boost: [
          { kladr_id: '77' },
          { kladr_id: '50' }
        ]
      })
    }).then(function (response) {
      if (!response.ok) throw new Error('dadata_error');
      return response.json();
    });
  }

  function showSuggestions(items) {
    if (!suggestionsBox) return;

    if (!items || !items.length) {
      clearSuggestions();
      return;
    }

    suggestionsBox.innerHTML = items.map(function (item, index) {
      var value = item.value || '';
      var unrestricted = item.unrestricted_value || value;

      return (
        '<button type="button" class="vh-price-calc__suggestion" data-index="' + index + '">' +
        escapeHtml(value) +
        '<small>' + escapeHtml(unrestricted) + '</small>' +
        '</button>'
      );
    }).join('');

    suggestionsBox.classList.add('is-visible');

    var buttons = suggestionsBox.querySelectorAll('.vh-price-calc__suggestion');

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var index = Number(button.getAttribute('data-index'));
        var selected = items[index];

        if (!selected) return;

        selectedSuggestion = selected;
        addressInput.value = selected.value || '';

        clearSuggestions();
        applySuggestionRoad(selected);
        calculate();
      });
    });
  }

  function requestAddressSuggestions() {
    var query = addressInput.value.trim();

    if (query.length < 3) {
      clearSuggestions();
      setStatus('Введите минимум 3 символа — появятся подсказки.', '');
      calculate();
      return;
    }

    var requestId = ++activeSuggestRequest;

    requestDadata(query, 6)
      .then(function (data) {
        if (requestId !== activeSuggestRequest) return;

        var suggestions = data && data.suggestions ? data.suggestions : [];

        if (!suggestions.length) {
          clearSuggestions();
          setStatus('Адрес не найден. Попробуйте написать подробнее.', 'is-error');
          calculate();
          return;
        }

        showSuggestions(suggestions);
        setStatus('Выберите подходящий адрес из подсказок.', '');
        calculate();
      })
      .catch(function () {
        clearSuggestions();
        setStatus('Не удалось загрузить подсказки DaData. Проверьте API-ключ.', 'is-error');
        calculate();
      });
  }

  function debounceAddressSuggestions() {
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(requestAddressSuggestions, 350);
  }

  function toRad(value) {
    return value * Math.PI / 180;
  }

  function haversineKm(pointA, pointB) {
    var earthRadiusKm = 6371;

    var lat1 = pointA[0];
    var lon1 = pointA[1];
    var lat2 = pointB[0];
    var lon2 = pointB[1];

    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);

    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  function getRoadCategoryByKm(kmFromMkad) {
    if (kmFromMkad <= 0.7) return 'inside';
    if (kmFromMkad <= 20) return 'to20';
    if (kmFromMkad <= 35) return 'to35';
    if (kmFromMkad <= 50) return 'to50';
    if (kmFromMkad <= 75) return 'to75';
    if (kmFromMkad <= 100) return 'to100';
    if (kmFromMkad <= 130) return 'to130';
    return 'far';
  }

  function getCajonRoadPriceByCategory(category) {
    return CAJON_ROAD_RULES[category] || 0;
  }

  function applySuggestionRoad(suggestion) {
    var data = suggestion && suggestion.data ? suggestion.data : {};
    var lat = parseFloat(data.geo_lat);
    var lon = parseFloat(data.geo_lon);

    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      roadInfo = {
        category: 'unknown',
        label: LABELS.road.unknown,
        price: 0,
        kmFromMkad: null
      };

      setStatus('Адрес выбран, но координаты не найдены. Дорогу уточню вручную.', 'is-error');
      return;
    }

    var beltwayHit = String(data.beltway_hit || '').toUpperCase();
    var beltwayDistance = Number(data.beltway_distance);
    var kmFromMkad;

    if (beltwayHit === 'IN_MKAD') {
      kmFromMkad = 0;
    } else if (beltwayHit === 'OUT_MKAD' && isFinite(beltwayDistance)) {
      kmFromMkad = Math.max(0, beltwayDistance);
    } else {
      var distanceFromCenter = haversineKm([lat, lon], MOSCOW_CENTER);
      kmFromMkad = distanceFromCenter - MKAD_APPROX_RADIUS_KM;
    }

    var category = getRoadCategoryByKm(kmFromMkad);
    var price = ROAD_RULES[category] || 0;

    roadInfo = {
      category: category,
      label: LABELS.road[category],
      price: price,
      kmFromMkad: Math.max(0, kmFromMkad)
    };

    if (category === 'inside') {
      setStatus('Адрес определён: внутри МКАД — дорожной доплаты нет.', 'is-good');
      return;
    }

    if (category === 'far') {
      setStatus(
        'Адрес определён: примерно ' +
        Math.round(Math.max(0, kmFromMkad)) +
        ' км от МКАД. Дорожная доплата: от +' +
        formatMoney(price) +
        '.',
        'is-good'
      );
      return;
    }

    setStatus(
      'Адрес определён: примерно ' +
      Math.round(Math.max(0, kmFromMkad)) +
      ' км от МКАД. Дорожная доплата: +' +
      formatMoney(price) +
      '.',
      'is-good'
    );
  }

  function detectAddressByText() {
    var query = addressInput.value.trim();

    if (!query) {
      setStatus('Введите адрес мероприятия.', 'is-error');
      calculate();
      return;
    }

    if (selectedSuggestion && selectedSuggestion.value === query) {
      applySuggestionRoad(selectedSuggestion);
      calculate();
      return;
    }

    setStatus('Определяю адрес через DaData...', '');

    requestDadata(query, 1)
      .then(function (data) {
        var suggestions = data && data.suggestions ? data.suggestions : [];

        if (!suggestions.length) throw new Error('not_found');

        selectedSuggestion = suggestions[0];
        addressInput.value = selectedSuggestion.value || query;

        applySuggestionRoad(selectedSuggestion);
        calculate();
      })
      .catch(function () {
        roadInfo = {
          category: 'unknown',
          label: LABELS.road.unknown,
          price: 0,
          kmFromMkad: null
        };

        setStatus('Не удалось определить адрес. Выберите адрес из подсказок.', 'is-error');
        calculate();
      });
  }

  formatCards.forEach(function (card) {
    card.addEventListener('click', function () {
      var input = card.querySelector('input');
      if (!input) return;

      syncFormat(input.value);
      calculate();
    });
  });

  if (formatSelectMobile) {
    formatSelectMobile.addEventListener('change', function () {
      syncFormat(formatSelectMobile.value);
      calculate();
    });
  }

  formatInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      syncFormat(input.value);
      calculate();
    });
  });

  if (formatInfoToggle && formatInfo) {
    formatInfoToggle.addEventListener('click', function () {
      var isOpen = formatInfo.classList.toggle('is-open');
      formatInfoToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  if (dateOpen) {
    dateOpen.addEventListener('click', openDatePicker);
  }

  if (dateInput) {
    dateInput.min = new Date().toISOString().slice(0, 10);
    dateInput.addEventListener('input', function () { if (dateField) dateField.classList.add('is-touched'); });
    dateInput.addEventListener('change', function () { if (dateField) dateField.classList.add('is-touched'); });
    dateInput.addEventListener('click', function (event) {
      var rect = dateInput.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var manualInputZone = Math.min(170, rect.width * 0.58);

      if (x > manualInputZone) openDatePicker();
    });
  }


  if (durationInput) {
    durationInput.addEventListener('input', function () {
      durationInput.value = normalizeDurationValue(durationInput.value);
      calculate();
    });

    durationInput.addEventListener('change', function () {
      durationInput.value = normalizeDurationValue(durationInput.value);
      calculate();
    });
  }

  [
    eventSelect,
    dateInput,
    videoReviewInput,
    photoReviewInput
  ].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });

  if (discountToggle) {
    discountToggle.addEventListener('click', function () {
      if (!discountBlock) return;
      discountBlock.classList.toggle('is-open');
    });
  }

  function openOfferChat(event, url) {
    event.preventDefault();

    if (!isOfferReady()) {
      touchRequiredFields();
      setActionStatus(getOfferMissingText(), 'error');
      updateFieldStates();
      return;
    }

    copyTextToClipboard(buildOfferText()).then(function () {
      setActionStatus('Расчёт скопирован. Вставьте его в открывшийся чат.');
      window.open(url, '_blank', 'noopener');
    }).catch(function () {
      window.open(url, '_blank', 'noopener');
      setActionStatus('Чат открыт, но текст не удалось скопировать.', 'error');
    });
  }

  if (tgLink) {
    tgLink.addEventListener('click', function (event) {
      openOfferChat(event, 'https://t.me/vladislove_xv');
    });
  }

  if (maxLink) {
    maxLink.addEventListener('click', function (event) {
      openOfferChat(event, MAX_URL);
    });
  }

  if (pdfButton) {
    pdfButton.addEventListener('click', downloadOfferPdf);
  }

  if (copyButton) {
    copyButton.addEventListener('click', copyOffer);
  }

  if (addressInput) {
    addressInput.addEventListener('input', function () { if (addressField) addressField.classList.add('is-touched'); });
    addressInput.addEventListener('input', function () {
      selectedSuggestion = null;

      roadInfo = {
        category: 'unknown',
        label: LABELS.road.unknown,
        price: 0,
        kmFromMkad: null
      };

      debounceAddressSuggestions();
      calculate();
    });

    addressInput.addEventListener('focus', debounceAddressSuggestions);

    addressInput.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        clearSuggestions();
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        clearSuggestions();
        detectAddressByText();
      }
    });

    addressInput.addEventListener('blur', function () {
      setTimeout(function () {
        var query = addressInput.value.trim();

        if (query && roadInfo.category === 'unknown') {
          detectAddressByText();
        }
      }, 220);
    });
  }

  document.addEventListener('click', function (event) {
    if (!root.contains(event.target)) {
      clearSuggestions();
      return;
    }

    if (
      suggestionsBox &&
      !suggestionsBox.contains(event.target) &&
      event.target !== addressInput
    ) {
      clearSuggestions();
    }
  });

  syncFormat('acoustic');
  updateRangeFill();
  calculate();
})();

;

(function () {
  'use strict';

  var wrap = document.getElementById('vh-reviews-wrap');
  var scene = document.getElementById('vh-reviews-carousel');

  if (!wrap || !scene) return;

  var items = Array.from(scene.querySelectorAll('.vh-reviews-3d__item'));
  var N = items.length;

  if (!N) return;

  var lightbox = document.getElementById('vh-reviews-lightbox');
  var lbImg = document.getElementById('vh-reviews-lb-img');
  var lbBg = document.getElementById('vh-reviews-lb-bg');
  var lbClose = document.getElementById('vh-reviews-lb-close');

  var AUTO_SPEED = 0.035;
  var DRAG_FACTOR = 0.32;
  var INERTIA_DECAY = 0.935;
  var INERTIA_STOP = 0.008;

  var RADIUS_LG = 640;
  var RADIUS_MD = 470;
  var RADIUS_SM = 330;
  var RADIUS_XS = 270;

  var angle = 0;
  var reviewFrame = null;
  var isCarouselVisible = true;
  var reduceMotion = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || window.innerWidth <= 860;
  var velocity = 0;
  var isDragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var dragAngle = 0;
  var prevAngle = 0;
  var dragMoved = false;

  var touchStartTarget = null;
  var touchStartX = 0;
  var touchStartY = 0;
  var touchDirection = null;

  function isMobileWidth() {
    return window.innerWidth <= 860;
  }

  function getRadius() {
    var w = window.innerWidth;

    if (w > 1180) return RADIUS_LG;
    if (w > 860) return RADIUS_MD;
    if (w > 480) return RADIUS_SM;

    return RADIUS_XS;
  }

  function getClientX(e) {
    if (e.touches && e.touches.length) {
      return e.touches[0].clientX;
    }

    if (e.changedTouches && e.changedTouches.length) {
      return e.changedTouches[0].clientX;
    }

    return e.clientX;
  }

  function getClientY(e) {
    if (e.touches && e.touches.length) {
      return e.touches[0].clientY;
    }

    if (e.changedTouches && e.changedTouches.length) {
      return e.changedTouches[0].clientY;
    }

    return e.clientY;
  }

  function render() {
    var radius = getRadius();
    var step = 360 / N;

    for (var i = 0; i < N; i++) {
      var cardAngle = step * i + angle;
      var rad = cardAngle * Math.PI / 180;
      var cosVal = Math.cos(rad);

      var x = Math.sin(rad) * radius;
      var z = cosVal * radius;
      var ry = -cardAngle;

      var sc = 0.38 + 0.62 * ((cosVal + 1) / 2);

      items[i].style.transform =
        'translateX(' + x.toFixed(2) + 'px) ' +
        'translateZ(' + z.toFixed(2) + 'px) ' +
        'rotateY(' + ry.toFixed(2) + 'deg) ' +
        'scale(' + sc.toFixed(4) + ')';

      items[i].style.opacity = cosVal < -0.2 ? 0 : 1;
      items[i].style.zIndex = Math.round((cosVal + 1) * 50);
    }
  }

  function loop() {
    if (document.hidden || !isCarouselVisible || reduceMotion) {
      reviewFrame = null;
      return;
    }

    if (!isDragging) {
      if (Math.abs(velocity) > INERTIA_STOP) {
        angle += velocity;
        velocity *= INERTIA_DECAY;
      } else {
        velocity = 0;
        angle += AUTO_SPEED;
      }
    }

    angle = ((angle % 360) + 360) % 360;
    render();
    reviewFrame = requestAnimationFrame(loop);
  }

  function startReviewLoop() {
    if (reviewFrame || document.hidden || !isCarouselVisible || reduceMotion) return;
    reviewFrame = requestAnimationFrame(loop);
  }

  function onPointerDown(e) {
    isDragging = true;
    dragMoved = false;
    touchDirection = null;

    dragStartX = getClientX(e);
    dragStartY = getClientY(e);

    touchStartX = dragStartX;
    touchStartY = dragStartY;
    touchStartTarget = e.target.closest('.vh-reviews-3d__item');

    dragAngle = angle;
    prevAngle = angle;
    velocity = 0;

    wrap.classList.add('vh-reviews-3d--dragging');
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    var cx = getClientX(e);
    var cy = getClientY(e);

    var deltaX = cx - dragStartX;
    var deltaY = cy - dragStartY;

    var absX = Math.abs(deltaX);
    var absY = Math.abs(deltaY);

    if (e.type === 'touchmove' && isMobileWidth()) {
      if (!touchDirection && (absX > 8 || absY > 8)) {
        touchDirection = absY > absX * 1.15 ? 'vertical' : 'horizontal';
      }

      if (touchDirection === 'vertical') {
        isDragging = false;
        dragMoved = false;
        touchStartTarget = null;
        wrap.classList.remove('vh-reviews-3d--dragging');
        return;
      }

      if (touchDirection === 'horizontal' && e.cancelable) {
        e.preventDefault();
      }
    }

    if (absX > 6 || absY > 6) {
      dragMoved = true;
    }

    angle = dragAngle + deltaX * DRAG_FACTOR;
    velocity = angle - prevAngle;
    prevAngle = angle;
    if (reduceMotion || isMobileWidth()) render();
  }

  function onPointerUp() {
    if (!isDragging) return;

    isDragging = false;
    touchDirection = null;
    wrap.classList.remove('vh-reviews-3d--dragging');
  }

  var lbCloseTimer = null;

  function openLightbox(src) {
    if (!lightbox || !lbImg) return;

    clearTimeout(lbCloseTimer);

    lbImg.src = src;
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('vh-reviews-lightbox--open');

    if (window.VHUI) window.VHUI.lock(lightbox);
  }

  function closeLightbox() {
    if (!lightbox || !lbImg) return;

    lightbox.classList.remove('vh-reviews-lightbox--open');
    lightbox.setAttribute('aria-hidden', 'true');

    if (window.VHUI) window.VHUI.unlock(lightbox);

    lbCloseTimer = setTimeout(function () {
      lbImg.src = '';
    }, 380);
  }

  function openItemImage(item) {
    if (!item) return;

    var img = item.querySelector('img');

    if (img && img.getAttribute('src')) {
      openLightbox(img.getAttribute('src'));
    }
  }

  var imgs = scene.querySelectorAll('img');

  imgs.forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.dataset.triedFallback === 'true') return;

      img.dataset.triedFallback = 'true';

      if (img.src.indexOf('.jpg') !== -1) {
        img.src = img.src.replace('.jpg', '.png');
      } else if (img.src.indexOf('.png') !== -1) {
        img.src = img.src.replace('.png', '.jpg');
      }
    });
  });

  scene.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var item = e.target.closest('.vh-reviews-3d__item');
    if (!item) return;
    e.preventDefault();
    openItemImage(item);
  });

  scene.addEventListener('click', function (e) {
    if (dragMoved) {
      dragMoved = false;
      return;
    }

    var item = e.target.closest('.vh-reviews-3d__item');
    openItemImage(item);
  });

  scene.addEventListener('touchend', function (e) {
    var endX = getClientX(e);
    var endY = getClientY(e);

    var movedX = Math.abs(endX - touchStartX);
    var movedY = Math.abs(endY - touchStartY);

    if (movedX < 8 && movedY < 8 && touchStartTarget) {
      e.preventDefault();
      openItemImage(touchStartTarget);
    }

    touchStartTarget = null;
  }, { passive: false });

  if (lbBg) {
    lbBg.addEventListener('click', closeLightbox);

    lbBg.addEventListener('touchend', function (e) {
      e.preventDefault();
      closeLightbox();
    }, { passive: false });
  }

  if (lbClose) {
    lbClose.addEventListener('click', closeLightbox);

    lbClose.addEventListener('touchend', function (e) {
      e.preventDefault();
      closeLightbox();
    }, { passive: false });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });

  wrap.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  wrap.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp, { passive: true });
  window.addEventListener('touchcancel', onPointerUp, { passive: true });

  scene.addEventListener('dragstart', function (e) {
    e.preventDefault();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      isCarouselVisible = !!(entries[0] && entries[0].isIntersecting);
      if (isCarouselVisible) startReviewLoop();
    }, { rootMargin: '180px 0px' }).observe(wrap);
  }

  document.addEventListener('visibilitychange', startReviewLoop);
  render();
  startReviewLoop();
})();

;

(function () {
  var faq = document.getElementById('faq');
  if (!faq) return;

  var items = Array.from(faq.querySelectorAll('.vh-faq__item'));

  function setOpen(item, open) {
    var button = item.querySelector('.vh-faq__question');
    var answer = item.querySelector('.vh-faq__answer');
    if (!button || !answer) return;

    item.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    answer.style.maxHeight = open ? answer.scrollHeight + 'px' : '0px';
  }

  items.forEach(function (item, index) {
    var button = item.querySelector('.vh-faq__question');
    var answer = item.querySelector('.vh-faq__answer');
    if (!button || !answer) return;

    var answerId = 'vhFaqAnswer' + (index + 1);
    answer.id = answerId;
    button.setAttribute('aria-controls', answerId);
    setOpen(item, item.classList.contains('is-open'));

    button.addEventListener('click', function () {
      var shouldOpen = !item.classList.contains('is-open');
      items.forEach(function (other) { setOpen(other, false); });
      if (shouldOpen) setOpen(item, true);
    });
  });

  window.addEventListener('resize', function () {
    items.forEach(function (item) {
      if (item.classList.contains('is-open')) setOpen(item, true);
    });
  });
})();

;

(function () {
  var modal = document.getElementById('vhContactModal');
  var form = document.getElementById('vhContactForm');
  var status = document.getElementById('vhContactStatus');
  var submit = document.getElementById('vhContactSubmit');

  if (!modal || !form || !status || !submit) return;

  var ENDPOINT = 'https://formsubmit.co/ajax/hekoloff@yandex.ru';
  var SITE_CONFIG = window.VLADISLOVEX_CONFIG || {};

  var DADATA_TOKEN = 'a892cfca8da7cbe521efabaf6a6d511c4a2bc084';
  var DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';

  var phoneInput = form.querySelector('input[name="phone"]');
  var dateInput = document.getElementById('vhContactDate');
  var dateWrap = document.getElementById('vhContactDateWrap');

  var addressInput = document.getElementById('vhContactAddress');
  var suggestionsBox = document.getElementById('vhContactSuggestions');

  var suggestTimer = null;
  var activeSuggestRequest = 0;
  var selectedSuggestion = null;
  var suppressSuggestionsUntil = 0;

  function openModal(event) {
    if (event) {
      event.preventDefault();
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (window.VHUI) window.VHUI.lock(modal);

    setTimeout(function () {
      var firstInput = form.querySelector('input[name="name"]');

      if (firstInput && window.innerWidth > 640) {
        firstInput.focus();
      }
    }, 250);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (window.VHUI) window.VHUI.unlock(modal);
    clearSuggestions();
  }

  function setStatus(text, type) {
    status.textContent = text || '';
    status.classList.remove('is-success', 'is-error');

    if (type) {
      status.classList.add(type);
    }
  }

  function onlyDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatPhone(value) {
    var digits = onlyDigits(value);

    if (digits[0] === '8') {
      digits = '7' + digits.slice(1);
    }

    if (digits[0] !== '7') {
      digits = '7' + digits;
    }

    digits = digits.slice(0, 11);

    var result = '+7';

    if (digits.length > 1) {
      result += ' ' + digits.slice(1, 4);
    }

    if (digits.length >= 5) {
      result += ' ' + digits.slice(4, 7);
    }

    if (digits.length >= 8) {
      result += '-' + digits.slice(7, 9);
    }

    if (digits.length >= 10) {
      result += '-' + digits.slice(9, 11);
    }

    return result;
  }

  function openDatePicker() {
    if (!dateInput) return;

    dateInput.focus();

    if (typeof dateInput.showPicker === 'function') {
      try {
        dateInput.showPicker();
      } catch (error) {}
    }
  }

  function updateDateVisual() {
    if (!dateInput || !dateWrap) return;

    var isFilled = !!dateInput.value;

    dateInput.classList.toggle('is-filled', isFilled);
    dateWrap.classList.toggle('is-filled', isFilled);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function clearSuggestions() {
    if (!suggestionsBox) return;

    suggestionsBox.innerHTML = '';
    suggestionsBox.classList.remove('is-visible');
  }

  function requestDadata(query, count) {
    return fetch(DADATA_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Token ' + DADATA_TOKEN
      },
      body: JSON.stringify({
        query: query,
        count: count || 6,
        locations_boost: [
          { kladr_id: '77' },
          { kladr_id: '50' }
        ]
      })
    }).then(function (response) {
      if (!response.ok) throw new Error('dadata_error');
      return response.json();
    });
  }

  function selectAddress(item) {
    if (!item || !addressInput) return;

    selectedSuggestion = item;
    addressInput.value = item.value || '';

    suppressSuggestionsUntil = Date.now() + 900;
    activeSuggestRequest++;

    clearTimeout(suggestTimer);
    clearSuggestions();

    if (document.activeElement === addressInput) {
      addressInput.blur();
    }
  }

  function showSuggestions(items) {
    if (!suggestionsBox) return;

    if (!items || !items.length) {
      clearSuggestions();
      return;
    }

    suggestionsBox.innerHTML = items.map(function (item, index) {
      var value = item.value || '';
      var unrestricted = item.unrestricted_value || value;

      return (
        '<button type="button" class="vh-contact-suggestion" data-index="' + index + '">' +
          escapeHtml(value) +
          '<small>' + escapeHtml(unrestricted) + '</small>' +
        '</button>'
      );
    }).join('');

    suggestionsBox.classList.add('is-visible');

    var buttons = suggestionsBox.querySelectorAll('.vh-contact-suggestion');

    buttons.forEach(function (button) {
      var handler = function (event) {
        event.preventDefault();
        event.stopPropagation();

        var index = Number(button.getAttribute('data-index'));
        var selected = items[index];

        selectAddress(selected);
      };

      button.addEventListener('click', handler);
    });
  }

  function searchAddress() {
    if (!addressInput) return;

    if (Date.now() < suppressSuggestionsUntil) {
      clearSuggestions();
      return;
    }

    var query = addressInput.value.trim();

    if (query.length < 3) {
      clearSuggestions();
      return;
    }

    var requestId = ++activeSuggestRequest;

    requestDadata(query, 6)
      .then(function (data) {
        if (requestId !== activeSuggestRequest) return;

        var suggestions = data && data.suggestions ? data.suggestions : [];

        showSuggestions(suggestions);
      })
      .catch(function () {
        clearSuggestions();
      });
  }

  function debounceAddressSearch() {
    if (Date.now() < suppressSuggestionsUntil) {
      clearSuggestions();
      return;
    }

    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(searchAddress, 350);
  }

  function getFormValue(selector) {
    var field = form.querySelector(selector);
    return field ? String(field.value || '').trim() : '';
  }

  function formatDateForChat(value) {
    if (!value) return '';

    var parts = value.split('-');

    if (parts.length !== 3) return value;

    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function getChatMessage() {
    var name = getFormValue('input[name="name"]');
    var eventDate = formatDateForChat(getFormValue('input[name="event_date"]'));
    var eventType = getFormValue('select[name="event_type"]') || 'День рождения';
    var performanceFormat = getFormValue('select[name="performance_format"]');
    var address = getFormValue('input[name="address"]');
    var comment = getFormValue('textarea[name="comment"]');

    var lines = [];

    if (name) {
      lines.push('Добрый день! Меня зовут ' + name + '.');
    } else {
      lines.push('Добрый день!');
    }

    lines.push('Хочу заказать гитариста на ' + eventType + '.');

    if (eventDate) {
      lines.push('Дата: ' + eventDate + '.');
    }

    if (performanceFormat) {
      lines.push('Формат: ' + performanceFormat + '.');
    }

    if (address) {
      lines.push('Адрес: ' + address + '.');
    }

    if (comment) {
      lines.push('Комментарий: ' + comment);
    }

    return lines.join('\n');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement('textarea');

        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';

        document.body.appendChild(textarea);
        textarea.select();

        var ok = document.execCommand('copy');

        document.body.removeChild(textarea);

        if (ok) resolve();
        else reject(new Error('copy_failed'));
      } catch (error) {
        reject(error);
      }
    });
  }

  function buildPayload() {
    var formData = new FormData(form);

    var name = String(formData.get('name') || '').trim();
    var phone = String(formData.get('phone') || '').trim();
    var eventDate = String(formData.get('event_date') || '').trim();
    var performanceFormat = String(formData.get('performance_format') || '').trim();
    var eventType = String(formData.get('event_type') || '').trim();
    var address = String(formData.get('address') || '').trim();
    var comment = String(formData.get('comment') || '').trim();

    return {
      _subject: 'Новая заявка с сайта: нужно позвонить клиенту',
      _template: 'table',
      _captcha: 'false',
      'Имя': name,
      'Телефон': phone,
      'Дата события': eventDate || 'Не указана',
      'Формат выступления': performanceFormat || 'Не указан',
      'Тип мероприятия': eventType || 'Не указан',
      'Адрес': address || 'Не указан',
      'Комментарий': comment || 'Без комментария',
      'Страница': window.location.href,
      'Время заявки': new Date().toLocaleString('ru-RU')
    };
  }

  function payloadToFormData(payload) {
    var data = new FormData();

    Object.keys(payload).forEach(function (key) {
      data.append(key, payload[key]);
    });

    return data;
  }

  function submitByAjax(payload) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: payloadToFormData(payload)
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('ajax_failed');
      }

      return response.json();
    });
  }

  function buildVocavaLead(payload) {
    var params = new URLSearchParams(window.location.search);
    return {
      source: 'personal_site',
      artistSlug: SITE_CONFIG.artistSlug || 'vladislav-hekolov',
      acceptPersonalData: true,
      website: '',
      contact: {
        name: payload['Имя'],
        phone: payload['Телефон']
      },
      event: {
        date: payload['Дата события'] === 'Не указана' ? null : payload['Дата события'],
        type: payload['Тип мероприятия'] === 'Не указан' ? null : payload['Тип мероприятия'],
        performanceFormat: payload['Формат выступления'] === 'Не указан' ? null : payload['Формат выступления'],
        address: payload['Адрес'] === 'Не указан' ? null : payload['Адрес'],
        comment: payload['Комментарий'] === 'Без комментария' ? null : payload['Комментарий']
      },
      attribution: {
        pageUrl: window.location.href,
        referrer: document.referrer || null,
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign'),
        utmContent: params.get('utm_content'),
        utmTerm: params.get('utm_term'),
        yclid: params.get('yclid')
      }
    };
  }

  function submitToVocava(payload) {
    var base = String(SITE_CONFIG.apiBaseUrl || '').replace(/\/$/, '');
    var path = SITE_CONFIG.leadEndpoint || '/api/public/leads';
    if (!base) return Promise.reject(new Error('vocava_api_not_configured'));

    return fetch(base + path, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildVocavaLead(payload))
    }).then(function (response) {
      if (!response.ok) throw new Error('vocava_api_failed');
      return response.json();
    });
  }

  function sendLead(payload) {
    if (SITE_CONFIG.useVocavaApi) {
      return submitToVocava(payload).catch(function (error) {
        if (SITE_CONFIG.formSubmitFallbackEnabled) return submitByAjax(payload);
        throw error;
      });
    }
    return submitByAjax(payload);
  }

  document.addEventListener('click', function (event) {
    var openButton = event.target.closest('[data-vh-open-contact]');
    var closeButton = event.target.closest('[data-vh-close-contact]');
    var chatLink = event.target.closest('.vh-contact-chat-link');

    if (chatLink) {
      event.preventDefault();

      var chatUrl = chatLink.getAttribute('href');
      var message = getChatMessage();

      copyText(message)
        .then(function () {
          setStatus('Текст сообщения скопирован. Вставьте его в чат и отправьте.', 'is-success');
        })
        .catch(function () {
          setStatus('Чат открылся. Сообщение можно скопировать из формы вручную.', 'is-error');
        });

      window.open(chatUrl, '_blank', 'noopener');
      return;
    }

    if (openButton) {
      openModal(event);
      return;
    }

    if (closeButton) {
      event.preventDefault();
      closeModal();
      return;
    }

    if (
      suggestionsBox &&
      addressInput &&
      !suggestionsBox.contains(event.target) &&
      event.target !== addressInput
    ) {
      clearSuggestions();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      phoneInput.value = formatPhone(phoneInput.value);
    });

    phoneInput.addEventListener('focus', function () {
      if (!phoneInput.value.trim()) {
        phoneInput.value = '+7 ';
      }
    });
  }

  if (dateWrap && dateInput) {
    dateInput.min = new Date().toISOString().slice(0, 10);
    dateWrap.addEventListener('click', function () {
      openDatePicker();
    });

    dateInput.addEventListener('click', function () {
      openDatePicker();
    });

    dateInput.addEventListener('input', updateDateVisual);
    dateInput.addEventListener('change', updateDateVisual);

    updateDateVisual();
  }

  if (addressInput) {
    addressInput.addEventListener('input', function () {
      selectedSuggestion = null;
      debounceAddressSearch();
    });

    addressInput.addEventListener('focus', function () {
      if (selectedSuggestion && addressInput.value === selectedSuggestion.value) {
        return;
      }

      debounceAddressSearch();
    });

    addressInput.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        clearSuggestions();
      }

      if (event.key === 'Enter' && suggestionsBox && suggestionsBox.classList.contains('is-visible')) {
        event.preventDefault();

        var first = suggestionsBox.querySelector('.vh-contact-suggestion');
        if (first) first.click();
      }
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var formData = new FormData(form);

    var name = String(formData.get('name') || '').trim();
    var phone = String(formData.get('phone') || '').trim();
    var consent = formData.get('consent');

    if (!name) {
      setStatus('Напишите, пожалуйста, ваше имя.', 'is-error');
      return;
    }

    if (onlyDigits(phone).length < 11) {
      setStatus('Проверьте номер телефона — не хватает цифр.', 'is-error');
      return;
    }

    if (!consent) {
      setStatus('Нужно согласие на обработку данных, чтобы я мог связаться с вами.', 'is-error');
      return;
    }

    submit.disabled = true;
    setStatus('Отправляю заявку...', '');

    var payload = buildPayload();

    sendLead(payload)
      .then(function () {
        form.reset();
        updateDateVisual();
        clearSuggestions();

        setStatus('Готово! Заявка отправлена. Я скоро свяжусь с вами.', 'is-success');

        setTimeout(function () {
          closeModal();
          setStatus('', '');
        }, 2200);
      })
      .catch(function () {
        setStatus('Не получилось отправить заявку. Попробуйте написать в Telegram или позвонить по номеру выше.', 'is-error');
      })
      .finally(function () {
        submit.disabled = false;
      });
  });
})();

;

(function () {
  var widget = document.getElementById('vhMiniVideo');
  var button = document.getElementById('vhMiniVideoButton');
  var video = document.getElementById('vhMiniVideoMedia');
  var sideSubtitle = document.getElementById('vhMiniVideoSideSubtitle');

  if (!widget || !button || !video || !sideSubtitle) return;

  var isOpen = false;
  var subtitlesDisabled = false;
  var currentSubtitleText = '';
  var subtitleSwitchTimer = null;
  var previewStarted = false;

  function ensureVideoSource() {
    if (video.getAttribute('src')) return;
    var source = video.getAttribute('data-src');
    if (!source) return;
    video.setAttribute('src', source);
    video.load();
  }

 var subtitles = [
  {
    from: 0.0,
    to: 2.15,
    text: 'Привет. Меня зовут Влад Хеколов.'
  },
  {
    from: 2.3,
    to: 3.4,
    text: 'Я гитарист-вокалист.'
  },
  {
    from: 3.6,
    to: 7.7,
    text: 'Выступаю на мероприятиях, праздниках, днях рождения, корпоративах, свадьбах.'
  },
  {
    from: 8.5,
    to: 10.0,
    text: 'Да где я только не выступаю.'
  },
  {
    from: 10.1,
    to: 12.35,
    text: 'Я готов поддержать абсолютно любую вашу идею,'
  },
  {
    from: 12.35,
    to: 14.0,
    text: 'потому что вы даже не представляете,'
  },
  {
    from: 14.0,
    to: 16.35,
    text: 'сколько во мне энтузиазма заложено на это дело.'
  },
  {
    from: 16.9,
    to: 18.85,
    text: 'В моём репертуаре более 300 песен.'
  },
  {
    from: 18.9,
    to: 22.85,
    text: 'У меня есть собственный сборник песен, с которым я приезжаю к вам на мероприятие,'
  },
  {
    from: 22.85,
    to: 25.05,
    text: 'в распечатанном виде, даю его гостям.'
  },
  {
    from: 25.1,
    to: 27.75,
    text: 'И мы плотно взаимодействуем с каждым гостем.'
  },
  {
    from: 27.75,
    to: 31.05,
    text: 'Потому что для меня важно не просто спеть на мероприятии песни,'
  },
  {
    from: 31.1,
    to: 33.25,
    text: 'для меня важно рассказать что-то,'
  },
  {
    from: 33.35,
    to: 35.35,
    text: 'что-то дать, какую-то эмоцию,'
  },
  {
    from: 35.35,
    to: 36.6,
    text: 'как-то объединить людей.'
  },
  {
    from: 36.85,
    to: 38.45,
    text: 'Вы платите не за красивый голос,'
  },
  {
    from: 38.65,
    to: 41.7,
    text: 'вы платите за красивый праздник и воспоминания.'
  },
  {
    from: 41.7,
    to: 43.9,
    text: 'И я это понимаю как никто другой.'
  },
  {
    from: 44.45,
    to: 45.9,
    text: 'У меня есть собственное оборудование,'
  },
  {
    from: 45.95,
    to: 47.95,
    text: 'я пунктуальный, ответственный человек.'
  },
  {
    from: 48.95,
    to: 51.65,
    text: 'Много плюсов, которые можно прочитать у меня на сайте.'
  },
  {
    from: 51.65,
    to: 52.75,
    text: 'Но самое главное:'
  },
  {
    from: 52.95,
    to: 55.1,
    text: 'позвоните, пообщайтесь со мной'
  },
  {
    from: 55.1,
    to: 57.1,
    text: 'и интуитивно поймите,'
  },
  {
    from: 57.3,
    to: 59.1,
    text: 'подхожу я вам или нет.'
  }
];

  try {
    video.pause();
    video.currentTime = 0;
    video.loop = true;
    video.muted = true;
  } catch (error) {}

  var revealTimerStarted = false;

function revealWidgetAfterDelay() {
  if (revealTimerStarted) return;

  revealTimerStarted = true;

  setTimeout(function () {
    widget.classList.add('is-visible');
    ensureVideoSource();
    startPreviewFromBeginning();
  }, 5000);
}

revealWidgetAfterDelay();

  function startPreviewFromBeginning() {
    if (previewStarted || subtitlesDisabled) return;
    ensureVideoSource();

    previewStarted = true;

    try {
      video.pause();
      video.currentTime = 0;
      video.loop = true;
      video.muted = true;

      var playPromise = video.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(function () {
            updateSideSubtitle();
          })
          .catch(function () {
            updateSideSubtitle();
          });
      } else {
        updateSideSubtitle();
      }
    } catch (error) {
      updateSideSubtitle();
    }
  }

  function getActiveSubtitle(currentTime) {
    for (var i = 0; i < subtitles.length; i++) {
      if (currentTime >= subtitles[i].from && currentTime < subtitles[i].to) {
        return subtitles[i];
      }
    }

    return null;
  }

  function hideSubtitleImmediately() {
    clearTimeout(subtitleSwitchTimer);
    sideSubtitle.classList.remove('is-visible', 'is-changing');
    sideSubtitle.textContent = '';
    currentSubtitleText = '';
  }

  function showSubtitleText(text) {
    if (subtitlesDisabled) return;

    if (!text) {
      hideSubtitleImmediately();
      return;
    }

    if (text === currentSubtitleText && sideSubtitle.classList.contains('is-visible')) {
      return;
    }

    clearTimeout(subtitleSwitchTimer);

    if (!currentSubtitleText) {
      sideSubtitle.textContent = text;
      currentSubtitleText = text;
      sideSubtitle.classList.remove('is-changing');
      sideSubtitle.classList.add('is-visible');
      return;
    }

    sideSubtitle.classList.remove('is-visible');
    sideSubtitle.classList.add('is-changing');

    subtitleSwitchTimer = setTimeout(function () {
      sideSubtitle.textContent = text;
      currentSubtitleText = text;
      sideSubtitle.classList.remove('is-changing');
      sideSubtitle.classList.add('is-visible');
    }, 170);
  }

  function updateSideSubtitle() {
    if (subtitlesDisabled) {
      hideSubtitleImmediately();
      return;
    }

    var currentTime = video.currentTime || 0;
    var activeSubtitle = getActiveSubtitle(currentTime);

    if (activeSubtitle) {
      showSubtitleText(activeSubtitle.text);
    } else {
      hideSubtitleImmediately();
    }
  }

  function openBubble() {
    ensureVideoSource();
    isOpen = true;
    widget.classList.add('is-open');

    try {
      video.loop = false;
      video.muted = false;
      video.controls = false;
      video.currentTime = 0;

      currentSubtitleText = '';

      var playPromise = video.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(function () {
          video.muted = true;
          video.play().catch(function () {});
        });
      }
    } catch (error) {}

    setTimeout(function () {
      updateSideSubtitle();
    }, 80);
  }

  function closeBubble() {
    isOpen = false;
    subtitlesDisabled = true;

    widget.classList.remove('is-open', 'is-visible');
    widget.classList.add('is-subtitles-disabled');
    hideSubtitleImmediately();

    try {
      video.pause();
      video.currentTime = 0;
      video.loop = false;
      video.muted = true;
    } catch (error) {}
  }

  button.addEventListener('click', function () {
    if (isOpen) {
      closeBubble();
    } else {
      openBubble();
    }
  });

  video.addEventListener('timeupdate', function () {
    updateSideSubtitle();
  });

  video.addEventListener('loadedmetadata', function () {
    if (!previewStarted) {
      try {
        video.currentTime = 0;
      } catch (error) {}
    }

    updateSideSubtitle();
  });

  video.addEventListener('play', function () {
    updateSideSubtitle();
  });

  video.addEventListener('seeked', function () {
    updateSideSubtitle();
  });

  video.addEventListener('ended', function () {
    setTimeout(function () {
      closeBubble();
    }, 300);
  });
})();

;

(function () {
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-vh-select-format]');
    if (!button) return;
    var value = button.getAttribute('data-vh-select-format');
    var select = document.getElementById('vhCalcFormatMobile');
    var radio = document.querySelector('input[name="vhCalcFormat"][value="' + value + '"]');
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles:true })); }
    if (select) { select.value = value; select.dispatchEvent(new Event('change', { bubbles:true })); }
    var calc = document.getElementById('vhPriceCalc');
    if (calc) calc.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' });
  });
})();


/* Original rotating hero offers: 17 messages, shuffled without immediate repeats. */
(function () {
  var offer = document.getElementById('vhHeroOffer');
  var line = document.getElementById('vhHeroOfferLine');
  var progress = document.getElementById('vhHeroOfferProgress');

  if (!offer || !line || !progress) return;

  var offers = [
    'Гитарист-вокалист на праздник в Москве и области',
    '300+ песен и меню песен на каждый праздник',
    'Не просто пою — объединяю гостей через песни, общение и эмоции',
    'Подберу формат с гарантией возврата, если не угадаю',
    'Прозрачная цена: стоимость можно посчитать здесь и сейчас',
    'Выступление можно продлить хоть до утра',
    'Быстро отвечаю и просто объясняю все детали',
    'Живые видео без обработки — атмосфера без фильтров',
    'Интерактивы, караоке и заявки — без неловких конкурсов',
    'Приезжаю заранее, не пью, работаю по таймингу',
    'Вовлекаю тех, кто хочет петь, и не трогаю тех, кто слушает',
    'Созвонюсь с ведущим и спокойно встроюсь в программу',
    'Мной не нужно управлять — вы отдыхаете, я веду музыку',
    'Живая музыка, которая не мешает празднику, а объединяет гостей',
    'От ужина до шумного финала — чувствую гостей. Я эмпат',
    'Москва и область: голос, гитара, 300+ песен и формат под площадку',
    'Срочный заказ сегодня: приеду за 2–3 часа или дам гитариста'
  ];

  var highlightWords = [
    'Гитарист-вокалист', 'Москве', 'области', '300+ песен', 'меню песен',
    'каждый праздник', 'Не просто пою', 'объединяю гостей', 'песни', 'общение',
    'эмоции', 'формат', 'гарантией возврата', 'Прозрачная цена', 'здесь и сейчас',
    'продлить хоть до утра', 'Быстро отвечаю', 'все детали',
    'Живые видео без обработки', 'без фильтров', 'Интерактивы', 'караоке',
    'заявки', 'без неловких конкурсов', 'Приезжаю заранее', 'не пью',
    'по таймингу', 'Вовлекаю тех, кто хочет петь', 'не трогаю тех, кто слушает',
    'Созвонюсь с ведущим', 'встроюсь в программу', 'Мной не нужно управлять',
    'вы отдыхаете', 'я веду музыку', 'Живая музыка', 'не мешает празднику',
    'объединяет гостей', 'чувствую гостей', 'Я эмпат', 'голос', 'гитара',
    'формат под площадку', 'Срочный заказ сегодня', '2–3 часа', 'дам гитариста'
  ];

  var queue = [];
  var index = 0;
  var lastOffer = '';
  var changeDelay = 4600;
  var outDelay = 420;
  var timer = null;
  var remainingTime = changeDelay;
  var timerStartedAt = 0;
  var isPaused = false;
  var isChanging = false;

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function shuffle(array) {
    var result = array.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function buildQueue() {
    queue = shuffle(offers);
    index = 0;
    if (queue.length > 1 && queue[0] === lastOffer) {
      var temp = queue[0];
      queue[0] = queue[1];
      queue[1] = temp;
    }
  }

  function renderOffer(text) {
    var safeText = escapeHtml(text);
    var sortedHighlights = highlightWords.slice().sort(function (a, b) { return b.length - a.length; });
    var pattern = new RegExp('(' + sortedHighlights.map(escapeRegExp).join('|') + ')', 'gi');
    line.innerHTML = safeText.replace(pattern, '<strong>$1</strong>');
    lastOffer = text;
  }

  function restartProgress() {
    var newProgress = progress.cloneNode(true);
    progress.parentNode.replaceChild(newProgress, progress);
    progress = newProgress;
  }

  function showFreshAnimation() {
    offer.classList.remove('is-fresh');
    void offer.offsetWidth;
    offer.classList.add('is-fresh');
    setTimeout(function () { offer.classList.remove('is-fresh'); }, 900);
  }

  function clearOfferTimer() {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  }

  function scheduleNextOffer(delay) {
    clearOfferTimer();
    remainingTime = typeof delay === 'number' ? delay : changeDelay;
    timerStartedAt = Date.now();
    timer = setTimeout(nextOffer, remainingTime);
  }

  function pauseOffer() {
    if (isPaused || isChanging) return;
    isPaused = true;
    offer.classList.add('is-paused');
    if (timer) {
      var elapsed = Date.now() - timerStartedAt;
      remainingTime = Math.max(700, remainingTime - elapsed);
      clearOfferTimer();
    }
  }

  function resumeOffer() {
    if (!isPaused) return;
    isPaused = false;
    offer.classList.remove('is-paused');
    scheduleNextOffer(remainingTime);
  }

  function nextOffer() {
    if (isPaused || isChanging) return;
    isChanging = true;
    if (!queue.length || index >= queue.length) buildQueue();
    var nextText = queue[index++];
    offer.classList.add('is-changing');

    setTimeout(function () {
      renderOffer(nextText);
      restartProgress();
      offer.classList.remove('is-changing');
      showFreshAnimation();
      isChanging = false;
      if (!isPaused) scheduleNextOffer(changeDelay);
    }, outDelay);
  }

  function start() {
    buildQueue();
    renderOffer(queue[index++]);
    restartProgress();
    showFreshAnimation();
    scheduleNextOffer(changeDelay);
  }

  offer.addEventListener('pointerenter', pauseOffer);
  offer.addEventListener('pointerleave', resumeOffer);
  offer.addEventListener('pointerdown', pauseOffer);
  window.addEventListener('pointerup', resumeOffer, { passive: true });
  window.addEventListener('pointercancel', resumeOffer, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseOffer();
    else resumeOffer();
  });

  start();
})();


/* Unified playful CTA interaction and precise anchor alignment. */
(function () {
  'use strict';

  function setButtonPoint(button, event) {
    var rect = button.getBoundingClientRect();
    var x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    var y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
    button.style.setProperty('--vh-btn-x', x.toFixed(2) + '%');
    button.style.setProperty('--vh-btn-y', y.toFixed(2) + '%');
  }

  document.addEventListener('pointermove', function (event) {
    var button = event.target.closest('.vh-action-button');
    if (!button) return;
    setButtonPoint(button, event);
  }, { passive: true });

  document.addEventListener('pointerdown', function (event) {
    var button = event.target.closest('.vh-action-button');
    if (!button) return;
    setButtonPoint(button, event);
    button.classList.add('is-vh-pressed');
  }, { passive: true });

  function clearPressed() {
    document.querySelectorAll('.vh-action-button.is-vh-pressed').forEach(function (button) {
      button.classList.remove('is-vh-pressed');
    });
  }

  window.addEventListener('pointerup', clearPressed, { passive: true });
  window.addEventListener('pointercancel', clearPressed, { passive: true });
  window.addEventListener('blur', clearPressed);

  var anchorSelectors = {
    video: '.vh-video-section__header',
    formats: '.vh-formats-header',
    booking: '.vh-booking__head',
    vhPriceCalc: '.vh-price-calc__head',
    reviews: '.vh-reviews-header',
    faq: '.vh-faq__head',
    contacts: '.vh-contacts-section__head',
    privacy: '.vh-site-footer__privacy'
  };

  function getFixedHeaderBottom() {
    var header = document.getElementById('vhPremiumHeader');
    if (!header) return 14;
    var rect = header.getBoundingClientRect();
    return Math.max(0, rect.bottom);
  }

  function getAnchorElement(id) {
    var root = document.getElementById(id);
    if (!root) return null;
    var selector = anchorSelectors[id];
    return selector ? (root.querySelector(selector) || root) : root;
  }

  function scrollToAnchor(id, behavior) {
    if (!id) return false;

    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: behavior });
      return true;
    }

    var element = getAnchorElement(id);
    if (!element) return false;

    var headerBottom = getFixedHeaderBottom();
    var gap = window.innerWidth <= 860 ? 12 : 16;
    var top = window.scrollY + element.getBoundingClientRect().top - headerBottom - gap;

    window.scrollTo({
      top: Math.max(0, Math.round(top)),
      behavior: behavior
    });

    return true;
  }

  window.VHScrollToAnchor = scrollToAnchor;

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href || href === '#') return;

    var id;
    try { id = decodeURIComponent(href.slice(1)); }
    catch (error) { id = href.slice(1); }

    if (!getAnchorElement(id) && id !== 'top') return;

    event.preventDefault();

    var behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    scrollToAnchor(id, behavior);

    if (history.pushState) {
      history.pushState(null, '', '#' + encodeURIComponent(id));
    } else {
      window.location.hash = id;
    }
  });

  function alignCurrentHash() {
    if (!window.location.hash) return;
    var id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch (error) { id = window.location.hash.slice(1); }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollToAnchor(id, 'auto');
      });
    });
  }

  window.addEventListener('hashchange', alignCurrentHash);
  window.addEventListener('load', function () {
    setTimeout(alignCurrentHash, 80);
  }, { once: true });
})();


/* Mobile carousel dot synchronization — v4. */
(function () {
  'use strict';

  var indicators = document.querySelectorAll('[data-vh-carousel-dots]');
  if (!indicators.length) return;

  indicators.forEach(function (indicator) {
    var section = indicator.closest('section');
    var selector = indicator.getAttribute('data-vh-carousel');
    var carousel = section && selector ? section.querySelector(selector) : null;
    var dots = Array.from(indicator.querySelectorAll('button'));

    if (!carousel || !dots.length) return;

    function getItems() {
      return Array.from(carousel.children).filter(function (item) {
        return item.nodeType === 1;
      });
    }

    function setActive(index) {
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function update() {
      if (window.innerWidth > 860) return;
      var items = getItems();
      if (!items.length) return;

      var carouselRect = carousel.getBoundingClientRect();
      var targetX = carouselRect.left + 8;
      var bestIndex = 0;
      var bestDistance = Infinity;

      items.forEach(function (item, index) {
        var distance = Math.abs(item.getBoundingClientRect().left - targetX);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      setActive(Math.min(bestIndex, dots.length - 1));
    }

    var ticking = false;
    carousel.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }, { passive: true });

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        var items = getItems();
        var item = items[index];
        if (!item) return;
        carousel.scrollTo({
          left: item.offsetLeft - carousel.offsetLeft,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      });
    });

    window.addEventListener('resize', update, { passive: true });
    update();
  });
})();
