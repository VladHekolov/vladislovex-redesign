import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migratedFiles = [
  'assets/css/subpages.css',
  'assets/css/artist-modal.css',
  'assets/css/repertoire-system.css',
  'assets/css/artists-system.css'
];

const requiredTokens = [
  '--vh-font-family',
  '--vh-weight-heading',
  '--vh-weight-button',
  '--vh-control-height-md',
  '--vh-radius-pill',
  '--vh-text',
  '--vh-surface',
  '--vh-border'
];

const forbiddenRules = [
  {
    pattern: /font-family\s*:\s*([^;}\n]+)/gi,
    validate: (value) => !value.trim().startsWith('var('),
    message: 'Use --vh-font-family instead of declaring a local font family.'
  },
  {
    pattern: /font\s*:\s*([^;}\n]+)/gi,
    validate: (value) => !/^inherit(?:\s*!important)?$/i.test(value.trim()) && !value.trim().startsWith('var('),
    message: 'Avoid local font shorthand; consume typography tokens or shared components.'
  },
  {
    pattern: /font-weight\s*:\s*([^;}\n]+)/gi,
    validate: (value) => !value.trim().startsWith('var('),
    message: 'Use a --vh-weight-* token instead of a local font weight.'
  },
  {
    pattern: /border-radius\s*:\s*([^;}\n]+)/gi,
    validate: (value) => !value.trim().startsWith('var('),
    message: 'Use a --vh-radius-* token instead of a local radius.'
  },
  {
    pattern: /--vh-(?:page|page-alt|surface|text|accent|danger|success|weight|radius|control-height)\s*:/gi,
    message: 'Global design tokens may only be declared in design-system.css.'
  }
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

const errors = [];

for (const relativePath of migratedFiles) {
  const source = read(relativePath);

  if (!source.includes('var(--vh-')) {
    errors.push(`${relativePath}: file does not consume design-system tokens.`);
  }

  for (const rule of forbiddenRules) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(source))) {
      const value = match[1] || '';
      if (rule.validate && !rule.validate(value)) continue;
      errors.push(`${relativePath}:${lineNumber(source, match.index)} ${rule.message}`);
    }
  }
}

const tokensSource = read('assets/css/design-system.css');
for (const token of requiredTokens) {
  if (!tokensSource.includes(token)) {
    errors.push(`assets/css/design-system.css: missing required token ${token}.`);
  }
}

const componentsSource = read('assets/css/shared-ui.css');
for (const selector of ['.vh-button', '.vh-card', '.vh-input']) {
  if (!componentsSource.includes(selector)) {
    errors.push(`assets/css/shared-ui.css: missing shared component ${selector}.`);
  }
}

const typographySource = read('assets/css/design-system.css');
for (const selector of [
  '.vh-title',
  '.vh-site-title',
  '.vh-title--card',
  '.vh-lead',
  '.vh-body-text',
  '.vh-text--small',
  '.vh-label',
  '.vh-section-head'
]) {
  if (!typographySource.includes(selector)) {
    errors.push(`assets/css/design-system.css: missing shared typography component ${selector}.`);
  }
}

const pages = ['artists/index.html', 'repertoire/index.html'];
for (const page of pages) {
  const source = read(page);
  if (!source.includes('/assets/css/shared-ui.css')) {
    errors.push(`${page}: shared-ui.css is not connected.`);
  }
  if (!source.includes('/assets/css/design-system.css')) {
    errors.push(`${page}: design-system.css is not connected.`);
  }
  if (!source.includes('vh-site-title')) {
    errors.push(`${page}: page title is not connected to the shared site-title component.`);
  }
  if (!source.includes('vh-button')) {
    errors.push(`${page}: primary actions are not connected to the shared button component.`);
  }
}

const repertoirePage = read('repertoire/index.html');
if (!repertoirePage.includes('/assets/css/repertoire-system.css')) {
  errors.push('repertoire/index.html: repertoire-system.css is not connected.');
}
if (!repertoirePage.includes('data-vh-repertoire-system')) {
  errors.push('repertoire/index.html: repertoire system stylesheet marker is missing.');
}

const artistsPage = read('artists/index.html');
if (!artistsPage.includes('/assets/css/artists-system.css')) {
  errors.push('artists/index.html: artists-system.css is not connected.');
}
if (!artistsPage.includes('data-vh-artists-system')) {
  errors.push('artists/index.html: catalog system stylesheet marker is missing.');
}

const homepagePage = read('index.html');
for (const requirement of [
  ['/assets/css/site.css', 'site.css is not connected in index.html.'],
  ['/assets/js/site.js', 'site.js is not connected in index.html.']
]) {
  if (!homepagePage.includes(requirement[0])) errors.push(`index.html: ${requirement[1]}`);
}
for (const legacyAsset of ['home-base.css', 'home.css', 'app.js', 'redesign.css', 'redesign.js']) {
  if (homepagePage.includes(legacyAsset)) errors.push(`index.html: legacy asset ${legacyAsset} must not be connected.`);
}

const artistsScript = read('assets/js/artists.js');
if (!artistsScript.includes('vh-artist-card__text vh-text--small')) {
  errors.push('assets/js/artists.js: artist-card copy is not connected to the compact text role.');
}

const artistCardView = read('assets/js/artist-card-view.js');
for (const selector of [
  'vh-artist-modal__short vh-body-text',
  'vh-artist-modal__about vh-body-text'
]) {
  if (!artistCardView.includes(selector)) {
    errors.push(`assets/js/artist-card-view.js: modal copy is not connected to ${selector}.`);
  }
}

const homepageConfig = read('assets/js/config.js');
if (homepageConfig.includes('loadStylesheet')) {
  errors.push('assets/js/config.js: CSS must not be injected after first paint.');
}
for (const page of pages) {
  if (read(page).includes('/assets/js/route-distance-openrouteservice.js')) {
    errors.push(`${page}: homepage route-distance adapter must not be loaded on subpages.`);
  }
}

const visualFixes = read('assets/css/site.css');
for (const requiredRule of [
  '--container',
  '.video-grid',
  '.format-list',
  '.calculator__grid',
  'font-family: var(--sans)'
]) {
  if (!visualFixes.includes(requiredRule)) {
    errors.push(`assets/css/site.css: missing required visual foundation ${requiredRule}.`);
  }
}

const legacyFiles = [
  'assets/css/site.css',
  'assets/css/repertoire.css',
  'assets/css/artists.css',
  'assets/css/shared-ui.css'
];

const legacyStats = legacyFiles.map((relativePath) => {
  const source = read(relativePath);
  return {
    file: relativePath,
    fontWeights: (source.match(/font-weight\s*:/gi) || []).length,
    radii: (source.match(/border-radius\s*:/gi) || []).length,
    controlHeights: (source.match(/(?:min-)?height\s*:/gi) || []).length
  };
});

console.log('Design-system migration report:');
for (const stat of legacyStats) {
  console.log(`- ${stat.file}: weights=${stat.fontWeights}, radii=${stat.radii}, heights=${stat.controlHeights}`);
}

if (errors.length) {
  console.error('\nDesign-system contract violations:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('\nDesign-system audit passed.');
