/* On-demand mobile video thumbnails and 10-second long-press previews. */
(function () {
  'use strict';

  function init() {
    var coarsePointer = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (!coarsePointer && window.innerWidth > 860) return;

    var grid = document.querySelector('.vh-video-grid');
    var cards = Array.from(document.querySelectorAll('.vh-video-card'));
    if (!grid || !cards.length) return;

    var previewStart = 0.25;
    var previewLength = 10;
    var activeCard = null;
    var activeTimer = null;
    var prepared = new WeakSet();
    var painting = new WeakSet();

    function formatDuration(seconds) {
      if (!seconds || !isFinite(seconds)) return 'Видео';
      var total = Math.round(seconds);
      return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
    }

    function resetProgress(card) {
      var progress = card && card.querySelector('.vh-video-card__progress span');
      if (!progress) return;
      progress.style.animation = 'none';
      progress.offsetHeight;
      progress.style.animation = '';
    }

    function stopPreview(card) {
      if (!card) return;
      var video = card.querySelector('.vh-video-card__preview');
      card.classList.remove('is-previewing');
      resetProgress(card);
      if (video) {
        video.pause();
        try { video.currentTime = previewStart; } catch (error) {}
      }
      if (activeCard === card) activeCard = null;
      clearTimeout(activeTimer);
      activeTimer = null;
    }

    function stopAll(except) {
      cards.forEach(function (card) {
        if (card !== except && card.classList.contains('is-previewing')) stopPreview(card);
      });
    }

    function paintFrame(video, card) {
      if (!video || painting.has(video) || card.classList.contains('is-previewing')) return;
      painting.add(video);

      function finish() {
        video.pause();
        painting.delete(video);
      }

      try { video.currentTime = previewStart; } catch (error) {}
      var promise;
      try { promise = video.play(); } catch (error) { painting.delete(video); }
      if (promise && typeof promise.then === 'function') {
        promise.then(function () {
          requestAnimationFrame(function () {
            setTimeout(finish, 90);
          });
        }).catch(function () {
          painting.delete(video);
        });
      }
    }

    function prepareCard(card) {
      if (!card || prepared.has(card)) return;
      prepared.add(card);

      var video = card.querySelector('.vh-video-card__preview');
      var time = card.querySelector('.vh-video-card__time');
      if (!video) return;

      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = 'metadata';

      function ready() {
        if (time) time.textContent = formatDuration(video.duration);
        paintFrame(video, card);
      }

      if (video.readyState >= 1) ready();
      else video.addEventListener('loadedmetadata', ready, { once: true });

      video.addEventListener('error', function () {
        if (time) time.textContent = 'Открыть';
      }, { once: true });

      try { video.load(); } catch (error) {}
    }

    function startPreview(card) {
      var video = card.querySelector('.vh-video-card__preview');
      if (!video) return;

      prepareCard(card);
      stopAll(card);
      clearTimeout(activeTimer);
      activeCard = card;
      card.classList.add('is-previewing');
      resetProgress(card);

      try { video.currentTime = previewStart; } catch (error) {}
      video.play().catch(function () {});

      activeTimer = setTimeout(function () {
        stopPreview(card);
      }, previewLength * 1000);
    }

    function nearestIndex() {
      var left = grid.scrollLeft;
      var best = 0;
      var distance = Infinity;
      cards.forEach(function (card, index) {
        var next = Math.abs(card.offsetLeft - left);
        if (next < distance) {
          distance = next;
          best = index;
        }
      });
      return best;
    }

    function updateDots(index) {
      var dots = document.querySelectorAll('#video .vh-mobile-carousel-dots button');
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    var scrollTimer = null;
    grid.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var index = nearestIndex();
        updateDots(index);
        prepareCard(cards[index]);
      }, 100);
    }, { passive: true });

    cards.forEach(function (card) {
      var holdTimer = null;
      var startX = 0;
      var startY = 0;
      var longPressed = false;
      var suppressClick = false;

      function cancelHold() {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      card.addEventListener('pointerdown', function (event) {
        if (event.pointerType === 'mouse') return;
        startX = event.clientX;
        startY = event.clientY;
        longPressed = false;
        cancelHold();
        holdTimer = setTimeout(function () {
          longPressed = true;
          suppressClick = true;
          startPreview(card);
          setTimeout(function () { suppressClick = false; }, 900);
        }, 420);
      });

      card.addEventListener('pointermove', function (event) {
        if (Math.abs(event.clientX - startX) > 10 || Math.abs(event.clientY - startY) > 10) cancelHold();
      });

      card.addEventListener('pointerup', cancelHold);
      card.addEventListener('pointercancel', cancelHold);
      card.addEventListener('contextmenu', function (event) {
        if (longPressed || coarsePointer) event.preventDefault();
      });

      card.addEventListener('click', function (event) {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
      }, true);

      var video = card.querySelector('.vh-video-card__preview');
      if (video) {
        video.addEventListener('timeupdate', function () {
          if (card === activeCard && video.currentTime >= previewStart + previewLength) stopPreview(card);
        });
      }
    });

    if ('IntersectionObserver' in window) {
      var cardObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= .35) prepareCard(entry.target);
        });
      }, { threshold: [.35, .65] });

      cards.forEach(function (card) { cardObserver.observe(card); });

      var section = document.getElementById('video');
      if (section) {
        new IntersectionObserver(function (entries) {
          if (!entries[0] || entries[0].isIntersecting) return;
          if (activeCard) stopPreview(activeCard);
        }, { threshold: 0 }).observe(section);
      }
    } else {
      prepareCard(cards[0]);
    }

    var hint = document.querySelector('.vh-video-hint__mobile');
    if (hint) hint.textContent = 'Листайте карточки · удерживайте для превью · нажмите, чтобы открыть';

    updateDots(0);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && activeCard) stopPreview(activeCard);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
