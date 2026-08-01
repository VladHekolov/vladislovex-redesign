'use strict';

(function () {
  function applyFixes() {
    var game = document.querySelector('.rhythm-runner');
    if (!game) {
      window.setTimeout(applyFixes, 30);
      return;
    }

    var stage = game.querySelector('[data-run-stage]');
    if (!stage || stage.dataset.runnerFixApplied === 'true') return;
    stage.dataset.runnerFixApplied = 'true';

    game.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('pointerdown', function (event) {
        event.stopPropagation();
      });
    });

    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(function () {
        window.dispatchEvent(new Event('resize'));
      });
      observer.observe(stage);
    } else {
      window.setTimeout(function () {
        window.dispatchEvent(new Event('resize'));
      }, 120);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixes, { once: true });
  } else {
    applyFixes();
  }
})();
