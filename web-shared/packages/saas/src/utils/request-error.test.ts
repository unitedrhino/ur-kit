/** 请求错误提示回归：覆盖后台原因、未知异常以及请求层与页面的提示去重。 */
import { describe, expect, it, vi } from 'vitest';
import { getRequestErrorMessage, markRequestErrorHandled, notifyRequestError } from './request-error';

describe('请求错误提示', () => {
  it('优先展示后台原因，忽略非文字响应字段', () => {
    expect(getRequestErrorMessage({ msg: '权限不足', message: '失败' }, () => '保存失败')).toBe('权限不足');
    expect(getRequestErrorMessage({ response: { data: { error: {}, msg: '禁止操作' } }, message: 'HTTP 403' }, () => '保存失败')).toBe('禁止操作');
    expect(getRequestErrorMessage({ error: '权限不足', message: '请求失败' }, () => '保存失败')).toBe('权限不足');
    expect(getRequestErrorMessage({ response: { data: { error: '禁止操作', message: 'HTTP 403' } } }, () => '保存失败')).toBe('禁止操作');
    expect(getRequestErrorMessage(null, () => 'Save failed')).toBe('Save failed');
    expect(getRequestErrorMessage({ msg: ' ' }, () => '保存失败')).toBe('保存失败');
  });
  it('请求层已处理时不显示本地兜底，也不求值兜底', () => {
    const error = { msg: '权限不足' };
    const notify = vi.fn();
    const fallback = vi.fn(() => '保存失败');
    markRequestErrorHandled(error);
    notifyRequestError(error, fallback, notify);
    expect(notify).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
    expect(error).toEqual({ msg: '权限不足' });
  });
  it('本地异常保留一次提示，后续捕获不重复显示', () => {
    const error = new Error('本地文件解析失败');
    const notify = vi.fn();
    notifyRequestError(error, () => '保存失败', notify);
    notifyRequestError(error, () => '操作失败', notify);
    expect(notify).toHaveBeenCalledExactlyOnceWith('本地文件解析失败');
  });
  it('两个独立请求的相同错误分别提示', () => {
    const notify = vi.fn();
    notifyRequestError({ msg: '权限不足' }, () => '保存失败', notify);
    notifyRequestError({ msg: '权限不足' }, () => '保存失败', notify);
    expect(notify).toHaveBeenCalledTimes(2);
  });
});
