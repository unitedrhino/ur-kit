import type { ProductEntity } from '../entities/product.entity';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface IProductRepository {
  getList(params: PageParams & { deviceType?: number }): Promise<PageResult<ProductEntity>>;
  getOne(productID: string): Promise<ProductEntity>;
}
