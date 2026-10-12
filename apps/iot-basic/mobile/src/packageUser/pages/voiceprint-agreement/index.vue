<!-- 声纹授权协议页面：说明声纹采集、使用、存储与用户授权范围。 -->
<template>
<app-navigation-bar title="声纹授权协议" :back="true" />

<scroll-view class="voiceprint-page" scroll-y type="list">
  <view class="voiceprint-card">
    <text class="voiceprint-title">声纹授权协议</text>
    <text class="voiceprint-updated">更新日期：2026年7月8日</text>

    <view class="voiceprint-section">
      <text class="voiceprint-section__title">一、信息收集范围</text>
      <text class="voiceprint-section__body">当你使用声纹录制、声纹识别、数字生命等功能时，我们会在你主动点击录制并确认授权后，收集你录制的语音片段、声纹特征信息、说话人名称及声纹创建时间。</text>
    </view>

    <view class="voiceprint-section">
      <text class="voiceprint-section__title">二、使用目的</text>
      <text class="voiceprint-section__body">上述信息仅用于为你创建和管理声纹记录、完成声纹识别匹配、关联数字生命能力，以及保障相关功能的稳定运行。</text>
    </view>

    <view class="voiceprint-section">
      <text class="voiceprint-section__title">三、使用方式</text>
      <text class="voiceprint-section__body">你主动录制语音后，应用会将语音数据上传至服务端提取声纹特征，并保存为你的声纹记录。未获得你的授权同意前，我们不会启动声纹录制或创建声纹记录。</text>
    </view>

    <view class="voiceprint-section">
      <text class="voiceprint-section__title">四、存储与保护</text>
      <text class="voiceprint-section__body">我们会在实现声纹功能所需范围内保存声纹信息，并采取合理的访问控制和安全保护措施。你删除声纹记录后，相关声纹信息将按平台数据处理规则进行删除或匿名化处理。</text>
    </view>

    <view class="voiceprint-section">
      <text class="voiceprint-section__title">五、你的选择</text>
      <text class="voiceprint-section__body">你可以拒绝授权，拒绝后将无法使用声纹录制和声纹识别相关功能。你也可以在数字生命管理页面删除已创建的声纹记录。</text>
    </view>
  </view>
  <safe-area />
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
</script>

<style lang="scss" scoped>
.voiceprint-page { flex: 1; min-height: 0; background: var(--page-bg); }
.voiceprint-card { margin: 16px; padding: 18px; background: var(--card-bg); border-radius: 12px; }
.voiceprint-title { display: block; font-size: 20px; font-weight: 700; color: var(--text-primary); }
.voiceprint-updated { display: block; margin-top: 8px; font-size: 13px; color: var(--text-secondary); }
.voiceprint-section { margin-top: 20px; }
.voiceprint-section__title { display: block; font-size: 16px; font-weight: 600; color: var(--text-primary); }
.voiceprint-section__body { display: block; margin-top: 8px; font-size: 14px; line-height: 1.8; color: var(--text-secondary); }
</style>
