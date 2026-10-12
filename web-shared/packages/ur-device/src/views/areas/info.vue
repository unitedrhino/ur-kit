<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { ref, onMounted, computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ThingsApi } from '@vben/api';

import * as z from 'zod';

import { NCard, NTabs, NTabPane, NDynamicTags, NInput, NButton, useMessage } from 'naive-ui';

import Descriptions from './descriptions.vue';
import Position from './position.vue';

import { useDeviceForm } from '../devices/form';
import DeviceGrid from '../devices/DeviceGrid.vue';

// @ts-ignore
import { get } from 'lodash';

const deviceGridRef = ref();
const { QueryForm, queryFormApi } = useDeviceForm({
  onSubmit: (values) => {
    deviceGridRef.value?.updateQueryParams(values);
  },
});

const message = useMessage();

const router = useRouter();
const route = useRoute();

const parsed = z.string().safeParse(route.params.id);
if (!parsed.success) {
  router.replace({ name: 'FallbackNotFound' });
}
const id = parsed.data || '';

const areaInfo = ref<ThingsApi.AreaInfo>({});

onMounted(async () => {
  console.log('onMounted ----');
  try {
    const res = await ThingsApi.postApiV1ThingsAreaInfoGetOne({ areaID: id, withChildren: true });
    areaInfo.value = res;
  } catch (e) {
    console.log('e ----', e);
  }

  const state = await queryFormApi.getState();
  console.log('state ----', state);

  // queryFormApi.setValues({
  //   node_type: "area",
  //   node_area: "1837831740502016000",
  // });

  // queryFormApi.setFieldValue("node_area", {
  //   key: "1837831740502016000",
  //   label: "应用截面",
  // });
  // queryFormApi.setFieldValue("node_area", "1837831740502016000");

  queryFormApi.removeSchemaByFields(['node_type', 'node_area']);

  queryFormApi.updateSchema([
    {
      component: 'Select',
      fieldName: 'node_type',
      label: '节点类型',
      disabled: true,
    },
    {
      component: 'ApiTreeSelect',
      fieldName: 'node_area',
      label: '节点选择',
      disabled: true,
    },
  ]);
});

const tags = ref<string[]>(['配点1', '配点2', '配点3']);
watchEffect(() => {
  if (areaInfo?.value?.tags) {
    tags.value = Object.keys(areaInfo.value.tags);
  }
  //  return tags.value;
});

function onCreate(label: string) {
  console.log('onCreate ----', label);
  ThingsApi.postApiV1ThingsAreaInfoUpdate({
    projectID: areaInfo.value.projectID,
    areaID: areaInfo.value.areaID,
    tags: {
      ...areaInfo.value.tags,
      [label]: '22',
    },
  });
  return label;
}

function onUpdateValue(value: string[]) {
  console.log('onUpdateValue ----', value);
}

const isNeedUpdateDesc = ref(false);
function onUpdateDesc(desc: string) {
  areaInfo.value.desc = desc;
  isNeedUpdateDesc.value = true;
}

function updateDesc() {
  ThingsApi.postApiV1ThingsAreaInfoUpdate({
    projectID: areaInfo.value.projectID,
    areaID: areaInfo.value.areaID,
    desc: areaInfo.value.desc,
  }).then(() => {
    isNeedUpdateDesc.value = false;
    message.success('更新成功');
  });
}
</script>

<template>
  <Page
    :title="areaInfo?.areaName"
    auto-content-height
    :description="`创建时间: ${new Date(Number(areaInfo?.createdTime || '0')).toLocaleString()} ` + (areaInfo?.desc ? `|描述: ${areaInfo?.desc}` : '')"
  >
    <!-- <NCard title="区域具体名称" :bordered="false"> -->
    <NTabs type="line" animated>
      <NTabPane name="areaInfo" tab="区域信息" title="区域信息">
        <Descriptions :data="areaInfo" />
      </NTabPane>
      <NTabPane name="device" tab="设备" title="设备">
        <NCard>
          <QueryForm />
        </NCard>
        <NCard class="mt-5">
          <DeviceGrid ref="deviceGridRef" />
        </NCard>
      </NTabPane>
      <NTabPane name="location" tab="位置" title="位置">
        <Position />
      </NTabPane>
      <!-- <NTabPane name="map" tab="平面图" title="平面图">
          <div>平面图</div>
        </NTabPane> -->
      <!-- <NTabPane name="tag" tab="标签" title="标签">
           <NCard>
            <NDynamicTags v-model:value="tags" @create="onCreate" v-on:update-value="onUpdateValue" />
           </NCard>
        </NTabPane> -->
      <NTabPane name="remark" tab="备注" title="备注">
        <NCard>
          <div class="flex flex-col gap-2">
            <NInput type="textarea" maxlength="200" :rows="3" show-count :defaultValue="areaInfo.desc" @update:value="onUpdateDesc" />
            <div class="flex justify-end">
              <NButton type="primary" @click="updateDesc" :disabled="!isNeedUpdateDesc">更新</NButton>
            </div>
          </div>
        </NCard>
      </NTabPane>
    </NTabs>
    <!-- </NCard> -->
  </Page>
</template>

<style scoped></style>
