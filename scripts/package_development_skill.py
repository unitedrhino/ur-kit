#!/usr/bin/env python3
"""从固定 Git 提交打包开发技能，并将仓内源码链接固定到公开提交。"""

import argparse
import hashlib
import json
import posixpath
import re
import subprocess
import zipfile
from pathlib import Path
from urllib.parse import quote, urlsplit


# ROOT 是套件检出根目录；打包内容通过 Git 读取，不包含本机未提交文件。
ROOT = Path(__file__).resolve().parent.parent
# SKILL_PATH 是唯一受本脚本管理的现有技能，不产生新的技能入口。
SKILL_PATH = ".agents/skills/ur-kit-development"
# REPOSITORY 是打包技能引用的公开代码源。
REPOSITORY = "https://github.com/unitedrhino/ur-kit"
# LINK 匹配现有技能中的 Markdown 行内链接，保留标签与锚点。
LINK = re.compile(r"(\[[^\]\n]*\]\()([^\s)]+)(\))")


def git(*args):
    """git 在套件根目录执行只读 Git 命令，返回标准输出字节。"""
    return subprocess.check_output(["git", "-C", str(ROOT), *args])


def portable_markdown(content, source, commit):
    """portable_markdown 保留技能内相对导航，将仓内其他目标改为固定提交链接。"""
    def replace(match):
        """replace 校验当前链接在目标提交存在，并按技能内外选择路径。"""
        target = match.group(2)
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or not parsed.path:
            return match.group(0)
        resolved = posixpath.normpath(posixpath.join(posixpath.dirname(source), parsed.path))
        if resolved.startswith("../") or resolved.startswith("/"):
            raise ValueError(f"链接越出仓库：{source} -> {target}")
        kind = git("cat-file", "-t", f"{commit}:{resolved}").decode().strip()
        if resolved.startswith(SKILL_PATH + "/"):
            return match.group(0)
        route = "tree" if kind == "tree" else "blob"
        suffix = f"#{parsed.fragment}" if parsed.fragment else ""
        url = f"{REPOSITORY}/{route}/{commit}/{quote(resolved, safe='/')}{suffix}"
        return match.group(1) + url + match.group(3)

    return LINK.sub(replace, content)


def package(ref, output):
    """package 导出指定 ref 的技能和来源清单，返回 ZIP 路径与 SHA256。"""
    commit = git("rev-parse", "--verify", "--end-of-options", f"{ref}^{{commit}}").decode().strip()
    files = git("ls-tree", "-r", "--name-only", commit, "--", SKILL_PATH).decode().splitlines()
    if f"{SKILL_PATH}/SKILL.md" not in files:
        raise ValueError(f"提交 {commit} 不含开发技能入口")
    output.mkdir(parents=True, exist_ok=True)
    archive = output / f"ur-kit-development-{commit}.zip"
    # entries 始终按文件名排序，并固定 ZIP 元数据，使相同提交的包可重复校验。
    entries = {}
    for source in files:
        content = git("show", f"{commit}:{source}")
        if source.endswith(".md"):
            content = portable_markdown(content.decode(), source, commit).encode()
        name = "ur-kit-development/" + source.removeprefix(SKILL_PATH + "/")
        entries[name] = content
    entries["ur-kit-development/_meta.json"] = (json.dumps({
        "name": "ur-kit-development", "version": commit,
        "repository": REPOSITORY, "commit": commit,
    }, ensure_ascii=False, indent=2) + "\n").encode()
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as writer:
        for name, content in sorted(entries.items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            writer.writestr(info, content)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    return archive, digest


def main():
    """main 解析固定来源与输出目录，并打印可供下载验收使用的包摘要。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ref", required=True, help="明确的 Git 标签或提交，不使用浮动默认版本")
    parser.add_argument("--output", type=Path, default=ROOT / ".temp/skills", help="ZIP 输出目录")
    args = parser.parse_args()
    archive, digest = package(args.ref, args.output)
    print(json.dumps({"archive": str(archive.resolve()), "sha256": digest}, ensure_ascii=False))


if __name__ == "__main__":
    main()
