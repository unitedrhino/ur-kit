import type { ProductCategoryEntity } from '../entities/product-category.entity';
import type { PageParams, PageResult } from '../models/page-state.model';

export interface IProductCategoryRepository {
  getList(params: PageParams & { parentID?: string }): Promise<PageResult<ProductCategoryEntity>>;
}

