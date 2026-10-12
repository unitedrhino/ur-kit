/**
 * 文件说明：知识库列表与详情工作台的纯函数状态规则。
 */
import type { KnowledgeItem, KnowledgeTreeNode } from './data';

export type KnowledgeScopeFilter = 'all' | 'mine' | 'shared';
export type KnowledgeWorkbenchTab = 'content' | 'retrieval' | 'settings';
/** 文档视图独立于知识库导航，旧链接默认原文件。 */
export type KnowledgeDocumentView = 'reading' | 'relations' | 'source';

/** normalizeDocumentView 只接受公开的文档视图参数。 */
export function normalizeDocumentView(value: unknown): KnowledgeDocumentView {
  return value === 'reading' || value === 'relations' ? value : 'source';
}

/** normalizeDocumentID 拒绝数组、负数及非整数，避免无效链接选中文件夹。 */
export function normalizeDocumentID(value: unknown): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return 0;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

/** canWriteKnowledge 对齐平台端与企业端的知识库可写权限。 */
export function canWriteKnowledge(item: KnowledgeItem | undefined, mode: 'platform' | 'tenant') {
  if (mode !== 'tenant') return true;
  return item?.scope !== 'platform';
}

/** normalizeKnowledgeWorkbenchTab 将无效深链接参数回退到内容页。 */
export function normalizeKnowledgeWorkbenchTab(value: unknown): KnowledgeWorkbenchTab {
  return value === 'retrieval' || value === 'settings' ? value : 'content';
}

/** getErrorMessage 提取后端或网络错误文案，供工作台内视图统一提示。 */
export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback;
  const data = (error as { data?: { message?: string; msg?: string } })?.data;
  return data?.message || data?.msg || fallback;
}

/** knowledgeStatusClass 返回知识库与文档状态的语义色样式。 */
export function knowledgeStatusClass(status?: string) {
  if (status === 'success') {
    return 'border-success/30 bg-success/10 text-foreground';
  }
  if (status === 'failed') return 'border-destructive/30 bg-destructive/10 text-foreground';
  if (status === 'processing') return 'border-primary/30 bg-primary/10 text-foreground';
  return 'border-border bg-muted/50 text-muted-foreground';
}

/** findFirstFile 递归查找目录中首个可阅读文档。 */
export function findFirstFile(nodes: KnowledgeTreeNode[]): KnowledgeTreeNode | null {
  for (const node of nodes) {
    if (node.nodeType === 'file') return node;
    const child = node.children?.length ? findFirstFile(node.children) : null;
    if (child) return child;
  }
  return null;
}

/** hasDocumentNode 判断文档 ID 是否仍存在于当前目录树。 */
export function hasDocumentNode(nodes: KnowledgeTreeNode[], documentID: number): boolean {
  return nodes.some((node) => (node.nodeType === 'file' && node.id === documentID) || (!!node.children?.length && hasDocumentNode(node.children, documentID)));
}

/** resolveDocumentSelection 在初次进入或文档删除后确定应选中的文档与目录选中键。 */
export function resolveDocumentSelection(nodes: KnowledgeTreeNode[], requestedID: number): { documentID: number; selectedKeys: number[] } {
  if (requestedID && hasDocumentNode(nodes, requestedID)) {
    return { documentID: requestedID, selectedKeys: [requestedID] };
  }
  const firstFile = findFirstFile(nodes);
  return { documentID: firstFile?.id ?? 0, selectedKeys: firstFile ? [firstFile.id] : [] };
}
