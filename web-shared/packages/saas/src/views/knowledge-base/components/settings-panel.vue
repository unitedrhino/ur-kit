<!-- 文件说明：知识库设置面板，基本信息维护与删除知识库危险操作；平台共享库只读展示。 -->
<script setup lang="ts">
import { $t } from '../../../locales';
import type { KnowledgeItem } from '../data';

import { ref, watch } from 'vue';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@unitedrhino/saas-ui/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { LoaderCircle, Trash2 } from 'lucide-vue-next';

import { Api } from '../index.api';
import { getErrorMessage } from '../workbench';

const props = withDefaults(defineProps<Props>(), {
  canWrite: false,
  knowledge: null,
});

/** 组件负责表单提交与删除确认；跳转列表、刷新知识库信息由工作台在事件后统一处理。 */
const emit = defineEmits<{
  /** 删除知识库成功，工作台据此返回列表页。 */
  deleted: [];
  /** 保存或删除失败时上抛错误文案，由工作台写入头部错误条。 */
  error: [message: string];
  /** 基本信息保存成功，工作台据此刷新知识库信息。 */
  saved: [];
}>();

interface Props {
  /** 是否允许编辑与删除；平台共享库在租户端只读。 */
  canWrite?: boolean;
  /** 当前知识库信息，只读展示与表单回填来源。 */
  knowledge?: KnowledgeItem | null;
}

const settingsSaving = ref(false);
const settingsForm = ref({ desc: '', name: '' });
const confirmDeleteOpen = ref(false);
const deleteLoading = ref(false);

watch(
  () => props.knowledge,
  (knowledge) => {
    settingsForm.value = { desc: knowledge?.desc || '', name: knowledge?.name || '' };
  },
  { immediate: true },
);

/** saveSettings 保存基本信息后通知工作台刷新当前详情。 */
async function saveSettings() {
  if (!props.knowledge?.id || !settingsForm.value.name.trim() || !props.canWrite) return;
  settingsSaving.value = true;
  try {
    await Api.update({ id: props.knowledge.id, name: settingsForm.value.name.trim(), desc: settingsForm.value.desc.trim() });
    emit('saved');
  } catch (error) {
    emit('error', getErrorMessage(error, $t('knowledgeBase.text_8878363b46a4')));
  } finally {
    settingsSaving.value = false;
  }
}

/** confirmDeleteKnowledge 删除当前知识库，跳转由工作台处理。 */
async function confirmDeleteKnowledge() {
  if (!props.knowledge?.id || !props.canWrite) return;
  deleteLoading.value = true;
  try {
    await Api.delete(props.knowledge.id);
    confirmDeleteOpen.value = false;
    emit('deleted');
  } catch (error) {
    emit('error', getErrorMessage(error, $t('knowledgeBase.text_8d54e04395da')));
  } finally {
    deleteLoading.value = false;
  }
}
</script>
<template>
  <div class="kb-settings mx-auto grid max-w-[960px] gap-4 pb-4">
    <Card class="kb-panel rounded-lg shadow-sm">
      <CardHeader class="px-4 pb-4 pt-4">
        <CardTitle class="text-base">{{ canWrite ? $t('knowledgeBase.text_b122f813d551') : $t('knowledgeBase.text_ed8e3d3e7688') }}</CardTitle>
        <p class="text-muted-foreground text-sm">
          {{ canWrite ? $t('knowledgeBase.text_409082a14a15') : $t('knowledgeBase.text_61fd7b7aaeeb') }}
        </p>
      </CardHeader>
      <CardContent class="space-y-4 px-4 pb-4 pt-0">
        <template v-if="canWrite">
          <div class="space-y-2">
            <label for="workbench-knowledge-name" class="text-sm font-medium">{{ $t('knowledgeBase.text_1be7ae4fc257') }}</label>
            <Input id="workbench-knowledge-name" v-model="settingsForm.name" class="h-9" maxlength="128" />
          </div>
          <div class="space-y-2">
            <label for="workbench-knowledge-desc" class="text-sm font-medium">{{ $t('knowledgeBase.text_412f54dc38e6') }}</label>
            <Textarea id="workbench-knowledge-desc" v-model="settingsForm.desc" rows="4" />
          </div>
        </template>
        <dl v-else class="space-y-4 text-sm">
          <div class="space-y-2">
            <dt class="text-muted-foreground">{{ $t('knowledgeBase.text_1be7ae4fc257') }}</dt>
            <dd class="break-words font-medium">{{ knowledge?.name || '—' }}</dd>
          </div>
          <div class="space-y-2">
            <dt class="text-muted-foreground">{{ $t('knowledgeBase.text_412f54dc38e6') }}</dt>
            <dd class="whitespace-pre-wrap break-words leading-6">{{ knowledge?.desc || $t('knowledgeBase.text_4b64e784af01') }}</dd>
          </div>
        </dl>
        <div class="grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
          <div>
            <span class="text-muted-foreground">{{ $t('knowledgeBase.text_97ec39f78466') }}</span>
            {{ knowledge?.scope === 'platform' ? $t('knowledgeBase.text_b085853c0caf') : $t('knowledgeBase.text_8c05bb948d46') }}
          </div>
        </div>
        <div v-if="canWrite" class="flex justify-end border-t pt-4">
          <Button :disabled="settingsSaving" @click="saveSettings" class="kb-control">
            <LoaderCircle v-if="settingsSaving" class="size-4 animate-spin" /> {{ $t('knowledgeBase.text_bb79ec7c152f') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card v-if="canWrite" class="kb-panel border-destructive/30 rounded-lg shadow-sm">
      <CardHeader class="px-4 pb-4 pt-4"
        ><CardTitle class="text-destructive text-base">{{ $t('knowledgeBase.text_fcfcc873ed3c') }}</CardTitle></CardHeader
      >
      <CardContent class="flex flex-wrap items-center justify-between gap-4 px-4 pb-4 pt-0">
        <div>
          <div class="text-sm font-medium">{{ $t('knowledgeBase.text_e62a78b1a7a8') }}</div>
          <div class="text-muted-foreground mt-1 text-sm">{{ $t('knowledgeBase.text_0c5a5f142a97') }}</div>
        </div>
        <Button variant="destructive" @click="confirmDeleteOpen = true" class="kb-control">
          <Trash2 class="size-4" /> {{ $t('knowledgeBase.text_e62a78b1a7a8') }}
        </Button>
      </CardContent>
    </Card>

    <Dialog :open="confirmDeleteOpen" @update:open="confirmDeleteOpen = $event">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('knowledgeBase.text_e62a78b1a7a8') }}</DialogTitle>
          <DialogDescription>{{ $t('knowledgeBase.confirmKnowledgeSettingsDelete', { name: knowledge?.name || '' }) }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmDeleteOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
          <Button variant="destructive" :disabled="deleteLoading" @click="confirmDeleteKnowledge" class="kb-control">{{
            $t('knowledgeBase.text_3c06abe11651')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
