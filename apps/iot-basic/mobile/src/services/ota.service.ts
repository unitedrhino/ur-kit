import { OtaRepositoryImpl } from '../data/repositories/ota.repository.impl';
import type { IOtaRepository } from '../domain/interfaces/ota.repository';
import type { FirmwareEntity } from '../domain/entities/firmware.entity';
import type { OtaJobEntity } from '../domain/entities/ota-job.entity';
import type { PageResult } from '../domain/models/page-state.model';

export class OtaService {
  constructor(private readonly otaRepo: IOtaRepository = new OtaRepositoryImpl()) {}

  async getFirmwareList(page: number, size: number, productID?: string): Promise<PageResult<FirmwareEntity>> {
    return this.otaRepo.getFirmwareList({ page, size, productID });
  }

  async getFirmwareDetail(id: string): Promise<FirmwareEntity> {
    return this.otaRepo.getFirmwareOne(id);
  }

  async createFirmware(data: Partial<FirmwareEntity>): Promise<string> {
    return this.otaRepo.createFirmware(data);
  }

  async getJobList(page: number, size: number, firmwareID?: string): Promise<PageResult<OtaJobEntity>> {
    return this.otaRepo.getJobList({ page, size, firmwareID });
  }

  async getJobDetail(id: string): Promise<OtaJobEntity> {
    return this.otaRepo.getJobOne(id);
  }

  async createJob(data: Partial<OtaJobEntity> & Record<string, unknown>): Promise<string> {
    return this.otaRepo.createJob(data);
  }

  async getDeviceProgress(jobID: string, page: number, size: number) {
    return this.otaRepo.getDeviceProgress(jobID, { page, size });
  }

  async getDeviceModuleVersions(productID: string, deviceName: string) {
    return this.otaRepo.getDeviceModuleVersions(productID, deviceName);
  }
}

export const otaService = new OtaService();
