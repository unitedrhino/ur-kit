/** 文件说明：处理结果的阶段映射、状态说明及证据版本校验，供页面与行为测试复用。 */

import { $t } from '../../locales';
import type { KnowledgeArtifact, KnowledgeDetail, KnowledgeSourceReference } from './data';

/** 处理阶段的面向用户名称，关系状态独立于文档解析状态。 */
export const processingStageNames: Record<string, string> = {
  /** 按当前界面语言返回 content 阶段名称。 */
  get content() {
    return $t('knowledgeBase.text_33188eb9a0ac');
  },
  /** 按当前界面语言返回 analysis 阶段名称。 */
  get analysis() {
    return $t('knowledgeBase.text_adddab01da38');
  },
  /** 按当前界面语言返回 multimodal 阶段名称。 */
  get multimodal() {
    return $t('knowledgeBase.text_ad55fb79114c');
  },
  /** 按当前界面语言返回 relations 阶段名称。 */
  get relations() {
    return $t('knowledgeBase.text_757fb196dce9');
  },
};

/** processingStageLabel 已知阶段用固定名称；后端新增的未知阶段（如 questions）兜底展示原始阶段名，不显示空值。 */
export function processingStageLabel(stage: string): string {
  return processingStageNames[stage] ?? `扩展阶段 ${stage}`;
}

/** listProcessingStages 合并固定阶段与后端返回的未知阶段：新阶段不丢展示，旧数据结构不变不崩。 */
export function listProcessingStages(detail: KnowledgeDetail) {
  const knownStages = Object.keys(processingStageNames).map((stage) => getProcessingStage(detail, stage));
  const knownNames = new Set(Object.keys(processingStageNames));
  const extraStages = (detail.processingStages ?? [])
    .filter((item) => item.stage && !knownNames.has(item.stage))
    .map((item) => ({ stage: item.stage, status: item.status, message: item.message, sourceVersion: item.sourceVersion }));
  return [...knownStages, ...extraStages];
}

/** getProcessingStage 返回真实阶段状态；历史记录没有状态时不假定成功。 */
export function getProcessingStage(detail: KnowledgeDetail, stage: string) {
  if (stage === 'relations')
    return { stage, status: detail.lastCompileTask?.relationStatus, message: detail.lastCompileTask?.relationMessage, sourceVersion: '' };
  return (
    detail.processingStages?.find((item) => item.stage === stage) ?? { stage, status: '', message: $t('knowledgeBase.text_379a2ec4638a'), sourceVersion: '' }
  );
}

/** stageNeedsNotice 成功/不适用不占正文；异常、处理中、历史结果就近提示。 */
export function stageNeedsNotice(detail: KnowledgeDetail, stage: string): boolean {
  const result = getProcessingStage(detail, stage);
  return !['notApplicable', 'success'].includes(result.status || '') || !!(result.sourceVersion && result.sourceVersion !== detail.sourceVersion);
}

/** processingStatusLabel 不把未知、阻塞或没有适用内容显示为成功。 */
export function processingStatusLabel(status?: string): string {
  return (
    (
      {
        pending: $t('knowledgeBase.text_e6f4cc75690b'),
        processing: $t('knowledgeBase.text_fcb979ef0b91'),
        success: $t('knowledgeBase.text_e99b48a29bdf'),
        notApplicable: $t('knowledgeBase.text_eec46c136f61'),
        blocked: $t('knowledgeBase.text_a7ae09d8be5f'),
        deferred: $t('knowledgeBase.text_f34818629bfd'),
        failed: $t('knowledgeBase.text_763284f0fbc6'),
        partial: $t('knowledgeBase.text_53951802211e'),
      } as Record<string, string>
    )[status ?? ''] ?? $t('knowledgeBase.text_55fba877779a')
  );
}

/** sourceEvidence 仅在文档、版本、产物均匹配时返回证据，旧引用不能指向新内容。 */
export function sourceEvidence(detail: KnowledgeDetail, source: KnowledgeSourceReference): KnowledgeArtifact | undefined {
  if (source.documentID !== detail.document.id || !source.sourceVersion || source.sourceVersion !== detail.sourceVersion) return;
  return [...(detail.chunks ?? []), ...(detail.multimodalArtifacts ?? [])].find(
    (artifact) => artifact.id === source.artifactID && artifact.sourceVersion === source.sourceVersion && artifact.generationMethod === 'source',
  );
}

export interface ProcessingSectionSummary {
  /** 分区存在需要用户处理的缺口（为空或失败），导航上显示红点。 */
  attention: boolean;
  /** 当前值摘要行文案，不进分区即可见。 */
  summary: string;
}

/** chunkSectionSummary 切片分区摘要：切片数量，空切片视为缺口。 */
export function chunkSectionSummary(detail: KnowledgeDetail): ProcessingSectionSummary {
  const count = detail.chunks?.length ?? 0;
  return { attention: count === 0, summary: count > 0 ? `共 ${count} 个切片` : '暂无切片' };
}

/** statusSectionSummary 处理状态分区摘要：完成进度；失败、阻塞或部分完成视为缺口。 */
export function statusSectionSummary(detail: KnowledgeDetail): ProcessingSectionSummary {
  const stages = Object.keys(processingStageNames).map((stage) => getProcessingStage(detail, stage));
  const settled = stages.filter((stage) => ['notApplicable', 'success'].includes(stage.status || '')).length;
  const problematic = stages.filter((stage) => ['blocked', 'failed', 'partial'].includes(stage.status || '')).length;
  if (problematic > 0) return { attention: true, summary: `${settled}/${stages.length} 阶段完成 · ${problematic} 项待处理` };
  return { attention: false, summary: `${settled}/${stages.length} 阶段完成` };
}
