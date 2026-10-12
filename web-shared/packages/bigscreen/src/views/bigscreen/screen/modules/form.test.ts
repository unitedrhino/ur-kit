/**
 * 文件说明：新建大屏弹窗模板封面地址回归测试。
 * 验证内嵌 data URL 不会被错误拼接到文件下载接口。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'packages/bigscreen/src/views/bigscreen/screen/modules/form.vue'),
  'utf8',
);

describe('bigscreenCreateFormTemplateCover', () => {
  it('应在拼接下载接口前直接返回 data URL', () => {
    const dataURLGuard = source.indexOf("normalized.startsWith('data:')");
    const downloadBuilder = source.indexOf('`/api/v1/system/common/download-file?filePath=');

    expect(dataURLGuard).toBeGreaterThanOrEqual(0);
    expect(downloadBuilder).toBeGreaterThan(dataURLGuard);
  });
});
