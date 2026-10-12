<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import type { TreeOption } from 'naive-ui';

import {
  NDivider,
  NInputNumber,
  NInput,
  NTree,
  useMessage,
} from 'naive-ui';

import { NButton } from 'naive-ui';

import { Api } from '../index.api';

const emit = defineEmits<{
  success: [];
}>();

const message = useMessage();

interface LevelConfig {
  template: string;
  count: number;
}

const levels = ref<LevelConfig[]>([{ template: '', count: 3 }]);
const concatParent = ref(false);
const concatSeparator = ref('');
const creating = ref(false);

function parseTemplate(template: string) {
  const match = template.match(/^(.*?)(\d+)(.*?)$/);
  if (!match) return null;
  return {
    prefix: match[1]!,
    num: Number.parseInt(match[2]!, 10),
    suffix: match[3]!,
  };
}

function generateNames(template: string, count: number): string[] {
  const parsed = parseTemplate(template);
  if (!parsed) {
    return Array.from({ length: count }, (_, i) => `${template}${i + 1}`);
  }
  return Array.from(
    { length: count },
    (_, i) => `${parsed.prefix}${parsed.num + i}${parsed.suffix}`,
  );
}

interface PreviewNode extends TreeOption {
  label: string;
  key: string;
  children?: PreviewNode[];
}

const previewTree = computed<PreviewNode[]>(() => {
  const validLevels = levels.value.filter(
    (l) => l.template.trim() && l.count > 0,
  );
  if (validLevels.length === 0) return [];

  function buildTree(
    levelIndex: number,
    parentName: string,
  ): PreviewNode[] {
    if (levelIndex >= validLevels.length) return [];
    const level = validLevels[levelIndex]!;
    const names = generateNames(level.template, level.count);
    return names.map((name, i) => {
      const fullName =
        concatParent.value && parentName
          ? `${parentName}${concatSeparator.value}${name}`
          : name;
      const children = buildTree(levelIndex + 1, fullName);
      return {
        label: fullName,
        key: `${levelIndex}_${i}_${fullName}`,
        children: children.length > 0 ? children : undefined,
      };
    });
  }

  return buildTree(0, '');
});

const totalCount = computed(() => {
  function count(nodes: PreviewNode[]): number {
    return nodes.reduce(
      (acc, n) => acc + 1 + (n.children ? count(n.children) : 0),
      0,
    );
  }
  return count(previewTree.value);
});

function addLevel() {
  if (levels.value.length >= 5) {
    message.warning($t('orgIotClient.deviceSpace.maxLevels'));
    return;
  }
  levels.value.push({ template: '', count: 3 });
}

function removeLevel(index: number) {
  if (levels.value.length > 1) {
    levels.value.splice(index, 1);
  }
}

const [Modal, modalApi] = useVbenModal({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      levels.value = [{ template: '', count: 3 }];
      concatParent.value = false;
      concatSeparator.value = '';
      creating.value = false;
    }
  },
});

async function onSubmit() {
  if (totalCount.value === 0) {
    message.warning($t('orgIotClient.deviceSpace.sampleNameRequired'));
    return;
  }

  creating.value = true;
  modalApi.lock();

  try {
    let createdCount = 0;

    async function createNodes(
      nodes: PreviewNode[],
      parentID?: string,
    ) {
      for (const node of nodes) {
        const res = await Api.create({
          name: node.label,
          parentID,
        } as any);
        createdCount++;
        const newID = (res as any)?.id;
        if (node.children && newID) {
          await createNodes(node.children, newID);
        }
      }
    }

    await createNodes(previewTree.value);
    message.success($t('orgIotClient.deviceSpace.createdGroupCount', { count: createdCount }));
    modalApi.close();
    emit('success');
  } catch (err: any) {
    notifyRequestError(err, () => err?.message || $t('orgIotClient.deviceSpace.batchCreateFailed'), (text) => message.error(text));
  } finally {
    creating.value = false;
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal class="w-[640px]" :title="$t('orgIotClient.deviceSpace.batchCreateGroupTitle')">
    <div class="mx-4 space-y-4">
      <div class="mb-2 text-xs text-gray-400">
        {{ $t('orgIotClient.deviceSpace.batchCreateGroupHint') }}
      </div>

      <!-- Level configs -->
      <div
        v-for="(level, index) in levels"
        :key="index"
        class="flex items-center gap-3"
      >
        <span class="w-16 flex-shrink-0 text-sm">{{ $t('orgIotClient.deviceSpace.levelN', { index: index + 1 }) }}</span>
        <NInput
          v-model:value="level.template"
          :placeholder="$t('orgIotClient.deviceSpace.sampleNamePlaceholder')"
          style="flex: 1"
        />
        <span class="text-xs text-gray-400">×</span>
        <NInputNumber
          v-model:value="level.count"
          :min="1"
          :max="99"
          style="width: 90px"
        />
        <NButton
          v-if="levels.length > 1"
          size="small"
          quaternary
          type="error"
          @click="removeLevel(index)"
        >
          <span class="icon-[mdi--minus-circle] size-4" />
        </NButton>
      </div>

      <div class="flex items-center gap-3">
        <NButton size="small" dashed @click="addLevel">
          <span class="icon-[mdi--plus] mr-1 size-4" />
          {{ $t('orgIotClient.deviceSpace.addChildLevel') }}
        </NButton>
        <label v-if="levels.length > 1" class="flex cursor-pointer items-center gap-1 text-xs text-gray-500">
          <input v-model="concatParent" type="checkbox" />
          {{ $t('orgIotClient.deviceSpace.concatParent') }}
        </label>
        <NInput
          v-if="concatParent && levels.length > 1"
          v-model:value="concatSeparator"
          :placeholder="$t('orgIotClient.deviceSpace.separatorPlaceholder')"
          style="width: 70px"
          size="small"
        />
      </div>

      <!-- Preview -->
      <NDivider v-if="previewTree.length > 0">
        {{ $t('orgIotClient.deviceSpace.previewGroup', { count: totalCount }) }}
      </NDivider>
      <NTree
        v-if="previewTree.length > 0"
        :data="previewTree"
        :selectable="false"
        default-expand-all
        block-line
        style="max-height: 300px; overflow: auto"
      />

      <div v-if="creating" class="text-center text-sm text-gray-500">
        {{ $t('orgIotClient.deviceSpace.creatingGroupHint') }}
      </div>
    </div>
  </Modal>
</template>
