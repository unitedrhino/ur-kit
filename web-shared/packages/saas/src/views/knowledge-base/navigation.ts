// buildKnowledgeBaseDetailPath 构建知识库详情页路由路径。
// base 为详情页路由前缀：平台端默认 /ai-center/knowledge-base，租户端为 /system-manage/knowledge-base。
export function buildKnowledgeBaseDetailPath(
  knowledgeID: number,
  base = '/ai-center/knowledge-base',
) {
  return `${base}/${knowledgeID}`;
}
