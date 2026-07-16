/* Standardized interface icons for the personal site.
   Brand marks (logo, Telegram, MAX, Avito) intentionally remain images. */
(function initVladislovexIcons() {
  'use strict';

  if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;

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

  function decodedFilename(source) {
    var value = String(source || '').split('?')[0].split('#')[0].split('/').pop() || '';
    try { value = decodeURIComponent(value); } catch (error) {}
    return value.toLowerCase().replace(/\.(png|jpe?g|webp|svg)$/i, '').replace(/\s+/g, ' ').trim();
  }

  function iconForImage(image) {
    if (!image || image.dataset.vhKeepImage === 'true') return '';
    var filename = decodedFilename(image.currentSrc || image.src || image.getAttribute('src'));

    /* Preserve external brand identities and the personal logo. */
    if (/телеграм|telegram|max|авито|avito|лого|logo/.test(filename)) return '';

    /* Play buttons use the compact play glyph, not the section video glyph. */
    if (image.closest('.vh-video-card__play')) return 'play';

    for (var index = 0; index < fileIconMap.length; index += 1) {
      if (filename.indexOf(fileIconMap[index].match) !== -1) return fileIconMap[index].icon;
    }
    return '';
  }

  function copyPresentationAttributes(source, target) {
    if (source.className) target.className = source.className + ' vh-lucide-icon';
    else target.className = 'vh-lucide-icon';

    var alt = source.getAttribute('alt');
    if (alt) {
      target.setAttribute('role', 'img');
      target.setAttribute('aria-label', alt);
    } else {
      target.setAttribute('aria-hidden', 'true');
    }

    if (source.getAttribute('title')) target.setAttribute('title', source.getAttribute('title'));
  }

  function replaceImage(image) {
    if (image.dataset.vhIconProcessed === 'true') return false;
    image.dataset.vhIconProcessed = 'true';
    var iconName = iconForImage(image);
    if (!iconName) return false;

    var placeholder = document.createElement('i');
    placeholder.setAttribute('data-lucide', iconName);
    copyPresentationAttributes(image, placeholder);
    image.replaceWith(placeholder);
    return true;
  }

  function replaceExistingSvg(selector, iconName) {
    document.querySelectorAll(selector).forEach(function (source) {
      if (source.dataset.vhIconProcessed === 'true') return;
      var placeholder = document.createElement('i');
      placeholder.setAttribute('data-lucide', iconName);
      placeholder.className = (source.getAttribute('class') || '') + ' vh-lucide-icon';
      placeholder.setAttribute('aria-hidden', 'true');
      source.replaceWith(placeholder);
    });
  }

  function render(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var changed = false;

    scope.querySelectorAll('img').forEach(function (image) {
      if (replaceImage(image)) changed = true;
    });

    if (scope === document) {
      replaceExistingSvg('.vh-theme-toggle__moon', 'moon');
      replaceExistingSvg('.vh-theme-toggle__sun', 'sun');
      replaceExistingSvg('.vh-video-modal__close svg', 'x');
      replaceExistingSvg('.vh-reviews-lb-close svg', 'x');
      changed = true;
    }

    if (!changed && !scope.querySelector('i[data-lucide]')) return;

    window.lucide.createIcons({
      attrs: {
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }
    });

    /* Prevent repeated processing when dynamic blocks are added later. */
    document.querySelectorAll('svg[data-lucide]').forEach(function (svg) {
      svg.removeAttribute('data-lucide');
      svg.classList.add('vh-lucide-icon');
    });
  }

  render(document);

  var scheduled = false;
  var observer = new MutationObserver(function (mutations) {
    var hasNewElements = mutations.some(function (mutation) {
      return Array.prototype.some.call(mutation.addedNodes || [], function (node) {
        return node && node.nodeType === 1;
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
  window.VHRefreshIcons = function () { render(document); };
})();
