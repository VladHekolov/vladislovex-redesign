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

  function seededRandom(seed) {
    var value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      var t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dateSeed() {
    var date = new Date();
    return Number(String(date.getFullYear()) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0'));
  }

  ready(function () {
    var section = document.getElementById('rhythm');
    if (!section) return;

    var previousGame = section.querySelector('.rhythm-passport, .rhythm-runner, .rhythm-runner-v2, [data-rhythm-game]');
    if (!previousGame) return;

    var REWARD_DISTANCE = 100;
    var PROMO_CODE = 'VIDEO1000';
    var BEST_KEY = 'vlad-runner-best-v3';
    var REWARD_KEY = 'vlad-runner-video-review-reward-v3';
    var DAILY_KEY = 'vlad-runner-daily-v3-' + dateSeed();
    var challenge = Number(new URLSearchParams(location.search).get('run')) || 0;
    var targetDistance = challenge || readNumber(BEST_KEY);
    var best = readNumber(BEST_KEY);
    var rewardUnlocked = readFlag(REWARD_KEY);
    var random = seededRandom(dateSeed());

    section.classList.remove('rhythm--passport', 'rhythm--runner', 'rhythm--runner-v2');
    section.classList.add('rhythm--runner-v3');

    var oldReward = section.querySelector('[data-game-reward]');
    if (oldReward) oldReward.hidden = true;

    var heading = section.querySelector('.section-head h2');
    var description = section.querySelector('.section-head > p:last-child');
    if (heading) heading.innerHTML = 'Не сбейте<br><em>мой ритм</em>';
    if (description) description.textContent = 'Версия 3: фирменный герой бежит к сцене, а точные прыжки в музыкальный бит заряжают режим драйва. Добегите до 100 метров и откройте скидку 1000 ₽ за видеоотзыв.';

    var game = document.createElement('div');
    game.className = 'rhythm-runner-v3 reveal is-visible';
    game.innerHTML = [
      '<div class="runner-v3__hud">',
        '<p><span>Дистанция</span><strong data-v3-distance>000 м</strong></p>',
        '<p><span>Серия</span><strong data-v3-combo>×0</strong></p>',
        '<p><span>Драйв</span><strong data-v3-drive>0%</strong></p>',
        '<p><span>Рекорд</span><strong data-v3-best>' + pad(best) + ' м</strong></p>',
        '<button type="button" data-v3-sound aria-pressed="true"><span>Звук</span><strong>Вкл. ♪</strong></button>',
      '</div>',
      '<div class="runner-v3__drive"><i><b data-v3-drive-bar></b></i><span data-v3-drive-label>Попадайте прыжками в ритм</span></div>',
      '<div class="runner-v3__stage" data-v3-stage tabindex="0" role="application" aria-label="Игра Не сбей ритм, версия 3. Нажмите пробел, Enter, стрелку вверх или коснитесь поля, чтобы прыгнуть.">',
        '<canvas data-v3-canvas aria-hidden="true"></canvas>',
        '<div class="runner-v3__feedback" data-v3-feedback aria-live="polite"></div>',
        '<div class="runner-v3__overlay" data-v3-intro>',
          '<small>Версия 3 · забег дня</small>',
          '<h3>Влад<br><em>Live Runner</em></h3>',
          '<p>' + (challenge ? 'Друг пробежал ' + challenge + ' м. Перепрыгните его отметку и удержите музыкальный ритм.' : 'Один тап — прыжок. Нажимайте в музыкальный удар: точные прыжки заряжают режим концерта.') + '</p>',
          '<div class="runner-v3__hero-card">',
            '<div class="runner-v3__hero-mark"><span>V</span><i>♪</i></div>',
            '<div><strong>Свой герой</strong><small>музыкант · бегун · хедлайнер</small></div>',
          '</div>',
          '<div class="runner-v3__reward-ticket' + (rewardUnlocked ? ' is-unlocked' : '') + '">',
            '<span>' + (rewardUnlocked ? 'Награда открыта' : 'Финиш награды · 100 м') + '</span>',
            '<strong>−1000 ₽</strong>',
            '<small>за короткий честный видеоотзыв после мероприятия</small>',
          '</div>',
          '<button class="button button--accent button--large" type="button" data-v3-start>Начать забег <span>↗</span></button>',
          '<span class="runner-v3__controls">тап · клик · пробел</span>',
        '</div>',
        '<div class="runner-v3__overlay runner-v3__overlay--result" data-v3-result hidden>',
          '<small data-v3-result-kicker>Ритм сбился</small>',
          '<h3><strong data-v3-result-distance>0</strong> м<br><em data-v3-result-title>Саундчек</em></h3>',
          '<p data-v3-result-copy></p>',
          '<div class="runner-v3__result-stats">',
            '<p><span>Идеально</span><strong data-v3-perfect>0</strong></p>',
            '<p><span>Лучшая серия</span><strong data-v3-max-combo>×0</strong></p>',
            '<p><span>Режим драйва</span><strong data-v3-fever-count>0</strong></p>',
          '</div>',
          '<div class="runner-v3__reward-card" data-v3-reward-card hidden>',
            '<div><span>Реальная награда</span><strong>−1000 ₽</strong></div>',
            '<p>Скидка на одно выступление. После мероприятия нужно прислать короткий честный видеоотзыв. Промокод укажите до бронирования. С другими скидками не суммируется.</p>',
            '<div class="runner-v3__promo"><span>Промокод</span><strong>' + PROMO_CODE + '</strong></div>',
            '<button class="button button--accent" type="button" data-v3-claim>Сохранить скидку ↗</button>',
          '</div>',
          '<div class="runner-v3__actions">',
            '<button class="button button--accent button--large" type="button" data-v3-restart>Ещё раз <span>↗</span></button>',
            '<button class="button button--outline button--large" type="button" data-v3-share>Бросить вызов</button>',
          '</div>',
          '<span data-v3-result-best></span>',
        '</div>',
        '<div class="runner-v3__tap-hint" data-v3-hint>Нажмите в удар</div>',
      '</div>',
      '<div class="runner-v3__meta">',
        '<div><span>Забег дня</span><strong data-v3-daily>' + pad(readNumber(DAILY_KEY)) + ' м</strong></div>',
        '<div><span>Следующая цель</span><strong data-v3-phase>Сцена · 35 м</strong></div>',
        '<div><span>Награда</span><strong data-v3-reward-status>' + (rewardUnlocked ? 'Открыта ✓' : '100 м') + '</strong></div>',
      '</div>',
      '<div class="runner-v3__footer">',
        '<p data-v3-status>Первый тап запускает игру и сразу выполняет прыжок.</p>',
        '<span>' + (challenge ? 'Цель друга · ' + challenge + ' м' : 'Ежедневная одинаковая трасса') + '</span>',
      '</div>'
    ].join('');

    previousGame.replaceWith(game);

    var stage = game.querySelector('[data-v3-stage]');
    var canvas = game.querySelector('[data-v3-canvas]');
    var context = canvas.getContext('2d');
    var intro = game.querySelector('[data-v3-intro]');
    var result = game.querySelector('[data-v3-result]');
    var startButton = game.querySelector('[data-v3-start]');
    var restartButton = game.querySelector('[data-v3-restart]');
    var shareButton = game.querySelector('[data-v3-share]');
    var claimButton = game.querySelector('[data-v3-claim]');
    var soundButton = game.querySelector('[data-v3-sound]');
    var distanceOutput = game.querySelector('[data-v3-distance]');
    var comboOutput = game.querySelector('[data-v3-combo]');
    var driveOutput = game.querySelector('[data-v3-drive]');
    var driveBar = game.querySelector('[data-v3-drive-bar]');
    var driveLabel = game.querySelector('[data-v3-drive-label]');
    var bestOutput = game.querySelector('[data-v3-best]');
    var feedback = game.querySelector('[data-v3-feedback]');
    var hint = game.querySelector('[data-v3-hint]');
    var statusOutput = game.querySelector('[data-v3-status]');
    var phaseOutput = game.querySelector('[data-v3-phase]');
    var rewardStatus = game.querySelector('[data-v3-reward-status]');
    var dailyOutput = game.querySelector('[data-v3-daily]');
    var resultDistance = game.querySelector('[data-v3-result-distance]');
    var resultTitle = game.querySelector('[data-v3-result-title]');
    var resultCopy = game.querySelector('[data-v3-result-copy]');
    var resultBest = game.querySelector('[data-v3-result-best]');
    var resultKicker = game.querySelector('[data-v3-result-kicker]');
    var perfectOutput = game.querySelector('[data-v3-perfect]');
    var maxComboOutput = game.querySelector('[data-v3-max-combo]');
    var feverCountOutput = game.querySelector('[data-v3-fever-count]');
    var rewardCard = game.querySelector('[data-v3-reward-card]');

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
    var speed = 290;
    var combo = 0;
    var maxCombo = 0;
    var perfectCount = 0;
    var feverCount = 0;
    var drive = 0;
    var feverTime = 0;
    var beatTimer = 0;
    var beatLength = 560;
    var beatCount = 0;
    var nextSpawnBeat = 4;
    var holding = false;
    var holdTime = 0;
    var jumpBuffer = 0;
    var coyoteTime = 0;
    var soundOn = true;
    var audioContext = null;
    var feedbackTimer = 0;
    var newRecordShown = false;
    var targetShown = false;
    var rewardFlash = 0;
    var obstacles = [];
    var particles = [];
    var background = [];

    var phases = [
      { at: 0, name: 'Саундчек', next: 'Сцена · 35 м', word: 'SOUND', bpm: 104 },
      { at: 35, name: 'Сцена', next: 'Драйв · 75 м', word: 'STAGE', bpm: 112 },
      { at: 75, name: 'Драйв', next: 'Награда · 100 м', word: 'DRIVE', bpm: 122 },
      { at: 100, name: 'Encore', next: 'Хедлайнер · 180 м', word: 'ENCORE', bpm: 130 },
      { at: 180, name: 'Хедлайнер', next: 'Легенда · 300 м', word: 'LIVE', bpm: 138 },
      { at: 300, name: 'Легенда', next: 'Бесконечный ритм', word: 'LEGEND', bpm: 146 }
    ];

    var player = {
      x: 0,
      y: 0,
      width: 58,
      height: 82,
      velocityY: 0,
      grounded: true,
      runPhase: 0,
      squash: 1,
      landing: 0
    };

    function readNumber(key) {
      try { return Number(localStorage.getItem(key)) || 0; } catch (_) { return 0; }
    }

    function readFlag(key) {
      try { return localStorage.getItem(key) === 'unlocked'; } catch (_) { return false; }
    }

    function writeNumber(key, value) {
      try { localStorage.setItem(key, String(value)); } catch (_) {}
    }

    function writeReward() {
      rewardUnlocked = true;
      try {
        localStorage.setItem(REWARD_KEY, 'unlocked');
        localStorage.setItem(REWARD_KEY + '-code', PROMO_CODE);
      } catch (_) {}
    }

    function pad(value) {
      return String(Math.max(0, Math.floor(value))).padStart(3, '0');
    }

    function phaseIndex() {
      var index = 0;
      for (var i = 0; i < phases.length; i += 1) if (distance >= phases[i].at) index = i;
      return index;
    }

    function resize() {
      var rect = stage.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(410, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      groundY = height * .79;
      player.x = width * .17;
      if (!running || player.grounded) player.y = groundY - player.height;
      background = Array.from({ length: reducedMotion ? 6 : 18 }, function (_, index) {
        return {
          x: (index * 149 + 17) % width,
          y: 38 + ((index * 73) % Math.max(80, groundY - 130)),
          size: index % 4 === 0 ? 2.5 : 1,
          depth: .05 + (index % 5) * .028
        };
      });
      draw();
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
      var start = ctx.currentTime + (delay || 0);
      var oscillator = ctx.createOscillator();
      var gain = ctx.createGain();
      oscillator.type = type || 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume || .025, start + .006);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + .025);
    }

    function chord() {
      tone(520, .07, .03, 'triangle');
      tone(660, .08, .025, 'triangle', .04);
      tone(820, .1, .022, 'triangle', .08);
    }

    function showFeedback(text, kind, duration) {
      feedback.textContent = text;
      feedback.className = 'runner-v3__feedback is-visible ' + (kind || '');
      feedbackTimer = duration || .75;
    }

    function burst(x, y, color, count) {
      if (reducedMotion) count = Math.min(4, count);
      for (var i = 0; i < count; i += 1) {
        particles.push({
          x: x,
          y: y,
          vx: -40 - random() * 130,
          vy: -35 - random() * 120,
          age: 0,
          life: .4 + random() * .35,
          size: 2 + random() * 4,
          color: color
        });
      }
    }

    function reset() {
      cancelAnimationFrame(frame);
      running = false;
      elapsed = 0;
      distance = 0;
      finalDistance = 0;
      speed = 290;
      combo = 0;
      maxCombo = 0;
      perfectCount = 0;
      feverCount = 0;
      drive = 0;
      feverTime = 0;
      beatTimer = 0;
      beatCount = 0;
      nextSpawnBeat = 4;
      holding = false;
      holdTime = 0;
      jumpBuffer = 0;
      coyoteTime = 0;
      feedbackTimer = 0;
      newRecordShown = false;
      targetShown = false;
      rewardFlash = 0;
      obstacles = [];
      particles = [];
      random = seededRandom(dateSeed());
      player.y = groundY - player.height;
      player.velocityY = 0;
      player.grounded = true;
      player.runPhase = 0;
      player.squash = 1;
      player.landing = 0;
      result.hidden = true;
      intro.hidden = true;
      hint.classList.add('is-visible');
      statusOutput.textContent = 'Нажимайте в музыкальный удар. Точные прыжки заполняют шкалу драйва.';
      updateHud();
    }

    function start(withJump) {
      reset();
      running = true;
      lastTime = performance.now();
      stage.focus({ preventScroll: true });
      metric('runner_v3_start');
      tone(420, .06, .035, 'triangle');
      if (withJump) queueJump();
      frame = requestAnimationFrame(loop);
    }

    function timingGrade() {
      var error = Math.min(beatTimer, beatLength - beatTimer) / beatLength;
      if (error <= .105) return 'perfect';
      if (error <= .22) return 'clean';
      return 'normal';
    }

    function applyTiming() {
      var grade = timingGrade();
      if (grade === 'perfect') {
        perfectCount += 1;
        combo += 1;
        drive = Math.min(100, drive + 27);
        showFeedback('ИДЕАЛЬНО', 'is-perfect', .75);
        tone(760, .055, .032, 'triangle');
        burst(player.x + player.width * .5, player.y + player.height, '#2457ff', 9);
        try { if (navigator.vibrate) navigator.vibrate(18); } catch (_) {}
      } else if (grade === 'clean') {
        combo += 1;
        drive = Math.min(100, drive + 14);
        showFeedback('ЧИСТО', 'is-clean', .58);
        tone(620, .045, .025, 'triangle');
      } else {
        combo = Math.max(0, combo - 1);
        drive = Math.max(0, drive - 4);
      }
      maxCombo = Math.max(maxCombo, combo);
      if (drive >= 100 && feverTime <= 0) {
        feverTime = 6.2;
        drive = 100;
        feverCount += 1;
        showFeedback('РЕЖИМ КОНЦЕРТА', 'is-fever', 1.1);
        chord();
        metric('runner_v3_fever', { distance: Math.floor(distance) });
      }
    }

    function queueJump() {
      jumpBuffer = .13;
    }

    function performJump() {
      if (!player.grounded && coyoteTime <= 0) return false;
      jumpBuffer = 0;
      holding = true;
      holdTime = 0;
      player.grounded = false;
      coyoteTime = 0;
      player.velocityY = -height * 1.04;
      player.squash = .79;
      applyTiming();
      hint.classList.remove('is-visible');
      return true;
    }

    function releaseJump() {
      holding = false;
      if (player.velocityY < -height * .38) player.velocityY *= .7;
    }

    function obstacleDefinition(type) {
      if (type === 'cable') return { width: 50, height: 18, label: 'провод' };
      if (type === 'case') return { width: 72, height: 36, label: 'кофр' };
      if (type === 'monitor') return { width: 64, height: 42, label: 'монитор' };
      if (type === 'speaker') return { width: 58, height: 68, label: 'колонка' };
      return { width: 34, height: 86, label: 'стойка' };
    }

    function chooseObstacle() {
      var choices = distance < 35 ? ['cable', 'case'] : distance < 75 ? ['cable', 'case', 'monitor'] : distance < 140 ? ['cable', 'case', 'monitor', 'speaker'] : ['cable', 'case', 'monitor', 'speaker', 'stand'];
      return choices[Math.floor(random() * choices.length)];
    }

    function addObstacle(type, offset) {
      var def = obstacleDefinition(type);
      obstacles.push({
        type: type,
        x: width + (offset || 36),
        y: groundY - def.height,
        width: def.width,
        height: def.height,
        passed: false,
        label: def.label
      });
    }

    function spawnPattern() {
      var type = chooseObstacle();
      addObstacle(type, 40);
      if (distance > 140 && random() < .22) {
        var second = random() < .55 ? 'cable' : 'case';
        addObstacle(second, 40 + obstacleDefinition(type).width + 150 + random() * 35);
      }
      var beats = distance < 45 ? 4 : distance < 120 ? (random() < .5 ? 3 : 4) : (random() < .58 ? 3 : 2);
      nextSpawnBeat = beatCount + beats;
    }

    function collide(a, b) {
      var px = 11;
      var py = 8;
      return a.x + px < b.x + b.width - 3 &&
        a.x + a.width - px > b.x + 4 &&
        a.y + py < b.y + b.height - 2 &&
        a.y + a.height - 5 > b.y + 3;
    }

    function unlockReward() {
      if (rewardUnlocked) return;
      writeReward();
      rewardFlash = 1.8;
      rewardStatus.textContent = 'Открыта ✓';
      showFeedback('−1000 ₽ ОТКРЫТО', 'is-reward', 1.35);
      chord();
      metric('runner_v3_reward_unlocked', { distance: Math.floor(distance) });
    }

    function update(delta) {
      elapsed += delta;
      var phase = phases[phaseIndex()];
      beatLength = 60000 / phase.bpm;
      speed = Math.min(680, 290 + elapsed * 6.5 + distance * .36 + (feverTime > 0 ? 48 : 0));
      distance += speed * delta * .0117 * (feverTime > 0 ? 1.08 : 1);
      player.runPhase += delta * (9.2 + speed * .014);
      player.squash += (1 - player.squash) * Math.min(1, delta * 13);
      player.landing = Math.max(0, player.landing - delta * 5.5);

      if (player.grounded) coyoteTime = .09;
      else coyoteTime = Math.max(0, coyoteTime - delta);
      jumpBuffer = Math.max(0, jumpBuffer - delta);
      if (jumpBuffer > 0 && (player.grounded || coyoteTime > 0)) performJump();

      if (holding && !player.grounded && holdTime < .19 && player.velocityY < 0) {
        player.velocityY -= height * .72 * delta;
        holdTime += delta;
      }

      player.velocityY += height * 2.78 * delta;
      player.y += player.velocityY * delta;
      if (player.y >= groundY - player.height) {
        if (!player.grounded && player.velocityY > height * .32) {
          player.landing = 1;
          player.squash = 1.17;
          burst(player.x + player.width * .45, groundY - 2, feverTime > 0 ? '#2457ff' : '#11110f', 6);
        }
        player.y = groundY - player.height;
        player.velocityY = 0;
        player.grounded = true;
        holding = false;
      }

      beatTimer += delta * 1000;
      while (beatTimer >= beatLength) {
        beatTimer -= beatLength;
        beatCount += 1;
        if (running) tone(feverTime > 0 ? 170 : 120, .035, feverTime > 0 ? .02 : .011, 'triangle');
        if (beatCount >= nextSpawnBeat) spawnPattern();
      }

      obstacles.forEach(function (obstacle) {
        obstacle.x -= speed * delta;
        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
          obstacle.passed = true;
          combo += 1;
          maxCombo = Math.max(maxCombo, combo);
          drive = Math.min(100, drive + (feverTime > 0 ? 5 : 3));
          burst(obstacle.x + obstacle.width, obstacle.y + 4, feverTime > 0 ? '#ffcf3d' : '#2457ff', 4);
        }
        if (running && collide(player, obstacle)) finish();
      });
      obstacles = obstacles.filter(function (obstacle) { return obstacle.x + obstacle.width > -90; });

      particles.forEach(function (particle) {
        particle.age += delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 270 * delta;
      });
      particles = particles.filter(function (particle) { return particle.age < particle.life; });

      if (feverTime > 0) {
        feverTime = Math.max(0, feverTime - delta);
        drive = 100;
      } else {
        drive = Math.max(0, drive - delta * 2.3);
      }
      if (feedbackTimer > 0) {
        feedbackTimer -= delta;
        if (feedbackTimer <= 0) feedback.className = 'runner-v3__feedback';
      }
      rewardFlash = Math.max(0, rewardFlash - delta);

      if (distance >= REWARD_DISTANCE) unlockReward();
      if (!newRecordShown && best > 0 && distance > best) {
        newRecordShown = true;
        showFeedback('НОВЫЙ РЕКОРД', 'is-record', .9);
        tone(880, .08, .028, 'triangle');
      }
      if (!targetShown && challenge > 0 && distance > challenge) {
        targetShown = true;
        showFeedback('ДРУГ ОСТАЛСЯ ПОЗАДИ', 'is-record', 1);
        chord();
      }
      updateHud();
    }

    function updateHud() {
      var currentPhase = phases[phaseIndex()];
      distanceOutput.textContent = pad(distance) + ' м';
      comboOutput.textContent = '×' + combo;
      driveOutput.textContent = Math.round(drive) + '%';
      driveBar.style.width = Math.round(drive) + '%';
      driveLabel.textContent = feverTime > 0 ? 'РЕЖИМ КОНЦЕРТА · ' + feverTime.toFixed(1) + ' с' : 'Попадайте прыжками в ритм';
      bestOutput.textContent = pad(best) + ' м';
      phaseOutput.textContent = currentPhase.next;
      dailyOutput.textContent = pad(Math.max(readNumber(DAILY_KEY), Math.floor(distance))) + ' м';
      game.classList.toggle('is-fever', feverTime > 0);
      game.classList.toggle('is-reward-flash', rewardFlash > 0);
    }

    function resultFor(value) {
      if (value >= 350) return { title: 'Соседи вызвали полицию', copy: 'Вы превратили забег в полноценный ночной концерт.' };
      if (value >= 220) return { title: 'Легенда вечера', copy: 'Темп вырос, сцена горит, а вы всё ещё удерживаете ритм.' };
      if (value >= 140) return { title: 'Хедлайнер', copy: 'Вы не просто добрались до сцены — вы забрали весь вечер.' };
      if (value >= 100) return { title: 'Encore', copy: 'Награда открыта, но настоящий рекорд только начинается.' };
      if (value >= 70) return { title: 'Вышли на сцену', copy: 'До реальной награды осталось совсем немного.' };
      if (value >= 35) return { title: 'Разогрели площадку', copy: 'Ритм найден. Следующая попытка может стать победной.' };
      return { title: 'Саундчек', copy: 'Попробуйте нажимать ближе к музыкальному удару.' };
    }

    function finish() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
      finalDistance = Math.floor(distance);
      best = Math.max(best, finalDistance);
      writeNumber(BEST_KEY, best);
      writeNumber(DAILY_KEY, Math.max(readNumber(DAILY_KEY), finalDistance));
      var rank = resultFor(finalDistance);
      resultDistance.textContent = String(finalDistance);
      resultTitle.textContent = rank.title;
      resultCopy.textContent = rank.copy;
      resultBest.textContent = 'Ваш рекорд · ' + best + ' м';
      resultKicker.textContent = finalDistance >= REWARD_DISTANCE ? 'Сцена покорена' : 'Ритм сбился';
      perfectOutput.textContent = String(perfectCount);
      maxComboOutput.textContent = '×' + maxCombo;
      feverCountOutput.textContent = String(feverCount);
      rewardCard.hidden = !rewardUnlocked;
      result.hidden = false;
      hint.classList.remove('is-visible');
      statusOutput.textContent = 'Рестарт мгновенный. В следующем забеге попробуйте собрать больше идеальных прыжков.';
      tone(180, .16, .045, 'sawtooth');
      window.setTimeout(function () { tone(110, .2, .03, 'triangle'); }, 80);
      metric('runner_v3_finish', { distance: finalDistance, best: best, perfect: perfectCount, fever: feverCount });
      updateHud();
      draw();
    }

    function share() {
      var rank = resultFor(finalDistance);
      var url = new URL(location.href);
      url.hash = 'rhythm';
      url.searchParams.set('run', String(finalDistance));
      var text = 'Я пробежал ' + finalDistance + ' м в «Не сбей ритм 3» и получил статус «' + rank.title + '». Побьёшь мой результат?';
      metric('runner_v3_share', { distance: finalDistance });
      if (navigator.share) {
        navigator.share({ title: 'Не сбей ритм 3', text: text, url: url.toString() }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text + ' ' + url.toString()).then(function () {
          var old = shareButton.textContent;
          shareButton.textContent = 'Ссылка скопирована ✓';
          window.setTimeout(function () { shareButton.textContent = old; }, 1700);
        }).catch(function () {});
      }
    }

    function claimReward() {
      var rewardText = 'Промокод ' + PROMO_CODE + ': скидка 1000 ₽ на одно выступление при условии короткого честного видеоотзыва после мероприятия. Указать до бронирования. С другими скидками не суммируется.';
      metric('runner_v3_reward_claim');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(rewardText).catch(function () {});
      claimButton.textContent = 'Скидка сохранена ✓';
      var contactButton = document.querySelector('[data-open-contact]');
      if (contactButton) window.setTimeout(function () { contactButton.click(); }, 350);
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

    function joint(x, y, radius, fill) {
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = fill;
      context.fill();
    }

    function limb(originX, originY, upperLength, lowerLength, upperAngle, lowerAngle, color, widthValue) {
      var kneeX = originX + Math.sin(upperAngle) * upperLength;
      var kneeY = originY + Math.cos(upperAngle) * upperLength;
      var footX = kneeX + Math.sin(lowerAngle) * lowerLength;
      var footY = kneeY + Math.cos(lowerAngle) * lowerLength;
      line(originX, originY, kneeX, kneeY, widthValue, color);
      line(kneeX, kneeY, footX, footY, widthValue - .5, color);
      joint(kneeX, kneeY, widthValue * .46, color);
      return { x: footX, y: footY };
    }

    function drawHero(alpha, ghostX) {
      var x = ghostX == null ? player.x : ghostX;
      var y = player.y;
      var phase = player.runPhase;
      var airborne = !player.grounded;
      var fever = feverTime > 0;
      var ink = ghostX == null ? '#11110f' : 'rgba(36,87,255,.28)';
      var accent = ghostX == null ? (fever ? '#ffcf3d' : '#2457ff') : 'rgba(36,87,255,.2)';
      var skin = ghostX == null ? '#f7f7f3' : 'rgba(247,247,243,.2)';
      var bob = airborne ? 0 : Math.sin(phase * 2) * 2.1 - Math.abs(Math.sin(phase)) * 1.4;
      var lean = airborne ? .02 : .13;
      var hipX = x + 28;
      var hipY = y + 52 + bob;
      var shoulderX = hipX + 7;
      var shoulderY = y + 28 + bob;

      context.save();
      context.globalAlpha = alpha == null ? 1 : alpha;
      context.translate(hipX, hipY);
      context.scale(1 / player.squash, player.squash);
      context.rotate(lean);
      context.translate(-hipX, -hipY);

      var leftUpper;
      var rightUpper;
      var leftLower;
      var rightLower;
      if (airborne) {
        var rise = clamp(-player.velocityY / (height * .9), -1, 1);
        leftUpper = -.72 + rise * .18;
        rightUpper = .58 - rise * .1;
        leftLower = .55;
        rightLower = -.35;
      } else {
        leftUpper = Math.sin(phase) * .94;
        rightUpper = Math.sin(phase + Math.PI) * .94;
        leftLower = leftUpper > 0 ? -.18 : .72;
        rightLower = rightUpper > 0 ? -.18 : .72;
      }

      var backFoot = limb(hipX - 2, hipY, 24, 22, rightUpper, rightLower, ink, 6);
      line(backFoot.x - 4, backFoot.y, backFoot.x + 8, backFoot.y, 5, ink);

      var backArmAngle = airborne ? -.65 : -Math.sin(phase) * .76;
      var backElbowX = shoulderX + Math.sin(backArmAngle) * 20;
      var backElbowY = shoulderY + Math.cos(backArmAngle) * 20;
      line(shoulderX, shoulderY, backElbowX, backElbowY, 5, ink);
      line(backElbowX, backElbowY, backElbowX - 9, backElbowY + 13, 4.5, ink);

      context.fillStyle = accent;
      context.strokeStyle = ink;
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(shoulderX - 12, shoulderY - 3);
      context.quadraticCurveTo(shoulderX + 13, shoulderY - 8, hipX + 11, hipY + 1);
      context.lineTo(hipX - 12, hipY + 3);
      context.quadraticCurveTo(hipX - 15, shoulderY + 11, shoulderX - 12, shoulderY - 3);
      context.fill();
      context.stroke();
      line(shoulderX - 7, shoulderY + 2, hipX + 6, hipY - 1, 2, skin);

      context.strokeStyle = ink;
      context.fillStyle = ghostX == null ? '#f7f7f3' : 'rgba(247,247,243,.2)';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(shoulderX + 1, shoulderY - 15, 11.5, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = ink;
      context.beginPath();
      context.moveTo(shoulderX - 10, shoulderY - 19);
      context.quadraticCurveTo(shoulderX - 2, shoulderY - 33, shoulderX + 12, shoulderY - 23);
      context.quadraticCurveTo(shoulderX + 16, shoulderY - 17, shoulderX + 9, shoulderY - 11);
      context.quadraticCurveTo(shoulderX + 2, shoulderY - 20, shoulderX - 10, shoulderY - 19);
      context.fill();
      if (ghostX == null) {
        joint(shoulderX + 5, shoulderY - 15, 1.4, '#11110f');
        line(shoulderX + 7, shoulderY - 8, shoulderX + 12, shoulderY - 7, 1.5, '#11110f');
      }

      context.save();
      context.translate(shoulderX - 5, shoulderY + 11);
      context.rotate(-.52 + (airborne ? -.12 : Math.sin(phase) * .025));
      context.fillStyle = accent;
      context.strokeStyle = ink;
      context.lineWidth = 2.5;
      context.beginPath();
      context.ellipse(0, 15, 12, 17, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      line(3, 0, 3, -23, 4, ink);
      line(3, -23, 13, -36, 4, ink);
      context.restore();

      var frontArmAngle = airborne ? .5 : Math.sin(phase) * .76;
      var frontElbowX = shoulderX + Math.sin(frontArmAngle) * 21;
      var frontElbowY = shoulderY + Math.cos(frontArmAngle) * 21;
      line(shoulderX + 1, shoulderY, frontElbowX, frontElbowY, 5.5, ink);
      line(frontElbowX, frontElbowY, frontElbowX + 10, frontElbowY - 12, 4.5, ink);

      var frontFoot = limb(hipX + 3, hipY, 25, 23, leftUpper, leftLower, ink, 6.5);
      line(frontFoot.x - 4, frontFoot.y, frontFoot.x + 9, frontFoot.y, 5.5, ink);

      if (player.landing > 0 && ghostX == null) {
        context.globalAlpha = player.landing * .45;
        line(x + 4, groundY + 4, x + 58, groundY + 4, 3, accent);
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
        context.moveTo(0, obstacle.height - 3);
        context.bezierCurveTo(12, -5, 31, obstacle.height + 4, obstacle.width, 2);
        context.stroke();
        joint(obstacle.width - 3, 3, 4, '#2457ff');
      } else if (obstacle.type === 'stand') {
        line(obstacle.width * .5, 0, obstacle.width * .5, obstacle.height - 8, 3);
        line(obstacle.width * .5, 10, obstacle.width - 2, 2, 3);
        line(obstacle.width * .5, obstacle.height - 8, 2, obstacle.height, 3);
        line(obstacle.width * .5, obstacle.height - 8, obstacle.width - 2, obstacle.height, 3);
        context.fillStyle = '#2457ff';
        context.fillRect(obstacle.width - 10, -2, 12, 7);
      } else if (obstacle.type === 'speaker') {
        context.beginPath();
        context.roundRect(0, 0, obstacle.width, obstacle.height, 7);
        context.fill();
        context.stroke();
        joint(obstacle.width * .5, obstacle.height * .62, obstacle.width * .22, '#2457ff');
        joint(obstacle.width * .5, obstacle.height * .22, 5, '#11110f');
      } else if (obstacle.type === 'monitor') {
        context.beginPath();
        context.moveTo(0, obstacle.height);
        context.lineTo(10, 4);
        context.lineTo(obstacle.width - 8, 0);
        context.lineTo(obstacle.width, obstacle.height);
        context.closePath();
        context.fill();
        context.stroke();
        line(15, obstacle.height - 10, obstacle.width - 14, 9, 2.5, '#2457ff');
      } else {
        context.beginPath();
        context.roundRect(0, 0, obstacle.width, obstacle.height, 7);
        context.fill();
        context.stroke();
        line(10, 8, obstacle.width - 10, obstacle.height - 8, 2, '#2457ff');
        context.fillStyle = '#11110f';
        context.fillRect(obstacle.width * .42, -4, obstacle.width * .16, 7);
      }
      context.restore();
    }

    function drawTargetMarker() {
      if (!targetDistance || targetDistance <= distance - 12) return;
      var remaining = targetDistance - distance;
      if (remaining > 55) return;
      var markerX = width - remaining * 8;
      markerX = clamp(markerX, player.x + 105, width - 28);
      context.save();
      context.globalAlpha = .35;
      line(markerX, 52, markerX, groundY, 2, '#2457ff');
      context.fillStyle = '#2457ff';
      context.font = '700 10px Manrope, Arial';
      context.textAlign = 'center';
      context.fillText(challenge ? 'ДРУГ' : 'РЕКОРД', markerX, 42);
      drawHero(.28, markerX - 28);
      context.restore();
    }

    function drawBackground() {
      var phase = phases[phaseIndex()];
      context.clearRect(0, 0, width, height);
      context.fillStyle = feverTime > 0 ? '#2457ff' : '#f7f7f3';
      context.fillRect(0, 0, width, height);

      background.forEach(function (dot, index) {
        var offset = running ? (distance * dot.depth * 9) % (width + 80) : 0;
        var x = (dot.x - offset + width + 80) % (width + 80) - 40;
        context.fillStyle = feverTime > 0 ? (index % 4 === 0 ? '#ffcf3d' : 'rgba(255,255,255,.33)') : (index % 4 === 0 ? '#2457ff' : 'rgba(17,17,15,.2)');
        context.beginPath();
        context.arc(x, dot.y, dot.size, 0, Math.PI * 2);
        context.fill();
      });

      context.fillStyle = feverTime > 0 ? 'rgba(255,255,255,.11)' : 'rgba(17,17,15,.04)';
      context.font = '700 ' + Math.max(58, width * .085) + 'px Manrope, Arial';
      context.textAlign = 'right';
      context.fillText(phase.word, width - 24, groundY - 74);

      if (feverTime > 0) {
        context.fillStyle = 'rgba(17,17,15,.25)';
        for (var i = 0; i < 12; i += 1) {
          var crowdX = (i / 11) * width;
          var crowdY = groundY - 18 - (i % 3) * 7;
          context.beginPath();
          context.arc(crowdX, crowdY, 8, Math.PI, 0);
          context.fill();
        }
      }

      line(0, groundY, width, groundY, 3, feverTime > 0 ? '#f7f7f3' : '#11110f');
      context.save();
      context.setLineDash([16, 28]);
      context.lineDashOffset = running ? -((distance * 7) % 44) : 0;
      line(0, groundY + 13, width, groundY + 13, 2, feverTime > 0 ? 'rgba(255,255,255,.35)' : 'rgba(17,17,15,.22)');
      context.restore();
    }

    function draw() {
      drawBackground();
      drawTargetMarker();
      obstacles.forEach(drawObstacle);
      drawHero(1, null);
      particles.forEach(function (particle) {
        context.globalAlpha = 1 - particle.age / particle.life;
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

    function press(event) {
      if (event) event.preventDefault();
      if (!running) {
        start(true);
        return;
      }
      queueJump();
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
      if (soundOn) tone(520, .06, .035, 'triangle');
    });
    window.addEventListener('resize', resize, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);

    intro.hidden = false;
    result.hidden = true;
    resize();
  });
})();
