<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
window.$t = t;
</script>

<template>
  <span v-if="false"></span>
</template>
