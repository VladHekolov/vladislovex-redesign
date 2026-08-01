'use strict';

(function () {
  function ready(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function metric(name, params) {
    try {
      if (typeof window.ym === 'function') window.ym(110736648, 'reachGoal', name, params || {});
    } catch (_) {}
  }

  ready(function () {
    var section = document.getElementById('rhythm');
    if (!section) return;

    var previousGame = section.querySelector('.rhythm-passport, .rhythm-runner, [data-rhythm-game]');
    if (!previousGame) return;

    var rewardThreshold = 100;
    var promoCode = 'VIDEO1000';
    var bestKey = 'vlad-runner-best-v2';
    var rewardKey = 'vlad-runner-video-review-reward-v2';
    var challenge = Number(new URLSearchParams(location.search).get('run')) || 0;
    var best = readNumber(bestKey);
    var rewardUnlocked = readReward();

    section.classList.remove('rhythm--passport', 'rhythm--runner');
    section.classList.add('rhythm--runner-v2');

    var oldReward = section.querySelector('[data-game-reward]');
    if (oldReward) oldReward.hidden = true;

    var heading = section.querySelector('.section-head h2');
    var description = section.querySelector('.section-head > p:last-child');
    if (heading) heading.innerHTML = 'Не сбейте<br><em>мой ритм</em>';
    if (description) description.textContent = 'Минималистичный раннер в духе игры с динозавром. Перепрыгивайте сценическое оборудование, держите серию и добегите до 100 метров, чтобы открыть скидку 1000 ₽ за видеоотзыв.';

    var game = document.createElement('div');
    game.className = 'rhythm-runner-v2 reveal is-visible';
    game.innerHTML = [
      '<div class="runner-v2__hud">',
        '<p><span>Дистанция</span><strong data-v2-distance>000 м</strong></p>',
        '<p><span>Серия</span><strong data-v2-combo>×0</strong></p>',
        '<p><span>Этап</span><strong data-v2-phase>Саундчек</strong></p>',
        '<p><span>Рекорд</span><strong data-v2-best>' + pad(best) + ' м</strong></p>',
        '<button type="button" data-v2-sound aria-pressed="true"><span>Звук</span><strong>Вкл. ♪</strong></button>',
      '</div>',

      '<div class="runner-v2__stage" data-v2-stage tabindex="0" role="application" aria-label="Игра Не сбей ритм, версия 2. Нажмите пробел, Enter, стрелку вверх или коснитесь поля, чтобы прыгнуть.">',
        '<canvas data-v2-canvas aria-hidden="true"></canvas>',
        '<div class="runner-v2__feedback" data-v2-feedback aria-live="polite"></div>',
        '<div class="runner-v2__overlay" data-v2-intro>',
          '<small>Версия 2 · один тап</small>',
          '<h3>Доберитесь<br><em>до сцены</em></h3>',
          '<p>' + (challenge ? 'Друг пробежал ' + challenge + ' м. Побейте его результат и не сбейте ритм.' : 'Клик, тап или пробел — прыжок. Удерживайте немного дольше, чтобы перелететь высокое препятствие.') + '</p>',
          '<div class="runner-v2__reward-ticket' + (rewardUnlocked ? ' is-unlocked' : '') + '">',
            '<span>' + (rewardUnlocked ? 'Награда уже открыта' : 'Добегите до ' + rewardThreshold + ' м') + '</span>',
            '<strong>−1000 ₽</strong>',
            '<small>за короткий видеоотзыв после мероприятия</small>',
          '</div>',
          '<button class="button button--accent button--large" type="button" data-v2-start>Начать забег <span>↗</span></button>',
          '<span class="runner-v2__controls">тап · клик · пробел</span>',
        '</div>',

        '<div class="runner-v2__overlay runner-v2__overlay--result" data-v2-result hidden>',
          '<small data-v2-result-kicker>Ритм сбился</small>',
          '<h3><strong data-v2-result-distance>0</strong> м<br><em data-v2-result-title>Разогрев</em></h3>',
          '<p data-v2-result-copy></p>',
          '<div class="runner-v2__reward-card" data-v2-reward-card hidden>',
            '<div><span>Реальная награда</span><strong>−1000 ₽</strong></div>',
            '<p>Скидка на одно выступление. Условие — после мероприятия прислать короткий честный видеоотзыв. Назовите промокод до бронирования. С другими скидками не суммируется.</p>',
            '<div class="runner-v2__promo"><span>Промокод</span><strong>' + promoCode + '</strong></div>',
            '<button class="button button--accent" type="button" data-v2-claim>Сохранить скидку ↗</button>',
          '</div>',
          '<div class="runner-v2__actions">',
            '<button class="button button--accent button--large" type="button" data-v2-restart>Ещё раз <span>↗</span></button>',
            '<button class="button button--outline button--large" type="button" data-v2-share>Бросить вызов</button>',
          '</div>',
          '<span data-v2-result-best></span>',
        '</div>',

        '<div class="runner-v2__tap-hint" data-v2-hint>Нажмите, чтобы прыгнуть</div>',
      '</div>',

      '<div class="runner-v2__reward-progress' + (rewardUnlocked ? ' is-unlocked' : '') + '" data-v2-reward-progress>',
        '<div>',
          '<span data-v2-reward-label>' + (rewardUnlocked ? 'Награда открыта' : 'До скидки за видеоотзыв') + '</span>',
          '<strong data-v2-reward-value>' + (rewardUnlocked ? '−1000 ₽' : rewardThreshold + ' м') + '</strong>',
        '</div>',
        '<i><b data-v2-reward-bar></b></i>',
        '<p data-v2-reward-copy>' + (rewardUnlocked ? 'Промокод ' + promoCode + ' сохранён на этом устройстве.' : 'Добегите до ' + rewardThreshold + ' метров. Скидка действует при условии видеоотзыва после мероприятия.') + '</p>',
      '</div>',

      '<div class="runner-v2__footer">',
        '<p data-v2-status>Первый тап запускает игру и сразу выполняет прыжок.</p>',
        '<span data-v2-target>' + (challenge ? 'Цель друга · ' + challenge + ' м' : 'Версия 2 · честная физика прыжка') + '</span>',
      '</div>'
    ].join('');

    previousGame.replaceWith(game);

    var stage = game.querySelector('[data-v2-stage]');
    var canvas = game.querySelector('[data-v2-canvas]');
    var context = canvas.getContext('2d');
    var intro = game.querySelector('[data-v2-intro]');
    var result = game.querySelector('[data-v2-result]');
    var startButton = game.querySelector('[data-v2-start]');
    var restartButton = game.querySelector('[data-v2-restart]');
    var shareButton = game.querySelector('[data-v2-share]');
    var claimButton = game.querySelector('[data-v2-claim]');
    var soundButton = game.querySelector('[data-v2-sound]');
    var distanceOutput = game.querySelector('[data-v2-distance]');
    var comboOutput = game.querySelector('[data-v2-combo]');
    var phaseOutput = game.querySelector('[data-v2-phase]');
    var bestOutput = game.querySelector('[data-v2-best]');
    var statusOutput = game.querySelector('[data-v2-status]');
    var resultDistance = game.querySelector('[data-v2-result-distance]');
    var resultTitle = game.querySelector('[data-v2-result-title]');
    var resultCopy = game.querySelector('[data-v2-result-copy]');
    var resultBest = game.querySelector('[data-v2-result-best]');
    var resultKicker = game.querySelector('[data-v2-result-kicker]');
    var rewardCard = game.querySelector('[data-v2-reward-card]');
    var rewardProgress = game.querySelector('[data-v2-reward-progress]');
    var rewardLabel = game.querySelector('[data-v2-reward-label]');
    var rewardValue = game.querySelector('[data-v2-reward-value]');
    var rewardBar = game.querySelector('[data-v2-reward-bar]');
    var rewardCopy = game.querySelector('[data-v2-reward-copy]');
    var feedback = game.querySelector('[data-v2-feedback]');
    var hint = game.querySelector('[data-v2-hint]');

    var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var width = 0;
    var height = 0;
    var groundY = 0;
    var running = false;
    var frame = 0;
    var lastTime = 0;
    var elapsed = 0;
    var distance = 0;
    var finalDistance = 0;
    var combo = 0;
    var speed = 285;
    var spawnTimer = 0;
    var nextSpawn = 1120;
    var beatTimer = 0;
    var holding = false;
    var holdTime = 0;
    var jumpBuffer = 0;
    var coyoteTime = 0;
    var soundOn = true;
    var audioContext = null;
    var feedbackTimer = 0;
    var phaseIndex = 0;
    var phasePulse = 0;
    var rewardFlash = 0;
    var obstacles = [];
    var particles = [];
    var backgroundDots = [];

    var phases = [
      { at: 0, name: 'Саундчек', word: 'ЗВУК', bpm: 100 },
      { at: 35, name: 'Разогрев', word: 'ТЕМП', bpm: 108 },
      { at: 75, name: 'Сцена', word: 'СЦЕНА', bpm: 116 },
      { at: 130, name: 'Драйв', word: 'ДРАЙВ', bpm: 126 },
      { at: 210, name: 'Финал', word: 'ФИНАЛ', bpm: 138 }
    ];

    var player = {
      x: 0,
      y: 0,
      width: 50,
      height: 72,
      velocityY: 0,
      grounded: true,
      runPhase: 0,
      squash: 1
    };

    function readNumber(key) {
      try { return Number(localStorage.getItem(key)) || 0; } catch (_) { return 0; }
    }

    function readReward() {
      try { return localStorage.getItem(rewardKey) === 'unlocked'; } catch (_) { return false; }
    }

    function writeNumber(key, value) {
      try { localStorage.setItem(key, String(value)); } catch (_) {}
    }

    function writeReward() {
      try {
        localStorage.setItem(rewardKey, 'unlocked');
        localStorage.setItem(rewardKey + '-code', promoCode);
      } catch (_) {}
    }

    function pad(value) {
      return String(Math.max(0, Math.floor(value))).padStart(3, '0');
    }

    function resize() {
      var rect = stage.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(390, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      groundY = height * .79;
      player.x = width * .17;
      if (!running || player.grounded) player.y = groundY - player.height;
      createBackgroundDots();
      draw();
    }

    function createBackgroundDots() {
      backgroundDots = Array.from({ length: reducedMotion ? 5 : 15 }, function (_, index) {
        return {
          x: (index * 137 + 31) % Math.max(1, width),
          y: 44 + ((index * 71) % Math.max(70, groundY - 125)),
          size: index % 4 === 0 ? 2.5 : 1.2,
          depth: .05 + (index % 5) * .025
        };
      });
    }

    function audio() {
      if (!soundOn) return null;
      try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();
        return audioContext;
      } catch (_) { return null; }
    }

    function tone(frequency, duration, volume, type, delay) {
      var ctx = audio();
      if (!ctx) return;
      var startAt = ctx.currentTime + (delay || 0);
      var oscillator = ctx.createOscillator();
      var gain = ctx.createGain();
      oscillator.type = type || 'sine';
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(volume || .03, startAt + .006);
      gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + .03);
    }

    function successChord() {
      tone(520, .07, .027, 'triangle');
      tone(660, .08, .024, 'triangle', .045);
      tone(820, .1, .022, 'triangle', .09);
    }

    function showFeedback(text, kind, duration) {
      feedback.textContent = text;
      feedback.className = 'runner-v2__feedback is-visible ' + (kind || '');
      feedbackTimer = duration || .7;
    }

    function currentPhaseIndex() {
      var index = 0;
      for (var i = 0; i < phases.length; i += 1) {
        if (distance >= phases[i].at) index = i;
      }
      return index;
    }

    function reset() {
      cancelAnimationFrame(frame);
      running = false;
      obstacles = [];
      particles = [];
      elapsed = 0;
      distance = 0;
      finalDistance = 0;
      combo = 0;
      speed = 285;
      spawnTimer = 0;
      nextSpawn = 1120;
      beatTimer = 0;
      holding = false;
      holdTime = 0;
      jumpBuffer = 0;
      coyoteTime = .1;
      feedbackTimer = 0;
      phaseIndex = 0;
      phasePulse = 0;
      rewardFlash = 0;
      player.y = groundY - player.height;
      player.velocityY = 0;
      player.grounded = true;
      player.runPhase = 0;
      player.squash = 1;
      result.hidden = true;
      intro.hidden = true;
      rewardCard.hidden = !rewardUnlocked;
      hint.classList.add('is-visible');
      statusOutput.textContent = 'Прыгайте в своём темпе. Управление прощает нажатие за мгновение до приземления.';
      updateHud();
      updateRewardUi();
      draw();
    }

    function start(performJump) {
      reset();
      running = true;
      lastTime = performance.now();
      stage.focus({ preventScroll: true });
      if (performJump) {
        jumpBuffer = .14;
        holding = true;
      }
      metric('runner_v2_start');
      tone(390, .06, .03, 'triangle');
      frame = requestAnimationFrame(loop);
    }

    function requestJump() {
      if (!running) {
        start(true);
        return;
      }
      jumpBuffer = .14;
      holding = true;
      hint.classList.remove('is-visible');
    }

    function releaseJump() {
      holding = false;
      if (player.velocityY < -height * .43) player.velocityY *= .7;
    }

    function performJump() {
      jumpBuffer = 0;
      coyoteTime = 0;
      holdTime = 0;
      player.grounded = false;
      player.velocityY = -height * 1.01;
      player.squash = .82;
      tone(510 + Math.min(combo, 8) * 12, .055, .03, 'triangle');
      burst(player.x + player.width * .35, groundY - 3, '#2457ff', 7);
    }

    function obstacleDefinition(type) {
      if (type === 'cable') return { width: 54, height: 17 };
      if (type === 'case') return { width: 76, height: 37 };
      if (type === 'speaker') return { width: 58, height: 66 };
      if (type === 'stand') return { width: 34, height: 86 };
      return { width: 48, height: 52 };
    }

    function chooseObstacle() {
      if (distance < 35) return Math.random() < .55 ? 'cable' : 'case';
      if (distance < 75) return ['cable', 'case', 'speaker'][Math.floor(Math.random() * 3)];
      if (distance < 140) return ['cable', 'case', 'speaker', 'stand'][Math.floor(Math.random() * 4)];
      return ['cable', 'case', 'speaker', 'stand', 'monitor'][Math.floor(Math.random() * 5)];
    }

    function addObstacle(type, x) {
      var definition = obstacleDefinition(type);
      obstacles.push({
        type: type,
        x: x,
        y: groundY - definition.height,
        width: definition.width,
        height: definition.height,
        passed: false,
        minClearance: Infinity
      });
    }

    function spawnObstacle() {
      var startX = width + 42;
      addObstacle(chooseObstacle(), startX);

      if (distance > 155 && Math.random() < .18) {
        var gap = clamp(speed * .55, 185, 255);
        addObstacle(Math.random() < .65 ? 'cable' : 'case', startX + gap);
      }

      var base = clamp(1450 - speed * 1.12, 720, 1120);
      nextSpawn = base + Math.random() * 300;
      if (distance > 230 && Math.random() < .18) nextSpawn *= .82;
    }

    function burst(x, y, color, count) {
      if (reducedMotion) count = Math.min(3, count);
      for (var index = 0; index < count; index += 1) {
        particles.push({
          x: x,
          y: y,
          velocityX: -30 - Math.random() * 125,
          velocityY: -35 - Math.random() * 110,
          life: .42 + Math.random() * .26,
          age: 0,
          size: 2 + Math.random() * 4,
          color: color
        });
      }
    }

    function collide(a, b) {
      var playerLeft = a.x + 11;
      var playerRight = a.x + a.width - 11;
      var playerTop = a.y + 9;
      var playerBottom = a.y + a.height - 5;
      var obstacleLeft = b.x + 4;
      var obstacleRight = b.x + b.width - 4;
      var obstacleTop = b.y + 3;
      return playerLeft < obstacleRight && playerRight > obstacleLeft && playerTop < b.y + b.height && playerBottom > obstacleTop;
    }

    function titleForScore(value) {
      if (value >= 500) return { title: 'Соседи вызвали полицию', copy: 'Ваш ритм оказался громче всего района. Это уже не забег, а полноценный фестиваль.' };
      if (value >= 300) return { title: 'Легенда вечера', copy: 'Вы сохранили темп от саундчека до финального аккорда.' };
      if (value >= 150) return { title: 'Хедлайнер', copy: 'Сцена ваша: скорость выросла, а вы продолжаете вести музыку вперёд.' };
      if (value >= rewardThreshold) return { title: 'Награда открыта', copy: 'Вы добрались до сцены и открыли скидку 1000 ₽ за видеоотзыв.' };
      if (value >= 55) return { title: 'Музыкант', copy: 'Ритм уже найден. До реальной награды осталось совсем немного.' };
      return { title: 'Разогрев', copy: 'Первая попытка пройдена. Короткий тап даёт низкий прыжок, удержание — высокий.' };
    }

    function unlockReward() {
      if (rewardUnlocked) return;
      rewardUnlocked = true;
      writeReward();
      rewardFlash = 1;
      rewardCard.hidden = false;
      game.classList.add('has-reward');
      showFeedback('НАГРАДА ОТКРЫТА · −1000 ₽', 'is-reward', 1.8);
      successChord();
      updateRewardUi();
      metric('runner_v2_reward_unlock', { distance: Math.floor(distance), promo: promoCode });
    }

    function updateHud() {
      distanceOutput.textContent = pad(distance) + ' м';
      comboOutput.textContent = '×' + combo;
      phaseOutput.textContent = phases[phaseIndex].name;
      bestOutput.textContent = pad(best) + ' м';
      game.classList.toggle('is-fever', combo >= 8);
      game.style.setProperty('--run-progress', clamp(distance / rewardThreshold, 0, 1).toFixed(4));
    }

    function updateRewardUi() {
      if (rewardUnlocked) {
        rewardProgress.classList.add('is-unlocked');
        rewardLabel.textContent = 'Награда открыта';
        rewardValue.textContent = '−1000 ₽';
        rewardCopy.textContent = 'Промокод ' + promoCode + ' сохранён на этом устройстве.';
        rewardBar.style.transform = 'scaleX(1)';
        return;
      }
      var remaining = Math.max(0, rewardThreshold - Math.floor(distance));
      rewardProgress.classList.remove('is-unlocked');
      rewardLabel.textContent = 'До скидки за видеоотзыв';
      rewardValue.textContent = remaining + ' м';
      rewardCopy.textContent = 'Добегите до ' + rewardThreshold + ' метров. Скидка действует при условии видеоотзыва после мероприятия.';
      rewardBar.style.transform = 'scaleX(' + clamp(distance / rewardThreshold, 0, 1).toFixed(4) + ')';
    }

    function finish() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
      finalDistance = Math.floor(distance);
      best = Math.max(best, finalDistance);
      writeNumber(bestKey, best);
      updateHud();
      updateRewardUi();

      var rank = titleForScore(finalDistance);
      resultDistance.textContent = String(finalDistance);
      resultTitle.textContent = rank.title;
      resultCopy.textContent = rank.copy;
      resultBest.textContent = 'Ваш рекорд · ' + best + ' м';
      resultKicker.textContent = rewardUnlocked ? 'Забег завершён · награда сохранена' : 'Ритм сбился';
      rewardCard.hidden = !rewardUnlocked;
      result.hidden = false;
      hint.classList.remove('is-visible');
      statusOutput.textContent = rewardUnlocked ? 'Промокод сохранён. Можно улучшить рекорд или забронировать дату.' : 'Рестарт мгновенный. До скидки осталось ' + Math.max(0, rewardThreshold - finalDistance) + ' м.';
      tone(175, .18, .045, 'sawtooth');
      tone(110, .22, .03, 'triangle', .09);
      metric('runner_v2_finish', { distance: finalDistance, best: best, reward: rewardUnlocked });
    }

    function update(delta) {
      elapsed += delta;
      distance += speed * delta * .012;
      speed = Math.min(625, 285 + elapsed * 6.6 + distance * .36);
      player.runPhase += delta * speed * .034;
      player.squash += (1 - player.squash) * Math.min(1, delta * 13);
      phasePulse = Math.max(0, phasePulse - delta * 2.3);
      rewardFlash = Math.max(0, rewardFlash - delta * .75);

      var nextPhase = currentPhaseIndex();
      if (nextPhase !== phaseIndex) {
        phaseIndex = nextPhase;
        phasePulse = 1;
        showFeedback(phases[phaseIndex].name.toUpperCase(), 'is-phase', 1);
        tone(440 + phaseIndex * 70, .08, .025, 'triangle');
        tone(590 + phaseIndex * 55, .1, .021, 'triangle', .055);
      }

      if (!rewardUnlocked && distance >= rewardThreshold) unlockReward();

      jumpBuffer = Math.max(0, jumpBuffer - delta);
      if (player.grounded) coyoteTime = .1;
      else coyoteTime = Math.max(0, coyoteTime - delta);

      if (jumpBuffer > 0 && coyoteTime > 0) performJump();

      if (holding && !player.grounded && holdTime < .16 && player.velocityY < 0) {
        player.velocityY -= height * .7 * delta;
        holdTime += delta;
      }

      player.velocityY += height * 2.85 * delta;
      player.y += player.velocityY * delta;

      if (player.y >= groundY - player.height) {
        if (!player.grounded && player.velocityY > height * .28) {
          burst(player.x + player.width * .42, groundY - 2, '#11110f', 5);
          player.squash = 1.14;
        }
        player.y = groundY - player.height;
        player.velocityY = 0;
        player.grounded = true;
        holdTime = 0;
        if (jumpBuffer > 0) performJump();
      } else {
        player.grounded = false;
      }

      spawnTimer += delta * 1000;
      if (spawnTimer >= nextSpawn) {
        spawnTimer = 0;
        spawnObstacle();
      }

      beatTimer += delta * 1000;
      var bpm = phases[phaseIndex].bpm + Math.min(16, distance * .045);
      var beatLength = 60000 / bpm;
      if (beatTimer >= beatLength) {
        beatTimer %= beatLength;
        tone(combo >= 8 ? 170 : 108, .035, combo >= 8 ? .018 : .01, 'triangle');
      }

      obstacles.forEach(function (obstacle) {
        obstacle.x -= speed * delta;

        var overlapsHorizontally = player.x + player.width > obstacle.x && player.x < obstacle.x + obstacle.width;
        if (overlapsHorizontally && player.y + player.height <= obstacle.y + 2) {
          obstacle.minClearance = Math.min(obstacle.minClearance, obstacle.y - (player.y + player.height));
        }

        if (!obstacle.passed && obstacle.x + obstacle.width < player.x + 5) {
          obstacle.passed = true;
          var clean = obstacle.minClearance < 22;
          combo += 1;
          if (clean) {
            showFeedback('ЧИСТО · ×' + combo, 'is-clean', .55);
            tone(730, .045, .022, 'triangle');
            burst(obstacle.x + obstacle.width, obstacle.y, '#2457ff', 7);
          } else {
            tone(combo % 4 === 0 ? 680 : 590, .04, .017, 'triangle');
            burst(obstacle.x + obstacle.width, obstacle.y, combo >= 8 ? '#ffcf3d' : '#2457ff', 4);
          }
          if (combo > 0 && combo % 8 === 0) {
            showFeedback('ДРАЙВ ×' + combo, 'is-combo', .8);
            successChord();
          }
        }

        if (collide(player, obstacle)) finish();
      });

      obstacles = obstacles.filter(function (obstacle) { return obstacle.x + obstacle.width > -90; });

      particles.forEach(function (particle) {
        particle.age += delta;
        particle.x += particle.velocityX * delta;
        particle.y += particle.velocityY * delta;
        particle.velocityY += 270 * delta;
      });
      particles = particles.filter(function (particle) { return particle.age < particle.life; });

      if (feedbackTimer > 0) {
        feedbackTimer -= delta;
        if (feedbackTimer <= 0) feedback.className = 'runner-v2__feedback';
      }

      updateHud();
      updateRewardUi();
    }

    function line(x1, y1, x2, y2, widthValue, color) {
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.lineWidth = widthValue;
      context.strokeStyle = color || '#11110f';
      context.lineCap = 'round';
      context.stroke();
    }

    function roundedRect(x, y, w, h, radius) {
      var r = Math.min(radius, w * .5, h * .5);
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + w, y, x + w, y + h, r);
      context.arcTo(x + w, y + h, x, y + h, r);
      context.arcTo(x, y + h, x, y, r);
      context.arcTo(x, y, x + w, y, r);
      context.closePath();
    }

    function drawBackground() {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#f7f7f3';
      context.fillRect(0, 0, width, height);

      var phase = phases[phaseIndex];
      var blueAlpha = .035 + phaseIndex * .012 + rewardFlash * .09;
      context.fillStyle = 'rgba(36,87,255,' + blueAlpha.toFixed(3) + ')';
      context.fillRect(0, 0, width, height);

      backgroundDots.forEach(function (dot, index) {
        var offset = running ? (distance * dot.depth * 11) % (width + 100) : 0;
        var x = (dot.x - offset + width + 100) % (width + 100) - 50;
        context.fillStyle = index % 5 === 0 ? 'rgba(36,87,255,.72)' : 'rgba(17,17,15,.18)';
        context.beginPath();
        context.arc(x, dot.y, dot.size, 0, Math.PI * 2);
        context.fill();
      });

      context.save();
      context.globalAlpha = .035 + phasePulse * .055;
      context.fillStyle = '#11110f';
      context.font = '700 ' + Math.max(64, width * .105) + 'px Manrope, Arial';
      context.textAlign = 'right';
      context.fillText(phase.word, width - 25, groundY - 78);
      context.restore();

      if (!rewardUnlocked && distance > rewardThreshold - 32 && distance < rewardThreshold) {
        var remaining = rewardThreshold - distance;
        var gateX = width * .84 - (32 - remaining) / 32 * width * .5;
        context.strokeStyle = '#2457ff';
        context.lineWidth = 2;
        context.setLineDash([5, 7]);
        context.strokeRect(gateX - 27, groundY - 118, 54, 118);
        context.setLineDash([]);
        context.fillStyle = '#2457ff';
        context.font = '700 11px Manrope, Arial';
        context.textAlign = 'center';
        context.fillText('100 М', gateX, groundY - 128);
      }

      line(0, groundY, width, groundY, 3);
      var dashOffset = running ? -((distance * 7.5) % 48) : 0;
      context.save();
      context.setLineDash([17, 31]);
      context.lineDashOffset = dashOffset;
      line(0, groundY + 14, width, groundY + 14, 2, 'rgba(17,17,15,.21)');
      context.restore();
    }

    function drawPlayer() {
      var x = player.x;
      var y = player.y;
      var centerX = x + player.width * .5;
      var bob = player.grounded ? Math.sin(player.runPhase) * 2 : 0;
      var legSwing = player.grounded ? Math.sin(player.runPhase) * 10 : 2;

      context.save();
      context.translate(centerX, y + player.height);
      context.scale(1 / player.squash, player.squash);
      context.translate(-centerX, -(y + player.height));

      context.fillStyle = '#f7f7f3';
      context.strokeStyle = '#11110f';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(centerX, y + 13 + bob, 9.5, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      line(centerX, y + 24 + bob, centerX - 1, y + 50 + bob, 4);
      line(centerX, y + 32 + bob, centerX + 15, y + 41 + bob, 3);
      line(centerX, y + 33 + bob, centerX - 14, y + 44 + bob, 3);

      context.fillStyle = '#2457ff';
      context.strokeStyle = '#11110f';
      context.lineWidth = 2.5;
      context.beginPath();
      context.ellipse(centerX + 9, y + 44 + bob, 13, 9, -.34, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      line(centerX + 17, y + 38 + bob, centerX + 30, y + 27 + bob, 4);

      if (player.grounded) {
        line(centerX - 1, y + 50 + bob, centerX - 11 - legSwing, y + 69, 4);
        line(centerX - 1, y + 50 + bob, centerX + 10 + legSwing, y + 69, 4);
      } else {
        line(centerX - 1, y + 50, centerX - 16, y + 60, 4);
        line(centerX - 1, y + 50, centerX + 14, y + 58, 4);
      }

      context.restore();
    }

    function drawObstacle(obstacle) {
      context.save();
      context.translate(obstacle.x, obstacle.y);
      context.strokeStyle = '#11110f';
      context.fillStyle = '#f7f7f3';
      context.lineWidth = 3;
      context.lineJoin = 'round';

      if (obstacle.type === 'cable') {
        context.beginPath();
        context.moveTo(0, obstacle.height - 2);
        context.bezierCurveTo(13, -4, 31, obstacle.height + 3, obstacle.width, 2);
        context.stroke();
        context.fillStyle = '#2457ff';
        context.beginPath();
        context.arc(obstacle.width - 3, 3, 4, 0, Math.PI * 2);
        context.fill();
      } else if (obstacle.type === 'stand') {
        line(obstacle.width * .5, 0, obstacle.width * .5, obstacle.height - 8, 3);
        line(obstacle.width * .5, 10, obstacle.width - 2, 2, 3);
        line(obstacle.width * .5, obstacle.height - 8, 2, obstacle.height, 3);
        line(obstacle.width * .5, obstacle.height - 8, obstacle.width - 2, obstacle.height, 3);
        context.fillStyle = '#2457ff';
        context.fillRect(obstacle.width - 10, -2, 12, 7);
      } else if (obstacle.type === 'speaker') {
        roundedRect(0, 0, obstacle.width, obstacle.height, 7);
        context.fill();
        context.stroke();
        context.fillStyle = '#2457ff';
        context.beginPath();
        context.arc(obstacle.width * .5, obstacle.height * .63, obstacle.width * .23, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = '#11110f';
        context.beginPath();
        context.arc(obstacle.width * .5, obstacle.height * .22, 4.5, 0, Math.PI * 2);
        context.fill();
      } else if (obstacle.type === 'monitor') {
        context.beginPath();
        context.moveTo(0, obstacle.height);
        context.lineTo(8, 8);
        context.lineTo(obstacle.width - 7, 0);
        context.lineTo(obstacle.width, obstacle.height);
        context.closePath();
        context.fill();
        context.stroke();
        line(12, obstacle.height * .56, obstacle.width - 11, obstacle.height * .45, 3, '#2457ff');
      } else {
        roundedRect(0, 0, obstacle.width, obstacle.height, 7);
        context.fill();
        context.stroke();
        line(10, 8, obstacle.width - 10, obstacle.height - 8, 2, '#2457ff');
        context.fillStyle = '#11110f';
        context.fillRect(obstacle.width * .42, -4, obstacle.width * .16, 7);
      }
      context.restore();
    }

    function draw() {
      drawBackground();
      obstacles.forEach(drawObstacle);
      drawPlayer();

      particles.forEach(function (particle) {
        var alpha = 1 - particle.age / particle.life;
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.fillRect(particle.x, particle.y, particle.size, particle.size);
      });
      context.globalAlpha = 1;
    }

    function loop(now) {
      if (!running) return;
      var delta = clamp((now - lastTime) / 1000, 0, .034);
      lastTime = now;
      update(delta);
      draw();
      if (running) frame = requestAnimationFrame(loop);
    }

    function share() {
      var rank = titleForScore(finalDistance);
      var url = new URL(location.href);
      url.hash = 'rhythm';
      url.searchParams.set('run', String(finalDistance));
      var text = 'Я пробежал ' + finalDistance + ' м в игре «Не сбей ритм» и получил статус «' + rank.title + '». Сможешь дальше?';
      metric('runner_v2_share', { distance: finalDistance });
      if (navigator.share) {
        navigator.share({ title: 'Не сбей ритм · версия 2', text: text, url: url.toString() }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text + ' ' + url.toString()).then(function () {
          var old = shareButton.textContent;
          shareButton.textContent = 'Ссылка скопирована ✓';
          window.setTimeout(function () { shareButton.textContent = old; }, 1800);
        }).catch(function () {});
      }
    }

    function claimReward() {
      if (!rewardUnlocked) return;
      metric('runner_v2_reward_claim', { promo: promoCode, best: best });
      var message = 'Промокод ' + promoCode + ': скидка 1000 ₽ за видеоотзыв после мероприятия.';
      var openContact = document.querySelector('[data-open-contact]');

      function openForm() {
        claimButton.textContent = 'Промокод сохранён ✓';
        if (openContact) window.setTimeout(function () { openContact.click(); }, 180);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(openForm).catch(openForm);
      } else {
        openForm();
      }
    }

    function press(event) {
      if (event) event.preventDefault();
      requestJump();
    }

    stage.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', releaseJump, { passive: true });
    stage.addEventListener('keydown', function (event) {
      if (event.code !== 'Space' && event.code !== 'Enter' && event.code !== 'ArrowUp') return;
      if (event.repeat) return;
      press(event);
    });
    stage.addEventListener('keyup', function (event) {
      if (event.code === 'Space' || event.code === 'Enter' || event.code === 'ArrowUp') releaseJump();
    });

    game.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
    });

    startButton.addEventListener('click', function (event) { event.stopPropagation(); start(false); });
    restartButton.addEventListener('click', function (event) { event.stopPropagation(); start(false); });
    shareButton.addEventListener('click', function (event) { event.stopPropagation(); share(); });
    claimButton.addEventListener('click', function (event) { event.stopPropagation(); claimReward(); });
    soundButton.addEventListener('click', function (event) {
      event.stopPropagation();
      soundOn = !soundOn;
      soundButton.setAttribute('aria-pressed', String(soundOn));
      soundButton.querySelector('strong').textContent = soundOn ? 'Вкл. ♪' : 'Выкл.';
      if (soundOn) tone(520, .06, .03, 'triangle');
    });

    window.addEventListener('resize', resize, { passive: true });
    if ('ResizeObserver' in window) {
      new ResizeObserver(resize).observe(stage);
    }

    intro.hidden = false;
    result.hidden = true;
    rewardCard.hidden = !rewardUnlocked;
    game.classList.toggle('has-reward', rewardUnlocked);
    resize();
    updateRewardUi();
  });
})();
