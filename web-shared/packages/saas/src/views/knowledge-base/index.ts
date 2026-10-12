// 知识库共享页面：platform-manage（AI 中台）与 org-manage（租户系统管理）复用。
// KnowledgeBasePage 列表页、KnowledgeBaseDetailPage 详情工作台，
// 通过 mode prop 区分平台端（全量管理公共库）与租户端（公共库只读、本租户库完整管理）。
export * from './data';
export { default as KnowledgeBasePage } from './list-page.vue';
export * from './navigation';
export * from './retrieval';
export { default as KnowledgeRetrievalPanel } from './retrieval-panel.vue';
export { default as KnowledgeBaseDetailPage } from './workbench-page.vue';
