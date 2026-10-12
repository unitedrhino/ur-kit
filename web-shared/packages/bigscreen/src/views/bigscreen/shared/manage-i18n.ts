/** 文件说明：共享大屏管理页的表单、表格语言刷新；保留当前筛选、分页和编辑值。 */
import { watch } from 'vue';
import { preferences } from '@vben/preferences';
import { useVbenForm, useVbenVxeGrid } from '@vben/saas';

/** 建立编辑表单；语言改变时重建文案定义，不清空当前表单值。 */
export function useLocalizedForm(factory: () => Parameters<typeof useVbenForm>[0]) {
  const result = useVbenForm({ ...factory(), layout: 'vertical' });
  watch(() => preferences.app.locale, () => {
    const schema = factory().schema ?? [];
    const currentSchema = result[1].getState()?.schema ?? [];
    // 远程加载的业务选项可能只写在当前状态里；空的初始选项不得覆盖它们。
    const updates = schema.map((item) => {
      const current = currentSchema.find((field) => field.fieldName === item.fieldName);
      const props = item.componentProps;
      const currentProps = current?.componentProps;
      if (props && typeof props === 'object' && currentProps && typeof currentProps === 'object'
        && Array.isArray(props.options) && props.options.length === 0
        && Array.isArray(currentProps.options) && currentProps.options.length > 0) {
        const { options: _initialOptions, ...translatedProps } = props;
        return { ...item, componentProps: translatedProps };
      }
      return item;
    });
    result[1].updateSchema(updates);
  }, { flush: 'post' });
  return result;
}

/** 建立列表表格；语言改变时刷新表头和筛选定义，保留查询值与分页。 */
export function useLocalizedGrid(factory: () => Parameters<typeof useVbenVxeGrid>[0]) {
  const initial = factory();
  const result = useVbenVxeGrid({ ...initial, formOptions: initial.formOptions
    ? { ...initial.formOptions, layout: 'vertical' } : undefined });
  watch(() => preferences.app.locale, () => {
    const options = factory();
    if (options.gridOptions?.columns) {
      result[1].setGridOptions({ columns: options.gridOptions.columns });
    }
    if (options.formOptions?.schema) {
      result[1].setState({ formOptions: { schema: options.formOptions.schema } });
    }
  }, { flush: 'post' });
  return result;
}
