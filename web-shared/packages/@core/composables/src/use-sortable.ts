import type { SortableOptions } from 'sortablejs';
import type Sortable from 'sortablejs';

function useSortable<T extends HTMLElement>(sortableContainer: T, options: SortableOptions = {}) {
  const initializeSortable = async () => {
    const Sortable = await import(
      // sortablejs 的 modular 子路径无类型声明（主入口才有）；
      // 不同应用 tsconfig 对该模块解析结果不同，用 ts-ignore 而非 expect-error 以兼容两种配置
      // @ts-ignore
      'sortablejs/modular/sortable.complete.esm.js'
    );
    const sortable = Sortable?.default?.create?.(sortableContainer, {
      animation: 300,
      delay: 400,
      delayOnTouchOnly: true,
      ...options,
    });
    return sortable as Sortable;
  };

  return {
    initializeSortable,
  };
}

export { useSortable };

export type { Sortable };
