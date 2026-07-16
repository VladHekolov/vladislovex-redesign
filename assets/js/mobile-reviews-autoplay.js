/* Lightweight mobile reviews: native scroll-snap with one timed step. */
(function () {
  'use strict';

  function init() {
    if (window.innerWidth > 860) return;

    var oldWrap = document.getElementById('vh-reviews-wrap');
    var oldScene = document.getElementById('vh-reviews-carousel');
    if (!oldWrap || !oldScene || oldWrap.dataset.vhLiteReady === 'true') return;

    var wrap = oldWrap.cloneNode(false);
    wrap.classList.add('vh-reviews-3d--lite');
    wrap.dataset.vhLiteReady = 'true';

    var scene = oldScene.cloneNode(true);
    scene.classList.add('vh-reviews-mobile-track');
    scene.removeAttribute('style');

    Array.from(scene.querySelectorAll('.vh-reviews-3d__item')).forEach(function (item) {
      item.removeAttribute('style');
      item.style.removeProperty('transform');
      item.style.removeProperty('opacity');
      item.style.removeProperty('z-index');
    });

    wrap.appendChild(scene);
    oldWrap.replaceWith(wrap);

    var items = Array.from(scene.querySelectorAll('.vh-reviews-3d__item'));
    if (!items.length) return;

    var holder = wrap.parentElement;
    var dots = document.createElement('div');
    dots.className = 'vh-reviews-lite-dots';
    dots.setAttribute('aria-hidden', 'true');

    items.forEach(function (_, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.tabIndex = -1;
      if (index === 0) dot.classList.add('is-active');
      dots.appendChild(dot);
    });

    if (holder) holder.insertBefore(dots, wrap.nextSibling);

    var current = 0;
    var timer = null;
    var visible = true;
    var touching = false;
    var suppressOpen = false;
    var touchStartX = 0;
    var touchStartY = 0;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function updateDots(index) {
      current = Math.max(0, Math.min(index, items.length - 1));
      Array.from(dots.children).forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function nearestIndex() {
      var center = wrap.scrollLeft + (wrap.clientWidth / 2);
      var best = 0;
      var distance = Infinity;
      items.forEach(function (item, index) {
        var itemCenter = item.offsetLeft + (item.offsetWidth / 2);
        var next = Math.abs(itemCenter - center);
        if (next < distance) {
          distance = next;
          best = index;
        }
      });
      return best;
    }

    function goTo(index, smooth) {
      var next = (index + items.length) % items.length;
      var left = items[next].offsetLeft - Math.max(0, (wrap.clientWidth - items[next].offsetWidth) / 2);
      wrap.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
      updateDots(next);
    }

    function schedule(delay) {
      clearTimeout(timer);
      if (reduceMotion || !visible || document.hidden || touching) return;
      timer = setTimeout(function () {
        goTo(current + 1, true);
        schedule(4700);
      }, delay || 4700);
    }

    var scrollTimer = null;
    wrap.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        updateDots(nearestIndex());
        schedule(5200);
      }, 120);
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
      updateDots(nearestIndex());
      setTimeout(function () { suppressOpen = false; }, 250);
      schedule(5600);
    }, { passive: true });

    wrap.addEventListener('touchcancel', function () {
      touching = false;
      suppressOpen = false;
      schedule(5600);
    }, { passive: true });

    scene.addEventListener('click', function (event) {
      if (suppressOpen) return;
      var item = event.target.closest('.vh-reviews-3d__item');
      var image = item && item.querySelector('img');
      var lightbox = document.getElementById('vh-reviews-lightbox');
      var target = document.getElementById('vh-reviews-lb-img');
      if (!image || !lightbox || !target) return;
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
      if (window.innerWidth <= 860) goTo(current, false);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer);
      else schedule(1800);
    });

    updateDots(0);
    schedule(2400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
