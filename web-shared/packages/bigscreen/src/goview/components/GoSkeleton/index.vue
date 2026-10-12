<script lang="ts" setup>
defineProps({
  repeat: {
    type: Number,
    default: 1,
  },
  load: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <div v-show="load" class="go-skeleton">
    <div v-show="repeat === 1">
      <n-skeleton class="item" v-bind="$attrs" />
    </div>
    <div v-show="repeat === 2">
      <n-skeleton class="item" v-bind="$attrs" />
      <n-skeleton class="item" v-bind="$attrs" style="width: 60%" />
    </div>
    <div v-show="repeat > 2">
      <n-skeleton class="item" v-bind="$attrs" :repeat="repeat - 2" />
      <n-skeleton class="item" v-bind="$attrs" style="width: 60%" />
      <n-skeleton class="item" v-bind="$attrs" style="width: 50%" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include go('skeleton') {
  padding-bottom: 5px;

  .item {
    margin-top: 5px;
    margin-left: 5px;
  }
}
</style>
