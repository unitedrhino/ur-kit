/**
 * 地图配置文件 - 天地图配置
 */

import { $t } from '@vben/locales';

// 天地图配置
export const TIANDITU_CONFIG = {
  key: import.meta.env.VITE_TIANDITU_KEY || '',
  subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
  attribution: 'Map Data © 天地图',
};

// 地图图层类型
export type MapLayerType = 'osm' | 'tianditu_img' | 'tianditu_ter' | 'tianditu_vec';

// 图层选项配置
export const LAYER_OPTIONS = [
  {
    value: '卫星' as const,
    label: $t('orgIotClient.map.layerSatellite'),
    key: 'tianditu_img' as MapLayerType,
  },
  {
    value: '地形' as const,
    label: $t('orgIotClient.map.layerTerrain'),
    key: 'tianditu_vec' as MapLayerType,
  },
  {
    value: '地势' as const,
    label: $t('orgIotClient.map.layerRelief'),
    key: 'tianditu_ter' as MapLayerType,
  },
  {
    value: '街道' as const,
    label: $t('orgIotClient.map.layerStreet'),
    key: 'osm' as MapLayerType,
  },
];

// 获取地图图层配置
export const getLayerConfig = (layerType: MapLayerType) => {
  switch (layerType) {
    case 'osm': {
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        },
      };
    }
    case 'tianditu_img': {
      return {
        url: `https://{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_CONFIG.key}`,
        options: {
          attribution: TIANDITU_CONFIG.attribution,
          subdomains: TIANDITU_CONFIG.subdomains,
          maxZoom: 18,
        },
        labelUrl: `https://{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_CONFIG.key}`,
        labelOptions: {
          subdomains: TIANDITU_CONFIG.subdomains,
          maxZoom: 18,
        },
      };
    }
    case 'tianditu_ter': {
      return {
        url: `https://{s}.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_CONFIG.key}`,
        options: {
          attribution: TIANDITU_CONFIG.attribution,
          subdomains: TIANDITU_CONFIG.subdomains,
          maxZoom: 18,
        },
        labelUrl: `https://{s}.tianditu.gov.cn/cta_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_CONFIG.key}`,
        labelOptions: {
          subdomains: TIANDITU_CONFIG.subdomains,
          maxZoom: 18,
        },
      };
    }
    case 'tianditu_vec': {
      return {
        url: `https://{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_CONFIG.key}`,
        options: {
          attribution: TIANDITU_CONFIG.attribution,
          subdomains: TIANDITU_CONFIG.subdomains,
          maxZoom: 18,
        },
        labelUrl: `https://{s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_CONFIG.key}`,
        labelOptions: {
          subdomains: TIANDITU_CONFIG.subdomains,
          maxZoom: 18,
        },
      };
    }
    default: {
      throw new Error(`Unsupported layer type: ${layerType}`);
    }
  }
};

// 获取地图图层标签
export const getMapLayerLabel = (layerType: MapLayerType) => {
  return LAYER_OPTIONS.find((layer) => layer.key === layerType)?.value;
};
