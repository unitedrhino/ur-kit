#!/usr/bin/env python3
"""从指定 SaaS 工作树导出公开 IoT 应用依赖的共享包及实时客户端入口。"""

import argparse
import json
import shutil
import subprocess
from pathlib import Path


def collect_shared_packages(web: Path) -> dict[str, Path]:
    """收集 IoT Web 与构建工具的依赖闭包，不依赖已独立迁出的业务应用。"""
    package_files = list(web.glob("packages/**/package.json")) + list(web.glob("internal/**/package.json"))
    available = {json.loads(path.read_text())["name"]: path.parent for path in package_files}
    queue = [web / name for name in (
        "apps/org-iot-client", "internal/vite-config",
        "internal/tailwind-config", "internal/tsconfig",
    )]
    selected: dict[str, Path] = {}
    while queue:
        directory = queue.pop()
        metadata = json.loads((directory / "package.json").read_text())
        name = metadata["name"]
        if name in selected:
            continue
        selected[name] = directory
        for kind in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
            for dependency in metadata.get(kind, {}):
                if dependency in available and dependency not in selected:
                    queue.append(available[dependency])
    return selected


def configure_realtime_export(shared: Path) -> None:
    """为无 UI 依赖的 WS 客户端添加窄导出，供同步和工作区初始化重复使用。"""
    directory = shared / "packages/saas"
    if not (directory / "src/hooks/ws-client.ts").is_file():
        raise ValueError("共享快照缺少 WS 客户端，不能创建失效的公开入口")
    manifest_path = directory / "package.json"
    manifest = json.loads(manifest_path.read_text())
    manifest.setdefault("exports", {})["./ws-client"] = {
        "types": "./src/hooks/ws-client.ts",
        "default": "./src/hooks/ws-client.ts",
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


def main() -> None:
    """按包依赖闭包复制共享源码，并记录来源提交。"""
    parser = argparse.ArgumentParser()
    parser.add_argument("--saas", required=True, type=Path, help="SaaS 工作树路径")
    parser.add_argument("--sha", required=True, help="固定来源提交 SHA")
    args = parser.parse_args()
    root = args.saas.resolve()
    actual = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
    if actual != args.sha:
        raise SystemExit(f"来源工作树提交不匹配：{actual}")
    dirty = subprocess.check_output(
        ["git", "status", "--porcelain", "--", "apps/web"], cwd=root, text=True,
    )
    if dirty:
        raise SystemExit("SaaS apps/web 存在未提交改动，禁止导出不受版本控制的快照")
    web = root / "apps/web"
    selected = collect_shared_packages(web)
    target = Path(__file__).resolve().parent.parent / "web-shared"
    if target.exists():
        shutil.rmtree(target)
    target.mkdir()
    for name, directory in sorted(selected.items()):
        relative = directory.relative_to(web)
        if relative.parts[0] == "apps":
            continue
        shutil.copytree(directory, target / relative, ignore=shutil.ignore_patterns(
            "node_modules", "dist", ".turbo", "*.log", "*.tsbuildinfo",
        ))
        manifest_path = target / relative / "package.json"
        copied = json.loads(manifest_path.read_text())
        entry = copied.get("exports", {}).get(".") if isinstance(copied.get("exports"), dict) else None
        if isinstance(entry, dict) and entry.get("development") and "dist/" in entry.get("default", ""):
            # 独立仓直接编译被引用的源码，避免依赖 SaaS 工作区预先生成的 dist。
            entry["default"] = entry["development"]
            manifest_path.write_text(json.dumps(copied, ensure_ascii=False, indent=2) + "\n")
    # Vite 配置的源码别名原本以 SaaS 根目录为基准；快照位于 web-shared 下。
    application_config = target / "internal/vite-config/src/config/application.ts"
    application_config.write_text(application_config.read_text().replace(
        "'packages/saas-ui/", "'web-shared/packages/saas-ui/",
    ))
    # Vue SFC 宏解析跨包类型重导出不稳定，快照中改为指向同一源码定义。
    menu_root = target / "packages/effects/layouts/src/basic/menu"
    for filename in ("menu.vue", "extra-menu.vue"):
        path = menu_root / filename
        path.write_text(path.read_text().replace(
            "import type { MenuProps } from '@vben-core/menu-ui';",
            "import type { MenuProps } from '../../../../../@core/ui-kit/menu-ui/src/types';",
        ))
    mixed = menu_root / "mixed-menu.vue"
    mixed.write_text(mixed.read_text().replace(
        "import type { NormalMenuProps } from '@vben-core/menu-ui';",
        "import type { NormalMenuProps } from '../../../../../@core/ui-kit/menu-ui/src/components/normal-menu/normal-menu';",
    ))
    # 菜单属性类型还会经 typings 二次重导出，Vue 宏需直接读取定义文件。
    menu_types = target / "packages/@core/ui-kit/menu-ui/src/types.ts"
    menu_types.write_text(menu_types.read_text().replace(
        "import type { MenuRecordBadgeRaw, ThemeModeType } from '@vben-core/typings';",
        "import type { ThemeModeType } from '@vben-core/typings';\n"
        "import type { MenuRecordBadgeRaw } from '../../../base/typings/src/menu-record';",
    ))
    badge = target / "packages/@core/ui-kit/menu-ui/src/components/menu-badge.vue"
    badge.write_text(badge.read_text().replace(
        "import type { MenuRecordBadgeRaw } from '@vben-core/typings';",
        "import type { MenuRecordBadgeRaw } from '../../../../base/typings/src/menu-record';",
    ))
    configure_realtime_export(target)
    shutil.copy2(web / "pnpm-workspace.yaml", target / "pnpm-workspace.yaml")
    (target / "source.json").write_text(json.dumps({
        "saasCommit": args.sha,
        "packages": {name: str(path.relative_to(web)) for name, path in sorted(selected.items())
                    if path.relative_to(web).parts[0] != "apps"},
    }, ensure_ascii=False, indent=2) + "\n")
    count = sum(path.relative_to(web).parts[0] != "apps" for path in selected.values())
    print(f"已导出 {count} 个共享包，来源 {args.sha}")


if __name__ == "__main__":
    main()
