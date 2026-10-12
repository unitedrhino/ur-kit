export interface OtaJobEntity {
  id: string;
  firmwareID: string;
  firmwareName: string;
  productID: string;
  productName: string;
  type: number;               // 升级类型
  status: number;
  upgradeCount: number;
  successCount: number;
  failureCount: number;
  createdTime: number;
  targetVersion: string;
  srcVersion: string;
}
