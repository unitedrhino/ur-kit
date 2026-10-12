// 重型依赖加载缓存：按操作触发，共享并发请求，失败后允许重新加载。
/** 创建资源加载器；importer 返回资源 Promise，调用结果在成功后复用。 */
export function createLazyResource<T>(importer: () => Promise<T>): () => Promise<T> {
  // 只缓存当前或成功的请求，避免一次网络失败使后续操作永久失败。
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= Promise.resolve()
      .then(importer)
      .catch((error: unknown) => {
        pending = undefined;
        throw error;
      });
    return pending;
  };
}
