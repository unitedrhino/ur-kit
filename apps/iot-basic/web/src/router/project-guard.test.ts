import { describe, expect, it, vi } from 'vitest';

import type { ProjectGuardStoreLike } from './project-guard';
import { applyProjectEntryFlow, createProjectListLoadGate, ensureProjectListLoaded } from './project-guard';

describe('org-iot-client project guard', () => {
  it('shares the pending project list request before deciding the project entry flow', async () => {
    let resolveProjects!: () => void;
    const store: ProjectGuardStoreLike = {
      currentProjectID: null,
      getProjects: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveProjects = () => {
              store.projects = [{ projectID: 'project-1', projectName: '默认项目' }];
              resolve();
            };
          }),
      ),
      openProjectCreateModal: vi.fn(),
      openProjectSelectModal: vi.fn(),
      projects: [],
      setCurrentProjectID: vi.fn((projectID: string) => {
        store.currentProjectID = projectID;
      }),
    };
    const gate = createProjectListLoadGate();

    const first = ensureProjectListLoaded(store, gate);
    const second = ensureProjectListLoaded(store, gate);

    expect(store.getProjects).toHaveBeenCalledTimes(1);
    expect(store.openProjectCreateModal).not.toHaveBeenCalled();

    resolveProjects();
    await Promise.all([first, second]);
    applyProjectEntryFlow(store);

    expect(store.openProjectCreateModal).not.toHaveBeenCalled();
    expect(store.setCurrentProjectID).toHaveBeenCalledWith('project-1');
  });

  it('opens the required create modal only after a completed empty project list', async () => {
    const store: ProjectGuardStoreLike = {
      currentProjectID: null,
      getProjects: vi.fn(async () => {}),
      openProjectCreateModal: vi.fn(),
      openProjectSelectModal: vi.fn(),
      projects: [],
      setCurrentProjectID: vi.fn(),
    };
    const gate = createProjectListLoadGate();

    await ensureProjectListLoaded(store, gate);
    applyProjectEntryFlow(store);

    expect(store.openProjectCreateModal).toHaveBeenCalledWith({ required: true });
  });
});
