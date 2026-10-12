import type { Updater } from '@tanstack/vue-table';

/**
 * DataTable 状态工具，负责兼容 TanStack 的值与更新函数两种写法。
 */
import type { Ref } from 'vue';

import { isFunction } from '@tanstack/vue-table';

/** valueUpdater 将 TanStack 更新器写回 Vue Ref。 */
export function valueUpdater<T extends boolean | number | object | string>(updaterOrValue: Updater<T>, target: Ref<T>) {
  target.value = isFunction(updaterOrValue) ? updaterOrValue(target.value) : updaterOrValue;
}
