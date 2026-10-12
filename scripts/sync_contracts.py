#!/usr/bin/env python3
"""从指定 SaaS 提交导出 Core/Things 合同及生成物，保证快照可复现。"""

import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path


def git(repo: Path, *args: str) -> bytes:
    """执行只读 Git 命令，失败时终止导出。"""
    return subprocess.check_output(["git", "-C", str(repo), *args])


def included(path: str) -> bool:
    """限定可公开的 Core/Things 定义、pb 生成物及 Swagger。"""
    if path.startswith(("backend/core/", "backend/things/")):
        return path.endswith((".api", ".proto", ".pb.go", "_grpc.pb.go"))
    return path.startswith("backend/.swagger/") and path.endswith(".json")


def main() -> None:
    """校验提交、生成临时快照后替换 contracts/source 与清单。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--saas", type=Path, required=True, help="SaaS Git 仓库路径")
    parser.add_argument("--sha", required=True, help="固定的 SaaS commit SHA")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "contracts")
    args = parser.parse_args()
    repo = args.saas.resolve()
    sha = git(repo, "rev-parse", "--verify", f"{args.sha}^{{commit}}").decode().strip()
    if sha != args.sha:
        parser.error("--sha 必须为完整的 40 位 commit SHA")
    names = git(repo, "ls-tree", "-r", "--name-only", sha, "backend/core", "backend/things", "backend/.swagger").decode().splitlines()
    names = sorted(filter(included, names))
    if not any(p.endswith(".proto") for p in names) or not any(p.endswith(".api") for p in names) or not any(p.endswith(".json") for p in names):
        parser.error("合同源文件不完整，拒绝覆盖现有快照")
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ur-kit-contracts-", dir=output.parent) as temporary:
        temp = Path(temporary) / "contracts"
        temp.mkdir()
        if (output / "go.mod").exists():
            shutil.copy2(output / "go.mod", temp / "go.mod")
        checksums = {}
        for name in names:
            data = git(repo, "show", f"{sha}:{name}")
            dest = temp / "source" / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            checksums[name] = hashlib.sha256(data).hexdigest()
        manifest = {"schema": 1, "saas_commit": sha, "files": checksums}
        (temp / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
        backup = temp.parent / "previous"
        if output.exists():
            output.rename(backup)
        try:
            temp.rename(output)
        except BaseException:
            if backup.exists() and not output.exists():
                backup.rename(output)
            raise
    print(f"导出 {len(names)} 个文件，来源 {sha}")


if __name__ == "__main__":
    main()
