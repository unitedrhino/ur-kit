import type { OcrGetListReq } from '../models';
import type { OcrRecognizeReq } from '../models';
import type { PostApiV1RoadDetectionOcrGetList200Response } from '../models';
import type { PostApiV1RoadDetectionOcrRecognize200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionOcrApi - axios parameter creator
 */

/**
* 业务说明：按委托查询全部 OCR 识别记录【含识别草稿 JSON 与状态，可选节点过滤，不分页全量返回】，供录入面板草稿回填与溯源页 L1 实数据渲染
* @summary 按委托查询 OCR 识别记录
* @param {OcrGetListReq} ocrGetListReq  OCR 识别记录列表请求（不分页，单委托识别记录量级 ≤百级全量返回）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionOcrGetList (
ocrGetListReq: OcrGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/ocr/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionOcrGetList200Response>>(localVarPath, ocrGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按底座 OSS 文件路径识别试验数据照片生成录入草稿【本期 stub：按节点槽位定义生成稳定伪值草稿并显式携带 stub=1 标记，真实 PaddleOCR 接入只改本端点 logic 一处】；落 draft 识别记录供人工校正后经 experiment/submit(source=ocr) 确认提交；仅检测中委托且节点有槽位定义可用
* @summary 拍照 OCR 识别生成草稿（stub）
* @param {OcrRecognizeReq} ocrRecognizeReq  OCR 识别请求（stub：filePath 为底座 OSS 上传后的文件路径引用，非 multipart）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionOcrRecognize (
ocrRecognizeReq: OcrRecognizeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/ocr/recognize`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionOcrRecognize200Response>>(localVarPath, ocrRecognizeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionOcrGetList operation in RoadDetectionOcrApi.
 */
export interface RoadDetectionOcrApiPostApiV1RoadDetectionOcrGetListRequest {
    /**
     *  OCR 识别记录列表请求（不分页，单委托识别记录量级 ≤百级全量返回）
     */
    readonly ocrGetListReq: OcrGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionOcrRecognize operation in RoadDetectionOcrApi.
 */
export interface RoadDetectionOcrApiPostApiV1RoadDetectionOcrRecognizeRequest {
    /**
     *  OCR 识别请求（stub：filePath 为底座 OSS 上传后的文件路径引用，非 multipart）
     */
    readonly ocrRecognizeReq: OcrRecognizeReq
}
