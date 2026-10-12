#!/usr/bin/env python3
"""把固定合同快照中的 Go pb 生成物导入 ur-kit Go SDK 路径。"""

import shutil
from pathlib import Path


def main() -> None:
    """仅同步 Core/Things 的 pb.go；保持原相对路径以便逐服务迁移。"""
    root = Path(__file__).resolve().parents[1]
    source = root / "contracts/source/backend"
    target = root / "sdks/go/pb"
    paths = sorted(path for area in ("core", "things") for path in (source / area).rglob("*.pb.go"))
    if not paths:
        raise SystemExit("未找到 Go pb 生成物，拒绝清理旧 SDK")
    if target.exists():
        shutil.rmtree(target)
    for path in paths:
        output = target / path.relative_to(source)
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, output)
    print(f"同步 {len(paths)} 个 Go pb 文件")


if __name__ == "__main__":
    main()
