/* Local Material Symbols for the personal site.
   Generic interface glyphs come from Google's official Material Symbols set.
   Brand marks (Telegram, MAX, Avito and personal logos) remain untouched. */
(function initVladislovexIcons() {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var XLINK_NS = 'http://www.w3.org/1999/xlink';
  var SPRITE_URL = '/assets/icons/material-symbols.svg?v=20260724-1';

  var aliases = {
    phone: 'call',
    call: 'call',
    'calendar-check': 'calendar-month',
    calendar_month: 'calendar-month',
    download: 'download',
    'users-round': 'groups',
    groups: 'groups',
    'shield-check': 'verified-user',
    shield: 'verified-user',
    'clock-3': 'schedule',
    schedule: 'schedule',
    'circle-dollar-sign': 'paid',
    paid: 'paid',
    video: 'video-library',
    'video-library': 'video-library',
    'mic-2': 'mic',
    mic: 'mic',
    play: 'play-arrow',
    'play-arrow': 'play-arrow',
    moon: 'dark-mode',
    'dark-mode': 'dark-mode',
    sun: 'light-mode',
    'light-mode': 'light-mode',
    x: 'close',
    close: 'close',
    'chevron-down': 'expand-more',
    'expand-more': 'expand-more',
    'list-filter': 'filter-list',
    'filter-list': 'filter-list',
    heart: 'favorite',
    favorite: 'favorite',
    ban: 'block',
    block: 'block',
    'arrow-down-up': 'swap-vert',
    'swap-vert': 'swap-vert',
    search: 'search',
    'chevron-left': 'chevron-left',
    'chevron-right': 'chevron-right',
    'arrow-outward': 'arrow-outward'
  };

  var fileIconMap = [
    { match: 'телефон', icon: 'call' },
    { match: 'календар', icon: 'calendar-month' },
    { match: 'загрузка', icon: 'download' },
    { match: 'гости', icon: 'groups' },
    { match: 'щит', icon: 'verified-user' },
    { match: 'месяц', icon: 'schedule' },
    { match: 'время-деньги', icon: 'paid' },
    { match: 'видео желт', icon: 'video-library' },
    { match: 'mice', icon: 'mic' }
  ];

  var svgSelectorMap = [
    { selector: '.vh-theme-toggle__moon', icon: 'dark-mode' },
    { selector: '.vh-theme-toggle__sun', icon: 'light-mode' },
    { selector: '.vh-video-modal__close svg', icon: 'close' },
    { selector: '.vh-reviews-lb-close svg', icon: 'close' },
    { selector: '#vrArtistDropdownButton > svg', icon: 'expand-more' },
    { selector: '#vrFilterButton > svg', icon: 'filter-list' },
    { selector: '#vrFavoritesToggle > svg', icon: 'favorite' },
    { selector: '#vrStopToggle > svg', icon: 'block' },
    { selector: '#vrSortButton > svg', icon: 'swap-vert' },
    { selector: '.vr-search-field > svg', icon: 'search' },
    { selector: '#vhMobileFilterBtn > svg', icon: 'filter-list' },
    { selector: '#vhFavoritesOnlyFilter > svg', icon: 'favorite' },
    { selector: '.vh-sort-dd__icon > svg', icon: 'swap-vert' }
  ];

  var elementSelectorMap = [
    { selector: '.vh-contact-card__arrow', icon: 'arrow-outward' }
  ];

  var textButtonMap = [
    { selector: '.vh-artist-modal__close', icon: 'close' },
    { selector: '.vh-photo-viewer__close', icon: 'close' },
    { selector: '.vh-photo-viewer__arrow--prev', icon: 'chevron-left' },
    { selector: '.vh-photo-viewer__arrow--next', icon: 'chevron-right' },
    { selector: '.vr-guide__close', icon: 'close' }
  ];

  function decodedFilename(source) {
    var value = String(source || '').split('?')[0].split('#')[0].split('/').pop() || '';
    try { value = decodeURIComponent(value); } catch (error) {}
    return value.toLowerCase().replace(/\.(png|jpe?g|webp|svg)$/i, '').replace(/\s+/g, ' ').trim();
  }

  function classNameOf(element) {
    if (!element) return '';
    if (typeof element.className === 'string') return element.className;
    return element.getAttribute('class') || '';
  }

  function normalizeIconName(name) {
    var key = String(name || '').trim();
    return aliases[key] || key.replace(/_/g, '-');
  }

  function createIcon(name, options) {
    var iconName = normalizeIconName(name);
    if (!iconName) return null;

    options = options || {};

    var svg = document.createElementNS(SVG_NS, 'svg');
    var use = document.createElementNS(SVG_NS, 'use');
    var href = SPRITE_URL + '#' + iconName;

    svg.setAttribute('viewBox', '0 -960 960 960');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('data-vh-material-symbol', iconName);
    svg.setAttribute('class', ((options.className || '') + ' vh-material-symbol').trim());

    use.setAttribute('href', href);
    use.setAttributeNS(XLINK_NS, 'xlink:href', href);
    svg.appendChild(use);

    if (options.title) {
      var title = document.createElementNS(SVG_NS, 'title');
      title.textContent = options.title;
      svg.insertBefore(title, use);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', options.title);
    } else {
      svg.setAttribute('aria-hidden', 'true');
    }

    return svg;
  }

  function iconForImage(image) {
    if (!image || image.dataset.vhKeepImage === 'true') return '';
    var filename = decodedFilename(image.currentSrc || image.src || image.getAttribute('src'));

    if (/телеграм|telegram|max|авито|avito|лого|logo/.test(filename)) return '';
    if (image.closest('.vh-video-card__play')) return 'play-arrow';

    for (var index = 0; index < fileIconMap.length; index += 1) {
      if (filename.indexOf(fileIconMap[index].match) !== -1) return fileIconMap[index].icon;
    }

    return '';
  }

  function replaceElement(source, iconName) {
    if (!source || source.hasAttribute('data-vh-material-symbol')) return false;

    var alt = source.getAttribute('alt') || source.getAttribute('aria-label') || '';
    var icon = createIcon(iconName, {
      className: classNameOf(source),
      title: alt || source.getAttribute('title') || ''
    });

    if (!icon) return false;

    source.replaceWith(icon);
    return true;
  }

  function replaceImage(image) {
    if (!image || image.dataset.vhIconChecked === 'true') return false;
    var iconName = iconForImage(image);

    if (!iconName) {
      image.dataset.vhIconChecked = 'true';
      return false;
    }

    return replaceElement(image, iconName);
  }

  function replacePlaceholders(scope) {
    var changed = false;

    scope.querySelectorAll('[data-vh-icon], i[data-lucide]').forEach(function (placeholder) {
      var iconName = placeholder.getAttribute('data-vh-icon') || placeholder.getAttribute('data-lucide') || '';
      if (replaceElement(placeholder, iconName)) changed = true;
    });

    return changed;
  }

  function replaceSelectorMap(scope, map) {
    var changed = false;

    map.forEach(function (entry) {
      scope.querySelectorAll(entry.selector).forEach(function (source) {
        if (replaceElement(source, entry.icon)) changed = true;
      });
    });

    return changed;
  }

  function decorateTextButtons(scope) {
    var changed = false;

    textButtonMap.forEach(function (entry) {
      scope.querySelectorAll(entry.selector).forEach(function (button) {
        if (button.dataset.vhIconButtonReady === 'true') return;

        var icon = createIcon(entry.icon);
        if (!icon) return;

        button.dataset.vhIconButtonReady = 'true';
        button.textContent = '';
        button.appendChild(icon);
        changed = true;
      });
    });

    return changed;
  }

  function render(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var changed = false;

    if (replacePlaceholders(scope)) changed = true;

    scope.querySelectorAll('img').forEach(function (image) {
      if (replaceImage(image)) changed = true;
    });

    if (replaceSelectorMap(scope, svgSelectorMap)) changed = true;
    if (replaceSelectorMap(scope, elementSelectorMap)) changed = true;
    if (decorateTextButtons(scope)) changed = true;

    if (changed) document.documentElement.classList.add('vh-icons-ready');
  }

  render(document);

  var scheduled = false;
  var observer = new MutationObserver(function (mutations) {
    var hasNewElements = mutations.some(function (mutation) {
      return Array.prototype.some.call(mutation.addedNodes || [], function (node) {
        return node && node.nodeType === 1 && !node.hasAttribute('data-vh-material-symbol');
      });
    });

    if (!hasNewElements || scheduled) return;

    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      render(document);
    });
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });

  window.VHIcon = function (name, options) {
    return createIcon(name, options || {});
  };
  window.VHRefreshIcons = function () { render(document); };
})();
