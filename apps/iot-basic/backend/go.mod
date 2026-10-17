module github.com/unitedrhino/ur-kit/apps/iot-basic/backend

go 1.25.0

require (
	github.com/gorilla/websocket v1.5.3
	github.com/unitedrhino/ur-kit v0.0.0
)

require (
	golang.org/x/net v0.53.0 // indirect
	golang.org/x/sys v0.43.0 // indirect
	golang.org/x/text v0.36.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260414002931-afd174a4e478 // indirect
	google.golang.org/grpc v1.82.1 // indirect
	google.golang.org/protobuf v1.36.11 // indirect
)

replace github.com/unitedrhino/ur-kit => ../../..
