import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'packages/saas/src/views/init/index.vue'), 'utf8');

describe('system init copy', () => {
  it('does not expose internal tenant wording in user-facing copy', () => {
    expect(source).not.toContain('免费租户');
    expect(source).not.toContain('付费租户');
    expect(source).not.toContain('租户默认配额');
    expect(source).not.toContain('用户可直接创建免费租户数量');
  });
});
