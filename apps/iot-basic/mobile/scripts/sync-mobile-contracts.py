#!/usr/bin/env python3
"""从固定 SaaS 提交同步移动端独立 HTTP 合同，不改变公共 RPC 快照。"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--saas', type=Path, required=True)
parser.add_argument('--sha', required=True)
args = parser.parse_args()
sha = subprocess.check_output(['git', '-C', str(args.saas), 'rev-parse', '--verify', args.sha + '^{commit}'], text=True).strip()
if sha != args.sha or len(sha) != 40:
    parser.error('必须提供完整提交 SHA')
out = Path(__file__).resolve().parent.parent / 'contracts'
out.mkdir(exist_ok=True)
files = {}
for name in ('core-api.json', 'things-api.json'):
    data = subprocess.check_output(['git', '-C', str(args.saas), 'show', f'{sha}:backend/.swagger/{name}'])
    json.loads(data)
    (out / name).write_bytes(data)
    files[name] = hashlib.sha256(data).hexdigest()
(out / 'manifest.json').write_text(json.dumps({'saasCommit': sha, 'files': files}, ensure_ascii=False, indent=2) + '\n')
print('已同步移动端 HTTP 合同', sha)
