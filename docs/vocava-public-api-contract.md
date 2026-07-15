# VOCAVA public API contract for vladislovex.ru

This document describes the public read-only endpoints expected by the personal website. PostgreSQL remains the single source of truth. The personal website must never receive database credentials or connect directly to PostgreSQL.

## Base URL

```text
https://api.vocava.ru
```

## CORS

Allow browser requests from:

```text
https://vladislovex.ru
https://www.vladislovex.ru
```

Recommended headers:

```text
Access-Control-Allow-Origin: https://vladislovex.ru
Vary: Origin
Content-Type: application/json; charset=utf-8
```

## 1. Published artists

```http
GET /api/public/artists
```

Return only artists that are published and allowed to appear in the public catalogue.

Preferred response:

```json
{
  "ok": true,
  "artists": [
    {
      "id": "artist-id-or-stable-slug",
      "slug": "artist-slug",
      "name": "Артур",
      "isPublished": true,
      "category": "Гитарист-вокалист",
      "categorySlug": "guitar-vocal",
      "gender": "М",
      "age": 27,
      "sortOrder": 10,
      "shortText": "Короткое описание для карточки",
      "description": "Полное публичное описание музыканта",
      "videoUrl": "https://...",
      "performanceFormat": "Гитара, вокал и кахон",
      "repertoireSummary": "Более 150 песен",
      "repertoireDescription": "Описание музыкального материала",
      "photos": [
        { "url": "https://..." },
        { "url": "https://..." }
      ],
      "updatedAt": "2026-07-15T10:00:00.000Z"
    }
  ]
}
```

The frontend adapter also accepts a top-level array and the keys `rows`, `items`, `data.artists`, `data.rows`, or `data.items`.

## 2. Artist repertoire

```http
GET /api/public/artists/:artistId/repertoire
```

Preferred response:

```json
{
  "ok": true,
  "data": {
    "artist": {
      "id": "artist-id-or-stable-slug",
      "name": "Артур",
      "category": "Гитарист-вокалист",
      "performanceFormat": "Гитара, вокал и кахон"
    },
    "songs": [
      {
        "id": "song-id",
        "title": "Название песни",
        "originalArtist": "Исполнитель",
        "genre": "Поп",
        "mood": "Доброе",
        "energy": "Средняя",
        "language": "Русский",
        "tags": ["танцы", "хиты"],
        "sortOrder": 10
      }
    ]
  }
}
```

For compatibility, the frontend also tries:

```text
GET /api/public/repertoire?artist_id=:artistId
GET /api/public/repertoire/:artistId
```

The songs array may also be returned under `songs`, `items`, `rows`, `data.songs`, `data.items`, or `data.rows`.

## Publishing rules

- Draft, rejected, deleted, blocked, or unpublished artists must not be returned.
- Only public fields may be included. Do not expose private phone numbers, emails, documents, internal notes, manager comments, or account identifiers.
- Artist IDs must remain stable after editing.
- Removed songs must disappear from the public repertoire response immediately after the transaction is committed.

## Performance and freshness

- Target API response time: under 300 ms from the server cache and under 800 ms from PostgreSQL.
- The personal website keeps a browser cache for 30 seconds.
- Recommended backend cache TTL: 30–60 seconds.
- Saving or publishing an artist in VOCAVA should invalidate the relevant artists and repertoire cache keys immediately.
- Support `ETag` or `Last-Modified` when practical.

## Errors

Use JSON errors and appropriate HTTP status codes:

```json
{
  "ok": false,
  "error": "artist_not_found"
}
```

- `404` — artist does not exist or is not public.
- `400` — invalid identifier.
- `500` — unexpected server failure.

The personal website temporarily falls back to the existing Google Apps Script sources when the public API is unavailable. This fallback can be removed after the PostgreSQL endpoints are verified in production.
