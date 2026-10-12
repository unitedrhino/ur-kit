/**
 * 文件说明：axios 请求链回归基线测试（OWASP 依赖漏洞治理 · 阶段零）
 *
 * 覆盖依赖与调用点：
 * - `axios`（packages/effects/request/src/request-client/request-client.ts，经 axios.create 创建实例）：
 *   请求拦截器（addRequestInterceptor 注入认证头）、响应拦截器（addResponseInterceptor 转换/错误传播）、
 *   HTTP 错误时 request() 抛出 error.response.data、paramsSerializer 四种序列化、默认配置合并。
 *
 * 目的：在阶段三/四升级 axios 版本前后各运行一次，确认拦截器与请求链行为不回归。
 * 本文件不修改任何依赖版本，仅作为升级回归对照基线。
 */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { InterceptorManager } from './modules/interceptor';

import { RequestClient } from './request-client';

describe('axios 请求链回归基线（拦截器与错误处理）', () => {
  let mock: MockAdapter;
  let requestClient: RequestClient;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    requestClient = new RequestClient();
  });

  afterEach(() => {
    mock.reset();
  });

  it('请求拦截器应能向请求注入认证头', async () => {
    // 模拟认证拦截器：与业务 requestClient 注入 token 头的用法一致
    requestClient.addRequestInterceptor({
      fulfilled: (config) => {
        config.headers = config.headers ?? {};
        config.headers.Authorization = 'Bearer test-token';
        return config;
      },
    });
    let capturedAuth: string | undefined;
    mock.onGet('/auth-check').reply((config) => {
      capturedAuth = config.headers?.Authorization as string;
      return [200, { ok: true }];
    });

    const res = await requestClient.get('/auth-check');
    expect(res.data).toEqual({ ok: true });
    expect(capturedAuth).toBe('Bearer test-token');
  });

  it('请求拦截器 rejected 应吞掉请求并走错误分支', async () => {
    requestClient.addRequestInterceptor({
      fulfilled: (config) => config,
      rejected: (error) => Promise.reject(new Error('interceptor-rejected')),
    });
    await expect(requestClient.get('/never-reached')).rejects.toThrow('interceptor-rejected');
  });

  it('响应拦截器 fulfilled 应转换响应数据', async () => {
    mock.onGet('/wrap').reply(200, { code: 0, data: { value: 42 } });
    requestClient.addResponseInterceptor({
      fulfilled: (response) => {
        // 模拟业务层解包 { code, data } 的响应拦截器
        return { ...response, data: (response.data as any).data };
      },
    });

    const res = await requestClient.get('/wrap');
    expect(res.data).toEqual({ value: 42 });
  });

  it('HTTP 500 时 request() 应抛出响应体（error.response.data）', async () => {
    mock.onGet('/boom').reply(500, { message: 'boom-body' });
    await expect(requestClient.get('/boom')).rejects.toEqual({ message: 'boom-body' });
  });

  it('无 response 的网络错误应原样抛出 AxiosError', async () => {
    mock.onGet('/net-error').networkError();
    // happy-dom 环境下 AxiosError 不带 code 字段，只保留 message 与 isAxiosError 标记
    await expect(requestClient.get('/net-error')).rejects.toMatchObject({
      isAxiosError: true,
      message: 'Network Error',
    });
  });

  it.each(['brackets', 'comma', 'indices', 'repeat'] as const)(
    'paramsSerializer=%s 应按约定序列化数组参数',
    async (mode) => {
      const client = new RequestClient({ paramsSerializer: mode });
      // 经 instance.getUri 走 axios 真实 paramsSerializer 装配链路
      const uri = client.instance.getUri({ url: '/list', params: { ids: [1, 2, 3] } });
      const query = decodeURIComponent(uri.split('?')[1] ?? '');
      if (mode === 'brackets') {
        expect(query).toBe('ids[]=1&ids[]=2&ids[]=3');
      } else if (mode === 'comma') {
        expect(query).toBe('ids=1,2,3');
      } else if (mode === 'indices') {
        expect(query).toBe('ids[0]=1&ids[1]=2&ids[2]=3');
      } else {
        expect(query).toBe('ids=1&ids=2&ids=3');
      }
    },
  );

  it('默认配置合并：JSON Content-Type 与默认超时 10s', () => {
    // merge 来自 @vben/utils（lodash.merge 封装），同时覆盖 lodash 合并调用面
    const defaults = requestClient.instance.defaults;
    expect(defaults.headers['Content-Type']).toBe('application/json;charset=utf-8');
    expect(defaults.timeout).toBe(10_000);
  });

  it('自定义配置应与默认配置深度合并', () => {
    const client = new RequestClient({ timeout: 5000 });
    expect(client.instance.defaults.timeout).toBe(5000);
    // 默认 Content-Type 不因传入其它配置而丢失
    expect(client.instance.defaults.headers['Content-Type']).toBe('application/json;charset=utf-8');
  });
});

describe('InterceptorManager 拦截器挂载', () => {
  it('应把请求/响应拦截器挂到指定 axios 实例', async () => {
    const instance = axios.create();
    const manager = new InterceptorManager(instance);
    manager.addRequestInterceptor({
      fulfilled: (config) => {
        config.headers['X-Marker'] = 'from-manager';
        return config;
      },
    });
    manager.addResponseInterceptor({
      fulfilled: (response) => ({ ...response, data: 'from-response-interceptor' }),
    });

    const localMock = new MockAdapter(instance);
    localMock.onGet('/any').reply(200, 'raw-body');

    const res = await instance.get('/any');
    expect(res.config.headers['X-Marker']).toBe('from-manager');
    expect(res.data).toBe('from-response-interceptor');
    localMock.restore();
  });
});
