import type { ProductEntity } from '../../domain/entities/product.entity';

export class ProductMapper {
  static toEntity(dto: Record<string, unknown>): ProductEntity {
    return {
      productID: String(dto.productID || ''),
      productName: String(dto.productName || ''),
      productImg: String(dto.productImg || ''),
      deviceType: Number(dto.deviceType || 1),
      categoryID: String(dto.categoryID || ''),
      netType: Number(dto.netType || 1),
      protocolCode: String(dto.protocolCode || ''),
      status: Number(dto.status || 1),
      bindLevel: Number(dto.bindLevel || 1),
      desc: dto.desc ? String(dto.desc) : undefined,
      createdTime: Number(dto.createdTime || 0),
      // 后端暂未实现 supportsWifi5G 字段，统一兜底 false（仅 2.4G）。
      supportsWifi5G: dto.supportsWifi5G === true,
    };
  }
}
