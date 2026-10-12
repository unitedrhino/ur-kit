/** 文件说明：项目创建与编辑弹窗，展示随当前语言切换的字段和操作反馈。 */
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { ThingsApi } from '@vben/api';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { useProjectStore } from '@vben/stores';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@unitedrhino/saas-ui';
import { useClipboard } from '@vueuse/core';

import { useToast } from '../hooks/use-toast';

defineOptions({
  name: 'ProjectFormDrawer',
});

const props = defineProps<{
  /** 编辑时传入已有项目数据，创建时不传 */
  project?: null | ThingsApi.ProjectInfo;
  /** 必须创建才能关闭（用于 0 项目强制引导场景） */
  required?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [projectID: string];
}>();

const show = defineModel<boolean>('show', { default: false });

// t 依赖当前语言设置，使弹窗和地图中的文案在切换语言后重新渲染。
function t(key: string): string {
  void preferences.app.locale;
  return $t(key);
}

const projectStore = useProjectStore();
const { toast } = useToast();
const { copy } = useClipboard({ legacy: true });

type ProjectInfoWithLegacySysFlag = ThingsApi.ProjectInfo & {
  isSysCreate?: unknown;
};

const loading = ref(false);
const nameError = ref('');

const formData = ref<{
  address: string;
  area: string;
  desc: string;
  ppsm: string;
  projectName: string;
  status: string;
  type: string;
}>({
  projectName: '',
  type: '',
  address: '',
  desc: '',
  area: '',
  ppsm: '',
  status: '1',
});

const isEdit = ref(false);

const isSystemProject = computed(() => {
  const project = props.project as null | ProjectInfoWithLegacySysFlag | undefined;
  const flag = project?.isSysCreated ?? project?.isSysCreate;
  return flag === true || flag === 1 || flag === '1' || flag === 'true';
});

// 状态选项保留后端数值，显示文案在渲染时按当前语言读取。
const statusOptions = [
  { labelKey: 'normal', value: '1' },
  { labelKey: 'disabled', value: '2' },
  { labelKey: 'expired', value: '3' },
];

watch(show, (val) => {
  nameError.value = '';
  if (val) {
    if (props.project?.projectID) {
      isEdit.value = true;
      formData.value = {
        projectName: props.project.projectName || '',
        type: props.project.type || '',
        address: props.project.address || '',
        desc: props.project.desc || '',
        area: props.project.area === null || props.project.area === undefined ? '' : String(props.project.area),
        ppsm: props.project.ppsm === null || props.project.ppsm === undefined ? '' : String(props.project.ppsm),
        status: String(props.project.status ?? 1),
      };
    } else {
      isEdit.value = false;
      formData.value = {
        projectName: '',
        type: '',
        address: '',
        desc: '',
        area: '',
        ppsm: '',
        status: '1',
      };
    }
  }
});

function validate(): boolean {
  if (!formData.value.projectName.trim()) {
    nameError.value = t('iotApp.projectForm.enterName');
    return false;
  }
  nameError.value = '';
  return true;
}

function parseNum(val: string): number | undefined {
  if (!val.trim()) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

// copyProjectID 复制编辑态项目ID，legacy 模式兼容 HTTP 调试环境。
async function copyProjectID() {
  const projectID = props.project?.projectID;
  if (!projectID) return;
  try {
    await copy(projectID);
    toast({
      title: t('iotApp.projectForm.idCopied'),
      duration: 2000,
      type: 'success',
    });
  } catch (requestError) {
    notifyRequestError(requestError, () => t('iotApp.projectForm.copyFailed'), (text) => toast({ description: t('iotApp.projectForm.copyManually'), duration: 3000, type: 'error', title: text }));
  }
}

async function handleSubmit() {
  if (!validate()) return;

  loading.value = true;
  try {
    const payload = {
      projectName: formData.value.projectName,
      type: formData.value.type || undefined,
      address: formData.value.address || undefined,
      desc: formData.value.desc || undefined,
      area: parseNum(formData.value.area),
      ppsm: parseNum(formData.value.ppsm),
      status: Number(formData.value.status),
    };

    if (isEdit.value && props.project?.projectID) {
      await projectStore.updateProject({
        ...props.project,
        ...payload,
      });
      await projectStore.getProjects();
      emit('saved', props.project.projectID);
    } else {
      await projectStore.createProject(payload);
      await projectStore.getProjects();
      const newProject = projectStore.projects.find((p) => p.projectName === formData.value.projectName);
      if (newProject?.projectID) {
        projectStore.setCurrentProjectID(newProject.projectID);
        emit('saved', newProject.projectID);
      }
    }
    show.value = false;
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  if (props.required) return;
  show.value = false;
  emit('close');
}
</script>

<template>
  <Dialog
    :open="show"
    @update:open="
      (v: boolean) => {
        if (!v) handleClose();
        else show = true;
      }
    "
  >
    <DialogContent
      class="w-[calc(100vw-2rem)] max-w-[480px] sm:rounded-lg"
      :class="required ? '[&>button:last-child]:hidden' : ''"
      @escape-key-down="(e: Event) => required && e.preventDefault()"
      @pointer-down-outside="(e: Event) => required && e.preventDefault()"
      @interact-outside="(e: Event) => required && e.preventDefault()"
    >
      <DialogHeader>
        <DialogTitle>{{ isEdit ? t('iotApp.projectForm.editTitle') : t('iotApp.projectForm.createTitle') }}</DialogTitle>
        <DialogDescription>
          {{ isEdit ? t('iotApp.projectForm.editDescription') : t('iotApp.projectForm.createDescription') }}
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="max-h-[60vh]">
        <div class="space-y-4 px-1 py-4">
          <div v-if="isEdit && isSystemProject" class="border-border bg-muted/60 text-muted-foreground rounded-md border px-3 py-2 text-sm leading-5">
            <div class="text-foreground mb-0.5 flex items-center gap-2 font-medium">
              <span class="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[11px] leading-none"> {{ t('iotApp.projectForm.system') }} </span>
              {{ t('iotApp.projectForm.systemCreated') }}
            </div>
            <p>{{ t('iotApp.projectForm.systemNotice') }}</p>
          </div>

          <!-- 编辑态项目ID：只读展示并支持 HTTP 环境复制 -->
          <div v-if="isEdit && props.project?.projectID" class="space-y-2">
            <Label for="projectID" class="text-sm font-medium">{{ t('iotApp.projectForm.projectId') }}</Label>
            <div class="flex gap-2">
              <Input id="projectID" :model-value="props.project.projectID" class="font-mono text-xs" readonly />
              <Button
                :aria-label="t('iotApp.projectForm.copyId')"
                class="size-10 shrink-0 px-0"
                data-test="copy-project-id"
                :title="t('iotApp.projectForm.copyId')"
                type="button"
                variant="outline"
                @click="copyProjectID"
              >
                <IconifyIcon icon="carbon:copy" class="size-4" />
              </Button>
            </div>
          </div>

          <!-- 项目名称 -->
          <div class="space-y-2">
            <Label for="projectName" class="text-sm font-medium"> {{ t('iotApp.projectForm.projectName') }} <span class="text-destructive">*</span> </Label>
            <Input
              id="projectName"
              v-model="formData.projectName"
              :placeholder="t('iotApp.projectForm.enterName')"
              :class="nameError ? 'border-destructive' : ''"
              @input="nameError = ''"
            />
            <p v-if="nameError" class="text-destructive text-xs">
              {{ nameError }}
            </p>
          </div>

          <!-- 两列布局：类型 + 状态 -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="projectType" class="text-sm font-medium">{{ t('iotApp.projectForm.projectType') }}</Label>
              <Input id="projectType" v-model="formData.type" :placeholder="t('iotApp.projectForm.typeExample')" />
            </div>
            <div class="space-y-2">
              <Label class="text-sm font-medium">{{ t('iotApp.projectForm.projectStatus') }}</Label>
              <Select v-model="formData.status">
                <SelectTrigger>
                  <SelectValue :placeholder="t('iotApp.projectForm.select')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ t(`iotApp.projectForm.${opt.labelKey}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- 项目地址 -->
          <div class="space-y-2">
            <Label for="address" class="text-sm font-medium">{{ t('iotApp.projectForm.projectAddress') }}</Label>
            <Input id="address" v-model="formData.address" :placeholder="t('iotApp.projectForm.enterAddress')" />
          </div>

          <!-- 两列布局：面积 + 功耗 -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="area" class="text-sm font-medium">{{ t('iotApp.projectForm.buildingArea') }}</Label>
              <Input id="area" v-model="formData.area" type="number" :placeholder="t('iotApp.projectForm.enter')" min="0" />
            </div>
            <div class="space-y-2">
              <Label for="ppsm" class="text-sm font-medium">{{ t('iotApp.projectForm.powerPerArea') }}</Label>
              <Input id="ppsm" v-model="formData.ppsm" type="number" :placeholder="t('iotApp.projectForm.enter')" min="0" />
            </div>
          </div>

          <!-- 项目备注 -->
          <div class="space-y-2">
            <Label for="desc" class="text-sm font-medium">{{ t('iotApp.projectForm.remarks') }}</Label>
            <Textarea id="desc" v-model="formData.desc" :placeholder="t('iotApp.projectForm.enterRemarks')" rows="3" />
          </div>
        </div>
      </ScrollArea>

      <DialogFooter class="gap-2">
        <Button v-if="!required" variant="outline" @click="handleClose">{{ t('iotApp.projectForm.cancel') }}</Button>
        <Button :disabled="loading" @click="handleSubmit">
          <span v-if="loading" class="mr-1 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          {{ isEdit ? t('iotApp.projectForm.save') : t('iotApp.projectForm.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
