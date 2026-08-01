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
  function metric(name, params) {
    try { if (typeof window.ym === 'function') window.ym(110736648, 'reachGoal', name, params || {}); } catch (_) {}
  }

  ready(function () {
    initHeroStory();
    initRhythmPassport();
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

  function initRhythmPassport() {
    var section = document.getElementById('rhythm');
    var oldGame = section && section.querySelector('[data-rhythm-game]');
    if (!section || !oldGame) return;
    section.classList.add('rhythm--passport');

    var title = section.querySelector('.section-head h2');
    var lead = section.querySelector('.section-head > p:last-child');
    if (title) title.innerHTML = 'Проверьте<br><em>свой ритм</em>';
    if (lead) lead.textContent = 'Двадцать пять секунд, чтобы узнать свой музыкальный характер. Соберите комбо, поделитесь результатом и бросьте вызов другу. Скидка — только дополнительный бонус.';

    var params = new URLSearchParams(location.search);
    var challenge = Number(params.get('challenge')) || 0;
    var challengeType = String(params.get('type') || '').replace(/[<>]/g, '').slice(0, 36);
    var dayKey = new Date().toISOString().slice(0, 10);
    var dayCode = 'RHYTHM-' + dayKey.slice(5).replace('-', '');

    var game = document.createElement('div');
    game.className = 'rhythm-passport reveal is-visible';
    game.innerHTML = [
      '<div class="rhythm-passport__top">',
        '<div class="rhythm-passport__stat"><span>Счёт</span><strong data-rp-score>0000</strong></div>',
        '<div class="rhythm-passport__stat"><span>Комбо</span><strong data-rp-combo>×0</strong></div>',
        '<div class="rhythm-passport__stat"><span>Точность</span><strong data-rp-accuracy>—</strong></div>',
        '<div class="rhythm-passport__stat"><span>Время</span><strong data-rp-time>25.0</strong></div>',
        '<div class="rhythm-passport__stat"><span>Звук</span><button type="button" data-rp-sound aria-pressed="true">Вкл. ♪</button></div>',
      '</div>',
      '<div class="rhythm-passport__stage" data-rp-stage tabindex="0" role="application" aria-label="Игра Ритм-паспорт. Нажмите пробел, Enter или коснитесь поля, когда белая точка входит в синюю мишень.">',
        '<div class="rhythm-passport__disc" aria-hidden="true"><i></i><i></i><i></i></div>',
        '<i class="rhythm-passport__target" aria-hidden="true"></i><i class="rhythm-passport__pulse" aria-hidden="true"></i>',
        '<div class="rhythm-passport__center"><strong>Лови<br>бит</strong><span>тап · клик · пробел</span></div>',
        '<div class="rhythm-passport__bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>',
      '</div>',
      '<div class="rhythm-passport__progress"><span>Дополнительный бонус · 1000 ₽</span><i><b></b></i><strong><span data-rp-goal>0</span> / 1000</strong></div>',
      '<div class="rhythm-passport__bottom"><p data-rp-status aria-live="polite">Идеальные удары ускоряют комбо и включают режим драйва.</p><button class="button button--accent button--large" type="button" data-rp-start>Начать игру <span>↗</span></button></div>',
      '<div class="rhythm-passport__intro">',
        '<small>Ритм дня · ' + dayCode + '</small><h3>Какой у вас<br><em>музыкальный характер?</em></h3>',
        '<p>' + (challenge ? 'Друг набрал ' + challenge.toLocaleString('ru-RU') + ' очков' + (challengeType ? ' и получил характер «' + challengeType + '»' : '') + '. Сможете больше?' : 'Сегодня у всех одинаковая последовательность. После игры вы получите характер и ссылку-вызов для друга.') + '</p>',
        '<div class="rhythm-passport__actions"><button class="button button--accent button--large" type="button" data-rp-intro>Проверить себя <span>↗</span></button></div>',
        '<span class="rhythm-passport__badge">25 секунд · лучший результат сохраняется</span>',
      '</div>',
      '<div class="rhythm-passport__result" hidden>',
        '<small>Ваш ритм-паспорт</small><h3 data-rp-title>Вы —<br><em>Хедлайнер</em></h3><p data-rp-copy></p>',
        '<div class="rhythm-passport__card"><div><span>Счёт</span><strong data-rp-result-score>0</strong></div><div><span>Точность</span><strong data-rp-result-accuracy>0%</strong></div><div><span>Макс. комбо</span><strong data-rp-result-combo>×0</strong></div></div>',
        '<div class="rhythm-passport__actions"><button class="button button--accent button--large" type="button" data-rp-share>Бросить вызов другу ↗</button><button class="button button--outline button--large" type="button" data-rp-replay>Ещё раз</button></div>',
        '<span class="rhythm-passport__badge" data-rp-best></span>',
      '</div>'
    ].join('');
    oldGame.replaceWith(game);

    var stage = game.querySelector('[data-rp-stage]');
    var intro = game.querySelector('.rhythm-passport__intro');
    var result = game.querySelector('.rhythm-passport__result');
    var start = game.querySelector('[data-rp-start]');
    var introStart = game.querySelector('[data-rp-intro]');
    var replay = game.querySelector('[data-rp-replay]');
    var share = game.querySelector('[data-rp-share]');
    var sound = game.querySelector('[data-rp-sound]');
    var scoreOut = game.querySelector('[data-rp-score]');
    var comboOut = game.querySelector('[data-rp-combo]');
    var accuracyOut = game.querySelector('[data-rp-accuracy]');
    var timeOut = game.querySelector('[data-rp-time]');
    var goalOut = game.querySelector('[data-rp-goal]');
    var status = game.querySelector('[data-rp-status]');
    var resultTitle = game.querySelector('[data-rp-title]');
    var resultCopy = game.querySelector('[data-rp-copy]');
    var resultScore = game.querySelector('[data-rp-result-score]');
    var resultAccuracy = game.querySelector('[data-rp-result-accuracy]');
    var resultCombo = game.querySelector('[data-rp-result-combo]');
    var bestOut = game.querySelector('[data-rp-best]');
    var reward = section.querySelector('[data-game-reward]');

    var duration = 25000, goal = 1000, running = false, frame = 0, startedAt = 0, lastTap = 0;
    var score = 0, combo = 0, maxCombo = 0, attempts = 0, hits = 0, perfects = 0;
    var targetAngle = 42, pulseAngle = 0, targetIndex = 0, lastBeat = -1;
    var soundOn = true, audioContext = null, finalCharacter = null;
    var bestKey = 'vlad-rhythm-passport-' + dayKey;
    var bestScore = readBest();
    var random = seeded(hash(dayKey));
    var sequence = Array.from({ length: 90 }, function () { return Math.round(random() * 270 + 70); });

    function hash(value) { var h = 2166136261; for (var i = 0; i < value.length; i += 1) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function seeded(seed) { var state = seed || 1; return function () { state += 0x6D2B79F5; var t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function readBest() { try { return Number(localStorage.getItem(bestKey)) || 0; } catch (_) { return 0; } }
    function writeBest(value) { try { localStorage.setItem(bestKey, String(value)); } catch (_) {} }
    function angleDistance(a, b) { return ((a - b + 540) % 360) - 180; }
    function setTarget(value) { targetAngle = value % 360; stage.style.setProperty('--target-angle', targetAngle.toFixed(2) + 'deg'); }
    function nextTarget() { setTarget((targetAngle + sequence[targetIndex++ % sequence.length]) % 360); }

    function audio() {
      if (!soundOn) return null;
      try { audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume(); return audioContext; } catch (_) { return null; }
    }
    function tone(freq, length, volume, type) {
      var ctx = audio(); if (!ctx) return;
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type || 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(volume || .045, ctx.currentTime + .006); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + length);
      osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + length + .02);
    }
    function beatSound(beat) { if (beat % 4 === 0) tone(92, .08, .045); else if (beat % 2 === 0) tone(190, .035, .022, 'triangle'); else tone(480, .018, .01, 'square'); }

    function state(name) { game.classList.remove('is-perfect', 'is-hit', 'is-miss'); game.classList.add(name); setTimeout(function () { game.classList.remove(name); }, 170); }
    function toast(text, hot) { var node = document.createElement('span'); node.className = 'rhythm-toast'; node.textContent = text; if (hot) node.style.background = '#ffcf3d'; stage.appendChild(node); setTimeout(function () { node.remove(); }, 740); }
    function burst(color) {
      for (var i = 0; i < 10; i += 1) { var p = document.createElement('i'); p.className = 'rhythm-particle'; var a = (Math.PI * 2 / 10) * i; var d = 65 + Math.random() * 70; p.style.setProperty('--px', (Math.cos(a) * d).toFixed(1) + 'px'); p.style.setProperty('--py', (Math.sin(a) * d).toFixed(1) + 'px'); p.style.setProperty('--pc', color); stage.appendChild(p); setTimeout(function (node) { node.remove(); }, 760, p); }
    }
    function update(remaining) {
      var accuracy = attempts ? Math.round(hits / attempts * 100) : 0;
      scoreOut.textContent = String(score).padStart(4, '0'); comboOut.textContent = '×' + combo; accuracyOut.textContent = attempts ? accuracy + '%' : '—'; timeOut.textContent = (Math.max(0, remaining) / 1000).toFixed(1); goalOut.textContent = String(Math.min(goal, score));
      game.style.setProperty('--game-progress', clamp(score / goal, 0, 1).toFixed(4)); game.classList.toggle('is-fever', combo >= 8);
    }
    function character(accuracy) {
      var perfectRate = hits ? perfects / hits : 0;
      if (accuracy >= 92 && perfectRate >= .5) return { name: 'Метроном', slug: 'metronom', copy: 'Вы слышите доли почти раньше, чем они звучат. Точность — ваша суперсила.' };
      if (maxCombo >= 10 || score >= 1850) return { name: 'Хедлайнер', slug: 'headliner', copy: 'Вы быстро ловите зал и держите энергию до финала. Люди идут за вашим темпом.' };
      if (perfectRate >= .35) return { name: 'Создатель атмосферы', slug: 'atmosphere', copy: 'Вы не гонитесь за скоростью — вы точно чувствуете момент, когда нужно вступить.' };
      if (accuracy >= 65) return { name: 'Импровизатор', slug: 'improviser', copy: 'Вы играете смело, рискуете и находите ритм прямо в движении.' };
      return { name: 'Охотник за битом', slug: 'beat-hunter', copy: 'Вы разгоняетесь через практику. Ещё одна попытка — и комбо станет длиннее.' };
    }
    function finish() {
      if (!running) return; running = false; cancelAnimationFrame(frame); game.classList.remove('is-playing', 'is-fever');
      var accuracy = attempts ? Math.round(hits / attempts * 100) : 0; finalCharacter = character(accuracy); bestScore = Math.max(bestScore, score); writeBest(bestScore);
      resultTitle.innerHTML = 'Вы —<br><em>' + finalCharacter.name + '</em>'; resultCopy.textContent = finalCharacter.copy; resultScore.textContent = score.toLocaleString('ru-RU'); resultAccuracy.textContent = accuracy + '%'; resultCombo.textContent = '×' + maxCombo; bestOut.textContent = 'Лучший результат сегодня · ' + bestScore.toLocaleString('ru-RU');
      result.hidden = false; start.disabled = false; start.innerHTML = 'Ещё раз <span>↗</span>'; status.textContent = 'Ритм-паспорт готов. Поделитесь им или улучшите результат.';
      if (score >= goal && reward) { reward.hidden = false; try { localStorage.setItem('vlad-rhythm-reward-1000', 'unlocked'); } catch (_) {} }
      metric('rhythm_passport_finish', { score: score, accuracy: accuracy, character: finalCharacter.slug }); tone(660, .12, .055, 'triangle'); setTimeout(function () { tone(880, .18, .045, 'triangle'); }, 90);
    }
    function render(now) {
      if (!running) return; var elapsed = now - startedAt, remaining = duration - elapsed, progress = clamp(elapsed / duration, 0, 1), bpm = 104 + progress * 34, speed = bpm * 360 / 60000;
      pulseAngle = elapsed * speed % 360; stage.style.setProperty('--pulse-angle', pulseAngle.toFixed(2) + 'deg');
      var beat = Math.floor(elapsed / (60000 / bpm)); if (beat !== lastBeat) { lastBeat = beat; beatSound(beat); }
      update(remaining); if (remaining <= 0) { finish(); return; } frame = requestAnimationFrame(render);
    }
    function startGame() {
      cancelAnimationFrame(frame); audio(); running = true; startedAt = performance.now(); lastTap = 0; lastBeat = -1; score = 0; combo = 0; maxCombo = 0; attempts = 0; hits = 0; perfects = 0; targetIndex = 0; pulseAngle = 0;
      intro.hidden = true; result.hidden = true; game.classList.add('is-playing'); game.classList.remove('is-fever', 'is-perfect', 'is-hit', 'is-miss'); setTarget(42); nextTarget(); update(duration); status.textContent = 'После восьми попаданий подряд включится режим драйва.'; start.textContent = 'Игра идёт…'; stage.focus({ preventScroll: true }); metric('rhythm_passport_start'); frame = requestAnimationFrame(render);
    }
    function hit() {
      if (!running) { startGame(); return; } var now = performance.now(); if (now - lastTap < 115) return; lastTap = now; attempts += 1;
      var signed = angleDistance(pulseAngle, targetAngle), distance = Math.abs(signed), earned = 0, label = '', className = '';
      if (distance <= 9) { perfects += 1; hits += 1; combo += 1; earned = 145; label = 'ИДЕАЛЬНО'; className = 'is-perfect'; tone(820, .075, .05, 'triangle'); burst('#ffcf3d'); }
      else if (distance <= 18) { hits += 1; combo += 1; earned = 100; label = 'ТОЧНО'; className = 'is-hit'; tone(590, .06, .04); burst('#fff'); }
      else if (distance <= 29) { hits += 1; combo += 1; earned = 65; label = 'ЕСТЬ'; className = 'is-hit'; tone(430, .05, .03); burst('#2457ff'); }
      else { combo = 0; label = signed < 0 ? 'РАНО' : 'ПОЗДНО'; className = 'is-miss'; tone(155, .07, .03, 'square'); }
      maxCombo = Math.max(maxCombo, combo);
      if (earned) { var mult = Math.min(2.5, 1 + Math.floor(combo / 4) * .25) + (combo >= 8 ? .25 : 0); earned = Math.round(earned * mult); score += earned; toast('+' + earned + ' · ' + label, combo >= 8 || distance <= 9); status.textContent = combo >= 8 ? 'Режим драйва! Удерживайте комбо.' : 'Есть ритм. Следующая мишень.'; }
      else { toast(label, false); status.textContent = label === 'РАНО' ? 'Чуть рано. Дождитесь синей зоны.' : 'Чуть поздно. Нажмите на долю раньше.'; }
      state(className); nextTarget(); update(Math.max(0, duration - (now - startedAt)));
    }
    function shareResult() {
      if (!finalCharacter) return; var accuracy = attempts ? Math.round(hits / attempts * 100) : 0; var url = new URL(location.href); url.hash = 'rhythm'; url.searchParams.set('challenge', String(score)); url.searchParams.set('type', finalCharacter.name); var text = 'Мой музыкальный характер — «' + finalCharacter.name + '». ' + score.toLocaleString('ru-RU') + ' очков, точность ' + accuracy + '%. Побьёшь мой ритм?'; metric('rhythm_passport_share', { score: score, character: finalCharacter.slug });
      if (navigator.share) { navigator.share({ title: 'Ритм-паспорт', text: text, url: url.toString() }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url.toString()).then(function () { var old = share.textContent; share.textContent = 'Ссылка скопирована ✓'; setTimeout(function () { share.textContent = old; }, 1800); }).catch(function () {});
    }

    start.addEventListener('click', startGame); introStart.addEventListener('click', startGame); replay.addEventListener('click', startGame); share.addEventListener('click', shareResult);
    sound.addEventListener('click', function () { soundOn = !soundOn; sound.setAttribute('aria-pressed', String(soundOn)); sound.textContent = soundOn ? 'Вкл. ♪' : 'Выкл.'; if (soundOn) tone(520, .06, .04); });
    stage.addEventListener('pointerdown', function (event) { event.preventDefault(); hit(); });
    stage.addEventListener('keydown', function (event) { if (event.code !== 'Space' && event.code !== 'Enter') return; event.preventDefault(); hit(); });
    if (bestScore) bestOut.textContent = 'Лучший результат сегодня · ' + bestScore.toLocaleString('ru-RU');
  }
})();
