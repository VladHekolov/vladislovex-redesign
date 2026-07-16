# VLADISLOVEX Design System

The public site uses one shared visual system across the main page, `/artists/` and `/repertoire/`.

## Source files

- `assets/css/design-tokens.css` — colors, font weights, spacing, heights, radii, shadows and transitions.
- `assets/css/typography.css` — responsive type scale and reading widths.
- `assets/css/components.css` — reusable titles, buttons, fields, cards, badges and layout primitives.
- `assets/css/themes.css` — page-level dark and light theme adaptations.
- `assets/css/icons.css` — icon sizing and behavior.

Page-specific files should primarily control layout, media and unique interactions. They should not introduce arbitrary button weights, control heights or heading scales.

## Typography

```html
<h1 class="vh-title vh-title--page">Page title</h1>
<h2 class="vh-title vh-title--section">Section title</h2>
<h3 class="vh-title vh-title--card">Card title</h3>
<p class="vh-lead">Large supporting text.</p>
<p class="vh-body-text">Body copy.</p>
```

Available title variants:

- `vh-title--display`
- `vh-title--page`
- `vh-title--section`
- `vh-title--card`

## Buttons

```html
<a class="vh-button vh-button--primary vh-button--lg" href="#">Primary action</a>
<button class="vh-button vh-button--secondary">Secondary action</button>
<button class="vh-button vh-button--outline">Outline action</button>
<button class="vh-button vh-button--ghost vh-button--sm">Quiet action</button>
<button class="vh-icon-button" aria-label="Open filters">...</button>
```

All text buttons inherit `--vh-weight-button`. Change that token to update button weight across the site.

## Forms

```html
<label class="vh-field">
  <span class="vh-field__label">Event date</span>
  <input class="vh-input" type="date">
</label>
```

Available controls:

- `vh-input`
- `vh-select`
- `vh-textarea`

## Cards and layout

```html
<section class="vh-section">
  <div class="vh-container">
    <article class="vh-card vh-card--interactive">...</article>
  </div>
</section>
```

## Rules for future changes

1. Use existing tokens before adding a numeric value.
2. Use `vh-title` variants instead of assigning a new heading size.
3. Use `vh-button` variants instead of defining button font weight locally.
4. Use `vh-icon-button` for square or circular icon-only controls.
5. Add a new token only when an existing token cannot express the design requirement.
6. Keep unique page layout in local CSS; keep shared appearance in the design-system files.
7. Do not use `!important` in new local styles unless it is required for a documented legacy migration.
