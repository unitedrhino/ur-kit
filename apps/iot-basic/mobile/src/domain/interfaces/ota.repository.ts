import type { FirmwareEntity } from '../entities/firmware.entity';
import type { OtaJobEntity } from '../entities/ota-job.entity';
import type { OtaProgressModel } from '../models/ota-progress.model';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface IOtaRepository {
  getFirmwareList(params: PageParams & { productID?: string }): Promise<PageResult<FirmwareEntity>>;
  getFirmwareOne(id: string): Promise<FirmwareEntity>;
  createFirmware(data: Partial<FirmwareEntity>): Promise<string>;
  getJobList(params: PageParams & { firmwareID?: string }): Promise<PageResult<OtaJobEntity>>;
  getJobOne(id: string): Promise<OtaJobEntity>;
  createJob(data: Partial<OtaJobEntity> & Record<string, unknown>): Promise<string>;
  getDeviceProgress(jobID: string, params: PageParams): Promise<PageResult<OtaProgressModel>>;
  getDeviceModuleVersions(productID: string, deviceName: string): Promise<Array<{ module: string; version: string }>>;
}
