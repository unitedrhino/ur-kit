#!/usr/bin/env python3
"""从合同锁定的 SaaS 提交同步 Modbus 原服务源码，排除环境配置。"""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


# 快照只作原服务对照；可独立运行的读写示例位于 protocols/modbus 根目录。
ROOT = Path(__file__).resolve().parents[1]
SOURCE = "backend/protocol/modbus/"
TARGET = ROOT / "protocols/modbus/upstream"
MANIFEST = TARGET / "manifest.json"
SYNTHETIC = {"go.mod", "manifest.json"}
EXCLUDED = {"etc/modbus.yaml", "etc/modbusDocker.yaml"}


def git(repo: Path, *args: str) -> bytes:
    """只读指定 Git 对象，命令失败时停止同步。"""
    return subprocess.check_output(["git", "-C", str(repo), *args])


def source_files(repo: Path, sha: str) -> dict[str, bytes]:
    """读取原服务的全部受控文件，并明确排除环境配置。"""
    names = git(repo, "ls-tree", "-r", "--name-only", sha, "--", SOURCE).decode().splitlines()
    if not names:
        raise ValueError("指定提交缺少 Modbus 服务源码")
    files: dict[str, bytes] = {}
    for name in names:
        if not name.startswith(SOURCE):
            raise ValueError(f"Modbus 源路径无效: {name}")
        relative = name[len(SOURCE):]
        if not relative or Path(relative).is_absolute() or any(part in (".", "..") for part in Path(relative).parts):
            raise ValueError(f"Modbus 相对路径无效: {relative}")
        if relative in EXCLUDED:
            continue
        if relative in SYNTHETIC:
            raise ValueError(f"Modbus 原服务与快照保留文件冲突: {relative}")
        files[relative] = git(repo, "show", f"{sha}:{name}")
    return files


def manifest_bytes(sha: str, files: dict[str, bytes]) -> bytes:
    """记录来源、排除项和每份原始文件的 SHA-256。"""
    value = {
        "saas_commit": sha,
        "excluded_environment_files": sorted(EXCLUDED),
        "files": {name: hashlib.sha256(files[name]).hexdigest() for name in sorted(files)},
    }
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()


def existing_files(target: Path) -> dict[str, bytes]:
    """读取快照现有内容，拒绝符号链接与环境配置残留。"""
    if target.is_symlink() or any(path.is_symlink() for path in target.rglob("*")):
        raise ValueError("Modbus 快照不得包含符号链接")
    return {
        path.relative_to(target).as_posix(): path.read_bytes()
        for path in target.rglob("*") if path.is_file() and path.relative_to(target).as_posix() not in SYNTHETIC
    }


def check_snapshot(files: dict[str, bytes], manifest: bytes, target: Path = TARGET) -> None:
    """逐文件核对快照，避免来源不明的增删和局部生成。"""
    actual = existing_files(target)
    if actual != files:
        raise ValueError(f"Modbus 快照内容或文件集合不一致：应有 {len(files)} 项，实际 {len(actual)} 项")
    if not (target / "manifest.json").is_file() or (target / "manifest.json").read_bytes() != manifest:
        raise ValueError("Modbus 快照清单不一致")


def protect_existing(files: dict[str, bytes]) -> None:
    """同步前拒绝覆盖已有用户修改和未知文件。"""
    if not TARGET.exists():
        return
    current = existing_files(TARGET)
    if MANIFEST.is_file():
        previous = json.loads(MANIFEST.read_text())
        recorded = previous.get("files")
        if not isinstance(recorded, dict) or set(recorded) != set(current):
            raise ValueError("现有 Modbus 快照清单或文件集合无效")
        for name, content in current.items():
            if hashlib.sha256(content).hexdigest() != recorded[name]:
                raise ValueError(f"现有 Modbus 快照文件已修改: {name}")
        return
    for name, content in current.items():
        if name not in files or content != files[name]:
            raise ValueError(f"未建清单的 Modbus 快照文件有差异: {name}")


def main() -> None:
    """以固定来源同步或只读校验 Modbus 原服务快照。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--saas", required=True, type=Path, help="SaaS Git 仓库路径")
    parser.add_argument("--sha", required=True, help="40 位 SaaS commit SHA")
    parser.add_argument("--check", action="store_true", help="只检查现有快照")
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
        print(f"已校验 {len(files)} 个 Modbus 原服务文件，来源 {sha}")
        return
    protect_existing(files)
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ur-kit-modbus-", dir=TARGET.parent) as temporary:
        stage = Path(temporary) / "upstream"
        stage.mkdir()
        if (TARGET / "go.mod").is_file():
            shutil.copy2(TARGET / "go.mod", stage / "go.mod")
        for name, content in files.items():
            path = stage / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        (stage / "manifest.json").write_bytes(manifest)
        check_snapshot(files, manifest, stage)
        backup = Path(temporary) / "previous"
        if TARGET.exists():
            TARGET.rename(backup)
        try:
            stage.rename(TARGET)
        except BaseException:
            if backup.exists() and not TARGET.exists():
                backup.rename(TARGET)
            raise
    print(f"已同步 {len(files)} 个 Modbus 原服务文件，来源 {sha}")


if __name__ == "__main__":
    main()
