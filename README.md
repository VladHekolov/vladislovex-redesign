# Vladislovex standalone — Stage 1

Первая независимая версия личного сайта без обязательной зависимости от Tilda.

## Что уже сделано

- HTML оформлен как полноценный документ.
- CSS и JavaScript подключаются локально.
- Яндекс Метрика оставлена в одном экземпляре.
- Сохранён текущий FormSubmit как рабочий канал заявок.
- Добавлен переключаемый адаптер для будущего API VOCAVA.
- Добавлены `robots.txt` и `sitemap.xml`.

## Локальный запуск

Нельзя открывать `index.html` двойным кликом из-за абсолютных путей `/assets/...`.
Запустите локальный HTTP-сервер из папки проекта:

```bash
python3 -m http.server 8080
```

Затем откройте `http://localhost:8080`.

## Подключение VOCAVA API

В `assets/js/config.js` после публикации backend:

```js
apiBaseUrl: 'https://api.vocava.ru',
useVocavaApi: true
```

Публичный endpoint должен принимать `POST /api/public/leads`.
Секреты PostgreSQL нельзя помещать в `config.js` или любой браузерный JavaScript.


## Этап 2: подключение к VOCAVA

Сайт настроен на `https://api.vocava.ru/api/public/leads`. Пока backend не опубликован на этом адресе, включён резервный FormSubmit. После успешного запуска API рекомендуется установить `formSubmitFallbackEnabled: false`, чтобы все заявки гарантированно сохранялись только в PostgreSQL VOCAVA.
