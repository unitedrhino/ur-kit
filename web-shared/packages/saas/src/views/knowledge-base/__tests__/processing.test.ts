/** 文件说明：验证处理分类依赖、真实状态和证据失效边界，不断言样式字符串。 */
import type { KnowledgeArtifact, KnowledgeDetail } from '../data';

import { describe, expect, it } from 'vitest';

import {
  chunkSectionSummary,
  getProcessingStage,
  listProcessingStages,
  processingStageLabel,
  processingStatusLabel,
  sourceEvidence,
  stageNeedsNotice,
  statusSectionSummary,
} from '../processing';

describe('知识库高级处理', () => {
  it('关系阶段独立于文档解析，历史缺状态不补造成功', () => {
    const detail = { document: { id: 1 }, compileStatus: 'success', lastCompileTask: { relationStatus: 'failed' } } as KnowledgeDetail;
    expect(getProcessingStage(detail, 'relations').status).toBe('failed');
    expect(getProcessingStage(detail, 'analysis').status).toBe('');
  });
  it('未知与无适用内容不会显示处理完成', () => {
    expect(processingStatusLabel()).toBe('尚未记录');
    expect(processingStatusLabel('notApplicable')).toBe('不适用');
    expect(processingStatusLabel('blocked')).toBe('缺少配置');
    expect(processingStatusLabel('partial')).toBe('部分完成');
  });
  it('正常及不适用不占用提示空间，历史版本和失败必须显示', () => {
    const detail = { sourceVersion: 'v1', processingStages: [{ stage: 'analysis', status: 'success', sourceVersion: 'v1' }] } as KnowledgeDetail;
    expect(stageNeedsNotice(detail, 'analysis')).toBe(false);
    expect(stageNeedsNotice({ ...detail, sourceVersion: 'v2' }, 'analysis')).toBe(true);
    expect(stageNeedsNotice({ ...detail, processingStages: [{ stage: 'analysis', status: 'blocked' }] }, 'analysis')).toBe(true);
  });
  it('来源版本变化或产物为 AI 生成时，不提供原文证据', () => {
    const source = { documentID: 1, artifactID: 2, sourceVersion: 'v1' };
    const chunk = { id: 2, sourceVersion: 'v1', generationMethod: 'source', content: '原文' } as KnowledgeArtifact;
    const detail = { document: { id: 1 }, sourceVersion: 'v1', chunks: [chunk] } as KnowledgeDetail;
    expect(sourceEvidence(detail, source)?.content).toBe('原文');
    expect(sourceEvidence({ ...detail, sourceVersion: 'v2' }, source)).toBeUndefined();
    expect(sourceEvidence(detail, { ...source, documentID: 3 })).toBeUndefined();
    expect(sourceEvidence({ ...detail, chunks: [{ ...chunk, generationMethod: 'ai' }] }, source)).toBeUndefined();
  });
  it('切片分区摘要展示数量，空切片亮缺口红点', () => {
    const detail = { chunks: [{ id: 1 }, { id: 2 }] } as KnowledgeDetail;
    expect(chunkSectionSummary(detail)).toEqual({ attention: false, summary: '共 2 个切片' });
    expect(chunkSectionSummary({} as KnowledgeDetail)).toEqual({ attention: true, summary: '暂无切片' });
  });
  it('处理状态分区摘要展示完成进度，失败或阻塞亮缺口红点', () => {
    const healthy = {
      lastCompileTask: { relationStatus: 'success' },
      processingStages: [
        { stage: 'content', status: 'success' },
        { stage: 'analysis', status: 'success' },
        { stage: 'multimodal', status: 'notApplicable' },
      ],
    } as KnowledgeDetail;
    expect(statusSectionSummary(healthy)).toEqual({ attention: false, summary: '4/4 阶段完成' });

    const problematic = {
      lastCompileTask: { relationStatus: 'success' },
      processingStages: [
        { stage: 'content', status: 'success' },
        { stage: 'analysis', status: 'failed' },
        { stage: 'multimodal', status: 'blocked' },
      ],
    } as KnowledgeDetail;
    expect(statusSectionSummary(problematic).attention).toBe(true);
    expect(statusSectionSummary(problematic).summary).toBe('2/4 阶段完成 · 2 项待处理');

    expect(statusSectionSummary({} as KnowledgeDetail)).toEqual({ attention: false, summary: '0/4 阶段完成' });
  });
  it('后端新增未知阶段（questions）兜底展示，旧阶段顺序不乱', () => {
    const detail = {
      document: { id: 1 },
      processingStages: [
        { stage: 'content', status: 'success', sourceVersion: 'v1' },
        { stage: 'questions', status: 'success', message: '问句已生成', sourceVersion: 'v1' },
      ],
    } as KnowledgeDetail;
    const stages = listProcessingStages(detail);
    expect(stages.map((stage) => stage.stage)).toEqual(['content', 'analysis', 'multimodal', 'relations', 'questions']);
    expect(processingStageLabel('questions')).toBe('扩展阶段 questions');
    expect(processingStageLabel('content')).toBe('解析正文与切片');
    expect(stages.find((stage) => stage.stage === 'questions')?.status).toBe('success');
    // 旧数据没有未知阶段时，列表与固定阶段完全一致。
    expect(listProcessingStages({ document: { id: 1 } } as KnowledgeDetail).map((stage) => stage.stage)).toEqual([
      'content',
      'analysis',
      'multimodal',
      'relations',
    ]);
  });
});
