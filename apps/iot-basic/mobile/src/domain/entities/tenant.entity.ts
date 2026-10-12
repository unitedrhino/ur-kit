export interface TenantEntity {
  id: string;
  code: string;           // tenantCode
  name: string;           // 组织名称（UI显示）
  avatar: string;
  status: number;         // 1=启用 2=禁用
  desc: string;
  isOwner: boolean;
}
