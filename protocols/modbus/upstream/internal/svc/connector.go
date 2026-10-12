package svc

import (
	"fmt"
	"github.com/simonvetter/modbus"
	"time"
)

func newConnector() error {

	client, err := modbus.NewClient(&modbus.ClientConfiguration{
		URL:      fmt.Sprintf("%s://%s", "", ""),
		Speed:    1,
		DataBits: 1,
		Parity:   1,
		StopBits: 1,
		Timeout:  time.Duration(1) * time.Millisecond,
	})
	fmt.Print(client, err)
	return nil
}
