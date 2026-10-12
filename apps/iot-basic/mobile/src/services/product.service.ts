import { ProductRepositoryImpl } from '../data/repositories/product.repository.impl';
import type { IProductRepository } from '../domain/interfaces/product.repository';
import type { ProductEntity } from '../domain/entities/product.entity';
import type { PageResult } from '../domain/models/page-state.model';
import { request } from '../utils/request';

export interface ProductCategoryOption {
  id: string;
  parentID: string;
  name: string;
  avatar: string;
}

export class ProductService {
  constructor(private readonly productRepo: IProductRepository = new ProductRepositoryImpl()) {}

  async getList(page: number, size: number, deviceType?: number): Promise<PageResult<ProductEntity>> {
    return this.productRepo.getList({ page, size, deviceType });
  }

  async getCategoryList(page: number, size: number, parentID = '0'): Promise<PageResult<ProductCategoryOption>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/product/category/get-list',
      data: {
        page: { page, size },
        parentID,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map((item) => ({
      id: String(item.id || ''),
      parentID: String(item.parentID || '0'),
      name: String(item.name || ''),
      avatar: String(item.avatar || ''),
    }));
    return { list, total: Number(resp.total || 0) };
  }

  async getOne(productID: string): Promise<ProductEntity> {
    return this.productRepo.getOne(productID);
  }
}

export const productService = new ProductService();
