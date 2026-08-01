'use strict';

(function () {
  function ready(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function ease(value) {
    var x = clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }

  ready(function () {
    var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    var sections = Array.from(document.querySelectorAll('main > .section, main > .contact'));
    if (!sections.length) return;

    var sceneNames = ['Живой звук', 'Форматы', 'Ритм-паспорт', 'Процесс', 'Стоимость', 'Отзывы', 'Вопросы', 'Следующий шаг'];
    var objectSets = [
      ['ring', 'cube', 'record', 'note', 'capsule'],
      ['frame', 'ring', 'cube', 'note', 'character c2'],
      ['record', 'capsule', 'ring', 'note', 'frame'],
      ['cube', 'ring', 'character c1', 'note', 'capsule'],
      ['frame', 'record', 'cube', 'note', 'character c3'],
      ['ring', 'capsule', 'frame', 'note', 'record'],
      ['cube', 'ring', 'character c2', 'note', 'frame'],
      ['record', 'frame', 'ring', 'note', 'character c3']
    ];

    var compass = document.createElement('div');
    compass.className = 'scene-compass';
    compass.setAttribute('aria-hidden', 'true');
    compass.innerHTML = '<div class="scene-compass__dial"><strong>01</strong></div><small>Живой звук</small>';
    document.body.appendChild(compass);
    var compassNumber = compass.querySelector('strong');
    var compassLabel = compass.querySelector('small');

    sections.forEach(function (section, index) {
      var scene = (index % 8) + 1;
      section.classList.add('section-world-enabled');
      section.setAttribute('data-world-scene', String(scene));

      var world = document.createElement('div');
      world.className = 'section-world';
      world.setAttribute('aria-hidden', 'true');

      objectSets[index % objectSets.length].forEach(function (definition, objectIndex) {
        var object = document.createElement(definition.indexOf('character') === 0 ? 'i' : 'span');
        object.className = 'world-object world-' + definition.replace(' ', ' world-character ');
        object.dataset.depth = String(.55 + objectIndex * .22);
        object.dataset.spin = String((objectIndex % 2 ? -1 : 1) * (8 + objectIndex * 5));
        world.appendChild(object);
      });

      section.prepend(world);

      var label = document.createElement('div');
      label.className = 'section-scene-label';
      label.setAttribute('aria-hidden', 'true');
      label.innerHTML = '<b>' + String(index + 1).padStart(2, '0') + '</b><span>' + (sceneNames[index] || 'Сцена') + '</span>';
      section.appendChild(label);

      if ([0, 1, 4, 5, 7].indexOf(index) !== -1) {
        var ticker = document.createElement('div');
        ticker.className = 'world-ticker';
        ticker.setAttribute('aria-hidden', 'true');
        var phrase = (sceneNames[index] || 'Ваш ритм').toUpperCase();
        ticker.innerHTML = '<div class="world-ticker__track"><span>' + phrase + '</span><i>✳</i><span>' + phrase + '</span><i>✳</i><span>' + phrase + '</span><i>✳</i><span>' + phrase + '</span></div>';
        section.appendChild(ticker);
      }

      if (finePointer && !reducedMotion) {
        section.addEventListener('pointermove', function (event) {
          var rect = section.getBoundingClientRect();
          var x = ((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 12;
          var y = ((event.clientY - rect.top) / Math.max(1, rect.height) - .5) * 8;
          section.style.setProperty('--pointer-x', x.toFixed(1) + 'px');
          section.style.setProperty('--pointer-y', y.toFixed(1) + 'px');
        }, { passive: true });
        section.addEventListener('pointerleave', function () {
          section.style.setProperty('--pointer-x', '0px');
          section.style.setProperty('--pointer-y', '0px');
        });
      }
    });

    var ticking = false;

    function update() {
      var viewport = window.innerHeight;
      var focusLine = viewport * .5;
      var activeIndex = 0;
      var documentMax = Math.max(1, document.documentElement.scrollHeight - viewport);
      var pageProgress = clamp(window.scrollY / documentMax, 0, 1);

      sections.forEach(function (section, index) {
        var rect = section.getBoundingClientRect();
        var travel = viewport + rect.height;
        var progress = clamp((viewport - rect.top) / Math.max(1, travel), 0, 1);
        var visible = ease(clamp(progress / .2, 0, 1)) * ease(clamp((1 - progress) / .18, 0, 1));
        var centered = progress - .5;
        var contentShift = reducedMotion ? 0 : centered * -34;
        var shadow = Math.round(10 * visible);

        section.style.setProperty('--scene-progress', progress.toFixed(4));
        section.style.setProperty('--scene-visibility', visible.toFixed(4));
        section.style.setProperty('--content-shift', contentShift.toFixed(1) + 'px');
        section.style.setProperty('--scene-shadow', shadow + 'px');
        section.style.setProperty('--ticker-x', (-8 - centered * 22).toFixed(2) + 'vw');
        if (section.classList.contains('contact')) section.style.setProperty('--contact-pulse', (visible * .035).toFixed(4));

        section.querySelectorAll('.world-object').forEach(function (object, objectIndex) {
          var depth = Number(object.dataset.depth || 1);
          var spin = Number(object.dataset.spin || 10);
          var y = reducedMotion ? 0 : centered * -170 * depth;
          var rotation = reducedMotion ? 0 : centered * spin;
          var scale = .86 + visible * .14 + objectIndex * .006;
          object.style.setProperty('--object-y', y.toFixed(1) + 'px');
          object.style.setProperty('--object-r', rotation.toFixed(1) + 'deg');
          object.style.setProperty('--object-scale', scale.toFixed(3));
          object.style.setProperty('--object-opacity', clamp(visible * (.52 + objectIndex * .09), 0, .92).toFixed(3));
        });

        if (rect.top <= focusLine && rect.bottom >= focusLine) activeIndex = index;
        else if (rect.top <= focusLine) activeIndex = index;
      });

      var hero = document.querySelector('.hero');
      var heroBottom = hero ? hero.getBoundingClientRect().bottom : -1;
      compass.classList.toggle('is-visible', heroBottom < viewport * .72 && window.scrollY < documentMax - 80);
      compassNumber.textContent = String(activeIndex + 1).padStart(2, '0');
      compassLabel.textContent = sceneNames[activeIndex] || 'Сцена';
      compass.style.setProperty('--compass-rotation', (pageProgress * 720).toFixed(1) + 'deg');
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    update();
  });
})();