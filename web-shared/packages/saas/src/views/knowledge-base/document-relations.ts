/** 文件说明：按文档聚合真实关系证据；不生成新关系，也不将相似度解释成实体事实。 */

import { $t } from '../../locales';
import type { KnowledgeArtifact, KnowledgeChunkRelation } from './data';

/** 文档关联分组；证据保留原始方向和类型，用于点击连线后追溯。 */
export interface DocumentRelationGroup {
  documentID: number;
  name: string;
  relations: KnowledgeChunkRelation[];
}

/** groupDocumentRelations 仅聚合同库、双侧证据完整的跨文档关系，按证据数和名称稳定排序。 */
export function groupDocumentRelations(documentID: number, relations: KnowledgeChunkRelation[]): DocumentRelationGroup[] {
  const groups = new Map<number, DocumentRelationGroup>();
  const seen = new Set<number>();
  for (const relation of relations) {
    const target = relation.targetDocument;
    if (
      !target?.id ||
      target.id === documentID ||
      !relation.sourceArtifact?.id ||
      !relation.targetArtifact?.id ||
      relation.sourceArtifact.documentID !== documentID ||
      relation.targetArtifact.documentID !== target.id ||
      relation.sourceArtifact.knowledgeID !== relation.targetArtifact.knowledgeID ||
      seen.has(relation.id)
    )
      continue;
    seen.add(relation.id);
    const group = groups.get(target.id) ?? { documentID: target.id, name: target.name, relations: [] };
    group.relations.push(relation);
    groups.set(target.id, group);
  }
  return [...groups.values()].sort((a, b) => b.relations.length - a.relations.length || a.name.localeCompare(b.name) || a.documentID - b.documentID);
}

/** chunkOptionLabel 用章节和正文帮助辨识切片，避免重复的文件名占满选择器。 */
export function chunkOptionLabel(chunk: KnowledgeArtifact): string {
  const excerpt = (chunk.headingPath || chunk.content || chunk.title || $t('knowledgeBase.text_3eb8c00e5981')).replaceAll(/\s+/g, ' ').trim();
  return `#${chunk.chunkIndex || chunk.id} · ${excerpt.slice(0, 70)}`;
}
