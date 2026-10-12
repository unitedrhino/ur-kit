const DYNAMIC_REQUEST_TYPES = new Set(['AJAX', 'DataQuery', 'Dataset', 'IoTDevice', 'Pond', 1, 2, 3, 4, 5]);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function shouldSanitizeDynamicRuntime(component: any) {
  return DYNAMIC_REQUEST_TYPES.has(component?.request?.requestDataType);
}

function sanitizeSimplifiedData(option: any) {
  if (!option?._simplifiedData || typeof option._simplifiedData !== 'object') return;

  const nextSimplifiedData = { ...option._simplifiedData };
  delete nextSimplifiedData.rows;
  delete nextSimplifiedData.columns;
  delete nextSimplifiedData.values;
  delete nextSimplifiedData._iotMeta;
  option._simplifiedData = nextSimplifiedData;
}

function sanitizeComponentRuntime(component: any): any {
  const nextComponent = deepClone(component);

  if (!nextComponent || typeof nextComponent !== 'object') return nextComponent;

  if (Array.isArray(nextComponent.groupList)) {
    nextComponent.groupList = nextComponent.groupList.map((child: any) => sanitizeComponentRuntime(child));
  }

  if (!shouldSanitizeDynamicRuntime(nextComponent)) {
    return nextComponent;
  }

  if (nextComponent.option && typeof nextComponent.option === 'object') {
    if ('dataset' in nextComponent.option) {
      delete nextComponent.option.dataset;
    }
    if ('_lastDynamicDataset' in nextComponent.option) {
      delete nextComponent.option._lastDynamicDataset;
    }
    sanitizeSimplifiedData(nextComponent.option);
  }

  return nextComponent;
}

/**
 * 模板复制到新大屏时，只保留动态组件的请求配置，清理运行态快照。
 * 避免把模板编辑阶段的运行结果直接固化到新环境中。
 */
export function sanitizeTemplateRuntimeForScreen(componentList: any[]) {
  if (!Array.isArray(componentList)) return [];
  return componentList.map((component) => sanitizeComponentRuntime(component));
}
