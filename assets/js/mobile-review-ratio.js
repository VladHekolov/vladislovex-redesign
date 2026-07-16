/* Keep each mobile review card in the source image's real aspect ratio. */
(function () {
  'use strict';

  function applyImageRatio(image) {
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    var item = image.closest('.vh-reviews-3d__item');
    if (!item) return;
    item.style.setProperty('--vh-review-ratio', image.naturalWidth + ' / ' + image.naturalHeight);
    item.dataset.vhReviewRatioReady = 'true';
  }

  function watchImage(image) {
    if (!image || image.dataset.vhRatioBound === 'true') return;
    image.dataset.vhRatioBound = 'true';

    if (image.complete && image.naturalWidth > 0) applyImageRatio(image);
    image.addEventListener('load', function () { applyImageRatio(image); });
  }

  function scan(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.vh-reviews-mobile-track .vh-reviews-3d__item img').forEach(watchImage);
  }

  function init() {
    if (window.innerWidth > 860) return;
    var reviews = document.getElementById('reviews');
    if (!reviews) return;

    scan(reviews);

    if ('MutationObserver' in window) {
      new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches('.vh-reviews-3d__item')) {
              var image = node.querySelector('img');
              if (image) watchImage(image);
            }
            scan(node);
          });
        });
      }).observe(reviews, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
