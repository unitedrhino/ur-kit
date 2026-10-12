import type { FirmwareEntity } from '../../domain/entities/firmware.entity';
import type { OtaJobEntity } from '../../domain/entities/ota-job.entity';
import type { OtaProgressModel } from '../../domain/models/ota-progress.model';

export class OtaMapper {
  static toFirmwareEntity(dto: Record<string, unknown>): FirmwareEntity {
    return {
      id: String(dto.id || ''),
      name: String(dto.name || ''),
      version: String(dto.version || ''),
      productID: String(dto.productID || ''),
      productName: String(dto.productName || ''),
      status: Number(dto.status || 0),
      createdTime: Number(dto.createdTime || 0),
      signMethod: String(dto.signMethod || ''),
      desc: String(dto.desc || ''),
      moduleCode: String(dto.moduleCode || ''),
      isDiff: Number(dto.isDiff || 0),
    };
  }

  static toJobEntity(dto: Record<string, unknown>): OtaJobEntity {
    return {
      id: String(dto.id || ''),
      firmwareID: String(dto.firmwareID || ''),
      firmwareName: String(dto.firmwareName || ''),
      productID: String(dto.productID || ''),
      productName: String(dto.productName || ''),
      type: Number(dto.type || 0),
      status: Number(dto.status || 0),
      upgradeCount: Number(dto.upgradeCount || 0),
      successCount: Number(dto.successCount || 0),
      failureCount: Number(dto.failureCount || 0),
      createdTime: Number(dto.createdTime || 0),
      targetVersion: String(dto.targetVersion || ''),
      srcVersion: String(dto.srcVersion || ''),
    };
  }

  static toProgressModel(dto: Record<string, unknown>): OtaProgressModel {
    return {
      jobID: String(dto.jobID || ''),
      deviceName: String(dto.deviceName || ''),
      productID: String(dto.productID || ''),
      status: Number(dto.status || 0),
      progress: Number(dto.progress || 0),
      version: String(dto.version || ''),
      targetVersion: String(dto.targetVersion || ''),
      detail: String(dto.detail || ''),
    };
  }
}
