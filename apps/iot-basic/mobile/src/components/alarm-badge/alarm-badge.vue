<template>
<view v-if="count > 0" class="badge" :aria-label="`${display}条未读告警`">
  <text class="badge__text">{{display}}</text>
</view>

</template>

<script setup lang="ts">
import { computed } from 'vue';
interface Props {
  count?: number;
  maxCount?: number;
}
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  maxCount: 99,
});
const display = computed(() => (props.count > props.maxCount ? `${props.maxCount}+` : String(props.count)));
/* eslint-disable */
// Component({
//   properties: {
//     count: { type: Number, value: 0 },
//     maxCount: { type: Number, value: 99 },
//   },
//   observers: {
//     'count, maxCount'(count: number, maxCount: number) {
//       this.setData({ display: count > maxCount ? `${maxCount}+` : String(count) });
//     },
//   },
//   data: {
//     display: '0',
//   },
// });
// 
</script>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--color-danger);
  border-radius: 9px;
}

.badge__text {
  font-size: 11px;
  color: var(--color-on-primary);
  font-weight: 500;
  line-height: 1;
}

</style>
