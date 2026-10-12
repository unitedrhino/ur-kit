<template>
<app-navigation-bar title="个人资料" :back="true" />

<scroll-view class="profile-page" scroll-y type="list">
  <view class="profile-card profile-card--hero">
    <!-- #ifdef MP-WEIXIN -->
    <button class="profile-avatar profile-avatar--button" open-type="chooseAvatar" @chooseavatar="handleChooseAvatarByWx">
      <image v-if="avatarPreview" class="profile-avatar__image" :src="avatarPreview" mode="aspectFill" />
      <text v-else class="profile-avatar__text">{{avatarText}}</text>
    </button>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <view class="profile-avatar" @tap="handleChooseAvatarFromAlbum">
      <image v-if="avatarPreview" class="profile-avatar__image" :src="avatarPreview" mode="aspectFill" />
      <text v-else class="profile-avatar__text">{{avatarText}}</text>
    </view>
    <!-- #endif -->
    <view class="profile-hero__main">
      <text class="profile-hero__name">{{nickName || '未设置昵称'}}</text>
      <text class="profile-hero__id">ID: {{user?.userID || '-'}}</text>
    </view>
    <!-- #ifdef MP-WEIXIN -->
    <button class="profile-hero__action profile-hero__action-btn" open-type="chooseAvatar" @chooseavatar="handleChooseAvatarByWx">更换头像</button>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <text class="profile-hero__action" @tap="handleChooseAvatarFromAlbum">更换头像</text>
    <!-- #endif -->
  </view>

  <view class="profile-card">
    <view class="profile-field">
      <text class="profile-field__label">昵称</text>
      <input class="profile-field__input" placeholder="请输入昵称" maxlength="24" :value="nickName" @blur="handleNickNameBlur" />
    </view>
    <view class="profile-field">
      <text class="profile-field__label">性别</text>
      <view class="profile-sex">
        <view
          v-for="item in sexOptions"
          :key="item.value"
          :class="`profile-sex__item ${sex === item.value ? 'profile-sex__item--active' : ''}`"
          @tap="sex = item.value"
        >
          <text class="profile-sex__text">{{item.label}}</text>
        </view>
      </view>
    </view>
  </view>

  <view class="profile-card">
    <view class="profile-info-row">
      <text class="profile-info-row__label">手机号</text>
      <text class="profile-info-row__value">{{user?.phone || '未绑定'}}</text>
    </view>
    <view class="profile-info-row">
      <text class="profile-info-row__label">邮箱</text>
      <text class="profile-info-row__value">{{user?.email || '未绑定'}}</text>
    </view>
  </view>

  <view :class="`profile-submit ${saving ? 'profile-submit--disabled' : ''}`" @tap="handleSave" hover-class="profile-submit--hover">
    <text class="profile-submit__text">{{saving ? '保存中...' : '保存资料'}}</text>
  </view>

  <safe-area />
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { computed, ref, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { authProvider } from '../../../providers/auth.provider';
import type { UserEntity } from '../../../domain/entities/user.entity';

const user = ref<UserEntity | null>(null);
const nickName = ref('');
const sex = ref(0);
const avatar = ref('');
const avatarPreview = ref('');
const saving = ref(false);
const avatarUploading = ref(false);
const sexOptions = [
  { label: '保密', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
];

const avatarText = computed(() => (nickName.value ? nickName.value[0] : '?'));

function fillUser(nextUser: UserEntity | null) {
  user.value = nextUser;
  nickName.value = nextUser?.nickName || '';
  sex.value = nextUser?.sex || 0;
  avatar.value = nextUser?.avatar || '';
  avatarPreview.value = nextUser?.avatar || '';
}

onLoad(() => {
  if (!authProvider.isLoggedIn()) {
    uni.redirectTo({ url: '/packageUser/pages/login/index' });
    return;
  }
  fillUser(authProvider.getState().user);
});

onShow(() => fillUser(authProvider.getState().user));

/** 昵称输入框采用失焦同步：聚焦期间不写响应式 value，避免 setData 回写干扰原生输入框显示；blur 先于保存按钮 tap，保存处拿到最新值 */
function handleNickNameBlur(e: any) { nickName.value = e.detail.value }

/** 昵称输入时同步去除首尾空白 */
watch(nickName, (next) => {
  const trimmed = next.trim();
  if (trimmed !== next) nickName.value = trimmed;
});

/** handleChooseAvatarByWx 承接微信小程序原生头像选择能力，避免审核环境点击无响应。 */
async function handleChooseAvatarByWx(e: any) {
  const filePath = e?.detail?.avatarUrl || '';
  if (!filePath) {
    uni.showToast({ title: '未获取到头像', icon: 'none' });
    return;
  }
  await uploadAndSaveAvatar(filePath);
}

/** handleChooseAvatarFromAlbum 在非微信端或兜底场景下从相册/相机选择头像。 */
async function handleChooseAvatarFromAlbum() {
  if (avatarUploading.value) return;
  try {
    const res = await uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] });
    const filePath = res.tempFilePaths?.[0];
    if (!filePath) return;
    await uploadAndSaveAvatar(filePath);
  } catch (error) {
    const message = (error as Error)?.message || '';
    if (!message.includes('cancel')) uni.showToast({ title: message || '选择头像失败', icon: 'none' });
  }
}

/** uploadAndSaveAvatar 上传头像并立即保存到个人资料，确保更换头像流程一次点击后闭环。 */
async function uploadAndSaveAvatar(filePath: string): Promise<void> {
  if (avatarUploading.value) return;
  const previousPreview = avatarPreview.value;
  avatarPreview.value = filePath;
  avatarUploading.value = true;
  uni.showLoading({ title: '上传中', mask: true });
  try {
    const uploaded = await authProvider.uploadUserAvatar(filePath);
    avatar.value = uploaded.filePath;
    avatarPreview.value = uploaded.fileUri || uploaded.filePath;
    await authProvider.updateUserProfile({ avatar: avatar.value });
    fillUser(authProvider.getState().user);
    uni.showToast({ title: '头像已更新', icon: 'success' });
  } catch (error) {
    avatarPreview.value = previousPreview || avatar.value;
    uni.showToast({ title: (error as Error)?.message || '头像更新失败', icon: 'none' });
  } finally {
    avatarUploading.value = false;
    uni.hideLoading();
  }
}

async function handleSave() {
  if (saving.value || avatarUploading.value) return;
  if (!nickName.value) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    await authProvider.updateUserProfile({ nickName: nickName.value, sex: sex.value, avatar: avatar.value });
    fillUser(authProvider.getState().user);
    uni.showToast({ title: '已保存', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.profile-page { flex: 1; min-height: 0; background: var(--page-bg); }
.profile-card { margin: 16px; padding: 16px; background: var(--card-bg); border-radius: 16px; box-shadow: 0 8px 24px var(--color-shadow); }
.profile-card--hero { display: flex; align-items: center; gap: 14px; background: linear-gradient(180deg, var(--color-primary-light) 0%, var(--card-bg) 100%); }
.profile-avatar { width: 68px; height: 68px; border-radius: 50%; overflow: hidden; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.profile-avatar--button { padding: 0; margin: 0; border: 0; line-height: normal; }
.profile-avatar--button::after { border: 0; }
.profile-avatar__image { width: 100%; height: 100%; display: block; }
.profile-avatar__text { color: var(--color-on-primary); font-size: 26px; font-weight: 700; }
.profile-hero__main { flex: 1; min-width: 0; }
.profile-hero__name { display: block; font-size: 20px; font-weight: 700; color: var(--text-primary); }
.profile-hero__id { display: block; margin-top: 6px; font-size: 13px; color: var(--text-secondary); }
.profile-hero__action { color: var(--color-primary); font-size: 13px; }
.profile-hero__action-btn { padding: 0; margin: 0; background: transparent; border: 0; line-height: normal; }
.profile-hero__action-btn::after { border: 0; }
.profile-field { padding: 14px 0; border-bottom: 1rpx solid var(--border-color); }
.profile-field:last-child { border-bottom: none; }
.profile-field__label { display: block; margin-bottom: 10px; color: var(--text-secondary); font-size: 14px; }
.profile-field__input { font-size: 16px; color: var(--text-primary); }
.profile-sex { display: flex; gap: 10px; }
.profile-sex__item { flex: 1; height: 40px; border-radius: 12px; background: var(--page-bg); display: flex; align-items: center; justify-content: center; }
.profile-sex__item--active { background: var(--color-primary-light); color: var(--color-primary); }
.profile-sex__text { font-size: 14px; }
.profile-info-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1rpx solid var(--border-color); }
.profile-info-row:last-child { border-bottom: none; }
.profile-info-row__label { font-size: 15px; color: var(--text-primary); }
.profile-info-row__value { max-width: 65%; font-size: 14px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-submit { margin: 20px 16px; height: 48px; border-radius: 14px; background: var(--color-primary); display: flex; align-items: center; justify-content: center; }
.profile-submit--disabled { opacity: 0.6; }
.profile-submit--hover { opacity: 0.9; }
.profile-submit__text { color: var(--color-on-primary); font-size: 16px; font-weight: 600; }
</style>
