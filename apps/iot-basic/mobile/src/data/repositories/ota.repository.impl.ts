import { request } from '../../utils/request';
import type { IOtaRepository } from '../../domain/interfaces/ota.repository';
import type { FirmwareEntity } from '../../domain/entities/firmware.entity';
import type { OtaJobEntity } from '../../domain/entities/ota-job.entity';
import type { OtaProgressModel } from '../../domain/models/ota-progress.model';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { OtaMapper } from '../mappers/ota.mapper';

export class OtaRepositoryImpl implements IOtaRepository {
  async getFirmwareList(params: PageParams & { productID?: string }): Promise<PageResult<FirmwareEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/ota/firmware/info/get-list',
      data: {
        page: { page: params.page, size: params.size },
        productID: params.productID,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(OtaMapper.toFirmwareEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async getFirmwareOne(id: string): Promise<FirmwareEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/ota/firmware/info/get-one',
      data: { id },
    });
    return OtaMapper.toFirmwareEntity(resp);
  }

  async createFirmware(data: Partial<FirmwareEntity>): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/ota/firmware/info/create',
      data,
    });
    return String(resp.id || '');
  }

  async getJobList(params: PageParams & { firmwareID?: string }): Promise<PageResult<OtaJobEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/ota/job/info/get-list',
      data: {
        page: { page: params.page, size: params.size },
        firmwareID: params.firmwareID,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(OtaMapper.toJobEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async getJobOne(id: string): Promise<OtaJobEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/ota/job/info/get-one',
      data: { id },
    });
    return OtaMapper.toJobEntity(resp);
  }

  async createJob(data: Partial<OtaJobEntity> & Record<string, unknown>): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/ota/job/info/create',
      data,
    });
    return String(resp.id || '');
  }

  async getDeviceProgress(jobID: string, params: PageParams): Promise<PageResult<OtaProgressModel>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/ota/device/info/get-list',
      data: {
        jobID,
        page: { page: params.page, size: params.size },
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(OtaMapper.toProgressModel);
    return { list, total: Number(resp.total || 0) };
  }

  async getDeviceModuleVersions(productID: string, deviceName: string): Promise<Array<{ module: string; version: string }>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/module-version/get-list',
      data: { productID, deviceName },
    });
    return ((resp.list || []) as Record<string, unknown>[]).map((item) => ({
      module: String(item.moduleCode || ''),
      version: String(item.version || ''),
    }));
  }
}
