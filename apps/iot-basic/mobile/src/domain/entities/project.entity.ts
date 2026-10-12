import type { GeoPoint } from '../models/location.model';

export interface ProjectEntity {
  projectID: string;
  projectName: string;
  tenantCode: string;
  adminUserID: string;
  address: string;
  position?: GeoPoint;
  projectImg: string;
  desc: string;
  status: number;           // 1=正常 2=禁用
  type: string;
  areaCount: number;
  userCount: number;
  deviceCount: number;
  deviceOnlineCount: number;
  sort: number;
  createdTime: number;
}
