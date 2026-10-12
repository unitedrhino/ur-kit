/**
 * 通用组件共同的使用的基础组件，原先放在 adapter/form 内部，限制了使用范围，这里提取出来，方便其他地方使用
 * 可用于 vben-form、vben-modal、vben-drawer 等组件使用,
 */

import type { Component } from 'vue';

import type { BaseFormComponentType } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { createTextVNode, defineAsyncComponent, defineComponent, h, ref } from 'vue';

import { ApiComponent, globalShareState, IconPicker, setDefaultModalProps } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { NButton } from 'naive-ui';

import { message } from '../naive';

import { uploadFile } from '../../api';

import LimitInputNumber from '../../components/LimitInputNumber.vue';
import TiptapEditor from '../../components/TiptapEditor.vue';
import TagFilterInput from './TagFilterInput.vue';
import { resolveUploadImageModelValue } from './upload-image';

const AceEditor = defineAsyncComponent(() => import('../../components/aceEditor.vue'));
const NAutoComplete = defineAsyncComponent(() => import('naive-ui/es/auto-complete').then((res) => res.NAutoComplete));
const NCheckbox = defineAsyncComponent(() => import('naive-ui/es/checkbox').then((res) => res.NCheckbox));
const NCheckboxGroup = defineAsyncComponent(() => import('naive-ui/es/checkbox').then((res) => res.NCheckboxGroup));
const NDatePicker = defineAsyncComponent(() => import('naive-ui/es/date-picker').then((res) => res.NDatePicker));
const NDivider = defineAsyncComponent(() => import('naive-ui/es/divider').then((res) => res.NDivider));
const NInput = defineAsyncComponent(() => import('naive-ui/es/input').then((res) => res.NInput));
const NInputNumber = defineAsyncComponent(() => import('naive-ui/es/input-number').then((res) => res.NInputNumber));
const NRadio = defineAsyncComponent(() => import('naive-ui/es/radio').then((res) => res.NRadio));
const NRadioButton = defineAsyncComponent(() => import('naive-ui/es/radio').then((res) => res.NRadioButton));
const NRadioGroup = defineAsyncComponent(() => import('naive-ui/es/radio').then((res) => res.NRadioGroup));
const NSelect = defineAsyncComponent(() => import('naive-ui/es/select').then((res) => res.NSelect));
const NSpace = defineAsyncComponent(() => import('naive-ui/es/space').then((res) => res.NSpace));
const NSwitch = defineAsyncComponent(() => import('naive-ui/es/switch').then((res) => res.NSwitch));
const NTimePicker = defineAsyncComponent(() => import('naive-ui/es/time-picker').then((res) => res.NTimePicker));
const NTreeSelect = defineAsyncComponent(() => import('naive-ui/es/tree-select').then((res) => res.NTreeSelect));
const NUpload = defineAsyncComponent(() => import('naive-ui/es/upload').then((res) => res.NUpload));
// const NTag = defineAsyncComponent(() => import('naive-ui/es/tag').then((res) => res.NTag));
const NDynamicTags = defineAsyncComponent(() => import('naive-ui/es/dynamic-tags').then((res) => res.NDynamicTags));

const withDefaultPlaceholder = <T extends Component>(component: T, type: 'input' | 'select', componentProps: Recordable<any> = {}) => {
  return defineComponent({
    name: component.name,
    inheritAttrs: false,
    setup: (props: any, { attrs, expose, slots }) => {
      const placeholder = props?.placeholder || attrs?.placeholder || $t(`ui.placeholder.${type}`);
      // 透传组件暴露的方法
      const innerRef = ref();
      expose(
        new Proxy(
          {},
          {
            get: (_target, key) => innerRef.value?.[key],
            has: (_target, key) => key in (innerRef.value || {}),
          },
        ),
      );
      return () => h(component, { ...componentProps, placeholder, ...props, ...attrs, ref: innerRef }, slots);
    },
  });
};

// 这里需要自行根据业务组件库进行适配，需要用到的组件都需要在这里类型说明
export type ComponentType =
  | 'ApiSelect'
  | 'ApiTreeSelect'
  | 'AutoComplete'
  | 'Checkbox'
  | 'CheckboxGroup'
  | 'CustomDatePicker'
  | 'DatePicker'
  | 'Divider'
  | 'IconPicker'
  | 'Input'
  | 'InputNumber'
  | 'JsonEditor'
  | 'KeyValueInput'
  | 'LimitInputNumber'
  | 'RadioGroup'
  | 'RichTextEditor'
  | 'Select'
  | 'Space'
  | 'Switch'
  | 'TagFilterInput'
  | 'TagInput'
  | 'TagInputObject'
  | 'Textarea'
  | 'TimePicker'
  | 'TreeSelect'
  | 'Upload'
  | BaseFormComponentType;

async function initComponentAdapter() {
  const components: Partial<Record<ComponentType, Component>> = {
    // 如果你的组件体积比较大，可以使用异步加载
    // Button: () =>
    // import('xxx').then((res) => res.Button),

    ApiSelect: withDefaultPlaceholder(
      {
        ...ApiComponent,
        name: 'ApiSelect',
      },
      'select',
      {
        component: NSelect,
        modelPropName: 'value',
      },
    ),
    ApiTreeSelect: withDefaultPlaceholder(
      {
        ...ApiComponent,
        name: 'ApiTreeSelect',
      },
      'select',
      {
        component: NTreeSelect,
        nodeKey: 'value',
        loadingSlot: 'arrow',
        keyField: 'value',
        modelPropName: 'value',
        optionsPropName: 'options',
        visibleEvent: 'onVisibleChange',
      },
    ),
    AutoComplete: NAutoComplete,
    Checkbox: NCheckbox,
    CheckboxGroup: (props, { attrs, slots }) => {
      let defaultSlot;
      if (Reflect.has(slots, 'default')) {
        defaultSlot = slots.default;
      } else {
        const { options } = attrs;
        if (Array.isArray(options)) {
          defaultSlot = () => options.map((option) => h(NCheckbox, option));
        }
      }
      return h(NCheckboxGroup, { ...props, ...attrs }, { default: defaultSlot });
    },
    DatePicker: NDatePicker,
    CustomDatePicker: (props, { attrs }) => {
      // return h(NDatePicker, {...props, ...attrs}, slots);
      return h('div', { class: 'flex flex-row ' }, [
        h(NRadioGroup, null, {
          default: () => [
            h(NRadioButton, { value: '1', label: '7天' }),
            h(NRadioButton, { value: '2', label: '14天' }),
            h(NRadioButton, { value: '2', label: '14天' }),
            h(NRadioButton, { value: '2', label: '14天' }),
          ],
        }),
        h(NDatePicker, { ...props, ...attrs }),
      ]);
    },
    // 自定义默认按钮
    DefaultButton: (props, { attrs, slots }) => {
      return h(NButton, { ...props, attrs, type: 'default' }, slots);
    },
    // 自定义主要按钮
    PrimaryButton: (props, { attrs, slots }) => {
      return h(NButton, { ...props, attrs, type: 'primary' }, slots);
    },
    Divider: NDivider,
    IconPicker: withDefaultPlaceholder(IconPicker, 'select', {
      iconSlot: 'suffix',
      inputComponent: NInput,
    }),
    Input: withDefaultPlaceholder(NInput, 'input'),
    // 多行文本框组件，基于 naive-ui NInput 封装
    Textarea: withDefaultPlaceholder(NInput, 'input', { type: 'textarea' }),
    // JSON 编辑器组件，基于 AceEditor 封装
    // 数据格式: JSON 字符串
    JsonEditor: (props: any, { attrs }: any) => {
      let value = attrs.value ?? '';
      if (typeof value === 'object') {
        value = JSON.stringify(value, null, 2);
      }
      // const value = props.value ?? attrs.value ?? '';
      const height = props.height ?? attrs.height ?? '300px';
      const readonly = props.readonly ?? attrs.readonly ?? false;
      const placeholder = props.placeholder ?? attrs.placeholder ?? '请输入 JSON 数据';

      return h(AceEditor, {
        modelValue: value,
        'onUpdate:modelValue': (val: string) => {
          const updateValue = attrs['onUpdate:value'] || attrs.onUpdateValue;
          if (typeof updateValue === 'function') {
            updateValue(val);
          }
        },
        mode: 'json',
        height,
        readonly,
        placeholder,
        theme: 'monokai',
      });
    },
    InputNumber: withDefaultPlaceholder(NInputNumber, 'input'),
    LimitInputNumber,
    // 富文本编辑器组件，基于 Tiptap 封装
    // 数据格式: HTML 字符串
    // uploadBusiness: 上传业务标识（用于公开桶路径）
    // uploadUseBy: 上传使用级别（user/tenant/platform）
    RichTextEditor: (props: any, { attrs }: any) => {
      const value = attrs.value ?? '';
      const placeholder = props.placeholder ?? attrs.placeholder ?? '请输入内容...';
      const maxHeight = props.maxHeight ?? attrs.maxHeight ?? '400px';
      const disabled = props.disabled ?? attrs.disabled ?? false;
      const uploadBusiness = props.uploadBusiness ?? attrs.uploadBusiness ?? 'richtext';
      const uploadUseBy = props.uploadUseBy ?? attrs.uploadUseBy ?? 'tenant';

      return h(TiptapEditor, {
        value,
        placeholder,
        maxHeight,
        disabled,
        uploadBusiness,
        uploadUseBy,
        'onUpdate:value': (val: string) => {
          const updateValue = attrs['onUpdate:value'] || attrs.onUpdateValue;
          if (typeof updateValue === 'function') {
            updateValue(val);
          }
        },
      });
    },
    RadioGroup: (props, { attrs, slots }) => {
      let defaultSlot;
      if (Reflect.has(slots, 'default')) {
        defaultSlot = slots.default;
      } else {
        const { options } = attrs;
        if (Array.isArray(options)) {
          defaultSlot = () => options.map((option) => h(attrs.isButton ? NRadioButton : NRadio, option));
        }
      }
      const groupRender = h(NRadioGroup, { ...props, ...attrs }, { default: defaultSlot });
      return attrs.isButton ? h(NSpace, { vertical: true }, () => groupRender) : groupRender;
    },
    Select: withDefaultPlaceholder(NSelect, 'select'),
    Space: NSpace,
    Switch: NSwitch,
    TimePicker: NTimePicker,
    TreeSelect: withDefaultPlaceholder(NTreeSelect, 'select'),
    UploadImage: (() => {
      // 存储当前会话内 filePath 和可访问 url 的映射关系，用于上传后未保存前的预览
      const fileUriMap = new Map<string, string>();

      return (props: any, { attrs, slots }: any) => {
        const modelValue = resolveUploadImageModelValue(props, attrs);

        // 新系统约束：后端返回的图片字段应为可直接访问的 URL。
        // fileUriMap 仅用于本次上传后、尚未保存前继续预览上传结果。
        function toPreviewUrl(value: string): string {
          if (!value) return '';
          return fileUriMap.get(value) || value;
        }

        const previewPath = modelValue ? toPreviewUrl(modelValue) : '';

        // 构建文件列表
        const defaultFileList = previewPath
          ? [
              {
                name: previewPath.split('/').pop()?.split('?')[0] || 'image.png',
                url: previewPath,
                id: previewPath,
                status: 'finished' as const,
              },
            ]
          : [];

        return h(
          NUpload,
          {
            key: modelValue || 'empty',
            defaultFileList: defaultFileList,
            listType: 'image-card',
            max: 1,
            customRequest: ({ file, onFinish, onError }: any) => {
              uploadFile(file.file as File)
                .then((res: any) => {
                  const previewUrl = res.fileUri || res.filePath;
                  if (res.filePath && previewUrl) {
                    fileUriMap.set(res.filePath, previewUrl);
                  }

                  // 提交值仍保持后端当前字段契约，预览使用 fileUri/可访问 URL。
                  // form.ts 配置 baseModelPropName: 'value'，框架绑定 onUpdate:value
                  const updateValue =
                    attrs['onUpdate:value'] ||
                    attrs.onUpdateValue ||
                    attrs['onUpdate:modelValue'] ||
                    attrs.onUpdateModelValue;
                  if (updateValue && typeof updateValue === 'function') {
                    updateValue(res.filePath);
                  }
                  onFinish();
                })
                .catch((error: any) => {
                  onError(error);
                });
            },
          },
          slots,
        );
      };
    })(),
    Upload: (props, { attrs, slots }) => {
      // 确保 file-list 始终是数组，避免 null.map() 错误
      const fileList = attrs.fileList ?? attrs['file-list'] ?? attrs.value ?? [];
      const listType = attrs.listType ?? attrs['list-type'] ?? 'text';

      // 如果没有提供默认插槽，则根据类型提供默认内容
      let defaultSlot = slots.default;
      if (!defaultSlot) {
        defaultSlot =
          listType === 'image-card'
            ? () => [createTextVNode(`+ ${$t('ui.upload.image')}`)]
            : () => [h(NButton, { type: 'primary', size: 'small' }, { default: () => $t('ui.upload.selectFile') })];
      }

      return h(
        NUpload,
        {
          ...props,
          ...attrs,
          'file-list': Array.isArray(fileList) ? fileList : [],
        },
        { ...slots, default: defaultSlot },
      );
    },
    // 标签筛选组件，点击弹框输入 key-value 标签
    // 数据格式: Array<{key: string, value: string}>
    TagFilterInput,
    TagInput: (props, { attrs, slots }) => {
      // 确保 value 始终是数组，避免 null.map() 错误
      const value = attrs.value ?? props.value ?? [];
      return h(
        NDynamicTags,
        {
          ...props,
          ...attrs,
          value: Array.isArray(value) ? value : [],
        },
        slots,
      );
    },
    // 键值对输入组件，用于环境变量等配置
    // 数据格式: { key1: value1, key2: value2 }
    KeyValueInput: defineComponent({
      name: 'KeyValueInput',
      props: {
        value: {
          type: Object,
          default: () => ({}),
        },
        keyPlaceholder: {
          type: String,
          default: '请输入键名',
        },
        valuePlaceholder: {
          type: String,
          default: '请输入键值',
        },
        addText: {
          type: String,
          default: '+ 添加',
        },
        disabled: {
          type: Boolean,
          default: false,
        },
      },
      emits: ['update:value'],
      setup(props, { emit }) {
        // 将对象转换为数组形式便于渲染
        const pairs = ref<Array<{ key: string; value: string }>>([]);

        // 监听外部 value 变化，同步到 pairs
        const syncFromValue = () => {
          const val = props.value || {};
          const entries = Object.entries(val);
          if (entries.length === 0) {
            pairs.value = [{ key: '', value: '' }];
          } else {
            pairs.value = entries.map(([k, v]) => ({ key: k, value: String(v) }));
          }
        };

        // 初始化
        syncFromValue();

        // 将数组转换为对象并触发更新
        const emitUpdate = () => {
          const result: Record<string, string> = {};
          for (const pair of pairs.value) {
            if (pair.key.trim()) {
              result[pair.key.trim()] = pair.value;
            }
          }
          emit('update:value', result);
        };

        // 更新某一行的 key
        const updateKey = (index: number, newKey: string) => {
          const pair = pairs.value[index];
          if (pair) {
            pair.key = newKey;
            emitUpdate();
          }
        };

        // 更新某一行的 value
        const updateValue = (index: number, newValue: string) => {
          const pair = pairs.value[index];
          if (pair) {
            pair.value = newValue;
            emitUpdate();
          }
        };

        // 添加一行
        const addPair = () => {
          pairs.value.push({ key: '', value: '' });
        };

        // 删除一行
        const removePair = (index: number) => {
          if (pairs.value.length > 1) {
            pairs.value.splice(index, 1);
            emitUpdate();
          }
        };

        return () =>
          h('div', { class: 'w-full space-y-2' }, [
            // 渲染每一行键值对
            ...pairs.value.map((pair, index) =>
              h('div', { class: 'flex items-center gap-2', key: index }, [
                // Key 输入框
                h(NInput, {
                  value: pair.key,
                  placeholder: props.keyPlaceholder,
                  disabled: props.disabled,
                  class: 'flex-1',
                  onUpdateValue: (val: string) => updateKey(index, val),
                }),
                // Value 输入框
                h(NInput, {
                  value: pair.value,
                  placeholder: props.valuePlaceholder,
                  disabled: props.disabled,
                  class: 'flex-1',
                  onUpdateValue: (val: string) => updateValue(index, val),
                }),
                // 删除按钮
                h(
                  NButton,
                  {
                    quaternary: true,
                    circle: true,
                    disabled: props.disabled || pairs.value.length <= 1,
                    onClick: () => removePair(index),
                  },
                  {
                    default: () =>
                      h(
                        'svg',
                        {
                          xmlns: 'http://www.w3.org/2000/svg',
                          width: '16',
                          height: '16',
                          viewBox: '0 0 24 24',
                          fill: 'none',
                          stroke: 'currentColor',
                          'stroke-width': '2',
                          'stroke-linecap': 'round',
                          'stroke-linejoin': 'round',
                        },
                        [h('line', { x1: '5', y1: '12', x2: '19', y2: '12' })],
                      ),
                  },
                ),
                // 添加按钮（只在最后一行显示）
                index === pairs.value.length - 1
                  ? h(
                      NButton,
                      {
                        quaternary: true,
                        circle: true,
                        disabled: props.disabled,
                        onClick: addPair,
                      },
                      {
                        default: () =>
                          h(
                            'svg',
                            {
                              xmlns: 'http://www.w3.org/2000/svg',
                              width: '16',
                              height: '16',
                              viewBox: '0 0 24 24',
                              fill: 'none',
                              stroke: 'currentColor',
                              'stroke-width': '2',
                              'stroke-linecap': 'round',
                              'stroke-linejoin': 'round',
                            },
                            [
                              h('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
                              h('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
                            ],
                          ),
                      },
                    )
                  : h('div', { style: 'width: 28px' }), // 占位符保持对齐
              ]),
            ),
          ]);
      },
    }),
  };

  // 将组件注册到全局共享状态中
  globalShareState.setComponents(components);

  // 弹窗默认水平垂直居中（覆盖 Modal 默认 top-[10vh]）
  setDefaultModalProps({
    centered: true,
  });

  // 定义全局共享状态中的消息提示
  globalShareState.defineMessage({
    // 复制成功消息提示
    copyPreferencesSuccess: (title, content) => {
      message.success(content || title, {
        duration: 0,
      });
    },
  });
}

export { initComponentAdapter };
export { default as TagFilterInput } from './TagFilterInput.vue';
