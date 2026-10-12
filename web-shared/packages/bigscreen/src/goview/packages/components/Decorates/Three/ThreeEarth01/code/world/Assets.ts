/**
 * 资源文件
 * 把模型和图片分开进行加载
 */

interface ITextures {
  name: string
  url: string
}

export interface IResources {
  textures?: ITextures[]
}

const fileSuffix = ['earth', 'gradient', 'redCircle', 'label', 'aperture', 'glow', 'light_column', 'aircraft']
const textures: ITextures[] = []

const modules: Record<string, { default: string }> = import.meta.glob("../../images/earth/*", { eager: true })

for(const item in modules) {
  const n = item.split('/').pop()
  if(n) {
    const texture = modules[item]
    // glob 模块记录与 key 一一对应，索引必然有效
    if (!texture) continue
    textures.push({
      // split 结果至少含一个元素，兜底空串仅为满足类型
      name: n.split('.')[0] ?? '',
      url: texture.default
    })
  }
}

const resources: IResources = {
  textures
}

export { resources }
