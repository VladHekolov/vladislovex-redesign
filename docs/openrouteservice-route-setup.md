# Расчёт маршрута через backend и openrouteservice

Личный сайт не обращается к openrouteservice напрямую. Он отправляет координаты выбранного адреса в backend VOCAVA, а backend использует закрытый ключ из переменной окружения `OPENROUTESERVICE_API_KEY`.

Сайт получает только длину автомобильного маршрута и примерное время в пути. Ключ openrouteservice не попадает в браузер, JavaScript или публичный репозиторий.

## Схема

```text
Личный сайт
  → POST /api/public/route-distance
  → backend VOCAVA
  → openrouteservice Directions API
  → расстояние и время
```

Если backend или openrouteservice временно недоступен, калькулятор автоматически возвращается к прежнему резервному расчёту от МКАД.

## Переменные окружения backend

Обязательная переменная:

```env
OPENROUTESERVICE_API_KEY=ключ_openrouteservice
```

Необязательные настройки точки выезда:

```env
ROUTE_ORIGIN_LAT=55.812054
ROUTE_ORIGIN_LON=37.363205
ROUTE_ORIGIN_LABEL=Павшинская пойма, Красногорск
```

Если координаты не заданы, backend использует безопасную публичную точку в Павшинской пойме. Точный домашний адрес в код не добавляется.

Дополнительные настройки:

```env
ROUTE_DISTANCE_CACHE_TTL_MS=600000
ROUTE_DISTANCE_TIMEOUT_MS=8000
ROUTE_DISTANCE_RATE_LIMIT_MAX=30
ROUTE_DISTANCE_RATE_LIMIT_WINDOW_MS=600000
```

## Публичный endpoint

Запрос:

```http
POST /api/public/route-distance
Content-Type: application/json
```

```json
{
  "lat": 55.755864,
  "lon": 37.617698
}
```

Ответ:

```json
{
  "ok": true,
  "route": {
    "distanceMeters": 24500,
    "durationSeconds": 1800,
    "oneWayKm": 24.5,
    "roundTripKm": 49
  }
}
```

Endpoint разрешён только для доменов личного сайта, использует серверный кэш и ограничивает частоту запросов с одного IP.

## Тарифные диапазоны

Доплата считается по приблизительному маршруту туда и обратно:

- до 40 км — без доплаты;
- 40–70 км — 3 000 ₽;
- 70–100 км — 4 000 ₽;
- 100–150 км — 5 000 ₽;
- 150–200 км — 6 000 ₽;
- 200–260 км — 7 000 ₽;
- 260–320 км — 8 000 ₽;
- свыше 320 км — 9 000 ₽.

Диапазоны находятся в `openRouteServiceRoute.tariffBands` внутри `assets/js/config.js`.
