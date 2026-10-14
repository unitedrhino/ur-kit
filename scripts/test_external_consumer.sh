#!/usr/bin/env bash
# 本脚本在临时仓外 Go 模块中测试公开缓存、Things SDK 与 Modbus 的依赖边界。
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
consumer_dir="$(mktemp -d)"
trap 'rm -rf "$consumer_dir"' EXIT
go_bin="${GO_BIN:-go}"
if ! command -v "$go_bin" >/dev/null 2>&1 && [[ -x /usr/local/go/bin/go ]]; then
  go_bin=/usr/local/go/bin/go
fi

cp "$repo_dir/tests/consumer/consumer_test.go" "$consumer_dir/consumer_test.go"
cd "$consumer_dir"
GOWORK=off "$go_bin" mod init example.com/urkit-consumer >/dev/null
GOWORK=off "$go_bin" mod edit -replace "github.com/unitedrhino/ur-kit=$repo_dir"
GOWORK=off "$go_bin" mod tidy
GOWORK=off "$go_bin" test -count=1 ./...
GOWORK=off "$go_bin" list -deps ./... > "$consumer_dir/dependencies.txt"
if grep -E '^gitee\.com/unitedrhino(/|$)' "$consumer_dir/dependencies.txt"; then
  echo '公开消费包意外依赖 SaaS 私有模块' >&2
  exit 1
fi
