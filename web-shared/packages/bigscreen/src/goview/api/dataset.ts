import { post } from './http';

const API_PREFIX = '/api/v1/view';

export const getGroupList = (type: 'component' | 'dataset') => {
  return post(`${API_PREFIX}/group/get-list`, { type });
};

export const getEditorGroupList = (type: 'component' | 'dataset') => {
  return post(`${API_PREFIX}/group/get-list`, { type, scene: 'editor' });
};

export const getDatasetList = (params?: {
  groupId?: number;
  name?: string;
  page?: { page: number; size: number };
  type?: string;
}) => {
  return post(`${API_PREFIX}/dataset/get-list`, params);
};

export const getEditorDatasetList = (params?: {
  groupId?: number;
  name?: string;
  page?: { page: number; size: number };
  type?: string;
}) => {
  return post(`${API_PREFIX}/dataset/get-list`, {
    ...(params || {}),
    scene: 'editor',
  });
};

export const getDatasetOne = (id: number) => {
  return post(`${API_PREFIX}/dataset/get-one`, { id: id.toString() });
};

export const previewDataset = (id: number) => {
  return post(`${API_PREFIX}/dataset/preview`, { id: id.toString() });
};

export const createDataset = (data: any) => {
  return post(`${API_PREFIX}/dataset/create`, data);
};
