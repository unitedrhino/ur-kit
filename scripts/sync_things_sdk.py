#!/usr/bin/env python3
"""从合同锁定的 SaaS 提交同步完整 Things SDK 原始源码快照。"""

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path


# 本脚本只更新 upstream 的原始对照文件；公开可编译包仍由各适配模块维护。
ROOT = Path(__file__).resolve().parents[1]
SOURCE = "backend/things/sdk/"
TARGET = ROOT / "things/sdk/upstream"
MANIFEST = TARGET / "manifest.json"


def git(repo: Path, *args: str) -> bytes:
    """在指定 SaaS 仓库读取提交对象，失败时停止同步。"""
    return subprocess.check_output(["git", "-C", str(repo), *args])


def source_files(repo: Path, sha: str) -> dict[str, bytes]:
    """读取 SDK 下全部受版本控制的源文件，保持 Git 对象的原始字节。"""
    names = git(repo, "ls-tree", "-r", "--name-only", sha, "--", SOURCE).decode().splitlines()
    if not names:
        raise ValueError("指定提交缺少 backend/things/sdk")
    files: dict[str, bytes] = {}
    for name in names:
        if not name.startswith(SOURCE):
            raise ValueError(f"SDK 源路径无效: {name}")
        relative = name[len(SOURCE):]
        parts = Path(relative).parts
        if not parts or any(part in (".", "..") for part in parts):
            raise ValueError(f"SDK 相对路径无效: {relative}")
        files[relative] = git(repo, "show", f"{sha}:{name}")
    return files


def manifest_bytes(sha: str, files: dict[str, bytes]) -> bytes:
    """按路径排序记录原始源码哈希和 SaaS 来源提交。"""
    manifest = {
        "saas_commit": sha,
        "files": {name: hashlib.sha256(files[name]).hexdigest() for name in sorted(files)},
    }
    return (json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()


def check_snapshot(files: dict[str, bytes], manifest: bytes) -> None:
    """检查已发布快照逐文件一致，并拒绝残留的旧源码文件。"""
    expected = set(files)
    actual = {
        relative.as_posix()
        for path in TARGET.rglob("*")
        if path.is_file()
        if (relative := path.relative_to(TARGET)).parts[0] != "schema"
        and relative.as_posix() not in ("go.mod", "manifest.json")
    }
    if actual != expected:
        raise ValueError(f"SDK 快照文件集合不一致：缺少 {sorted(expected - actual)}，多出 {sorted(actual - expected)}")
    for name, content in files.items():
        if (TARGET / name).read_bytes() != content:
            raise ValueError(f"SDK 快照内容不一致: {name}")
    if not MANIFEST.is_file() or MANIFEST.read_bytes() != manifest:
        raise ValueError("SDK 快照清单不一致")


def main() -> None:
    """校验完整 SaaS SHA 与合同来源，再同步或只读检查原始 SDK。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--saas", required=True, type=Path, help="SaaS Git 仓库路径")
    parser.add_argument("--sha", required=True, help="40 位 SaaS commit SHA")
    parser.add_argument("--check", action="store_true", help="只检查现有快照，不写文件")
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.sha):
        parser.error("--sha 必须是完整的 40 位小写 SHA")
    repo = args.saas.resolve()
    sha = git(repo, "rev-parse", "--verify", f"{args.sha}^{{commit}}").decode().strip()
    locked = json.loads((ROOT / "contracts/manifest.json").read_text())["saas_commit"]
    if sha != args.sha or sha != locked:
        parser.error("来源必须与 contracts/manifest.json 的完整 SaaS 提交一致")
    files = source_files(repo, sha)
    manifest = manifest_bytes(sha, files)
    if args.check:
        check_snapshot(files, manifest)
        print(f"已校验 {len(files)} 个 Things SDK 原始文件，来源 {sha}")
        return
    for name, content in files.items():
        target = TARGET / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    MANIFEST.write_bytes(manifest)
    check_snapshot(files, manifest)
    print(f"已同步 {len(files)} 个 Things SDK 原始文件，来源 {sha}")


if __name__ == "__main__":
    main()
