import { request } from '../../utils/request';
import type { IProductRepository } from '../../domain/interfaces/product.repository';
import type { ProductEntity } from '../../domain/entities/product.entity';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { ProductMapper } from '../mappers/product.mapper';

export class ProductRepositoryImpl implements IProductRepository {
  async getList(params: PageParams & { deviceType?: number }): Promise<PageResult<ProductEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/product/info/get-list',
      data: {
        page: { page: params.page, size: params.size },
        deviceType: params.deviceType,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(ProductMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async getOne(productID: string): Promise<ProductEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/product/info/get-one',
      data: { productID },
    });
    return ProductMapper.toEntity(resp);
  }
}
