<script lang="ts" setup>
import { NDescriptions, NDescriptionsItem } from 'naive-ui';

import { CoreApi } from '@vben/api';

defineProps<{
  data: CoreApi.AreaInfo;
}>();
</script>

<template>
  <NDescriptions bordered>
    <NDescriptionsItem label="创建时间"> {{ data.createdTime ? new Date(Number(data.createdTime)).toLocaleString() : '' }} </NDescriptionsItem>
    <NDescriptionsItem label="项目ID"> {{ data.projectID }} </NDescriptionsItem>
    <NDescriptionsItem label="项目区域ID"> {{ data.areaID }} </NDescriptionsItem>
    <NDescriptionsItem label="项目区域名称"> {{ data.areaName }} </NDescriptionsItem>
    <NDescriptionsItem label="下级的数量统计"> {{ data.lowerLevelCount }} </NDescriptionsItem>
    <NDescriptionsItem label="设备数量统计"> {{ data.deviceCount }} </NDescriptionsItem>
    <NDescriptionsItem label="分组数量统计"> {{ data.groupCount }} </NDescriptionsItem>
    <NDescriptionsItem label="用途"> {{ data.useBy }} </NDescriptionsItem>
    <NDescriptionsItem label="是否是子节点"> {{ data.isLeaf }} </NDescriptionsItem>
    <!-- <NDescriptionsItem label="是否是系统创建的"> {{ data.isSysCreated }} </NDescriptionsItem> -->
    <!-- <NDescriptionsItem label="区域配置文件"> {{ data.configFile }} </NDescriptionsItem> -->
    <!-- <NDescriptionsItem label="区域图片"> {{ data.areaImg }} </NDescriptionsItem> -->
    <!-- <NDescriptionsItem label="区域备注"> {{ data.desc }} </NDescriptionsItem> -->
  </NDescriptions>
</template>
