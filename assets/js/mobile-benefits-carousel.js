/* Lightweight auto-advancing benefits carousel for touch devices. */
(function () {
  'use strict';

  function init() {
    if (window.innerWidth > 860) return;

    var oldRail = document.getElementById('vhBenefitsRail');
    if (!oldRail || oldRail.dataset.vhLiteReady === 'true') return;

    var sourceCards = Array.from(oldRail.querySelectorAll('[data-vh-benefits-original] .vh-benefit-card'));
    if (!sourceCards.length) sourceCards = Array.from(oldRail.querySelectorAll('.vh-benefit-card')).slice(0, 4);
    if (!sourceCards.length) return;

    var rail = document.createElement('div');
    rail.id = 'vhBenefitsRail';
    rail.className = 'vh-benefits-rail vh-benefits-rail--lite';
    rail.dataset.vhLiteReady = 'true';
    rail.setAttribute('aria-label', 'Преимущества');

    var track = document.createElement('div');
    track.className = 'vh-benefits-track vh-benefits-track--lite';

    sourceCards.forEach(function (source, index) {
      var card = source.cloneNode(true);
      card.removeAttribute('data-vh-benefits-original');
      card.removeAttribute('data-vh-benefits-clone');
      card.dataset.vhBenefitIndex = String(index);
      track.appendChild(card);
    });

    rail.appendChild(track);
    oldRail.replaceWith(rail);

    var holder = rail.parentElement;
    var dots = document.createElement('div');
    dots.className = 'vh-benefits-lite-dots';
    dots.setAttribute('aria-hidden', 'true');

    sourceCards.forEach(function (_, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.tabIndex = -1;
      if (index === 0) dot.classList.add('is-active');
      dots.appendChild(dot);
    });

    if (holder) holder.appendChild(dots);

    var cards = Array.from(track.children);
    var current = 0;
    var timer = null;
    var visible = true;
    var touching = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function updateDots(index) {
      current = Math.max(0, Math.min(index, cards.length - 1));
      Array.from(dots.children).forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
      cards.forEach(function (card, cardIndex) {
        card.classList.toggle('is-active', cardIndex === current);
      });
    }

    function nearestIndex() {
      var left = rail.scrollLeft;
      var best = 0;
      var distance = Infinity;
      cards.forEach(function (card, index) {
        var next = Math.abs(card.offsetLeft - left - parseFloat(getComputedStyle(rail).paddingLeft || 0));
        if (next < distance) {
          distance = next;
          best = index;
        }
      });
      return best;
    }

    function goTo(index, smooth) {
      var next = (index + cards.length) % cards.length;
      var padding = parseFloat(getComputedStyle(rail).paddingLeft || 0);
      rail.scrollTo({
        left: Math.max(0, cards[next].offsetLeft - padding),
        behavior: smooth ? 'smooth' : 'auto'
      });
      updateDots(next);
    }

    function schedule(delay) {
      clearTimeout(timer);
      if (reduceMotion || !visible || document.hidden || touching) return;
      timer = setTimeout(function () {
        goTo(current + 1, true);
        schedule(4300);
      }, delay || 4300);
    }

    var scrollTimer = null;
    rail.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        updateDots(nearestIndex());
        schedule(5000);
      }, 120);
    }, { passive: true });

    rail.addEventListener('touchstart', function () {
      touching = true;
      clearTimeout(timer);
    }, { passive: true });

    rail.addEventListener('touchend', function () {
      touching = false;
      updateDots(nearestIndex());
      schedule(5200);
    }, { passive: true });

    rail.addEventListener('touchcancel', function () {
      touching = false;
      schedule(5200);
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = !!(entries[0] && entries[0].isIntersecting);
        if (visible) schedule(1800);
        else clearTimeout(timer);
      }, { rootMargin: '100px 0px' }).observe(rail);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer);
      else schedule(1800);
    });

    updateDots(0);
    schedule(2200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
