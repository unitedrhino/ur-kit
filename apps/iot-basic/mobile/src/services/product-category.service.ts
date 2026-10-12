import { ProductCategoryRepositoryImpl } from '../data/repositories/product-category.repository.impl';
import type { IProductCategoryRepository } from '../domain/interfaces/product-category.repository';
import type { ProductCategoryEntity } from '../domain/entities/product-category.entity';
import type { PageResult } from '../domain/models/page-state.model';

export class ProductCategoryService {
  constructor(
    private readonly productCategoryRepo: IProductCategoryRepository = new ProductCategoryRepositoryImpl(),
  ) {}

  async getList(page: number, size: number, parentID = '0'): Promise<PageResult<ProductCategoryEntity>> {
    return this.productCategoryRepo.getList({ page, size, parentID });
  }
}

export const productCategoryService = new ProductCategoryService();

