(function () {
  var root = document.getElementById('artists');
  if (!root) return;

  var repertoireBaseUrl = (root.getAttribute('data-repertoire-url') || 'https://vladislovex.ru/repertoire').trim();

  var grid = document.getElementById('vhArtistsGrid') || root.querySelector('.vh-artists-page__grid');
  var sortDropdown = document.getElementById('vhSortDropdown');
  var sortDropdownBtn = document.getElementById('vhSortDropdownBtn');
  var sortDropdownMenu = document.getElementById('vhSortDropdownMenu');
  var favoritesOnlyFilter = document.getElementById('vhFavoritesOnlyFilter');
  var mobileFilter = document.getElementById('vhMobileFilter');
  var mobileFilterBtn = document.getElementById('vhMobileFilterBtn');
  var mobileFilterCount = document.getElementById('vhMobileFilterCount');
  var mobileFilterMenu = document.getElementById('vhMobileFilterMenu');
  var mobileFilterReset = document.getElementById('vhMobileFilterReset');
  var mobileRoleMenu = document.getElementById('vhMobileRoleMenu');
  var mobileGenderMenu = document.getElementById('vhMobileGenderMenu');
  var mobileRoleCurrent = document.getElementById('vhMobileRoleCurrent');
  var mobileGenderCurrent = document.getElementById('vhMobileGenderCurrent');

  var favoritesPanel = document.getElementById('vhFavoritesPanel');
  var favoritesCount = document.getElementById('vhFavoritesCount');
  var favoritesPdf = document.getElementById('vhFavoritesPdf');
  var favoritesReset = document.getElementById('vhFavoritesReset');

  var modal = document.getElementById('vhArtistModal');
  var modalMedia = document.getElementById('vhArtistModalMedia');
  var modalPhotos = document.getElementById('vhArtistModalPhotos');
  var modalType = document.getElementById('vhArtistModalType');
  var modalName = document.getElementById('vhArtistModalName');
  var modalAbout = document.getElementById('vhArtistModalAbout');
  var modalAgeCard = document.getElementById('vhArtistModalAgeCard');
  var modalAge = document.getElementById('vhArtistModalAge');
  var modalRepertoire = document.getElementById('vhArtistModalRepertoire');
  var modalRepertoireInline = document.getElementById('vhArtistModalRepertoireInline');
  var modalRepertoireDescriptionCard = document.getElementById('vhArtistModalRepertoireDescriptionCard');
  var modalRepertoireDescription = document.getElementById('vhArtistModalRepertoireDescription');

  var photoViewer = document.getElementById('vhPhotoViewer');
  var photoViewerImage = document.getElementById('vhPhotoViewerImage');
  var photoViewerName = document.getElementById('vhPhotoViewerName');
  var photoViewerCounter = document.getElementById('vhPhotoViewerCounter');
  var photoViewerThumbs = document.getElementById('vhPhotoViewerThumbs');
  var photoPrev = document.getElementById('vhPhotoPrev');
  var photoNext = document.getElementById('vhPhotoNext');

  var storageKey = 'vh_favorite_artists_v2';

  var allArtists = [];
  var cards = [];
  var currentRoleFilters = [];
  var currentArtistFilters = [];
  var currentGenderFilters = [];
  var currentSort = 'recommended';
  var favoritesOnly = false;
  var currentPhotoCard = null;
  var currentPhotoIndex = 0;
  var openLayers = 0;
  var pendingOpenArtistId = '';
  var isPdfGenerating = false;

  var ROLE_ORDER = ['guitar-vocal', 'piano-vocal', 'vocalist', 'guitarist', 'cajon'];
  var ROLE_LABELS = {
    'all': 'Все',
    'guitar-vocal': 'Гитарист-вокалист',
    'piano-vocal': 'Пианист-вокалист',
    'vocalist': 'Вокалист',
    'guitarist': 'Гитарист',
    'cajon': 'Кахонист'
  };

  var SORT_LABELS = {
    recommended: 'Рекомендуемые',
    name: 'По имени',
    category: 'По типу музыканта',
    shuffle: 'Перемешано'
  };

  var ROLE_PRIORITY = {
    'guitar-vocal': 10,
    'piano-vocal': 20,
    'vocalist': 30,
    'guitarist': 40,
    'cajon': 50
  };

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char];
    });
  }

  function yes(value) {
    return /^(true|1|yes|да|актив|on)$/i.test(String(value || '').trim());
  }

  function slug(text) {
    var map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ы':'y','э':'e','ю':'yu','я':'ya','ь':'','ъ':''};
    return String(text || '')
      .toLowerCase()
      .split('')
      .map(function (ch) { return map[ch] == null ? ch : map[ch]; })
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizeRole(artist) {
    var raw = String(artist.category_slug || '').trim();
    var category = String(artist.category || '').toLowerCase();

    if (raw) {
      raw = slug(raw);
    } else {
      raw = slug(category);
    }

    var haystack = (raw + ' ' + category).toLowerCase();

    if (/guitar-vocal|gitarist-vokal|гитарист.?вокал|гитара.*вокал/.test(haystack)) return 'guitar-vocal';
    if (/piano-vocal|pianist-vokal|пианист.?вокал|клавиш.*вокал|фортепиано.*вокал/.test(haystack)) return 'piano-vocal';
    if (/cajon|kahon|кахон|перкус/.test(haystack)) return 'cajon';
    if (/vocalist|vokalist|вокалист/.test(haystack) && !/guitar|gitar|piano|pian|гитар|пиан|клав/.test(haystack)) return 'vocalist';
    if (/guitarist|gitarist|гитарист|гитара/.test(haystack) && !/vocal|vokal|вокал/.test(haystack)) return 'guitarist';

    return raw || 'other';
  }

  function normalizeGender(value) {
    var text = String(value || '').trim().toLowerCase();

    if (!text) return '';
    if (/^(ж|f|female|woman|жен)/.test(text)) return 'Ж';
    if (/^(м|m|male|man|муж)/.test(text)) return 'М';

    return String(value || '').trim();
  }

  function roleLabel(role, artist) {
    if (ROLE_LABELS[role]) return ROLE_LABELS[role];
    return artist && artist.category ? artist.category : role;
  }

  function normalizeFieldName(key) {
    return String(key || '')
      .trim()
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[\s -]+/g, '_')
      .replace(/[^a-zа-я0-9_]+/g, '');
  }

  function valueByKeys(source, keys) {
    if (!source) return '';

    for (var i = 0; i < keys.length; i++) {
      var direct = source[keys[i]];
      if (direct != null && String(direct).trim()) return String(direct).trim();
    }

    var wanted = keys.map(normalizeFieldName);
    var sourceKeys = Object.keys(source);

    for (var j = 0; j < sourceKeys.length; j++) {
      var key = sourceKeys[j];
      if (wanted.indexOf(normalizeFieldName(key)) !== -1 && String(source[key] || '').trim()) {
        return String(source[key]).trim();
      }
    }

    return '';
  }

  function artistAge(artist) {
    return valueByKeys(artist, ['age', 'Age', 'Возраст', 'возраст', 'Возраст артиста', 'возраст артиста', 'лет', 'Лет', 'years']);
  }

  function formatAge(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    if (/[^0-9\s]/.test(text)) return text;

    var num = parseInt(text, 10);
    if (!num) return text;

    var n = Math.abs(num) % 100;
    var n1 = n % 10;
    var word = 'лет';

    if (n < 11 || n > 19) {
      if (n1 === 1) word = 'год';
      else if (n1 >= 2 && n1 <= 4) word = 'года';
    }

    return num + ' ' + word;
  }

  function artistRepertoireDescription(artist) {
    return valueByKeys(artist, [
      'repertoire_description',
      'repertoire_desc',
      'repertoire_about',
      'repertoire_text',
      'repertoire_info',
      'description_repertoire',
      'repertoire_description_text',
      'repertoireDescription',
      'repertoireDesc',
      'Описание репертуара',
      'описание репертуара',
      'opisanie_repertuara'
    ]);
  }

  function cleanArtist(artist, index) {
    var item = {};
    Object.keys(artist || {}).forEach(function (key) {
      item[key] = String(artist[key] == null ? '' : artist[key]).trim();
    });

    item.id = item.id || slug(item.name) || ('artist-' + index);
    item.sort = Number(item.sort || index + 1) || index + 1;
    item.shuffle = Math.random();
    item.role = normalizeRole(item);
    item.gender = normalizeGender(item.gender);

    if (!item.category_slug) item.category_slug = item.role;
    if (!item.category && ROLE_LABELS[item.role]) item.category = ROLE_LABELS[item.role];

    return item;
  }

  function dedupeArtists(list) {
    var seen = {};
    var result = [];

    list.forEach(function (artist) {
      var key = slug(artist.name || artist.id || '');
      if (!key) key = String(artist.id || '').trim();
      if (!key) return;

      if (seen[key]) {
        var oldIndex = result.indexOf(seen[key]);
        var currentIsActive = yes(artist.active);
        var savedIsActive = yes(seen[key].active);
        if (currentIsActive && !savedIsActive && oldIndex !== -1) {
          result[oldIndex] = artist;
          seen[key] = artist;
        }
        return;
      }

      seen[key] = artist;
      result.push(artist);
    });

    return result;
  }

  function uniqueList(list) {
    var seen = {};
    var result = [];
    (list || []).forEach(function (value) {
      value = String(value || '').trim();
      if (!value || seen[value]) return;
      seen[value] = true;
      result.push(value);
    });
    return result;
  }

  function splitParam(value) {
    return String(value || '')
      .split(',')
      .map(function (item) { return decodeURIComponent(String(item || '').trim()); })
      .filter(Boolean);
  }

  function roleName(role) {
    return ROLE_LABELS[role] || role;
  }

  function selectedFilterText() {
    var parts = [];
    var extraArtistIds = currentArtistFilters.filter(function (id) {
      var artist = getArtistById(id);
      return !artist || currentRoleFilters.indexOf(String(artist.role || '')) === -1;
    });

    if (currentRoleFilters.length) parts.push(currentRoleFilters.map(roleName).join(', '));
    if (extraArtistIds.length) parts.push(extraArtistIds.length + ' ' + getArtistWord(extraArtistIds.length));
    return parts.join(' · ') || 'Все музыканты';
  }

  function artistIdsForRole(role) {
    return allArtists.filter(function (artist) {
      return yes(artist.active) && String(artist.role || '') === String(role || '') && String(artist.id || '').trim();
    }).map(function (artist) {
      return String(artist.id || '');
    });
  }

  function setRoleWithArtists(role, shouldSelect) {
    role = String(role || '');
    if (!role || role === 'all') {
      currentRoleFilters = [];
      currentArtistFilters = [];
      return;
    }

    var roleIds = artistIdsForRole(role);

    if (shouldSelect) {
      if (currentRoleFilters.indexOf(role) === -1) currentRoleFilters.push(role);
      currentArtistFilters = uniqueList(currentArtistFilters.concat(roleIds));
      return;
    }

    currentRoleFilters = currentRoleFilters.filter(function (item) {
      return String(item || '') !== role;
    });
    currentArtistFilters = currentArtistFilters.filter(function (id) {
      return roleIds.indexOf(String(id || '')) === -1;
    });
  }

  function roleSelectionState(role) {
    role = String(role || '');
    var roleIds = artistIdsForRole(role);
    if (!role || !roleIds.length) return 'none';

    if (currentRoleFilters.indexOf(role) !== -1) return 'all';

    var selectedCount = roleIds.filter(function (id) {
      return currentArtistFilters.indexOf(String(id || '')) !== -1;
    }).length;

    if (selectedCount <= 0) return 'none';
    if (selectedCount >= roleIds.length) return 'all';
    return 'mixed';
  }

  function normalizeRoleSelection(role) {
    role = String(role || '');
    var roleIds = artistIdsForRole(role);
    if (!role || !roleIds.length) return;

    var selectedCount = roleIds.filter(function (id) {
      return currentArtistFilters.indexOf(String(id || '')) !== -1;
    }).length;

    currentRoleFilters = currentRoleFilters.filter(function (item) {
      return String(item || '') !== role;
    });

    if (selectedCount <= 0) {
      currentArtistFilters = currentArtistFilters.filter(function (id) {
        return roleIds.indexOf(String(id || '')) === -1;
      });
      return;
    }

    if (selectedCount >= roleIds.length) {
      currentRoleFilters.push(role);
      currentArtistFilters = uniqueList(currentArtistFilters.concat(roleIds));
    }
  }

  function selectedGenderText() {
    if (!currentGenderFilters.length) return 'любой пол';
    return currentGenderFilters.map(function (gender) {
      return gender === 'М' ? 'Парни' : (gender === 'Ж' ? 'Девушки' : gender);
    }).join(', ');
  }

  function syncGenderLegacy() {
    currentGenderFilters = uniqueList((currentGenderFilters || []).map(normalizeGender).filter(function (gender) {
      return gender === 'М' || gender === 'Ж';
    }));
  }

  function pruneArtistFiltersByGender() {
    if (!currentGenderFilters.length || !currentArtistFilters.length) return;
    currentArtistFilters = currentArtistFilters.filter(function (id) {
      var artist = getArtistById(id);
      return artist && currentGenderFilters.indexOf(artist.gender) !== -1;
    });
  }

  function readFiltersFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var role = params.get('role') || params.get('type') || params.get('filter') || '';
      var artist = params.get('artist') || params.get('artists') || '';
      var gender = params.get('gender') || '';
      var sort = params.get('sort') || '';
      var openTarget = params.get('open') || params.get('modal') || '';

      if (/^(artist|card|modal|1|true)$/i.test(String(openTarget || '').trim()) && artist) {
        pendingOpenArtistId = splitParam(artist)[0] || '';
      }

      currentRoleFilters = uniqueList(splitParam(role));
      currentArtistFilters = uniqueList(splitParam(artist));
      currentGenderFilters = uniqueList(splitParam(gender).map(normalizeGender).filter(function (item) { return item === 'М' || item === 'Ж'; }));
      syncGenderLegacy();
      sort = String(sort || '').trim();

      if (SORT_LABELS[sort]) currentSort = sort;
    } catch (e) {}
  }

  function updateUrlWithFilters() {
    try {
      if (!window.history || !window.history.replaceState) return;

      var url = new URL(window.location.href);

      if (currentRoleFilters.length) url.searchParams.set('role', currentRoleFilters.join(','));
      else url.searchParams.delete('role');

      if (currentArtistFilters.length) url.searchParams.set('artist', currentArtistFilters.join(','));
      else url.searchParams.delete('artist');

      if (currentGenderFilters.length) url.searchParams.set('gender', currentGenderFilters.join(','));
      else url.searchParams.delete('gender');

      if (currentSort && currentSort !== 'recommended') url.searchParams.set('sort', currentSort);
      else url.searchParams.delete('sort');

      url.searchParams.delete('type');
      url.searchParams.delete('filter');
      url.searchParams.delete('artists');

      window.history.replaceState(null, '', url.toString());
    } catch (e) {}
  }

  function appliedFilterCount() {
    var count = 0;
    if (currentRoleFilters.length || currentArtistFilters.length) count += 1;
    if (currentGenderFilters.length) count += 1;
    return count;
  }

  function updateMobileFilterCount() {
    if (!mobileFilterCount || !mobileFilterBtn) return;
    var count = appliedFilterCount();
    mobileFilterCount.textContent = String(count);
    mobileFilterCount.hidden = count === 0;
    mobileFilterBtn.classList.toggle('has-active-filters', count > 0);
  }

  function closeMobileFilterSections() {
    if (!mobileFilterMenu) return;
    mobileFilterMenu.querySelectorAll('[data-mobile-filter-section]').forEach(function (button) {
      button.classList.remove('is-open');
    });
    if (mobileRoleMenu) mobileRoleMenu.classList.remove('is-open');
    if (mobileGenderMenu) mobileGenderMenu.classList.remove('is-open');
  }

  function showState(text, isError) {
    if (!grid) return;
    grid.innerHTML = '<div class="vh-artists-page__state' + (isError ? ' is-error' : '') + '">' + esc(text) + '</div>';
    cards = [];
    updateFavoritesUi();
  }

  function getArtistWord(count) {
    var n = Math.abs(Number(count) || 0) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return 'музыкантов';
    if (n1 === 1) return 'музыкант';
    if (n1 >= 2 && n1 <= 4) return 'музыканта';
    return 'музыкантов';
  }

  function getSavedFavorites() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  function getValidFavoriteIds() {
    return getSavedFavorites().filter(function (id) {
      return !!getArtistById(id);
    });
  }

  function saveFavorites(ids) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (e) {}
  }

  function getArtistById(id) {
    return allArtists.find(function (artist) {
      return String(artist.id) === String(id);
    });
  }

  function getFavoriteArtists() {
    var ids = getSavedFavorites();
    return ids.map(getArtistById).filter(Boolean);
  }

  function getFavoriteWord(count) {
    count = Number(count) || 0;
    var mod100 = Math.abs(count) % 100;
    var mod10 = mod100 % 10;

    if (mod100 >= 11 && mod100 <= 14) return count + ' музыкантов';
    if (mod10 === 1) return count + ' музыкант';
    if (mod10 >= 2 && mod10 <= 4) return count + ' музыканта';
    return count + ' музыкантов';
  }

  function getFavoritePhrase(count) {
    count = Number(count) || 0;
    return (count === 1 ? 'Вам понравился ' : 'Вам понравились ') + getFavoriteWord(count);
  }

  function resetFavorites() {
    saveFavorites([]);
    favoritesOnly = false;
    applyView();
  }

  function updateFavoritesUi() {
    var favoriteIds = getValidFavoriteIds();

    if (favoriteIds.length !== getSavedFavorites().length) {
      saveFavorites(favoriteIds);
    }

    if (!favoriteIds.length) favoritesOnly = false;

    if (favoritesOnlyFilter) {
      favoritesOnlyFilter.hidden = favoriteIds.length === 0;
      favoritesOnlyFilter.classList.toggle('is-active', favoritesOnly);
      favoritesOnlyFilter.setAttribute('aria-pressed', favoritesOnly ? 'true' : 'false');
    }

    cards.forEach(function (card) {
      var id = card.getAttribute('data-id');
      var isFavorite = favoriteIds.indexOf(id) !== -1;
      card.classList.toggle('is-favorite', isFavorite);

      var button = card.querySelector('.vh-artist-card__favorite');
      if (button) {
        button.setAttribute('aria-label', isFavorite ? 'Убрать из избранного' : 'Добавить в избранное');
      }
    });

    if (favoritesCount) favoritesCount.textContent = getFavoritePhrase(favoriteIds.length);
    if (favoritesPanel) favoritesPanel.classList.toggle('is-visible', favoriteIds.length > 0);
  }

  function clearFavoritesOnlyIfEmpty() {
    if (getValidFavoriteIds().length) return false;

    if (favoritesOnly) {
      favoritesOnly = false;
      return true;
    }

    return false;
  }

  function toggleFavorite(card) {
    var id = card.getAttribute('data-id');
    if (!id) return;

    var favoriteIds = getSavedFavorites();
    var index = favoriteIds.indexOf(id);

    if (index === -1) favoriteIds.push(id);
    else favoriteIds.splice(index, 1);

    saveFavorites(favoriteIds);

    if (clearFavoritesOnlyIfEmpty()) {
      resetFilters();
      return;
    }

    if (favoritesOnly) applyView();
    else updateFavoritesUi();
  }

  function openRepertoireFromCard(link) {
    var artistId = link.getAttribute('data-repertoire-artist') || '';
    var target = link.getAttribute('href') || repertoireUrl({ id: artistId });

    try {
      var url = new URL(target, window.location.href);
      if (artistId) url.searchParams.set('artist', artistId);
      window.location.href = url.toString();
    } catch (e) {
      var sep = target.indexOf('?') === -1 ? '?' : '&';
      window.location.href = target + sep + 'artist=' + encodeURIComponent(artistId);
    }
  }

  function getFilteredArtists() {
    var favoriteIds = favoritesOnly ? getSavedFavorites().map(String) : [];
    var selectedRoles = currentRoleFilters.map(String);
    var selectedArtists = currentArtistFilters.map(String);

    var list = allArtists.filter(function (artist) {
      var artistId = String(artist.id || '');
      var hasRoleFilters = selectedRoles.length > 0;
      var hasArtistFilters = selectedArtists.length > 0;

      if (!yes(artist.active)) return false;
      if (favoritesOnly && favoriteIds.indexOf(artistId) === -1) return false;

      if (hasRoleFilters || hasArtistFilters) {
        var roleMatched = hasRoleFilters && selectedRoles.indexOf(String(artist.role || '')) !== -1;
        var artistMatched = hasArtistFilters && selectedArtists.indexOf(artistId) !== -1;
        if (!roleMatched && !artistMatched) return false;
      }

      if (currentGenderFilters.length && currentGenderFilters.indexOf(artist.gender) === -1) return false;
      return true;
    });

    return sortArtists(list);
  }

  function sortArtists(list) {
    var result = list.slice();

    result.sort(function (a, b) {
      if (currentSort === 'shuffle') {
        return (a.shuffle || 0) - (b.shuffle || 0);
      }

      if (currentSort === 'name') {
        return String(a.name).localeCompare(String(b.name), 'ru') || a.sort - b.sort;
      }

      if (currentSort === 'category') {
        return (ROLE_PRIORITY[a.role] || 999) - (ROLE_PRIORITY[b.role] || 999) || String(a.name).localeCompare(String(b.name), 'ru');
      }

      return (ROLE_PRIORITY[a.role] || 999) - (ROLE_PRIORITY[b.role] || 999) || a.sort - b.sort || String(a.name).localeCompare(String(b.name), 'ru');
    });

    return result;
  }

  function applyView() {
    var visible = getFilteredArtists();

    renderArtists(visible);
    updateFilterButtons();
    updateUrlWithFilters();
  }

  function optionCountLabel(count) {
    return '<b>' + (Number(count) || 0) + '</b>';
  }

  function closeDropdowns(except) {
    [sortDropdown].forEach(function (dropdown) {
      if (!dropdown || dropdown === except) return;
      dropdown.classList.remove('is-open');
      var btn = dropdown.querySelector('button[aria-expanded]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function toggleDropdown(dropdown, button) {
    if (!dropdown || !button) return;
    var next = !dropdown.classList.contains('is-open');
    closeDropdowns(dropdown);
    closeMobileFilter();
    dropdown.classList.toggle('is-open', next);
    button.setAttribute('aria-expanded', next ? 'true' : 'false');
  }

  function closeMobileFilter() {
    if (!mobileFilter) return;
    mobileFilter.classList.remove('is-open');
    if (mobileFilterBtn) mobileFilterBtn.setAttribute('aria-expanded', 'false');
    closeMobileFilterSections();
  }

  function toggleMobileFilter() {
    if (!mobileFilter || !mobileFilterBtn) return;
    var next = !mobileFilter.classList.contains('is-open');
    closeDropdowns();
    mobileFilter.classList.toggle('is-open', next);
    mobileFilterBtn.setAttribute('aria-expanded', next ? 'true' : 'false');
    closeMobileFilterSections();
  }

  function updateMobileFilterSections(section) {
    if (!mobileFilterMenu) return;

    var opened = false;
    mobileFilterMenu.querySelectorAll('[data-mobile-filter-section]').forEach(function (button) {
      var isTarget = button.getAttribute('data-mobile-filter-section') === section;
      var shouldOpen = isTarget && !button.classList.contains('is-open');
      button.classList.toggle('is-open', shouldOpen);
      if (shouldOpen) opened = true;
    });

    if (mobileRoleMenu) mobileRoleMenu.classList.toggle('is-open', opened && section === 'role');
    if (mobileGenderMenu) mobileGenderMenu.classList.toggle('is-open', opened && section === 'gender');
  }

  function updateFilterButtons() {
    if (sortDropdownMenu) {
      sortDropdownMenu.querySelectorAll('[data-sort]').forEach(function (button) {
        button.classList.toggle('is-active', button.getAttribute('data-sort') === currentSort);
      });
      sortDropdownMenu.querySelectorAll('[data-sort-shuffle]').forEach(function (button) {
        button.classList.toggle('is-active', currentSort === 'shuffle');
      });
    }

    var sortText = sortDropdownBtn ? sortDropdownBtn.querySelector('.vh-sort-dd__text') : null;
    if (sortText) sortText.textContent = SORT_LABELS[currentSort] || SORT_LABELS.recommended;

    if (mobileRoleCurrent) mobileRoleCurrent.textContent = selectedFilterText();

    if (mobileGenderCurrent) {
      mobileGenderCurrent.textContent = currentGenderFilters.length ? selectedGenderText() : 'Любой';
    }

    if (mobileRoleMenu) {
      mobileRoleMenu.querySelectorAll('[data-role-filter]').forEach(function (button) {
        var role = button.getAttribute('data-role-filter') || '';
        var state = roleSelectionState(role);
        var isActive = state === 'all';
        var isMixed = state === 'mixed';
        button.classList.toggle('is-active', isActive);
        button.classList.toggle('is-mixed', isMixed);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        button.setAttribute('data-check-state', isActive ? 'all' : (isMixed ? 'mixed' : 'none'));
      });

      mobileRoleMenu.querySelectorAll('[data-artist-filter]').forEach(function (button) {
        var id = button.getAttribute('data-artist-filter') || '';
        var gender = button.getAttribute('data-artist-gender') || '';
        var group = button.closest('[data-role-group]');
        var role = group ? (group.getAttribute('data-role-group') || '') : '';
        var hiddenByGender = currentGenderFilters.length > 0 && currentGenderFilters.indexOf(gender) === -1;
        var isActive = currentArtistFilters.indexOf(id) !== -1 || currentRoleFilters.indexOf(role) !== -1;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        button.hidden = hiddenByGender;
      });

      mobileRoleMenu.querySelectorAll('[data-role-group]').forEach(function (group) {
        var role = group.getAttribute('data-role-group') || '';
        var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-artist-filter]'));
        var visibleButtons = buttons.filter(function (button) { return !button.hidden; });
        var state = roleSelectionState(role);
        var counter = group.querySelector('.vh-filter-role-select b');
        var roleButton = group.querySelector('[data-role-filter]');
        var shouldShowMixed = state === 'mixed';
        if (counter) counter.textContent = String(visibleButtons.length);
        group.classList.toggle('has-active', state !== 'none');
        group.classList.toggle('is-mixed', shouldShowMixed);
        group.classList.toggle('is-empty-by-gender', currentGenderFilters.length > 0 && visibleButtons.length === 0);
        if (roleButton) {
          roleButton.classList.toggle('is-active', state === 'all');
          roleButton.classList.toggle('is-mixed', shouldShowMixed);
          roleButton.classList.toggle('has-selected-part', shouldShowMixed);
          roleButton.setAttribute('aria-pressed', state === 'all' ? 'true' : 'false');
          roleButton.setAttribute('data-check-state', state === 'all' ? 'all' : (shouldShowMixed ? 'mixed' : 'none'));
        }
      });
    }

    if (mobileGenderMenu) {
      mobileGenderMenu.querySelectorAll('[data-gender-filter]').forEach(function (button) {
        var gender = button.getAttribute('data-gender-filter') || '';
        var active = currentGenderFilters.indexOf(gender) !== -1;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    if (mobileFilterMenu) {
      mobileFilterMenu.querySelectorAll('[data-mobile-filter-section]').forEach(function (button) {
        var section = button.getAttribute('data-mobile-filter-section') || '';
        var hasActive = section === 'role'
          ? (currentRoleFilters.length > 0 || currentArtistFilters.length > 0)
          : (currentGenderFilters.length > 0);
        button.classList.toggle('has-active', hasActive);
      });
    }

    updateMobileFilterCount();

    if (favoritesOnlyFilter) {
      favoritesOnlyFilter.classList.toggle('is-active', favoritesOnly);
      favoritesOnlyFilter.setAttribute('aria-pressed', favoritesOnly ? 'true' : 'false');
    }
  }

  function renderFilters(artists) {
    var active = artists || [];
    var genderCounts = {'М': 0, 'Ж': 0};
    var artistsByRole = {};

    active.forEach(function (artist) {
      if (artist.role) {
        if (!artistsByRole[artist.role]) artistsByRole[artist.role] = [];
        artistsByRole[artist.role].push(artist);
      }
      if (artist.gender === 'М' || artist.gender === 'Ж') genderCounts[artist.gender] += 1;
    });

    var roleOrder = ROLE_ORDER.slice();
    Object.keys(artistsByRole).sort().forEach(function (role) {
      if (roleOrder.indexOf(role) === -1) roleOrder.push(role);
    });

    var roleGroups = [];

    roleOrder.forEach(function (role) {
      var roleArtists = artistsByRole[role] || [];
      var count = roleArtists.length;
      if (!count) return;

      var artistButtons = roleArtists.slice().sort(function (a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''), 'ru');
      }).map(function (artist) {
        return '<button class="vh-filter-dd__option vh-filter-artist-option" type="button" data-artist-filter="' + esc(artist.id) + '" data-artist-gender="' + esc(artist.gender || '') + '" aria-pressed="false"><i aria-hidden="true"></i><span>' + esc(artist.name || 'Артист') + '</span></button>';
      }).join('');

      roleGroups.push(
        '<div class="vh-filter-role-group" data-role-group="' + esc(role) + '">' +
          '<div class="vh-filter-role-head">' +
            '<button class="vh-filter-role-select" type="button" data-role-filter="' + esc(role) + '" aria-pressed="false"><i aria-hidden="true"></i><span>' + esc(ROLE_LABELS[role] || role) + '</span><b>' + count + '</b></button>' +
            '<button class="vh-filter-role-expand" type="button" data-role-expand="' + esc(role) + '" aria-expanded="false" aria-label="Показать артистов"></button>' +
          '</div>' +
          '<div class="vh-filter-role-artists" data-role-artists="' + esc(role) + '">' + artistButtons + '</div>' +
        '</div>'
      );
    });

    if (mobileRoleMenu) mobileRoleMenu.innerHTML = roleGroups.join('');

    var genderButtons = [
      '<button class="vh-filter-dd__option vh-filter-gender-option" type="button" data-gender-filter="М" aria-pressed="false"><i aria-hidden="true"></i><span>Парни</span>' + optionCountLabel(genderCounts['М']) + '</button>',
      '<button class="vh-filter-dd__option vh-filter-gender-option" type="button" data-gender-filter="Ж" aria-pressed="false"><i aria-hidden="true"></i><span>Девушки</span>' + optionCountLabel(genderCounts['Ж']) + '</button>'
    ];

    if (mobileGenderMenu) mobileGenderMenu.innerHTML = genderButtons.join('');
    updateFilterButtons();
  }

  function photosFor(artist) {
    var photos = [];
    for (var i = 1; i <= 6; i++) {
      if (artist['photo_' + i]) photos.push(artist['photo_' + i]);
    }

    if (!photos.length) {
      for (var j = 1; j <= 6; j++) {
        if (artist['photo_' + j + '_card']) photos.push(artist['photo_' + j + '_card']);
      }
    }

    var unique = [];
    photos.forEach(function (photo) {
      if (photo && unique.indexOf(photo) === -1) unique.push(photo);
    });

    return unique.length ? unique : [''];
  }

  function photoSlideHtml(photo, index) {
    var style = photo ? ' style="--photo: url(\'' + esc(photo).replace(/'/g, '%27') + '\')"' : '';
    return '<button class="vh-artist-card__slide' + (index === 0 ? ' is-active' : '') + (photo ? ' has-photo' : '') + '" type="button" data-photo="' + esc(photo) + '"' + style + ' aria-label="Открыть фото"></button>';
  }

  function repertoireUrl(artist) {
    var rawId = String((artist && artist.id) || '').trim();
    var base = repertoireBaseUrl || 'https://vladislovex.ru/repertoire';

    if (!base || base.charAt(0) === '#') {
      base = 'https://vladislovex.ru/repertoire';
    }

    try {
      var url = new URL(base, window.location.href);
      if (rawId) url.searchParams.set('artist', rawId);
      return url.toString();
    } catch (e) {
      var sep = base.indexOf('?') === -1 ? '?' : '&';
      return base + sep + 'artist=' + encodeURIComponent(rawId);
    }
  }

  function cardHtml(artist) {
    var photos = photosFor(artist);
    var label = roleLabel(artist.role, artist);
    var shortText = artist.short_text || artist.about || 'Музыкант для живого выступления на вашем событии.';
    var age = artistAge(artist);
    var ageText = age ? formatAge(age) : '';
    var repertoireDescription = artistRepertoireDescription(artist);
    return '' +
      '<article class="vh-artist-card" data-id="' + esc(artist.id) + '" data-role="' + esc(artist.role) + '" data-gender="' + esc(artist.gender) + '" data-name="' + esc(artist.name) + '" data-type="' + esc(label) + '" data-age="' + esc(age) + '" data-repertoire="' + esc(artist.repertoire) + '" data-repertoire-description="' + esc(repertoireDescription) + '" data-about="' + esc(artist.about || artist.short_text) + '" data-video="' + esc(artist.video_url) + '">' +
        '<button class="vh-artist-card__favorite" type="button" aria-label="Добавить в избранное"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.2-4.4-9.5-9.1C.7 8.3 2.5 4.5 6.4 4.1c2.1-.2 4.1.9 5.1 2.6 1-1.7 3-2.8 5.1-2.6 3.9.4 5.7 4.2 3.9 7.8C19.2 16.6 12 21 12 21z"></path></svg></button>' +
        '<div class="vh-artist-card__gallery">' +
          '<div class="vh-artist-card__slides">' + photos.map(photoSlideHtml).join('') + '</div>' +
          '<button class="vh-artist-card__gallery-btn vh-artist-card__gallery-btn--prev" type="button" aria-label="Предыдущее фото">‹</button>' +
          '<button class="vh-artist-card__gallery-btn vh-artist-card__gallery-btn--next" type="button" aria-label="Следующее фото">›</button>' +
          '<div class="vh-artist-card__dots" aria-hidden="true">' + photos.map(function (_, index) { return '<i class="' + (index === 0 ? 'is-active' : '') + '"></i>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="vh-artist-card__body" role="button" tabindex="0" aria-label="Открыть карточку артиста">' +
          '<div class="vh-artist-card__type"><span>' + esc(label) + '</span>' + (ageText ? '<b>' + esc(ageText) + '</b>' : '') + '</div>' +
          '<div class="vh-artist-card__top"><h3>' + esc(artist.name || 'Музыкант') + '</h3></div>' +
          '<p class="vh-artist-card__text vh-text--small">' + esc(shortText) + '</p>' +
          '<div class="vh-artist-card__actions"><button class="vh-artist-card__choose vh-button vh-button--primary" type="button">Смотреть видео</button><a class="vh-artist-card__repertoire vh-button vh-button--secondary" href="' + esc(repertoireUrl(artist)) + '" data-repertoire-artist="' + esc(artist.id || '') + '">Репертуар</a></div>' +
        '</div>' +
      '</article>';
  }

  function renderArtists(artists) {
    if (!grid) return;

    if (!artists.length) {
      grid.innerHTML = '<div class="vh-artists-page__state">По этим фильтрам музыкантов пока нет.</div>';
      cards = [];
      updateFavoritesUi();
      return;
    }

    grid.innerHTML = artists.map(cardHtml).join('');
    cards = Array.prototype.slice.call(grid.querySelectorAll('.vh-artist-card'));

    cards.forEach(function (card) {
      setupCard(card);
      showSlide(card, 0, false);
    });

    updateFavoritesUi();
  }

  function setupPhotoViewerSwipe(element) {
    if (!element) return;

    var startX = 0;
    var startY = 0;
    var started = false;
    var verticalSwipe = false;

    element.addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      if (event.target.closest('.vh-photo-viewer__thumbs')) return;
      started = true;
      verticalSwipe = false;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      element.classList.remove('is-dragging-down');
    }, { passive: true });

    element.addEventListener('touchmove', function (event) {
      if (!started || !event.touches || event.touches.length !== 1) return;

      var dx = event.touches[0].clientX - startX;
      var dy = event.touches[0].clientY - startY;

      if (dy > 16 && Math.abs(dy) > Math.abs(dx) * 1.15) verticalSwipe = true;
      if (!verticalSwipe) return;

      element.classList.add('is-dragging-down');

      if (event.cancelable) event.preventDefault();
    }, { passive: false });

    element.addEventListener('touchend', function (event) {
      if (!started || !event.changedTouches || !event.changedTouches.length) return;
      started = false;

      var dx = event.changedTouches[0].clientX - startX;
      var dy = event.changedTouches[0].clientY - startY;

      element.classList.remove('is-dragging-down');

      if (dy > 76 && Math.abs(dy) > Math.abs(dx) * 1.15) {
        closePhotoViewer();
        return;
      }

      if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.25) return;

      currentPhotoIndex += dx < 0 ? 1 : -1;
      renderPhotoViewer();
    }, { passive: true });

    element.addEventListener('touchcancel', function () {
      started = false;
      verticalSwipe = false;
      element.classList.remove('is-dragging-down');
    }, { passive: true });
  }

  function setActiveSlide(card, index) {
    var slides = card.querySelectorAll('.vh-artist-card__slide');
    var dots = card.querySelectorAll('.vh-artist-card__dots i');
    if (!slides.length) return;

    var nextIndex = ((index % slides.length) + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      var isActive = slideIndex === nextIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === nextIndex);
    });

    card.setAttribute('data-current-slide', String(nextIndex));
  }

  function setGalleryPosition(card, index) {
    var slidesEl = card ? card.querySelector('.vh-artist-card__slides') : null;
    if (!slidesEl) return;

    slidesEl.style.transform = 'translate3d(-' + (index * 100) + '%, 0, 0)';
  }

  function setupGalleryDrag(card, slidesEl) {
    if (!card || !slidesEl) return;

    var startX = 0;
    var startY = 0;
    var touched = false;
    var horizontalSwipe = false;

    slidesEl.addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      touched = true;
      horizontalSwipe = false;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      card._vhDragged = false;
    }, { passive: true });

    slidesEl.addEventListener('touchmove', function (event) {
      if (!touched || !event.touches || event.touches.length !== 1) return;

      var dx = event.touches[0].clientX - startX;
      var dy = event.touches[0].clientY - startY;

      if (!horizontalSwipe && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.12) {
        horizontalSwipe = true;
      }

      if (horizontalSwipe && event.cancelable) {
        event.preventDefault();
      }
    }, { passive: false });

    slidesEl.addEventListener('touchend', function (event) {
      if (!touched || !event.changedTouches || !event.changedTouches.length) return;
      touched = false;

      var dx = event.changedTouches[0].clientX - startX;
      var dy = event.changedTouches[0].clientY - startY;
      var isHorizontal = horizontalSwipe || (Math.abs(dx) >= 42 && Math.abs(dx) > Math.abs(dy) * 1.2);

      horizontalSwipe = false;

      if (!isHorizontal) return;

      card._vhDragged = true;
      window.clearTimeout(card._vhDraggedTimer);
      card._vhDraggedTimer = window.setTimeout(function () { card._vhDragged = false; }, 260);

      var current = getCurrentSlide(card);
      showSlide(card, dx < 0 ? current + 1 : current - 1, true);
    }, { passive: true });

    slidesEl.addEventListener('touchcancel', function () {
      touched = false;
      horizontalSwipe = false;
    }, { passive: true });
  }

  function setupCard(card) {
    var prev = card.querySelector('.vh-artist-card__gallery-btn--prev');
    var next = card.querySelector('.vh-artist-card__gallery-btn--next');
    var choose = card.querySelector('.vh-artist-card__choose');
    var select = card.querySelector('.vh-artist-card__select');
    var favorite = card.querySelector('.vh-artist-card__favorite');
    var body = card.querySelector('.vh-artist-card__body');
    var gallery = card.querySelector('.vh-artist-card__gallery');
    var slidesEl = card.querySelector('.vh-artist-card__slides');
    var slides = card.querySelectorAll('.vh-artist-card__slide');

    if (favorite) {
      favorite.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleFavorite(card);
      });
    }

    if (prev) {
      prev.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        showSlide(card, getCurrentSlide(card) - 1, true);
      });
    }

    if (next) {
      next.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        showSlide(card, getCurrentSlide(card) + 1, true);
      });
    }

    if (slidesEl) setupGalleryDrag(card, slidesEl);

    if (gallery) {
      gallery.addEventListener('click', function (event) {
        if (event.target.closest('.vh-artist-card__gallery-btn')) return;
        if (card._vhDragged) return;

        var index = getCurrentSlide(card);

        event.preventDefault();
        event.stopPropagation();
        openPhotoViewer(card, index);
      }, true);
    }

    slides.forEach(function (slide, slideIndex) {
      slide.addEventListener('click', function (event) {
        event.stopPropagation();
        if (card._vhDragged) return;
        openPhotoViewer(card, slideIndex);
      });
    });

    if (body) {
      body.addEventListener('click', function (event) {
        if (event.target.closest('button,a')) return;
        openModal(card);
      });

      body.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.target.closest('button,a')) return;
        event.preventDefault();
        openModal(card);
      });
    }

    if (choose) {
      choose.addEventListener('click', function (event) {
        event.stopPropagation();
        openModal(card);
      });
    }

    if (select) {
      select.addEventListener('click', function (event) {
        event.stopPropagation();
        var id = card.getAttribute('data-id');
        var favoriteIds = getSavedFavorites();

        if (id && favoriteIds.indexOf(id) === -1) {
          favoriteIds.push(id);
          saveFavorites(favoriteIds);
          updateFavoritesUi();
        }
      });
    }
  }

  function showSlide(card, index, animate) {
    var slides = card.querySelectorAll('.vh-artist-card__slide');
    if (!slides.length) return;
    var nextIndex = ((index % slides.length) + slides.length) % slides.length;
    setActiveSlide(card, nextIndex);
    setGalleryPosition(card, nextIndex);
  }

  function getCurrentSlide(card) {
    return Number(card.getAttribute('data-current-slide') || 0);
  }

  function getCardPhotos(card) {
    return Array.prototype.slice.call(card.querySelectorAll('.vh-artist-card__slide')).map(function (slide) {
      return slide.getAttribute('data-photo') || '';
    });
  }

  function findArtistByCard(card) {
    var id = card && card.getAttribute ? card.getAttribute('data-id') : '';
    return allArtists.find(function (artist) {
      return String(artist.id || '') === String(id || '');
    }) || null;
  }

  function renderModalPhotos(card, artist) {
    if (!modalPhotos) return;

    var photos = artist ? photosFor(artist).filter(Boolean) : getCardPhotos(card).filter(Boolean);

    if (!photos.length) {
      modalPhotos.innerHTML = '';
      modalPhotos.classList.remove('is-visible');
      return;
    }

    modalPhotos.classList.add('is-visible');
    modalPhotos.innerHTML = photos.map(function (photo, index) {
      return '<button class="vh-artist-modal__photo" type="button" data-modal-photo-index="' + index + '" aria-label="Открыть фото ' + (index + 1) + '"><img src="' + esc(photo) + '" alt=""></button>';
    }).join('');

    modalPhotos.querySelectorAll('[data-modal-photo-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        openPhotoViewer(card, Number(button.getAttribute('data-modal-photo-index') || 0));
      });
    });
  }

  function lockPage() {
    openLayers += 1;
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockPage() {
    openLayers = Math.max(0, openLayers - 1);
    if (!openLayers) document.documentElement.style.overflow = '';
  }

  function openPhotoViewer(card, index) {
    if (!photoViewer) return;

    currentPhotoCard = card;
    currentPhotoIndex = index || 0;

    renderPhotoViewer();

    photoViewer.classList.add('is-open');
    photoViewer.setAttribute('aria-hidden', 'false');
    lockPage();
  }

  function syncPhotoViewerThumbs() {
    if (!photoViewerThumbs) return;

    var activeThumb = photoViewerThumbs.querySelector('.vh-photo-viewer__thumb.is-active');
    if (!activeThumb) return;

    window.requestAnimationFrame(function () {
      try {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch (e) {
        var left = activeThumb.offsetLeft - (photoViewerThumbs.clientWidth - activeThumb.offsetWidth) / 2;
        photoViewerThumbs.scrollLeft = Math.max(0, left);
      }
    });
  }

  function renderPhotoViewer() {
    if (!currentPhotoCard || !photoViewer) return;

    var photos = getCardPhotos(currentPhotoCard).filter(Boolean);
    var name = currentPhotoCard.getAttribute('data-name') || 'Музыкант';

    if (!photos.length) photos = [''];

    currentPhotoIndex = ((currentPhotoIndex % photos.length) + photos.length) % photos.length;

    var photo = photos[currentPhotoIndex];

    if (photoViewerName) photoViewerName.textContent = name;
    if (photoViewerCounter) photoViewerCounter.textContent = (currentPhotoIndex + 1) + ' / ' + photos.length;

    if (photoViewerThumbs) {
      photoViewerThumbs.innerHTML = photos.map(function (item, thumbIndex) {
        return '<button class="vh-photo-viewer__thumb' + (thumbIndex === currentPhotoIndex ? ' is-active' : '') + '" type="button" data-photo-thumb-index="' + thumbIndex + '" aria-label="Фото ' + (thumbIndex + 1) + '"><img src="' + esc(item) + '" alt=""></button>';
      }).join('');

      photoViewerThumbs.querySelectorAll('[data-photo-thumb-index]').forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          currentPhotoIndex = Number(button.getAttribute('data-photo-thumb-index') || 0);
          renderPhotoViewer();
        });
      });

      syncPhotoViewerThumbs();
    }

    if (photoViewerImage) {
      photoViewerImage.classList.remove('is-switching');
      void photoViewerImage.offsetWidth;
    }

    if (photo) {
      photoViewer.classList.add('has-photo');
      photoViewerImage.src = photo;
      photoViewerImage.alt = name;
      photoViewerImage.classList.add('is-switching');
    } else {
      photoViewer.classList.remove('has-photo');
      photoViewerImage.removeAttribute('src');
      photoViewerImage.alt = '';
    }
  }

  function closePhotoViewer() {
    if (!photoViewer || !photoViewer.classList.contains('is-open')) return;

    photoViewer.classList.remove('is-open');
    photoViewer.setAttribute('aria-hidden', 'true');

    if (photoViewerImage) {
      photoViewerImage.removeAttribute('src');
      photoViewerImage.alt = '';
    }

    currentPhotoCard = null;
    currentPhotoIndex = 0;

    unlockPage();
  }

  function withAutoplay(url) {
    if (!url) return url;
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    if (/autoplay=/.test(url)) return url;
    return url + sep + 'autoplay=1&mute=1&muted=1&playsinline=1';
  }

  function renderVideo(videoUrl) {
    modalMedia.innerHTML = '';

    if (!videoUrl) {
      modalMedia.innerHTML = '<div class="vh-artist-modal__media-placeholder">Видео пока не добавлено.<br>Здесь можно поставить прямую ссылку на видео.</div>';
      return;
    }

    if (/storage\.yandexcloud\.net|\.(mp4|webm|mov)($|\?)/i.test(videoUrl)) {
      var video = document.createElement('video');
      video.src = videoUrl;
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('playsinline', '');
      modalMedia.appendChild(video);
      setTimeout(function () { video.play().catch(function () {}); }, 80);
      return;
    }

    var iframe = document.createElement('iframe');
    iframe.src = withAutoplay(videoUrl);
    iframe.loading = 'eager';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    modalMedia.appendChild(iframe);
  }

  function openModal(card) {
    if (!modal) return;

    var artist = findArtistByCard(card);

    var age = (artist && artistAge(artist)) || card.getAttribute('data-age') || '';
    var repertoireDescription = (artist && artistRepertoireDescription(artist)) || card.getAttribute('data-repertoire-description') || '';

    if (modalType) modalType.textContent = card.getAttribute('data-type') || '';
    if (modalName) modalName.textContent = card.getAttribute('data-name') || '';
    if (modalAbout) modalAbout.textContent = (artist && (artist.about || artist.short_text)) || card.getAttribute('data-about') || '';
    if (modalAge) modalAge.textContent = formatAge(age);
    if (modalAgeCard) modalAgeCard.hidden = !age;
    var repertoireText = card.getAttribute('data-repertoire') || '';
    if (modalRepertoire) modalRepertoire.textContent = repertoireText;
    if (modalRepertoireInline) {
      modalRepertoireInline.textContent = repertoireText;
      modalRepertoireInline.hidden = !repertoireText;
    }
    if (modalRepertoireDescription) modalRepertoireDescription.textContent = repertoireDescription;
    if (modalRepertoireDescriptionCard) modalRepertoireDescriptionCard.hidden = !repertoireDescription;

    renderVideo(card.getAttribute('data-video') || '');
    renderModalPhotos(card, artist);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockPage();
  }

  function closeModal() {
    if (!modal || !modal.classList.contains('is-open')) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    if (modalMedia) modalMedia.innerHTML = '';
    if (modalRepertoireInline) {
      modalRepertoireInline.textContent = '';
      modalRepertoireInline.hidden = true;
    }
    if (modalPhotos) {
      modalPhotos.innerHTML = '';
      modalPhotos.classList.remove('is-visible');
    }

    unlockPage();
  }

  function cssEscape(value) {
    value = String(value || '');
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function openArtistFromUrl() {
    if (!pendingOpenArtistId || !grid) return;

    var artistId = pendingOpenArtistId;
    pendingOpenArtistId = '';

    requestAnimationFrame(function () {
      var card = grid.querySelector('.vh-artist-card[data-id="' + cssEscape(artistId) + '"]');
      if (!card) return;

      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(function () {
        openModal(card);
      }, 260);
    });
  }

  async function generatePdfReport() {
    if (isPdfGenerating) return;

    var artists = getFavoriteArtists();

    if (!artists.length) {
      alert('Сначала добавьте музыкантов в избранное.');
      return;
    }

    if (!window.html2canvas || !window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF-модуль ещё загружается. Попробуйте через пару секунд.');
      return;
    }

    isPdfGenerating = true;
    var originalPdfText = favoritesPdf ? favoritesPdf.textContent : '';
    if (favoritesPdf) {
      favoritesPdf.disabled = true;
      favoritesPdf.textContent = 'Формирую PDF...';
    }

    var stage = document.getElementById('vhPdfStage');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'vhPdfStage';
      stage.className = 'vh-pdf-stage';
      document.body.appendChild(stage);
    }

    var roleCounts = {};
    artists.forEach(function (artist) {
      var role = roleLabel(artist.role, artist);
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    function roleStatsHtml() {
      var keys = Object.keys(roleCounts);
      if (!keys.length) return '<span class="vh-pdf-role-stat">Музыканты Vocava</span>';

      return keys.map(function (key, index) {
        return (index ? '<i class="vh-pdf-role-divider" aria-hidden="true"></i>' : '') +
          '<span class="vh-pdf-role-stat">' + esc(key) + ' <b>' + roleCounts[key] + '</b></span>';
      }).join('');
    }

    function initials(name) {
      var parts = String(name || 'Музыкант')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

      return parts.map(function (part) {
        return part.charAt(0).toUpperCase();
      }).join('') || 'V';
    }

    function firstPhoto(artist) {
      return photosFor(artist).filter(Boolean)[0] || '';
    }

    function artistLink(artist) {
      try {
        var url = new URL(window.location.href);
        url.search = '';
        url.searchParams.set('artist', artist.id || '');
        url.searchParams.set('open', 'artist');
        url.hash = 'artists';
        return url.toString();
      } catch (e) {
        return window.location.href;
      }
    }

    function readBlobAsDataUrl(blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    async function imageUrlToDataUrl(src) {
      var response = await fetch(src, { mode: 'cors', credentials: 'omit', cache: 'force-cache' });
      if (!response.ok) throw new Error('image HTTP ' + response.status);
      var blob = await response.blob();
      return readBlobAsDataUrl(blob);
    }

    function loadPdfImage(src) {
      return new Promise(function (resolve, reject) {
        var image = new Image();
        image.crossOrigin = 'anonymous';
        image.referrerPolicy = 'no-referrer';
        image.onload = function () { resolve(image); };
        image.onerror = reject;
        image.src = src;
      });
    }

    async function createPdfAvatarDataUrl(src) {
      var source = src;

      try {
        source = await imageUrlToDataUrl(src);
      } catch (e) {}

      var image = await loadPdfImage(source);
      var width = image.naturalWidth || image.width;
      var height = image.naturalHeight || image.height;

      if (!width || !height) throw new Error('empty image');

      var size = 560;
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var zoom = 1.04;
      var scale = Math.max(size / width, size / height) * zoom;
      var drawWidth = width * scale;
      var drawHeight = height * scale;
      var offsetX = (size - drawWidth) / 2;
      var offsetY = (size - drawHeight) * 0.42;

      canvas.width = size;
      canvas.height = size;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#f7f2ea';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      return canvas.toDataURL('image/png');
    }

    function pdfArtistRow(artist, index) {
      var role = roleLabel(artist.role, artist);
      var age = artistAge(artist) ? formatAge(artistAge(artist)) : '';
      var text = artist.about || artist.short_text || artistRepertoireDescription(artist) || 'Описание пока не добавлено.';
      var photo = firstPhoto(artist);
      var name = artist.name || 'Музыкант';
      var link = artistLink(artist);

      return '' +
        '<section class="vh-pdf-card" data-artist-id="' + esc(artist.id || '') + '" data-artist-url="' + esc(link) + '">' +
          '<div class="vh-pdf-num">' + String(index + 1).padStart(2, '0') + '</div>' +
          '<div class="vh-pdf-avatar' + (photo ? ' has-photo' : '') + '">' +
            (photo ? '<img src="" alt="" width="88" height="88" data-pdf-src="' + esc(photo) + '" crossorigin="anonymous" referrerpolicy="no-referrer">' : '') +
            '<span>' + esc(initials(name)) + '</span>' +
          '</div>' +
          '<div class="vh-pdf-info">' +
            '<div class="vh-pdf-role">' + esc(role) + '</div>' +
            '<div class="vh-pdf-name-row">' +
              '<h2>' + esc(name) + '</h2>' +
              (age ? '<div class="vh-pdf-age">' + esc(age) + '</div>' : '') +
            '</div>' +
            '<p>' + esc(text) + '</p>' +
          '</div>' +
        '</section>';
    }

    function buildPage(pageArtists, startIndex, pageIndex, isFirstPage) {
      return '' +
        '<div class="vh-pdf-page" data-pdf-page-index="' + pageIndex + '">' +
          (isFirstPage ?
            '<header class="vh-pdf-hero">' +
              '<div class="vh-pdf-hero-main">' +
                '<div class="vh-pdf-kicker">VOCAVA / Владислав Хеколов</div>' +
                '<h1>Избранные<br>музыканты</h1>' +
              '</div>' +
              '<div class="vh-pdf-hero-next"><b>Следующий шаг:</b> отправьте этот PDF Владиславу в Telegram — он проверит свободные даты и поможет выбрать финальный состав.</div>' +
            '</header>' +
            '<div class="vh-pdf-meta">' +
              '<span class="vh-pdf-badge vh-pdf-badge--light">Выбрано музыкантов: <b>' + artists.length + '</b></span>' +
              '<span class="vh-pdf-badge vh-pdf-badge--roles">' + roleStatsHtml() + '</span>' +
            '</div>'
            :
            '<header class="vh-pdf-mini-head">' +
              '<span>VOCAVA / избранные музыканты</span>' +
              '<strong>' + String(startIndex + 1).padStart(2, '0') + '—' + String(startIndex + pageArtists.length).padStart(2, '0') + '</strong>' +
            '</header>'
          ) +
          '<main class="vh-pdf-list">' +
            pageArtists.map(function (artist, localIndex) {
              return pdfArtistRow(artist, startIndex + localIndex);
            }).join('') +
          '</main>' +
        '</div>';
    }

    function splitArtistsIntoPages(list) {
      var pages = [];
      var index = 0;
      var firstPageLimit = 4;
      var nextPageLimit = 6;

      pages.push(list.slice(index, index + firstPageLimit));
      index += firstPageLimit;

      while (index < list.length) {
        pages.push(list.slice(index, index + nextPageLimit));
        index += nextPageLimit;
      }

      return pages.filter(function (page) { return page.length; });
    }

    async function preparePdfImages(container) {
      var images = Array.prototype.slice.call(container.querySelectorAll('.vh-pdf-avatar img[data-pdf-src]'));

      await Promise.all(images.map(async function (image) {
        var src = image.getAttribute('data-pdf-src') || '';
        var avatar = image.closest('.vh-pdf-avatar');

        if (!src) {
          if (avatar) avatar.classList.remove('has-photo');
          image.remove();
          return;
        }

        var finalSrc = '';

        try {
          finalSrc = await createPdfAvatarDataUrl(src);
        } catch (e) {
          finalSrc = '';
        }

        if (!finalSrc) {
          if (avatar) avatar.classList.remove('has-photo');
          image.remove();
          return;
        }

        await new Promise(function (resolve) {
          image.crossOrigin = 'anonymous';
          image.referrerPolicy = 'no-referrer';

          image.onload = function () {
            if (avatar) avatar.classList.add('has-photo');
            if (image.decode) {
              image.decode().then(resolve).catch(resolve);
            } else {
              resolve();
            }
          };

          image.onerror = function () {
            if (avatar) avatar.classList.remove('has-photo');
            image.remove();
            resolve();
          };

          image.src = finalSrc;
        });
      }));
    }

    function collectPdfLinks(report) {
      var links = [];
      var cards = Array.prototype.slice.call(report.querySelectorAll('.vh-pdf-card[data-artist-url]'));

      cards.forEach(function (card) {
        var page = card.closest('.vh-pdf-page');
        var url = card.getAttribute('data-artist-url') || '';
        if (!page || !url) return;

        var pageIndex = Number(page.getAttribute('data-pdf-page-index') || 0);
        var pageRect = page.getBoundingClientRect();
        var cardRect = card.getBoundingClientRect();

        links.push({
          pageIndex: pageIndex,
          url: url,
          x: ((cardRect.left - pageRect.left) / 794) * 210,
          y: ((cardRect.top - pageRect.top) / 1123) * 297,
          w: (cardRect.width / 794) * 210,
          h: (cardRect.height / 1123) * 297
        });
      });

      return links;
    }

    try {
      var chunks = splitArtistsIntoPages(artists);
      var pageStartIndex = 0;

      stage.innerHTML = '<div class="vh-pdf-report" id="vhFavoritePdfReport">' +
        chunks.map(function (chunk, pageIndex) {
          var html = buildPage(chunk, pageStartIndex, pageIndex, pageIndex === 0);
          pageStartIndex += chunk.length;
          return html;
        }).join('') +
      '</div>';

      var report = document.getElementById('vhFavoritePdfReport');
      if (!report) throw new Error('PDF report was not created');

      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await preparePdfImages(report);

      await new Promise(function (resolve) {
        requestAnimationFrame(function () {
          requestAnimationFrame(resolve);
        });
      });

      var linkAreas = collectPdfLinks(report);
      var pageWidth = 794;
      var pageHeight = 1123;
      var pageCount = chunks.length;

      var canvas = await window.html2canvas(report, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f7f2ea',
        logging: false,
        width: pageWidth,
        height: pageHeight * pageCount,
        windowWidth: pageWidth,
        windowHeight: pageHeight * pageCount,
        scrollX: 0,
        scrollY: 0
      });

      var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');

      for (var pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        if (pageIndex > 0) pdf.addPage();

        var pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.round(pageHeight * (canvas.width / pageWidth));

        var ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#f7f2ea';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          pageIndex * pageCanvas.height,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);

        linkAreas.forEach(function (link) {
          if (link.pageIndex !== pageIndex) return;
          pdf.link(link.x, link.y, link.w, link.h, { url: link.url });
        });
      }

      pdf.save('vocava-selected-musicians.pdf');
      stage.innerHTML = '';
    } catch (error) {
      console.error('Vocava PDF error:', error);
      stage.innerHTML = '';
      alert('Не удалось сформировать PDF. Попробуйте ещё раз.');
    } finally {
      isPdfGenerating = false;
      if (favoritesPdf) {
        favoritesPdf.disabled = false;
        favoritesPdf.textContent = originalPdfText || 'Скачать PDF';
      }
    }
  }

  function initRepertoireLinks() {
    root.addEventListener('click', function (event) {
      var repertoireLink = event.target.closest('.vh-artist-card__repertoire');
      if (!repertoireLink) return;
      event.preventDefault();
      openRepertoireFromCard(repertoireLink);
    });
  }

  function initSortControls() {
    if (sortDropdownBtn) {
      sortDropdownBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleDropdown(sortDropdown, sortDropdownBtn);
      });
    }

    if (!sortDropdownMenu) return;

    sortDropdownMenu.addEventListener('click', function (event) {
      var shuffleButton = event.target.closest('[data-sort-shuffle]');
      if (shuffleButton) {
        event.preventDefault();
        currentSort = 'shuffle';
        allArtists.forEach(function (artist) { artist.shuffle = Math.random(); });
        closeDropdowns();
        closeMobileFilter();
        applyView();
        return;
      }

      var button = event.target.closest('[data-sort]');
      if (!button) return;

      currentSort = button.getAttribute('data-sort') || 'recommended';
      closeDropdowns();
      applyView();
    });
  }

  function handleRoleExpandClick(button) {
    var group = button.closest('[data-role-group]');
    var panel = group ? group.querySelector('[data-role-artists]') : null;
    var nextOpen = !(group && group.classList.contains('is-open'));

    if (mobileRoleMenu) {
      mobileRoleMenu.querySelectorAll('[data-role-group].is-open').forEach(function (openGroup) {
        if (openGroup === group) return;
        openGroup.classList.remove('is-open');
        var openPanel = openGroup.querySelector('[data-role-artists]');
        if (openPanel) openPanel.classList.remove('is-open');
        var openButton = openGroup.querySelector('[data-role-expand]');
        if (openButton) openButton.setAttribute('aria-expanded', 'false');
      });
    }

    if (group) group.classList.toggle('is-open', nextOpen);
    if (panel) panel.classList.toggle('is-open', nextOpen);
    button.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  }

  function handleRoleSelectClick(button) {
    var role = button.getAttribute('data-role-filter') || '';
    var shouldSelectRole = currentRoleFilters.indexOf(role) === -1;

    setRoleWithArtists(role, shouldSelectRole);
    currentRoleFilters = uniqueList(currentRoleFilters);
    currentArtistFilters = uniqueList(currentArtistFilters);
    applyView();
  }

  function handleArtistFilterClick(button) {
    var artistId = button.getAttribute('data-artist-filter') || '';
    var group = button.closest('[data-role-group]');
    var role = group ? (group.getAttribute('data-role-group') || '') : '';
    var roleIsSelected = role && currentRoleFilters.indexOf(role) !== -1;
    var artistIsActive = currentArtistFilters.indexOf(artistId) !== -1 || roleIsSelected;

    if (artistIsActive) {
      if (roleIsSelected) {
        currentRoleFilters = currentRoleFilters.filter(function (item) {
          return String(item || '') !== role;
        });

        currentArtistFilters = uniqueList(currentArtistFilters.concat(artistIdsForRole(role))).filter(function (id) {
          return String(id || '') !== String(artistId || '');
        });
      } else {
        currentArtistFilters = currentArtistFilters.filter(function (id) {
          return String(id || '') !== String(artistId || '');
        });
      }
    } else {
      currentArtistFilters.push(artistId);
    }

    currentArtistFilters = uniqueList(currentArtistFilters);
    normalizeRoleSelection(role);
    currentRoleFilters = uniqueList(currentRoleFilters);
    currentArtistFilters = uniqueList(currentArtistFilters);
    applyView();
  }

  function handleGenderFilterClick(button) {
    var gender = button.getAttribute('data-gender-filter') || '';
    var genderIndex = currentGenderFilters.indexOf(gender);

    if (genderIndex === -1) currentGenderFilters.push(gender);
    else currentGenderFilters.splice(genderIndex, 1);

    syncGenderLegacy();
    pruneArtistFiltersByGender();
    applyView();
  }

  function resetFilters() {
    currentRoleFilters = [];
    currentArtistFilters = [];
    currentGenderFilters = [];
    syncGenderLegacy();
    closeMobileFilter();
    applyView();
  }

  function initMobileFilterControls() {
    if (mobileFilterBtn) {
      mobileFilterBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleMobileFilter();
      });
    }

    if (mobileFilterMenu) {
      mobileFilterMenu.addEventListener('click', function (event) {
        var sectionButton = event.target.closest('[data-mobile-filter-section]');
        if (sectionButton) {
          event.stopPropagation();
          updateMobileFilterSections(sectionButton.getAttribute('data-mobile-filter-section') || 'role');
          return;
        }

        var roleExpand = event.target.closest('[data-role-expand]');
        if (roleExpand) {
          event.preventDefault();
          event.stopPropagation();
          handleRoleExpandClick(roleExpand);
          return;
        }

        var roleSelect = event.target.closest('[data-role-filter]');
        if (roleSelect) {
          event.preventDefault();
          event.stopPropagation();
          handleRoleSelectClick(roleSelect);
          return;
        }

        var artistButton = event.target.closest('[data-artist-filter]');
        if (artistButton) {
          event.preventDefault();
          event.stopPropagation();
          handleArtistFilterClick(artistButton);
          return;
        }

        var genderButton = event.target.closest('[data-gender-filter]');
        if (genderButton) {
          event.preventDefault();
          event.stopPropagation();
          handleGenderFilterClick(genderButton);
        }
      });
    }

    if (mobileFilterReset) {
      mobileFilterReset.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        resetFilters();
      });
    }
  }

  function initFavoritesControls() {
    if (favoritesOnlyFilter) {
      favoritesOnlyFilter.addEventListener('click', function () {
        if (!getValidFavoriteIds().length) return;
        favoritesOnly = !favoritesOnly;
        applyView();
      });
    }

    if (favoritesPdf) favoritesPdf.addEventListener('click', generatePdfReport);
    if (favoritesReset) favoritesReset.addEventListener('click', resetFavorites);
  }

  function initModalControls() {
    if (!modal) return;

    modal.addEventListener('click', function (event) {
      if (event.target.hasAttribute('data-modal-close')) closeModal();
    });
  }

  function initPhotoViewerControls() {
    if (photoViewer) {
      photoViewer.addEventListener('click', function (event) {
        if (event.target.hasAttribute('data-photo-close')) closePhotoViewer();
      });

      var photoViewerStage = photoViewer.querySelector('.vh-photo-viewer__stage');

      if (photoViewerStage) {
        photoViewerStage.addEventListener('click', function (event) {
          if (event.target.closest('.vh-photo-viewer__thumbs')) return;
          if (event.target.closest('.vh-photo-viewer__arrow')) return;
          if (event.target.closest('[data-photo-close]')) return;

          var rect = photoViewerStage.getBoundingClientRect();
          var clickX = event.clientX - rect.left;
          var halfWidth = rect.width / 2;

          if (clickX < halfWidth) {
            currentPhotoIndex -= 1;
          } else {
            currentPhotoIndex += 1;
          }

          renderPhotoViewer();
        });
      }

      setupPhotoViewerSwipe(photoViewer);
    }

    if (photoPrev) {
      photoPrev.addEventListener('click', function () {
        currentPhotoIndex -= 1;
        renderPhotoViewer();
      });
    }

    if (photoNext) {
      photoNext.addEventListener('click', function () {
        currentPhotoIndex += 1;
        renderPhotoViewer();
      });
    }
  }

  function initKeyboardControls() {
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (photoViewer && photoViewer.classList.contains('is-open')) {
          closePhotoViewer();
          return;
        }

        if (modal && modal.classList.contains('is-open')) {
          closeModal();
          return;
        }
      }

      if (photoViewer && photoViewer.classList.contains('is-open')) {
        if (event.key === 'ArrowLeft') {
          currentPhotoIndex -= 1;
          renderPhotoViewer();
        }

        if (event.key === 'ArrowRight') {
          currentPhotoIndex += 1;
          renderPhotoViewer();
        }
      }
    });
  }

  function initOutsideClickControls() {
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.vh-sort-dd')) closeDropdowns();
      if (!event.target.closest('.vh-mobile-filter')) closeMobileFilter();
    });
  }

  function initStaticControls() {
    initRepertoireLinks();
    initSortControls();
    initMobileFilterControls();
    initFavoritesControls();
    initModalControls();
    initPhotoViewerControls();
    initKeyboardControls();
    initOutsideClickControls();
  }

  async function loadArtists() {
    try {
      showState('Загрузка музыкантов...', false);

      if (!window.VocavaPublicData || typeof window.VocavaPublicData.loadArtists !== 'function') {
        throw new Error('Модуль данных VOCAVA не загрузился. Обновите страницу.');
      }

      var data = await window.VocavaPublicData.loadArtists();
      if (!data || !data.ok) throw new Error((data && data.error) || 'ошибка ответа');

      var rows = data.rows || [];

      allArtists = dedupeArtists((rows || [])
        .map(cleanArtist)
        .filter(function (artist) {
          return artist.id || artist.name;
        }));

      allArtists.sort(function (a, b) {
        return (ROLE_PRIORITY[a.role] || 999) - (ROLE_PRIORITY[b.role] || 999) || a.sort - b.sort;
      });

      if (currentSort === 'shuffle') {
        allArtists.forEach(function (artist) { artist.shuffle = Math.random(); });
      }

      renderFilters(allArtists.filter(function (artist) { return yes(artist.active); }));
      applyView();
      openArtistFromUrl();
    } catch (error) {
      showState('Не удалось загрузить музыкантов: ' + error.message, true);
    }
  }

  readFiltersFromUrl();
  initStaticControls();
  updateMobileFilterCount();
  loadArtists();
})();
