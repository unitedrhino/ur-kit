import { describe, expect, it } from 'vitest';

import { resolveUploadImageModelValue } from './upload-image';

describe('resolveUploadImageModelValue', () => {
  it('uses modelValue from vben UploadImage binding for initial preview', () => {
    const avatar = 'http://example.invalid:7777/oss/public/sys.rpc/platform/core/systemConfig/avatar/meerkat.png';

    expect(resolveUploadImageModelValue({ modelValue: avatar }, {})).toBe(avatar);
  });

  it('falls back to value for legacy bindings', () => {
    expect(resolveUploadImageModelValue({}, { value: '/legacy/avatar.png' })).toBe('/legacy/avatar.png');
  });
});
