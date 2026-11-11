// 历史属性趋势图插件化契约测试：校验业务组件不再手写 canvas，并验证插件数据转换。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

/**
 * read 读取 mobile-uniapp 内的源码文件。
 * @param {string} relPath 相对 apps/mobile-uniapp 的文件路径。
 * @returns {string} 文件文本内容。
 */
function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

/**
 * loadChartModule 将 TypeScript 图表模型转译为 CommonJS 后加载。
 * @returns {Record<string, unknown>} 图表模型模块导出对象。
 */
function loadChartModule() {
  const sourcePath = path.join(root, 'src/components/history-trend-chart/history-trend-chart.model.ts');
  const source = read('src/components/history-trend-chart/history-trend-chart.model.ts');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const fn = new Function('exports', 'module', output);
  fn(module.exports, module);
  return module.exports;
}

test('history trend chart delegates rendering to qiun-data-charts instead of hand-written canvas', () => {
  const component = read('src/components/history-trend-chart/history-trend-chart.vue');

  assert.match(component, /<qiun-data-charts\b/, 'history trend chart should render through qiun-data-charts');
  assert.match(component, /type="line"/, 'history trend chart should use a line chart');
  assert.match(component, /canvasId="historyTrendChartUcharts"/, 'history trend chart should use a stable canvasId');
  assert.doesNotMatch(component, /<canvas\b/, 'business component should not render raw canvas');
  assert.doesNotMatch(component, /createCanvasContext/, 'business component should not call uni.createCanvasContext');
});

test('history trend chart plugin files are installed as uni_modules dependency', () => {
  assert.ok(
    fs.existsSync(path.join(root, 'src/uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue')),
    'qiun-data-charts component should be installed under src/uni_modules',
  );
  assert.ok(
    fs.existsSync(path.join(root, 'src/uni_modules/qiun-data-charts/js_sdk/u-charts/u-charts.js')),
    'uCharts runtime should be installed under qiun-data-charts uni module',
  );
});

test('history trend chart data model filters non-numeric points and maps labels and series', () => {
  const { createHistoryTrendChartData } = loadChartModule();
  const baseTime = new Date(2026, 5, 5, 0, 0, 0).getTime();

  assert.deepEqual(
    createHistoryTrendChartData(
      [
        { timestamp: baseTime, value: 53.7 },
        { timestamp: baseTime + 60 * 60 * 1000, value: Number.NaN },
        { timestamp: baseTime + 2 * 60 * 60 * 1000, value: 54.2 },
      ],
      '内存使用率',
    ),
    {
      categories: ['00:00', '02:00'],
      series: [
        {
          name: '内存使用率',
          data: [53.7, 54.2],
        },
      ],
    },
  );
});

test('history trend chart thins crowded hour labels to avoid x-axis overlap', () => {
  const { createHistoryTrendChartData } = loadChartModule();
  const baseTime = new Date(2026, 5, 5, 0, 0, 0).getTime();
  const points = Array.from({ length: 11 }, (_, index) => ({
    timestamp: baseTime + index * 60 * 60 * 1000,
    value: 77 - index * 0.1,
  }));

  assert.deepEqual(
    createHistoryTrendChartData(points, '硬盘使用率').categories,
    ['00:00', '', '', '', '', '05:00', '', '', '', '', '10:00'],
  );
});

test('history page avoids iOS-incompatible date string parsing', () => {
  const page = read('src/packageDevice/pages/history/index.vue');

  assert.doesNotMatch(page, /new Date\(`\$\{date\} 00:00:00`\)/, 'start date parser should not use yyyy-MM-dd HH:mm:ss');
  assert.doesNotMatch(page, /new Date\(`\$\{date\} 23:59:59`\)/, 'end date parser should not use yyyy-MM-dd HH:mm:ss');
  assert.match(page, /new Date\(parts\.year, parts\.monthIndex, parts\.day, 0, 0, 0, 0\)/);
  assert.match(page, /new Date\(parts\.year, parts\.monthIndex, parts\.day, 23, 59, 59, 999\)/);
});
