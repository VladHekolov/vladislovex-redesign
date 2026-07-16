/* Standardized local interface icons for the personal site.
   The selected SVG glyphs are shipped with the site, just as lucide-react icons
   are bundled into VOCAVA. Brand marks remain controlled separately. */
(function initVladislovexIcons() {
  'use strict';

  if (!window.VHIcons || typeof window.VHIcons.create !== 'function') return;

  var fileIconMap = [
    { match: 'телефон', icon: 'phone' },
    { match: 'календар', icon: 'calendar-check' },
    { match: 'загрузка', icon: 'download' },
    { match: 'гости', icon: 'users-round' },
    { match: 'щит', icon: 'shield-check' },
    { match: 'месяц', icon: 'clock-3' },
    { match: 'время-деньги', icon: 'circle-dollar-sign' },
    { match: 'видео желт', icon: 'video' },
    { match: 'mice', icon: 'mic-2' }
  ];

  var svgSelectorMap = [
    { selector: '.vh-theme-toggle__moon', icon: 'moon' },
    { selector: '.vh-theme-toggle__sun', icon: 'sun' },
    { selector: '.vh-video-modal__close svg', icon: 'x' },
    { selector: '.vh-reviews-lb-close svg', icon: 'x' },
    { selector: '#vrArtistDropdownButton > svg', icon: 'chevron-down' },
    { selector: '#vrFilterButton > svg', icon: 'list-filter' },
    { selector: '#vrFavoritesToggle > svg', icon: 'heart' },
    { selector: '#vrStopToggle > svg', icon: 'ban' },
    { selector: '#vrSortButton > svg', icon: 'arrow-down-up' },
    { selector: '.vr-search-field > svg', icon: 'search' },
    { selector: '#vhMobileFilterBtn > svg', icon: 'list-filter' },
    { selector: '#vhFavoritesOnlyFilter > svg', icon: 'heart' },
    { selector: '.vh-sort-dd__icon > svg', icon: 'arrow-down-up' }
  ];

  var textButtonMap = [
    { selector: '.vh-artist-modal__close', icon: 'x' },
    { selector: '.vh-photo-viewer__close', icon: 'x' },
    { selector: '.vh-photo-viewer__arrow--prev', icon: 'chevron-left' },
    { selector: '.vh-photo-viewer__arrow--next', icon: 'chevron-right' },
    { selector: '.vr-guide__close', icon: 'x' }
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

  function iconForImage(image) {
    if (!image || image.dataset.vhKeepImage === 'true') return '';
    var filename = decodedFilename(image.currentSrc || image.src || image.getAttribute('src'));

    /* Official brand identities and the personal logo remain brand assets. */
    if (/телеграм|telegram|max|авито|avito|лого|logo/.test(filename)) return '';

    if (image.closest('.vh-video-card__play')) return 'play';

    for (var index = 0; index < fileIconMap.length; index += 1) {
      if (filename.indexOf(fileIconMap[index].match) !== -1) return fileIconMap[index].icon;
    }
    return '';
  }

  function presentationOptions(source) {
    var className = (classNameOf(source) + ' vh-lucide-icon').trim();
    var alt = source.getAttribute('alt') || source.getAttribute('aria-label') || '';
    var title = source.getAttribute('title') || alt || '';
    return {
      className: className,
      title: title || undefined,
      attrs: {
        'data-vh-icon-processed': 'true'
      }
    };
  }

  function replaceElement(source, iconName) {
    if (!source || source.dataset.vhIconProcessed === 'true' || source.hasAttribute('data-vh-icon-name')) return false;
    if (!window.VHIcons.has(iconName)) return false;

    var icon = window.VHIcons.create(iconName, presentationOptions(source));
    if (!icon) return false;

    if (!source.getAttribute('alt') && !source.getAttribute('aria-label')) {
      icon.setAttribute('aria-hidden', 'true');
      icon.removeAttribute('role');
      icon.removeAttribute('aria-label');
    }

    source.dataset.vhIconProcessed = 'true';
    source.replaceWith(icon);
    return true;
  }

  function replaceImage(image) {
    if (!image || image.dataset.vhIconProcessed === 'true') return false;
    var iconName = iconForImage(image);
    if (!iconName) {
      image.dataset.vhIconProcessed = 'true';
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

  function replaceMappedSvg(scope) {
    var changed = false;
    svgSelectorMap.forEach(function (entry) {
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
        button.dataset.vhIconButtonReady = 'true';
        var icon = window.VHIcons.create(entry.icon, {
          className: 'vh-lucide-icon',
          attrs: { 'data-vh-icon-processed': 'true' }
        });
        if (!icon) return;
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

    if (replaceMappedSvg(scope)) changed = true;
    if (decorateTextButtons(scope)) changed = true;

    if (changed) document.documentElement.classList.add('vh-icons-ready');
  }

  render(document);

  var scheduled = false;
  var observer = new MutationObserver(function (mutations) {
    var hasNewElements = mutations.some(function (mutation) {
      return Array.prototype.some.call(mutation.addedNodes || [], function (node) {
        return node && node.nodeType === 1 && !node.hasAttribute('data-vh-icon-name');
      });
    });
    if (!hasNewElements || scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      render(document);
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.VHIcon = function (name, options) {
    return window.VHIcons.create(name, options || {});
  };
  window.VHRefreshIcons = function () { render(document); };
})();
