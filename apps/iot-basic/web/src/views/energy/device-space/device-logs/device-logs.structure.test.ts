import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd(), '../..');

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('org-iot-client device log surface', () => {
  it('wires the console log action to the org-scoped device log route', () => {
    const consoleFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/console/index.vue');

    expect(consoleFile).toContain('openDeviceLogs');
    expect(consoleFile).toContain('/device-space/device-logs/');
    expect(consoleFile).not.toContain('日志功能开发中');
  });

  it('keeps the new log page shadcn-first without direct naive imports', () => {
    const pageFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/device-logs/index.vue');
    const timelineFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/device-logs/components/LogTimeline.vue');
    const timePopoverFile = readRepoFile('apps/web/apps/org-iot-client/src/views/energy/device-space/device-logs/components/DateTimeRangePopover.vue');

    expect(pageFile).toContain('@vben-core/shadcn-ui');
    expect(pageFile).toContain('TabsTrigger');
    expect(pageFile).toContain('SheetContent');
    expect(pageFile).toContain('DateTimeRangePopover');
    expect(pageFile).toContain('device-log-tabs');
    expect(pageFile).toContain('device-log-time-presets');
    expect(timelineFile).toContain('h-[calc(100vh-360px)]');
    expect(timePopoverFile).toContain('Popover');
    expect(timePopoverFile).toContain('device-log-custom-time-trigger');
    expect(pageFile).not.toContain("from 'naive-ui'");
  });
});
