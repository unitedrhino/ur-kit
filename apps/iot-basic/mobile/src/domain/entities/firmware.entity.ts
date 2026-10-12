export interface FirmwareEntity {
  id: string;
  name: string;
  version: string;
  productID: string;
  productName: string;
  status: number;
  createdTime: number;
  signMethod: string;
  desc: string;
  moduleCode: string;
  isDiff: number;
}
