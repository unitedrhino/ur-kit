import { describe, expect, it } from 'vitest';

import { buildKnowledgeBaseDetailPath } from '../navigation';

describe('knowledge-base navigation helpers', () => {
  it('builds detail path from knowledge id', () => {
    expect(buildKnowledgeBaseDetailPath(16)).toBe('/ai-center/knowledge-base/16');
    expect(buildKnowledgeBaseDetailPath(101)).toBe('/ai-center/knowledge-base/101');
  });

  it('builds detail path with custom base for tenant mode', () => {
    expect(buildKnowledgeBaseDetailPath(16, '/system-manage/knowledge-base')).toBe(
      '/system-manage/knowledge-base/16',
    );
  });
});
