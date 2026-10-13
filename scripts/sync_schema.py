#!/usr/bin/env python3
"""按合同锁定的 SaaS 提交同步完整物模型纯值语义与原始对照快照。"""

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = "backend/things/share/domain/schema"
FILES = (
    "affordance.go", "ai.go", "ai_test.go", "baseParam.go", "define.go",
    "inference.go", "inference_test.go", "init.go", "model.go",
    "modelParam.go", "modelSimple.go", "modifyCheck.go", "schema_test.go", "validate.go",
    "validate_thingmodel_test.go",
)
IMPORTS = {
    "gitee.com/unitedrhino/share/def": "github.com/unitedrhino/ur-kit/things/sdk/schema/compat/def",
    "gitee.com/unitedrhino/share/errors": "github.com/unitedrhino/ur-kit/things/sdk/schema/compat/errors",
    "gitee.com/unitedrhino/share/utils": "github.com/unitedrhino/ur-kit/things/sdk/schema/compat/utils",
}


def git(repo: Path, *args: str) -> bytes:
    """从指定 Git 仓读取固定提交，不依赖当前工作区文件。"""
    return subprocess.check_output(["git", "-C", str(repo), *args])


def main() -> None:
    """同步源快照和可编译模型代码，并拒绝与合同清单不同的提交。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--saas", required=True, type=Path, help="SaaS Git 仓库路径")
    parser.add_argument("--sha", required=True, help="40 位 SaaS commit SHA")
    args = parser.parse_args()
    repo = args.saas.resolve()
    sha = git(repo, "rev-parse", "--verify", f"{args.sha}^{{commit}}").decode().strip()
    locked = json.loads((ROOT / "contracts/manifest.json").read_text())["saas_commit"]
    if sha != args.sha or sha != locked:
        parser.error("来源必须与 contracts/manifest.json 的完整 SaaS 提交一致")
    upstream = ROOT / "things/sdk/upstream/schema"
    public = ROOT / "things/sdk/schema"
    upstream.mkdir(parents=True, exist_ok=True)
    public.mkdir(parents=True, exist_ok=True)
    formatter = shutil.which("gofmt") or "/usr/local/go/bin/gofmt"
    if not Path(formatter).is_file():
        parser.error("找不到 gofmt，请安装 Go 工具链")
    checksums: dict[str, str] = {}
    for name in FILES:
        original = git(repo, "show", f"{sha}:{SOURCE}/{name}")
        (upstream / name).write_bytes(original)
        checksums[name] = hashlib.sha256(original).hexdigest()
        content = original.decode().replace("\r\n", "\n")
        for old, new in IMPORTS.items():
            content = content.replace(old, new)
        if not content.startswith("// 文件说明："):
            content = f"// 文件说明：从 SaaS 固定提交移植 {name} 的物模型语义。\n" + content
        generated = public / name
        generated.write_text(content)
        subprocess.run([formatter, "-w", str(generated)], check=True)
    manifest = {"saas_commit": sha, "files": checksums}
    (upstream / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
    print(f"同步 {len(FILES)} 个物模型源码文件，来源 {sha}")


if __name__ == "__main__":
    main()
