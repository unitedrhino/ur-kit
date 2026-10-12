export interface AreaEntity {
  areaID: string;
  projectID: string;
  parentAreaID: string;
  areaName: string;
  areaImg: string;
  desc: string;
  deviceCount: number;
  lowerLevelCount: number;
  isLeaf: number;
  sort: number;
  createdTime: number;
}
