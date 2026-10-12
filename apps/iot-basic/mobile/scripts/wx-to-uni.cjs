#!/usr/bin/env node
/**
 * 将拷贝过来的 .ts 文件中的 wx.* API 调用替换为 uni.*
 * 仅处理"运行时 API"，对类型注解（WechatMiniprogram.* 等）不动。
 * 蓝牙 / wx.login / wx.getUserProfile 等 mp-weixin 专用 API 由调用方加条件编译，
 * 这里也一并替换为 uni.* 占位（uni 在 mp-weixin 下转发到 wx，跨端无碍）。
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src');

// uni.* 兼容的 wx.* API 列表（按字母排序，方便维护）。
const API_LIST = [
  'addPhoneContact','authorize','canIUse','checkSession','chooseAddress','chooseImage',
  'chooseLocation','chooseMessageFile','chooseVideo','clearStorage','clearStorageSync',
  'closeBLEConnection','closeBluetoothAdapter','closeSocket','cloud','connectSocket',
  'createBLEConnection','createIntersectionObserver','createInnerAudioContext',
  'createSelectorQuery','downloadFile','env','getAccountInfoSync','getAppBaseInfo',
  'getBackgroundAudioManager','getBLEDeviceCharacteristics','getBLEDeviceServices',
  'getBLEMTU','getBatteryInfo','getBluetoothAdapterState','getBluetoothDevices',
  'getClipboardData','getConnectedBluetoothDevices','getCurrentPages','getDeviceInfo',
  'getEnterOptionsSync','getEnvVersion','getFileSystemManager','getImageInfo',
  'getLaunchOptionsSync','getLocation','getMenuButtonBoundingClientRect','getNetworkType',
  'getPrivacySetting','getRecorderManager','getSetting','getStorage','getStorageInfoSync',
  'getStorageSync','getSystemInfo','getSystemInfoSync','getUpdateManager','getUserInfo',
  'getUserProfile','getWindowInfo','hideLoading','hideNavigationBarLoading','login',
  'makeBluetoothPair','makePhoneCall','miniProgram','navigateBack','navigateTo',
  'nextTick','notifyBLECharacteristicValueChange','offBluetoothDeviceFound',
  'offBluetoothAdapterStateChange','offBLECharacteristicValueChange',
  'offBLEConnectionStateChange','offLocationChange','offNetworkStatusChange',
  'onAppHide','onAppShow','onBluetoothAdapterStateChange','onBluetoothDeviceFound',
  'onBLECharacteristicValueChange','onBLEConnectionStateChange','onError',
  'onLocationChange','onMemoryWarning','onNeedPrivacyAuthorization',
  'onNetworkStatusChange','onNetworkWeakChange','onPageNotFound','onSocketClose',
  'onSocketError','onSocketMessage','onSocketOpen','onUnhandledRejection',
  'openBluetoothAdapter','openLocation','pageScrollTo','previewImage','reLaunch',
  'redirectTo','removeStorage','removeStorageSync','request','requirePrivacyAuthorize',
  'saveImageToPhotosAlbum','scanCode','sendSocketMessage','setClipboardData',
  'setNavigationBarColor','setNavigationBarTitle','setStorage','setStorageSync',
  'showActionSheet','showLoading','showModal','showNavigationBarLoading',
  'showToast','startBluetoothDevicesDiscovery','startLocationUpdate',
  'startLocationUpdateBackground','startPullDownRefresh','stopBluetoothDevicesDiscovery',
  'stopLocationUpdate','stopPullDownRefresh','switchTab','uploadFile','vibrateLong',
  'vibrateShort','writeBLECharacteristicValue',
];

const re = new RegExp(`\\bwx\\.(?=(?:${API_LIST.join('|')})\\b)`, 'g');

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'api' || name === 'node_modules') continue;
      walk(p, files);
    } else if (/\.(ts|vue)$/.test(name)) {
      files.push(p);
    }
  }
  return files;
}

let changed = 0;
for (const f of walk(SRC)) {
  const before = fs.readFileSync(f, 'utf8');
  const after = before.replace(re, 'uni.');
  if (before !== after) {
    fs.writeFileSync(f, after);
    changed++;
  }
}
console.log(`wx → uni: ${changed} files updated`);
