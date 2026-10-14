#!/usr/bin/env bash
# 本脚本在临时仓外 Go 模块中测试公开缓存、Things SDK 与 Modbus 的依赖边界。
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

cp "$repo_dir/tests/consumer/consumer_test.go" "$consumer_dir/consumer_test.go"
cd "$consumer_dir"
GOWORK=off "$go_bin" mod init example.com/urkit-consumer >/dev/null
if [[ -n "$version" ]]; then
  GOWORK=off "$go_bin" get "github.com/unitedrhino/ur-kit@$version"
else
  GOWORK=off "$go_bin" mod edit -replace "github.com/unitedrhino/ur-kit=$repo_dir"
fi
GOWORK=off "$go_bin" mod tidy
GOWORK=off "$go_bin" test -count=1 ./...
GOWORK=off "$go_bin" list -deps ./... > "$consumer_dir/dependencies.txt"
if grep -E '^gitee\.com/unitedrhino(/|$)' "$consumer_dir/dependencies.txt"; then
  echo '公开消费包意外依赖 SaaS 私有模块' >&2
  exit 1
fi
