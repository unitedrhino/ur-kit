<script lang="ts" setup>
import type { MapLayerType } from '#/utils/map-config';

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import L from 'leaflet';
// 修复 leaflet 默认图标问题
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { getLayerConfig } from '#/utils/map-config';

import 'leaflet/dist/leaflet.css';

interface Props {
  latitude?: number;
  longitude?: number;
  height?: string;
  zoom?: number;
  layerType?: MapLayerType;
}

const props = withDefaults(defineProps<Props>(), {
  latitude: 39.9042,
  longitude: 116.4074,
  height: '280px',
  zoom: 13,
  layerType: 'tianditu_img',
});

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

let map: L.Map | null = null;
let marker: L.Marker | null = null;
let currentTileLayer: L.TileLayer | null = null;

const mapId = `map-viewer-${Math.random().toString(36).substring(2, 9)}`;
const isLoading = ref(true);
const loadError = ref('');

// 初始化地图
const initMap = () => {
  const container = document.querySelector(`#${mapId}`);
  if (!container) {
    setTimeout(initMap, 100);
    return;
  }

  // 销毁已存在的地图
  if (map) {
    destroyMap();
  }

  try {
    const lat = props.latitude || 39.9042;
    const lng = props.longitude || 116.4074;

    map = L.map(mapId, {
      center: [lat, lng],
      zoom: props.zoom,
      zoomControl: true,
      attributionControl: false,
    });

    // 添加图层
    addMapLayer(props.layerType);

    // 等待地图完全加载后添加标记
    map.whenReady(() => {
      isLoading.value = false;
      addMarker(lat, lng);

      // 强制重新计算地图尺寸
      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 100);
    });
  } catch (error) {
    console.error('地图初始化失败:', error);
    loadError.value = $t('orgIotClient.map.loadFailed');
    isLoading.value = false;
  }
};

// 添加地图图层
const addMapLayer = (layerType: MapLayerType) => {
  if (!map) return;

  // 移除现有图层
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
    currentTileLayer = null;
  }

  const layerConfig = getLayerConfig(layerType);

  // 添加主图层
  currentTileLayer = L.tileLayer(layerConfig.url, layerConfig.options);
  currentTileLayer.addTo(map);

  // 添加标注图层（仅天地图需要）
  if (layerConfig.labelUrl) {
    const labelLayer = L.tileLayer(layerConfig.labelUrl, layerConfig.labelOptions);
    labelLayer.addTo(map);
  }
};

// 添加或更新标记
const addMarker = (lat: number, lng: number) => {
  if (!map) return;

  // 移除现有标记
  if (marker) {
    map.removeLayer(marker);
  }

  // 添加新标记
  marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup($t('orgIotClient.map.deviceLocationPopup', { lat: lat.toFixed(6), lng: lng.toFixed(6) }));
};

// 销毁地图
const destroyMap = () => {
  if (map) {
    map.remove();
    map = null;
    marker = null;
    currentTileLayer = null;
  }
};

// 监听坐标变化，更新地图标记
watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    if (map && newLat && newLng) {
      map.setView([newLat, newLng], props.zoom);
      addMarker(newLat, newLng);
    }
  },
);

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initMap();
    }, 200);
  });
});

onBeforeUnmount(() => {
  destroyMap();
});
</script>

<template>
  <div class="map-viewer-wrapper" :style="{ width: '100%', height: props.height }">
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
      <div class="text-sm text-gray-500">{{ $t('orgIotClient.map.loading') }}</div>
    </div>
    <div v-if="loadError" class="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
      <div class="text-sm text-red-500">{{ loadError }}</div>
    </div>
    <div :id="mapId" class="map-container"></div>
  </div>
</template>

<style scoped>
.map-viewer-wrapper {
  position: relative;
  background: #f0f0f0;
}

.map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 6px;
}

:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
}

:deep(.leaflet-tile-container) {
  opacity: 1 !important;
}
</style>

