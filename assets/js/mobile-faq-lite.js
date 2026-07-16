/* Snappy mobile FAQ without repeated scrollHeight/max-height calculations. */
(function () {
  'use strict';

  function init() {
    if (window.innerWidth > 860) return;

    var faq = document.getElementById('faq');
    if (!faq || faq.dataset.vhFaqLiteReady === 'true') return;
    faq.dataset.vhFaqLiteReady = 'true';

    var items = Array.from(faq.querySelectorAll('.vh-faq__item'));
    if (!items.length) return;

    function applyState(item, open) {
      var button = item.querySelector('.vh-faq__question');
      var answer = item.querySelector('.vh-faq__answer');
      if (!button || !answer) return;

      item.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      answer.style.setProperty('max-height', 'none', 'important');
      answer.hidden = !open;
    }

    function resetAll(keep) {
      items.forEach(function (item) {
        applyState(item, item === keep);
      });
    }

    items.forEach(function (item, index) {
      var button = item.querySelector('.vh-faq__question');
      var answer = item.querySelector('.vh-faq__answer');
      if (!button || !answer) return;

      if (!answer.id) answer.id = 'vhFaqLiteAnswer' + (index + 1);
      button.setAttribute('aria-controls', answer.id);
      applyState(item, item.classList.contains('is-open'));
    });

    faq.addEventListener('click', function (event) {
      var button = event.target.closest('.vh-faq__question');
      if (!button || !faq.contains(button)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      var item = button.closest('.vh-faq__item');
      var shouldOpen = item && !item.classList.contains('is-open');
      resetAll(shouldOpen ? item : null);
    }, true);

    /* Reassert the light state after the legacy module has initialized. */
    setTimeout(function () {
      items.forEach(function (item) {
        applyState(item, item.classList.contains('is-open'));
      });
    }, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());