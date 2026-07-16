import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migratedFiles = [
  'assets/css/subpages.css',
  'assets/css/artist-modal.css',
  'assets/css/repertoire-system.css',
  'assets/css/artists-system.css',
  'assets/css/home-system.css'
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
    message: 'Global design tokens may only be declared in design-tokens.css.'
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

const tokensSource = read('assets/css/design-tokens.css');
for (const token of requiredTokens) {
  if (!tokensSource.includes(token)) {
    errors.push(`assets/css/design-tokens.css: missing required token ${token}.`);
  }
}

const componentsSource = read('assets/css/components.css');
for (const selector of ['.vh-button', '.vh-title', '.vh-card', '.vh-input']) {
  if (!componentsSource.includes(selector)) {
    errors.push(`assets/css/components.css: missing shared component ${selector}.`);
  }
}

const pages = ['artists/index.html', 'repertoire/index.html'];
for (const page of pages) {
  const source = read(page);
  if (!source.includes('/assets/css/components.css')) {
    errors.push(`${page}: shared components.css is not connected.`);
  }
  if (!source.includes('vh-title')) {
    errors.push(`${page}: page title is not connected to the shared title component.`);
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
  ['/assets/css/home-system.css', 'home-system.css is not connected in index.html.'],
  ['data-vh-home-system', 'homepage system stylesheet marker is missing in index.html.'],
  ['/assets/css/visual-fixes.css', 'visual-fixes.css is not connected in index.html.'],
  ['data-vh-visual-fixes', 'visual fixes stylesheet marker is missing in index.html.'],
  ['/assets/css/mobile-reviews-stable.css', 'stable mobile reviews stylesheet is not connected in index.html.']
]) {
  if (!homepagePage.includes(requirement[0])) errors.push(`index.html: ${requirement[1]}`);
}

const homepageConfig = read('assets/js/config.js');
if (homepageConfig.includes('loadStylesheet')) {
  errors.push('assets/js/config.js: CSS must not be injected after first paint.');
}
if (!homepageConfig.includes('/assets/js/home-copy.js')) {
  errors.push('assets/js/config.js: home-copy.js is not connected.');
}
if (!homepageConfig.includes('data-vh-home-copy')) {
  errors.push('assets/js/config.js: homepage copy marker is missing.');
}

const visualFixes = read('assets/css/visual-fixes.css');
for (const requiredRule of [
  '.vh-hero__title > :is(span, strong)',
  '--vh-home-content-width',
  '.vh-video-grid',
  '.vh-formats-container',
  '.vh-format-title',
  'font-family: var(--vh-font-family)'
]) {
  if (!visualFixes.includes(requiredRule)) {
    errors.push(`assets/css/visual-fixes.css: missing required visual correction ${requiredRule}.`);
  }
}

const homepageCopy = read('assets/js/home-copy.js');
for (const selector of [
  '.vh-video-section__subtitle',
  '.vh-formats-description',
  '.vh-price-calc__description',
  '.vh-reviews-subtitle',
  '.vh-faq__description',
  '.vh-contacts-section__description'
]) {
  if (!homepageCopy.includes(selector)) {
    errors.push(`assets/js/home-copy.js: missing copy target ${selector}.`);
  }
}

const legacyFiles = [
  'assets/css/style.css',
  'assets/css/repertoire.css',
  'assets/css/artists.css',
  'assets/css/themes.css'
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
