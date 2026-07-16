/* Lightweight infinite mobile reviews carousel with reliable image loading. */
(function () {
  'use strict';

  function init() {
    if (window.innerWidth > 860) return;

    var oldWrap = document.getElementById('vh-reviews-wrap');
    var oldScene = document.getElementById('vh-reviews-carousel');
    if (!oldWrap || !oldScene || oldWrap.dataset.vhLoopReady === 'true') return;

    var sourceItems = Array.from(oldScene.querySelectorAll('.vh-reviews-3d__item'));
    if (!sourceItems.length) return;

    var originalCount = sourceItems.length;
    var cloneCount = Math.min(2, originalCount);
    var wrap = oldWrap.cloneNode(false);
    var scene = oldScene.cloneNode(false);

    wrap.classList.add('vh-reviews-3d--lite', 'vh-reviews-3d--loop');
    wrap.dataset.vhLiteReady = 'true';
    wrap.dataset.vhLoopReady = 'true';
    scene.classList.add('vh-reviews-mobile-track');
    scene.removeAttribute('style');

    function stripIds(node) {
      node.removeAttribute('id');
      node.querySelectorAll('[id]').forEach(function (child) { child.removeAttribute('id'); });
    }

    function alternateImageUrl(url) {
      var value = String(url || '');
      if (/\.jpe?g([?#].*)?$/i.test(value)) return value.replace(/\.jpe?g(?=([?#].*)?$)/i, '.png');
      if (/\.png([?#].*)?$/i.test(value)) return value.replace(/\.png(?=([?#].*)?$)/i, '.jpg');
      return '';
    }

    function prepareImage(item, logicalIndex) {
      var image = item.querySelector('img');
      if (!image) {
        item.classList.add('is-image-error');
        return;
      }

      var deferred = image.getAttribute('data-src') || image.dataset.src;
      if (!image.getAttribute('src') && deferred) image.setAttribute('src', deferred);

      image.loading = logicalIndex < 2 ? 'eager' : 'lazy';
      image.decoding = 'async';
      if (logicalIndex === 0) image.setAttribute('fetchpriority', 'high');
      else image.setAttribute('fetchpriority', 'low');

      function loaded() {
        item.classList.add('is-image-loaded');
        item.classList.remove('is-image-error');
      }

      image.addEventListener('load', loaded);
      image.addEventListener('error', function () {
        if (image.dataset.vhReviewFallback !== 'true') {
          var fallback = alternateImageUrl(image.currentSrc || image.src || image.getAttribute('src'));
          if (fallback) {
            image.dataset.vhReviewFallback = 'true';
            image.src = fallback;
            return;
          }
        }
        item.classList.add('is-image-error');
      });

      if (image.complete && image.naturalWidth > 0) loaded();
    }

    function makeItem(source, logicalIndex, cloneSide) {
      var item = source.cloneNode(true);
      stripIds(item);
      item.removeAttribute('style');
      item.style.removeProperty('transform');
      item.style.removeProperty('opacity');
      item.style.removeProperty('z-index');
      item.dataset.vhReviewLogical = String(logicalIndex);
      if (cloneSide) {
        item.dataset.vhLoopClone = cloneSide;
        item.setAttribute('aria-hidden', 'true');
      }
      prepareImage(item, logicalIndex);
      return item;
    }

    for (var before = originalCount - cloneCount; before < originalCount; before += 1) {
      scene.appendChild(makeItem(sourceItems[before], before, 'before'));
    }

    sourceItems.forEach(function (source, index) {
      scene.appendChild(makeItem(source, index, ''));
    });

    for (var after = 0; after < cloneCount; after += 1) {
      scene.appendChild(makeItem(sourceItems[after], after, 'after'));
    }

    wrap.appendChild(scene);
    oldWrap.replaceWith(wrap);

    var holder = wrap.parentElement;
    if (holder) holder.querySelectorAll('.vh-reviews-lite-dots').forEach(function (node) { node.remove(); });

    var dots = document.createElement('div');
    dots.className = 'vh-reviews-lite-dots';
    dots.setAttribute('aria-hidden', 'true');
    sourceItems.forEach(function (_, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.tabIndex = -1;
      dot.classList.toggle('is-active', index === 0);
      dots.appendChild(dot);
    });
    if (holder) holder.insertBefore(dots, wrap.nextSibling);

    var physicalItems = Array.from(scene.querySelectorAll('.vh-reviews-3d__item'));
    var currentPhysical = cloneCount;
    var currentLogical = 0;
    var timer = null;
    var settleTimer = null;
    var visible = true;
    var touching = false;
    var suppressOpen = false;
    var touchStartX = 0;
    var touchStartY = 0;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function logicalFromPhysical(index) {
      return ((index - cloneCount) % originalCount + originalCount) % originalCount;
    }

    function updateDots(logicalIndex) {
      currentLogical = logicalIndex;
      Array.from(dots.children).forEach(function (dot, index) {
        dot.classList.toggle('is-active', index === logicalIndex);
      });
    }

    function itemLeft(index) {
      var item = physicalItems[index];
      if (!item) return 0;
      return Math.max(0, item.offsetLeft - Math.max(0, (wrap.clientWidth - item.offsetWidth) / 2));
    }

    function scrollPhysical(index, smooth) {
      currentPhysical = Math.max(0, Math.min(index, physicalItems.length - 1));
      if (!smooth) {
        var previous = wrap.style.scrollBehavior;
        wrap.style.scrollBehavior = 'auto';
        wrap.scrollLeft = itemLeft(currentPhysical);
        requestAnimationFrame(function () { wrap.style.scrollBehavior = previous; });
      } else {
        wrap.scrollTo({ left: itemLeft(currentPhysical), behavior: 'smooth' });
      }
      updateDots(logicalFromPhysical(currentPhysical));
    }

    function nearestPhysical() {
      var center = wrap.scrollLeft + (wrap.clientWidth / 2);
      var best = 0;
      var distance = Infinity;
      physicalItems.forEach(function (item, index) {
        var itemCenter = item.offsetLeft + (item.offsetWidth / 2);
        var next = Math.abs(itemCenter - center);
        if (next < distance) {
          distance = next;
          best = index;
        }
      });
      return best;
    }

    function normalizeLoop(index) {
      var normalized = index;
      if (normalized < cloneCount) normalized += originalCount;
      if (normalized >= cloneCount + originalCount) normalized -= originalCount;
      if (normalized !== index) scrollPhysical(normalized, false);
      else {
        currentPhysical = normalized;
        updateDots(logicalFromPhysical(normalized));
      }
    }

    function settle() {
      clearTimeout(settleTimer);
      var nearest = nearestPhysical();
      normalizeLoop(nearest);
    }

    function goNext() {
      scrollPhysical(currentPhysical + 1, true);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 620);
    }

    function schedule(delay) {
      clearTimeout(timer);
      if (reduceMotion || !visible || document.hidden || touching) return;
      timer = setTimeout(function () {
        goNext();
        schedule(4600);
      }, delay || 4600);
    }

    wrap.addEventListener('scroll', function () {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        settle();
        schedule(5200);
      }, 150);
    }, { passive: true });

    wrap.addEventListener('touchstart', function (event) {
      var touch = event.touches && event.touches[0];
      touching = true;
      suppressOpen = false;
      touchStartX = touch ? touch.clientX : 0;
      touchStartY = touch ? touch.clientY : 0;
      clearTimeout(timer);
    }, { passive: true });

    wrap.addEventListener('touchmove', function (event) {
      var touch = event.touches && event.touches[0];
      if (!touch) return;
      if (Math.abs(touch.clientX - touchStartX) > 8 || Math.abs(touch.clientY - touchStartY) > 8) suppressOpen = true;
    }, { passive: true });

    wrap.addEventListener('touchend', function () {
      touching = false;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 80);
      setTimeout(function () { suppressOpen = false; }, 260);
      schedule(5400);
    }, { passive: true });

    wrap.addEventListener('touchcancel', function () {
      touching = false;
      suppressOpen = false;
      settle();
      schedule(5400);
    }, { passive: true });

    scene.addEventListener('click', function (event) {
      if (suppressOpen) return;
      var item = event.target.closest('.vh-reviews-3d__item');
      var image = item && item.querySelector('img');
      var lightbox = document.getElementById('vh-reviews-lightbox');
      var target = document.getElementById('vh-reviews-lb-img');
      if (!image || !lightbox || !target || item.classList.contains('is-image-error')) return;
      target.src = image.currentSrc || image.src;
      lightbox.setAttribute('aria-hidden', 'false');
      lightbox.classList.add('vh-reviews-lightbox--open');
      if (window.VHUI) window.VHUI.lock(lightbox);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = !!(entries[0] && entries[0].isIntersecting);
        if (visible) schedule(1800);
        else clearTimeout(timer);
      }, { rootMargin: '100px 0px' }).observe(wrap);
    }

    window.addEventListener('resize', function () {
      if (window.innerWidth <= 860) scrollPhysical(currentPhysical, false);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer);
      else schedule(1800);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollPhysical(cloneCount, false);
        schedule(2300);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());