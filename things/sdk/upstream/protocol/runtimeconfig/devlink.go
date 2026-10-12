package runtimeconfig

import (
	"encoding/json"
	"reflect"
	"strings"

	"gitee.com/unitedrhino/share/conf"
	storecache "github.com/zeromicro/go-zero/core/stores/cache"
)

type Config struct {
	TimedJobRpc conf.RpcClientConf     `json:"timedJobRpc,omitempty"`
	Event       conf.EventConf         `json:"event,omitempty"`
	CacheRedis  storecache.ClusterConf `json:"cacheRedis,omitempty"`
	DevLink     conf.DevLinkConf       `json:"devLink,omitempty"`
}

func MergeConfigJSON(base Config, configJSON string) (Config, error) {
	if strings.TrimSpace(configJSON) == "" {
		return base, nil
	}

	var override Config
	if err := json.Unmarshal([]byte(configJSON), &override); err != nil {
		return Config{}, err
	}

	out := base
	mergeValue(reflect.ValueOf(&out).Elem(), reflect.ValueOf(override))
	return out, nil
}

func MergeDevLinkConfigJSON(base conf.DevLinkConf, configJSON string) (conf.DevLinkConf, error) {
	out, err := MergeConfigJSON(Config{DevLink: base}, configJSON)
	if err != nil {
		return conf.DevLinkConf{}, err
	}
	return out.DevLink, nil
}

func mergeValue(dst, src reflect.Value) {
	if !src.IsValid() || !dst.CanSet() {
		return
	}
	if src.Kind() == reflect.Ptr {
		if src.IsNil() {
			return
		}
		if dst.Kind() == reflect.Ptr {
			if dst.IsNil() {
				dst.Set(reflect.New(dst.Type().Elem()))
			}
			mergeValue(dst.Elem(), src.Elem())
			return
		}
		mergeValue(dst, src.Elem())
		return
	}
	if dst.Kind() == reflect.Ptr {
		if dst.IsNil() {
			dst.Set(reflect.New(dst.Type().Elem()))
		}
		mergeValue(dst.Elem(), src)
		return
	}

	switch src.Kind() {
	case reflect.Struct:
		for i := 0; i < src.NumField(); i++ {
			mergeValue(dst.Field(i), src.Field(i))
		}
	case reflect.Slice:
		if src.Len() > 0 {
			dst.Set(src)
		}
	case reflect.Map:
		if !src.IsNil() && src.Len() > 0 {
			dst.Set(src)
		}
	default:
		if !src.IsZero() {
			dst.Set(src)
		}
	}
}
