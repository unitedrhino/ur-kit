/**
 * 文件说明：验证检索空结果两类空态判定与共享展示辅助函数。
 */
import { describe, expect, it } from 'vitest';

import { buildKnowledgeSearchPayload, emptyStateHint, resolveKnowledgeSearchEmptyState } from '../retrieval';

describe('检索空结果低阈值区分', () => {
  it('候选总数大于返回切片数时判定为低于阈值并携带候选数', () => {
    const state = resolveKnowledgeSearchEmptyState({ chunks: [], total: 7 });
    expect(state).toEqual({ candidateCount: 7, kind: 'below-threshold' });
    const hint = emptyStateHint(state);
    expect(hint.titleKey).toBe('knowledgeBase.searchBelowThresholdTitle');
    expect(hint.descriptionKey).toBe('knowledgeBase.searchBelowThresholdDescription');
    expect(hint.values).toEqual({ count: 7 });
  });

  it('候选总数缺省或等于返回数时判定为无结果', () => {
    expect(resolveKnowledgeSearchEmptyState({ chunks: [] })).toEqual({ candidateCount: 0, kind: 'no-results' });
    expect(resolveKnowledgeSearchEmptyState({ chunks: [{}, {}], total: 2 }).kind).toBe('no-results');
    expect(resolveKnowledgeSearchEmptyState({ chunks: [{}], total: 2 }).kind).toBe('below-threshold');
  });

  it('无结果空态引导换问法而非调整阈值', () => {
    const hint = emptyStateHint(resolveKnowledgeSearchEmptyState({ chunks: [] }));
    expect(hint.titleKey).toBe('knowledgeBase.text_460e4a284678');
    expect(hint.descriptionKey).toBe('knowledgeBase.searchNoResultsDescription');
  });

  it('buildKnowledgeSearchPayload 透传 minScore 供降阈重试', () => {
    expect(buildKnowledgeSearchPayload({ knowledgeBaseIDs: [3], minScore: 0.4, query: ' 网关 ' })).toEqual({
      agentID: undefined,
      knowledgeBaseIDs: [3],
      minScore: 0.4,
      query: '网关',
      topK: undefined,
    });
  });
});
