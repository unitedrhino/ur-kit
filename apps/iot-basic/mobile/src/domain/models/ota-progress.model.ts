export interface OtaProgressModel {
  jobID: string;
  deviceName: string;
  productID: string;
  status: number;
  progress: number;         // 0-100
  version: string;
  targetVersion: string;
  detail: string;
}
