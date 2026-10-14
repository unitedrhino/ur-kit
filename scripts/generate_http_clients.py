#!/usr/bin/env python3
"""从锁定的 Core/Things OpenAPI 快照生成 Go、Java 和 Node HTTP 客户端。"""

import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSION = "7.8.0"
GENERATOR_SHA256 = "d1879cf42da31f8cf61cf68798b8ef2418af0c6bd93a5c1870e1ff543fbb9365"
MODULES = ("core-api", "things-api")


def generator_jar(override: str | None) -> Path:
    """查找仓库锁定版本的生成器；override 可指向同版本的本地 JAR。"""
    jar = Path(override).resolve() if override else ROOT / "apps/iot-basic/mobile/node_modules/@openapitools/openapi-generator-cli/versions" / f"{VERSION}.jar"
    if not jar.is_file() or jar.name != f"{VERSION}.jar":
        raise SystemExit(f"需要 OpenAPI Generator {VERSION}：先在 apps/iot-basic/mobile 执行 pnpm install --frozen-lockfile，或传 --jar <路径>：{jar}")
    if hashlib.sha256(jar.read_bytes()).hexdigest() != GENERATOR_SHA256:
        raise SystemExit(f"OpenAPI Generator {VERSION} JAR 校验失败：{jar}")
    return jar


def prepared_spec(name: str, temporary: Path) -> Path:
    """只修正源 Swagger 中已确认的生成器不可解析节点，原始合同保持不变。"""
    source = ROOT / "contracts/source/backend/.swagger" / f"{name}.json"
    spec = json.loads(source.read_text())
    schemas = spec["components"]["schemas"]
    bad = "ApiBatchAggResp" if name == "core-api" else "DeviceMsgPropertyBatchGetListResp"
    item = schemas[bad]["properties"]["lists"]["items"]["items"]
    if item != {"format": "UNKNOWN", "type": "invalid"}:
        raise SystemExit(f"{name}.{bad}.lists 已变化，需复核 Swagger 修正规则：{item}")
    schemas[bad]["properties"]["lists"]["items"]["items"] = {}
    if name == "things-api":
        for route in ("structure-set", "structure-notify"):
            alarm_operation = spec["paths"][f"/api/v1/things/project/alarm-source/{route}"]["post"]
            if alarm_operation.get("tags") != ["things/project/alarmSource", "thingsProjectAlarmSource"]:
                raise SystemExit(f"结构来源 {route} Swagger 标签已变化，需复核重复客户端修正规则：{alarm_operation.get('tags')}")
            # 两个原始标签归一成同一类名，生成器会为一个接口产出两份相同方法；只在客户端视图保留业务组标签。
            alarm_operation["tags"] = ["things/project/alarmSource"]
        for schema in ("DataAreaDetail", "DeviceSchemaUpdateReq"):
            empty = schemas[schema]["properties"].pop("", None)
            if not isinstance(empty, dict) or "$ref" not in empty:
                raise SystemExit(f"{name}.{schema} 的空字段已变化，需复核")
    target = temporary / f"{name}.json"
    target.write_text(json.dumps(spec, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n")
    return target


def generate(jar: Path, name: str, language: str, spec: Path, temporary: Path, output: Path) -> None:
    """调用固定版本生成器并仅保留可编译客户端源码。"""
    raw = temporary / f"raw-{language}-{name}"
    module = "core" if name == "core-api" else "things"
    if language == "go":
        props = f"packageName={module}api,hideGenerationTimestamp=true"
    elif language == "java":
        prefix = f"com.unitedrhino.urkit.openapi.{module}"
        props = f"library=native,invokerPackage={prefix}.client,apiPackage={prefix}.api,modelPackage={prefix}.model,groupId=com.unitedrhino,artifactId=ur-kit-openapi-{module},artifactVersion=0.2.2,hideGenerationTimestamp=true"
    else:
        props = "supportsES6=true,typescriptThreePlus=true,hideGenerationTimestamp=true"
    command = ["java", "-jar", str(jar), "generate", "-i", str(spec), "-g", "typescript-fetch" if language == "node" else language,
               "-o", str(raw), "--skip-validate-spec", f"--additional-properties={props}",
               "--global-property=apis,models,supportingFiles,apiDocs=false,modelDocs=false,apiTests=false,modelTests=false"]
    result = subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.returncode:
        raise SystemExit(f"生成 {language}/{name} 失败：\n{result.stdout[-4000:]}")
    dest = output / language / module
    dest.mkdir(parents=True)
    if language == "go":
        files = list(raw.glob("*.go"))
        if len(files) < 10:
            raise SystemExit(f"{language}/{name} 生成文件不完整")
        for file in files:
            shutil.copy2(file, dest / file.name)
    elif language == "java":
        shutil.copytree(raw / "src/main/java", dest / "src/main/java")
        shutil.copy2(raw / "pom.xml", dest / "pom.xml")
    else:
        for entry in ("index.ts", "runtime.ts", "apis", "models"):
            src = raw / entry
            if src.is_dir():
                shutil.copytree(src, dest / entry)
            else:
                shutil.copy2(src, dest / entry)
    print(f"生成 {language}/{module}")


def normalize_generated(staging: Path) -> None:
    """去掉生成器留下的行尾空格，使源码满足 Git 差异检查。"""
    for path in staging.rglob("*"):
        if path.is_file():
            lines = path.read_text().splitlines()
            lines = [line.rstrip(" \t") for line in lines]
            while lines and not lines[-1]:
                lines.pop()
            path.write_text("\n".join(lines) + "\n")


def main() -> None:
    """先在临时目录完整生成六组源码，再替换目标目录，避免失败留下半成品。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jar", help="OpenAPI Generator 7.8.0 JAR 的本地路径")
    parser.add_argument("--output", type=Path, default=ROOT / "sdks/openapi", help="生成源码目录")
    args = parser.parse_args()
    jar = generator_jar(args.jar)
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ur-kit-openapi-", dir=output.parent) as temporary_name:
        temporary = Path(temporary_name)
        staging = temporary / "generated"
        staging.mkdir()
        for name in MODULES:
            spec = prepared_spec(name, temporary)
            for language in ("go", "java", "node"):
                generate(jar, name, language, spec, temporary, staging)
        normalize_generated(staging)
        for relative in ("README.md", "http_clients_test.go", "node/package.json", "node/package-lock.json", "node/tsconfig.json", "node/generated.test.cjs"):
            source = output / relative
            if source.is_file():
                destination = staging / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, destination)
        java_tests = output / "java/things/src/test/java"
        if java_tests.is_dir():
            shutil.copytree(java_tests, staging / "java/things/src/test/java")
        go_contract_tests = output / "go/contracttest"
        if go_contract_tests.is_dir():
            shutil.copytree(go_contract_tests, staging / "go/contracttest")
        backup = temporary / "previous"
        if output.exists():
            output.rename(backup)
        try:
            staging.rename(output)
        except BaseException:
            if backup.exists() and not output.exists():
                backup.rename(output)
            raise


if __name__ == "__main__":
    main()
