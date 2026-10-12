<script lang="ts" setup>
import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { NCard, NGrid, NGridItem, NTag, NButton, NPagination } from 'naive-ui';
import { useRouter } from 'vue-router';
import { getDeviceStatusInfo, getDeviceStatusLabel, getDevicesList } from './device_helpers';

const router = useRouter();

const queryParams = ref<Record<string, any>>({});
const message = useMessage();

// 卡片视图的数据和分页
const cardData = ref<any[]>([]);
const cardPagination = ref({
  page: 1,
  pageSize: 12,
  total: 0,
});

// 加载卡片数据
async function loadCardData(_queryParams: Record<string, any>) {
  queryParams.value = _queryParams;
  try {
    const result = await getDevicesList(cardPagination.value.page, cardPagination.value.pageSize, queryParams.value);
    cardData.value = result.list || [];
    cardPagination.value.total = result.total || 0;
  } catch (error) {
    message.error('加载数据失败', error as any);
  }
}

// 处理卡片分页变化
function handleCardPageChange(page: number) {
  cardPagination.value.page = page;
  loadCardData(queryParams.value);
}

// 处理页面大小变化
function handlePageSizeChange(pageSize: number) {
  cardPagination.value.pageSize = pageSize;
  cardPagination.value.page = 1;
  loadCardData(queryParams.value);
}

// 暴露方法给父组件调用
defineExpose({
  loadCardData,
});

// 组件挂载时加载数据
loadCardData(queryParams.value);

function handleDetail(device: any) {
  router.push({
    name: 'DevicesDetail',
    query: { deviceName: device.deviceName, productID: device.productID },
  });
}
</script>

<template>
  <div class="py-4">
    <NGrid :cols="'1 s:1 m:2 l:3 xl:3 2xl:3'" :x-gap="16" :y-gap="16" responsive="screen">
      <NGridItem v-for="device in cardData" :key="device.deviceName" span="1">
        <NCard
          hoverable
          class="h-full bg-gradient-to-r from-[#ECF3FF] to-[#F7FBFE] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          size="small"
        >
          <div class="py-2">
            <div class="flex items-start gap-4">
              <!-- 左侧设备图标区域 -->
              <div class="flex h-[80px] w-[80px] flex-shrink-0 items-center justify-center bg-gradient-to-br">
                <img src="/images/default-device-logo.png" alt="设备图标" class="h-[80px] w-[80px]" />
              </div>

              <!-- 中间信息区域 -->
              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <div class="flex items-center gap-2 text-sm">
                  <span style="font-size: 16px; font-weight: 600; line-height: 22px; color: #161616">{{ device.deviceName }}</span>
                  <NTag :color="getDeviceStatusInfo(device.status)" size="small" :bordered="false">
                    {{ getDeviceStatusLabel(device.status) }}
                  </NTag>
                </div>

                <div class="flex items-center text-sm">
                  <span style="font-size: 12px; line-height: 17px; color: #8d96a2">设备ID：</span>
                  <span style="font-size: 12px; line-height: 17px; color: #161616">{{ device?.gateway?.deviceName || '-' }}</span>
                </div>
                <div class="flex items-center text-sm">
                  <span style="font-size: 12px; line-height: 17px; color: #8d96a2">设备名称：</span>
                  <span style="font-size: 12px; line-height: 17px; color: #161616">{{ device?.gateway?.deviceAlias || '-' }}</span>
                </div>
                <div class="flex items-center text-sm">
                  <span style="font-size: 12px; line-height: 17px; color: #8d96a2">网关识别号：</span>
                  <span style="font-size: 12px; line-height: 17px; color: #161616">{{ device?.gateway?.deviceName || '-' }}</span>
                </div>
                <div class="flex items-center text-sm">
                  <span style="font-size: 12px; line-height: 17px; color: #8d96a2">仪表地址：</span>
                  <span style="font-size: 12px; line-height: 17px; color: #161616">{{ device.deviceName || '-' }}</span>
                </div>
              </div>

              <!-- 右侧详情按钮 -->
              <div class="flex-shrink-0">
                <NButton
                  @click="handleDetail(device)"
                  text
                  style="
                    width: 60px;
                    height: 30px;
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 20px;
                    color: #1677ff;
                    background-color: #d9e8ff;
                    border-radius: 4px;
                  "
                >
                  详情
                </NButton>
              </div>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 卡片视图分页 -->
    <div class="mt-6 flex justify-center py-4">
      <NPagination
        v-model:page="cardPagination.page"
        :page-size="cardPagination.pageSize"
        :item-count="cardPagination.total"
        :show-size-picker="true"
        :page-sizes="[12, 24, 48, 96]"
        show-quick-jumper
        @update:page="handleCardPageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>
