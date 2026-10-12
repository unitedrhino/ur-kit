import type { ProductCategoryEntity } from '../../domain/entities/product-category.entity';

export class ProductCategoryMapper {
  static toEntity(dto: Record<string, unknown>): ProductCategoryEntity {
    return {
      id: String(dto.id || ''),
      parentID: String(dto.parentID || '0'),
      name: String(dto.name || ''),
      avatar: String(dto.avatar || ''),
    };
  }
}

