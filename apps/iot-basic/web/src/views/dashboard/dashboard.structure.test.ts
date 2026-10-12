import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd(), '../..');

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('org-iot-client dashboard surface', () => {
  it('routes the overview dashboard through the requested dashboard view', () => {
    const routeFile = readRepoFile('apps/web/apps/org-iot-client/src/router/routes/modules/app.ts');

    expect(routeFile).toContain("path: '/dashboard'");
    expect(routeFile).toContain("component: () => import('#/views/dashboard/index.vue')");
    expect(routeFile).toContain("title: 'orgIotClient.routes.overview'");
  });

  it('keeps the backend menu seed aligned with the dashboard route', () => {
    // org-iot-client(AppID=600) 菜单种子已从 core 迁移到 things 服务自管
    const seedFile = readRepoFile('backend/things/service/apisvr/internal/startup/seed.go');

    expect(seedFile).toContain('DefaultName: "概要"');
    expect(seedFile).toContain('Path: "/dashboard"');
    expect(seedFile).toContain('Component: "dashboard/index"');
    expect(seedFile).toContain('DefaultIsHideInMenu: 2');
  });

  it('defines a responsive ThingsCloud-style dashboard shell', () => {
    const dashboardFile = readRepoFile('apps/web/apps/org-iot-client/src/views/dashboard/index.vue');

    expect(dashboardFile).toContain('iot-dashboard');
    expect(dashboardFile).toContain('stat-grid');
    expect(dashboardFile).toContain('@media (max-width: 768px)');
    expect(dashboardFile).toContain("$t('orgIotClient.dashboard.onlineRateTitle')");
    expect(dashboardFile).toContain("$t('orgIotClient.dashboard.activityStats')");
  });

  it('uses theme tokens instead of hardcoded dashboard colors', () => {
    const dashboardFile = readRepoFile('apps/web/apps/org-iot-client/src/views/dashboard/index.vue');

    expect(dashboardFile).toContain('hsl(var(--background-deep))');
    expect(dashboardFile).toContain('hsl(var(--card))');
    expect(dashboardFile).toContain('var(--dashboard-info)');
    expect(dashboardFile).not.toMatch(/#[\da-f]{3,8}\b/i);
    expect(dashboardFile).not.toMatch(/\brgba?\(/);
  });
});
