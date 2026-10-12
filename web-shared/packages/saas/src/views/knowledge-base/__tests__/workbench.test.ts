/**
 * 文件说明：知识库简化工作台的导航、权限、筛选和固定检索作用域回归测试。
 */
import type { KnowledgeItem, KnowledgeTreeNode } from '../data';

import { describe, expect, it } from 'vitest';

import { buildKnowledgeSearchPayload, confidenceLabel } from '../retrieval';
import {
  canWriteKnowledge,
  findFirstFile,
  hasDocumentNode,
  normalizeDocumentID,
  normalizeDocumentView,
  normalizeKnowledgeWorkbenchTab,
  resolveDocumentSelection,
} from '../workbench';

const items: KnowledgeItem[] = [
  {
    compiledDocumentCount: 4,
    desc: '平台产品文档',
    documentCount: 4,
    failedDocumentCount: 0,
    id: 1,
    lastCompileTime: 10,
    name: '平台手册',
    scope: 'platform',
    status: 'success',
  },
  {
    compiledDocumentCount: 2,
    desc: '企业售后资料',
    documentCount: 3,
    failedDocumentCount: 1,
    id: 2,
    lastCompileTime: 20,
    name: '售后手册',
    scope: 'tenant',
    status: 'failed',
  },
];

describe('knowledge workbench rules', () => {
  it('只允许企业端修改自有库', () => {
    expect(canWriteKnowledge(items[0], 'tenant')).toBe(false);
    expect(canWriteKnowledge(items[1], 'tenant')).toBe(true);
    expect(canWriteKnowledge(items[0], 'platform')).toBe(true);
  });

  it('三段导航不接受未知 tab', () => {
    expect(normalizeKnowledgeWorkbenchTab('content')).toBe('content');
    expect(normalizeKnowledgeWorkbenchTab('retrieval')).toBe('retrieval');
    expect(normalizeKnowledgeWorkbenchTab('settings')).toBe('settings');
    expect(normalizeKnowledgeWorkbenchTab('chunk')).toBe('content');
  });

  it('文档视图深链接兼容默认值并拒绝非法文档 ID', () => {
    expect(normalizeDocumentView(undefined)).toBe('source');
    expect(normalizeDocumentView('reading')).toBe('reading');
    expect(normalizeDocumentView('relations')).toBe('relations');
    expect(normalizeDocumentView('parsed')).toBe('source');
    expect(normalizeDocumentID('43')).toBe(43);
    for (const value of ['-1', '2.5', ['43'], null, 'NaN']) expect(normalizeDocumentID(value)).toBe(0);
  });

  it('固定库检索忽略智能体和外部知识库', () => {
    expect(
      buildKnowledgeSearchPayload({
        agentID: 9,
        fixedKnowledgeID: 42,
        knowledgeBaseIDs: [3, 4],
        query: '  如何接入设备？  ',
        topK: 5,
      }),
    ).toEqual({
      agentID: undefined,
      knowledgeBaseIDs: [42],
      minScore: undefined,
      query: '如何接入设备？',
      topK: 5,
    });
  });

  it('已有证据时不会把低置信结果标成无命中', () => {
    expect(confidenceLabel('none', true)).toBe('低置信度');
    expect(confidenceLabel('none', false)).toBe('无命中');
  });

  it('目录选择优先保留请求文档，失效后回退首个文件', () => {
    const tree: KnowledgeTreeNode[] = [
      {
        children: [
          { id: 11, knowledgeID: 1, name: '文件夹', nodeType: 'folder', parentID: 0, path: '/文件夹' },
          { id: 12, knowledgeID: 1, name: '手册.pdf', nodeType: 'file', parentID: 0, path: '/手册.pdf' },
        ],
        id: 10,
        knowledgeID: 1,
        name: 'docs',
        nodeType: 'folder',
        parentID: 0,
        path: '/docs',
      },
      { id: 13, knowledgeID: 1, name: '说明.md', nodeType: 'file', parentID: 0, path: '/说明.md' },
    ];
    expect(hasDocumentNode(tree, 12)).toBe(true);
    expect(hasDocumentNode(tree, 99)).toBe(false);
    expect(findFirstFile(tree)?.id).toBe(12);
    expect(resolveDocumentSelection(tree, 12)).toEqual({ documentID: 12, selectedKeys: [12] });
    expect(resolveDocumentSelection(tree, 99)).toEqual({ documentID: 12, selectedKeys: [12] });
    expect(resolveDocumentSelection([], 12)).toEqual({ documentID: 0, selectedKeys: [] });
  });
});
