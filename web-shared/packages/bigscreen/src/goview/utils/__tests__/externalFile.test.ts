import { describe, expect, it } from 'vitest';

import {
  CAD_MAX_SIZE_MB,
  getFileExt,
  isCadFile,
  isCadUrl,
  isSupportedExternalFile,
} from '@/utils/externalFile';

/** 构造 File 的辅助函数（仅用于判断，不需要真实文件内容） */
const makeFile = (name: string, type = ''): File =>
  new File(['dummy'], name, { type });

describe('externalFile 文件类型判断', () => {
  describe('getFileExt', () => {
    it('返回小写后缀（含点）', () => {
      expect(getFileExt('layout.DWG')).toBe('.dwg');
      expect(getFileExt('photo.PNG')).toBe('.png');
    });

    it('无后缀时返回空字符串', () => {
      expect(getFileExt('README')).toBe('');
    });
  });

  describe('isCadFile', () => {
    it('识别全部 CAD 后缀（不区分大小写）', () => {
      for (const ext of ['.dwg', '.dxf', '.dwf', '.dwfx', '.xps']) {
        expect(isCadFile(makeFile(`图纸/一层平面图${ext}`))).toBe(true);
        expect(isCadFile(makeFile(`图纸/一层平面图${ext.toUpperCase()}`))).toBe(true);
      }
    });

    it('非 CAD 文件返回 false', () => {
      expect(isCadFile(makeFile('photo.png'))).toBe(false);
      expect(isCadFile(makeFile('README.md'))).toBe(false);
      expect(isCadFile(makeFile('archive.zip'))).toBe(false);
    });
  });

  describe('isCadUrl', () => {
    it('识别 CAD 地址（含 query/hash 也能识别）', () => {
      expect(isCadUrl('https://oss.example.com/图纸/一层平面图.dwg')).toBe(true);
      expect(isCadUrl('/api/v1/ai/knowledge/document/source-preview/系统图.dxf?documentID=1')).toBe(true);
      expect(isCadUrl('https://oss.example.com/图纸/总图.DWF#fragment')).toBe(true);
    });

    it('非 CAD 地址返回 false', () => {
      expect(isCadUrl('https://oss.example.com/photo.png')).toBe(false);
      expect(isCadUrl('')).toBe(false);
      expect(isCadUrl('https://oss.example.com/archive.zip')).toBe(false);
    });
  });

  describe('isSupportedExternalFile', () => {
    it('按 MIME 识别图片', () => {
      expect(isSupportedExternalFile(makeFile('photo.png', 'image/png'))).toBe(true);
      expect(isSupportedExternalFile(makeFile('photo.svg', 'image/svg+xml'))).toBe(true);
    });

    it('按扩展名兜底识别图片（MIME 为空）', () => {
      expect(isSupportedExternalFile(makeFile('photo.png'))).toBe(true);
      expect(isSupportedExternalFile(makeFile('photo.JPEG'))).toBe(true);
      expect(isSupportedExternalFile(makeFile('photo.webp'))).toBe(true);
    });

    it('识别 CAD 图纸（MIME 为空，扩展名兜底）', () => {
      expect(isSupportedExternalFile(makeFile('layout.dwg'))).toBe(true);
      expect(isSupportedExternalFile(makeFile('layout.dxf'))).toBe(true);
      expect(isSupportedExternalFile(makeFile('layout.DWf'))).toBe(true);
      expect(isSupportedExternalFile(makeFile('layout.xps'))).toBe(true);
    });

    it('按 CAD MIME 识别', () => {
      expect(isSupportedExternalFile(makeFile('layout.dwg', 'application/acad'))).toBe(true);
      expect(isSupportedExternalFile(makeFile('layout.dxf', 'application/dxf'))).toBe(true);
    });

    it('不支持的类型返回 false', () => {
      expect(isSupportedExternalFile(makeFile('archive.zip'))).toBe(false);
      expect(isSupportedExternalFile(makeFile('README.md', 'text/markdown'))).toBe(false);
      expect(isSupportedExternalFile(makeFile('data.bin', 'application/octet-stream'))).toBe(false);
    });
  });

  describe('CAD_MAX_SIZE_MB', () => {
    it('CAD 上传上限为 50M', () => {
      expect(CAD_MAX_SIZE_MB).toBe(50);
    });
  });
});
