import type { SceneTrigger } from '../domain/models/scene-trigger.model';
import type { SceneAction } from '../domain/models/scene-action.model';
import type { SceneCondition } from '../domain/models/scene-condition.model';
import { createEmptyCondition } from '../domain/models/scene-condition.model';
import type { SceneEntity } from '../domain/entities/scene.entity';
import { sceneService } from '../services/scene.service';
import { areaService } from '../services/area.service';
import { currentFamilyProvider } from './current-family.provider';

export interface SceneEditState {
  step: number;
  totalSteps: number;
  mode: 'create' | 'edit';
  id: string;
  name: string;
  desc: string;
  type: 'manual' | 'auto';
  deviceMode: 'single' | 'multi';
  productID: string;
  deviceName: string;
  deviceAlias: string;
  areaID: string;
  triggers: SceneTrigger[];
  conditions: SceneCondition;
  actions: SceneAction[];
  saving: boolean;
  isDirty: boolean;
  missingItems: string[];
  validationErrors: string[];
}

class SceneEditProvider {
  private state: SceneEditState;
  private originalSnapshot = '';
  private listeners = new Set<(s: SceneEditState) => void>();

  constructor() {
    this.state = this.createInitialState();
    this.originalSnapshot = this.snapshotDraft(this.state);
    this.state = this.withDerivedState(this.state);
  }

  private createInitialState(): SceneEditState {
    return {
      step: 1,
      totalSteps: 3,
      mode: 'create',
      id: '',
      name: '',
      desc: '',
      type: 'manual',
      deviceMode: 'multi',
      productID: '',
      deviceName: '',
      deviceAlias: '',
      areaID: '',
      triggers: [],
      conditions: createEmptyCondition(),
      actions: [],
      saving: false,
      isDirty: false,
      missingItems: [],
      validationErrors: [],
    };
  }

  getState(): SceneEditState { return this.state; }

  subscribe(listener: (s: SceneEditState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify(): void { this.listeners.forEach((fn) => fn(this.state)); }

  private snapshotDraft(state: SceneEditState): string {
    const {
      step,
      totalSteps,
      saving,
      isDirty,
      missingItems,
      validationErrors,
      ...draft
    } = state;
    return JSON.stringify(draft);
  }

  private validate(state: SceneEditState): { valid: boolean; errors: string[] } {
    return sceneService.validateScene({
      name: state.name,
      type: state.type,
      deviceMode: state.deviceMode,
      productID: state.productID,
      deviceName: state.deviceName,
      triggers: state.triggers,
      actions: state.actions,
    } as Partial<SceneEntity>);
  }

  private withDerivedState(state: SceneEditState): SceneEditState {
    const validation = this.validate(state);
    return {
      ...state,
      validationErrors: validation.errors,
      missingItems: validation.errors,
      isDirty: this.originalSnapshot ? this.snapshotDraft(state) !== this.originalSnapshot : false,
    };
  }

  private update(partial: Partial<SceneEditState>, options?: { markClean?: boolean }): void {
    const next = { ...this.state, ...partial };
    if (options?.markClean) {
      this.originalSnapshot = this.snapshotDraft(next);
    }
    this.state = this.withDerivedState(next);
    this.notify();
  }

  private replaceState(next: SceneEditState, options?: { markClean?: boolean }): void {
    if (options?.markClean) {
      this.originalSnapshot = this.snapshotDraft(next);
    }
    this.state = this.withDerivedState(next);
    this.notify();
  }

  initCreate(): void {
    this.replaceState(this.createInitialState(), { markClean: true });
    this.loadDefaultAreaID();
  }

  private async loadDefaultAreaID(): Promise<void> {
    const projectID = currentFamilyProvider.getState().projectID;
    if (!projectID) return;
    try {
      const result = await areaService.getList(projectID, 1, 1);
      if (result.list.length > 0) {
        this.update({ areaID: result.list[0].areaID }, { markClean: !this.state.isDirty });
      }
    } catch {
      /* ignore — areaID will be empty, backend will report the error */
    }
  }

  async initEdit(id: string): Promise<void> {
    const scene = await sceneService.getDetail(id);
    this.replaceState({
      step: 1,
      totalSteps: scene.type === 'auto' ? 5 : 3,
      mode: 'edit',
      id: scene.id,
      name: scene.name,
      desc: scene.desc,
      type: (scene.type as 'manual' | 'auto') || 'manual',
      deviceMode: (scene.deviceMode as 'single' | 'multi') || 'multi',
      productID: scene.productID || '',
      deviceName: scene.deviceName || '',
      deviceAlias: scene.deviceAlias || '',
      areaID: scene.areaID || '',
      triggers: scene.triggers || [],
      conditions: scene.conditions || createEmptyCondition(),
      actions: scene.actions || [],
      saving: false,
      isDirty: false,
      missingItems: [],
      validationErrors: [],
    }, { markClean: true });
  }

  isDirty(): boolean {
    return this.state.isDirty;
  }

  getValidation(): { valid: boolean; errors: string[] } {
    const validation = this.validate(this.state);
    return { valid: validation.valid, errors: [...validation.errors] };
  }

  markClean(): void {
    this.originalSnapshot = this.snapshotDraft(this.state);
    this.state = this.withDerivedState(this.state);
    this.notify();
  }

  updateDeviceBinding(info: { deviceMode?: 'single' | 'multi'; productID?: string; deviceName?: string; deviceAlias?: string }): void {
    const updates: Partial<SceneEditState> = {};
    if (info.deviceMode !== undefined) updates.deviceMode = info.deviceMode;
    if (info.productID !== undefined) updates.productID = info.productID;
    if (info.deviceName !== undefined) updates.deviceName = info.deviceName;
    if (info.deviceAlias !== undefined) updates.deviceAlias = info.deviceAlias;
    this.update(updates);
  }

  updateBasicInfo(info: { name?: string; desc?: string; type?: 'manual' | 'auto' }): void {
    const updates: Partial<SceneEditState> = {};
    if (info.name !== undefined) updates.name = info.name;
    if (info.desc !== undefined) updates.desc = info.desc;
    if (info.type !== undefined) {
      updates.type = info.type;
      updates.totalSteps = info.type === 'auto' ? 5 : 3;
    }
    this.update(updates);
  }

  updateArea(areaID: string): void {
    this.update({ areaID });
  }

  addTrigger(trigger: SceneTrigger): void {
    this.update({ triggers: [...this.state.triggers, { ...trigger, order: this.state.triggers.length }] });
  }

  removeTrigger(index: number): void {
    const triggers = this.state.triggers.filter((_, i) => i !== index);
    this.update({ triggers });
  }

  updateTrigger(index: number, trigger: SceneTrigger): void {
    const triggers = [...this.state.triggers];
    triggers[index] = trigger;
    this.update({ triggers });
  }

  updateConditions(conditions: SceneCondition): void {
    this.update({ conditions });
  }

  addAction(action: SceneAction): void {
    this.update({ actions: [...this.state.actions, { ...action, order: this.state.actions.length }] });
  }

  removeAction(index: number): void {
    const actions = this.state.actions.filter((_, i) => i !== index);
    this.update({ actions });
  }

  updateAction(index: number, action: SceneAction): void {
    const actions = [...this.state.actions];
    actions[index] = action;
    this.update({ actions });
  }

  reorderAction(index: number, dir: 'up' | 'down'): void {
    const actions = [...this.state.actions];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= actions.length) return;
    [actions[index], actions[target]] = [actions[target], actions[index]];
    actions.forEach((a, i) => { a.order = i; });
    this.update({ actions });
  }

  nextStep(): void {
    if (this.state.step < this.state.totalSteps) {
      this.update({ step: this.state.step + 1 });
    }
  }

  prevStep(): void {
    if (this.state.step > 1) {
      this.update({ step: this.state.step - 1 });
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.state.totalSteps) {
      this.update({ step });
    }
  }

  getStepConfig(): { label: string; key: string }[] {
    if (this.state.type === 'auto') {
      return [
        { label: '基础信息', key: 'basic' },
        { label: '触发条件', key: 'trigger' },
        { label: '生效条件', key: 'condition' },
        { label: '执行动作', key: 'action' },
        { label: '预览确认', key: 'preview' },
      ];
    }
    return [
      { label: '基础信息', key: 'basic' },
      { label: '执行动作', key: 'action' },
      { label: '预览确认', key: 'preview' },
    ];
  }

  async save(): Promise<void> {
    const { mode, id, name, desc, type, deviceMode, productID, deviceName, deviceAlias, areaID, triggers, conditions, actions } = this.state;

    const validation = this.getValidation();
    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    this.update({ saving: true });
    try {
      const sceneData: Partial<SceneEntity> = {
        name,
        desc,
        type,
        deviceMode,
        productID,
        deviceName,
        deviceAlias,
        areaID,
        triggers,
        conditions,
        actions,
      };

      if (mode === 'edit') {
        sceneData.id = id;
        await sceneService.update(sceneData);
      } else {
        await sceneService.create(sceneData);
      }
      this.markClean();
    } finally {
      this.update({ saving: false });
    }
  }

  reset(): void {
    this.replaceState(this.createInitialState(), { markClean: true });
  }
}

export const sceneEditProvider = new SceneEditProvider();
