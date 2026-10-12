/**
 * 内嵌页面组件「上传页面包」逻辑单测
 *
 * 覆盖 upload-package.ts 纯函数与接口调用组装：
 * - isHostedSceneUrl 平台托管入口前缀判断
 * - validateSceneZipFile 扩展名/大小校验
 * - buildSceneZipForm multipart 表单组装（file + screenId）
 * - uploadSceneZip 经 codegen client 提交并透传返回
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@vben/api', () => ({
  ViewView: {
    postApiV1ViewAssetUploadZip: vi.fn()
  }
}))

import { ViewView } from '@vben/api'

import {
  SCENE_URL_PREFIX,
  buildSceneZipForm,
  isHostedSceneUrl,
  uploadSceneZip,
  validateSceneZipFile
} from '../upload-package'

/** 构造测试用 File（happy-dom 环境自带 File/FormData 实现） */
function makeZipFile(name = 'demo.zip', size = 10): File {
  return new File([new Uint8Array(size)], name, { type: 'application/zip' })
}

describe('isHostedSceneUrl 平台托管入口判断', () => {
  it('平台托管前缀命中', () => {
    expect(isHostedSceneUrl('/api/v1/view/scene/12/34/index.html')).toBe(true)
  })

  it('前缀不完整或外部地址不命中', () => {
    expect(isHostedSceneUrl('/api/v1/view/scenex/12/34/index.html')).toBe(false)
    expect(isHostedSceneUrl('https://example.com/index.html')).toBe(false)
  })

  it('空地址与非法入参不命中', () => {
    expect(isHostedSceneUrl('')).toBe(false)
    expect(isHostedSceneUrl(undefined as unknown as string)).toBe(false)
  })
})

describe('validateSceneZipFile 扩展名与大小校验', () => {
  it('合法 zip 通过（返回 null）', () => {
    expect(validateSceneZipFile(makeZipFile())).toBeNull()
    expect(validateSceneZipFile(makeZipFile('DEMO.ZIP'))).toBeNull()
  })

  it('非 zip 扩展名拒绝', () => {
    expect(validateSceneZipFile(makeZipFile('demo.rar'))).toContain('.zip')
    expect(validateSceneZipFile(makeZipFile('noext'))).toContain('.zip')
  })

  it('超过 100MB 拒绝', () => {
    const big = makeZipFile('demo.zip', 100 * 1024 * 1024 + 1)
    expect(validateSceneZipFile(big)).toContain('100MB')
  })
})

describe('buildSceneZipForm 表单组装', () => {
  it('包含 file 与 screenId 字段', () => {
    const file = makeZipFile()
    const form = buildSceneZipForm(file, '88')
    expect(form.get('screenId')).toBe('88')
    expect(form.get('file')).toBe(file)
  })

  it('screenId 保持字符串形态（避免 int64 精度问题）', () => {
    const form = buildSceneZipForm(makeZipFile(), '12345678901')
    expect(form.get('screenId')).toBe('12345678901')
  })
})

describe('uploadSceneZip 接口调用', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('经 codegen client 提交并透传 entryUrl', async () => {
    vi.mocked(ViewView.postApiV1ViewAssetUploadZip).mockResolvedValue({
      id: '34',
      entryUrl: `${SCENE_URL_PREFIX}88/34/index.html`,
      fileCount: 3,
      size: 1024
    })

    const resp = await uploadSceneZip(makeZipFile(), '88')
    expect(resp.entryUrl).toBe(`${SCENE_URL_PREFIX}88/34/index.html`)
    expect(ViewView.postApiV1ViewAssetUploadZip).toHaveBeenCalledTimes(1)
  })

  it('请求以 multipart 表单提交且显式声明 Content-Type', async () => {
    vi.mocked(ViewView.postApiV1ViewAssetUploadZip).mockResolvedValue({
      id: '1',
      entryUrl: 'u',
      fileCount: 1,
      size: 1
    })

    const file = makeZipFile()
    await uploadSceneZip(file, '88')

    const [request, config] = vi.mocked(ViewView.postApiV1ViewAssetUploadZip).mock.calls[0]!
    expect(String((config as any)?.headers?.['Content-Type'])).toContain('multipart/form-data')
    const body = request as unknown as FormData
    expect(body.get('file')).toBe(file)
    expect(body.get('screenId')).toBe('88')
  })

  it('接口失败时抛出原始错误供调用方 toast', async () => {
    vi.mocked(ViewView.postApiV1ViewAssetUploadZip).mockRejectedValue(new Error('boom'))
    await expect(uploadSceneZip(makeZipFile(), '88')).rejects.toThrow('boom')
  })
})
