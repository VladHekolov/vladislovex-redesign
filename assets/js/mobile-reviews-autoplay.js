/* Restore the desktop-style automatic reviews rotation on mobile. */
(function () {
  'use strict';

  function init() {
    if (window.innerWidth > 860) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var wrap = document.getElementById('vh-reviews-wrap');
    var scene = document.getElementById('vh-reviews-carousel');
    if (!wrap || !scene) return;

    var items = Array.from(scene.querySelectorAll('.vh-reviews-3d__item'));
    if (!items.length) return;

    var angle = 0;
    var frame = null;
    var lastTime = performance.now();
    var visible = true;
    var touching = false;
    var speed = 0.0021;

    function radius() {
      return window.innerWidth > 480 ? 330 : 270;
    }

    function render() {
      var r = radius();
      var step = 360 / items.length;

      items.forEach(function (item, index) {
        var cardAngle = step * index + angle;
        var rad = cardAngle * Math.PI / 180;
        var cosValue = Math.cos(rad);
        var x = Math.sin(rad) * r;
        var z = cosValue * r;
        var scale = 0.38 + 0.62 * ((cosValue + 1) / 2);

        item.style.transform =
          'translateX(' + x.toFixed(2) + 'px) ' +
          'translateZ(' + z.toFixed(2) + 'px) ' +
          'rotateY(' + (-cardAngle).toFixed(2) + 'deg) ' +
          'scale(' + scale.toFixed(4) + ')';
        item.style.opacity = cosValue < -0.2 ? 0 : 1;
        item.style.zIndex = Math.round((cosValue + 1) * 50);
      });
    }

    function syncFromExistingTransform() {
      var value = items[0].style.transform || '';
      var match = value.match(/rotateY\((-?[\d.]+)deg\)/);
      if (match) angle = -parseFloat(match[1]) || angle;
    }

    function loop(now) {
      if (!visible || document.hidden) {
        frame = null;
        return;
      }

      var delta = Math.min(now - lastTime, 48);
      lastTime = now;
      if (!touching) {
        angle = (angle + speed * delta + 360) % 360;
        render();
      }
      frame = requestAnimationFrame(loop);
    }

    function start() {
      if (frame || !visible || document.hidden) return;
      lastTime = performance.now();
      frame = requestAnimationFrame(loop);
    }

    wrap.addEventListener('touchstart', function () {
      touching = true;
    }, { passive: true });

    window.addEventListener('touchend', function () {
      syncFromExistingTransform();
      touching = false;
      start();
    }, { passive: true });

    window.addEventListener('touchcancel', function () {
      syncFromExistingTransform();
      touching = false;
      start();
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (window.innerWidth <= 860) render();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = !!(entries[0] && entries[0].isIntersecting);
        if (visible) start();
      }, { rootMargin: '180px 0px' }).observe(wrap);
    }

    document.addEventListener('visibilitychange', start);
    syncFromExistingTransform();
    render();
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
