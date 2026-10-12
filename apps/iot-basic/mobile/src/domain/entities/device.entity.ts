import type { GeoPoint } from '../models/location.model';

export interface DeviceEntity {
  id: string;
  productID: string;
  deviceName: string;
  deviceAlias: string;
  status: number;         // 1=未激活 2=在线 3=离线 4=异常(频繁上下线)
  lastLogin: number;
  lastOffline: number;
  productName: string;
  productImg: string;
  projectID: string;
  areaID: string;
  deviceType: number;     // 1=直连 2=网关 3=子设备 4=监控
  version?: string;
  rssi: number;
  createdTime: number;
  isEnable: number;
  deviceImg: string;
  address?: string;
  position?: GeoPoint;
  desc?: string;
  tags: Record<string, string>;
  cloneID?: number;
  /** imei 设备 IMEI 号，只读。 */
  imei?: string;
  /** mac 设备 MAC 地址，只读。 */
  mac?: string;
  /** iccid 设备 SIM 卡号，只读。 */
  iccid?: string;
  /** hardInfo 模组硬件型号，只读。 */
  hardInfo?: string;
  /** softInfo 模组软件版本，只读。 */
  softInfo?: string;
  /** remoteAddr 远程访问地址，只读。 */
  remoteAddr?: string;
  /** netType 通讯方式：1=其他 2=Wi-Fi 3=蜂窝(2G/3G/4G) 4=5G 5=蓝牙 6=LoRaWAN 7=Wi-Fi+蓝牙 8=有线网络 9=蜂窝+蓝牙。 */
  netType?: number;
  /** mobileOperator 移动运营商：1=无 2=移动 3=联通 4=电信 5=广电。 */
  mobileOperator?: number;
  /** phone SIM 卡手机号。 */
  phone?: string;
  /** lastIp 最后登录的公网 IP。 */
  lastIp?: string;
  /** lastLocalIp 最后登录的局域网 IP。 */
  lastLocalIp?: string;
  /** firstLogin 设备激活时间（毫秒时间戳）。 */
  firstLogin?: number;
  /** firstBind 首次绑定时间（毫秒时间戳）。 */
  firstBind?: number;
  /** lastBind 最后绑定时间（毫秒时间戳）。 */
  lastBind?: number;
  /** expTime 设备服务到期时间（毫秒时间戳）。 */
  expTime?: number;
}
