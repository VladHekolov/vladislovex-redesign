(function () {
  function initVocavaRepertoire() {

  var root = document.getElementById('vr');
  if (!root || root.dataset.vrReady === '1') return false;
  root.dataset.vrReady = '1';

  var apiUrl = (root.getAttribute('data-api-url') || '').trim().replace(/\/dev(\?|$)/, '/exec$1');
  var artistId = (root.getAttribute('data-artist-id') || '').trim() || new URLSearchParams(location.search).get('artist') || '';
  var artistNamePreset = (root.getAttribute('data-artist-name') || new URLSearchParams(location.search).get('artist_name') || '').trim();
  var artistName = document.getElementById('vrArtistName');
  var artistMeta = document.getElementById('vrArtistMeta');
  var artistPicker = document.getElementById('vrArtistPicker');
  var artistSelect = document.getElementById('vrArtistSelect');
  var artistDropdown = document.getElementById('vrArtistDropdown');
  var artistDropdownButton = document.getElementById('vrArtistDropdownButton');
  var artistDropdownText = document.getElementById('vrArtistDropdownText');
  var artistDropdownMenu = document.getElementById('vrArtistDropdownMenu');
  var toolbar = document.getElementById('vrToolbar');
  var toolbarSentinel = document.getElementById('vrToolbarSentinel');
  var state = document.getElementById('vrState');
  var list = document.getElementById('vrList');
  var search = document.getElementById('vrSearch');
  var summary = document.getElementById('vrSummary');
  var shownCount = summary.querySelector('.vr-shown');
  var infoButton = document.getElementById('vrInfoButton');
  var guide = document.getElementById('vrGuide');
  var guideStack = document.getElementById('vrGuideStack');
  var guideDots = document.getElementById('vrGuideDots');
  var pdfButton = document.getElementById('vrPdf');
  var artistCardLink = document.getElementById('vrArtistCard');
  var filterWrap = document.getElementById('vrFilter');
  var filterButton = document.getElementById('vrFilterButton');
  var filterBadge = document.getElementById('vrFilterBadge');
  var filterOptions = document.getElementById('vrFilterOptions');
  var filterReset = document.getElementById('vrFilterReset');
  var favoritesToggle = document.getElementById('vrFavoritesToggle');
  var stopToggle = document.getElementById('vrStopToggle');
  var sortWrap = document.getElementById('vrSort');
  var sortButton = document.getElementById('vrSortButton');
  var sortText = document.getElementById('vrSortText');
  var data = { artist: {}, songs: [] };
  var choices = {};
  var artists = [];
  var currentFilters = {
    genre: [],
    mood: [],
    energy: [],
    language: []
  };
  var openFilterGroups = {};
  var sortMode = 'title';
  var sortDir = 'asc';
  var favoritesOnly = false;
  var stopOnly = false;
  var searchHintTimer = 0;
  var searchHintIndex = -1;
  var statePhraseTimer = 0;
  var statePhraseIndex = -1;
  var guideStep = 0;
  var guideScrollRaf = 0;
  var guideTouchStartX = 0;
  var guideTouchStartY = 0;
  var guideTouchStartedOnLast = false;
  var guideCloseTimer = 0;
  var guideSeenKey = 'vocava:repertoire:guide-seen:v1';
  var choicesStoragePrefix = 'vocava:repertoire:choices:v1:';
  var artistMapStorageKey = 'vocava:repertoire:artist-map:v1';
  var activePdfJob = null;
  var pdfLibraryPromise = null;
  var headNameAnimated = false;
  var headNameFinalizeTimer = 0;

  function setArtistHeadingName(name, options) {
    options = options || {};
    var cleanName = String(name || '').replace(/\s+/g, ' ').trim();
    if (!artistName || !cleanName || cleanName === 'Музыкант') return false;

    var currentName = artistName.getAttribute('data-current-name') || '';
    if (currentName === cleanName) {
      root.classList.add('is-head-ready');
      return true;
    }

    window.clearTimeout(headNameFinalizeTimer);

    var shouldAnimate = options.animate === true || (!headNameAnimated && !options.instant);
    artistName.setAttribute('aria-label', cleanName);
    artistName.setAttribute('data-current-name', cleanName);
    artistName.classList.remove('is-title-plain');

    if (!shouldAnimate) {
      artistName.textContent = cleanName;
      artistName.classList.add('is-title-plain');
      artistName.setAttribute('data-render-complete', '1');
      root.classList.add('is-head-ready');
      return true;
    }

    headNameAnimated = true;
    artistName.textContent = '';
    artistName.setAttribute('data-render-complete', '0');
    root.classList.remove('is-head-ready');

    var chunks = cleanName.match(/\S+|\s+/g) || [cleanName];
    var letterIndex = 0;

    chunks.forEach(function (chunk) {
      if (/^\s+$/.test(chunk)) {
        var space = document.createElement('span');
        space.className = 'vr-head__title-space';
        space.textContent = ' ';
        artistName.appendChild(space);
        return;
      }

      var word = document.createElement('span');
      word.className = 'vr-head__title-word';

      Array.prototype.forEach.call(chunk, function (char) {
        var letter = document.createElement('span');
        letter.className = 'vr-head__title-char';
        letter.textContent = char;
        letter.style.setProperty('--vr-letter-delay', Math.min(letterIndex * 0.035, 0.72).toFixed(3) + 's');
        word.appendChild(letter);
        letterIndex += 1;
      });

      artistName.appendChild(word);
    });

    requestAnimationFrame(function () {
      root.classList.add('is-head-ready');
    });

    headNameFinalizeTimer = window.setTimeout(function () {
      if (!artistName || artistName.getAttribute('data-current-name') !== cleanName) return;
      artistName.textContent = cleanName;
      artistName.classList.add('is-title-plain');
      artistName.setAttribute('data-render-complete', '1');
    }, Math.min(letterIndex * 35, 720) + 920);

    return true;
  }

  function getStoredArtistName(id) {
    if (!id) return '';
    try {
      var map = JSON.parse(localStorage.getItem(artistMapStorageKey) || '{}');
      return String(map[id] || '').trim();
    } catch (error) {
      return '';
    }
  }

  function saveStoredArtistMap(rows) {
    if (!rows || !rows.length) return;
    try {
      var map = JSON.parse(localStorage.getItem(artistMapStorageKey) || '{}');
      rows.forEach(function (artist) {
        if (artist && artist.id && artist.name) map[artist.id] = artist.name;
      });
      localStorage.setItem(artistMapStorageKey, JSON.stringify(map));
    } catch (error) {}
  }

  setArtistHeadingName(artistNamePreset || getStoredArtistName(artistId));

  var guideSteps = [
    {
      image: 'https://storage.yandexcloud.net/vocava/%D0%98%D0%BA%D0%BE%D0%BD%D0%BA%D0%B8/%D0%92%D0%B8%D0%B4%D0%B5%D0%BE%20%D0%B8%D0%BD%D1%84%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%BA%D0%B0/%D0%97%D0%B5%D0%BB%D0%B5%D0%BD%D1%8B%D0%B8%CC%86%20%D0%B8%D0%BD%D0%B4%D0%B8%D0%BA%D0%B0%D1%82%D0%BE%D1%80.gif',
      alt: 'Инструкция: зелёный индикатор добавляет песню в избранное',
      title: 'Выбирайте любимые песни',
      text: 'Нажмите на карточку песни. Зелёный индикатор справа покажет, что песня добавлена в избранное.'
    },
    {
      image: 'https://storage.yandexcloud.net/vocava/%D0%98%D0%BA%D0%BE%D0%BD%D0%BA%D0%B8/%D0%92%D0%B8%D0%B4%D0%B5%D0%BE%20%D0%B8%D0%BD%D1%84%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%BA%D0%B0/%D0%9A%D1%80%D0%B0%D1%81%D0%BD%D1%8B%D0%B8%CC%86%20%D0%B8%D0%BD%D0%B4%D0%B8%D0%BA%D0%B0%D1%82%D0%BE%D1%80.gif',
      alt: 'Инструкция: красный индикатор добавляет песню в стоп-лист',
      title: 'Соберите стоп-лист',
      text: 'Нажмите на серый индикатор справа. Он станет красным, а песня попадёт в стоп-лист.'
    },
    {
      image: 'https://storage.yandexcloud.net/vocava/%D0%98%D0%BA%D0%BE%D0%BD%D0%BA%D0%B8/%D0%92%D0%B8%D0%B4%D0%B5%D0%BE%20%D0%B8%D0%BD%D1%84%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%BA%D0%B0/%D0%A4%D0%B8%D0%BB%D1%8C%D1%82%D1%80%D1%8B.gif',
      alt: 'Инструкция: фильтры помогают быстрее найти нужные песни',
      variant: 'filters',
      title: 'Найдите нужное быстрее',
      text: 'Откройте фильтры и выберите жанр, настроение, энергию или язык. Так в списке останутся только подходящие песни.'
    }
  ];

  var sortLabels = {
    title: 'По названию',
    artist: 'По исполнителю'
  };

  var filterFields = [
    { key: 'genre', label: 'Жанр' },
    { key: 'mood', label: 'Настроение' },
    { key: 'energy', label: 'Энергия' },
    { key: 'language', label: 'Язык' }
  ];

  filterFields.forEach(function (field) {
    openFilterGroups[field.key] = false;
  });

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char];
    });
  }

  function jsonp(action, params) {
    params = params || {};
    return new Promise(function (resolve, reject) {
      var callback = 'vrCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      var script = document.createElement('script');
      var timeout = setTimeout(function () {
        cleanup();
        reject(new Error('таймаут загрузки'));
      }, 15000);

      function cleanup() {
        clearTimeout(timeout);
        delete window[callback];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callback] = function (response) {
        cleanup();
        resolve(response);
      };

      script.onerror = function () {
        cleanup();
        reject(new Error('Apps Script недоступен'));
      };

      var query = new URLSearchParams(Object.assign({}, params, {
        action: action,
        callback: callback,
        _: Date.now()
      }));
      script.src = apiUrl + (apiUrl.indexOf('?') === -1 ? '?' : '&') + query.toString();
      document.head.appendChild(script);
    });
  }

  function loadingStatePhrases() {
    return [
      'Собираю музыкальное меню',
      'Ищу песни для вашего праздника',
      'Открываю интерактивный репертуар',
      'Подбираю музыку под настроение',
      'Готовлю список любимых треков',
      'Настраиваю поиск по песням',
      'Проверяю исполнителей и названия',
      'Собираю репертуар мечты',
      'Скоро здесь появятся песни',
      'Музыка уже близко',
      'Навожу порядок в песнях',
      'Готовлю удобный список',
      'Подгружаю песни для выбора',
      'Почти готово, осталось чуть-чуть',
      'Собираю атмосферу вечера'
    ];
  }

  function nextLoadingStatePhrase() {
    var phrases = loadingStatePhrases();
    if (!phrases.length) return 'Загрузка репертуара...';
    if (phrases.length === 1) return phrases[0];
    var next = statePhraseIndex;
    while (next === statePhraseIndex) {
      next = Math.floor(Math.random() * phrases.length);
    }
    statePhraseIndex = next;
    return phrases[next];
  }

  function stopLoadingStatePhrases() {
    clearTimeout(statePhraseTimer);
    statePhraseTimer = 0;
  }

  function startLoadingStatePhrases() {
    stopLoadingStatePhrases();
    var target = state.querySelector('.vr-state__phrase');
    if (!target) return;

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.textContent = nextLoadingStatePhrase();

    if (reducedMotion) return;

    function changePhrase() {
      if (!target || state.classList.contains('is-hidden') || !state.classList.contains('is-loading')) return;
      target.classList.add('is-changing');
      statePhraseTimer = setTimeout(function () {
        if (!target || state.classList.contains('is-hidden') || !state.classList.contains('is-loading')) return;
        target.textContent = nextLoadingStatePhrase();
        target.classList.remove('is-changing');
        statePhraseTimer = setTimeout(changePhrase, 1550);
      }, 240);
    }

    statePhraseTimer = setTimeout(changePhrase, 1550);
  }

  function setState(text, isError, isLoading) {
    stopLoadingStatePhrases();
    state.innerHTML = (isLoading ? '<span class="vr-loader" aria-hidden="true"></span>' : '') + '<span class="' + (isLoading ? 'vr-state__phrase' : '') + '">' + esc(text) + '</span>';
    state.classList.toggle('is-error', !!isError);
    state.classList.toggle('is-loading', !!isLoading);
    state.classList.remove('is-hidden');
    if (isLoading) startLoadingStatePhrases();
  }

  function guideCardClass(index) {
    var extra = guideSteps[index] && guideSteps[index].variant ? ' vr-guide__card--' + guideSteps[index].variant : '';
    return (index === guideStep ? 'is-active' : '') + extra;
  }

  function updateGuideDots() {
    guideDots.innerHTML = guideSteps.map(function (_, index) {
      var status = index < guideStep ? 'is-complete' : (index === guideStep ? 'is-active' : '');
      return '<i class="' + status + '"></i>';
    }).join('');

    Array.prototype.forEach.call(guideStack.querySelectorAll('.vr-guide__card'), function (card, index) {
      card.classList.toggle('is-active', index === guideStep);
      card.setAttribute('aria-hidden', index === guideStep ? 'false' : 'true');
    });
  }

  function updateGuideFromScroll() {
    guideScrollRaf = 0;
    var cards = guideStack.querySelectorAll('.vr-guide__card');
    if (!cards.length) return;

    var closestIndex = 0;
    var closestDistance = Infinity;
    var leftPadding = parseFloat(getComputedStyle(guideStack).paddingLeft) || 0;
    Array.prototype.forEach.call(cards, function (card, index) {
      var distance = Math.abs((card.offsetLeft - leftPadding) - guideStack.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== guideStep) {
      guideStep = closestIndex;
      updateGuideDots();
    }
  }

  function renderGuide() {
    guideStack.innerHTML = guideSteps.map(function (step, index) {
      return '' +
        '<article class="vr-guide__card ' + guideCardClass(index) + '" aria-hidden="' + (index === guideStep ? 'false' : 'true') + '">' +
          '<p class="vr-guide__eyebrow">Шаг ' + (index + 1) + ' из ' + guideSteps.length + '</p>' +
          '<h2 ' + (index === guideStep ? 'id="vrGuideTitle"' : '') + '>' + esc(step.title) + '</h2>' +
          '<p class="vr-guide__text">' + esc(step.text) + '</p>' +
          '<div class="vr-guide__visual"><img src="' + esc(step.image) + '" alt="' + esc(step.alt || step.title) + '" loading="eager" decoding="async"></div>' +
        '</article>';
    }).join('');
    updateGuideDots();
  }

  function scrollGuideTo(index, behavior) {
    var cards = guideStack.querySelectorAll('.vr-guide__card');
    var card = cards[index];
    if (!card) return;
    var leftPadding = parseFloat(getComputedStyle(guideStack).paddingLeft) || 0;
    guideStep = index;
    updateGuideDots();
    guideStack.scrollTo({ left: Math.max(0, card.offsetLeft - leftPadding), behavior: behavior || 'smooth' });
  }

  function moveGuide(direction) {
    var nextStep = guideStep + direction;
    if (nextStep < 0 || nextStep >= guideSteps.length) return;
    scrollGuideTo(nextStep, 'smooth');
  }

  function markGuideSeen() {
    infoButton.classList.remove('is-attention');
    try {
      localStorage.setItem(guideSeenKey, '1');
    } catch (e) {}
  }

  function openGuide() {
    markGuideSeen();
    clearTimeout(guideCloseTimer);
    guide.classList.remove('is-closing');
    guideStep = 0;
    renderGuide();
    guide.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      scrollGuideTo(0, 'auto');
    });
    // Не переводим фокус на крестик автоматически, чтобы на мобильных не появлялась синяя обводка.
  }

  function closeGuide() {
    if (guide.hidden || guide.classList.contains('is-closing')) return;
    clearTimeout(guideCloseTimer);
    guide.classList.add('is-closing');
    document.body.style.overflow = '';
    guideCloseTimer = setTimeout(function () {
      guide.hidden = true;
      guide.classList.remove('is-closing');
    }, 300);
    // Не возвращаем фокус программно, чтобы не появлялась системная обводка.
  }

  function storageKey() {
    return choicesStoragePrefix + encodeURIComponent(artistId || 'default');
  }

  function loadStoredChoices() {
    try {
      var raw = localStorage.getItem(storageKey());
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveStoredChoices() {
    try {
      var compact = {};
      Object.keys(choices || {}).forEach(function (id) {
        if (choices[id] === 'like' || choices[id] === 'stop') {
          compact[id] = choices[id];
        }
      });
      if (Object.keys(compact).length) {
        localStorage.setItem(storageKey(), JSON.stringify(compact));
      } else {
        localStorage.removeItem(storageKey());
      }
    } catch (e) {}
  }

  function yes(value) {
    return /^(true|1|yes|да|актив|on)$/i.test(String(value || '').trim());
  }

  function updateStickyToolbar() {
    if (!toolbar || !toolbarSentinel) return;
    var stickyTop = Math.max(14, parseFloat(getComputedStyle(toolbar).top) || 14);
    var isStuck = toolbarSentinel.getBoundingClientRect().top < stickyTop;
    toolbar.classList.toggle('is-stuck', isStuck);
  }

  function searchHintTitles() {
    var songs = data && Array.isArray(data.songs) ? data.songs : [];
    var titles = songs.map(function (song) {
      var artist = String(song.original_artist || '').trim();
      var title = String(song.title || '').trim();
      return [artist, title].filter(Boolean).join(' — ');
    }).filter(Boolean);

    return titles;
  }

  function nextSearchHint(titles) {
    if (!titles.length) return 'Название песни или исполнитель';
    if (titles.length === 1) return titles[0];
    var next = searchHintIndex;
    while (next === searchHintIndex) {
      next = Math.floor(Math.random() * titles.length);
    }
    searchHintIndex = next;
    return titles[next];
  }

  function startSearchHintAnimation() {
    clearTimeout(searchHintTimer);

    var titles = searchHintTitles();
    if (!titles.length) {
      search.placeholder = 'Название песни, исполнитель, жанр';
      return;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      search.placeholder = nextSearchHint(titles);
      return;
    }

    var phrase = '';
    var position = 0;
    var deleting = false;

    function step() {
      if (document.activeElement === search || search.value) {
        searchHintTimer = setTimeout(step, 500);
        return;
      }

      if (!phrase) {
        phrase = nextSearchHint(titles);
        position = 0;
        deleting = false;
      }

      position += deleting ? -1 : 1;
      search.placeholder = phrase.slice(0, Math.max(0, position));

      if (!deleting && position >= phrase.length) {
        deleting = true;
        searchHintTimer = setTimeout(step, 1500);
        return;
      }

      if (deleting && position <= 0) {
        phrase = '';
        searchHintTimer = setTimeout(step, 420);
        return;
      }

      searchHintTimer = setTimeout(step, deleting ? 45 : 85);
    }

    step();
  }

  function updateUrlArtist(id) {
    if (!history.replaceState || !id) return;
    try {
      var url = new URL(location.href);
      url.searchParams.set('artist', id);
      history.replaceState(null, '', url.toString());
    } catch (e) {}
  }

  function getArtistLabel(id) {
    var found = artists.find(function (artist) { return String(artist.id || '') === String(id || ''); });
    return found ? (found.name || found.id) : '';
  }

  function getArtistCardUrl(id) {
    var cleanId = String(id || '').trim();
    if (!cleanId) return 'https://vladislovex.ru/artists#artists';
    return 'https://vladislovex.ru/artists?artist=' + encodeURIComponent(cleanId) + '&open=artist#artists';
  }

  function updateArtistCardLink() {
    if (!artistCardLink) return;
    var cleanId = String(artistId || '').trim();
    var label = getArtistLabel(cleanId) || (data && data.artist && data.artist.name) || artistNamePreset || '';
    artistCardLink.href = getArtistCardUrl(cleanId);
    artistCardLink.classList.toggle('is-disabled', !cleanId);
    artistCardLink.setAttribute('aria-disabled', cleanId ? 'false' : 'true');
    artistCardLink.setAttribute('aria-label', label ? 'Открыть карточку артиста: ' + label : 'Открыть карточку артиста');
  }

  function syncArtistDropdown() {
    if (artistDropdownText) {
      artistDropdownText.textContent = getArtistLabel(artistId) || 'Выберите музыканта';
    }
    if (artistDropdownMenu) {
      Array.prototype.forEach.call(artistDropdownMenu.querySelectorAll('[data-artist-id]'), function (button) {
        var isActive = String(button.getAttribute('data-artist-id') || '') === String(artistId || '');
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        var mark = button.querySelector('b');
        if (mark) mark.textContent = isActive ? 'Выбран' : '';
      });
    }
    updateArtistCardLink();
  }

  function renderArtistPicker() {
    if (!artistPicker || !artistSelect) return;
    artistPicker.hidden = false;
    artistSelect.innerHTML = '<option value="">Выберите музыканта</option>' + artists.map(function (artist) {
      return '<option value="' + esc(artist.id) + '">' + esc(artist.name || artist.id) + '</option>';
    }).join('');
    artistSelect.value = artistId || '';
    if (artistDropdownMenu) {
      artistDropdownMenu.innerHTML = artists.map(function (artist) {
        var id = artist.id || artist.name || '';
        var name = artist.name || artist.id || 'Музыкант';
        var isActive = String(id) === String(artistId || '');
        return '<button class="vr-artist-select__option ' + (isActive ? 'is-active' : '') + '" type="button" role="option" aria-selected="' + (isActive ? 'true' : 'false') + '" data-artist-id="' + esc(id) + '">' +
          '<i aria-hidden="true"></i>' +
          '<span>' + esc(name) + '</span>' +
          '<b>' + (isActive ? 'Выбран' : '') + '</b>' +
        '</button>';
      }).join('');
    }
    syncArtistDropdown();
  }

  function songMeta(song) {
    return [song.original_artist, song.genre, song.mood, song.energy].filter(Boolean).join(' · ');
  }

  function getFilterGroups() {
    return filterFields.map(function (field) {
      var counts = {};

      data.songs.forEach(function (song) {
        var value = String(song[field.key] || '').trim();
        if (!value) return;
        counts[value] = (counts[value] || 0) + 1;
      });

      return {
        key: field.key,
        label: field.label,
        options: Object.keys(counts).sort(function (a, b) {
          return a.localeCompare(b, 'ru');
        }).map(function (value) {
          return { value: value, count: counts[value] };
        })
      };
    }).filter(function (group) {
      return group.options.length;
    });
  }

  function activeFilterCount() {
    return filterFields.reduce(function (total, field) {
      return total + (currentFilters[field.key] || []).length;
    }, 0);
  }

  function resetFilters() {
    filterFields.forEach(function (field) {
      currentFilters[field.key] = [];
    });
  }

  function matchesFilters(song) {
    return filterFields.every(function (field) {
      var selected = currentFilters[field.key] || [];
      return !selected.length || selected.indexOf(String(song[field.key] || '')) !== -1;
    });
  }

  function searchText(song) {
    return [
      song.title,
      song.original_artist,
      song.genre,
      song.mood,
      song.energy,
      song.language,
      song.tags,
      song.client_filter
    ].join(' ').toLowerCase();
  }

  function hydrateSongFilterAliases() {
    data.songs.forEach(function (song) {
      if (!song.energy && song.tempo) song.energy = song.tempo;
    });
  }

  function sortDirectionSign() {
    return sortDir === 'desc' ? '↓' : '↑';
  }

  function compareVisibleSongs(a, b) {
    var result = 0;

    if (sortMode === 'title') {
      result = String(a.title || '').localeCompare(String(b.title || ''), 'ru');
    } else if (sortMode === 'artist') {
      result = String(a.original_artist || '').localeCompare(String(b.original_artist || ''), 'ru');
    }

    if (!result) {
      result = Number(a.sort || 0) - Number(b.sort || 0);
    }

    return sortDir === 'desc' ? -result : result;
  }

  function setSortMode(nextMode) {
    nextMode = nextMode || 'default';
    if (sortMode === nextMode) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortMode = nextMode;
      sortDir = 'asc';
    }
  }

  function getVisibleSongs() {
    var query = String(search.value || '').trim().toLowerCase();
    var rows = data.songs.slice();

    if (favoritesOnly) {
      rows = rows.filter(function (song) {
        return (choices[song.song_id] || 'ok') === 'like';
      });
    }

    if (stopOnly) {
      rows = rows.filter(function (song) {
        return (choices[song.song_id] || 'ok') === 'stop';
      });
    }

    if (activeFilterCount()) {
      rows = rows.filter(matchesFilters);
    }

    if (query) {
      rows = rows.filter(function (song) {
        return searchText(song).indexOf(query) !== -1;
      });
    }

    rows.sort(compareVisibleSongs);

    return rows;
  }

  function normalizeChoiceFilters() {
    var likedCount = songsByChoice('like').length;
    var stopCount = songsByChoice('stop').length;
    var changed = false;

    if (favoritesOnly && !likedCount) {
      favoritesOnly = false;
      changed = true;
    }

    if (stopOnly && !stopCount) {
      stopOnly = false;
      changed = true;
    }

    return changed;
  }

  function renderToolbar() {
    normalizeChoiceFilters();
    var groups = getFilterGroups();

    filterOptions.innerHTML = groups.length
      ? groups.map(function (group) {
          var isOpen = !!openFilterGroups[group.key];
          var selected = currentFilters[group.key] || [];
          var hasActive = selected.length > 0;
          return '<div class="vr-filter__group">' +
            '<button class="vr-filter__group-title ' + (isOpen ? 'is-open ' : '') + (hasActive ? 'has-active' : '') + '" type="button" data-filter-group="' + esc(group.key) + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
              '<span>' + esc(group.label) + '</span><b>' + (hasActive ? selected.length + '/' : '') + group.options.length + '</b>' +
            '</button>' +
            '<div class="vr-filter__group-options ' + (isOpen ? 'is-open' : '') + '">' +
              group.options.map(function (item) {
                return '<button class="vr-filter__option ' + (selected.indexOf(item.value) !== -1 ? 'is-active' : '') + '" type="button" data-filter-field="' + esc(group.key) + '" data-filter-value="' + esc(item.value) + '">' +
                  '<i aria-hidden="true"></i><span>' + esc(item.value) + '</span><b>' + item.count + '</b>' +
                '</button>';
              }).join('') +
            '</div>' +
          '</div>';
        }).join('')
      : '<button class="vr-filter__option" type="button">Фильтры появятся после заполнения жанра, настроения, энергии или языка</button>';

    var activeFilters = activeFilterCount();
    filterBadge.hidden = !activeFilters;
    filterBadge.textContent = activeFilters;
    filterButton.setAttribute('aria-expanded', filterWrap.classList.contains('is-open') ? 'true' : 'false');

    sortText.textContent = (sortLabels[sortMode] || sortLabels.default) + ' ' + sortDirectionSign();
    Array.prototype.slice.call(document.querySelectorAll('[data-sort]')).forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-sort') === sortMode);
    });
    sortButton.setAttribute('aria-expanded', sortWrap.classList.contains('is-open') ? 'true' : 'false');

    var likedCount = songsByChoice('like').length;
    if (!likedCount && favoritesOnly) {
      favoritesOnly = false;
    }
    favoritesToggle.hidden = !likedCount;
    favoritesToggle.classList.toggle('is-active', favoritesOnly);

    var stopCount = songsByChoice('stop').length;
    if (!stopCount && stopOnly) {
      stopOnly = false;
    }
    stopToggle.hidden = !stopCount;
    stopToggle.classList.toggle('is-active', stopOnly);
  }

  function renderSongs() {
    if (!data.songs.length) {
      list.innerHTML = '';
      setState('У этого артиста пока не заполнен полный репертуар.');
      updateSummary(0);
      renderToolbar();
      return;
    }

    normalizeChoiceFilters();
    var visibleSongs = getVisibleSongs();

    stopLoadingStatePhrases();
    state.classList.add('is-hidden');
    list.innerHTML = visibleSongs.length ? visibleSongs.map(function (song) {
      var choice = choices[song.song_id] || 'ok';
      return '' +
        '<article class="vr-song" data-id="' + esc(song.song_id) + '" data-choice="' + esc(choice) + '" data-search="' + esc([song.title, song.original_artist, song.genre, song.tags].join(' ').toLowerCase()) + '">' +
          '<div class="vr-song__title">' +
            '<h3>' + esc(song.title || 'Без названия') + '</h3>' +
            '<p>' + esc(songMeta(song) || 'Песня из репертуара') + '</p>' +
          '</div>' +
          '<div class="vr-song__actions" aria-label="Статус песни">' +
            '<button class="vr-song__choice vr-song__choice--like" type="button" data-choice="like" aria-label="Переключить избранное" title="Избранное"></button>' +
            '<button class="vr-song__choice vr-song__choice--stop" type="button" data-choice="stop" aria-label="Переключить стоп-лист" title="Стоп-лист"></button>' +
          '</div>' +
        '</article>';
    }).join('') : '<div class="vr-state">По этим условиям песен не найдено.</div>';
    updateSummary(visibleSongs.length);
    renderToolbar();
  }

  function updateSummary(visibleCount) {
    shownCount.innerHTML = '<b>' + (visibleCount == null ? data.songs.length : visibleCount) + '</b> показано';
  }

  function applySearch() {
    renderSongs();
  }

  function songsByChoice(choice) {
    return data.songs.filter(function (song) {
      return (choices[song.song_id] || 'ok') === choice;
    });
  }


  function hapticFeedback(choice) {
    try {
      var tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback;
      if (tg) {
        if (choice === 'stop' && tg.notificationOccurred) tg.notificationOccurred('warning');
        else if (tg.selectionChanged) tg.selectionChanged();
        else if (tg.impactOccurred) tg.impactOccurred('light');
      }
    } catch (e) {}

    try {
      if (!navigator.vibrate) return;
      if (choice === 'stop') navigator.vibrate([18, 24, 18]);
      else if (choice === 'ok') navigator.vibrate(10);
      else navigator.vibrate(14);
    } catch (e) {}
  }

  function animateSongChoice(row, choice, event) {
    if (!row) return;
    var rect = row.getBoundingClientRect();
    var point = event && (event.changedTouches && event.changedTouches[0] || event.touches && event.touches[0] || event);
    var x = point && typeof point.clientX === 'number' ? point.clientX - rect.left : rect.width - 20;
    var y = point && typeof point.clientY === 'number' ? point.clientY - rect.top : rect.height / 2;
    row.style.setProperty('--tap-x', Math.max(0, Math.min(100, x / rect.width * 100)) + '%');
    row.style.setProperty('--tap-y', Math.max(0, Math.min(100, y / rect.height * 100)) + '%');

    row.classList.remove('is-choosing', 'is-choice-like', 'is-choice-stop', 'is-choice-ok');
    void row.offsetWidth;
    row.setAttribute('data-choice', choice);
    row.classList.add('is-choosing', choice === 'like' ? 'is-choice-like' : (choice === 'stop' ? 'is-choice-stop' : 'is-choice-ok'));

    clearTimeout(row._vrChoiceTimer);
    row._vrChoiceTimer = setTimeout(function () {
      row.classList.remove('is-choosing', 'is-choice-like', 'is-choice-stop', 'is-choice-ok', 'is-pressing');
    }, 680);
  }

  function shouldRenderAfterChoice(previousChoice, nextChoice) {
    if (favoritesOnly || stopOnly) return true;
    return false;
  }


  function pdfSongCard(song, index) {
    var meta = songMeta(song) || 'Песня из репертуара';
    return '' +
      '<article class="vr-pdf__song">' +
        '<div class="vr-pdf__song-index">' + (index + 1) + '</div>' +
        '<h4>' + esc(song.title || 'Без названия') + '</h4>' +
        '<p>' + esc(meta) + '</p>' +
      '</article>';
  }

  function pluralSongs(count) {
    var value = Math.abs(count) % 100;
    var last = value % 10;
    if (value > 10 && value < 20) return 'песен';
    if (last > 1 && last < 5) return 'песни';
    if (last === 1) return 'песня';
    return 'песен';
  }

  function pdfStyles() {
    return '' +
      '.vr-pdf,.vr-pdf *{box-sizing:border-box;}' +
      '.vr-pdf{position:absolute;left:0;top:0;right:auto;bottom:auto;z-index:2147483400;width:794px;max-width:none;height:auto;max-height:none;overflow:visible;background:#050505;color:#fff;font-family:Montserrat,Arial,sans-serif;pointer-events:none;opacity:1;visibility:visible;transform:none;contain:none;}' +
      '.vr-pdf__page{position:relative;width:794px;height:1123px;margin:0;padding:28px;overflow:hidden;background:#050505;color:#fff;page-break-after:always;break-after:page;}' +
      '.vr-pdf__page:last-child{page-break-after:auto;break-after:auto;}' +
      '.vr-pdf__page:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 86% 7%,rgba(246,138,31,.18),transparent 28%),radial-gradient(circle at 10% 76%,rgba(255,189,109,.08),transparent 25%),linear-gradient(180deg,#050505 0%,#0b0907 50%,#050505 100%);}' +
      '.vr-pdf__page:after{content:"";position:absolute;inset:0;opacity:.09;background-image:radial-gradient(circle,rgba(255,255,255,.10) 1px,transparent 1.4px);background-size:22px 22px;}' +
      '.vr-pdf__content{position:relative;z-index:2;}' +
      '.vr-pdf__page-number{position:absolute;right:28px;bottom:16px;z-index:3;color:rgba(255,255,255,.30);font-size:9px;line-height:1;font-weight:700;}' +
      '.vr-pdf__hero{position:relative;isolation:isolate;overflow:hidden;padding:20px 22px 22px;border:1px solid rgba(246,138,31,.22);border-radius:28px;background:radial-gradient(circle at 92% 5%,rgba(246,138,31,.16),transparent 36%),radial-gradient(circle at 8% 92%,rgba(255,189,109,.05),transparent 34%),linear-gradient(135deg,rgba(24,23,21,.96),rgba(7,7,7,.96));box-shadow:0 14px 34px rgba(0,0,0,.24);}' +
      '.vr-pdf__hero:before{content:none!important;display:none!important;}' +
      '.vr-pdf__hero>*{position:relative;z-index:1;background:transparent!important;box-shadow:none!important;}' +
      '.vr-pdf__kicker{margin:0 0 10px;color:#f6a34d;background:transparent!important;font-size:10px;line-height:1;font-weight:800;text-transform:uppercase;letter-spacing:.14em;}' +
      '.vr-pdf h1{display:block;width:auto;max-width:100%;margin:0;color:#fff;background:transparent!important;font-size:32px;line-height:1;font-weight:800;text-transform:uppercase;letter-spacing:-.035em;text-shadow:none!important;box-shadow:none!important;box-decoration-break:slice;-webkit-box-decoration-break:slice;}' +
      '.vr-pdf__subtitle{margin:10px 0 0;color:rgba(255,255,255,.70);background:transparent!important;font-size:13px;line-height:1.45;font-weight:500;}' +
      '.vr-pdf__stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0 0;}' +
      '.vr-pdf__stat{min-height:58px;padding:11px 13px;border:1px solid rgba(255,255,255,.10);border-radius:18px;background:rgba(255,255,255,.04);}' +
      '.vr-pdf__stat b{display:block;margin:0 0 5px;color:#fff;font-size:22px;line-height:1;font-weight:900;}' +
      '.vr-pdf__stat span{display:block;color:rgba(255,255,255,.58);font-size:9px;line-height:1.15;font-weight:800;text-transform:uppercase;letter-spacing:.08em;}' +
      '.vr-pdf__stat--like b{color:#8af0a1;}.vr-pdf__stat--ok b{color:#ffc982;}.vr-pdf__stat--stop b{color:#ff7a96;}' +
      '.vr-pdf__group{margin-top:13px;padding:15px;border:1px solid rgba(255,255,255,.10);border-radius:24px;background:radial-gradient(circle at 100% 0%,rgba(246,138,31,.10),transparent 25%),linear-gradient(135deg,rgba(18,18,18,.88),rgba(7,7,7,.82));box-shadow:0 14px 34px rgba(0,0,0,.25);overflow:hidden;}' +
      '.vr-pdf__group--like{border-color:rgba(120,224,143,.30);}.vr-pdf__group--ok{border-color:rgba(255,189,109,.24);}.vr-pdf__group--stop{border-color:rgba(255,47,95,.26);}' +
      '.vr-pdf__group-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin:0 0 12px;}' +
      '.vr-pdf__group-label{margin:0 0 5px;color:#ffbd6d;font-size:9px;line-height:1;font-weight:800;text-transform:uppercase;letter-spacing:.12em;}' +
      '.vr-pdf__group--like .vr-pdf__group-label{color:#78e08f;}.vr-pdf__group--stop .vr-pdf__group-label{color:#ff5b7d;}' +
      '.vr-pdf__group h2{margin:0;color:#fff;font-size:20px;line-height:1.06;font-weight:800;letter-spacing:-.025em;}' +
      '.vr-pdf__count{flex:0 0 auto;min-height:28px;padding:8px 12px;border:1px solid rgba(255,255,255,.12);border-radius:999px;color:rgba(255,255,255,.78);background:rgba(255,255,255,.055);font-size:10px;line-height:1;font-weight:800;white-space:nowrap;}' +
      '.vr-pdf__songs-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;align-items:stretch;}' +
      '.vr-pdf__song{position:relative;min-height:55px;padding:9px 9px 8px 30px;border:1px solid rgba(255,255,255,.10);border-radius:15px;background:linear-gradient(135deg,rgba(255,255,255,.060),rgba(255,255,255,.028));overflow:hidden;}' +
      '.vr-pdf__group--like .vr-pdf__song{border-color:rgba(120,224,143,.24);background:linear-gradient(135deg,rgba(120,224,143,.10),rgba(255,255,255,.026));}' +
      '.vr-pdf__group--stop .vr-pdf__song{border-color:rgba(255,47,95,.22);background:linear-gradient(135deg,rgba(255,47,95,.09),rgba(255,255,255,.024));}' +
      '.vr-pdf__song-index{position:absolute;left:9px;top:9px;min-width:14px;height:14px;border-radius:999px;color:#090705;background:#ffbd6d;font-size:7px;line-height:14px;font-weight:900;text-align:center;}' +
      '.vr-pdf__group--like .vr-pdf__song-index{background:#78e08f;}.vr-pdf__group--stop .vr-pdf__song-index{background:#ff5b7d;color:#fff;}' +
      '.vr-pdf__song h4{margin:0;color:#fff;font-size:10.5px;line-height:1.18;font-weight:800;letter-spacing:-.015em;overflow-wrap:anywhere;}' +
      '.vr-pdf__song p{margin:4px 0 0;color:rgba(255,255,255,.55);font-size:8.5px;line-height:1.22;font-weight:500;overflow-wrap:anywhere;}' +
      '.vr-pdf__empty{padding:16px;border:1px dashed rgba(255,255,255,.14);border-radius:16px;color:rgba(255,255,255,.46);background:rgba(255,255,255,.035);font-size:12px;line-height:1.35;font-weight:600;text-align:center;}' +
      '.vr-pdf__footer{margin:16px 4px 0;color:rgba(255,255,255,.45);font-size:10px;line-height:1.45;font-weight:500;}' +
      '.vr-pdf__footer b{color:#ffbd6d;font-weight:800;}';
  }

  function createPdfPage(report) {
    var page = document.createElement('section');
    page.className = 'vr-pdf__page';
    page.innerHTML = '<div class="vr-pdf__content"></div>';
    report.appendChild(page);
    return {
      page: page,
      content: page.querySelector('.vr-pdf__content')
    };
  }

  function createPdfReport() {
    var report = document.createElement('div');
    report.className = 'vr-pdf';
    report.setAttribute('aria-hidden', 'true');
    report.innerHTML = '<style>' + pdfStyles() + '</style>';
    document.body.appendChild(report);
    return report;
  }

  function appendPdfHero(content, artistTitle, artistDetails, likedCount, okCount, stopCount) {
    content.insertAdjacentHTML('beforeend', '' +
      '<header class="vr-pdf__hero">' +
        '<p class="vr-pdf__kicker">Vocava / Интерактивный репертуар</p>' +
        '<h1>' + esc(artistTitle) + '</h1>' +
        '<p class="vr-pdf__subtitle">' + esc(artistDetails || 'Выбор песен клиентом') + '</p>' +
        '<div class="vr-pdf__stats">' +
          '<div class="vr-pdf__stat vr-pdf__stat--like"><b>' + likedCount + '</b><span>Любимое</span></div>' +
          '<div class="vr-pdf__stat vr-pdf__stat--ok"><b>' + okCount + '</b><span>Окей</span></div>' +
          '<div class="vr-pdf__stat vr-pdf__stat--stop"><b>' + stopCount + '</b><span>Стоп-лист</span></div>' +
        '</div>' +
      '</header>'
    );
  }

  function appendPdfGroupShell(content, title, subtitle, songsCount, type, isContinuation) {
    var countText = songsCount + ' ' + pluralSongs(songsCount);
    var label = subtitle + (isContinuation ? ' · продолжение' : '');
    var section = document.createElement('section');
    section.className = 'vr-pdf__group vr-pdf__group--' + type;
    section.innerHTML = '' +
      '<div class="vr-pdf__group-head">' +
        '<div>' +
          '<div class="vr-pdf__group-label">' + esc(label) + '</div>' +
          '<h2>' + esc(title) + '</h2>' +
        '</div>' +
        '<div class="vr-pdf__count">' + esc(countText) + '</div>' +
      '</div>' +
      '<div class="vr-pdf__songs-grid"></div>';
    content.appendChild(section);
    return {
      section: section,
      grid: section.querySelector('.vr-pdf__songs-grid')
    };
  }

  function addPdfPageNumbers(report) {
    var pages = Array.prototype.slice.call(report.querySelectorAll('.vr-pdf__page'));
    pages.forEach(function (page, index) {
      var number = document.createElement('div');
      number.className = 'vr-pdf__page-number';
      number.textContent = (index + 1) + ' / ' + pages.length;
      page.appendChild(number);
    });
  }

  function buildPdfPages(report, likedSongs, okSongs, stopSongs, artistTitle, artistDetails) {
    var pageHeight = 1123;
    var pagePadding = 28;
    var contentLimit = pageHeight - pagePadding * 2 - 12;
    var current = createPdfPage(report);

    function currentHeight() {
      return Math.ceil(current.content.scrollHeight);
    }

    function newPage() {
      current = createPdfPage(report);
      return current;
    }

    function appendEmptyGroup(title, subtitle, type) {
      var group = appendPdfGroupShell(current.content, title, subtitle, 0, type, false);
      group.grid.outerHTML = '<div class="vr-pdf__empty">Пока нет песен в этой группе</div>';
      if (currentHeight() > contentLimit && current.content.children.length > 1) {
        group.section.remove();
        newPage();
        group = appendPdfGroupShell(current.content, title, subtitle, 0, type, false);
        group.grid.outerHTML = '<div class="vr-pdf__empty">Пока нет песен в этой группе</div>';
      }
    }

    function appendGroup(title, subtitle, songs, type) {
      if (!songs.length) {
        appendEmptyGroup(title, subtitle, type);
        return;
      }

      var group = appendPdfGroupShell(current.content, title, subtitle, songs.length, type, false);
      if (currentHeight() > contentLimit && current.content.children.length > 1) {
        group.section.remove();
        newPage();
        group = appendPdfGroupShell(current.content, title, subtitle, songs.length, type, false);
      }

      for (var index = 0; index < songs.length; index += 4) {
        var row = songs.slice(index, index + 4);
        var inserted = [];

        row.forEach(function (song, rowIndex) {
          group.grid.insertAdjacentHTML('beforeend', pdfSongCard(song, index + rowIndex));
          inserted.push(group.grid.lastElementChild);
        });

        if (currentHeight() > contentLimit) {
          inserted.reverse().forEach(function (node) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
          });

          if (!group.grid.children.length) {
            group.section.remove();
          }

          newPage();
          group = appendPdfGroupShell(current.content, title, subtitle, songs.length, type, index > 0);
          row.forEach(function (song, rowIndex) {
            group.grid.insertAdjacentHTML('beforeend', pdfSongCard(song, index + rowIndex));
          });
        }
      }
    }

    appendPdfHero(current.content, artistTitle, artistDetails, likedSongs.length, okSongs.length, stopSongs.length);
    appendGroup('Любимые песни', 'Зелёный список', likedSongs, 'like');
    appendGroup('Окей / можно петь', 'Нейтральный список', okSongs, 'ok');
    appendGroup('Стоп-лист', 'Красный список', stopSongs, 'stop');

    var footer = document.createElement('p');
    footer.className = 'vr-pdf__footer';
    footer.innerHTML = '<b>PDF сформирован на сайте vladislovex.ru.</b> Пришлите его Владиславу в Telegram, чтобы артист учёл любимые песни и стоп-лист при подготовке программы.';
    current.content.appendChild(footer);

    if (currentHeight() > contentLimit && current.content.children.length > 1) {
      footer.remove();
      newPage();
      current.content.appendChild(footer);
    }

    addPdfPageNumbers(report);
  }

  function isCanvasProbablyBlank(canvas) {
    try {
      var context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return false;
      var w = canvas.width;
      var h = canvas.height;
      var points = [
        [Math.floor(w * 0.08), Math.floor(h * 0.08)],
        [Math.floor(w * 0.50), Math.floor(h * 0.18)],
        [Math.floor(w * 0.50), Math.floor(h * 0.50)],
        [Math.floor(w * 0.18), Math.floor(h * 0.82)],
        [Math.floor(w * 0.86), Math.floor(h * 0.86)]
      ];
      var different = 0;
      var first = null;
      points.forEach(function (point) {
        var pixel = context.getImageData(point[0], point[1], 1, 1).data;
        var key = pixel[0] + ',' + pixel[1] + ',' + pixel[2] + ',' + pixel[3];
        if (first === null) first = key;
        if (key !== first) different += 1;
      });
      return different === 0;
    } catch (error) {
      return false;
    }
  }

  function getJsPdfConstructor() {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (window.jsPDF) return window.jsPDF;
    return null;
  }

  function loadExternalScript(src, isReady) {
    if (typeof isReady === 'function' && isReady()) return Promise.resolve(true);

    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-vocava-src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(true); }, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-vocava-src', src);
      script.onload = function () { resolve(true); };
      script.onerror = function () { reject(new Error('Не удалось загрузить PDF-библиотеку')); };
      document.head.appendChild(script);
    });
  }

  async function ensurePdfLibraries() {
    if (window.html2canvas && getJsPdfConstructor()) return true;

    if (!pdfLibraryPromise) {
      pdfLibraryPromise = Promise.all([
        loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', function () { return !!window.html2canvas; }),
        loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', function () { return !!getJsPdfConstructor(); })
      ]).then(function () {
        if (!window.html2canvas || !getJsPdfConstructor()) throw new Error('PDF-библиотеки не готовы');
        return true;
      }).catch(function (error) {
        pdfLibraryPromise = null;
        throw error;
      });
    }

    return pdfLibraryPromise;
  }

  async function waitForPdfLibraries() {
    try {
      await ensurePdfLibraries();
      return !!(window.html2canvas && getJsPdfConstructor());
    } catch (error) {
      return false;
    }
  }


  function getPdfRenderScale(pagesCount) {
    var width = Math.min(window.innerWidth || 1440, window.screen && window.screen.width || 1440);
    var memory = Number(navigator.deviceMemory || 4);
    var count = Math.max(1, Number(pagesCount || 1));
    var base = 2.9;

    /*
      html2canvas renders on the main browser thread. Full 300 DPI on every phone
      can freeze the loader, so the scale is adaptive: still sharp for print,
      but much less likely to block the interface for several seconds at once.
    */
    if (memory <= 2) base = 2.15;
    else if (width <= 480) base = 2.35;
    else if (width <= 820) base = 2.55;

    if (count >= 12) base = Math.min(base, 2.25);
    else if (count >= 7) base = Math.min(base, 2.4);

    return base;
  }

  function shufflePdfProgressPhrases(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function pdfSleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms || 0); });
  }

  function pdfWaitForPaint() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function canvasToDataUrlAsync(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      if (!canvas) {
        reject(new Error('empty canvas'));
        return;
      }

      if (!canvas.toBlob || !window.FileReader) {
        try {
          resolve(canvas.toDataURL(type, quality));
        } catch (error) {
          reject(error);
        }
        return;
      }

      canvas.toBlob(function (blob) {
        if (!blob) {
          try {
            resolve(canvas.toDataURL(type, quality));
          } catch (error) {
            reject(error);
          }
          return;
        }

        var reader = new FileReader();
        reader.onloadend = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, type, quality);
    });
  }

  function showPdfProgress(report) {
    var firstPage = report && report.querySelector('.vr-pdf__page');
    var phrases = shufflePdfProgressPhrases([
      'Загружаю репертуар мечты',
      'У вас шикарный выбор',
      'Это будет лучшее выступление',
      'Самое время помедитировать',
      'Собираю песни в красивый порядок',
      'Проверяю любимые треки',
      'Готовлю музыкальную магию',
      'Упаковываю настроение в PDF',
      'Сверяю стоп-лист без суеты',
      'Навожу красоту на страницы',
      'Собираю идеальный вечер',
      'Песни уже почти на сцене',
      'Делаю файл удобным для артиста',
      'Ваш праздник становится ближе',
      'Подбираю вайб для выступления',
      'Сохраняю ваши музыкальные желания',
      'Добавляю чуть-чуть волшебства',
      'Пусть гости поют вместе с вами',
      'Готовлю список для сильного выступления',
      'Скоро всё будет готово'
    ]);

    function startPdfPhraseRotation(target, list) {
      var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var items = list && list.length ? list.slice() : ['Собираю PDF'];
      var index = 0;
      var stopped = false;
      var timer = 0;
      var transitionTimer = 0;

      function setPhrase(value) {
        if (!target) return;
        target.textContent = value;
      }

      function schedule() {
        if (stopped) return;
        timer = setTimeout(next, reducedMotion ? 2600 : 1750);
      }

      function next() {
        if (stopped || !target) return;
        if (reducedMotion) {
          index = (index + 1) % items.length;
          setPhrase(items[index]);
          schedule();
          return;
        }

        target.classList.add('is-leaving');
        transitionTimer = setTimeout(function () {
          if (stopped || !target) return;
          index = (index + 1) % items.length;
          setPhrase(items[index]);
          target.classList.remove('is-leaving');
          target.classList.add('is-entering');
          transitionTimer = setTimeout(function () {
            if (target) target.classList.remove('is-entering');
            schedule();
          }, 360);
        }, 260);
      }

      setPhrase(items[0]);
      schedule();

      return {
        stop: function () {
          stopped = true;
          if (timer) clearTimeout(timer);
          if (transitionTimer) clearTimeout(transitionTimer);
        }
      };
    }

    var overlay = document.createElement('div');
    overlay.className = 'vr-pdf-progress';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = '' +
      '<style>' +
        '.vr-pdf-progress,.vr-pdf-progress *{box-sizing:border-box;}' +
        '.vr-pdf-progress{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at 50% 18%,rgba(246,138,31,.08),transparent 34%),rgba(0,0,0,.46);backdrop-filter:blur(16px) saturate(.82);-webkit-backdrop-filter:blur(16px) saturate(.82);color:#fff;font-family:Montserrat,Arial,sans-serif;}' +
        '.vr-pdf-progress__card{width:min(430px,calc(100vw - 28px));padding:18px;border:1px solid rgba(255,189,109,.24);border-radius:28px;background:radial-gradient(circle at 90% 0%,rgba(246,138,31,.18),transparent 36%),linear-gradient(145deg,rgba(26,25,23,.96),rgba(6,6,6,.96));box-shadow:0 22px 70px rgba(0,0,0,.56);overflow:hidden;}' +
        '.vr-pdf-progress__preview{position:relative;width:100%;height:248px;margin:0 0 14px;border:1px solid rgba(255,255,255,.10);border-radius:22px;background:#050505;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);overflow:hidden;}' +
        '.vr-pdf-progress__preview .vr-pdf__page{position:absolute!important;left:50%!important;top:0!important;margin:0!important;transform:translateX(-50%) scale(.47)!important;transform-origin:top center!important;}' +
        '.vr-pdf-progress__shine{position:absolute;inset:0;background:linear-gradient(110deg,transparent 0%,rgba(255,189,109,.14) 42%,rgba(255,255,255,.10) 50%,transparent 62%);transform:translateX(-120%) translateZ(0);animation:vrPdfProgressShine 1.5s ease-in-out infinite;will-change:transform,opacity;pointer-events:none;}' +
        '.vr-pdf-progress__title{margin:0 0 8px;font-size:20px;line-height:1.1;font-weight:900;letter-spacing:-.03em;}' +
        '.vr-pdf-progress__text{min-height:22px;margin:0 0 14px;color:rgba(255,255,255,.72);font-size:13px;line-height:1.38;font-weight:600;overflow:hidden;}' +
        '.vr-pdf-progress__phrase{display:block;min-height:19px;transform:translateY(0);opacity:1;transition:opacity .26s ease,transform .26s ease;will-change:opacity,transform;}' +
        '.vr-pdf-progress__phrase.is-leaving{opacity:0;transform:translateY(-6px);}' +
        '.vr-pdf-progress__phrase.is-entering{animation:vrPdfPhraseIn .36s cubic-bezier(.22,1,.36,1) both;}' +
        '.vr-pdf-progress__bar{height:7px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;}' +
        '.vr-pdf-progress__bar i{display:block;width:4%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#ffbd6d,#f68a1f);transition:width .18s ease;}' +
        '.vr-pdf-progress__small{margin:10px 0 0;color:rgba(255,255,255,.44);font-size:11px;line-height:1.3;font-weight:600;}' +
        '@keyframes vrPdfProgressShine{0%{transform:translateX(-120%) translateZ(0);opacity:0;}18%{opacity:1;}64%,100%{transform:translateX(120%) translateZ(0);opacity:0;}}' +
        '@keyframes vrPdfPhraseIn{from{opacity:0;transform:translateY(7px);}to{opacity:1;transform:translateY(0);}}' +
        '@media (max-width:720px){.vr-pdf-progress{padding:12px;}.vr-pdf-progress__card{width:min(430px,calc(100vw - 24px));padding:16px;border-radius:26px;}.vr-pdf-progress__preview{height:236px;border-radius:20px;}.vr-pdf-progress__preview .vr-pdf__page{transform:translateX(-50%) scale(.42)!important;}}' +
        '@media (max-width:390px){.vr-pdf-progress__preview{height:224px;}.vr-pdf-progress__preview .vr-pdf__page{transform:translateX(-50%) scale(.40)!important;}}' +
        '@media (prefers-reduced-motion:reduce){.vr-pdf-progress__shine,.vr-pdf-progress__phrase{animation:none;transition:none;}}' +
      '</style>' +
      '<div class="vr-pdf-progress__card">' +
        '<div class="vr-pdf-progress__preview"><div class="vr-pdf-progress__preview-page"></div><i class="vr-pdf-progress__shine"></i></div>' +
        '<h3 class="vr-pdf-progress__title">Собираю PDF</h3>' +
        '<p class="vr-pdf-progress__text"><span class="vr-pdf-progress__phrase"></span></p>' +
        '<div class="vr-pdf-progress__bar" aria-hidden="true"><i></i></div>' +
        '<p class="vr-pdf-progress__small">Подготовка макета...</p>' +
      '</div>';

    var previewTarget = overlay.querySelector('.vr-pdf-progress__preview-page');
    if (firstPage && previewTarget) {
      previewTarget.appendChild(firstPage.cloneNode(true));
    }

    overlay._vrPreviousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);

    return {
      root: overlay,
      bar: overlay.querySelector('.vr-pdf-progress__bar i'),
      small: overlay.querySelector('.vr-pdf-progress__small'),
      phraseAnimation: startPdfPhraseRotation(overlay.querySelector('.vr-pdf-progress__phrase'), phrases),
      previousBodyOverflow: overlay._vrPreviousBodyOverflow || ''
    };
  }

  function setPdfProgressPreview(progress, report) {
    if (!progress || !progress.root || !report) return;
    var previewTarget = progress.root.querySelector('.vr-pdf-progress__preview-page');
    var firstPage = report.querySelector('.vr-pdf__page');
    if (!previewTarget || !firstPage) return;
    previewTarget.innerHTML = '';
    previewTarget.appendChild(firstPage.cloneNode(true));
  }

  function updatePdfProgress(progress, current, total, label) {
    if (!progress) return;
    var safeTotal = Math.max(1, total || 1);
    var safeCurrent = Math.max(0, Math.min(safeTotal, current || 0));
    var percent = Math.max(4, Math.round(safeCurrent / safeTotal * 100));
    if (progress.bar) progress.bar.style.width = percent + '%';
    if (progress.small) progress.small.textContent = label || ('Страница ' + safeCurrent + ' из ' + safeTotal);
  }

  function hidePdfProgress(progress) {
    if (!progress || !progress.root) return;
    if (progress.phraseAnimation && typeof progress.phraseAnimation.stop === 'function') progress.phraseAnimation.stop();
    document.body.style.overflow = progress.previousBodyOverflow || '';
    if (progress.root.parentNode) progress.root.parentNode.removeChild(progress.root);
  }

  function throwIfPdfCancelled(job) {
    if (job && job.cancelled) {
      var error = new Error('PDF_CANCELLED');
      error.isPdfCancelled = true;
      throw error;
    }
  }

  function cancelActivePdfJob() {
    var job = activePdfJob;
    if (!job || job.finished) return;
    job.cancelled = true;
    hidePdfProgress(job.progress);
    if (job.report && job.report.parentNode) job.report.parentNode.removeChild(job.report);
    if (pdfButton) {
      pdfButton.disabled = false;
      pdfButton.textContent = job.originalPdfButtonText || 'Скачать PDF';
    }
    activePdfJob = null;
  }

  window.addEventListener('popstate', function () {
    if (!activePdfJob || activePdfJob.finished) return;
    cancelActivePdfJob();
  });

  window.addEventListener('pagehide', function () {
    if (activePdfJob && !activePdfJob.finished) activePdfJob.cancelled = true;
  });

  async function savePdfReport(report, filename, onProgress, job) {
    var pages = Array.prototype.slice.call(report.querySelectorAll('.vr-pdf__page'));
    throwIfPdfCancelled(job);
    var hasManualLibraries = await waitForPdfLibraries();
    var JsPDF = getJsPdfConstructor();

    if (hasManualLibraries && JsPDF) {
      var previousScrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
      var previousScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var previousHtmlScroll = document.documentElement.style.scrollBehavior;
      var previousBodyOverflow = document.body.style.overflow;

      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);

      await new Promise(function (resolve) {
        requestAnimationFrame(function () {
          requestAnimationFrame(resolve);
        });
      });
      throwIfPdfCancelled(job);

      var renderScale = getPdfRenderScale(pages.length);
      var memory = Number(navigator.deviceMemory || 4);
      var usePng = pages.length <= 3 && memory >= 6 && renderScale >= 2.7;
      var imageType = usePng ? 'image/png' : 'image/jpeg';
      var imageFormat = usePng ? 'PNG' : 'JPEG';
      var imageQuality = usePng ? undefined : 0.96;
      var pdf = new JsPDF({ unit: 'px', format: [794, 1123], orientation: 'portrait', compress: true, precision: 12 });

      try {
        for (var index = 0; index < pages.length; index += 1) {
          throwIfPdfCancelled(job);
          if (typeof onProgress === 'function') onProgress(index, pages.length, 'Рендерю страницу ' + (index + 1) + ' из ' + pages.length);
          await pdfWaitForPaint();
          await pdfSleep(index === 0 ? 320 : 110);
          throwIfPdfCancelled(job);
          var page = pages[index];
          page.style.position = 'relative';
          page.style.left = '0';
          page.style.top = '0';
          page.style.transform = 'none';
          page.style.opacity = '1';
          page.style.visibility = 'visible';

          var canvas = await window.html2canvas(page, {
            scale: renderScale,
            backgroundColor: '#050505',
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: 794,
            height: 1123,
            windowWidth: 794,
            windowHeight: 1123,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            removeContainer: true
          });

          if (!canvas || !canvas.width || !canvas.height || isCanvasProbablyBlank(canvas)) {
            throw new Error('blank canvas');
          }
          throwIfPdfCancelled(job);

          var imgData = await canvasToDataUrlAsync(canvas, imageType, imageQuality);
          throwIfPdfCancelled(job);
          if (index > 0) pdf.addPage([794, 1123], 'portrait');
          pdf.addImage(imgData, imageFormat, 0, 0, 794, 1123);

          /* Free memory after each high-resolution page. This is important on phones. */
          canvas.width = 1;
          canvas.height = 1;
          canvas = null;
          imgData = null;

          if (typeof onProgress === 'function') onProgress(index + 1, pages.length, 'Рендерю страницу ' + (index + 1) + ' из ' + pages.length);
          await pdfWaitForPaint();
          await pdfSleep(120);
        }

        throwIfPdfCancelled(job);
        pdf.save(filename);
      } finally {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.scrollBehavior = previousHtmlScroll;
        window.scrollTo(previousScrollX, previousScrollY);
      }
      return;
    }

    throw new Error('PDF-библиотеки не загрузились');
  }

  async function downloadPdf() {
    if (!data.songs.length) {
      alert('Пока нет песен для PDF.');
      return;
    }
    var originalPdfButtonText = pdfButton ? pdfButton.textContent : '';
    if (pdfButton) {
      pdfButton.disabled = true;
      pdfButton.textContent = 'Готовлю PDF...';
    }

    var report = null;
    var pdfProgress = null;
    var pdfJob = null;

    try {
      pdfJob = { cancelled: false, finished: false, progress: null, report: null, originalPdfButtonText: originalPdfButtonText };
      activePdfJob = pdfJob;
      try {
        if (window.history && window.history.pushState) {
          window.history.pushState({ vocavaPdfLoading: Date.now() }, '', window.location.href);
          pdfJob.historyGuarded = true;
        }
      } catch (historyError) {}

      pdfProgress = showPdfProgress(null);
      pdfJob.progress = pdfProgress;
      updatePdfProgress(pdfProgress, 0, 1, (window.html2canvas && getJsPdfConstructor()) ? 'Готовлю макет...' : 'Загружаю PDF-модуль...');

      await new Promise(function (resolve) {
        requestAnimationFrame(resolve);
      });

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      var likedSongs = songsByChoice('like');
      var okSongs = songsByChoice('ok');
      var stopSongs = songsByChoice('stop');
      var totalSongs = data.songs.length;
      var artistTitle = data.artist.name || 'Музыкант';
      var artistDetails = [data.artist.category, data.artist.format, totalSongs ? totalSongs + ' ' + pluralSongs(totalSongs) : 'репертуар'].filter(Boolean).join(' · ');
      var filename = 'vocava-repertoire-' + (artistId || 'artist') + '.pdf';

      report = createPdfReport();
      if (pdfJob) pdfJob.report = report;
      buildPdfPages(report, likedSongs, okSongs, stopSongs, artistTitle, artistDetails);
      setPdfProgressPreview(pdfProgress, report);
      var pdfPageCount = report.querySelectorAll('.vr-pdf__page').length;
      updatePdfProgress(pdfProgress, 0, pdfPageCount, 'Рендерю страницу 1 из ' + pdfPageCount);

      await pdfWaitForPaint();
      await pdfSleep(520);
      throwIfPdfCancelled(pdfJob);

      await savePdfReport(report, filename, function (current, total, label) {
        updatePdfProgress(pdfProgress, current, total, label);
      }, pdfJob);
    } catch (error) {
      if (!error || !error.isPdfCancelled) {
        alert('Не удалось сформировать PDF. Попробуйте ещё раз.');
      }
    } finally {
      if (pdfJob) pdfJob.finished = true;
      if (activePdfJob === pdfJob) activePdfJob = null;
      hidePdfProgress(pdfProgress);
      if (report && report.parentNode) report.parentNode.removeChild(report);
      if (pdfButton) {
        pdfButton.disabled = false;
        pdfButton.textContent = originalPdfButtonText || 'Скачать PDF';
      }
    }
  }


  async function preloadArtistList(required) {
    if (artists.length) return true;

    var listResponse = null;
    try {
      listResponse = await jsonp('publicList');
    } catch (error) {
      if (required) throw error;
      return false;
    }

    if (!listResponse || !listResponse.ok) {
      if (required) throw new Error((listResponse && listResponse.error) || 'не удалось получить артистов');
      return false;
    }

    artists = (listResponse.rows || []).filter(function (artist) {
      return (artist.id || artist.name) && yes(artist.active);
    });
    saveStoredArtistMap(artists);

    if (!artistId) {
      artistId = artists[0] && artists[0].id ? artists[0].id : '';
      if (!artistId) {
        setState('В базе пока нет активных музыкантов.', true);
        return false;
      }
      updateUrlArtist(artistId);
    }

    renderArtistPicker();
    if (artistSelect) artistSelect.value = artistId || '';
    syncArtistDropdown();

    var headingName = getArtistLabel(artistId);
    setArtistHeadingName(headingName || artistNamePreset);

    return true;
  }

  async function load() {
    if (!apiUrl || /PASTE_APPS_SCRIPT/i.test(apiUrl)) {
      setState('Вставьте Web App URL в data-api-url.', true);
      return;
    }
    try {
      if (!artistId) {
        setState('Загрузка списка музыкантов...', false, true);
        var hasRequiredArtists = await preloadArtistList(true);
        if (!hasRequiredArtists) return;
      } else {
        setState('Загрузка списка музыкантов...', false, true);
        await preloadArtistList(false);
      }

      setState('Загрузка репертуара...', false, true);
      var response = await jsonp('publicRepertoire', { artist_id: artistId });
      if (!response || !response.ok) throw new Error((response && response.error) || 'ошибка ответа');
      data = response.data || { artist: {}, songs: [] };
      choices = loadStoredChoices();
      hydrateSongFilterAliases();
      setArtistHeadingName(data.artist.name || getArtistLabel(artistId) || artistNamePreset, { instant: true });
      updateArtistCardLink();
      artistMeta.textContent = [data.artist.category, data.artist.format, data.songs.length ? data.songs.length + ' песен' : 'репертуар пока пуст'].filter(Boolean).join(' · ');
      renderSongs();
      startSearchHintAnimation();
    } catch (error) {
      setState('Не удалось загрузить репертуар: ' + error.message, true);
    }
  }

  list.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-choice]');
    var row = event.target.closest('.vr-song');
    if (!row) return;
    var id = row.getAttribute('data-id');
    var currentChoice = choices[id] || 'ok';
    var requestedChoice = button ? button.getAttribute('data-choice') : (currentChoice === 'stop' ? 'ok' : 'like');
    var choice = requestedChoice === 'ok' ? 'ok' : (currentChoice === requestedChoice ? 'ok' : requestedChoice);
    if (choice === 'ok') delete choices[id];
    else choices[id] = choice;
    saveStoredChoices();
    hapticFeedback(choice);

    if (shouldRenderAfterChoice(currentChoice, choice)) {
      renderSongs();
      return;
    }

    animateSongChoice(row, choice, event);
    updateSummary(getVisibleSongs().length);
    renderToolbar();
  });

  list.addEventListener('pointerdown', function (event) {
    var row = event.target.closest('.vr-song');
    if (!row) return;
    row.classList.add('is-pressing');
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
    list.addEventListener(type, function (event) {
      var row = event.target.closest('.vr-song');
      if (row) row.classList.remove('is-pressing');
    });
  });

  search.addEventListener('input', applySearch);
  infoButton.addEventListener('click', openGuide);
  guide.addEventListener('click', function (event) {
    if (event.target.closest('[data-guide-close]')) closeGuide();
  });
  guideStack.addEventListener('scroll', function () {
    if (guide.hidden || guideScrollRaf) return;
    guideScrollRaf = requestAnimationFrame(updateGuideFromScroll);
  }, { passive: true });
  guideStack.addEventListener('touchstart', function (event) {
    if (guide.hidden || !event.touches || !event.touches.length) return;
    guideTouchStartX = event.touches[0].clientX;
    guideTouchStartY = event.touches[0].clientY;
    guideTouchStartedOnLast = guideStep === guideSteps.length - 1;
  }, { passive: true });
  guideStack.addEventListener('touchend', function (event) {
    if (guide.hidden || !guideTouchStartX || !event.changedTouches || !event.changedTouches.length) return;
    var touch = event.changedTouches[0];
    var dx = touch.clientX - guideTouchStartX;
    var dy = touch.clientY - guideTouchStartY;
    if (guideTouchStartedOnLast && dx < -46 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      closeGuide();
    }
    guideTouchStartX = 0;
    guideTouchStartY = 0;
    guideTouchStartedOnLast = false;
  }, { passive: true });
  document.addEventListener('keydown', function (event) {
    if (guide.hidden) return;
    if (event.key === 'Escape') closeGuide();
    if (event.key === 'ArrowRight') moveGuide(1);
    if (event.key === 'ArrowLeft') moveGuide(-1);
  });
  window.addEventListener('scroll', updateStickyToolbar, { passive: true });
  window.addEventListener('resize', updateStickyToolbar);
  pdfButton.addEventListener('click', downloadPdf);
  if (artistCardLink) {
    artistCardLink.addEventListener('click', function (event) {
      if (artistId) return;
      event.preventDefault();
      setState('Сначала выберите музыканта.', true);
    });
  }
  filterButton.addEventListener('click', function () {
    filterWrap.classList.toggle('is-open');
    sortWrap.classList.remove('is-open');
    renderToolbar();
  });
  filterReset.addEventListener('click', function () {
    resetFilters();
    filterWrap.classList.remove('is-open');
    renderSongs();
  });
  filterOptions.addEventListener('click', function (event) {
    var groupButton = event.target.closest('[data-filter-group]');
    if (groupButton) {
      var group = groupButton.getAttribute('data-filter-group');
      openFilterGroups[group] = !openFilterGroups[group];
      renderToolbar();
      return;
    }

    var button = event.target.closest('[data-filter-field]');
    if (!button) return;
    var field = button.getAttribute('data-filter-field');
    var value = button.getAttribute('data-filter-value') || 'all';
    var selected = currentFilters[field] || [];
    var index = selected.indexOf(value);
    if (index === -1) selected.push(value);
    else selected.splice(index, 1);
    currentFilters[field] = selected;
    renderSongs();
  });
  favoritesToggle.addEventListener('click', function () {
    favoritesOnly = !favoritesOnly;
    if (favoritesOnly) stopOnly = false;
    renderSongs();
  });
  stopToggle.addEventListener('click', function () {
    stopOnly = !stopOnly;
    if (stopOnly) favoritesOnly = false;
    renderSongs();
  });
  sortText.addEventListener('click', function () {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    renderSongs();
  });
  sortButton.addEventListener('click', function () {
    sortWrap.classList.toggle('is-open');
    filterWrap.classList.remove('is-open');
    renderToolbar();
  });
  sortWrap.addEventListener('click', function (event) {
    var button = event.target.closest('[data-sort]');
    if (!button) return;
    setSortMode(button.getAttribute('data-sort') || 'title');
    sortWrap.classList.remove('is-open');
    renderSongs();
  });
  document.addEventListener('click', function (event) {
    if (!root.contains(event.target)) return;
    if (!event.target.closest('#vrFilter')) filterWrap.classList.remove('is-open');
    if (!event.target.closest('#vrSort')) sortWrap.classList.remove('is-open');
    if (artistDropdown && !event.target.closest('#vrArtistDropdown')) {
      artistDropdown.classList.remove('is-open');
      if (artistDropdownButton) artistDropdownButton.setAttribute('aria-expanded', 'false');
    }
    renderToolbar();
  });
  if (artistDropdownButton && artistDropdown) {
    artistDropdownButton.addEventListener('click', function () {
      var isOpen = artistDropdown.classList.toggle('is-open');
      artistDropdownButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        filterWrap.classList.remove('is-open');
        sortWrap.classList.remove('is-open');
      }
    });
  }
  if (artistDropdownMenu && artistSelect) {
    artistDropdownMenu.addEventListener('click', function (event) {
      var button = event.target.closest('[data-artist-id]');
      if (!button) return;
      artistSelect.value = button.getAttribute('data-artist-id') || '';
      if (artistDropdown) artistDropdown.classList.remove('is-open');
      if (artistDropdownButton) artistDropdownButton.setAttribute('aria-expanded', 'false');
      artistSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  if (artistSelect) {
    artistSelect.addEventListener('change', function () {
      artistId = artistSelect.value || '';
      syncArtistDropdown();
      setArtistHeadingName(getArtistLabel(artistId), { animate: true });
      if (artistDropdown) artistDropdown.classList.remove('is-open');
      if (artistDropdownButton) artistDropdownButton.setAttribute('aria-expanded', 'false');
      choices = {};
      data = { artist: {}, songs: [] };
      resetFilters();
      sortMode = 'title';
      sortDir = 'asc';
      favoritesOnly = false;
      stopOnly = false;
      list.innerHTML = '';
      updateUrlArtist(artistId);
      if (artistId) load();
      else setState('Выберите музыканта из списка.', true);
    });
  }
  try {
    if (!localStorage.getItem(guideSeenKey)) {
      infoButton.classList.add('is-attention');
    }
  } catch (e) {
    infoButton.classList.add('is-attention');
  }
  updateArtistCardLink();
  updateStickyToolbar();
  load();
  return true;
  }

  function bootVocavaRepertoire() {
    if (initVocavaRepertoire()) return;
    setTimeout(initVocavaRepertoire, 300);
    setTimeout(initVocavaRepertoire, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootVocavaRepertoire, { once: true });
  } else {
    bootVocavaRepertoire();
  }
})();
