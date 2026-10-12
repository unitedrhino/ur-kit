#!/usr/bin/env python3
"""为公开 Web 应用配置固定来源的共享包工作区。"""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SHARED = ROOT / "web-shared"
SOURCE = json.loads((SHARED / "source.json").read_text())
BY_NAME = SOURCE["packages"]


def configure_app(directory: Path, shared_prefix: str) -> None:
    """将应用依赖改为仓内共享包路径并修正源码别名。"""
    manifest_path = directory / "package.json"
    manifest = json.loads(manifest_path.read_text())
    dependencies = manifest["dependencies"]
    for name in list(dependencies):
        if name in BY_NAME:
            dependencies[name] = f"link:{shared_prefix}/{BY_NAME[name]}"
    for name in ("@vben/vite-config", "@vben/tailwind-config", "@vben/tsconfig"):
        dependencies[name] = f"link:{shared_prefix}/{BY_NAME[name]}"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    for name in ("vite.config.mts", "tsconfig.json"):
        path = directory / name
        data = path.read_text()
        data = data.replace("../../packages/", f"{shared_prefix}/packages/")
        path.write_text(data)


def main() -> None:
    """使仓库根目录和 iot-basic Web 具备独立安装条件。"""
    configure_app(ROOT / "apps/iot-basic/web", "../../../web-shared")
    workspace = (SHARED / "pnpm-workspace.yaml").read_text()
    workspace = workspace.replace("  - apps/*", "  - apps/iot-basic/web")
    workspace = workspace.replace("  - internal/", "  - web-shared/internal/")
    workspace = workspace.replace("  - packages/", "  - web-shared/packages/")
    (ROOT / "pnpm-workspace.yaml").write_text(workspace)
    (ROOT / "package.json").write_text(json.dumps({
        "name": "@unitedrhino/ur-kit-web", "private": True, "type": "module",
        "packageManager": "pnpm@10.14.0",
        "scripts": {"build:web": "pnpm --filter org-iot-client build"},
        "devDependencies": {
            "@types/node": "catalog:", "@vitejs/plugin-vue": "catalog:",
            "@vitejs/plugin-vue-jsx": "catalog:", "sass": "catalog:",
            "tailwindcss": "catalog:", "typescript": "catalog:", "unbuild": "catalog:",
            "vite": "catalog:", "vue": "catalog:", "vue-tsc": "catalog:",
        },
    }, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
