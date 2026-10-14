#!/usr/bin/env python3
"""从合同锁定的 SaaS 提交同步公共缓存与 Core 平台缓存的完整原始源码。"""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


# ROOT 指向 ur-kit 根目录，SOURCES 限定两个原始缓存源码目录。
ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "common": "backend/share/caches/",
    "platform": "backend/core/share/caches/",
}


def git(repo: Path, *args: str) -> bytes:
    """读取指定 SaaS Git 对象，任何失败均中止同步。"""
    return subprocess.check_output(["git", "-C", str(repo), *args])


def source_files(repo: Path, sha: str, prefix: str) -> dict[str, bytes]:
    """读取缓存目录下全部受版本控制的文件，保持来源字节不变。"""
    names = git(repo, "ls-tree", "-r", "--name-only", sha, "--", prefix).decode().splitlines()
    if not names:
        raise ValueError(f"指定提交缺少 {prefix}")
    files = {}
    for name in names:
        if not name.startswith(prefix):
            raise ValueError(f"缓存来源路径无效: {name}")
        relative = name[len(prefix):]
        parts = Path(relative).parts
        if not parts or Path(relative).is_absolute() or any(part in (".", "..") for part in parts):
            raise ValueError(f"缓存相对路径无效: {relative}")
        files[relative] = git(repo, "show", f"{sha}:{name}")
    return files


def manifest_bytes(sha: str, prefix: str, files: dict[str, bytes]) -> bytes:
    """记录来源提交、目录及逐文件 SHA256，供消费者审阅。"""
    data = {
        "saas_commit": sha,
        "source": prefix,
        "files": {name: hashlib.sha256(files[name]).hexdigest() for name in sorted(files)},
    }
    return (json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()


def actual_files(target: Path) -> dict[str, bytes]:
    """读取目标快照，排除仅用于隔离私有依赖的本地 go.mod 与清单。"""
    if target.is_symlink() or any(path.is_symlink() for path in target.rglob("*")):
        raise ValueError(f"缓存快照包含符号链接: {target}")
    return {
        path.relative_to(target).as_posix(): path.read_bytes()
        for path in target.rglob("*")
        if path.is_file() and path.relative_to(target).as_posix() not in ("go.mod", "manifest.json")
    }


def check_snapshot(target: Path, files: dict[str, bytes], manifest: bytes) -> None:
    """逐文件比对内容与清单，拒绝遗漏、额外文件或手工修改。"""
    if actual_files(target) != files or (target / "manifest.json").read_bytes() != manifest:
        raise ValueError(f"缓存快照与来源不一致: {target}")


def protect_existing(target: Path, bootstrap: bool) -> None:
    """替换前保护已发布快照；初次引入清单时只接受干净的 Git 跟踪文件。"""
    if not target.exists():
        return
    current = actual_files(target)
    manifest_path = target / "manifest.json"
    if manifest_path.is_file():
        recorded = json.loads(manifest_path.read_text())
        expected = recorded.get("files")
        if not isinstance(expected, dict) or set(expected) != set(current):
            raise ValueError(f"缓存旧清单与文件集合不一致: {target}")
        for name, content in current.items():
            if hashlib.sha256(content).hexdigest() != expected[name]:
                raise ValueError(f"缓存旧快照已被修改: {target / name}")
        return
    if not bootstrap:
        raise ValueError(f"旧缓存快照没有清单；初次审核后使用 --bootstrap: {target}")
    for name, content in current.items():
        path = target / name
        relative = path.relative_to(ROOT).as_posix()
        tracked = subprocess.run(["git", "-C", str(ROOT), "show", f"HEAD:{relative}"], capture_output=True)
        if tracked.returncode != 0 or tracked.stdout != content:
            raise ValueError(f"初次同步会覆盖未提交或未跟踪的文件: {path}")


def sync_target(target: Path, files: dict[str, bytes], manifest: bytes) -> None:
    """先构造并核对完整快照，再替换目录，保留本地 go.mod。"""
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ur-kit-cache-", dir=target.parent) as temporary:
        stage = Path(temporary) / "upstream"
        stage.mkdir()
        if (target / "go.mod").is_file():
            shutil.copy2(target / "go.mod", stage / "go.mod")
        for name, content in files.items():
            path = stage / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        (stage / "manifest.json").write_bytes(manifest)
        check_snapshot(stage, files, manifest)
        backup = Path(temporary) / "previous"
        if target.exists():
            target.rename(backup)
        try:
            stage.rename(target)
        except BaseException:
            if backup.exists() and not target.exists():
                backup.rename(target)
            raise


def main() -> None:
    """核对来源 SHA 与合同锁，并同步或只读校验两组缓存快照。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--saas", required=True, type=Path, help="SaaS Git 仓库路径")
    parser.add_argument("--sha", required=True, help="40 位 SaaS commit SHA")
    parser.add_argument("--check", action="store_true", help="只检查已发布快照")
    parser.add_argument("--bootstrap", action="store_true", help="首次替换已审核的无清单旧快照")
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.sha):
        parser.error("--sha 必须是完整的 40 位小写 SHA")
    if args.check and args.bootstrap:
        parser.error("--check 与 --bootstrap 不能同时使用")
    repo = args.saas.resolve()
    sha = git(repo, "rev-parse", "--verify", f"{args.sha}^{{commit}}").decode().strip()
    locked = json.loads((ROOT / "contracts/manifest.json").read_text())["saas_commit"]
    if sha != args.sha or sha != locked:
        parser.error("来源必须与 contracts/manifest.json 的完整 SaaS 提交一致")
    prepared = []
    for group, prefix in SOURCES.items():
        target = ROOT / "cache" / group / "upstream"
        files = source_files(repo, sha, prefix)
        manifest = manifest_bytes(sha, prefix, files)
        if args.check:
            check_snapshot(target, files, manifest)
        else:
            protect_existing(target, args.bootstrap)
        prepared.append((group, target, files, manifest))
    for group, target, files, manifest in prepared:
        if not args.check:
            sync_target(target, files, manifest)
        print(f"{'已校验' if args.check else '已同步'} {group} 缓存 {len(files)} 个原始文件，来源 {sha}")


if __name__ == "__main__":
    main()
