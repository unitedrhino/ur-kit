#!/usr/bin/env python3
"""从固定合同快照按服务生成 Java protobuf 消息代码。"""

from __future__ import annotations

import hashlib
import shutil
import subprocess
import tempfile
from pathlib import Path


# REPO 指向公共仓根目录；SOURCE 是 SaaS 指定提交导出的合同快照。
REPO = Path(__file__).resolve().parents[1]
SOURCE = REPO / "contracts/source/backend"
OUTPUT = REPO / "sdks/java/target/generated-sources/urkit/java"
PROTO_DIRS = (
    "core/service/aisvr/proto",
    "core/service/imsvr/proto",
    "core/service/syssvr/proto",
    "core/service/timedsvr/proto",
    "things/service/dmsvr/proto",
    "things/service/udsvr/proto",
    "things/share/rpcs/protocolSync/proto",
)


def tree_digest(directory: Path) -> str:
    """按相对路径和文件内容计算稳定哈希，比较重复生成结果。"""
    digest = hashlib.sha256()
    for file in sorted(directory.rglob("*.java")):
        digest.update(str(file.relative_to(directory)).encode())
        digest.update(file.read_bytes())
    return digest.hexdigest()


def main() -> None:
    """校验 proto 与 protoc，再原子替换 Java 生成目录。"""
    if shutil.which("protoc") is None:
        raise SystemExit("需要安装 protoc 才能生成 Java protobuf 消息代码")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix="java-pb-", dir=OUTPUT.parent))
    try:
        count = 0
        for relative in PROTO_DIRS:
            source = SOURCE / relative
            files = sorted(source.glob("*.proto"))
            if not files:
                raise SystemExit(f"合同缺少 proto: {relative}")
            subprocess.run(
                ["protoc", "-I", str(source), f"--java_out={temporary}", *(str(file) for file in files)],
                check=True,
            )
            count += len(files)
        generated = list(temporary.rglob("*.java"))
        if len(generated) != count:
            raise SystemExit(f"Java proto 数量不一致: 输入 {count}，输出 {len(generated)}")
        if OUTPUT.exists() and tree_digest(OUTPUT) == tree_digest(temporary):
            print(f"Java protobuf 生成无差异：{count} 个合同，SHA-256 {tree_digest(temporary)}")
            return
        if OUTPUT.exists():
            shutil.rmtree(OUTPUT)
        temporary.rename(OUTPUT)
        print(f"Java protobuf 已生成：{count} 个合同，SHA-256 {tree_digest(OUTPUT)}")
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)


if __name__ == "__main__":
    main()
