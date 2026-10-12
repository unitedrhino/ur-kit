import type { PackagesType, ConfigType } from '@/packages/index.type'
export type { ConfigType }

export type { PackagesType }
export interface PackagesStoreType {
  packagesList: PackagesType,
  newPhoto?: ConfigType,
  /** 资源库图片列表，通过 loadLibraryPhotos() 异步加载后写入此字段 */
  libraryPhotos: ConfigType[]
}
