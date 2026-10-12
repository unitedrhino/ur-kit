export interface DeviceRealtimeData {
  productID: string;
  deviceName: string;
  dataID: string;
  value: unknown;
  timestamp: number;
}

export interface DeviceStatusChange {
  productID: string;
  deviceName: string;
  status: number;    // 1=未激活 2=在线 3=离线 4=异常
  timestamp: number;
}
