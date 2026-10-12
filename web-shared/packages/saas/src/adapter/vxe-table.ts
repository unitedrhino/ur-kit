// 共享 VXE 表格初始化及单元格渲染器，重型文件引擎按操作加载。
import type { ProCopyableTextConfig } from 'pro-naive-ui';

import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import type { VNode } from 'vue';

import { defineAsyncComponent, h, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $te } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';
import { get, isFunction, isString } from '@vben/utils';

import { objectOmit } from '@vueuse/core';
import { installLazyXlsx } from './lazy-xlsx';
import { NButton, NAvatar, NImage, NPopconfirm, NPopover, NSpace, NSwitch, NTag, NText } from 'naive-ui';
import { renderProCopyableText } from 'pro-naive-ui';

import { $t } from '../locales';

import SaasAvatar from '../components/saas-avatar.vue';
import { dialog } from './naive';
import { getAvatarUrl } from '../utils';


import { useVbenForm } from './form';
import bengaliVxeMessages from './vxe-locales/bn-BD.json';
import urduVxeMessages from './vxe-locales/ur-PK.json';

const AceEditor = defineAsyncComponent(() => import('../components/aceEditor.vue'));

export const initVxeTable = () => {
setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    // VXE 上游未提供孟加拉语和乌尔都语；在共享表格初始化后补齐两份完整语言包。
    watch(() => preferences.app.locale, (locale) => {
      const messages = locale === 'bn-BD' ? bengaliVxeMessages : locale === 'ur-PK' ? urduVxeMessages : undefined;
      if (!messages) return;
      // 上游类型枚举尚未收录这两种语言，运行时接受自定义语言代码。
      const vxeLocale = locale as Parameters<typeof vxeUI.setI18n>[0];
      vxeUI.setI18n(vxeLocale, messages);
      vxeUI.setLanguage(vxeLocale);
    }, { immediate: true, flush: 'post' });
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const size = _renderOpts?.props?.size || 'medium';
        if(!row[column.field]) {
          return h(NAvatar, { size });
        }
        return h(NAvatar, { src: getAvatarUrl(row[column.field]), size });
      },
    });

    // 使用 saas 库 SaasAvatar 组件，与平台头像展示统一；props 可选 nameField 取行内名称用于无图时首字母
    vxeUI.renderer.add('CellImageSaas', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const props = _renderOpts?.props ?? {};
        const avatar = get(row, column.field);
        const name = props.nameField ? get(row, props.nameField) : undefined;
        const size = props.size ?? 32;
        return h(SaasAvatar, {
          avatar: avatar ?? undefined,
          name: name ?? undefined,
          size: Number(size),
        });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellImagePreview' },
    // 使用 NImage 组件，支持点击预览大图；props 可选 size（默认 36）
    vxeUI.renderer.add('CellImagePreview', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const props = _renderOpts?.props ?? {};
        const size = props.size ?? 36;
        const value = get(row, column.field);
        if (!value) return [];
        const src = getAvatarUrl(value);
        return h(NImage, {
          src,
          width: size,
          height: size,
          objectFit: 'cover',
          style: { borderRadius: '4px' },
          lazy: true,
        });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    // attrs.onClick 可接收点击回调函数，参数为 { row, column }
    // attrs.isLink 可选，传函数 ({ row }) => boolean，返回 false 时渲染为纯文本
    // attrs.linkVariant 可选，传函数 ({ row, column }) => 'primary' | 'action'，用于区分「名称链接」与「操作型入口」（默认 primary）
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts, params) {
        const { props, attrs } = renderOpts;
        const { column, row } = params;
        // 优先使用 props.text（支持函数形式），否则从行数据中获取字段值
        const rawText = props?.text;
        const text = typeof rawText === 'function' ? rawText({ row, column }) : (rawText ?? get(row, column.field));
        const isLink = attrs?.isLink ? attrs.isLink({ row, column }) : true;
        if (!isLink) {
          return h('span', text);
        }
        const linkVariant = attrs?.linkVariant?.({ row, column }) ?? 'primary';
        const isAction = linkVariant === 'action';
        return h(
          NButton,
          {
            size: 'small',
            /** primary：名称类链接（蓝）；action：中性弱样式，避免抢主内容视线 */
            type: isAction ? 'default' : 'primary',
            quaternary: true,
            class: isAction ? 'text-muted-foreground' : undefined,
            onClick: () => attrs?.onClick?.({ row, column }),
          },
          { default: () => text },
        );
      },
    });

    // 单元格渲染： Tag
    vxeUI.renderer.add('CellTag', {
      renderTableDefault({ attrs, options, props }, { column, row }) {
        // 如果设置了 visibleMethod，且返回 false，则不渲染
        if (attrs?.visibleMethod && !attrs.visibleMethod(row)) {
          return [];
        }

        const value = get(row, column.field);
        const tagOptions = options ?? [
          { type: 'success', label: $t('common.enabled'), value: 1 },
          { type: 'error', label: $t('common.disabled'), value: 0 },
        ];
        const tagItem = tagOptions.find((item) => item.value === value);

        // 处理 Naive UI NTag 的属性映射
        const tagProps = { ...props };
        if (tagItem) {
          // 将 color 字符串映射到 type 属性
          if (tagItem.color && typeof tagItem.color === 'string') {
            tagProps.type = tagItem.color;
            delete tagProps.color;
          } else if (tagItem.type) {
            tagProps.type = tagItem.type;
          }
        }

        return h(
          NTag,
          {
            ...tagProps,
            ...objectOmit(tagItem ?? {}, ['label', 'color']),
          },
          { default: () => tagItem?.label ?? value },
        );
      },
    });

    vxeUI.renderer.add('CellSwitch', {
      renderTableDefault({ attrs, props }, { column, row }) {
        const loadingKey = `__loading_${column.field}`;
        const finallyProps = {
          // Naive UI NSwitch 使用 checkedChildren 和 uncheckedChildren
          checkedChildren: $t('common.enabled'),
          uncheckedChildren: $t('common.disabled'),
          ...props,
          value: row[column.field] === 1, // Naive UI 使用 value 而不是 checked
          loading: row[loadingKey] ?? false,
          'onUpdate:value': onChange,
        };
        async function onChange(newVal: any) {
          row[loadingKey] = true;
          // console.log('newVal ===================== ', newVal);
          // console.log('loadingKey ===================== ', loadingKey);
          // console.log('row ===================== ', row);
          // console.log('row[column.field] ===================== ', row[column.field]);
          // console.log('attrs?.beforeChange ===================== ', attrs?.beforeChange);
          try {
            const result = await attrs?.beforeChange?.(newVal ? 1 : 2, row);
            if (result !== false) {
              row[column.field] = newVal ? 1 : 2;
            }
          } finally {
            row[loadingKey] = false;
          }
        }
        return h(NSwitch, finallyProps);
      },
    });

    /**
     * 注册表格的操作按钮渲染器
     */
    vxeUI.renderer.add('CellOperation', {
      renderTableDefault({ attrs, options, props }, { column, row }) {
        // 如果设置了 visibleMethod，且返回 false，则不渲染操作按钮
        if (attrs?.visibleMethod && !attrs.visibleMethod(row)) {
          return [];
        }

        const defaultProps = { size: 'small', ...props };
        let align = 'end';
        switch (column.align) {
          case 'center': {
            align = 'center';
            break;
          }
          case 'left': {
            align = 'start';
            break;
          }
          default: {
            align = 'end';
            break;
          }
        }
        const presets: Recordable<Recordable<any>> = {
          delete: {
            type: 'error',
            text: $t('common.delete'),
          },
          detail: {
            text: '详情',
          },
          edit: {
            text: $t('common.edit'),
          },
        };
        const operations: Array<Recordable<any>> = (options || ['edit', 'delete'])
          .map((opt) => {
            if (isString(opt)) {
              return presets[opt]
                ? { code: opt, ...presets[opt], ...defaultProps }
                : {
                    code: opt,
                    text: $te(`common.${opt}`) ? $t(`common.${opt}`) : opt,
                    ...defaultProps,
                  };
            } else {
              return { ...defaultProps, ...presets[opt.code], ...opt };
            }
          })
          .map((opt) => {
            const optBtn: Recordable<any> = {};
            Object.keys(opt).forEach((key) => {
              optBtn[key] = isFunction(opt[key]) ? opt[key](row) : opt[key];
            });
            return optBtn;
          })
          .filter((opt) => opt.show !== false);

        function stopTableEvent(event: Event) {
          event.preventDefault();
          event.stopPropagation();
        }

        function renderBtn(opt: Recordable<any>, listen = true) {
          // 适配 Naive UI 的按钮属性，设置为文本模式
          const buttonProps: Recordable<any> = {
            ...props,
            size: opt.size || 'small',
            type: opt.type || 'primary',
            text: true, // 强制设置为文本模式
            onClick: listen
              ? (event: Event) => {
                  stopTableEvent(event);
                  attrs?.onClick?.({
                    code: opt.code,
                    row,
                  });
                }
              : undefined,
            onMousedown: listen ? stopTableEvent : undefined,
          };

          // 移除 undefined 属性
          Object.keys(buttonProps).forEach((key) => {
            if (buttonProps[key] === undefined) {
              delete buttonProps[key];
            }
          });

          return h(NButton, buttonProps, {
            default: () => {
              // 显式标注元素类型：空数组字面量在回调内 push 时会被推断为 never[]；opt.text 为 any 可直接放入
              const content: VNode[] = [];
              if (opt.icon) {
                content.push(h(IconifyIcon, { class: 'size-4 mr-1', icon: opt.icon }));
              }
              content.push(opt.text);
              return content;
            },
          });
        }

        function renderConfirm(opt: Recordable<any>) {
          let viewportWrapper: HTMLElement | null = null;

          // 适配 Naive UI 的 Popconfirm 属性
          const popconfirmProps: Recordable<any> = {
            /**
             * 当popconfirm用在固定列中时，将固定列作为弹窗的容器时可能会因为固定列较窄而无法容纳弹窗
             * 将表格主体区域作为弹窗容器时又会因为固定列的层级较高而遮挡弹窗
             * 将body或者表格视口区域作为弹窗容器时又会导致弹窗无法跟随表格滚动。
             * 鉴于以上各种情况，一种折中的解决方案是弹出层展示时，禁止操作表格的滚动条。
             * 这样既解决了弹窗的遮挡问题，又不至于让弹窗随着表格的滚动而跑出视口区域。
             */
            to: document.body, // Naive UI 使用 to 属性代替 getPopupContainer
            placement: 'top-start',
            // Naive UI 使用不同的事件名
            'onUpdate:show': (show: boolean) => {
              // 当弹窗打开时，禁止表格的滚动
              if (show) {
                viewportWrapper = document.querySelector('.vxe-table--viewport-wrapper');
                viewportWrapper?.style.setProperty('pointer-events', 'none');
              } else {
                (viewportWrapper ?? document.querySelector('.vxe-table--viewport-wrapper'))?.style.removeProperty(
                  'pointer-events',
                );
                viewportWrapper = null;
              }
            },
            onPositiveClick: () => {
              attrs?.onClick?.({
                code: opt.code,
                row,
              });
            },
            // 设置按钮文本
            positiveText: $t('common.confirm'),
            negativeText: $t('common.cancel'),
            ...props,
            ...opt,
          };

          // 移除 undefined 属性，以及不属于 NPopconfirm 的内部字段（show/code/text/icon 等）
          // 注意：show 是 NPopconfirm 的受控显示 prop，若传入 true 会导致弹窗永久展开
          const internalKeys = new Set(['show', 'code', 'text', 'icon', 'type', 'size']);
          Object.keys(popconfirmProps).forEach((key) => {
            if (popconfirmProps[key] === undefined || internalKeys.has(key)) {
              delete popconfirmProps[key];
            }
          });

          return h(NPopconfirm, popconfirmProps, {
            trigger: () => renderBtn({ ...opt, type: 'error' }, false),
            default: () => $t('ui.actionMessage.deleteConfirm', [row[attrs?.nameField || 'name']]),
          });
        }

        const btns = operations.map((opt) => (opt.code === 'delete' ? renderConfirm(opt) : renderBtn(opt)));
        return h(
          'div',
          {
            class: 'table-operations',
            style: { display: 'flex', justifyContent: align, position: 'relative', zIndex: 2 },
            onClick: stopTableEvent,
            onMousedown: stopTableEvent,
          },
          [
            h(
              NSpace,
              {
                size: 'small',
                align: 'center',
              },
              {
                default: () => btns,
              },
            ),
          ],
        );
      },
    });

    /**
     *  Copyable Text renderProCopyableText 参数
     */
    vxeUI.renderer.add('CellCopyableText', {
      renderTableDefault({ options }, { column, row }) {
        //
        return renderProCopyableText(row[column.field], options as ProCopyableTextConfig);
      },
    });

    /**
     * 对象权限渲染器 - 用于显示对象类型的权限数据
     * 使用方式：
     * cellRender: {
     *   name: 'CellObjectPerm',
     *   options: [
     *     { value: 2, label: '读写', type: 'success' },
     *     { value: 3, label: '只读', type: 'warning' },
     *   ],
     * }
     */
    vxeUI.renderer.add('CellObjectPerm', {
      renderTableDefault({ options }, { column, row }) {
        const value = get(row, column.field);

        // 如果值为空或不是对象，返回 '--'
        if (!value || typeof value !== 'object') {
          return h(NText, { depth: 3 }, { default: () => '--' });
        }

        // 获取权限映射配置
        const permOptions = options ?? [
          { value: 2, label: $t('iotApp.deviceDetail.readWrite'), type: 'success' },
          { value: 3, label: $t('iotApp.deviceDetail.readOnly'), type: 'warning' },
        ];

        // 统计各种权限的数量
        const permCount: Record<number, number> = {};
        const entries = Object.entries(value);

        entries.forEach(([_key, item]: [string, any]) => {
          const perm = item?.perm;
          if (perm !== undefined) {
            permCount[perm] = (permCount[perm] || 0) + 1;
          }
        });

        // 创建显示内容 - 主按钮
        const totalCount = entries.length;
        const mainContent = h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'info',
          },
          {
            default: () => $t('iotApp.deviceDetail.permissionTotal', { count: totalCount }),
          },
        );

        // 创建弹出层详细内容
        const popoverContent = h(
          'div',
          {
            class: 'flex flex-col gap-2 max-h-96 overflow-y-auto p-2',
            style: { maxWidth: '400px' },
          },
          [
            // 统计摘要
            h(
              'div',
              { class: 'flex flex-wrap gap-2 mb-2 pb-2 border-b border-gray-200' },
              Object.entries(permCount).map(([perm, count]) => {
                const option = permOptions.find((opt) => opt.value === Number(perm));
                return h(
                  NTag,
                  {
                    type: option?.type || 'default',
                    size: 'small',
                  },
                  { default: () => `${option?.label || perm}: ${count}` },
                );
              }),
            ),
            // 详细列表
            ...entries.map(([key, item]: [string, any]) => {
              const perm = item?.perm;
              const option = permOptions.find((opt) => opt.value === perm);

              return h('div', { class: 'flex items-center justify-between gap-2 py-1' }, [
                h(NText, { class: 'flex-1 text-sm' }, { default: () => key }),
                h(
                  NTag,
                  {
                    type: option?.type || 'default',
                    size: 'small',
                  },
                  { default: () => option?.label || perm },
                ),
              ]);
            }),
          ],
        );

        // 返回带弹出层的按钮
        return h(
          NPopover,
          {
            trigger: 'click',
            placement: 'bottom',
          },
          {
            trigger: () => mainContent,
            default: () => popoverContent,
          },
        );
      },
    });

    /**
     * 自定义渲染器： CellJson
     * 使用方式：
     * cellRender: {
     *   name: 'CellJson',
     * }
     */
    vxeUI.renderer.add('CellJson', {
      renderTableDefault({ attrs }, { column, row }) {
        const jsonValue = row[column.field];
        //mock
        // const jsonValue = {
        //   name: 'John Doe',
        //   age: 30,
        //   email: 'john.doe@example.com',
        //   address: {
        //     street: '123 Main St',
        //     city: 'Anytown',
        //     state: 'CA',
        //   },
        // };

        // 如果值为空，显示默认文本
        // if (!jsonValue) {
        //   return h(NText, { depth: 3 }, { default: () => '{}' });
        // }

        // 格式化 JSON 字符串
        let formattedJson = '';
        try {
          // 如果已经是字符串，尝试解析并格式化
          if (typeof jsonValue === 'string') {
            const parsed = JSON.parse(jsonValue);
            formattedJson = JSON.stringify(parsed, null, 2);
          } else {
            // 如果是对象，直接格式化
            formattedJson = JSON.stringify(jsonValue, null, 2);
          }
        } catch (error) {
          // 如果解析失败，显示原始值
          formattedJson = String(jsonValue);
        }

        // 创建按钮，点击后弹出 JSON 预览弹窗
        const handleClick = () => {
          dialog.create({
            title: attrs?.title || 'JSON 预览 行ID:' + (row?.id || row?.name || ''),
            content: () =>
              h(
                'div',
                {
                  style: {
                    padding: '16px',
                    height: '600px',
                    boxSizing: 'border-box',
                  },
                },
                [
                  h(AceEditor, {
                    modelValue: formattedJson,
                    mode: 'json',
                    readonly: true,
                    height: '568px', // 600px - 32px (padding)
                    theme: 'monokai',
                    showGutter: true,
                    wrap: true,
                  }),
                ],
              ),
            positiveText: '关闭',
            style: {
              width: '800px',
            },
          });
        };

        return h(
          NButton,
          {
            size: 'small',
            // type: 'primary',
            quaternary: true,
            onClick: handleClick,
          },
          {
            default: () => 'JSON 预览',
          },
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
    vxeUI.formats.add('customTime', {
      tableCellFormatMethod({ cellValue }) {
        if (!cellValue) {
          return '--';
        }
        if (cellValue === '0' || cellValue === 0) {
          return '-';
        }

        let cellValueInt = 0;
        cellValueInt = typeof cellValue === 'string' ? Number.parseInt(cellValue) : cellValue;
        if (!Number.isFinite(cellValueInt) || cellValueInt <= 0) {
          return '-';
        }
        // 如果小于等于 9999999999，认为是秒，乘以 1000，否则认为是毫秒
        if (cellValueInt > 0 && cellValueInt <= 9_999_999_999) {
          cellValueInt = cellValueInt * 1000;
        }

        return new Date(cellValueInt).toLocaleString('zh-CN');
      },
    });

    // 保留 XLSX 菜单，实际导入导出时才加载引擎。
    installLazyXlsx(vxeUI);
  },
  useVbenForm,
});
}

export { useVbenVxeGrid };
export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};
export type OnActionClickFn<T = Recordable<any>> = (params: OnActionClickParams<T>) => void;
export type * from '@vben/plugins/vxe-table';
