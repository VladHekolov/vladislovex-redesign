/* Reliable contact form submission. Loaded after the main markup and intercepts the legacy handler. */
(function () {
  'use strict';

  var form = document.getElementById('vhContactForm');
  var modal = document.getElementById('vhContactModal');
  var status = document.getElementById('vhContactStatus');
  var submit = document.getElementById('vhContactSubmit');
  var config = window.VLADISLOVEX_CONFIG || {};

  if (!form || !status || !submit) return;

  var subtitle = form.querySelector('.vh-contact-form__top p');
  if (subtitle) subtitle.textContent = 'Заполните форму — заявка придёт мне в Telegram.';

  var submitText = submit.querySelector('.vh-contact-submit__text');
  var submitIcon = submit.querySelector('.vh-contact-submit__icon');
  if (submitText) submitText.textContent = 'Отправить заявку';
  if (submitIcon) submitIcon.style.display = 'none';

  function clean(value) {
    return String(value || '').trim();
  }

  function digits(value) {
    return clean(value).replace(/\D/g, '');
  }

  function setStatus(text, type) {
    status.textContent = text || '';
    status.classList.remove('is-success', 'is-error');
    if (type) status.classList.add(type);
  }

  function formValue(name) {
    var field = form.elements[name];
    return field ? clean(field.value) : '';
  }

  function buildEmailPayload() {
    return {
      _subject: 'Новая заявка с сайта: нужно позвонить клиенту',
      _template: 'table',
      _captcha: 'false',
      'Имя': formValue('name'),
      'Телефон': formValue('phone'),
      'Дата события': formValue('event_date') || 'Не указана',
      'Формат выступления': formValue('performance_format') || 'Не указан',
      'Тип мероприятия': formValue('event_type') || 'Не указан',
      'Адрес': formValue('address') || 'Не указан',
      'Комментарий': formValue('comment') || 'Без комментария',
      'Страница': window.location.href,
      'Время заявки': new Date().toLocaleString('ru-RU')
    };
  }

  function buildVocavaPayload(emailPayload) {
    var params = new URLSearchParams(window.location.search);
    return {
      source: 'personal_site',
      artistSlug: config.artistSlug || 'vladislav-hekolov',
      acceptPersonalData: true,
      website: '',
      contact: {
        name: emailPayload['Имя'],
        phone: emailPayload['Телефон']
      },
      event: {
        date: emailPayload['Дата события'] === 'Не указана' ? null : emailPayload['Дата события'],
        type: emailPayload['Тип мероприятия'] === 'Не указан' ? null : emailPayload['Тип мероприятия'],
        performanceFormat: emailPayload['Формат выступления'] === 'Не указан' ? null : emailPayload['Формат выступления'],
        address: emailPayload['Адрес'] === 'Не указан' ? null : emailPayload['Адрес'],
        comment: emailPayload['Комментарий'] === 'Без комментария' ? null : emailPayload['Комментарий']
      },
      attribution: {
        pageUrl: window.location.href,
        referrer: document.referrer || null,
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign'),
        utmContent: params.get('utm_content'),
        utmTerm: params.get('utm_term'),
        yclid: params.get('yclid')
      }
    };
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    var requestOptions = Object.assign({}, options, { signal: controller.signal });

    return fetch(url, requestOptions).finally(function () {
      clearTimeout(timer);
    });
  }

  function submitToVocava(emailPayload) {
    var base = clean(config.apiBaseUrl).replace(/\/$/, '');
    var path = config.leadEndpoint || '/api/public/leads';
    if (!base) return Promise.reject(new Error('vocava_api_not_configured'));

    return fetchWithTimeout(base + path, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildVocavaPayload(emailPayload))
    }, Number(config.leadRequestTimeoutMs || 10000)).then(function (response) {
      if (!response.ok) throw new Error('vocava_api_failed_' + response.status);
      return response.json();
    });
  }

  function submitToFormSubmit(emailPayload) {
    var body = new FormData();
    Object.keys(emailPayload).forEach(function (key) {
      body.append(key, emailPayload[key]);
    });

    return fetchWithTimeout('https://formsubmit.co/ajax/hekoloff@yandex.ru', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: body
    }, 10000).then(function (response) {
      if (!response.ok) throw new Error('formsubmit_failed_' + response.status);
      return response.json();
    });
  }

  function send(emailPayload) {
    return submitToVocava(emailPayload).catch(function (apiError) {
      if (config.formSubmitFallbackEnabled === false) throw apiError;
      return submitToFormSubmit(emailPayload);
    });
  }

  function resetVisualState() {
    form.reset();

    var dateInput = document.getElementById('vhContactDate');
    var dateWrap = document.getElementById('vhContactDateWrap');
    var suggestions = document.getElementById('vhContactSuggestions');

    if (dateInput) dateInput.classList.remove('is-filled');
    if (dateWrap) dateWrap.classList.remove('is-filled');
    if (suggestions) {
      suggestions.innerHTML = '';
      suggestions.classList.remove('is-visible');
    }
  }

  function closeModalAfterSuccess() {
    if (!modal) return;
    setTimeout(function () {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (window.VHUI) window.VHUI.unlock(modal);
      setStatus('', '');
    }, 2200);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    var name = formValue('name');
    var phone = formValue('phone');
    var consent = form.elements.consent && form.elements.consent.checked;

    if (!name) {
      setStatus('Напишите, пожалуйста, ваше имя.', 'is-error');
      return;
    }
    if (digits(phone).length < 11) {
      setStatus('Проверьте номер телефона — не хватает цифр.', 'is-error');
      return;
    }
    if (!consent) {
      setStatus('Нужно согласие на обработку данных, чтобы я мог связаться с вами.', 'is-error');
      return;
    }

    submit.disabled = true;
    setStatus('Отправляю заявку...', '');

    var emailPayload = buildEmailPayload();
    send(emailPayload)
      .then(function () {
        if (typeof window.ym === 'function') {
          window.ym(110736648, 'reachGoal', 'lead_form_success');
        }
        resetVisualState();
        setStatus('Готово! Заявка отправлена. Я скоро свяжусь с вами.', 'is-success');
        closeModalAfterSuccess();
      })
      .catch(function (error) {
        console.error('Contact form submission failed:', error);
        setStatus('Не получилось отправить заявку. Попробуйте ещё раз или напишите в Telegram.', 'is-error');
      })
      .finally(function () {
        submit.disabled = false;
      });
  }, true);
})();
