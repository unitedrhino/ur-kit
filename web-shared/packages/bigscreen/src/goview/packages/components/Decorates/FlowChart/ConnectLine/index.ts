/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType } from '@/packages/index.type';

import type { ConnectLinePathType } from './path';

import { fetchChartComponent, fetchConfigComponent } from '@/packages/index';
import { ChartFrameEnum, PackagesCategoryEnum } from '@/packages/index.type';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { EditCanvasTypeEnum } from '@/store/modules/chartEditStore/chartEditStore.type';
import { componentInstall } from '@/utils';

import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type';

export type { ConnectLinePathType } from './path';

export type ConnectLineToolConfig = ConfigType & {
  defaultPathType?: ConnectLinePathType;
};

export const createConnectLineToolConfig = (pathType: ConnectLinePathType = 'elbow'): ConnectLineToolConfig => ({
  ...ConnectLineConfig,
  defaultPathType: pathType,
});

export const activateConnectLineTool = (lineConfig: ConnectLineToolConfig = createConnectLineToolConfig()) => {
  const chartEditStore = useChartEditStore();
  componentInstall(lineConfig.chartKey, fetchChartComponent(lineConfig));
  componentInstall(lineConfig.conKey, fetchConfigComponent(lineConfig));
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.CREATE_COMPONENT_CONFIG, lineConfig);
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, true);
};

export const ConnectLineConfig: ConfigType = {
  key: 'ConnectLine',
  chartKey: 'VConnectLine',
  conKey: 'VCConnectLine',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentAnimatedEdges'); },
  category: ChatCategoryEnum.FlowChart,
  categoryName: ChatCategoryEnumName.FlowChart,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.STATIC,
  image: 'flow-zhexian.png',
  configEvents: {
    addHandle: (lineConfig: ConfigType) => activateConnectLineTool(lineConfig),
  },
};
