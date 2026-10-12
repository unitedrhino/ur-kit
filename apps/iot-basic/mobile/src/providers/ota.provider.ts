import { otaService } from '../services/ota.service';
import type { FirmwareEntity } from '../domain/entities/firmware.entity';
import type { OtaJobEntity } from '../domain/entities/ota-job.entity';
import { createPageState, type PageState } from '../domain/models/page-state.model';

export interface OtaJobDeviceItem {
  deviceName: string;
  currentVersion: string;
  targetVersion: string;
  status: number;
  statusText: string;
}

export interface OtaState {
  firmwares: FirmwareEntity[];
  jobs: OtaJobEntity[];
  jobDetail: OtaJobEntity | null;
  jobDevices: OtaJobDeviceItem[];
  firmwarePageState: PageState;
  jobPageState: PageState;
}

class OtaProvider {
  private state: OtaState = {
    firmwares: [],
    jobs: [],
    jobDetail: null,
    jobDevices: [],
    firmwarePageState: createPageState(),
    jobPageState: createPageState(),
  };
  private listeners: Set<(s: OtaState) => void> = new Set();

  getState(): OtaState { return this.state; }

  subscribe(listener: (s: OtaState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void { this.listeners.forEach((fn) => fn(this.state)); }

  private update(partial: Partial<OtaState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  async loadFirmwareList(productID?: string): Promise<void> {
    const ps = createPageState();
    this.update({ firmwarePageState: { ...ps, loading: true } });
    try {
      const result = await otaService.getFirmwareList(1, ps.size, productID);
      this.update({
        firmwares: result.list,
        firmwarePageState: { ...ps, loading: false, total: result.total, hasMore: result.list.length >= ps.size },
      });
    } catch {
      this.update({ firmwarePageState: { ...ps, loading: false } });
    }
  }

  async loadJobList(firmwareID?: string): Promise<void> {
    const ps = createPageState();
    this.update({ jobPageState: { ...ps, loading: true } });
    try {
      const result = await otaService.getJobList(1, ps.size, firmwareID);
      this.update({
        jobs: result.list,
        jobPageState: { ...ps, loading: false, total: result.total, hasMore: result.list.length >= ps.size },
      });
    } catch {
      this.update({ jobPageState: { ...ps, loading: false } });
    }
  }

  async loadJobDetail(jobID: string): Promise<void> {
    this.update({ jobDetail: null });
    try {
      const jobDetail = await otaService.getJobDetail(jobID);
      this.update({ jobDetail });
    } catch {
      this.update({ jobDetail: null });
    }
  }

  async loadJobDevices(jobID: string): Promise<void> {
    this.update({ jobDevices: [] });
    try {
      const result = await otaService.getDeviceProgress(jobID, 1, 100);
      const jobDevices = result.list.map((item) => ({
        deviceName: item.deviceName,
        currentVersion: item.version,
        targetVersion: item.targetVersion,
        status: item.status,
        statusText: item.detail || `${item.progress}%`,
      }));
      this.update({ jobDevices });
    } catch {
      this.update({ jobDevices: [] });
    }
  }

  async createJob(data: Partial<OtaJobEntity> & Record<string, unknown>): Promise<string> {
    return otaService.createJob(data);
  }
}

export const otaProvider = new OtaProvider();
