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

    var previousGame = section.querySelector('.rhythm-passport, [data-rhythm-game]');
    if (!previousGame) return;

    section.classList.remove('rhythm--passport');
    section.classList.add('rhythm--runner');

    var heading = section.querySelector('.section-head h2');
    var description = section.querySelector('.section-head > p:last-child');
    if (heading) heading.innerHTML = 'Не сбейте<br><em>мой ритм</em>';
    if (description) description.textContent = 'Бегите к сцене и перепрыгивайте всё, что мешает выступлению. Один тап, один прыжок — как в той самой игре с динозавром, только в мире живой музыки.';

    var challenge = Number(new URLSearchParams(location.search).get('run')) || 0;
    var bestKey = 'vlad-runner-best-v1';
    var best = readBest();

    var game = document.createElement('div');
    game.className = 'rhythm-runner reveal is-visible';
    game.innerHTML = [
      '<div class="rhythm-runner__hud">',
        '<p><span>Дистанция</span><strong data-run-distance>000 м</strong></p>',
        '<p><span>Серия</span><strong data-run-combo>×0</strong></p>',
        '<p><span>Рекорд</span><strong data-run-best>' + String(best).padStart(3, '0') + ' м</strong></p>',
        '<button type="button" data-run-sound aria-pressed="true"><span>Звук</span><strong>Вкл. ♪</strong></button>',
      '</div>',
      '<div class="rhythm-runner__stage" data-run-stage tabindex="0" role="application" aria-label="Игра Не сбей ритм. Нажмите пробел, Enter или коснитесь поля, чтобы перепрыгивать препятствия.">',
        '<canvas data-run-canvas aria-hidden="true"></canvas>',
        '<div class="rhythm-runner__overlay" data-run-intro>',
          '<small>Мини-игра · один тап</small>',
          '<h3>Доберитесь<br><em>до сцены</em></h3>',
          '<p>' + (challenge ? 'Друг пробежал ' + challenge + ' метров. Побьёте его результат?' : 'Перепрыгивайте провода, стойки, колонки и кофры. Чем дальше — тем быстрее ритм.') + '</p>',
          '<button class="button button--accent button--large" type="button" data-run-start>Начать забег <span>↗</span></button>',
          '<span>тап · клик · пробел</span>',
        '</div>',
        '<div class="rhythm-runner__overlay rhythm-runner__overlay--result" data-run-result hidden>',
          '<small data-run-result-kicker>Ритм сбился</small>',
          '<h3><strong data-run-result-distance>0</strong> м<br><em data-run-result-title>Разогрев</em></h3>',
          '<p data-run-result-copy></p>',
          '<div class="rhythm-runner__actions">',
            '<button class="button button--accent button--large" type="button" data-run-restart>Ещё раз <span>↗</span></button>',
            '<button class="button button--outline button--large" type="button" data-run-share>Бросить вызов</button>',
          '</div>',
          '<span data-run-result-best></span>',
        '</div>',
        '<div class="rhythm-runner__tap-hint" data-run-hint>Нажмите, чтобы прыгнуть</div>',
      '</div>',
      '<div class="rhythm-runner__footer">',
        '<p data-run-status>Первый прыжок запускает игру. Удерживайте чуть дольше для высокого прыжка.</p>',
        '<span>Бонус открывается после 250 м</span>',
      '</div>'
    ].join('');

    previousGame.replaceWith(game);

    var stage = game.querySelector('[data-run-stage]');
    var canvas = game.querySelector('[data-run-canvas]');
    var context = canvas.getContext('2d');
    var intro = game.querySelector('[data-run-intro]');
    var result = game.querySelector('[data-run-result]');
    var startButton = game.querySelector('[data-run-start]');
    var restartButton = game.querySelector('[data-run-restart]');
    var shareButton = game.querySelector('[data-run-share]');
    var soundButton = game.querySelector('[data-run-sound]');
    var distanceOutput = game.querySelector('[data-run-distance]');
    var comboOutput = game.querySelector('[data-run-combo]');
    var bestOutput = game.querySelector('[data-run-best]');
    var statusOutput = game.querySelector('[data-run-status]');
    var hint = game.querySelector('[data-run-hint]');
    var resultDistance = game.querySelector('[data-run-result-distance]');
    var resultTitle = game.querySelector('[data-run-result-title]');
    var resultCopy = game.querySelector('[data-run-result-copy]');
    var resultBest = game.querySelector('[data-run-result-best]');
    var reward = section.querySelector('[data-game-reward]');

    var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var width = 0;
    var height = 0;
    var groundY = 0;
    var running = false;
    var ended = false;
    var frame = 0;
    var lastTime = 0;
    var elapsed = 0;
    var distance = 0;
    var combo = 0;
    var speed = 300;
    var spawnTimer = 0;
    var nextSpawn = 1050;
    var beatTimer = 0;
    var holding = false;
    var holdTime = 0;
    var soundOn = true;
    var audioContext = null;
    var finalDistance = 0;
    var obstacles = [];
    var particles = [];
    var stars = [];

    var player = {
      x: 0,
      y: 0,
      width: 52,
      height: 74,
      velocityY: 0,
      grounded: true,
      runPhase: 0,
      squash: 1
    };

    function readBest() {
      try { return Number(localStorage.getItem(bestKey)) || 0; } catch (_) { return 0; }
    }

    function writeBest(value) {
      try { localStorage.setItem(bestKey, String(value)); } catch (_) {}
    }

    function resize() {
      var rect = stage.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(360, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      groundY = height * .78;
      player.x = width * .18;
      if (!running || player.grounded) player.y = groundY - player.height;
      createStars();
      draw();
    }

    function createStars() {
      stars = Array.from({ length: reducedMotion ? 5 : 13 }, function (_, index) {
        return {
          x: (index * 97) % Math.max(1, width),
          y: 48 + ((index * 53) % Math.max(60, groundY - 120)),
          size: index % 3 === 0 ? 2 : 1,
          speed: .08 + (index % 4) * .025
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

    function tone(frequency, duration, volume, type) {
      var ctx = audio();
      if (!ctx) return;
      var oscillator = ctx.createOscillator();
      var gain = ctx.createGain();
      oscillator.type = type || 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume || .035, ctx.currentTime + .006);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration + .02);
    }

    function beat() {
      if (!running) return;
      tone(combo >= 8 ? 180 : 120, .04, combo >= 8 ? .025 : .014, 'triangle');
    }

    function reset() {
      cancelAnimationFrame(frame);
      obstacles = [];
      particles = [];
      elapsed = 0;
      distance = 0;
      combo = 0;
      speed = 300;
      spawnTimer = 0;
      nextSpawn = 1050;
      beatTimer = 0;
      holding = false;
      holdTime = 0;
      ended = false;
      player.y = groundY - player.height;
      player.velocityY = 0;
      player.grounded = true;
      player.runPhase = 0;
      player.squash = 1;
      updateHud();
      result.hidden = true;
      intro.hidden = true;
      hint.classList.add('is-visible');
      statusOutput.textContent = 'Прыгайте через препятствия. Скорость будет расти вместе с ритмом.';
    }

    function start() {
      reset();
      running = true;
      lastTime = performance.now();
      stage.focus({ preventScroll: true });
      metric('runner_start');
      tone(420, .06, .035, 'triangle');
      frame = requestAnimationFrame(loop);
    }

    function jump() {
      if (!running) {
        start();
        return;
      }
      if (!player.grounded) return;
      holding = true;
      holdTime = 0;
      player.grounded = false;
      player.velocityY = -height * 1.02;
      player.squash = .82;
      tone(520, .055, .032, 'triangle');
      burst(player.x + player.width * .35, groundY - 4, '#2457ff', 7);
      hint.classList.remove('is-visible');
    }

    function releaseJump() {
      holding = false;
      if (player.velocityY < -height * .42) player.velocityY *= .72;
    }

    function obstacleDefinition(type) {
      if (type === 'cable') return { width: 52, height: 18, label: 'провод' };
      if (type === 'stand') return { width: 35, height: 88, label: 'стойка' };
      if (type === 'speaker') return { width: 62, height: 72, label: 'колонка' };
      return { width: 78, height: 38, label: 'кофр' };
    }

    function spawnObstacle() {
      var choices = distance < 45 ? ['cable', 'case'] : (distance < 110 ? ['cable', 'case', 'speaker'] : ['cable', 'case', 'speaker', 'stand']);
      var type = choices[Math.floor(Math.random() * choices.length)];
      var definition = obstacleDefinition(type);
      obstacles.push({
        type: type,
        x: width + 40,
        y: groundY - definition.height,
        width: definition.width,
        height: definition.height,
        passed: false,
        label: definition.label
      });

      var base = clamp(1320 - speed * 1.05, 660, 1080);
      nextSpawn = base + Math.random() * 330;
      if (distance > 180 && Math.random() < .2) nextSpawn *= .72;
    }

    function burst(x, y, color, count) {
      if (reducedMotion) count = Math.min(3, count);
      for (var index = 0; index < count; index += 1) {
        particles.push({
          x: x,
          y: y,
          velocityX: -40 - Math.random() * 120,
          velocityY: -30 - Math.random() * 100,
          life: .45 + Math.random() * .25,
          age: 0,
          size: 2 + Math.random() * 4,
          color: color
        });
      }
    }

    function updateHud() {
      distanceOutput.textContent = String(Math.floor(distance)).padStart(3, '0') + ' м';
      comboOutput.textContent = '×' + combo;
      bestOutput.textContent = String(best).padStart(3, '0') + ' м';
      game.classList.toggle('is-fever', combo >= 8);
    }

    function titleForScore(value) {
      if (value >= 500) return { title: 'Соседи вызвали полицию', copy: 'Вы так долго держали ритм, что вечеринку услышал весь район.' };
      if (value >= 300) return { title: 'Легенда вечера', copy: 'Вы прошли путь от саундчека до большого финала почти без ошибок.' };
      if (value >= 150) return { title: 'Хедлайнер', copy: 'Темп растёт, препятствий больше, а вы всё ещё ведёте вечеринку.' };
      if (value >= 60) return { title: 'Музыкант', copy: 'Ритм уже найден. Следующая попытка легко может стать рекордной.' };
      return { title: 'Разогрев', copy: 'Первые метры пройдены. Нажимайте чуть раньше перед высокими препятствиями.' };
    }

    function finish() {
      if (!running) return;
      running = false;
      ended = true;
      cancelAnimationFrame(frame);
      finalDistance = Math.floor(distance);
      best = Math.max(best, finalDistance);
      writeBest(best);
      updateHud();

      var rank = titleForScore(finalDistance);
      resultDistance.textContent = String(finalDistance);
      resultTitle.textContent = rank.title;
      resultCopy.textContent = rank.copy;
      resultBest.textContent = 'Ваш рекорд · ' + best + ' м';
      result.hidden = false;
      hint.classList.remove('is-visible');
      statusOutput.textContent = 'Ритм сбился. Рестарт мгновенный — попробуйте ещё раз.';
      tone(180, .18, .05, 'sawtooth');
      window.setTimeout(function () { tone(110, .22, .035, 'triangle'); }, 90);
      metric('runner_finish', { distance: finalDistance, best: best });

      if (finalDistance >= 250 && reward) {
        reward.hidden = false;
        try { localStorage.setItem('vlad-rhythm-reward-1000', 'unlocked'); } catch (_) {}
      }
    }

    function collide(a, b) {
      var paddingX = 10;
      var paddingTop = 8;
      return a.x + paddingX < b.x + b.width &&
        a.x + a.width - paddingX > b.x &&
        a.y + paddingTop < b.y + b.height &&
        a.y + a.height - 4 > b.y + 2;
    }

    function update(delta) {
      elapsed += delta;
      distance += speed * delta * .012;
      speed = Math.min(650, 300 + elapsed * 7.5 + distance * .3);
      player.runPhase += delta * speed * .035;
      player.squash += (1 - player.squash) * Math.min(1, delta * 12);

      if (holding && !player.grounded && holdTime < .18 && player.velocityY < 0) {
        player.velocityY -= height * .72 * delta;
        holdTime += delta;
      }

      player.velocityY += height * 2.75 * delta;
      player.y += player.velocityY * delta;
      if (player.y >= groundY - player.height) {
        if (!player.grounded && player.velocityY > height * .35) {
          burst(player.x + player.width * .42, groundY - 3, '#11110f', 5);
          player.squash = 1.16;
        }
        player.y = groundY - player.height;
        player.velocityY = 0;
        player.grounded = true;
        holding = false;
      }

      spawnTimer += delta * 1000;
      if (spawnTimer >= nextSpawn) {
        spawnTimer = 0;
        spawnObstacle();
      }

      beatTimer += delta * 1000;
      var beatLength = clamp(60000 / (104 + distance * .13), 340, 580);
      if (beatTimer >= beatLength) {
        beatTimer %= beatLength;
        beat();
      }

      obstacles.forEach(function (obstacle) {
        obstacle.x -= speed * delta;
        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
          obstacle.passed = true;
          combo += 1;
          tone(combo % 4 === 0 ? 720 : 620, .04, .022, 'triangle');
          burst(obstacle.x + obstacle.width, obstacle.y, combo >= 8 ? '#ffcf3d' : '#2457ff', 5);
        }
        if (collide(player, obstacle)) finish();
      });
      obstacles = obstacles.filter(function (obstacle) { return obstacle.x + obstacle.width > -80; });

      particles.forEach(function (particle) {
        particle.age += delta;
        particle.x += particle.velocityX * delta;
        particle.y += particle.velocityY * delta;
        particle.velocityY += 260 * delta;
      });
      particles = particles.filter(function (particle) { return particle.age < particle.life; });
      updateHud();
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

    function drawPlayer() {
      var x = player.x;
      var y = player.y;
      var centerX = x + player.width * .5;
      var bob = player.grounded ? Math.sin(player.runPhase) * 2.2 : 0;
      var legSwing = player.grounded ? Math.sin(player.runPhase) * 11 : 2;

      context.save();
      context.translate(centerX, y + player.height);
      context.scale(1 / player.squash, player.squash);
      context.translate(-centerX, -(y + player.height));

      context.fillStyle = '#f7f7f3';
      context.strokeStyle = '#11110f';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(centerX, y + 13 + bob, 10, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      line(centerX, y + 25 + bob, centerX - 2, y + 52 + bob, 4);
      line(centerX - 1, y + 33 + bob, centerX + 16, y + 42 + bob, 3);
      line(centerX - 1, y + 34 + bob, centerX - 15, y + 46 + bob, 3);

      context.fillStyle = '#2457ff';
      context.strokeStyle = '#11110f';
      context.lineWidth = 2.5;
      context.beginPath();
      context.ellipse(centerX + 9, y + 45 + bob, 14, 10, -.35, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      line(centerX + 18, y + 39 + bob, centerX + 31, y + 27 + bob, 4);

      if (player.grounded) {
        line(centerX - 2, y + 52 + bob, centerX - 12 - legSwing, y + 70, 4);
        line(centerX - 2, y + 52 + bob, centerX + 11 + legSwing, y + 70, 4);
      } else {
        line(centerX - 2, y + 52, centerX - 17, y + 62, 4);
        line(centerX - 2, y + 52, centerX + 14, y + 60, 4);
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
        context.bezierCurveTo(13, -5, 30, obstacle.height + 4, obstacle.width, 2);
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
        context.beginPath();
        context.roundRect(0, 0, obstacle.width, obstacle.height, 7);
        context.fill();
        context.stroke();
        context.fillStyle = '#2457ff';
        context.beginPath();
        context.arc(obstacle.width * .5, obstacle.height * .61, obstacle.width * .24, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = '#11110f';
        context.beginPath();
        context.arc(obstacle.width * .5, obstacle.height * .22, 5, 0, Math.PI * 2);
        context.fill();
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

    function drawBackground() {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#f7f7f3';
      context.fillRect(0, 0, width, height);

      stars.forEach(function (star, index) {
        var offset = running ? (distance * star.speed * 8) % (width + 80) : 0;
        var x = (star.x - offset + width + 80) % (width + 80) - 40;
        context.fillStyle = index % 4 === 0 ? '#2457ff' : 'rgba(17,17,15,.24)';
        context.beginPath();
        context.arc(x, star.y, star.size, 0, Math.PI * 2);
        context.fill();
      });

      context.fillStyle = 'rgba(17,17,15,.035)';
      context.font = '700 ' + Math.max(52, width * .075) + 'px Manrope, Arial';
      context.textAlign = 'right';
      context.fillText('В РИТМЕ', width - 28, groundY - 70);

      line(0, groundY, width, groundY, 3);
      var dashOffset = running ? -((distance * 7) % 44) : 0;
      context.save();
      context.setLineDash([16, 28]);
      context.lineDashOffset = dashOffset;
      line(0, groundY + 13, width, groundY + 13, 2, 'rgba(17,17,15,.22)');
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
      metric('runner_share', { distance: finalDistance });
      if (navigator.share) {
        navigator.share({ title: 'Не сбей ритм', text: text, url: url.toString() }).catch(function () {});
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

    function press(event) {
      if (event) event.preventDefault();
      jump();
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
    startButton.addEventListener('click', function (event) { event.stopPropagation(); start(); });
    restartButton.addEventListener('click', function (event) { event.stopPropagation(); start(); });
    shareButton.addEventListener('click', function (event) { event.stopPropagation(); share(); });
    soundButton.addEventListener('click', function (event) {
      event.stopPropagation();
      soundOn = !soundOn;
      soundButton.setAttribute('aria-pressed', String(soundOn));
      soundButton.querySelector('strong').textContent = soundOn ? 'Вкл. ♪' : 'Выкл.';
      if (soundOn) tone(520, .06, .035, 'triangle');
    });
    window.addEventListener('resize', resize, { passive: true });

    intro.hidden = false;
    result.hidden = true;
    resize();
  });
})();
