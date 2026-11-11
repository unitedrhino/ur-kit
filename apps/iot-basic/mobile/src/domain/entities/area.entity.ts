/** 区域实体，保留项目层级、系统标识及客户端图标元数据。 */
export interface AreaEntity {
  /** isSysCreated 标识系统区域，页面不开放删除操作。 */
  isSysCreated?: number;
  /** tags 保留区域扩展数据，客户端图标通过 clientIcon 存储。 */
  tags?: Record<string, string>;
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
