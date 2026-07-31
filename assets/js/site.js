'use strict';

(function () {
  var root = document.documentElement;
  var menuButton = document.querySelector('[data-menu-button]');
  var nav = document.getElementById('main-nav');
  var videoDialog = document.getElementById('video-dialog');
  var videoPlayer = document.getElementById('video-player');
  var videoTitle = document.getElementById('video-dialog-title');
  var reviewDialog = document.getElementById('review-dialog');
  var reviewImage = document.getElementById('review-image');
  var contactDialog = document.getElementById('contact-dialog');
  var contactForm = document.getElementById('contact-form');
  var contactFormat = document.getElementById('contact-format');
  var formStatus = document.getElementById('form-status');
  var contactSubmit = document.getElementById('contact-submit');
  var config = window.VLADISLOVEX_CONFIG || {};
  var localPreview = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.style.colorScheme = 'light';

  var cursor = document.querySelector('.custom-cursor');
  var cursorLabel = cursor ? cursor.querySelector('span') : null;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (cursor && finePointer && !reducedMotion) {
    root.classList.add('has-custom-cursor');
    var mouseX = -100;
    var mouseY = -100;
    var cursorX = -100;
    var cursorY = -100;

    document.addEventListener('pointermove', function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursor.classList.remove('is-hidden');
    }, { passive: true });

    document.addEventListener('pointerover', function (event) {
      var target = event.target.closest('[data-cursor]');
      if (!target) return;
      cursor.classList.add('is-active');
      if (cursorLabel) cursorLabel.textContent = target.getAttribute('data-cursor') || '';
    });

    document.addEventListener('pointerout', function (event) {
      var target = event.target.closest('[data-cursor]');
      var next = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest('[data-cursor]') : null;
      if (!target || target === next) return;
      cursor.classList.remove('is-active');
      if (cursorLabel) cursorLabel.textContent = '';
    });

    document.addEventListener('mouseleave', function () {
      cursor.classList.add('is-hidden');
    });

    (function renderCursor() {
      cursorX += (mouseX - cursorX) * .18;
      cursorY += (mouseY - cursorY) * .18;
      cursor.style.transform = 'translate3d(' + cursorX + 'px,' + cursorY + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(renderCursor);
    })();
  }

  if (finePointer && !reducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(function (element) {
      element.addEventListener('pointermove', function (event) {
        var rect = element.getBoundingClientRect();
        var strength = element.classList.contains('hero__cta') || element.closest('.contact') ? .17 : .1;
        var x = (event.clientX - rect.left - rect.width / 2) * strength;
        var y = (event.clientY - rect.top - rect.height / 2) * strength;
        element.style.setProperty('--magnet-x', x.toFixed(1) + 'px');
        element.style.setProperty('--magnet-y', y.toFixed(1) + 'px');
      });
      element.addEventListener('pointerleave', function () {
        element.style.setProperty('--magnet-x', '0px');
        element.style.setProperty('--magnet-y', '0px');
      });
    });

    document.querySelectorAll('.video-card').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = -2 + ((event.clientX - rect.left) / rect.width - .5) * 2.2;
        var y = -2 + ((event.clientY - rect.top) / rect.height - .5) * 2.2;
        card.style.setProperty('--depth-x', x.toFixed(2) + '%');
        card.style.setProperty('--depth-y', y.toFixed(2) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--depth-x', '-2%');
        card.style.setProperty('--depth-y', '-2%');
      });
    });
  }

  var header = document.querySelector('[data-header]');
  var scrollProgress = document.getElementById('scroll-progress');
  var scrollCurrent = document.getElementById('scroll-current');
  var scrollLabel = document.getElementById('scroll-label');
  var scrollSections = Array.from(document.querySelectorAll('[data-scroll-section]'));
  var navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  var heroPortrait = document.querySelector('.hero__portrait');
  var scrollTicking = false;

  function updateHeadTurn(scrollY) {
    if (!heroPortrait) return;
    if (reducedMotion) {
      heroPortrait.style.setProperty('--head-left', '0');
      heroPortrait.style.setProperty('--head-front', '1');
      heroPortrait.style.setProperty('--head-right', '0');
      heroPortrait.style.setProperty('--portal-shift', '0px');
      return;
    }
    var turnProgress = Math.max(0, Math.min(1, scrollY / Math.max(1, window.innerHeight * .3)));
    var leftOpacity = turnProgress < .3 ? 1 : 0;
    var frontOpacity = turnProgress >= .3 && turnProgress < .68 ? 1 : 0;
    var rightOpacity = turnProgress >= .68 ? 1 : 0;
    heroPortrait.style.setProperty('--head-left', leftOpacity.toFixed(3));
    heroPortrait.style.setProperty('--head-front', frontOpacity.toFixed(3));
    heroPortrait.style.setProperty('--head-right', rightOpacity.toFixed(3));
    heroPortrait.style.setProperty('--portal-shift', (-38 * turnProgress).toFixed(1) + 'px');
  }

  function updateScrollInterface() {
    var scrollY = window.scrollY;
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.max(0, Math.min(1, scrollY / maxScroll));
    var focusLine = window.innerHeight * .48;
    var activeIndex = 0;

    scrollSections.forEach(function (section, index) {
      var rect = section.getBoundingClientRect();
      if (rect.top <= focusLine) activeIndex = index;
    });

    if (scrollProgress) scrollProgress.style.transform = 'scaleY(' + progress + ')';
    root.style.setProperty('--rhythm-shift', (-18 * progress).toFixed(1) + 'vw');
    updateHeadTurn(scrollY);
    if (scrollCurrent) scrollCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
    if (scrollLabel && scrollSections[activeIndex]) {
      scrollLabel.textContent = scrollSections[activeIndex].getAttribute('data-scroll-label') || '';
    }
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', !!scrollSections[activeIndex] && link.getAttribute('href') === '#' + scrollSections[activeIndex].id);
    });

    if (header) {
      var modalOpen = !!document.querySelector('dialog[open]');
      header.classList.toggle('is-compact', scrollY > 120 && !modalOpen);
    }

    scrollTicking = false;
  }

  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollInterface);
  }, { passive: true });

  updateScrollInterface();

  var rhythmGame = document.querySelector('[data-rhythm-game]');
  var gameStage = document.querySelector('[data-game-stage]');
  var gameStartButton = document.querySelector('[data-game-start]');
  var gameScoreOutput = document.querySelector('[data-game-score]');
  var gameComboOutput = document.querySelector('[data-game-combo]');
  var gameTimeOutput = document.querySelector('[data-game-time]');
  var gameGoalScore = document.querySelector('[data-game-goal-score]');
  var gameStatus = document.querySelector('[data-game-status]');
  var gameReward = document.querySelector('[data-game-reward]');
  var gameGift = document.querySelector('[data-game-gift]');
  var openGiftButton = document.querySelector('[data-open-gift]');
  var gameRunning = false;
  var gameStartedAt = 0;
  var gameFrame = 0;
  var gameScore = 0;
  var gameCombo = 0;
  var targetAngle = 42;
  var pulseAngle = 0;
  var gameDuration = 20000;
  var gameGoal = 1000;
  var audioContext = null;

  function unlockGameReward() {
    if (!gameReward) return;
    gameReward.hidden = false;
    if (rhythmGame) rhythmGame.style.setProperty('--goal-progress', '1');
    if (gameGoalScore) gameGoalScore.textContent = String(gameGoal);
    try { localStorage.setItem('vlad-rhythm-reward-1000', 'unlocked'); } catch (_) {}
  }

  try {
    if (localStorage.getItem('vlad-rhythm-reward-1000') === 'unlocked') {
      unlockGameReward();
      if (gameStatus) gameStatus.textContent = 'Скидка 1000 ₽ уже разблокирована. Ниже — условия получения за видеоотзыв.';
    }
  } catch (_) {}

  function angleDistance(a, b) {
    return Math.abs(((a - b + 540) % 360) - 180);
  }

  function setTargetAngle(nextAngle) {
    targetAngle = nextAngle % 360;
    if (gameStage) gameStage.style.setProperty('--target-angle', targetAngle.toFixed(1) + 'deg');
  }

  function gameTone(frequency, duration) {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      var oscillator = audioContext.createOscillator();
      var gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.08, audioContext.currentTime + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration + .02);
    } catch (_) {}
  }

  function flashGameState(className) {
    if (!rhythmGame) return;
    rhythmGame.classList.remove('is-hit', 'is-miss');
    rhythmGame.classList.add(className);
    window.setTimeout(function () { rhythmGame.classList.remove(className); }, 180);
  }

  function updateGameGoal() {
    var displayedScore = Math.min(gameScore, gameGoal);
    if (rhythmGame) rhythmGame.style.setProperty('--goal-progress', (displayedScore / gameGoal).toFixed(3));
    if (gameGoalScore) gameGoalScore.textContent = String(displayedScore);
  }

  function showGameGift() {
    gameRunning = false;
    cancelAnimationFrame(gameFrame);
    if (rhythmGame) {
      rhythmGame.classList.remove('is-playing');
      rhythmGame.classList.add('is-won');
    }
    if (gameGift) gameGift.hidden = false;
    if (gameStatus) gameStatus.textContent = '1000 очков! Игра окончена — откройте подарок.';
    if (gameStartButton) {
      gameStartButton.textContent = 'Победа!';
      gameStartButton.disabled = true;
    }
    gameTone(880, .18);
  }

  function spawnScorePop(points, label) {
    if (!gameStage) return;
    var pop = document.createElement('span');
    pop.className = 'score-pop';
    pop.style.setProperty('--pop-rotate', ((Math.random() - .5) * 12).toFixed(1) + 'deg');
    pop.innerHTML = '+' + points + '<small>' + label + '</small>';
    gameStage.appendChild(pop);
    window.setTimeout(function () { pop.remove(); }, 760);
  }

  function renderGame(now) {
    if (!gameRunning || !gameStage) return;
    var elapsed = now - gameStartedAt;
    var remaining = Math.max(0, gameDuration - elapsed);
    pulseAngle = (elapsed * .135) % 360;
    gameStage.style.setProperty('--pulse-angle', pulseAngle.toFixed(1) + 'deg');
    if (gameTimeOutput) gameTimeOutput.textContent = (remaining / 1000).toFixed(1);

    if (remaining <= 0) {
      gameRunning = false;
      rhythmGame.classList.remove('is-playing');
      if (gameStartButton) gameStartButton.disabled = false;
      if (gameStartButton) gameStartButton.innerHTML = 'Ещё раз <span>↗</span>';
      if (gameScore >= gameGoal) {
        showGameGift();
      } else {
        if (gameStatus) gameStatus.textContent = 'До награды не хватило совсем немного. Попробуйте ещё раз и соберите комбо.';
        gameTone(330, .22);
      }
      return;
    }
    gameFrame = requestAnimationFrame(renderGame);
  }

  function startGame() {
    if (!rhythmGame || !gameStage) return;
    cancelAnimationFrame(gameFrame);
    gameRunning = true;
    gameScore = 0;
    gameCombo = 0;
    pulseAngle = 0;
    gameStartedAt = performance.now();
    setTargetAngle(42);
    rhythmGame.classList.remove('is-won');
    rhythmGame.classList.add('is-playing');
    if (gameGift) {
      gameGift.hidden = true;
      gameGift.classList.remove('is-opening');
    }
    if (gameScoreOutput) gameScoreOutput.textContent = '000';
    if (gameComboOutput) gameComboOutput.textContent = '×0';
    if (gameTimeOutput) gameTimeOutput.textContent = '20.0';
    updateGameGoal();
    if (gameStatus) gameStatus.textContent = 'Ловите синюю мишень. Точность и комбо ведут к 1000 очков.';
    if (gameStartButton) {
      gameStartButton.textContent = 'Игра идёт…';
      gameStartButton.disabled = false;
    }
    gameStage.focus({ preventScroll: true });
    gameFrame = requestAnimationFrame(renderGame);
  }

  function hitRhythm() {
    if (!gameRunning) {
      startGame();
      return;
    }
    var distance = angleDistance(pulseAngle, targetAngle);
    if (distance <= 22) {
      gameCombo += 1;
      var earned = Math.max(35, Math.round((145 - distance * 4) * (1 + Math.min(gameCombo, 8) * .1)));
      if (gameCombo > 0 && gameCombo % 3 === 0) earned += 50;
      gameScore += earned;
      flashGameState('is-hit');
      gameTone(distance < 8 ? 740 : 520, .09);
      spawnScorePop(earned, distance < 8 ? 'идеально' : (gameCombo % 3 === 0 ? 'комбо ×' + gameCombo : 'попадание'));
      var offset = 78 + Math.random() * 190;
      setTargetAngle(targetAngle + offset);
      if (gameScore >= gameGoal) {
        showGameGift();
      } else if (gameStatus) {
        gameStatus.textContent = distance < 8 ? 'Идеально. Продолжайте.' : 'Есть попадание.';
      }
    } else {
      gameCombo = 0;
      flashGameState('is-miss');
      gameTone(180, .07);
      if (gameStatus) gameStatus.textContent = 'Чуть раньше или позже. Следите за белой точкой.';
    }
    if (gameScoreOutput) gameScoreOutput.textContent = String(gameScore).padStart(3, '0');
    if (gameComboOutput) gameComboOutput.textContent = '×' + gameCombo;
    updateGameGoal();
  }

  if (gameStartButton) gameStartButton.addEventListener('click', startGame);
  if (openGiftButton) {
    openGiftButton.addEventListener('click', function () {
      if (!gameGift || gameGift.classList.contains('is-opening')) return;
      gameGift.classList.add('is-opening');
      openGiftButton.disabled = true;
      gameTone(1040, .2);
      window.setTimeout(function () {
        unlockGameReward();
        gameGift.hidden = true;
        gameGift.classList.remove('is-opening');
        openGiftButton.disabled = false;
        if (rhythmGame) rhythmGame.classList.remove('is-won');
        if (gameStartButton) {
          gameStartButton.disabled = false;
          gameStartButton.innerHTML = 'Ещё раз <span>↗</span>';
        }
        if (gameStatus) gameStatus.textContent = 'Подарок открыт: скидка 1000 ₽ за видеоотзыв.';
        gameReward.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      }, 720);
    });
  }
  if (gameStage) {
    gameStage.addEventListener('pointerdown', hitRhythm);
    gameStage.addEventListener('keydown', function (event) {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      hitRhythm();
    });
  }

  function lockPage(locked) {
    document.body.classList.toggle('is-locked', locked);
  }

  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    lockPage(true);
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    lockPage(false);
    if (dialog === videoDialog && videoPlayer) {
      videoPlayer.pause();
      videoPlayer.removeAttribute('src');
      videoPlayer.load();
    }
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menuButton.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
      nav.classList.toggle('is-open', !open);
    });

    nav.addEventListener('click', function (event) {
      if (!event.target.closest('a')) return;
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Открыть меню');
    });
  }

  document.addEventListener('click', function (event) {
    var contactTrigger = event.target.closest('[data-open-contact]');
    var formatTrigger = event.target.closest('[data-select-format]');
    var videoTrigger = event.target.closest('[data-video]');
    var reviewTrigger = event.target.closest('[data-review-image]');
    var closeTrigger = event.target.closest('[data-close-dialog]');

    if (contactTrigger) {
      var contactDate = contactForm ? contactForm.querySelector('input[name="event_date"]') : null;
      if (contactDate && dateInput && dateInput.value && !contactDate.value) contactDate.value = dateInput.value;
      openDialog(contactDialog);
      return;
    }

    if (formatTrigger) {
      var format = formatTrigger.getAttribute('data-select-format');
      var select = document.getElementById('calc-format');
      if (select) {
        select.value = format;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      document.getElementById('price').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (videoTrigger && videoDialog && videoPlayer) {
      videoPlayer.src = videoTrigger.getAttribute('data-video');
      videoTitle.textContent = videoTrigger.getAttribute('data-title') || 'Видео выступления';
      openDialog(videoDialog);
      videoPlayer.play().catch(function () {});
      return;
    }

    if (reviewTrigger && reviewDialog && reviewImage) {
      reviewImage.src = reviewTrigger.getAttribute('data-review-image');
      openDialog(reviewDialog);
      return;
    }

    if (closeTrigger) closeDialog(closeTrigger.closest('dialog'));
  });

  document.querySelectorAll('dialog').forEach(function (dialog) {
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeDialog(dialog);
    });
  });

  var formatSelect = document.getElementById('calc-format');
  var durationInput = document.getElementById('calc-duration');
  var durationOutput = document.getElementById('duration-output');
  var priceOutput = document.getElementById('calc-price');
  var breakdown = document.getElementById('calc-breakdown');
  var dateInput = document.getElementById('calc-date');

  var formatNames = {
    acoustic: 'Камерный вечер',
    party: 'Живая вечеринка',
    mini: 'Мини-группа'
  };

  function money(value) {
    return Math.round(value).toLocaleString('ru-RU') + ' ₽';
  }

  function durationLabel(value) {
    var hours = Number(value);
    if (hours === .5) return '30 минут';
    if (hours === 1) return '1 час';
    if (hours % 1) return String(hours).replace('.', ',') + ' часа';
    if (hours >= 2 && hours <= 4) return hours + ' часа';
    return hours + ' часов';
  }

  function calculate() {
    if (!formatSelect || !durationInput || !durationOutput || !priceOutput || !breakdown) return;
    var format = formatSelect.value;
    var hours = Number(durationInput.value);
    var musician = Math.max(8000, hours * 5000);
    var equipment = format === 'party' || format === 'mini' ? 4000 : 0;
    var percussion = format === 'mini' ? Math.max(5000, hours * 3000) : 0;
    var total = musician + equipment + percussion;
    var rows = [{ label: 'Музыкант · ' + durationLabel(hours), value: musician }];

    if (equipment) rows.push({ label: 'Звуковое оборудование', value: equipment });
    if (percussion) rows.push({ label: 'Кахон и второй музыкант', value: percussion });

    durationOutput.textContent = durationLabel(hours);
    priceOutput.textContent = money(total);
    breakdown.innerHTML = rows.map(function (row) {
      return '<li><span>' + row.label + '</span><b>' + money(row.value) + '</b></li>';
    }).join('');

    if (contactFormat) contactFormat.value = formatNames[format] || formatNames.acoustic;
  }

  [formatSelect, durationInput].forEach(function (element) {
    if (!element) return;
    element.addEventListener('input', calculate);
    element.addEventListener('change', calculate);
  });

  if (dateInput) {
    var today = new Date();
    var offset = today.getTimezoneOffset() * 60000;
    dateInput.min = new Date(today.getTime() - offset).toISOString().slice(0, 10);
  }

  calculate();

  var phoneInput = contactForm ? contactForm.querySelector('input[name="phone"]') : null;
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var digits = phoneInput.value.replace(/\D/g, '');
      if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
      if (digits.charAt(0) !== '7') digits = '7' + digits;
      digits = digits.slice(0, 11);
      var value = '+7';
      if (digits.length > 1) value += ' ' + digits.slice(1, 4);
      if (digits.length > 4) value += ' ' + digits.slice(4, 7);
      if (digits.length > 7) value += '-' + digits.slice(7, 9);
      if (digits.length > 9) value += '-' + digits.slice(9, 11);
      phoneInput.value = value;
    });
  }

  function setFormStatus(message, state) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = 'form-status' + (state ? ' ' + state : '');
  }

  function buildLead(formData) {
    var params = new URLSearchParams(location.search);
    return {
      source: 'personal_site',
      artistSlug: config.artistSlug || 'vladislav-hekolov',
      acceptPersonalData: true,
      website: '',
      contact: {
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim()
      },
      event: {
        date: String(formData.get('event_date') || '').trim() || null,
        type: String(formData.get('event_type') || '').trim() || null,
        performanceFormat: String(formData.get('performance_format') || '').trim() || null,
        address: String(formData.get('address') || '').trim() || null,
        comment: String(formData.get('comment') || '').trim() || null
      },
      attribution: {
        pageUrl: location.href,
        referrer: document.referrer || null,
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign')
      }
    };
  }

  function submitToVocava(lead) {
    var base = String(config.apiBaseUrl || '').replace(/\/$/, '');
    var path = config.leadEndpoint || '/api/public/leads';
    if (!base) return Promise.reject(new Error('API is not configured'));
    return fetch(base + path, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).then(function (response) {
      if (!response.ok) throw new Error('API error ' + response.status);
      return response.json();
    });
  }

  function submitToFallback(formData) {
    var payload = new FormData();
    payload.append('_subject', 'Новая заявка с сайта');
    payload.append('_template', 'table');
    payload.append('_captcha', 'false');
    payload.append('Имя', formData.get('name'));
    payload.append('Телефон', formData.get('phone'));
    payload.append('Дата события', formData.get('event_date') || 'Не указана');
    payload.append('Тип мероприятия', formData.get('event_type') || 'Не указан');
    payload.append('Формат', formData.get('performance_format') || 'Не указан');
    payload.append('Адрес', formData.get('address') || 'Не указан');
    payload.append('Комментарий', formData.get('comment') || 'Без комментария');
    return fetch('https://formsubmit.co/ajax/hekoloff@yandex.ru', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: payload
    }).then(function (response) {
      if (!response.ok) throw new Error('Fallback error ' + response.status);
      return response.json();
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      var formData = new FormData(contactForm);

      if (localPreview) {
        setFormStatus('Тестовая заявка заполнена. На локальной версии отправка отключена.', 'is-success');
        return;
      }

      contactSubmit.disabled = true;
      contactSubmit.textContent = 'Отправляем…';
      setFormStatus('');

      submitToVocava(buildLead(formData))
        .catch(function (error) {
          if (config.formSubmitFallbackEnabled) return submitToFallback(formData);
          throw error;
        })
        .then(function () {
          contactForm.reset();
          setFormStatus('Спасибо! Заявка отправлена — скоро свяжусь с вами.', 'is-success');
        })
        .catch(function () {
          setFormStatus('Не получилось отправить. Напишите в Telegram или позвоните.', 'is-error');
        })
        .finally(function () {
          contactSubmit.disabled = false;
          contactSubmit.textContent = 'Отправить заявку';
        });
    });
  }

  var revealElements = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach(function (element) { element.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    revealElements.forEach(function (element) { observer.observe(element); });
  }
})();
