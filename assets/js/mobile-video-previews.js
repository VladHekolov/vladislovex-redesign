/* Mobile video thumbnails and 10-second long-press previews. */
(function () {
  'use strict';

  function init() {
    var coarsePointer = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (!coarsePointer && window.innerWidth > 860) return;

    var cards = Array.from(document.querySelectorAll('.vh-video-card'));
    if (!cards.length) return;

    var previewStart = 0.25;
    var previewLength = 10;
    var activeCard = null;
    var activeTimer = null;

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
        if (card !== except) stopPreview(card);
      });
    }

    function prepareVideo(video) {
      if (!video) return;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = 'auto';

      function showFirstFrame() {
        if (!isFinite(video.duration) || video.duration <= previewStart) return;
        try { video.currentTime = previewStart; } catch (error) {}
      }

      if (video.readyState >= 1) showFirstFrame();
      else video.addEventListener('loadedmetadata', showFirstFrame, { once: true });

      video.addEventListener('seeked', function () {
        if (!video.closest('.vh-video-card').classList.contains('is-previewing')) video.pause();
      }, { once: true });

      try { video.load(); } catch (error) {}

      var playPromise;
      try { playPromise = video.play(); } catch (error) {}
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(function () {
          setTimeout(function () {
            if (!video.closest('.vh-video-card').classList.contains('is-previewing')) {
              video.pause();
              showFirstFrame();
            }
          }, 160);
        }).catch(function () {});
      }
    }

    function primeCards() {
      cards.forEach(function (card, index) {
        setTimeout(function () {
          prepareVideo(card.querySelector('.vh-video-card__preview'));
        }, index * 260);
      });
    }

    function startPreview(card) {
      var video = card.querySelector('.vh-video-card__preview');
      if (!video) return;

      stopAll(card);
      clearTimeout(activeTimer);
      activeCard = card;
      prepareVideo(video);
      card.classList.add('is-previewing');
      resetProgress(card);

      try { video.currentTime = previewStart; } catch (error) {}
      video.play().catch(function () {});

      activeTimer = setTimeout(function () {
        stopPreview(card);
      }, previewLength * 1000);
    }

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
        }, 360);
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
          if (card !== activeCard) return;
          if (video.currentTime >= previewStart + previewLength) stopPreview(card);
        });
      }
    });

    var hint = document.querySelector('.vh-video-hint__mobile');
    if (hint) hint.textContent = 'Удерживайте карточку — превью 10 секунд · нажмите — открыть';

    var section = document.getElementById('video');
    if ('IntersectionObserver' in window && section) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0] && entries[0].isIntersecting) {
          primeCards();
          observer.disconnect();
        }
      }, { rootMargin: '420px 0px' });
      observer.observe(section);
    } else {
      primeCards();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && activeCard) stopPreview(activeCard);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
