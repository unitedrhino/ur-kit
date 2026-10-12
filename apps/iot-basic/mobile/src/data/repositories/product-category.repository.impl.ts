import { request } from '../../utils/request';
import type { IProductCategoryRepository } from '../../domain/interfaces/product-category.repository';
import type { ProductCategoryEntity } from '../../domain/entities/product-category.entity';
import type { PageParams, PageResult } from '../../domain/models/page-state.model';
import { ProductCategoryMapper } from '../mappers/product-category.mapper';

export class ProductCategoryRepositoryImpl implements IProductCategoryRepository {
  async getList(params: PageParams & { parentID?: string }): Promise<PageResult<ProductCategoryEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/product/category/get-list',
      data: {
        page: { page: params.page, size: params.size },
        parentID: params.parentID || '0',
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(ProductCategoryMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }
}

