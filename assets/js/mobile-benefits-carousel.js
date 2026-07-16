/* Lightweight infinite auto-advancing benefits carousel for touch devices. */
(function () {
  'use strict';

  function init() {
    if (window.innerWidth > 860) return;

    var oldRail = document.getElementById('vhBenefitsRail');
    if (!oldRail || oldRail.dataset.vhLoopReady === 'true') return;

    var sourceCards = Array.from(oldRail.querySelectorAll('[data-vh-benefits-original] .vh-benefit-card'));
    if (!sourceCards.length) sourceCards = Array.from(oldRail.querySelectorAll('.vh-benefit-card')).slice(0, 4);
    if (!sourceCards.length) return;

    var originalCount = sourceCards.length;
    var cloneCount = 1;
    var rail = document.createElement('div');
    var track = document.createElement('div');

    rail.id = 'vhBenefitsRail';
    rail.className = 'vh-benefits-rail vh-benefits-rail--lite vh-benefits-rail--loop';
    rail.dataset.vhLiteReady = 'true';
    rail.dataset.vhLoopReady = 'true';
    rail.setAttribute('aria-label', 'Преимущества');
    track.className = 'vh-benefits-track vh-benefits-track--lite';

    function stripIds(node) {
      node.removeAttribute('id');
      node.querySelectorAll('[id]').forEach(function (child) { child.removeAttribute('id'); });
    }

    function makeCard(source, logicalIndex, cloneSide) {
      var card = source.cloneNode(true);
      stripIds(card);
      card.removeAttribute('data-vh-benefits-original');
      card.removeAttribute('data-vh-benefits-clone');
      card.dataset.vhBenefitIndex = String(logicalIndex);
      if (cloneSide) {
        card.dataset.vhLoopClone = cloneSide;
        card.setAttribute('aria-hidden', 'true');
      }
      return card;
    }

    track.appendChild(makeCard(sourceCards[originalCount - 1], originalCount - 1, 'before'));
    sourceCards.forEach(function (source, index) {
      track.appendChild(makeCard(source, index, ''));
    });
    track.appendChild(makeCard(sourceCards[0], 0, 'after'));

    rail.appendChild(track);
    oldRail.replaceWith(rail);

    var holder = rail.parentElement;
    if (holder) holder.querySelectorAll('.vh-benefits-lite-dots').forEach(function (node) { node.remove(); });

    var dots = document.createElement('div');
    dots.className = 'vh-benefits-lite-dots';
    dots.setAttribute('aria-hidden', 'true');
    sourceCards.forEach(function (_, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.tabIndex = -1;
      dot.classList.toggle('is-active', index === 0);
      dots.appendChild(dot);
    });
    if (holder) holder.appendChild(dots);

    var physicalCards = Array.from(track.children);
    var currentPhysical = cloneCount;
    var currentLogical = 0;
    var timer = null;
    var settleTimer = null;
    var visible = true;
    var touching = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function logicalFromPhysical(index) {
      return ((index - cloneCount) % originalCount + originalCount) % originalCount;
    }

    function updateState(logicalIndex) {
      currentLogical = logicalIndex;
      Array.from(dots.children).forEach(function (dot, index) {
        dot.classList.toggle('is-active', index === logicalIndex);
      });
      physicalCards.forEach(function (card) {
        card.classList.toggle('is-active', Number(card.dataset.vhBenefitIndex) === logicalIndex);
      });
    }

    function paddingLeft() {
      return parseFloat(getComputedStyle(rail).paddingLeft || 0) || 0;
    }

    function cardLeft(index) {
      var card = physicalCards[index];
      return card ? Math.max(0, card.offsetLeft - paddingLeft()) : 0;
    }

    function scrollPhysical(index, smooth) {
      currentPhysical = Math.max(0, Math.min(index, physicalCards.length - 1));
      if (!smooth) {
        var previous = rail.style.scrollBehavior;
        rail.style.scrollBehavior = 'auto';
        rail.scrollLeft = cardLeft(currentPhysical);
        requestAnimationFrame(function () { rail.style.scrollBehavior = previous; });
      } else {
        rail.scrollTo({ left: cardLeft(currentPhysical), behavior: 'smooth' });
      }
      updateState(logicalFromPhysical(currentPhysical));
    }

    function nearestPhysical() {
      var left = rail.scrollLeft + paddingLeft();
      var best = 0;
      var distance = Infinity;
      physicalCards.forEach(function (card, index) {
        var next = Math.abs(card.offsetLeft - left);
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
        updateState(logicalFromPhysical(normalized));
      }
    }

    function settle() {
      clearTimeout(settleTimer);
      normalizeLoop(nearestPhysical());
    }

    function goNext() {
      scrollPhysical(currentPhysical + 1, true);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 560);
    }

    function schedule(delay) {
      clearTimeout(timer);
      if (reduceMotion || !visible || document.hidden || touching) return;
      timer = setTimeout(function () {
        goNext();
        schedule(3500);
      }, delay || 3500);
    }

    rail.addEventListener('scroll', function () {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        settle();
        schedule(3900);
      }, 130);
    }, { passive: true });

    rail.addEventListener('touchstart', function () {
      touching = true;
      clearTimeout(timer);
    }, { passive: true });

    rail.addEventListener('touchend', function () {
      touching = false;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 80);
      schedule(3900);
    }, { passive: true });

    rail.addEventListener('touchcancel', function () {
      touching = false;
      settle();
      schedule(3900);
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = !!(entries[0] && entries[0].isIntersecting);
        if (visible) schedule(1400);
        else clearTimeout(timer);
      }, { rootMargin: '100px 0px' }).observe(rail);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer);
      else schedule(1400);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollPhysical(cloneCount, false);
        schedule(1800);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());