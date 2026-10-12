/**
 * Affordance 弹窗布局测试，防止物模型表单被 Vben Modal 默认窄宽压缩。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'packages/saas/src/components/Affordance/AffordanceModal.vue'), 'utf8');

describe('AffordanceModal layout', () => {
  it('overrides the default narrow modal width and keeps a viewport cap', () => {
    expect(source).toContain('!w-[calc(100vw-32px)]');
    expect(source).toContain('max-w-[1100px]');
    expect(source).not.toContain('<Modal class="w-[1100px]"');
  });
});
