import { defineStore } from 'pinia'
import { type ConfigType, type PackagesStoreType, type PackagesType } from './packagesStore.type'
import { packagesList } from '@/packages/index'
import { StorageEnum } from '@/enums/storageEnum'
import { getLocalStorage, setLocalStorage } from '@/utils'
import { useSessionStore } from '@vben/saas'

// 组件 packages
export const usePackagesStore = defineStore('usePackagesStore', {
  state: (): PackagesStoreType => ({
    packagesList: Object.freeze(packagesList),
    newPhoto: undefined,
    libraryPhotos: [] as ConfigType[],
  }),
  getters: {
    getPackagesList(): PackagesType {
      return this.packagesList
    }
  },
  actions: {
    setLibraryPhotos(photos: ConfigType[]) {
      this.libraryPhotos = photos;
    },
    addPhotos(newPhoto: ConfigType, index: number) {
      this.newPhoto = newPhoto
      this.packagesList.Photos.splice(index, 0, newPhoto)
      // 统一在 store 中维护 localStorage，避免 Private/index.ts 模块缓存导致的数据陈旧
      // 拼接 tenantCode 实现租户隔离，不同租户的本地图片互不干扰
      const StoreKey = StorageEnum.GO_USER_MEDIA_PHOTOS + '_' + (useSessionStore().tenantCode || 'default')
      const userPhotosList: ConfigType[] = getLocalStorage(StoreKey) || []
      userPhotosList.unshift(newPhoto)
      setLocalStorage(StoreKey, userPhotosList)
    },
    deletePhotos(photoInfo: ConfigType, index: number) {
      this.packagesList.Photos.splice(index, 1)
      const StoreKey = StorageEnum.GO_USER_MEDIA_PHOTOS + '_' + (useSessionStore().tenantCode || 'default')
      const userPhotosList: ConfigType[] = getLocalStorage(StoreKey) || []
      // 按 image URL + title 定位，避免 index-1 偏移量因列表差异导致删错
      const photoIndex = userPhotosList.findIndex(
        (p: ConfigType) => p.image === photoInfo.image && p.title === photoInfo.title
      )
      if (photoIndex !== -1) {
        userPhotosList.splice(photoIndex, 1)
      }
      setLocalStorage(StoreKey, userPhotosList)
    }
  }
})
