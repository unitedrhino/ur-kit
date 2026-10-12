/** 文件说明：项目设备平面图及点位控制，界面状态按当前语言呈现。 */
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { TreeOption } from 'naive-ui';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';

import L from 'leaflet';
import {
  NButton,
  NCard,
  NEmpty,
  NInput,
  NInputNumber,
  NSelect,
  NSlider,
  NSpin,
  NSwitch,
  NTag,
  NTree,
  useMessage,
} from 'naive-ui';

import {
  buildControlInitialValues,
  buildControlPayload,
  normalizeControlSchemas,
  type DeviceMapControlSchema,
} from './device-control';
import { ProjectDeviceMapApi } from './index.api';
import {
  DEFAULT_DEVICE_MAP_MARKER_SIZE,
  mergeDevicesWithProfilePoints,
  parseDeviceMapProfile,
  serializeDeviceMapProfile,
  type DeviceMapProfileV2,
  type DeviceMapRuntimeDevice,
} from './profile';

// import 'leaflet/dist/leaflet.css';

const props = withDefaults(
  defineProps<{
    profileCode?: string;
    projectId?: null | string;
  }>(),
  {
    profileCode: 'device_map_v2',
    projectId: '',
  },
);

// t 依赖当前语言设置，使弹窗和地图中的文案在切换语言后重新渲染。
function t(key: string): string {
  void preferences.app.locale;
  return $t(key);
}

const message = useMessage();
const projectID = computed(() => String(props.projectId ?? '').trim());

const areaList = ref<any[]>([]);
const areaLoading = ref(false);
const areaSearch = ref('');
const selectedAreaKeys = ref<string[]>([]);
const selectedAreaID = computed(() => selectedAreaKeys.value[0] ?? '');
const selectedArea = computed(() =>
  areaList.value.find((area) => String(area.areaID ?? '') === selectedAreaID.value),
);

const pageLoading = ref(false);
const imageError = ref('');
const mapNoticeKey = ref('');
const mapNotice = computed(() => mapNoticeKey.value ? t(`iotApp.projectDeviceMap.${mapNoticeKey.value}`) : '');
const profile = ref<DeviceMapProfileV2 | null>(null);
const devices = ref<DeviceMapRuntimeDevice[]>([]);
const selectedDeviceKey = ref('');
const deviceSearch = ref('');
const editMode = ref(false);
const dirty = ref(false);
const saving = ref(false);
const draggingDeviceKey = ref('');

const controlLoading = ref(false);
const controlSending = ref(false);
const controlSchemas = ref<DeviceMapControlSchema[]>([]);
const controlValues = ref<Record<string, unknown>>({});
const selectedDeviceDetail = ref<any>(null);

const mapContainerRef = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let markerLayer: L.LayerGroup | null = null;

const plottedCount = computed(() => devices.value.filter((device) => device.isPlotted).length);
const unPlottedCount = computed(() => devices.value.length - plottedCount.value);
const selectedDevice = computed(() =>
  devices.value.find((device) => device.deviceKey === selectedDeviceKey.value) ?? null,
);

const filteredDevices = computed(() => {
  const keyword = deviceSearch.value.trim().toLowerCase();
  if (!keyword) return devices.value;
  return devices.value.filter((item) =>
    `${item.label} ${item.deviceName} ${item.productID}`.toLowerCase().includes(keyword),
  );
});

function buildAreaTree(list: any[]): TreeOption[] {
  const nodeMap = new Map<string, TreeOption & { raw: any; children: TreeOption[] }>();
  const roots: Array<TreeOption & { raw: any; children: TreeOption[] }> = [];

  for (const area of list) {
    const key = String(area.areaID ?? '');
    if (!key) continue;
    nodeMap.set(key, {
      key,
      label: area.areaName || area.areaNamePath || key,
      raw: area,
      children: [],
    });
  }

  for (const area of list) {
    const key = String(area.areaID ?? '');
    const node = nodeMap.get(key);
    if (!node) continue;
    const parentKey = area.parentAreaID ? String(area.parentAreaID) : '';
    const parent = parentKey ? nodeMap.get(parentKey) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const trim = (nodes: TreeOption[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        trim(node.children);
      } else {
        delete node.children;
      }
    }
  };
  trim(roots);
  return roots;
}

function filterAreaTree(nodes: TreeOption[], keyword: string): TreeOption[] {
  if (!keyword) return nodes;
  const result: TreeOption[] = [];
  for (const node of nodes) {
    const children = filterAreaTree(node.children ?? [], keyword);
    const label = String(node.label ?? '');
    if (label.includes(keyword) || children.length > 0) {
      result.push({
        ...node,
        children: children.length > 0 ? children : undefined,
      });
    }
  }
  return result;
}

const areaTree = computed(() => filterAreaTree(buildAreaTree(areaList.value), areaSearch.value.trim()));

function destroyMap() {
  if (map) {
    map.remove();
    map = null;
    markerLayer = null;
  }
}

function getImageDimensions(url: string) {
  return new Promise<{ height: number; width: number }>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve({ height: image.naturalHeight || image.height, width: image.naturalWidth || image.width }));
    image.addEventListener('error', reject);
    image.src = url;
  });
}

// deviceStatusLabel 从状态码取界面文案，保留设备原始名称。
function deviceStatusLabel(device: DeviceMapRuntimeDevice): string {
  const status = Number(device.device.status ?? device.device.isOnline);
  const key = ({ 1: 'inactive', 2: 'online', 3: 'offline', 4: 'abnormal' } as Record<number, string>)[status] ?? 'unknown';
  return t(`iotApp.projectDeviceMap.${key}`);
}

function deviceInitial(device: DeviceMapRuntimeDevice) {
  return (device.label || device.deviceName || '?').slice(0, 1).toUpperCase();
}

function markerHtml(device: DeviceMapRuntimeDevice) {
  const size = device.size;
  const image = device.imageUrl
    ? `<img src="${device.imageUrl}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:999px;" />`
    : `<span style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));font-weight:700;">${deviceInitial(device)}</span>`;
  return `
    <div class="device-map-marker device-map-marker--${device.statusTone}" style="width:${size}px;height:${size}px;">
      ${image}
    </div>
  `;
}

function renderMarkers() {
  if (!map) return;
  if (markerLayer) {
    markerLayer.clearLayers();
  } else {
    markerLayer = L.layerGroup().addTo(map);
  }

  for (const device of devices.value.filter((item) => item.isPlotted)) {
    const size = device.size;
    const icon = L.divIcon({
      className: '',
      html: markerHtml(device),
      iconAnchor: [size / 2, size / 2],
      iconSize: [size, size],
      popupAnchor: [0, -size / 2],
    });
    const marker = L.marker([device.lat, device.lng], {
      draggable: editMode.value,
      icon,
      title: device.deviceKey,
    });
    marker.bindTooltip(`${device.label} · ${deviceStatusLabel(device)}`);
    marker.on('click', () => {
      selectedDeviceKey.value = device.deviceKey;
    });
    marker.on('dragend', () => {
      const latLng = marker.getLatLng();
      updateDevicePoint(device.deviceKey, latLng.lat, latLng.lng);
    });
    marker.addTo(markerLayer);
  }
}

async function renderMap() {
  await nextTick();
  destroyMap();
  if (!mapContainerRef.value || !profile.value || !profile.value.image.url) return;
  const height = profile.value.image.height;
  const width = profile.value.image.width;
  if (height <= 0 || width <= 0) return;

  map = L.map(mapContainerRef.value, {
    attributionControl: false,
    crs: L.CRS.Simple,
    maxZoom: 4,
    minZoom: -4,
    zoomControl: true,
    zoomDelta: 0.25,
    zoomSnap: 0.25,
  });

  const bounds = L.latLngBounds([0, 0], [height, width]);
  L.imageOverlay(profile.value.image.url, bounds).addTo(map);
  map.fitBounds(bounds);
  renderMarkers();
  setTimeout(() => map?.invalidateSize(), 80);
}

function updateDevicePoint(deviceKey: string, lat: number, lng: number) {
  const target = devices.value.find((device) => device.deviceKey === deviceKey);
  if (!target || !profile.value) return;
  target.lat = Math.max(0, Math.min(profile.value.image.height, lat));
  target.lng = Math.max(0, Math.min(profile.value.image.width, lng));
  target.isPlotted = true;
  dirty.value = true;
  renderMarkers();
}

function removeDevicePoint(deviceKey: string) {
  const target = devices.value.find((device) => device.deviceKey === deviceKey);
  if (!target) return;
  target.isPlotted = false;
  target.lat = 0;
  target.lng = 0;
  dirty.value = true;
  renderMarkers();
}

function updateMarkerSize(value: number | null) {
  const target = selectedDevice.value;
  if (!target) return;
  target.size = Math.max(24, Number(value || DEFAULT_DEVICE_MAP_MARKER_SIZE));
  dirty.value = true;
  renderMarkers();
}

function handleDragStart(deviceKey: string) {
  if (!editMode.value) return;
  draggingDeviceKey.value = deviceKey;
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  if (!map || !mapContainerRef.value || !draggingDeviceKey.value || !profile.value) return;
  const rect = mapContainerRef.value.getBoundingClientRect();
  const point = L.point(event.clientX - rect.left, event.clientY - rect.top);
  const latLng = map.containerPointToLatLng(point);
  if (
    latLng.lat < 0 ||
    latLng.lat > profile.value.image.height ||
    latLng.lng < 0 ||
    latLng.lng > profile.value.image.width
  ) {
    message.warning(t('iotApp.projectDeviceMap.outsidePlan'));
    draggingDeviceKey.value = '';
    return;
  }
  updateDevicePoint(draggingDeviceKey.value, latLng.lat, latLng.lng);
  selectedDeviceKey.value = draggingDeviceKey.value;
  draggingDeviceKey.value = '';
}

async function loadAreas() {
  selectedAreaKeys.value = [];
  areaList.value = [];
  profile.value = null;
  devices.value = [];
  destroyMap();
  if (!projectID.value) return;

  areaLoading.value = true;
  try {
    areaList.value = await ProjectDeviceMapApi.listAreas(projectID.value);
    selectedAreaKeys.value = areaList.value[0]?.areaID ? [String(areaList.value[0].areaID)] : [];
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || t('iotApp.projectDeviceMap.loadAreasFailed'), (text) => message.error(text));
  } finally {
    areaLoading.value = false;
  }
}

async function loadSelectedArea() {
  destroyMap();
  imageError.value = '';
  mapNoticeKey.value = '';
  profile.value = null;
  devices.value = [];
  selectedDeviceKey.value = '';
  dirty.value = false;
  if (!selectedAreaID.value || !projectID.value) return;

  const area = selectedArea.value;
  if (!area?.areaImg) {
    mapNoticeKey.value = 'noFloorPlan';
    return;
  }

  pageLoading.value = true;
  let shouldRenderMap = false;
  try {
    const image = await getImageDimensions(area.areaImg);
    const [profileResp, deviceList] = await Promise.all([
      ProjectDeviceMapApi.readProfile(selectedAreaID.value, props.profileCode, projectID.value).catch(() => null),
      ProjectDeviceMapApi.listDevices(selectedAreaID.value, projectID.value),
    ]);
    const nextProfile = parseDeviceMapProfile((profileResp as any)?.params ?? '', {
      areaID: selectedAreaID.value,
      imageHeight: image.height,
      imageUrl: area.areaImg,
      imageWidth: image.width,
    });
    profile.value = nextProfile;
    devices.value = mergeDevicesWithProfilePoints(deviceList, nextProfile);
    if (nextProfile.parseError) {
      mapNoticeKey.value = 'profileParseFailed';
    }
    shouldRenderMap = true;
  } catch (error: any) {
    imageError.value = error?.message || t('iotApp.projectDeviceMap.floorPlanLoadFailed');
  } finally {
    pageLoading.value = false;
  }
  if (shouldRenderMap) {
    await renderMap();
  }
}

async function refreshCurrentArea() {
  await loadSelectedArea();
}

async function saveProfile() {
  if (!profile.value || !projectID.value || !selectedAreaID.value) return;
  saving.value = true;
  try {
    await ProjectDeviceMapApi.updateProfile(
      selectedAreaID.value,
      props.profileCode,
      serializeDeviceMapProfile(profile.value, devices.value),
      projectID.value,
    );
    dirty.value = false;
    message.success(t('iotApp.projectDeviceMap.layoutSaved'));
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || t('iotApp.projectDeviceMap.saveFailed'), (text) => message.error(text));
  } finally {
    saving.value = false;
  }
}

async function loadDeviceControl() {
  controlSchemas.value = [];
  controlValues.value = {};
  selectedDeviceDetail.value = null;
  if (!selectedDevice.value || !projectID.value) return;
  controlLoading.value = true;
  try {
    const [detail, schemas] = await Promise.all([
      ProjectDeviceMapApi.readDevice(selectedDevice.value.productID, selectedDevice.value.deviceName, projectID.value),
      ProjectDeviceMapApi.listControlSchemas(selectedDevice.value.productID, selectedDevice.value.deviceName, projectID.value),
    ]);
    selectedDeviceDetail.value = detail;
    controlSchemas.value = normalizeControlSchemas(schemas);
    controlValues.value = buildControlInitialValues(
      controlSchemas.value,
      (detail as any)?.withProperties ?? selectedDevice.value.device.withProperties,
    );
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || t('iotApp.projectDeviceMap.controlLoadFailed'), (text) => message.error(text));
  } finally {
    controlLoading.value = false;
  }
}

async function sendControl() {
  if (!selectedDevice.value || !projectID.value || controlSchemas.value.length === 0) return;
  controlSending.value = true;
  try {
    await ProjectDeviceMapApi.sendPropertyControl({
      data: buildControlPayload(controlSchemas.value, controlValues.value),
      deviceName: selectedDevice.value.deviceName,
      productID: selectedDevice.value.productID,
      projectID: projectID.value,
    });
    message.success(t('iotApp.projectDeviceMap.controlSent'));
    await loadDeviceControl();
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || t('iotApp.projectDeviceMap.controlFailed'), (text) => message.error(text));
  } finally {
    controlSending.value = false;
  }
}

function selectDevice(deviceKey: string) {
  selectedDeviceKey.value = deviceKey;
}

function handleAreaSelected(keys: Array<number | string>) {
  if (keys.length === 0) return;
  selectedAreaKeys.value = keys.map(String);
}

watch(projectID, () => {
  void loadAreas();
}, { immediate: true });

watch(selectedAreaID, () => {
  void loadSelectedArea();
});

watch(() => preferences.app.locale, () => {
  renderMarkers();
});

watch(editMode, () => {
  renderMarkers();
});

watch(selectedDeviceKey, () => {
  void loadDeviceControl();
});

onBeforeUnmount(() => {
  destroyMap();
});
</script>

<template>
  <Page title="" auto-content-height>
    <div class="device-map-page">
      <NCard class="device-map-panel device-map-panel--left" size="small">
        <template #header>
          <div class="device-map-section-title">{{ t('iotApp.projectDeviceMap.area') }}</div>
        </template>
        <NInput v-model:value="areaSearch" size="small" clearable :placeholder="t('iotApp.projectDeviceMap.searchAreas')" />
        <div class="device-map-tree">
          <NSpin v-if="areaLoading" />
          <NEmpty v-else-if="!projectID" :description="t('iotApp.projectDeviceMap.selectProject')" />
          <NEmpty v-else-if="areaTree.length === 0" :description="t('iotApp.projectDeviceMap.noAreas')" />
          <NTree
            v-else
            :data="areaTree"
            :selected-keys="selectedAreaKeys"
            block-line
            default-expand-all
            key-field="key"
            label-field="label"
            :selectable="true"
            @update:selected-keys="handleAreaSelected"
          />
        </div>
      </NCard>

      <NCard class="device-map-panel device-map-panel--map" size="small" content-style="height: 100%; padding: 0;">
        <template #header>
          <div class="device-map-toolbar">
            <div>
              <div class="device-map-section-title">{{ t('iotApp.projectDeviceMap.title') }}</div>
              <div class="device-map-subtitle">
                {{ selectedArea?.areaNamePath || selectedArea?.areaName || t('iotApp.projectDeviceMap.selectArea') }}
              </div>
            </div>
            <div class="device-map-actions">
              <NTag v-if="dirty" type="warning" size="small">{{ t('iotApp.projectDeviceMap.unsaved') }}</NTag>
              <NButton size="small" @click="refreshCurrentArea">
                <template #icon><span class="icon-[mdi--refresh]"></span></template>
                {{ t('iotApp.projectDeviceMap.refresh') }}
              </NButton>
              <NButton size="small" :type="editMode ? 'primary' : 'default'" @click="editMode = !editMode">
                <template #icon><span class="icon-[mdi--pencil]"></span></template>
                {{ editMode ? t('iotApp.projectDeviceMap.exitEdit') : t('iotApp.projectDeviceMap.editPoints') }}
              </NButton>
              <NButton size="small" type="primary" :loading="saving" :disabled="!dirty" @click="saveProfile">
                <template #icon><span class="icon-[mdi--content-save]"></span></template>
                {{ t('iotApp.projectDeviceMap.saveLayout') }}
              </NButton>
            </div>
          </div>
        </template>

        <div class="device-map-canvas-wrap">
          <NSpin v-if="pageLoading" />
          <NEmpty v-else-if="!projectID" :description="t('iotApp.projectDeviceMap.selectProject')" />
          <NEmpty v-else-if="!selectedAreaID" :description="t('iotApp.projectDeviceMap.selectArea')" />
          <NEmpty v-else-if="mapNotice && !profile" :description="mapNotice" />
          <NEmpty v-else-if="imageError" :description="imageError" />
          <template v-else>
            <div v-if="mapNotice" class="device-map-notice">{{ mapNotice }}</div>
            <div
              ref="mapContainerRef"
              class="device-map-canvas"
              @dragover.prevent
              @drop="handleDrop"
            ></div>
          </template>
        </div>
      </NCard>

      <NCard class="device-map-panel device-map-panel--right" size="small">
        <template #header>
          <div class="device-map-right-header">
            <div>
              <div class="device-map-section-title">{{ t('iotApp.projectDeviceMap.areaDevices') }}</div>
              <div class="device-map-subtitle">{{ t('iotApp.projectDeviceMap.plotted') }} {{ plottedCount }} / {{ t('iotApp.projectDeviceMap.unplotted') }} {{ unPlottedCount }}</div>
            </div>
          </div>
        </template>

        <div class="device-map-device-list">
          <NInput v-model:value="deviceSearch" size="small" clearable :placeholder="t('iotApp.projectDeviceMap.searchDevices')" />
          <NEmpty v-if="devices.length === 0" :description="t('iotApp.projectDeviceMap.noDevices')" />
          <button
            v-for="device in filteredDevices"
            v-else
            :key="device.deviceKey"
            class="device-map-device-row"
            :class="{ 'is-active': selectedDeviceKey === device.deviceKey }"
            :draggable="editMode"
            type="button"
            @click="selectDevice(device.deviceKey)"
            @dragstart="handleDragStart(device.deviceKey)"
          >
            <span class="device-map-device-avatar">
              <img v-if="device.imageUrl" :src="device.imageUrl" alt="" />
              <span v-else>{{ deviceInitial(device) }}</span>
            </span>
            <span class="device-map-device-main">
              <span class="device-map-device-name">{{ device.label }}</span>
              <span class="device-map-device-id">{{ device.deviceName }}</span>
            </span>
            <NTag :type="device.statusTone" size="small">{{ deviceStatusLabel(device) }}</NTag>
            <NTag :type="device.isPlotted ? 'success' : 'default'" size="small">
              {{ device.isPlotted ? t('iotApp.projectDeviceMap.plotted') : t('iotApp.projectDeviceMap.unplotted') }}
            </NTag>
          </button>
        </div>

        <div class="device-map-control">
          <NEmpty v-if="!selectedDevice" :description="t('iotApp.projectDeviceMap.selectDevice')" />
          <template v-else>
            <div class="device-map-control-title">
              <div>
                <div class="device-map-section-title">{{ selectedDevice.label }}</div>
                <div class="device-map-subtitle">{{ selectedDevice.productID }} / {{ selectedDevice.deviceName }}</div>
              </div>
              <NButton
                v-if="selectedDevice.isPlotted"
                size="tiny"
                :disabled="!editMode"
                @click="removeDevicePoint(selectedDevice.deviceKey)"
              >
                {{ t('iotApp.projectDeviceMap.removePoint') }}
              </NButton>
            </div>
            <div v-if="selectedDevice.isPlotted" class="device-map-size-row">
              <span>{{ t('iotApp.projectDeviceMap.pointSize') }}</span>
              <NInputNumber
                :value="selectedDevice.size"
                :min="24"
                :max="96"
                size="small"
                @update:value="updateMarkerSize"
              />
            </div>
            <NSpin :show="controlLoading">
              <NEmpty v-if="controlSchemas.length === 0 && !controlLoading" :description="t('iotApp.projectDeviceMap.noControls')" />
              <div v-else class="device-map-control-list">
                <div v-for="control in controlSchemas" :key="control.identifier" class="device-map-control-item">
                  <div class="device-map-control-label">{{ control.name }}</div>
                  <NSwitch
                    v-if="control.valueType === 'bool'"
                    v-model:value="controlValues[control.identifier] as boolean"
                  />
                  <NSelect
                    v-else-if="control.valueType === 'enum'"
                    v-model:value="controlValues[control.identifier] as string"
                    :options="control.options"
                    size="small"
                  />
                  <NSlider
                    v-else
                    v-model:value="controlValues[control.identifier] as number"
                    :min="control.min"
                    :max="control.max"
                    :step="control.step"
                  />
                </div>
              </div>
            </NSpin>
            <NButton
              class="device-map-control-submit"
              type="primary"
              block
              :loading="controlSending"
              :disabled="controlSchemas.length === 0"
              @click="sendControl"
            >
              {{ t('iotApp.projectDeviceMap.sendControl') }}
            </NButton>
          </template>
        </div>
      </NCard>
    </div>
  </Page>
</template>

<style scoped>
.device-map-page {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(420px, 1fr) minmax(300px, 360px);
  gap: 12px;
  height: calc(100vh - 96px);
  min-height: 640px;
}

.device-map-panel {
  min-height: 0;
}

.device-map-panel--left,
.device-map-panel--right {
  display: flex;
  flex-direction: column;
}

.device-map-section-title {
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 600;
}

.device-map-subtitle {
  margin-top: 2px;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.device-map-tree,
.device-map-device-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
}

.device-map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.device-map-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-map-canvas-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
  background: hsl(var(--muted) / 45%);
}

.device-map-canvas {
  width: 100%;
  height: 100%;
}

.device-map-notice {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 500;
  padding: 6px 10px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--card));
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  transform: translateX(-50%);
}

.device-map-device-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto auto;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding: 8px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  text-align: left;
}

.device-map-device-row:hover,
.device-map-device-row.is-active {
  border-color: hsl(var(--primary));
}

.device-map-device-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  overflow: hidden;
  border-radius: 999px;
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  font-weight: 700;
}

.device-map-device-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.device-map-device-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.device-map-device-name,
.device-map-device-id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-map-device-name {
  font-size: 13px;
  font-weight: 600;
}

.device-map-device-id {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.device-map-control {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid hsl(var(--border));
}

.device-map-control-title,
.device-map-size-row,
.device-map-control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.device-map-size-row,
.device-map-control-label {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.device-map-size-row > span,
.device-map-control-label {
  min-width: 72px;
  white-space: nowrap;
}

.device-map-control-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-map-control-item {
  min-height: 36px;
}

.device-map-control-item :deep(.n-select),
.device-map-control-item :deep(.n-slider) {
  flex: 1;
  min-width: 0;
}

.device-map-control-submit {
  margin-top: 4px;
}

:deep(.leaflet-container) {
  background: hsl(var(--muted));
}

:deep(.device-map-marker) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid hsl(var(--card));
  border-radius: 999px;
  box-shadow: 0 8px 18px rgb(15 23 42 / 25%);
}

:deep(.device-map-marker::after) {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border: 2px solid hsl(var(--card));
  border-radius: 999px;
  background: hsl(var(--muted-foreground));
  content: '';
}

:deep(.device-map-marker--success::after) {
  background: #22c55e;
}

:deep(.device-map-marker--warning::after) {
  background: #f59e0b;
}

:deep(.device-map-marker--error::after) {
  background: #ef4444;
}

@media (max-width: 1180px) {
  .device-map-page {
    grid-template-columns: minmax(200px, 240px) minmax(420px, 1fr);
  }

  .device-map-panel--right {
    grid-column: 1 / -1;
  }
}
</style>
