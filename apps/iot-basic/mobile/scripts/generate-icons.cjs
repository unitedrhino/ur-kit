const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { getIconData, iconToSVG } = require('@iconify/utils');
const tablerIcons = require('@iconify-json/tabler/icons.json');

const root = path.resolve(__dirname, '..');
const iconConfigPath = path.join(root, 'src/config/icons.ts');
const iconDataPath = path.join(root, 'src/config/generated-icon-data.ts');
const generatedDir = path.join(root, 'src/static/icons/generated');
const tabDir = path.join(root, 'src/static/icons');
const customDir = path.join(root, 'src/static/icons/custom');
const tabBarColor = '#999999';
const tabBarSelectedColor = '#1890ff';

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function extractIconNames(source) {
  return Array.from(new Set(source.match(/\b(?:tabler|ur):[a-z0-9-]+/g) || [])).sort();
}

function extractTabBarIcons(source) {
  const blockMatch = source.match(/TAB_BAR_ICONS:[\s\S]*?=\s*\[([\s\S]*?)\];/);
  if (!blockMatch) throw new Error('TAB_BAR_ICONS not found in src/config/icons.ts');
  const entries = [];
  const itemPattern = /\{\s*pagePath:\s*'([^']+)'\s*,\s*text:\s*'([^']+)'\s*,\s*icon:\s*'([^']+)'\s*\}/g;
  let match;
  while ((match = itemPattern.exec(blockMatch[1]))) {
    entries.push({ pagePath: match[1], text: match[2], icon: match[3] });
  }
  if (!entries.length) throw new Error('No TAB_BAR_ICONS entries found');
  return entries;
}

function svgFileName(iconName) {
  return `${iconName.replace(/:/g, '-')}.svg`;
}

function getCustomIcon(iconName) {
  const [, name] = iconName.split(':');
  const file = path.join(customDir, 'ur', `${name}.svg`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing custom icon file for ${iconName}: ${file}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function getTablerIcon(iconName) {
  const [, name] = iconName.split(':');
  const iconData = getIconData(tablerIcons, name);
  if (!iconData) throw new Error(`Missing Tabler icon: ${iconName}`);
  const render = iconToSVG(iconData, { height: '24', width: '24' });
  const attrs = Object.entries(render.attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${render.body}</svg>`;
}

function getSvg(iconName, color = 'currentColor') {
  const svg = iconName.startsWith('ur:') ? getCustomIcon(iconName) : getTablerIcon(iconName);
  return svg
    .replace(/<svg\b/, `<svg color="${color}"`)
    .replace(/stroke="currentColor"/g, `stroke="${color}"`)
    .replace(/fill="currentColor"/g, `fill="${color}"`);
}

function toDataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function writePng(iconName, fileName, color) {
  const svg = getSvg(iconName, color);
  await sharp(Buffer.from(svg))
    .resize(81, 81, { fit: 'contain' })
    .png()
    .toFile(path.join(tabDir, fileName));
}

async function main() {
  const source = fs.readFileSync(iconConfigPath, 'utf8');
  const iconNames = extractIconNames(source);
  const tabBarIcons = extractTabBarIcons(source);
  const iconDataUris = {};

  ensureDir(generatedDir);

  for (const iconName of iconNames) {
    const svg = getSvg(iconName);
    fs.writeFileSync(path.join(generatedDir, svgFileName(iconName)), svg);
    iconDataUris[iconName] = toDataUri(svg);
  }

  fs.writeFileSync(
    iconDataPath,
    [
      '// 此文件由 scripts/generate-icons.cjs 自动生成，用于小程序端内联图标资源。',
      '// 请不要手动编辑；新增图标请先更新 src/config/icons.ts 后重新执行 pnpm generate:icons。',
      '',
      `export const GENERATED_ICON_DATA_URIS = ${JSON.stringify(iconDataUris, null, 2)} as const;`,
      '',
    ].join('\n'),
  );

  for (const item of tabBarIcons) {
    const tabName = item.pagePath.split('/')[1];
    await writePng(item.icon, `tab-${tabName}.png`, tabBarColor);
    await writePng(item.icon, `tab-${tabName}-active.png`, tabBarSelectedColor);
  }

  console.log(`Generated ${iconNames.length} SVG icons and ${tabBarIcons.length * 2} tab bar PNG icons.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
