<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div
    class="go-chart-edit-tools"
    :class="[settingStore.getChartToolsStatus, isMiniComputed ? 'isMini' : 'unMini']"
    @click="isMini && (isMini = false)"
    @mouseenter="toolsMouseoverHandle"
    @mouseleave="toolsMouseoutHandle"
  >
    <!-- PawIcon -->
    <n-icon
      v-show="settingStore.getChartToolsStatus === ToolsStatusEnum.ASIDE && isMiniComputed"
      class="asideLogo"
      size="22"
    >
      <PawIcon></PawIcon>
    </n-icon>

    <n-tooltip
      v-for="(item, index) in btnListComputed"
      :key="item.key"
      :disabled="!isAside || (isHide && asideTootipDis)"
      trigger="hover"
      placement="left"
    >
      <template #trigger>
        <div class="btn-item">
          <n-button v-if="item.type === TypeEnum.BUTTON" :circle="isAside" secondary @click="item.handle">
            <template #icon>
              <n-icon size="22" v-if="isAside">
                <component :is="item.icon"></component>
              </n-icon>
              <component v-else :is="item.icon"></component>
            </template>
            <n-text depth="3" v-show="!isAside">{{ item.name }}</n-text>
          </n-button>
          <!-- 下载 -->
          <n-upload
            v-else-if="item.type === TypeEnum.IMPORTUPLOAD"
            v-model:file-list="importUploadFileListRef"
            :show-file-list="false"
            :customRequest="importCustomRequest"
            @before-upload="importBeforeUpload"
          >
            <n-button :circle="isAside" secondary>
              <template #icon>
                <n-icon size="22" v-if="isAside">
                  <component :is="item.icon"></component>
                </n-icon>
                <component v-else :is="item.icon"></component>
              </template>
              <n-text depth="3" v-show="!isAside">{{ item.name }}</n-text>
            </n-button>
          </n-upload>
        </div>
      </template>
      <!-- 提示 -->
      <span>{{ item.name }}</span>
    </n-tooltip>
  </div>
  <!-- 系统设置 model -->
  <go-system-set v-model:modelShow="globalSettingModel"></go-system-set>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { ref, computed } from 'vue'
import { useSettingStore } from '@/store/modules/settingStore/settingStore'
import { ToolsStatusEnum, SettingStoreEnums } from '@/store/modules/settingStore/settingStore.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { EditCanvasTypeEnum } from '@/store/modules/chartEditStore/chartEditStore.type'
import {
  fetchRouteParamsLocation,
  fetchPathByName,
  routerTurnByPath,
  setSessionStorage,
  getLocalStorage
} from '@/utils'
import { EditEnum } from '@/enums/pageEnum'
import { StorageEnum } from '@/enums/storageEnum'
import { useRoute } from 'vue-router'
import { GoSystemSet } from '@/components/GoSystemSet/index'
import { useFile } from './hooks/useFile.hooks'
import { useSyncUpdate } from './hooks/useSyncUpdate.hook'
import { type BtnListType, TypeEnum } from './index.type'
import { icon } from '@/plugins'

const { PawIcon, SettingsSharpIcon, CreateIcon } = icon.ionicons5
const settingStore = useSettingStore()
const chartEditStore = useChartEditStore()
const routerParamsInfo = useRoute()
// 初始化编辑 JSON 模块
useSyncUpdate()

// JSON 导入上传绑定（模板 n-upload 分支使用；当前按钮列表未启用 IMPORTUPLOAD 项，保留上游导入实现）
const { importUploadFileListRef, importCustomRequest, importBeforeUpload } = useFile()

// 鼠标悬停定时器
let mouseTime: any = null
// 系统设置 model
const globalSettingModel = ref(false)
// 最小化
const isMini = ref<boolean>(true)
// 控制 tootip 提示时机
const asideTootipDis = ref(true)
// 是否是侧边栏
const isAside = computed(() => settingStore.getChartToolsStatus === ToolsStatusEnum.ASIDE)

// 是否隐藏（悬浮展示）
const isHide = computed(() => settingStore.getChartToolsStatusHide)

// 是否展示最小化（与全局配置相关）
const isMiniComputed = computed(() => isMini.value && isHide.value)

// 页面渲染配置
const btnListComputed = computed(() => {
  const list = filteredBtnList.value
  if (!isAside.value) return list
  const reverseArr: BtnListType[] = []
  list.forEach(item => {
    reverseArr.unshift(item)
  })
  return reverseArr
})

// 鼠标移入
const toolsMouseoverHandle = () => {
  mouseTime = setTimeout(() => {
    if (isMini.value) {
      isMini.value = false
      asideTootipDis.value = true
    }
  }, 200)
  setTimeout(() => {
    asideTootipDis.value = false
  }, 400)
}

// 鼠标移出
const toolsMouseoutHandle = () => {
  clearTimeout(mouseTime)
  if (!isMini.value) {
    isMini.value = true
  }
}

// 编辑处理
const editHandle = () => {
  window['$message'].warning(editorT('bigscreenEditor.ui.useSyncContentAtTopRetrieveLatestData'))
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CODE_EDIT, true)
  setTimeout(() => {
    // 获取id路径
    const path = fetchPathByName(EditEnum.CHART_EDIT_NAME, 'href')
    if (!path) return
    const id = fetchRouteParamsLocation()
    updateToSession(id)
    routerTurnByPath(path, [id], undefined, true)
  }, 2000)
}

// 把内存中的数据同步到SessionStorage 便于传递给新窗口初始化数据
const updateToSession = (id: string) => {
  const storageInfo = chartEditStore.getStorageInfo()
  const sessionStorageInfo = getLocalStorage(StorageEnum.GO_CHART_STORAGE_LIST) || []

  if (sessionStorageInfo?.length) {
    const repeateIndex = sessionStorageInfo.findIndex((e: { id: string }) => e.id === id)
    // 重复替换
    if (repeateIndex !== -1) {
      sessionStorageInfo.splice(repeateIndex, 1, { ...storageInfo, id })
      setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, sessionStorageInfo)
    } else {
      sessionStorageInfo.push({ ...storageInfo, id })
      setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, sessionStorageInfo)
    }
  } else {
    setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [{ ...storageInfo, id }])
  }
}

// 配置列表
const btnList: BtnListType[] = [
  {
    key: 'edit',
    type: TypeEnum.BUTTON,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('orgManage.common.edit'); },
    icon: CreateIcon,
    handle: editHandle
  },
  {
    key: 'setting',
    type: TypeEnum.BUTTON,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('iotApp.routes.avConfig'); },
    icon: SettingsSharpIcon,
    handle: () => {
      globalSettingModel.value = true
    }
  }
]

const isComponentMode = computed(() => chartEditStore.getIsComponentMode)

// 过滤后的按钮列表
const filteredBtnList = computed(() => {
  return btnList
})
</script>

<style lang="scss" scoped>
/* 底部区域的高度 */
$dockHeight: 30px;
$dockBottom: 60px;
$dockMiniWidth: 200px;
$dockMiniBottom: 53px;

$asideHeight: 210px;
$asideMiniHeight: 22px;
$asideBottom: 70px;

@include go('chart-edit-tools') {
  @extend .go-background-filter;
  position: absolute;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-radius: 25px;
  border: 1px solid;
  @include fetch-border-color('hover-border-color-shallow');
  &.aside {
    display: flex;
    justify-content: center;
    flex-direction: column-reverse;
    align-items: center;
    height: auto;
    min-width: 64px;
    right: 20px;
    padding: 12px 12px;
    bottom: $asideBottom;
    overflow: hidden;
    transition: height ease 0.4s;
    .btn-item {
      flex-shrink: 0;
      margin-bottom: 10px;
      &:first-of-type {
        margin-bottom: 0;
      }
      @include deep() {
        .n-button {
          width: 35px !important;
          min-width: 35px;
          height: 35px !important;
          padding: 0;
          border-radius: 50%;
          --n-icon-margin: 0;
        }
        .n-button__icon {
          margin: 0 !important;
        }
        .n-upload {
          width: auto;
        }
      }
    }
    &.unMini {
      animation: aside-in 0.4s ease forwards;
      @keyframes aside-in {
        0% {
          opacity: 0.5;
          height: $asideMiniHeight;
        }
        100% {
          height: $asideHeight;
          opacity: 1;
        }
      }
      .btn-item {
        position: relative;
        display: block;
      }
      .asideLogo {
        opacity: 0.4;
      }
    }
    &.isMini {
      cursor: pointer;
      padding: 13px 13px;
      background-color: var(--n-toggle-bar-color);
      animation: aside-mini-in 0.4s ease forwards;
      @keyframes aside-mini-in {
        0% {
          opacity: 0.5;
          height: $asideHeight;
        }
        100% {
          opacity: 1;
          height: $asideMiniHeight;
        }
      }
      .btn-item {
        position: relative;
        display: none;
      }
      .asideLogo {
        opacity: 1;
      }
    }
  }

  &.dock {
    width: auto;
    left: 50%;
    transform: translateX(-50%);
    .btn-item {
      margin-right: 20px;
      &:last-child {
        margin-right: 0;
      }
    }
    &.unMini {
      animation: dock-in 0.4s ease forwards;
      @keyframes dock-in {
        0% {
          opacity: 0;
          height: 0;
          padding: 5px;
          bottom: $dockMiniBottom;
        }
        100% {
          height: $dockHeight;
          padding: 8px 30px;
          bottom: $dockBottom;
          border-radius: 25px;
        }
      }
      &::after {
        content: '';
        position: absolute;
        left: 0;
        width: 100%;
        height: 10px;
        bottom: -10px;
        cursor: pointer;
      }
    }
    /* 最小化 */
    &.isMini {
      height: 0;
      width: $dockMiniWidth;
      bottom: $dockMiniBottom;
      padding: 5px;
      border-radius: 8px;
      cursor: pointer;
      border: 0px;
      animation: dock-mini-in 1s ease forwards;
      @keyframes dock-mini-in {
        0% {
          opacity: 1;
          height: $dockHeight;
          padding: 8px 30px;
          bottom: $dockBottom;
          border-radius: 25px;
        }
        20% {
          height: 0;
          border-radius: 8px;
        }
        50% {
          opacity: 0;
          bottom: calc(#{$dockMiniBottom} - 10px);
          pointer-events: none;
        }
        100% {
          opacity: 1;
          height: 0;
          padding: 5px;
          bottom: $dockMiniBottom;
        }
      }
      .btn-item {
        position: relative;
        bottom: -50px;
        display: none;
      }
    }
  }
}
</style>
