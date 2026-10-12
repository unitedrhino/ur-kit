<script setup lang="ts">
/** 文件说明：复选框兼容新旧受控协议，统一转发选中与半选状态，避免事件重复触发。 */
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { CheckIcon, MinusIcon } from '@radix-icons/vue';
import { CheckboxIndicator, CheckboxRoot, useForwardProps } from 'reka-ui';
import { cn } from '@unitedrhino/saas-ui/lib/utils';

type CheckedState = boolean | 'indeterminate';

/** Checkbox 属性，兼容 reka-ui v-model 与旧版 checked 写法。 */
interface Props extends CheckboxRootProps {
  class?: HTMLAttributes['class'];
  /** 兼容 radix-vue / reka-ui v1 的受控选中状态。 */
  checked?: CheckedState;
}

const props = defineProps<Props>();
const emits = defineEmits<
  CheckboxRootEmits & {
    /** 兼容旧版受控写法。 */
    'update:checked': [value: CheckedState];
  }
>();

const delegatedProps = reactiveOmit(props, 'class', 'checked', 'modelValue');

/** 更新事件只经 checkboxModel 发出，不能与 v-model 再重复转发一次。 */
const forwarded = useForwardProps(delegatedProps);

/** 统一新旧 API 的选中状态。 */
const checkboxModel = computed<CheckedState | null | undefined>({
  get: () => props.modelValue ?? props.checked,
  set: (value) => {
    const next = value ?? false;
    emits('update:modelValue', next);
    emits('update:checked', next);
  },
});
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    v-model="checkboxModel"
    :class="
      cn(
        'border-primary focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground peer grid h-4 w-4 shrink-0 place-content-center rounded-sm border shadow focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <CheckboxIndicator class="grid place-content-center text-current">
      <slot>
        <MinusIcon v-if="checkboxModel === 'indeterminate'" class="h-4 w-4" />
        <CheckIcon v-else class="h-4 w-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
