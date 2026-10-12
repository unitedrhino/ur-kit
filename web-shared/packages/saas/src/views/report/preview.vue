<script setup lang="ts">
/**
 * 报表只读预览页（共享包 @vben/saas）：按报表 ID 加载设计内容 → 后端渲染 → 只读展示 + 导出。
 * 只读：FWorkbook.setEditable(false) 取消编辑态（点击单元格无编辑光标）。
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { useRoute } from 'vue-router';

import { LocaleType, createUniver, type IWorkbookData } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import zhCN from '@univerjs/preset-sheets-core/locales/zh-CN';
import { CalculationMode } from '@univerjs/preset-sheets-core';
import '@univerjs/preset-sheets-core/lib/index.css';

import { Page } from '@vben/common-ui';
import { useSessionStore } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

import { NButton } from 'naive-ui';

import { buildContextParams } from './context';
import { ReportApi } from './api';

// 宿主应用可通过 props 定制路由前缀（照告警样板），返回列表链接使用
const props = withDefaults(defineProps<{ routePrefix?: string }>(), {
  routePrefix: '/iot/report',
});

const sessionStore = useSessionStore();
const projectStore = useProjectStore();
const message = ref('加载中...');
const msgError = ref(false);
const warnings = ref<any[]>([]);
const reportId = ref('');

let univerInstance: { dispose: () => void } | null = null;

function showPreview(content: string) {
  const { univer, univerAPI } = createUniver({
    locale: LocaleType.ZH_CN,
    locales: { [LocaleType.ZH_CN]: zhCN },
    presets: [
      UniverSheetsCorePreset({
        container: 'report-preview-container',
        formula: { initialFormulaComputing: CalculationMode.FORCED },
      }),
    ],
  });
  univerInstance = univer;
  univerAPI.createWorkbook(JSON.parse(content) as IWorkbookData);
  // 只读：取消编辑态（点击单元格无编辑光标/不可改值）
  univerAPI.getActiveWorkbook()?.setEditable(false);
}

// 导出当前报表（含上下文参数：企业/项目/区域名称）
async function onExport() {
  if (!reportId.value) return;
  message.value = '导出中...';
  try {
    const params = await buildContextParams(sessionStore, projectStore);
    const resp = await ReportApi.exportById(reportId.value, params);
    msgError.value = false;
    message.value = '导出成功，正在打开下载...';
    window.open(resp.url, '_blank');
  } catch (e: any) {
    msgError.value = true;
    message.value = `导出失败: ${e?.message || e}`;
  }
}

// 返回报表列表
function goBack() {
  window.location.hash = `#${props.routePrefix}`;
}

onMounted(async () => {
  const route = useRoute();
  reportId.value = String(route.params.id || '');
  try {
    const detail = await ReportApi.detailGetOne(reportId.value);
    const params = await buildContextParams(sessionStore, projectStore);
    const resp = await ReportApi.render(detail.content, params);
    warnings.value = resp.warnings || [];
    await nextTick();
    showPreview(resp.content);
    msgError.value = false;
    message.value = `渲染完成${warnings.value.length ? `（${warnings.value.length} 条告警）` : ''}`;
  } catch (e: any) {
    msgError.value = true;
    message.value = `预览失败: ${e?.message || e}`;
  }
});

onBeforeUnmount(() => {
  univerInstance?.dispose();
});
</script>

<template>
  <Page title="" auto-content-height>
    <div class="report-preview">
      <div class="toolbar">
        <span class="title">报表预览</span>
        <span class="msg" :class="{ error: msgError }">{{ message }}</span>
        <NButton class="ml-auto" type="primary" @click="onExport">导出 xlsx</NButton>
        <NButton @click="goBack">← 返回列表</NButton>
      </div>
      <div class="body">
        <div id="report-preview-container" class="preview-box" />
        <div v-if="warnings.length" class="warnings">
          <div v-for="(w, i) in warnings" :key="i" class="warning">
            [{{ w.sheetName }} {{ (w.row ?? 0) + 1 }}:{{ (w.col ?? 0) + 1 }}] {{ w.token }} → {{ w.reason }}
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.report-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
}
.title {
  font-weight: 600;
}
.msg {
  flex: 1;
  color: #666;
  font-size: 12px;
}
.msg.error {
  color: #d03050;
  font-weight: 600;
}
.body {
  position: relative;
  flex: 1;
  min-height: 0;
}
.warnings {
  position: absolute;
  left: 8px;
  bottom: 8px;
  z-index: 20;
  max-width: 80%;
}
.warning {
  background: #fff3cd;
  border: 1px solid #ffe08a;
  color: #7a5b00;
  font-size: 12px;
  padding: 2px 8px;
  margin-top: 4px;
  border-radius: 3px;
}
.preview-box {
  width: 100%;
  height: 100%;
}
</style>
