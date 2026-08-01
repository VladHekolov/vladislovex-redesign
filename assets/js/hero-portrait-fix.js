'use strict';

(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  ready(function () {
    var hero = document.querySelector('.hero--story');
    var portrait = hero && hero.querySelector('.hero__portrait');
    if (!hero || !portrait) return;

    var ticking = false;

    function updateEmotion() {
      var total = Math.max(1, hero.offsetHeight - window.innerHeight - 112);
      var progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / total));
      var active = progress < .34 ? 'left' : (progress < .68 ? 'front' : 'right');

      portrait.classList.toggle('is-emotion-left', active === 'left');
      portrait.classList.toggle('is-emotion-front', active === 'front');
      portrait.classList.toggle('is-emotion-right', active === 'right');
      portrait.setAttribute('data-emotion', active);
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateEmotion);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    updateEmotion();
  });
})();
