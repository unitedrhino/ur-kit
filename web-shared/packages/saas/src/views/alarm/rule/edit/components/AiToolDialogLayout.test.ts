/**
 * 文件说明：告警 AI 工具创建、查看弹窗的统一布局契约测试。
 * 防止创建态再次维护独立预览结构，或 flex 高度回归后把对话输入区挤出可视范围。
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/** componentDir 当前告警规则步骤组件目录。 */
const componentDir = dirname(fileURLToPath(import.meta.url));
/** sharedComponentDir AI 工具共享组件目录。 */
const sharedComponentDir = resolve(componentDir, '../../../../../components');

describe('告警 AI 工具弹窗统一布局', () => {
  it('创建态与查看态统一复用共享详情组件', () => {
    const source = readFileSync(resolve(componentDir, 'StepNotify.vue'), 'utf8');

    expect(source.match(/<AiToolDetail\b/g)).toHaveLength(1);
    expect(source).toContain(':dev-context="toolDevContextSummary"');
    expect(source).toContain('@artifacts-saved="onToolArtifactsSavedOrEdited"');
    expect(source).not.toContain('<AiToolDevPanel');
    expect(source).not.toContain('<AiToolArtifactPreview');
  });

  it('共享详情保持两栏等宽且对话输入区不参与内容高度扩张', () => {
    const detailSource = readFileSync(resolve(sharedComponentDir, 'ai-tool-detail/AiToolDetail.vue'), 'utf8');
    const panelSource = readFileSync(resolve(sharedComponentDir, 'ai-tool-dev/AiToolDevPanel.vue'), 'utf8');

    expect(detailSource).toContain('grid-cols-2');
    expect(detailSource).toContain('data-testid="ai-tool-detail-document-pane"');
    expect(detailSource).toContain('data-testid="ai-tool-detail-assistant-pane"');
    expect(panelSource).toMatch(/class="[^"]*h-full[^"]*min-h-0[^"]*overflow-hidden[^"]*"/);
    expect(panelSource).toContain('<Conversation class="min-h-0 flex-1"');
  });

  it('新工具创建成功后立即渲染详情，不等待项目会话初始化', () => {
    const source = readFileSync(resolve(componentDir, 'StepNotify.vue'), 'utf8');
    const createDialogSource = source.slice(source.indexOf('async function openCreateDialog()'), source.indexOf('/** 工具被删除'));
    const renderIndex = createDialogSource.indexOf('creatingToolID.value = String(newID)');
    const sessionIndex = createDialogSource.indexOf('const sessionResp = await alarmAiToolSession');

    expect(renderIndex).toBeGreaterThan(-1);
    expect(sessionIndex).toBeGreaterThan(-1);
    expect(renderIndex).toBeLessThan(sessionIndex);
  });
});
