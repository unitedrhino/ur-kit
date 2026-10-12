/**
 * 数字生命管理 Provider
 * 管理数字生命页面的状态
 */

import type { CloneEntity } from '../domain/entities/clone.entity';
import type { CloneGroupEntity } from '../domain/entities/clone-group.entity';
import type { SpeakerEmbeddingEntity } from '../domain/entities/speaker-embedding.entity';
import { DigitalLifeService, createDigitalLifeService } from '../services/digital-life.service';
import { currentFamilyProvider } from './current-family.provider';

/** 页面 Tab 类型 */
export type DigitalLifeTab = 'clone' | 'speaker';

/** 数字生命管理状态 */
export interface DigitalLifeState {
  /** 当前 Tab */
  activeTab: DigitalLifeTab;
  /** CloneGroup ID */
  cloneGroupID: number;
  /** CloneGroup 信息 */
  cloneGroup: CloneGroupEntity | null;

  /** Clone 列表 */
  clones: CloneEntity[];
  /** Clone 加载状态 */
  clonesLoading: boolean;

  /** 声纹列表 */
  speakers: SpeakerEmbeddingEntity[];
  /** 声纹加载状态 */
  speakersLoading: boolean;

  /** 全局加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

/** 初始状态 */
function initialState(): DigitalLifeState {
  return {
    activeTab: 'clone',
    cloneGroupID: 0,
    cloneGroup: null,
    clones: [],
    clonesLoading: false,
    speakers: [],
    speakersLoading: false,
    loading: false,
    error: null,
  };
}

/**
 * 数字生命管理 Provider
 */
class DigitalLifeProvider {
  private state: DigitalLifeState = initialState();
  private listeners: Set<(s: DigitalLifeState) => void> = new Set();
  private service: DigitalLifeService = createDigitalLifeService();

  /**
   * 获取当前状态
   */
  getState(): DigitalLifeState {
    return this.state;
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (s: DigitalLifeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有监听者
   */
  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  /**
   * 更新状态
   */
  private update(partial: Partial<DigitalLifeState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * 初始化
   * 根据当前项目获取 CloneGroup
   */
  async init(): Promise<void> {
    this.update({ loading: true, error: null });

    try {
      // 获取当前项目 ID
      const familyState = currentFamilyProvider.getState();
      const projectID = Number(familyState.projectID) || 0;

      if (!projectID) {
        this.update({
          loading: false,
          error: '请先选择项目',
        });
        return;
      }

      // 查询 CloneGroup
      const cloneGroup = await this.service.getCloneGroupByProjectID(projectID);

      if (!cloneGroup) {
        this.update({
          loading: false,
          cloneGroupID: 0,
          cloneGroup: null,
          speakers: [],
        });
        return;
      }

      // 更新状态
      this.update({
        cloneGroupID: cloneGroup.id,
        cloneGroup,
        loading: false,
      });

      // 加载 Clone 列表和声纹列表
      await Promise.all([this.loadClones(), this.loadSpeakers()]);
    } catch (err) {
      this.update({
        loading: false,
        error: `加载失败: ${err}`,
      });
    }
  }

  /**
   * 切换 Tab
   */
  switchTab(tab: DigitalLifeTab): void {
    if (tab === this.state.activeTab) return;
    this.update({ activeTab: tab });
  }

  /**
   * 加载 Clone 列表
   */
  async loadClones(): Promise<void> {
    if (!this.state.cloneGroupID) return;

    this.update({ clonesLoading: true });

    try {
      const clones = await this.service.getClones(this.state.cloneGroupID);
      this.update({
        clones,
        clonesLoading: false,
      });
    } catch (err) {
      this.update({
        clonesLoading: false,
        error: `加载 Clone 列表失败: ${err}`,
      });
    }
  }

  /**
   * 加载声纹列表
   */
  async loadSpeakers(): Promise<void> {
    if (!this.state.cloneGroupID) return;

    this.update({ speakersLoading: true });

    try {
      const speakers = await this.service.getSpeakers(this.state.cloneGroupID);
      this.update({
        speakers,
        speakersLoading: false,
      });
    } catch (err) {
      this.update({
        speakersLoading: false,
        error: `加载声纹列表失败: ${err}`,
      });
    }
  }

  /**
   * 创建声纹
   * @param speakerName 说话人名称
   * @param audioBase64 Base64 编码的音频数据
   */
  async createSpeaker(speakerName: string, audioBase64: string): Promise<boolean> {
    if (!this.state.cloneGroupID) {
      this.update({ error: 'CloneGroup 不存在' });
      return false;
    }

    this.update({ loading: true, error: null });

    try {
      await this.service.createSpeaker(
        this.state.cloneGroupID,
        speakerName,
        audioBase64,
      );

      // 刷新列表
      await this.loadSpeakers();

      this.update({ loading: false });
      return true;
    } catch (err) {
      this.update({
        loading: false,
        error: `创建声纹失败: ${err}`,
      });
      return false;
    }
  }

  /**
   * 删除声纹
   * @param id 声纹 ID
   */
  async deleteSpeaker(id: number): Promise<boolean> {
    this.update({ loading: true, error: null });

    try {
      await this.service.deleteSpeaker(id);

      // 刷新列表
      await this.loadSpeakers();

      this.update({ loading: false });
      return true;
    } catch (err) {
      this.update({
        loading: false,
        error: `删除声纹失败: ${err}`,
      });
      return false;
    }
  }

  /**
   * 清空状态
   */
  clear(): void {
    this.state = initialState();
    this.notify();
  }
}

/** 导出单例 */
export const digitalLifeProvider = new DigitalLifeProvider();
