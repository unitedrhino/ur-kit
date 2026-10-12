export interface PageParams {
  page: number;
  size: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
}

export interface PageState {
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  page: number;
  size: number;
  total: number;
}

export function createPageState(size = 20): PageState {
  return {
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    size,
    total: 0,
  };
}
