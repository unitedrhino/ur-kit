#!/usr/bin/env python3
"""验证共享包同步不依赖迁出的应用，并保留可重复生成的 WS 公开入口。"""
import json
import hashlib
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from sync_web_shared import collect_shared_packages, configure_realtime_export


class SharedPackageTests(unittest.TestCase):
    """使用最小源码树验证独立应用边界，避免读取私有 SaaS 仓。"""

    def test_iot_closure_without_structure_app(self):
        """仅有 IoT 客户端时仍能解析闭包，排除不被使用的私有业务包。"""
        with tempfile.TemporaryDirectory() as directory:
            web = Path(directory)
            fixtures = {
                'apps/org-iot-client': {'name': 'org-iot-client', 'dependencies': {'@vben/saas': 'workspace:*'}},
                'internal/vite-config': {'name': '@vben/vite-config'},
                'internal/tailwind-config': {'name': '@vben/tailwind-config'},
                'internal/tsconfig': {'name': '@vben/tsconfig'},
                'packages/saas': {'name': '@vben/saas', 'dependencies': {'@vben/shared': 'workspace:*'}},
                'packages/shared': {'name': '@vben/shared'},
                'packages/private-only': {'name': '@vben/private-only'},
            }
            for path, manifest in fixtures.items():
                target = web / path / 'package.json'
                target.parent.mkdir(parents=True)
                target.write_text(json.dumps(manifest))
            selected = collect_shared_packages(web)
            self.assertEqual(set(selected), {
                'org-iot-client', '@vben/saas', '@vben/shared',
                '@vben/vite-config', '@vben/tailwind-config', '@vben/tsconfig',
            })

    def test_realtime_export_is_reproducible(self):
        """重复适配保持相同字节，并确保入口指向无 UI 依赖的原始客户端。"""
        with tempfile.TemporaryDirectory() as directory:
            shared = Path(directory)
            source = shared / 'packages/saas/src/hooks/ws-client.ts'
            source.parent.mkdir(parents=True)
            source.write_text('export class WsClient {}\n')
            manifest = shared / 'packages/saas/package.json'
            manifest.write_text(json.dumps({'name': '@vben/saas', 'exports': {'.': './src/index.ts'}}))
            configure_realtime_export(shared)
            first = manifest.read_bytes()
            configure_realtime_export(shared)
            self.assertEqual(first, manifest.read_bytes())
            entry = json.loads(first)['exports']['./ws-client']
            self.assertTrue((manifest.parent / entry['default']).is_file())
            self.assertEqual(entry['default'], entry['types'])

    def test_full_sync_twice_without_structure_source(self):
        """完整同步执行两次得到相同快照，不要求私有结构监测源码存在。"""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            saas = root / 'saas'
            web = saas / 'apps/web'
            fixtures = {
                'apps/org-iot-client': {'name': 'org-iot-client', 'dependencies': {'@vben/saas': 'workspace:*'}},
                'internal/vite-config': {'name': '@vben/vite-config'},
                'internal/tailwind-config': {'name': '@vben/tailwind-config'},
                'internal/tsconfig': {'name': '@vben/tsconfig'},
                'packages/saas': {'name': '@vben/saas', 'exports': {'.': {'development': './src/index.ts', 'default': './dist/index.mjs'}}},
                'packages/effects/layouts': {'name': '@vben/layouts'},
                'packages/@core/ui-kit/menu-ui': {'name': '@vben-core/menu-ui'},
            }
            fixtures['apps/org-iot-client']['dependencies'].update({'@vben/layouts': 'workspace:*', '@vben-core/menu-ui': 'workspace:*'})
            for relative, manifest in fixtures.items():
                path = web / relative / 'package.json'
                path.parent.mkdir(parents=True)
                path.write_text(json.dumps(manifest))
            for relative in (
                'packages/saas/src/hooks/ws-client.ts', 'packages/saas/src/index.ts',
                'internal/vite-config/src/config/application.ts',
                'packages/effects/layouts/src/basic/menu/menu.vue',
                'packages/effects/layouts/src/basic/menu/extra-menu.vue',
                'packages/effects/layouts/src/basic/menu/mixed-menu.vue',
                'packages/@core/ui-kit/menu-ui/src/types.ts',
                'packages/@core/ui-kit/menu-ui/src/components/menu-badge.vue',
            ):
                path = web / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('// 固定测试源码\n')
            (web / 'pnpm-workspace.yaml').write_text('packages: []\n')
            subprocess.run(['git', 'init', '-q', str(saas)], check=True)
            subprocess.run(['git', 'add', 'apps/web'], cwd=saas, check=True)
            subprocess.run(['git', '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'], cwd=saas, check=True)
            sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=saas, text=True).strip()
            script = root / 'kit/scripts/sync_web_shared.py'
            script.parent.mkdir(parents=True)
            shutil.copyfile(Path(__file__).with_name('sync_web_shared.py'), script)
            command = ['python3', str(script), '--saas', str(saas), '--sha', sha]
            subprocess.run(command, check=True, capture_output=True)
            first = {str(p.relative_to(root / 'kit/web-shared')): hashlib.sha256(p.read_bytes()).hexdigest()
                     for p in (root / 'kit/web-shared').rglob('*') if p.is_file()}
            subprocess.run(command, check=True, capture_output=True)
            second = {str(p.relative_to(root / 'kit/web-shared')): hashlib.sha256(p.read_bytes()).hexdigest()
                      for p in (root / 'kit/web-shared').rglob('*') if p.is_file()}
            self.assertEqual(first, second)
            manifest = json.loads((root / 'kit/web-shared/packages/saas/package.json').read_text())
            self.assertIn('./ws-client', manifest['exports'])

    def test_missing_client_does_not_publish_broken_export(self):
        """缺少源文件时明确失败，不创建看似可用的入口。"""
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError, '缺少 WS 客户端'):
                configure_realtime_export(Path(directory))


if __name__ == '__main__':
    unittest.main()
