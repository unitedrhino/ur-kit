// 本文件为公开物模型保留平台参数错误和未找到错误的数字语义。
package errors

import (
	"errors"
	"fmt"
)

// CodeError 是可跨服务识别的平台业务错误。
type CodeError struct {
	Code int64  `json:"code"`
	Msg  string `json:"msg"`
}

// Error 返回含错误码和详情的可读文本。
func (e *CodeError) Error() string {
	if e == nil {
		return ""
	}
	return fmt.Sprintf("%d: %s", e.Code, e.Msg)
}

// WithMsg 复制错误码并替换说明，避免修改共享模板。
func (e CodeError) WithMsg(message string) *CodeError { e.Msg = message; return &e }

// WithMsgf 用格式化说明创建同码错误。
func (e CodeError) WithMsgf(format string, args ...any) *CodeError {
	return e.WithMsg(fmt.Sprintf(format, args...))
}

// AddMsgf 将上下文附加到原错误说明。
func (e CodeError) AddMsgf(format string, args ...any) *CodeError {
	e.Msg += ": " + fmt.Sprintf(format, args...)
	return &e
}

// AddDetail 将取值错误的上下文附加到说明。
func (e CodeError) AddDetail(args ...any) *CodeError { e.Msg += ": " + fmt.Sprint(args...); return &e }

// Parameter 是平台参数错误码 100006。
var Parameter = &CodeError{Code: 100006, Msg: "参数错误"}

// NotFind 是平台未找到错误码 100009。
var NotFind = &CodeError{Code: 100009, Msg: "未找到"}

// Fmt 将普通错误转换为平台业务错误，同时保留已有错误码。
func Fmt(err error) *CodeError {
	var coded *CodeError
	if errors.As(err, &coded) {
		return coded
	}
	if err == nil {
		return nil
	}
	return &CodeError{Code: 100001, Msg: err.Error()}
}

// Cmp 按平台错误码比较两个错误。
func Cmp(left error, right error) bool {
	var l, r *CodeError
	return errors.As(left, &l) && errors.As(right, &r) && l.Code == r.Code
}
