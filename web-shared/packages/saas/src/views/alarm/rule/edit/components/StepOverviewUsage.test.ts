/**
 * 文件说明：告警规则向导步骤概览样式契约测试。
 * 确保四个步骤复用同一概览组件，避免标题、摘要和状态层级再次漂移。
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/** 当前步骤组件目录。 */
const componentDir = dirname(fileURLToPath(import.meta.url));

describe('告警规则步骤概览样式', () => {
  it.each(['StepBasic.vue', 'StepCondition.vue', 'StepNotify.vue', 'StepConfirm.vue'])('%s 应复用统一的 StepOverview', (fileName) => {
    const source = readFileSync(resolve(componentDir, fileName), 'utf8');

    expect(source).toContain('<StepOverview');
  });
});
