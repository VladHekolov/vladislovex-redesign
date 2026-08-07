'use strict';
(function () {
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function smooth(a, b, value) {
    var x = clamp((value - a) / Math.max(.0001, b - a), 0, 1);
    return x * x * (3 - 2 * x);
  }
  function ready(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  ready(function () {
    initHeroStory();
  });

  function initHeroStory() {
    var hero = document.querySelector('.hero');
    var inner = hero && hero.querySelector('.hero__inner');
    var portrait = hero && hero.querySelector('.hero__portrait');
    if (!hero || !inner || !portrait) return;

    hero.classList.add('hero--story');
    var background = document.createElement('div');
    background.className = 'hero-story-bg';
    background.setAttribute('aria-hidden', 'true');
    background.innerHTML = '<i class="hero-story-bg__ring r1"></i><i class="hero-story-bg__ring r2"></i><i class="hero-story-bg__ring r3"></i><span class="hero-story-bg__word w1">живой звук</span><span class="hero-story-bg__word w2">ваш ритм</span><i class="hero-story-bg__note n1">♪</i><i class="hero-story-bg__note n2">♫</i><i class="hero-story-bg__note n3">✳</i>';
    inner.prepend(background);

    var rail = document.createElement('div');
    rail.className = 'hero-emotions';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<div class="hero-emotions__labels"><span>Сосредоточен</span><span>В контакте</span><span>На драйве</span></div><div class="hero-emotions__track"><i></i></div><p class="hero-emotions__hint">Листайте — экран отпустит после третьей эмоции</p>';
    inner.appendChild(rail);

    var labels = Array.from(rail.querySelectorAll('.hero-emotions__labels span'));
    var captionText = portrait.querySelector('figcaption span');
    var captionCounter = portrait.querySelector('figcaption b');
    var ticking = false;

    function setViewport() {
      var vh = window.innerHeight;
      document.documentElement.style.setProperty('--story-vh', vh + 'px');
      hero.style.setProperty('--story-height', Math.round(vh * 3.3 + 112) + 'px');
      update();
    }

    function update() {
      var total = Math.max(1, hero.offsetHeight - window.innerHeight - 112);
      var progress = clamp(-hero.getBoundingClientRect().top / total, 0, 1);
      var exit = smooth(.78, 1, progress);
      hero.style.setProperty('--story-progress', progress.toFixed(4));
      hero.style.setProperty('--story-exit', exit.toFixed(4));
      portrait.style.setProperty('--portal-shift', (-42 * progress).toFixed(1) + 'px');

      var left = 0, front = 0, right = 0;
      if (progress <= .5) {
        var first = smooth(.05, .47, progress);
        left = 1 - first;
        front = first;
      } else {
        var second = smooth(.53, .95, progress);
        front = 1 - second;
        right = second;
      }
      portrait.style.setProperty('--head-left', left.toFixed(3));
      portrait.style.setProperty('--head-front', front.toFixed(3));
      portrait.style.setProperty('--head-right', right.toFixed(3));

      var active = progress < .34 ? 0 : (progress < .68 ? 1 : 2);
      labels.forEach(function (label, index) { label.classList.toggle('is-active', index === active); });
      if (captionText) captionText.textContent = labels[active].textContent;
      if (captionCounter) captionCounter.textContent = '0' + (active + 1) + '/03';
      hero.classList.toggle('is-complete', progress > .96);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', setViewport, { passive: true });
    setViewport();
  }
})();
