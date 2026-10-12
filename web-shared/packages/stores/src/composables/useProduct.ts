import { computed } from 'vue';
import { useProductStore } from '../modules/product';

// 模块级 Promise 缓存，防止并发重复请求
let _fetchPromise: null | Promise<any> = null;

/**
 * 产品相关的统一业务逻辑封装
 */
export function useProduct() {
  const productStore = useProductStore();

  // 计算属性：产品列表
  const products = computed(() => productStore.getAllProducts());

  // 计算属性：加载状态
  const isLoading = computed(() => productStore.loading);

  // 计算属性：错误信息
  const errorMessage = computed(() => productStore.error);

  // 计算属性：产品数量
  const productCount = computed(() => products.value.length);

  // 计算属性：是否有产品
  const hasProducts = computed(() => productCount.value > 0);

  /**
   * 初始化产品列表
   */
  const initProducts = async (params?: { page?: number; size?: number }) => {
    return await productStore.getProductList(params);
  };

  /**
   * 刷新产品列表
   */
  const refreshProducts = async () => {
    return await productStore.getProductList();
  };

  /**
   * 根据 ID 获取产品
   */
  const findProductById = (id: string) => {
    return productStore.getProductById(id);
  };

  /**
   * 搜索产品
   */
  const searchProducts = (keyword: string) => {
    return productStore.searchProductsByName(keyword);
  };

  /**
   * 获取产品选项（用于下拉框等）
   */
  const getProductOptions = () => {
    return products.value.map((product) => ({
      label: product.productName || '未命名产品',
      value: product.productID || '',
      data: product,
    }));
  };

  /**
   * 确保产品数据已加载（懒加载 + 并发去重）
   * - 已有数据：直接返回，0 请求
   * - 请求中：复用同一 Promise，不重复发请求
   * - 无数据：发起新请求并缓存 Promise
   */
  const ensureProducts = (): Promise<void> => {
    if (productStore.products.length > 0) {
      return Promise.resolve();
    }
    if (_fetchPromise) {
      return _fetchPromise;
    }
    _fetchPromise = productStore.getProductList().finally(() => {
      _fetchPromise = null;
    });
    return _fetchPromise;
  };

  /**
   * 重置产品数据（登出时调用，下次登录重新拉取）
   */
  const resetProducts = () => {
    _fetchPromise = null;
    productStore.$reset();
  };

  return {
    // 响应式数据
    products,
    isLoading,
    errorMessage,
    productCount,
    hasProducts,

    // 方法
    initProducts,
    refreshProducts,
    findProductById,
    searchProducts,
    getProductOptions,
    ensureProducts,
    resetProducts,
  };
}
