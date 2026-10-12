<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
/** 执行另一个场景。按场景类型加载列表选择。 */
import { ref, watch } from 'vue';
import type { SceneActionDraft } from '../types';
import type { SceneType } from '../../scene-types';
import { Api } from '../../index.api';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import EntityCombobox from '../shared/EntityCombobox.vue';

const props = defineProps<{ modelValue: SceneActionDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();

const TYPE_OPTIONS: { label: string; value: SceneType }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.manualControl'), value: 'manual' },
  { label: $t('orgIotClient.routes.automation'), value: 'auto' },
]));

const STATUS_OPTIONS = localizedSceneState(() => ([
  { label: $t('orgEnergy.ui.enable'), value: '1' },
  { label: $t('orgEnergy.ui.disable'), value: '0' },
]));

const sceneOptions = ref<{ label: string; value: string | number }[]>([]);

async function loadScenes() {
  if (!props.modelValue.sceneType) {
    sceneOptions.value = [];
    return;
  }
  try {
    const res: any = await Api.list(1, 200, { type: props.modelValue.sceneType });
    sceneOptions.value = (res?.list || []).map((s: any) => ({
      label: s.name,
      value: s.id,
    }));
  } catch {
    sceneOptions.value = [];
  }
}

watch(
  () => props.modelValue.sceneType,
  () => {
    props.modelValue.sceneID = undefined;
    props.modelValue.sceneName = undefined;
    loadScenes();
    emit('change');
  },
  { immediate: true },
);

watch(
  () => props.modelValue.sceneID,
  (v) => {
    const hit = sceneOptions.value.find((o) => String(o.value) === String(v));
    props.modelValue.sceneName = hit?.label;
    emit('change');
  },
);
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <FieldRow :label="$t('scene.ui.sceneType')" required width-class="w-40">
      <NativeSelect
        v-model="modelValue.sceneType"
        :options="TYPE_OPTIONS"
      />
    </FieldRow>
    <FieldRow :label="$t('iotApp.schemaTags.scene')" required width-class="w-60">
      <EntityCombobox
        v-model="modelValue.sceneID"
        :options="sceneOptions"
        :placeholder="$t('scene.ui.pleaseSelectAScene')"
        @open="loadScenes"
      />
    </FieldRow>
    <FieldRow
      v-if="modelValue.sceneType === 'auto'"
      :label="$t('iotApp.av.colStatus')"
      width-class="w-32"
    >
      <NativeSelect
        v-model="modelValue.status as any"
        :options="STATUS_OPTIONS"
        @update:model-value="emit('change')"
      />
    </FieldRow>
  </div>
</template>
