<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import type { GroupInfo } from '../shared/group.api';
import type { DatasetInfo } from './index.api';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpace, NSwitch, useMessage } from 'naive-ui';

import { getErrorMessage, getFriendlyErrorMessage, logError } from '../../../shared/error';
import { DataSourceApi } from '../datasource/index.api';
import { GroupApi } from '../shared/group.api';
import DataPreviewDrawer from './components/DataPreviewDrawer.vue';
import DynamicParamsBuilder from './components/DynamicParamsBuilder.vue';
import ConfigHttp from './configs/config-http.vue';
import ConfigIot from './configs/config-iot.vue';
import ConfigJs from './configs/config-js.vue';
import ConfigJson from './configs/config-json.vue';
import ConfigProcedure from './configs/config-procedure.vue';
import ConfigRaw from './configs/config-raw.vue';
import ConfigScript from './configs/config-script.vue';
import ConfigSql from './configs/config-sql.vue';
import { DatasetApi, datasetTypeOptions } from './index.api';

const route = useRoute();
const router = useRouter();
const message = useMessage();

const isEdit = ref(false);
const loading = ref(false);
const saving = ref(false);
const groups = ref<GroupInfo[]>([]);
const datasources = ref<{ label: string; url: string; value: string }[]>([]);

const form = ref<DatasetInfo>({
  name: '',
  type: 'http',
  groupId: undefined,
  sourceId: undefined,
  config: '',
  tags: '',
  desc: '',
  cacheEnabled: false,
  cacheTTL: 0,
  requestScript: '',
  responseScript: '',
  dynamicParams: '',
  outputFields: '',
  schema: '',
});

const groupOptions = ref<{ label: string; value: string }[]>([]);

async function loadGroups() {
  try {
    const res = await GroupApi.list('dataset');
    groups.value = res.list ?? [];
    groupOptions.value = groups.value.map((g) => ({
      label: g.name || '',
      value: g.id || '',
    }));
  } catch (error) {
    groups.value = [];
    groupOptions.value = [];
    message.error(t('bigscreenManagement.dynamic.failedToLoadGroups', { error: String(getErrorMessage(error)) }));
  }
}

async function loadDatasources() {
  try {
    const res = await DataSourceApi.list(1, 999, {});
    datasources.value = (res.list ?? []).map((item) => ({
      label: item.name || '',
      value: item.id || '',
      url: item.config?.url || '',
    }));
  } catch (error) {
    datasources.value = [];
    message.error(t('bigscreenManagement.dynamic.failedToLoadDataSources', { error: String(getErrorMessage(error)) }));
  }
}

async function loadData(id: string) {
  loading.value = true;
  try {
    const data = await DatasetApi.getOne(id);
    form.value = {
      ...data,
      id: data.id,
    };
    isEdit.value = true;
  } catch (error) {
    message.error(getFriendlyErrorMessage(error, t('bigscreenManagement.ui.failedLoadTryAgainLater')));
    logError('Dataset Edit Load', error);
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  if (!form.value.name?.trim()) {
    message.warning(t('bigscreenManagement.ui.enterDatasetName'));
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value && form.value.id) {
      await DatasetApi.update(form.value);
      message.success(t('orgManage.orgSettings.saveSuccess'));
    } else {
      const res = await DatasetApi.create(form.value);
      form.value.id = res.id;
      isEdit.value = true;
      message.success(t('orgManage.common.createSuccess'));
    }
  } catch (error) {
    message.error(getFriendlyErrorMessage(error, t('orgManage.role.saveRetryFailed')));
    logError('Dataset Edit Save', error);
  } finally {
    saving.value = false;
  }
}

function onBack() {
  router.push({ name: 'BigScreenDataset' });
}

const previewing = ref(false);
const previewDrawerVisible = ref(false);
const previewRows = ref<Record<string, any>[]>([]);
const previewFields = ref<string[]>([]);
const previewError = ref('');
const previewErrorDetails = ref('');

async function onPreview() {
  if (!isEdit.value || !form.value.id) {
    message.warning(t('bigscreenManagement.ui.saveDatasetBeforePreviewing'));
    return;
  }

  previewing.value = true;
  previewError.value = '';
  previewErrorDetails.value = '';

  try {
    const res = await DatasetApi.preview(form.value.id);
    previewRows.value = JSON.parse(res.rows || '[]');
    previewFields.value = JSON.parse(res.fields || '[]');
    previewDrawerVisible.value = true;
  } catch (error) {
    previewError.value = getFriendlyErrorMessage(error, t('bigscreenManagement.ui.previewFailedCheckConfigurationAndTryAgain'));
    previewErrorDetails.value = t('bigscreenManagement.ui.checkEndpointSQLParameterFormatAndDataSource');
    previewDrawerVisible.value = true;
    logError('Dataset Edit Preview', error);
  } finally {
    previewing.value = false;
  }
}

function onSaveSchema(schema: { fieldName: string; fieldType: string }[]) {
  form.value.outputFields = JSON.stringify(schema);
  message.success(t('bigscreenManagement.ui.fieldSchemaHasBeenAddedFormClickSave'));
}

onMounted(async () => {
  await Promise.all([loadGroups(), loadDatasources()]);
  const id = route.params.id as string;
  if (id) {
    await loadData(id);
  }
});
</script>

<template>
  <Page :title="isEdit ? t('bigscreenManagement.ui.editDataset') : t('bigscreenManagement.ui.createDataset')" auto-content-height>
    <template #extra>
      <NSpace>
        <NButton @click="onBack">{{ t('orgManage.common.back') }}</NButton>
        <NButton :loading="previewing" @click="onPreview">{{ t('bigscreenManagement.ui.previewData') }}</NButton>
        <NButton type="primary" :loading="saving" @click="onSave">{{ t('orgManage.common.save') }}</NButton>
      </NSpace>
    </template>

    <div v-if="loading" class="flex h-64 items-center justify-center">{{ t('orgManage.common.loading') }}</div>
    <div v-else class="dataset-edit-container relative" style="position: relative">
      <div class="space-y-4 pb-6">
        <NCard :title="t('orgManage.orgSettings.basicInfo')" size="small">
          <NForm label-placement="left" label-width="80">
            <div class="grid grid-cols-2 gap-x-6">
              <NFormItem :label="t('orgManage.agent.name')" required>
                <NInput v-model:value="form.name" :placeholder="t('bigscreenManagement.ui.datasetName')" />
              </NFormItem>
              <NFormItem :label="t('iotApp.project.tabGroups')">
                <NSelect v-model:value="form.groupId" :options="groupOptions" clearable :placeholder="t('bigscreenManagement.ui.selectGroup')" />
              </NFormItem>
              <NFormItem v-if="form.type !== 'http'" :label="t('bigscreenManagement.ui.linkedDataSource')">
                <NSelect v-model:value="form.sourceId" :options="datasources" clearable :placeholder="t('bigscreenManagement.ui.selectDataSourceOptional')" />
              </NFormItem>
              <NFormItem :label="t('iotApp.productPage.tags')">
                <NInput v-model:value="form.tags" :placeholder="t('bigscreenManagement.ui.separateMultipleTagsCommas')" />
              </NFormItem>
              <NFormItem :label="t('orgManage.dept.desc')" class="col-span-2">
                <NInput v-model:value="form.desc" :placeholder="t('bigscreenManagement.ui.notes')" />
              </NFormItem>
            </div>
          </NForm>
        </NCard>

        <NCard :title="t('bigscreenManagement.ui.dataSettings')" size="small">
          <NForm label-placement="left" label-width="100">
            <NFormItem :label="t('bigscreenManagement.ui.datasetType')" required>
              <NSelect v-model:value="form.type" :options="datasetTypeOptions" :placeholder="t('bigscreenManagement.ui.selectDatasetType')" />
            </NFormItem>
          </NForm>
          <div class="mt-4">
            <ConfigHttp v-if="form.type === 'http'" v-model:config="form.config!" v-model:source-id="form.sourceId" :datasources="datasources" />
            <ConfigJson v-else-if="form.type === 'json'" v-model:config="form.config!" />
            <ConfigSql v-else-if="form.type === 'sql'" v-model:config="form.config!" :datasources="datasources" />
            <ConfigRaw v-else-if="form.type === 'raw'" v-model:config="form.config!" :datasources="datasources" />
            <ConfigProcedure v-else-if="form.type === 'procedure'" v-model:config="form.config!" :datasources="datasources" />
            <ConfigJs v-else-if="form.type === 'js'" v-model:config="form.config!" />
            <ConfigScript v-else-if="form.type === 'script'" v-model:config="form.config!" />
            <ConfigIot v-else-if="form.type === 'iot'" v-model:config="form.config!" />
          </div>
        </NCard>

        <NCard :title="t('bigscreenManagement.ui.advancedSettings')" size="small">
          <NForm label-placement="left" label-width="100">
            <div class="grid grid-cols-2 gap-x-6">
              <NFormItem :label="t('bigscreenManagement.ui.enableCache')">
                <NSwitch v-model:value="form.cacheEnabled" />
              </NFormItem>
              <NFormItem v-if="form.cacheEnabled" :label="t('bigscreenManagement.ui.cacheDurationSeconds')">
                <NInputNumber v-model:value="form.cacheTTL" :min="0" :placeholder="t('bigscreenManagement.ui.cacheTTL')" />
              </NFormItem>
            </div>
            <NFormItem :label="t('bigscreenManagement.ui.dynamicParameters')">
              <DynamicParamsBuilder v-model:value="form.dynamicParams!" />
            </NFormItem>
            <NFormItem :label="t('bigscreenManagement.ui.preRequestScript')">
              <NInput v-model:value="form.requestScript" type="textarea" :rows="4" :placeholder="t('bigscreenManagement.ui.javascriptExecutedBeforeRequestPhase3')" />
            </NFormItem>
            <NFormItem :label="t('bigscreenManagement.ui.postResponseScript')">
              <NInput v-model:value="form.responseScript" type="textarea" :rows="4" :placeholder="t('bigscreenManagement.ui.javascriptExecutedAfterResponsePhase3')" />
            </NFormItem>
          </NForm>
        </NCard>
      </div>
    </div>

    <DataPreviewDrawer
      v-model:show="previewDrawerVisible"
      :loading="previewing"
      :error="previewError"
      :error-details="previewErrorDetails"
      :rows="previewRows"
      :fields="previewFields"
      to=".dataset-edit-container"
      @save-schema="onSaveSchema"
    />
  </Page>
</template>
