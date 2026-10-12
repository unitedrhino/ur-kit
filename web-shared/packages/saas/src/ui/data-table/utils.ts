import type { Updater } from '@tanstack/vue-table';
import type { Ref } from 'vue';

import { isFunction } from '@tanstack/vue-table';

export function valueUpdater<T extends object | string | number | boolean>(
  updaterOrValue: Updater<T>,
  ref: Ref<T>,
) {
  ref.value = isFunction(updaterOrValue)
    ? updaterOrValue(ref.value)
    : updaterOrValue;
}
