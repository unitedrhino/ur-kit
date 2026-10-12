export interface BleScanResult {
  deviceId: string;
  name: string;
  RSSI: number;
  advertisServiceUUIDs: string[];
  advertisData?: ArrayBuffer;
  localName: string;
  serviceData: Record<string, unknown>;
  productID?: string;
  deviceName?: string;
  mac?: string;
  moduleVersion?: number;
}
