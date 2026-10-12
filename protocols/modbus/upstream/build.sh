#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$(basename "$SCRIPT_DIR")"
cd "$ROOT_DIR"
PROTO_FILE="$(find "$SERVICE_DIR/proto" -maxdepth 1 -name '*.proto' | head -n1)"
echo "Generating gRPC code for ${SERVICE_DIR}..."
goctl rpc protoc "$PROTO_FILE" \
    --go_out="./$SERVICE_DIR" --go-grpc_out="./$SERVICE_DIR" --zrpc_out="./$SERVICE_DIR" \
    --style=goZero --module gitee.com/unitedrhino/protocol -m
echo "Build complete for ${SERVICE_DIR}"
