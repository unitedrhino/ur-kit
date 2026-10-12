<script lang="ts" setup>
import { onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function initMap() {
  const map = L.map('mapContainer').setView([39.90923, 116.397428], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  L.marker([39.90923, 116.397428]).addTo(map).bindPopup('设备名称谢谢谢谢谢谢').openPopup();
}

onMounted(() => {
  initMap();
});
</script>

<template>
  <div id="mapContainer" class="h-[500px] w-full rounded-lg"></div>
</template>

<style scoped></style>
