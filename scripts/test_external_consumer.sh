#!/usr/bin/env bash
# 本脚本在仓外 Go 模块中验证纯 RPC 客户端及全部公开 Go 包不依赖私有仓。
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version=""
if [[ $# -eq 2 && "$1" == "--version" ]]; then
  version="$2"
  if [[ ! "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo '版本必须是 vX.Y.Z 格式' >&2
    exit 2
  fi
elif [[ $# -ne 0 ]]; then
  echo '用法: bash scripts/test_external_consumer.sh [--version vX.Y.Z]' >&2
  exit 2
fi
consumer_dir="$(mktemp -d)"
trap 'rm -rf "$consumer_dir"' EXIT
go_bin="${GO_BIN:-go}"
if ! command -v "$go_bin" >/dev/null 2>&1 && [[ -x /usr/local/go/bin/go ]]; then
  go_bin=/usr/local/go/bin/go
fi

cp "$repo_dir"/tests/consumer/*_test.go "$consumer_dir/"
cd "$consumer_dir"
GOWORK=off "$go_bin" mod init example.com/urkit-consumer >/dev/null
if [[ -n "$version" ]]; then
  GOWORK=off "$go_bin" get "github.com/unitedrhino/ur-kit@$version"
else
  GOWORK=off "$go_bin" mod edit -replace "github.com/unitedrhino/ur-kit=$repo_dir"
fi
GOWORK=off "$go_bin" mod tidy
GOWORK=off "$go_bin" test -count=1 ./...
# 覆盖所有公开包和测试依赖；不能只验证示例恰好导入的子集。
GOWORK=off "$go_bin" list -mod=mod -deps -test github.com/unitedrhino/ur-kit/... > "$consumer_dir/dependencies.txt"
GOWORK=off "$go_bin" list -m all > "$consumer_dir/modules.txt"
if grep -E '^(gitee\.com/unitedrhino(/|$)|github\.com/unitedrhino/(saas|core|things|share)(/|[[:space:]]|$))' "$consumer_dir/dependencies.txt" "$consumer_dir/modules.txt"; then
  echo '公开消费包意外依赖 SaaS 私有模块' >&2
  exit 1
fi
