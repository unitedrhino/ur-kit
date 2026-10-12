<script setup lang="ts">
import { $t } from '@vben/locales';
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { NCard, NConfigProvider, NButton, NFlex, useMessage } from 'naive-ui';
import { preferences } from '@vben/preferences';
import { zhCN, enUS, ProForm, ProInput, ProTextarea, createProForm } from 'pro-naive-ui';

import type { If, When, Then, WhenRange, Action } from './scene-types';

import FormIf from './modules/form_if.vue';
import FormThen from './modules/form_then.vue';
import FormWhen from './modules/form_when.vue';

import { Api } from './index.api';
import { sceneText } from './locales';

export type SceneInfoWithTypedFields = {
  name?: string;
  desc?: string;
  if?: If;
  when?: When;
  then?: Then;
};

const props = withDefaults(
  defineProps<{
    sceneType?: string;
    listRoute?: string;
    createTitle?: string;
    editTitle?: string;
    description?: string;
  }>(),
  {
    sceneType: 'auto',
    listRoute: '/iot/scene',
    createTitle: 'orgIotClient.energyDashboard.addScene',
    editTitle: 'orgIotClient.energyDashboard.editScene',
    description:
      'orgEnergy.ui.oneClickSceneCanBatchControlMultipleDevicesInThe_ab6ce1',
  },
);

const tokenLocale = computed(() =>
  preferences.app.locale === 'zh-CN' ? zhCN : enUS,
);

const message = useMessage();
const router = useRouter();
const { closeCurrentTab, setTabTitle } = useTabs();

const form = createProForm<SceneInfoWithTypedFields>({
  onSubmit: handleSubmit,
  initialValues: {
    then: {
      actions: [
        {
          type: 'delay',
          delay: 0,
        } as Action,
      ],
    },
  },
});

function timeToSeconds(time: number) {
  if (!time) return 0;
  return (
    new Date(time).getHours() * 3600 +
    new Date(time).getMinutes() * 60 +
    new Date(time).getSeconds()
  );
}

function formatDateToYMD(dateValue: number | string): string {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function processWhenRanges(ranges?: WhenRange[]) {
  ranges?.forEach((item: WhenRange) => {
    if (item.type === 'date') {
      if (item.dateRange?.type === 'customRange') {
        const startDate = item.dateRange.startDate || 0;
        const endDate = item.dateRange.endDate || 0;
        item.dateRange.startDate = formatDateToYMD(startDate);
        item.dateRange.endDate = formatDateToYMD(endDate);
      }
    }
    if (item.type === 'time') {
      if (item.timeRange?.type === 'customRange') {
        const startTime = item?.timeRange?.startTime || 0;
        const endTime = item?.timeRange?.endTime || 0;
        item.timeRange.startTime =
          new Date(startTime).getHours() * 3600 +
          new Date(startTime).getMinutes() * 60 +
          new Date(startTime).getSeconds();
        item.timeRange.endTime =
          new Date(endTime).getHours() * 3600 +
          new Date(endTime).getMinutes() * 60 +
          new Date(endTime).getSeconds();
      }
    }
  });
}

function assembleDataID(parts: Record<string, string | undefined>): string {
  return [
    parts.dataID_data,
    parts.dataID_00,
    parts.dataID_00_aa,
    parts.dataID_aa,
    parts.dataID_bb,
    parts.dataID_bb_cc,
  ]
    .filter((part) => part)
    .join('.');
}

function handleSubmit(values: SceneInfoWithTypedFields) {
  const values_row = JSON.stringify(values);

  // 处理触发器
  values?.if?.triggers?.forEach((item: any) => {
    if (item.type === 'timer') {
      item.timer.execAt = timeToSeconds(item.timer.execAt);
    }
    if (item.type === 'weather') {
      item.weather.values = item.weather.values.map((v: any) => String(v));
    }
    if (item.type === 'device') {
      item.device.dataID = assembleDataID(item.device);
    }
  });

  // 处理执行动作
  values?.then?.actions?.forEach((item: any) => {
    if (item.type === 'device') {
      item.device.type = 'propertyControl';
      item.device.values?.forEach((value: any) => {
        value.dataID = assembleDataID(value);
      });
    }
  });

  // 处理执行条件
  values?.when?.conditions?.terms?.forEach((item: any) => {
    if (item.columnType === 'property') {
      item.property.dataID = assembleDataID(item.property);
    }
  });

  // 处理时间范围
  processWhenRanges(values?.when?.validRanges);
  processWhenRanges(values?.when?.invalidRanges);

  const editId = router.currentRoute.value.query.id;

  const requestData = {
    areaID: '1',
    status: 1,
    tag: 'webAdmin',
    type: props.sceneType,
    name: values.name,
    desc: values.desc,
    if: JSON.stringify(values.if),
    then: JSON.stringify(values.then),
    when: JSON.stringify(values.when),
    body: values_row,
    ...(editId && { id: Number(editId) }),
  };

  const apiCall = editId ? Api.update(requestData) : Api.create(requestData);

  apiCall.then((res: any) => {
    if (res?.code === 200) {
      message.success(editId ? $t('scene.ui.sceneUpdateSuccessful') : $t('scene.ui.addedSceneSuccessfully'));
      router.push(props.listRoute);
      closeCurrentTab();
    } else {
      message.error(res?.msg);
    }
  });
}

const isEditing = ref(false);
const title = computed(() => sceneText(isEditing.value ? props.editTitle : props.createTitle));
watch(title, (value) => {
  if (isEditing.value) setTabTitle(value);
});

onMounted(async () => {
  const id = router.currentRoute.value.query.id;
  if (id) {
    isEditing.value = true;
    const sceneInfo = await Api.read(String(id));
    if (sceneInfo) {
      const body = JSON.parse(sceneInfo.body || '{}');
      form.values.value = body;
    }
  }
});
</script>

<template>
  <Page
    :title="title"
    :description="sceneText(props.description)"
  >
    <NCard>
      <NConfigProvider :locale="tokenLocale">
        <ProForm :form="form">
          <ProInput
            :title="$t('orgEnergy.ui.sceneName')"
            path="name"
            style="width: 280px"
            required
          />

          <FormIf />
          <FormThen />
          <FormWhen />

          <ProTextarea :title="$t('orgEnergy.ui.sceneDescription')" path="desc" />

          <NFlex justify="end" gap="10px">
            <NButton attr-type="reset">{{ $t('orgIotClient.console.reset') }}</NButton>
            <NButton type="primary" attr-type="submit">{{ $t('iotApp.card.submit') }}</NButton>
          </NFlex>
        </ProForm>
      </NConfigProvider>
    </NCard>
  </Page>
</template>
