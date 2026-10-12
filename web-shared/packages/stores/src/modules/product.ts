import { defineStore } from 'pinia';
import { ref } from 'vue';

import { ThingsApi } from '@vben/api';

export const useProductStore = defineStore('product', () => {
  const products = ref<ThingsApi.ProductInfo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getProductList = async (params?: { page?: number; size?: number }) => {
    try {
      loading.value = true;
      error.value = null;

      const res = await ThingsApi.postApiV1ThingsProductInfoGetList({
        page: {
          page: params?.page || 1,
          size: params?.size || 1000,
        },
      });
      products.value = res.list;
      return res;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取产品列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取所有产品
  const getAllProducts = () => products.value;

  // 根据 ID 获取产品
  const getProductById = (id: string) => {
    return products.value.find((product) => product.productID === id);
  };

  // 根据名称搜索产品
  const searchProductsByName = (name: string) => {
    return products.value.filter((product) => product.productName?.toLowerCase().includes(name.toLowerCase()));
  };

  // 实现 $reset 方法，用于重置 store 状态
  const $reset = () => {
    products.value = [];
    loading.value = false;
    error.value = null;
  };

  return {
    products,
    loading,
    error,
    getProductList,
    getAllProducts,
    getProductById,
    searchProductsByName,
    $reset,
  };
});
