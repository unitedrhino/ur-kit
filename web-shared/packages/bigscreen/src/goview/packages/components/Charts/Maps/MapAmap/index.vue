<template>
  <div ref="vChartRef"></div>
</template>

<script setup lang="ts">
import { ref, type PropType, toRefs, watch, type Ref } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartDataFetch } from '@/hooks'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { MarkerEnum, ThemeEnum } from './config'
import { isArray } from '@/utils'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})
let {
  amapKey,
  amapStyleKey,
  amapLon,
  amapLat,
  amapZindex,
  mapMarkerType,
  lang,
  amapStyleKeyCustom,
  features,
  viewMode,
  showLabel,
  pitch,
  skyColor,
  marker,
  satelliteTileLayer,
  roadNetTileLayer,
  trafficTileLayer
  // mapOptions 类型宽松（历史数据可能缺字段），toRefs 各 ref 统一按可响应任意值处理
} = toRefs(props.chartConfig.option.mapOptions) as unknown as {
  amapKey: Ref<any>
  amapStyleKey: Ref<any>
  amapLon: Ref<any>
  amapLat: Ref<any>
  amapZindex: Ref<any>
  mapMarkerType: Ref<any>
  lang: Ref<any>
  amapStyleKeyCustom: Ref<any>
  features: Ref<any>
  viewMode: Ref<any>
  showLabel: Ref<any>
  pitch: Ref<any>
  skyColor: Ref<any>
  marker: Ref<any>
  satelliteTileLayer: Ref<any>
  roadNetTileLayer: Ref<any>
  trafficTileLayer: Ref<any>
}

let mapIns: any = null
let markers: any = []
let AMapIns: any = null
const vChartRef = ref<HTMLElement>()

const initMap = (newData: any) => {
  // mapOptions 各字段类型上可选（历史数据可能缺字段），入口统一兜底，默认值与 config.ts 对齐
  const tileLayer = (v: { show?: boolean; zIndex?: number; opacity?: number; zooms?: number[] } | undefined) =>
    v ?? {}
  const opts = {
    amapKey: amapKey.value ?? '',
    amapZindex: amapZindex.value ?? 11,
    amapLon: amapLon.value ?? 116.397428,
    amapLat: amapLat.value ?? 39.90923,
    lang: lang.value,
    features: features.value,
    pitch: pitch.value ?? 60,
    skyColor: skyColor.value ?? '#53A9DE',
    viewMode: viewMode.value,
    showLabel: showLabel.value ?? true,
    satelliteTileLayer: tileLayer(satelliteTileLayer.value),
    roadNetTileLayer: tileLayer(roadNetTileLayer.value),
    trafficTileLayer: tileLayer(trafficTileLayer.value),
    amapStyleKeyCustom: amapStyleKeyCustom.value ?? '',
    amapStyleKey: amapStyleKey.value
  }
  // 初始化
  AMapLoader.load({
    key: opts.amapKey, //api服务key--另外需要在public中使用安全密钥！！！
    version: '1.4.15', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: ['AMap.PlaceSearch', 'AMap.AutoComplete'] // 需要使用的的插件列表
  })
    .then(AMap => {
      AMapIns = AMap
      mapIns = new AMap.Map(vChartRef.value, {
        resizeEnable: true,
        zoom: opts.amapZindex, // 地图显示的缩放级别
        center: [opts.amapLon, opts.amapLat],
        lang: opts.lang,
        features: opts.features,
        pitch: opts.pitch, // 地图俯仰角度，有效范围 0 度- 83 度
        skyColor: opts.skyColor,
        viewMode: opts.viewMode, // 地图模式
        showLabel: opts.showLabel, // 是否显示地图文字标记
        willReadFrequently: true
      })
      dataHandle(props.chartConfig.option.dataset)

      let satelliteLayer = new AMap.TileLayer.Satellite({
        zIndex: opts.satelliteTileLayer.zIndex,
        opacity: opts.satelliteTileLayer.opacity,
        zooms: opts.satelliteTileLayer.zooms
      })
      let roadNetLayer = new AMap.TileLayer.RoadNet({
        zIndex: opts.roadNetTileLayer.zIndex,
        opacity: opts.roadNetTileLayer.opacity,
        zooms: opts.roadNetTileLayer.zooms
      })
      let trafficLayer = new AMap.TileLayer.Traffic({
        zIndex: opts.trafficTileLayer.zIndex,
        opacity: opts.trafficTileLayer.opacity,
        zooms: opts.trafficTileLayer.zooms
      })
      mapIns.remove([satelliteLayer, roadNetLayer, trafficLayer])
      if (opts.satelliteTileLayer.show) {
        mapIns.add([satelliteLayer])
      }
      if (opts.roadNetTileLayer.show) {
        mapIns.add([roadNetLayer])
      }
      if (opts.trafficTileLayer.show) {
        mapIns.add([trafficLayer])
      }

      mapIns.setMapStyle(`amap://styles/${opts.amapStyleKeyCustom !== '' ? opts.amapStyleKeyCustom : opts.amapStyleKey}`)
    })
    .catch(e => {})
}

const dataHandle = (newData: any) => {
  if (!mapIns && !AMapIns) {
    initMap(props.chartConfig.option)
    return
  }
  if (isArray(newData.markers)) {
    // 先清除旧标记
    mapIns.remove(markers)
    markers = []
    // 记录新标记
    const markerType = mapMarkerType.value
    if (markerType === MarkerEnum.MARKER) {
      newData.markers.forEach((markerItem: any) => {
        const markerInstance = new AMapIns.Marker({
          position: [markerItem.position[0], markerItem.position[1]],
          offset: new AMapIns.Pixel(-13, -30)
        })
        markers.push(markerInstance)
        markerInstance.setMap(mapIns)
      })
    } else if (markerType === MarkerEnum.CIRCLE_MARKER) {
      newData.markers.forEach((markerItem: any) => {
        const markerInstance = new AMapIns.CircleMarker({
          center: [markerItem.position[0], markerItem.position[1]],
          radius: markerItem.value,
          ...(marker.value ?? {})
        })
        markers.push(markerInstance)
        markerInstance.setMap(mapIns)
      })
    }
  }
}

const stopWatch = watch(
  () => props.chartConfig.option.mapOptions,
  option => {
    initMap(option)
  },
  {
    immediate: true,
    deep: true
  }
)

watch(
  () => props.chartConfig.option.dataset,
  newData => {
    try {
      dataHandle(newData)
    } catch (error) {
      console.log(error)
    }
  },
  {
    deep: false
  }
)

// 预览
useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  stopWatch()
  dataHandle(newData)
})
</script>
