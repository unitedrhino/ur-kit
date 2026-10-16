#!/usr/bin/env python3
"""从固定合同快照按服务生成 Java protobuf 消息及 gRPC Stub。"""

from __future__ import annotations

import hashlib
import os
import platform
import shutil
import subprocess
import tempfile
import urllib.request
from pathlib import Path


# REPO 指向公共仓根目录；SOURCE 是 SaaS 指定提交导出的合同快照。
REPO = Path(__file__).resolve().parents[1]
SOURCE = REPO / "contracts/source/backend"
# OUTPUT 只保存可重复生成的 Maven 构建产物，不写入 Git。
OUTPUT = REPO / "sdks/java/target/generated-sources/urkit/java"
# PROTO_DIRS 按服务分组，避免同名短路径导入相互冲突。
PROTO_DIRS = (
    "core/service/aisvr/proto",
    "core/service/imsvr/proto",
    "core/service/syssvr/proto",
    "core/service/timedsvr/proto",
    "things/service/dmsvr/proto",
    "things/service/udsvr/proto",
    "things/share/rpcs/protocolSync/proto",
)
# GRPC_PLUGIN 固定生成器版本和校验值，避免下载内容变化影响发布产物。
GRPC_PLUGIN_VERSION = "1.75.0"
GRPC_PLUGIN_SHA256 = "59366fb58a19efd4e3674c1568e94ef167816151acfaad02fa4ef04bbcab293d"
# WELL_KNOWN_HASHES 核验25.6官方标准定义；避免独立编译器误用系统旧include。
WELL_KNOWN_HASHES = {
    "google/protobuf/wrappers.proto": "a26c1d6ec73a592ac31796289a61ceffe2db2453ff427dfdd7697aac50844280",
    "google/protobuf/descriptor.proto": "a39cb2a57423cf1e83a00dc7bcca4b1b74bcbebc28e95586977dbc2af636fabc",
}


def java_protoc() -> str:
    """取得Java专用编译器并在改写产物前核验版本；允许显式路径而不更改Go工具链。"""
    requested = os.environ.get("UR_KIT_JAVA_PROTOC", "protoc")
    executable = shutil.which(requested)
    if executable is None:
        raise SystemExit("需要 protoc 25.6；可设置 UR_KIT_JAVA_PROTOC 为独立编译器路径")
    version = subprocess.check_output([executable, "--version"], text=True).strip()
    if version != "libprotoc 25.6":
        raise SystemExit("Java生成需 libprotoc 25.6，与 protobuf-java 3.25.6 匹配；禁止使用旧gencode安全绕过")
    return executable


def java_include(protoc: str) -> Path:
    """取得匹配编译器的标准定义目录；显式覆盖或完整发行包include均须匹配固定摘要。"""
    override = os.environ.get("UR_KIT_JAVA_PROTOC_INCLUDE")
    include = Path(override).resolve() if override else Path(protoc).resolve().parent.parent / "include"
    for relative, expected in WELL_KNOWN_HASHES.items():
        source = include / relative
        if not source.is_file() or hashlib.sha256(source.read_bytes()).hexdigest() != expected:
            raise SystemExit("缺少匹配25.6的标准Proto定义；请按Java SDK说明设置 UR_KIT_JAVA_PROTOC_INCLUDE")
    return include


def grpc_plugin() -> Path:
    """取得已校验的 Linux x86_64 gRPC 生成器；其他平台可提供显式路径。"""
    override = os.environ.get("UR_KIT_GRPC_JAVA_PLUGIN")
    if override:
        plugin = Path(override).resolve()
        if not plugin.is_file() or not os.access(plugin, os.X_OK):
            raise SystemExit(f"gRPC Java 生成器不可执行: {plugin}")
        return plugin
    if platform.system() != "Linux" or platform.machine() not in ("x86_64", "amd64"):
        raise SystemExit("当前平台请设置 UR_KIT_GRPC_JAVA_PLUGIN 为 protoc-gen-grpc-java 路径")
    plugin = REPO / "sdks/java/target/tools/protoc-gen-grpc-java"
    if plugin.is_file() and hashlib.sha256(plugin.read_bytes()).hexdigest() == GRPC_PLUGIN_SHA256:
        return plugin
    plugin.parent.mkdir(parents=True, exist_ok=True)
    url = ("https://repo.maven.apache.org/maven2/io/grpc/protoc-gen-grpc-java/"
           f"{GRPC_PLUGIN_VERSION}/protoc-gen-grpc-java-{GRPC_PLUGIN_VERSION}-linux-x86_64.exe")
    with urllib.request.urlopen(url, timeout=60) as response:
        contents = response.read()
    if hashlib.sha256(contents).hexdigest() != GRPC_PLUGIN_SHA256:
        raise SystemExit("gRPC Java 生成器 SHA-256 校验失败")
    plugin.write_bytes(contents)
    plugin.chmod(0o755)
    return plugin


def tree_digest(directory: Path) -> str:
    """按相对路径和文件内容计算稳定哈希，比较重复生成结果。"""
    digest = hashlib.sha256()
    for file in sorted(directory.rglob("*.java")):
        digest.update(str(file.relative_to(directory)).encode())
        digest.update(file.read_bytes())
    return digest.hexdigest()


def main() -> None:
    """校验 proto 与 protoc，完整生成消息及服务 Stub 后替换 Java 生成目录。"""
    protoc = java_protoc()
    include = java_include(protoc)
    plugin = grpc_plugin()
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
                [protoc, "-I", str(source), "-I", str(include), f"--java_out={temporary}",
                 f"--plugin=protoc-gen-grpc-java={plugin}", f"--grpc-java_out={temporary}",
                 *(str(file) for file in files)],
                check=True,
            )
            count += len(files)
        generated = list(temporary.rglob("*.java"))
        messages = [file for file in generated if not file.name.endswith("Grpc.java")]
        stubs = [file for file in generated if file.name.endswith("Grpc.java")]
        if len(messages) != count or not stubs:
            raise SystemExit(f"Java proto 数量不一致: 输入 {count}，消息 {len(messages)}，服务 {len(stubs)}")
        if OUTPUT.exists() and tree_digest(OUTPUT) == tree_digest(temporary):
            print(f"Java protobuf 生成无差异：{count} 个消息，{len(stubs)} 个服务 Stub，SHA-256 {tree_digest(temporary)}")
            return
        if OUTPUT.exists():
            shutil.rmtree(OUTPUT)
        temporary.rename(OUTPUT)
        print(f"Java protobuf 已生成：{count} 个消息，{len(stubs)} 个服务 Stub，SHA-256 {tree_digest(OUTPUT)}")
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)


if __name__ == "__main__":
    main()
