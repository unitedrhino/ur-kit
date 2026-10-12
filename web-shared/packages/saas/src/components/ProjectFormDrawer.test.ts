import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectFormDrawer from './ProjectFormDrawer.vue';

const clipboardMock = vi.hoisted(() => {
  const copy = vi.fn();
  return {
    copy,
    useClipboard: vi.fn(() => ({ copy })),
  };
});

vi.mock('@vueuse/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vueuse/core')>()),
  useClipboard: clipboardMock.useClipboard,
}));

vi.mock('@vben/stores', () => ({
  useProjectStore: () => ({
    createProject: vi.fn(),
    getProjects: vi.fn(),
    projects: [],
    setCurrentProjectID: vi.fn(),
    updateProject: vi.fn(),
  }),
}));

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    props: ['icon'],
    template: '<span data-test="icon" :data-icon="icon" />',
  },
}));

vi.mock('@unitedrhino/saas-ui', () => ({
  Button: {
    props: ['disabled', 'type', 'variant'],
    template: '<button :disabled="disabled" :type="type || \'button\'" :data-variant="variant" @click="$emit(\'click\', $event)"><slot /></button>',
  },
  Dialog: {
    props: ['open'],
    template: '<div v-if="open" data-test="dialog"><slot /><slot name="default" /></div>',
  },
  DialogContent: {
    template: '<div data-test="dialog-content"><slot /></div>',
  },
  DialogDescription: {
    template: '<div><slot /></div>',
  },
  DialogFooter: {
    template: '<div><slot /></div>',
  },
  DialogHeader: {
    template: '<div><slot /></div>',
  },
  DialogTitle: {
    template: '<h2><slot /></h2>',
  },
  Input: {
    props: ['id', 'modelValue', 'placeholder', 'readonly'],
    emits: ['update:modelValue'],
    template:
      '<input :id="id" :value="modelValue" :placeholder="placeholder" :readonly="readonly" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  Label: {
    props: ['for'],
    template: '<label><slot /></label>',
  },
  ScrollArea: {
    template: '<div><slot /></div>',
  },
  Select: {
    template: '<div><slot /></div>',
  },
  SelectContent: {
    template: '<div><slot /></div>',
  },
  SelectItem: {
    props: ['value'],
    template: '<div><slot /></div>',
  },
  SelectTrigger: {
    template: '<div><slot /></div>',
  },
  SelectValue: {
    template: '<div><slot /></div>',
  },
  Textarea: {
    props: ['id', 'modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<textarea :id="id" :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

describe('projectFormDrawer', () => {
  beforeEach(() => {
    clipboardMock.copy.mockReset();
    clipboardMock.useClipboard.mockClear();
  });

  it('shows readonly project ID in edit mode and copies it with VueUse clipboard', async () => {
    const wrapper = mount(ProjectFormDrawer, {
      props: {
        project: {
          projectID: 'project-http-copy-001',
          projectName: '测试项目',
          status: 1,
        },
        show: false,
      },
    });

    await wrapper.setProps({ show: true });
    await nextTick();

    const projectIDInput = wrapper.get<HTMLInputElement>('#projectID');
    expect(projectIDInput.element.value).toBe('project-http-copy-001');
    expect(projectIDInput.element.readOnly).toBe(true);

    await wrapper.get('[data-test="copy-project-id"]').trigger('click');

    expect(clipboardMock.useClipboard).toHaveBeenCalledWith({ legacy: true });
    expect(clipboardMock.copy).toHaveBeenCalledWith('project-http-copy-001');

    wrapper.unmount();
  });
});
