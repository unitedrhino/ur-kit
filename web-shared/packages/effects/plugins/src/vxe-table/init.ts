import type { SetupVxeTable } from './types';

import { defineComponent, watch } from 'vue';

import { usePreferences } from '@vben/preferences';

import { useVbenForm } from '@vben-core/form-ui';

import {
  VxeButton,
  VxeCheckbox,

  // VxeFormGather,
  // VxeForm,
  // VxeFormItem,
  VxeIcon,
  VxeInput,
  VxeLoading,
  VxeModal,
  VxeNumberInput,
  VxePager,
  // VxeList,
  // VxeModal,
  // VxeOptgroup,
  // VxeOption,
  // VxePulldown,
  // VxeRadio,
  // VxeRadioButton,
  VxeRadioGroup,
  VxeSelect,
  VxeTooltip,
  VxeUI,
  VxeUpload,
  // VxeSwitch,
  // VxeTextarea,
} from 'vxe-pc-ui';
// 语言包必须走 ESM 出口：lib/language 下是带 __esModule 的 CJS，
// rolldown（vite 8）互操作不穿透 exports.default，默认导入会多包一层，
// setI18n 存入后 getI18n('vxe.pager.total') 取不到值而回显原始 key（2026-09-12 生产回归）
import enUS from 'vxe-pc-ui/es/language/en-US';
// 导入默认的语言
import zhCN from 'vxe-pc-ui/es/language/zh-CN';
import zhTW from 'vxe-pc-ui/es/language/zh-TW';
import esES from 'vxe-pc-ui/es/language/es-ES';
import frFR from 'vxe-pc-ui/es/language/fr-FR';
import deDE from 'vxe-pc-ui/es/language/de-DE';
import jaJP from 'vxe-pc-ui/es/language/ja-JP';
import ruRU from 'vxe-pc-ui/es/language/ru-RU';
import ptBR from 'vxe-pc-ui/es/language/pt-BR';
import idID from 'vxe-pc-ui/es/language/id-ID';
import arEG from 'vxe-pc-ui/es/language/ar-EG';
import { VxeColgroup, VxeColumn, VxeGrid, VxeTable, VxeToolbar } from 'vxe-table';

import { extendsDefaultFormatter } from './extends';

// 是否加载过
let isInit = false;

// eslint-disable-next-line import/no-mutable-exports
export let useTableForm: typeof useVbenForm;

// 部分组件，如果没注册，vxe-table 会报错，这里实际没用组件，只是为了不报错，同时可以减少打包体积
const createVirtualComponent = (name = '') => {
  return defineComponent({
    name,
  });
};

export function initVxeTable() {
  if (isInit) {
    return;
  }

  VxeUI.component(VxeTable);
  VxeUI.component(VxeColumn);
  VxeUI.component(VxeColgroup);
  VxeUI.component(VxeGrid);
  VxeUI.component(VxeToolbar);

  VxeUI.component(VxeButton);
  // VxeUI.component(VxeButtonGroup);
  VxeUI.component(VxeCheckbox);
  // VxeUI.component(VxeCheckboxGroup);
  VxeUI.component(createVirtualComponent('VxeForm'));
  // VxeUI.component(VxeFormGather);
  // VxeUI.component(VxeFormItem);
  VxeUI.component(VxeIcon);
  VxeUI.component(VxeInput);
  // VxeUI.component(VxeList);
  VxeUI.component(VxeLoading);
  VxeUI.component(VxeModal);
  VxeUI.component(VxeNumberInput);
  // VxeUI.component(VxeOptgroup);
  // VxeUI.component(VxeOption);
  VxeUI.component(VxePager);
  // VxeUI.component(VxePulldown);
  // VxeUI.component(VxeRadio);
  // VxeUI.component(VxeRadioButton);
  VxeUI.component(VxeRadioGroup);
  VxeUI.component(VxeSelect);
  // VxeUI.component(VxeSwitch);
  // VxeUI.component(VxeTextarea);
  VxeUI.component(VxeTooltip);
  VxeUI.component(VxeUpload);

  isInit = true;
}

export function setupVbenVxeTable(setupOptions: SetupVxeTable) {
  const { configVxeTable, useVbenForm } = setupOptions;

  initVxeTable();
  useTableForm = useVbenForm;

  const { isDark, locale } = usePreferences();

  // 统一多语言映射：vxe 未提供的语言（孟加拉/乌尔都）回退英文；ar 用最接近的 ar-EG
  const localMap: Record<string, unknown> = {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS,
    'es-ES': esES,
    'fr-FR': frFR,
    'de-DE': deDE,
    'ja-JP': jaJP,
    'ru-RU': ruRU,
    'pt-BR': ptBR,
    'id-ID': idID,
    ar: arEG,
  };

  watch(
    [() => isDark.value, () => locale.value],
    ([isDarkValue, localeValue]) => {
      VxeUI.setTheme(isDarkValue ? 'dark' : 'light');
      // setI18n/setLanguage 需 vxe 已注册的 locale 名；未映射语言回退 en-US
      const vxeLocale = (localMap[localeValue] ? localeValue : 'en-US') as Parameters<typeof VxeUI.setI18n>[0];
      VxeUI.setI18n(vxeLocale, localMap[localeValue] ?? enUS);
      VxeUI.setLanguage(vxeLocale);
    },
    {
      immediate: true,
    },
  );

  extendsDefaultFormatter(VxeUI);

  configVxeTable(VxeUI);
}
