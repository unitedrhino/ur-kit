export interface ProductEntity {
  productID: string;
  productName: string;
  productImg: string;
  deviceType: number;     // 1=直连 2=网关 3=子设备 4=监控
  categoryID: string;
  netType: number;
  protocolCode: string;
  status: number;         // 1=启用 2=禁用 3=开发中
  /**
   * 绑定等级：
   * - 1 强绑定：被他人绑定时不允许 App 自动接管
   * - 2 中等：需要 BLE 端密钥（ble_key / nonce / 签名）鉴权后才能解绑
   * - 3 弱绑定：App 可直接解绑后再绑定到当前账号
   */
  bindLevel: number;
  desc?: string;
  createdTime: number;
  /**
   * 是否支持 5G 频段 WiFi 配网。
   * 当前后端未提供该字段，mapper 兜底为 false（仅 2.4G）。
   * 后端补齐字段后从 dto 透传即可，前端逻辑无需调整。
   */
  supportsWifi5G: boolean;
}
