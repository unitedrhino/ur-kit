import type { PropertyState, ThingModelSchema } from '../models/device-control.model';

export interface PropertyControlParams {
  productID: string;
  deviceName: string;
  /** 物模型 identifier（对应下游 dataID） */
  dataID: string;
  /** 已按物模型 define 序列化后的字符串值 */
  value: string;
}

export interface ActionSendParams {
  productID: string;
  deviceName: string;
  actionID: string;
  /** 入参对象：identifier -> 已按 define 序列化后的基本值 */
  params: Record<string, unknown>;
}

export interface IDeviceInteractRepository {
  propertyControlSend(params: PropertyControlParams): Promise<string>;
  propertyGetReportSend(productID: string, deviceName: string, dataIDs: string[]): Promise<void>;
  actionSend(params: ActionSendParams): Promise<string>;
  getThingModel(productID: string): Promise<ThingModelSchema>;
  getLatestProperties(productID: string, deviceName: string): Promise<PropertyState[]>;
}
