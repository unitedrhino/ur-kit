<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { ChartEditStorageType } from '../preview/index.type';

import { ref } from 'vue';

import { MonacoEditor } from '@/components/Pages/MonacoEditor';
import { SavePageEnum } from '@/enums/editPageEnum';
import { StorageEnum } from '@/enums/storageEnum';
import { icon } from '@/plugins';
import { goDialog, JSONParse, JSONStringify, setSessionStorage, setTitle } from '@/utils';
import { getTrustedOpener } from '@app/shared/window-security';

import { getSessionStorageInfo } from '../preview/utils';

const { DownloadIcon, AnalyticsIcon } = icon.ionicons5;
const showOpenFilePicker: Function = (window as any).showOpenFilePicker;
const content = ref('');

window.$message.warning(editorT('bigscreenEditor.ui.helperDoNotRefreshThisWindow'));

// 从sessionStorage 获取数据
async function getDataBySession() {
  const localStorageInfo: ChartEditStorageType = (await getSessionStorageInfo()) as unknown as ChartEditStorageType;
  setTitle(editorT('bigscreenEditor.dynamic.editorTitle', { name: String(localStorageInfo.editCanvasConfig.projectName) }));
  content.value = JSONStringify(localStorageInfo);
}
setTimeout(getDataBySession);

// 导入json文本
function importJSON() {
  goDialog({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get message() { return editorT('bigscreenEditor.ui.helperImportingWillOverwriteTheContentAndCannotBeUndoneContinue'); },
    isMaskClosable: true,
    transformOrigin: 'center',
    onPositiveCallback: async () => {
      try {
        const files = await showOpenFilePicker();
        const file = await files[0].getFile();
        content.value = await file.text();
        window.$message.success(editorT('bigscreenEditor.ui.importedSuccessfully'));
      } catch (error) {
        window.$message.error(editorT('bigscreenEditor.ui.helperImportFailedCheckWhetherTheFileIsDamaged'));
        console.error('[edit view] 导入 JSON 失败:', error);
      }
    },
  });
}

// 同步数据编辑页
getTrustedOpener()?.addEventListener(SavePageEnum.CHART, (e: any) => {
  window.$message.success(editorT('bigscreenEditor.ui.updating'));
  setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [e.detail]);
  content.value = JSONStringify(e.detail);
});

// 保存按钮同步数据
document.addEventListener('keydown', (e) => {
  if (e.key === 's' && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
    e.preventDefault();
    updateSync();
  }
});

// 失焦保存（暂时关闭）
// addEventListener('blur', updateSync)

// 同步更新
async function updateSync() {
  const openerWindow = getTrustedOpener();
  if (!openerWindow) {
    return window.$message.error(editorT('bigscreenEditor.ui.helperTheSourceWindowIsClosedCouldNotSynchronizeTheView'));
  }
  goDialog({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get message() { return editorT('bigscreenEditor.ui.helperOverwriteTheSourceViewThisCannotBeUndone'); },
    isMaskClosable: true,
    transformOrigin: 'center',
    onPositiveCallback: () => {
      try {
        const detail = JSONParse(content.value);
        delete detail.id;
        // 保持id不变
        openerWindow.dispatchEvent(new CustomEvent(SavePageEnum.JSON, { detail }));
        window.$message.success(editorT('bigscreenEditor.ui.helperSynchronizingContent'));
      } catch (error) {
        window.$message.error(editorT('bigscreenEditor.ui.helperInvalidContentFormat'));
        console.error('[edit view] 同步 JSON 内容失败:', error);
      }
    },
  });
}

// 关闭页面发送关闭事件
window.addEventListener('beforeunload', () => {
  const openerWindow = getTrustedOpener();
  if (openerWindow) {
    openerWindow.dispatchEvent(new CustomEvent(SavePageEnum.CLOSE));
  }
});
</script>

<template>
  <div class="go-edit">
    <n-layout>
      <n-layout-header class="go-edit-header go-px-5 go-flex-items-center" bordered>
        <div>
          <n-text class="go-edit-title go-mr-4">{{ editorT('bigscreenEditor.ui.helperPageEditor') }}</n-text>
          <n-button v-if="showOpenFilePicker" class="go-mr-3" size="medium" @click="importJSON">
            <template #icon>
              <n-icon>
                <DownloadIcon />
              </n-icon>
            </template>
            导入
          </n-button>
        </div>
        <n-space>
          <!-- 暂时关闭 -->
          <!-- <n-tag :bordered="false" type="warning"> 「页面失焦保存」 </n-tag> -->
          <n-tag :bordered="false" type="warning"> {{ editorT('bigscreenEditor.ui.helperCtrlSUpdateView') }} </n-tag>
          <n-button v-if="showOpenFilePicker" class="go-mr-3" size="medium" @click="updateSync">
            <template #icon>
              <n-icon>
                <AnalyticsIcon />
              </n-icon>
            </template>
            保存
          </n-button>
        </n-space>
      </n-layout-header>
      <n-layout-content>
        <MonacoEditor
          v-model:model-value="content"
          language="json"
          :editor-options="{
            lineNumbers: 'on',
            minimap: { enabled: true },
          }"
        />
      </n-layout-content>
    </n-layout>
  </div>
</template>

<style lang="scss" scoped>
.go-edit {
  display: flex;
  flex-direction: column;
  height: 100vh;
  .go-edit-header {
    display: flex;
    align-items: center;
    height: 60px;
    justify-content: space-between;
    .go-edit-title {
      position: relative;
      bottom: 3px;
      font-size: 18px;
      font-weight: bold;
    }
  }
  @include deep() {
    .go-editor-area {
      height: calc(100vh - 60px) !important;
    }
  }
}
</style>
