// 文件说明：为设备 AI 提供只读能力视图；不改变完整物模型、共享缓存或普通 App 控制权限。
package schema

import "github.com/unitedrhino/ur-kit/things/sdk/schema/compat/def"

// ForAI 返回仅包含明确开启联动项的新视图；关闭、零值和未知值不开放给 AI。
// 先由设备级定义覆盖产品级定义再调用本方法，避免隐藏设备覆盖项后又暴露产品原项。
// 属性仍保留读写模式；行为只允许下行（空方向按现有兼容规则视为下行）。
// 返回值供只读查询，嵌套类型定义复用原值；本方法不修改输入或其内部索引。
func (m *Model) ForAI() *Model {
	view := &Model{Property: PropertyMap{}, Event: EventMap{}, Action: ActionMap{}}
	if m == nil {
		return view
	}
	view.Profile, view.Version = m.Profile, m.Version
	for _, p := range m.Properties {
		if p.IsCanSceneLinkage == def.True {
			view.Properties = append(view.Properties, p)
		}
	}
	for _, e := range m.Events {
		if e.IsCanSceneLinkage == def.True {
			view.Events = append(view.Events, e)
		}
	}
	for _, a := range m.Actions {
		if a.IsCanSceneLinkage == def.True && (a.Dir == ActionDirDown || a.Dir == "") {
			view.Actions = append(view.Actions, a)
		}
	}
	for i := range view.Properties {
		view.Property[view.Properties[i].Identifier] = &view.Properties[i]
	}
	for i := range view.Events {
		view.Event[view.Events[i].Identifier] = &view.Events[i]
	}
	for i := range view.Actions {
		view.Action[view.Actions[i].Identifier] = &view.Actions[i]
	}
	return view
}
