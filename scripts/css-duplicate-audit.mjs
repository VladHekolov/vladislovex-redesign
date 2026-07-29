import fs from 'node:fs';

const fixUnused = process.argv.includes('--fix-unused');
const files = process.argv.slice(2).filter((argument) => argument !== '--fix-unused');
if (!files.length) {
  console.error('Usage: node scripts/css-duplicate-audit.mjs <file.css> [...]');
  process.exit(1);
}

function collectProjectSources(directory) {
  const sources = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'dist', 'node_modules'].includes(entry.name)) continue;
    const target = `${directory}/${entry.name}`;
    if (entry.isDirectory()) sources.push(...collectProjectSources(target));
    else if (/\.(?:html|js|mjs|svg)$/i.test(entry.name)) sources.push(fs.readFileSync(target, 'utf8'));
  }
  return sources;
}

const projectSource = collectProjectSources('.').join('\n');

function maskComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function splitSelectorList(selector) {
  const selectors = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  for (let index = 0; index < selector.length; index += 1) {
    const char = selector[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === ',' && depth === 0) {
      selectors.push(selector.slice(start, index));
      start = index + 1;
    }
  }
  selectors.push(selector.slice(start));
  return selectors;
}

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

function findClosingBrace(source, openingBrace) {
  let depth = 1;
  let quote = '';
  for (let index = openingBrace + 1; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return index;
  }
  return -1;
}

function parseRules(source, start = 0, end = source.length, context = []) {
  const rules = [];
  let cursor = start;

  while (cursor < end) {
    while (cursor < end && /\s|;/.test(source[cursor])) cursor += 1;
    if (cursor >= end) break;

    let quote = '';
    let openingBrace = -1;
    for (let index = cursor; index < end; index += 1) {
      const char = source[index];
      if (quote) {
        if (char === '\\') index += 1;
        else if (char === quote) quote = '';
        continue;
      }
      if (char === '"' || char === "'") quote = char;
      else if (char === ';' && source[cursor] === '@') {
        cursor = index + 1;
        openingBrace = -2;
        break;
      } else if (char === '{') {
        openingBrace = index;
        break;
      }
    }

    if (openingBrace === -2) continue;
    if (openingBrace < 0) break;

    const closingBrace = findClosingBrace(source, openingBrace);
    if (closingBrace < 0 || closingBrace > end) break;

    const prelude = normalize(source.slice(cursor, openingBrace));
    const body = source.slice(openingBrace + 1, closingBrace);
    if (prelude.startsWith('@')) {
      const atName = prelude.slice(1).split(/[\s({]/, 1)[0].toLowerCase();
      if (['media', 'supports', 'container', 'layer', 'scope', 'document'].includes(atName)) {
        rules.push(...parseRules(source, openingBrace + 1, closingBrace, [...context, prelude]));
      }
    } else {
      rules.push({
        selector: prelude,
        body: normalize(body),
        context: context.join(' > '),
        start: cursor,
        end: closingBrace + 1
      });
    }
    cursor = closingBrace + 1;
  }

  return rules;
}

let duplicateGroups = 0;
let removableRules = 0;
let removableBytes = 0;
let adjacentEqualBodies = 0;
let unusedRules = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const source = maskComments(original);
  const rules = parseRules(source);
  const groups = new Map();

  for (const rule of rules) {
    const key = `${rule.context}\n${rule.selector}\n${rule.body}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(rule);
  }

  const duplicates = [...groups.values()].filter((group) => group.length > 1);
  const selectorGroups = new Map();
  for (const rule of rules) {
    const key = `${rule.context}\n${rule.selector}`;
    if (!selectorGroups.has(key)) selectorGroups.set(key, []);
    selectorGroups.get(key).push(rule);
  }
  const repeatedSelectors = [...selectorGroups.values()].filter((group) => group.length > 1);
  const adjacentBodies = [];
  for (let index = 1; index < rules.length; index += 1) {
    const previous = rules[index - 1];
    const current = rules[index];
    if (previous.context === current.context && previous.body === current.body) {
      adjacentBodies.push([previous, current]);
    }
  }
  const unusedClassRules = rules.filter((rule) => splitSelectorList(rule.selector).every((selector) => {
    const classes = [...selector.matchAll(/\.(-?[_a-zA-Z]+[\w-]*)/g)].map((match) => match[1]);
    return classes.length && classes.every((className) => !projectSource.includes(className));
  }));
  adjacentEqualBodies += adjacentBodies.length;
  unusedRules += unusedClassRules.length;

  console.log(
    `\n${file}: ${rules.length} style rules, ${duplicates.length} exact duplicate groups, ` +
    `${repeatedSelectors.length} repeated selectors, ${adjacentBodies.length} adjacent equal bodies, ` +
    `${unusedClassRules.length} selectors absent from HTML/JS`
  );

  for (const group of duplicates) {
    duplicateGroups += 1;
    removableRules += group.length - 1;
    for (const rule of group.slice(0, -1)) removableBytes += rule.end - rule.start;
    const lines = group.map((rule) => lineAt(original, rule.start)).join(', ');
    const context = group[0].context || 'root';
    console.log(`- lines ${lines} | ${context} | ${group[0].selector}`);
  }

  if (repeatedSelectors.length) {
    console.log('  Repeated selectors:');
    for (const group of repeatedSelectors) {
      const lines = group.map((rule) => lineAt(original, rule.start)).join(', ');
      const context = group[0].context || 'root';
      console.log(`  - lines ${lines} | ${context} | ${group[0].selector}`);
    }
  }

  if (adjacentBodies.length) {
    console.log('  Adjacent rules with equal declarations:');
    for (const [first, second] of adjacentBodies) {
      const context = first.context || 'root';
      console.log(
        `  - lines ${lineAt(original, first.start)}, ${lineAt(original, second.start)} | ` +
        `${context} | ${first.selector} + ${second.selector}`
      );
    }
  }

  if (unusedClassRules.length) {
    console.log('  Selectors absent from HTML/JS:');
    for (const rule of unusedClassRules) {
      const context = rule.context || 'root';
      console.log(`  - line ${lineAt(original, rule.start)} | ${context} | ${rule.selector}`);
    }
  }

  if (fixUnused && unusedClassRules.length) {
    let optimized = original;
    for (const rule of [...unusedClassRules].sort((a, b) => b.start - a.start)) {
      optimized = `${optimized.slice(0, rule.start)}${optimized.slice(rule.end)}`;
    }
    fs.writeFileSync(file, optimized);
    console.log(`  Removed ${unusedClassRules.length} unused rules.`);
  }
}

console.log(
  `\nTotal: ${duplicateGroups} duplicate groups, ${removableRules} removable rules, ` +
  `${adjacentEqualBodies} adjacent equal bodies, ${unusedRules} unused rules, about ${removableBytes} bytes.`
);

if (!fixUnused && (duplicateGroups || adjacentEqualBodies || unusedRules)) process.exitCode = 1;
