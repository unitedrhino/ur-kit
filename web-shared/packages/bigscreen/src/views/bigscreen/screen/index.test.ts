/**
 * 文件说明：大屏项目查询栏布局回归测试。
 * 验证项目管理器进入首行，并通过加号展开低频查询条件。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'packages/bigscreen/src/views/bigscreen/screen/index.vue'), 'utf8');

describe('bigscreenProjectFilters', () => {
  it('项目管理器应位于首行搜索条件之前', () => {
    const primaryStart = source.indexOf('data-testid="bigscreen-filter-primary"');
    const primaryEnd = source.indexOf('</div>', primaryStart);
    const primarySource = source.slice(primaryStart, primaryEnd);

    expect(primaryStart).toBeGreaterThanOrEqual(0);
    expect(primarySource.indexOf('<ProjectManagerSelector')).toBeGreaterThanOrEqual(0);
    expect(primarySource.indexOf('<ProjectManagerSelector')).toBeLessThan(primarySource.indexOf('<NInput'));
  });

  it('高级条件应由加号展开且不再保留工具栏项目按钮', () => {
    expect(source).toContain('data-testid="bigscreen-filter-toggle"');
    expect(source).toContain('v-if="advancedFiltersOpen"');
    expect(source).not.toContain('toolbar-project-button');
  });
});
