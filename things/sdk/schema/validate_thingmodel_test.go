// 文件说明：从 SaaS 固定提交移植 validate_thingmodel_test.go 的物模型语义。
package schema

import (
	"encoding/json"
	"testing"
)

var cjt188JSON = `{
  "version": "1.0",
  "properties": [
    {"identifier":"PostiveFlux","tag":1,"name":"当前累积流量","desc":"正向累积流量","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"m³"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"ValveStatus","tag":1,"name":"阀门状态","desc":"当前阀门状态","mode":"r","define":{"type":"enum","mapping":{"0":"开","1":"关","2":"故障"}},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"ValveCtrl","tag":1,"name":"阀门控制","desc":"远程控制阀门开关","mode":"rw","define":{"type":"enum","mapping":{"0":"开阀","1":"关阀"}},"funcGroup":1,"userPerm":3,"controlMode":1,"recordMode":1,"isPassword":2}
  ],
  "events": [],
  "actions": [],
  "profile": {"productID": ""}
}`

var dlt645JSON = `{
  "version": "1.0",
  "properties": [
    {"identifier":"PFc","tag":1,"name":"C相功率因素","desc":"","mode":"r","define":{"type":"float","min":"-1","max":"1","step":"0.001"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"TotalEnergyRate2","tag":1,"name":"组合有功总电能费率2","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"PFb","tag":1,"name":"B相功率因素","desc":"","mode":"r","define":{"type":"float","min":"-1","max":"1","step":"0.001"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"S","tag":1,"name":"总视在功率","desc":"","mode":"r","define":{"type":"float","min":"0","max":"9999999","step":"0.001","unit":"kVA"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Sa","tag":1,"name":"A相视在功率","desc":"","mode":"r","define":{"type":"float","min":"0","max":"9999999","step":"0.001","unit":"kVA"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"EPRate2","tag":1,"name":"正向有功总电能费率2","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Ib","tag":1,"name":"B相电流","desc":"","mode":"r","define":{"type":"float","min":"0","max":"1000","step":"0.001","unit":"A"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Q","tag":1,"name":"总无功功率","desc":"","mode":"r","define":{"type":"float","min":"-9999999","max":"9999999","step":"0.001","unit":"kvar"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Qa","tag":1,"name":"A相无功功率","desc":"","mode":"r","define":{"type":"float","min":"-9999999","max":"9999999","step":"0.001","unit":"kvar"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Qb","tag":1,"name":"B相无功功率","desc":"","mode":"r","define":{"type":"float","min":"-9999999","max":"9999999","step":"0.001","unit":"kvar"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Freq","tag":1,"name":"电网频率","desc":"","mode":"r","define":{"type":"float","min":"45","max":"65","step":"0.01","unit":"Hz"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"TotalEnergyRate3","tag":1,"name":"组合有功总电能费率3","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"EP","tag":1,"name":"正向有功总电能","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Pa","tag":1,"name":"A相有功功率","desc":"","mode":"r","define":{"type":"float","min":"-9999999","max":"9999999","step":"0.001","unit":"kW"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"EPRate4","tag":1,"name":"正向有功总电能费率4","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Uc","tag":1,"name":"C相电压","desc":"","mode":"r","define":{"type":"float","min":"0","max":"500","step":"0.1","unit":"V"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"EQ","tag":1,"name":"反向有功总电能","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Ub","tag":1,"name":"B相电压","desc":"","mode":"r","define":{"type":"float","min":"0","max":"500","step":"0.1","unit":"V"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Ic","tag":1,"name":"C相电流","desc":"","mode":"r","define":{"type":"float","min":"0","max":"1000","step":"0.001","unit":"A"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"TotalEnergy","tag":1,"name":"组合有功总电能","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"EPRate1","tag":1,"name":"正向有功总电能费率1","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"P","tag":1,"name":"总有功功率","desc":"","mode":"r","define":{"type":"float","min":"-9999999","max":"9999999","step":"0.001","unit":"kW"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Pb","tag":1,"name":"B相有功功率","desc":"","mode":"r","define":{"type":"float","min":"-9999999","max":"9999999","step":"0.001","unit":"kW"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Qc","tag":1,"name":"C相无功功率","desc":"","mode":"r","define":{"type":"float","min":"-9999999","max":"9999999","step":"0.001","unit":"kvar"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Sb","tag":1,"name":"B相视在功率","desc":"","mode":"r","define":{"type":"float","min":"0","max":"9999999","step":"0.001","unit":"kVA"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"TotalEnergyRate1","tag":1,"name":"组合有功总电能费率1","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Ia","tag":1,"name":"A相电流","desc":"","mode":"r","define":{"type":"float","min":"0","max":"1000","step":"0.001","unit":"A"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"PF","tag":1,"name":"总功率因素","desc":"","mode":"r","define":{"type":"float","min":"-1","max":"1","step":"0.001"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"TotalEnergyRate4","tag":1,"name":"组合有功总电能费率4","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Ua","tag":1,"name":"A相电压","desc":"","mode":"r","define":{"type":"float","min":"0","max":"500","step":"0.1","unit":"V"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Sc","tag":1,"name":"C相视在功率","desc":"","mode":"r","define":{"type":"float","min":"0","max":"9999999","step":"0.001","unit":"kVA"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"PFa","tag":1,"name":"A相功率因素","desc":"","mode":"r","define":{"type":"float","min":"-1","max":"1","step":"0.001"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"EPRate3","tag":1,"name":"正向有功总电能费率3","desc":"","mode":"r","define":{"type":"float","min":"0","max":"99999999","step":"0.01","unit":"kWh"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Pc","tag":1,"name":"C相有功功率","desc":"","mode":"r","define":{"type":"float","min":"-9999999","max":"9999999","step":"0.001","unit":"kW"},"funcGroup":1,"userPerm":1,"controlMode":1,"recordMode":1,"isPassword":2},
    {"identifier":"Relay","tag":1,"name":"跳合闸控制","desc":"跳合闸远程控制","mode":"rw","define":{"type":"enum","mapping":{"0":"合闸","1":"跳闸"}},"funcGroup":1,"userPerm":3,"controlMode":1,"recordMode":1,"isPassword":2}
  ],
  "events": [
    {"identifier":"PowerAlarm","tag":1,"name":"电量告警","desc":"电量异常告警","type":"alert","dir":"up","params":[
      {"identifier":"AlarmType","name":"告警类型","define":{"type":"enum","mapping":{"1":"过压","2":"欠压","3":"过流","4":"电量不足"}}},
      {"identifier":"AlarmValue","name":"告警值","define":{"type":"float","min":"0","max":"99999999","step":"0.001"}}
    ]}
  ],
  "actions": [],
  "profile": {"productID": ""}
}`

func TestValidateThingModel(t *testing.T) {
	tests := []struct {
		name    string
		jsonStr string
	}{
		{"CJT188水表", cjt188JSON},
		{"DLT645三相电表", dlt645JSON},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			model, err := ValidateWithFmt([]byte(tt.jsonStr))
			if err != nil {
				t.Fatalf("校验失败: %v", err)
			}
			out, _ := json.MarshalIndent(model, "", "  ")
			t.Logf("校验通过，属性数量=%d\n%s", len(model.Properties), string(out))
		})
	}
}
