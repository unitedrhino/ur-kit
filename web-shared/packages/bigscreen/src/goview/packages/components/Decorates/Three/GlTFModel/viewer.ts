/**
 * GLTF/GLB 模型查看器（three.js 命令式封装）
 *
 * 职责：
 * - 场景装配：三点光 + OrbitControls + CSS2D 数值标签层 + 相机 auto-clip
 * - 模型加载与节点解析：GLTFLoader 加载后 traverse 收集节点快照（uuid/name/path/type）
 * - 节点拾取：raycaster 点击拾取（4px 位移仲裁，防止旋转视角误选）+ 选中高亮
 * - 绑定驱动：按绑定动作应用颜色 / 显隐 / 数值标签（配合 bindings.ts 规则引擎）
 * - 资源释放：dispose 几何体/材质/纹理/渲染器，防内存泄漏
 *
 * three 相关 import 仅在本文件出现，经 canvas.vue 的异步组件链打包为独立 chunk，
 * 不进首屏与 bigscreen 主包（首屏红线要求）。
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'


import { evaluateColor, evaluateVisible, formatLabelText, resolveBindingTarget } from './bindings'
import type { GltfNodeInfo, NodeBinding } from './types'

/** 点击与拖拽的位移仲裁阈值（px）：按下/抬起位移小于该值视为点击拾取 */
const CLICK_THRESHOLD_PX = 4

/** 节点注册表条目 */
interface RegistryEntry {
  info: GltfNodeInfo
  object: THREE.Object3D
}

/** 数值标签条目 */
interface LabelEntry {
  css2d: CSS2DObject
  el: HTMLDivElement
}

export class GlTFViewer {
  private dom: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private labelRenderer: CSS2DRenderer
  private controls: OrbitControls
  private rafId = 0
  private disposed = false

  /** 当前模型根对象 */
  private modelRoot: THREE.Object3D | null = null
  /** 节点注册表：uuid → 节点信息与对象 */
  private registry = new Map<string, RegistryEntry>()
  /** 节点快照（供面板树展示与目标解析） */
  private nodes: GltfNodeInfo[] = []

  /** 已克隆材质节点的原材质（uuid → 原材质），绑定变色/高亮前先克隆以免共享材质串色，dispose 时一并释放 */
  private editedMaterials = new Map<string, THREE.Material | THREE.Material[]>()
  /** 当前选中节点 uuid */
  private selectedUuid = ''
  /** 数值标签表：bindingKey → 标签条目 */
  private labels = new Map<string, LabelEntry>()

  private raycaster = new THREE.Raycaster()
  private pointerDownPos = { x: 0, y: 0 }

  /** 画布点击拾取回调（命中节点或 null=空白处） */
  onPick?: (node: GltfNodeInfo | null) => void
  /** 模型加载进度回调（0~100） */
  onProgress?: (percent: number) => void

  constructor(dom: HTMLElement) {
    this.dom = dom
    const width = dom.clientWidth || 600
    const height = dom.clientHeight || 400

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    this.camera.position.set(5, 4, 6)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(width, height)
    dom.appendChild(this.renderer.domElement)

    // 数值标签渲染层（不拦截鼠标事件，避免遮挡视角操作）
    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(width, height)
    const labelDom = this.labelRenderer.domElement
    labelDom.style.position = 'absolute'
    labelDom.style.top = '0'
    labelDom.style.left = '0'
    labelDom.style.pointerEvents = 'none'
    dom.appendChild(labelDom)
    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.top = '0'
    this.renderer.domElement.style.left = '0'

    // 三点光：环境光 + 主/补/背三盏方向光，保证无纹理模型也有体积感
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9)
    keyLight.position.set(5, 8, 6)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35)
    fillLight.position.set(-6, 3, -4)
    const backLight = new THREE.DirectionalLight(0xffffff, 0.25)
    backLight.position.set(0, -5, -8)
    this.scene.add(keyLight, fillLight, backLight)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08

    this.bindPointerEvents()
    this.startLoop()
  }

  // ── 模型加载与解析 ────────────────────────────────────────────

  /**
   * 加载 GLB/GLTF 模型并解析节点快照
   * @param url 模型文件地址（fileUri）
   * @returns 解析出的节点信息列表
   */
  async loadModel(url: string): Promise<GltfNodeInfo[]> {
    this.clearModel()
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(url, (event) => {
      if (this.onProgress && event.total > 0) {
        this.onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      }
    })

    this.modelRoot = gltf.scene
    this.scene.add(gltf.scene)
    this.frameModel(gltf.scene)

    this.collectNodes(gltf.scene)
    return this.nodes
  }

  /** 清除当前模型（重新加载前调用），并复位绑定与高亮状态 */
  clearModel() {
    this.labels.forEach((entry) => {
      entry.css2d.removeFromParent()
      entry.el.remove()
    })
    this.labels.clear()
    this.selectedUuid = ''
    this.registry.clear()
    this.nodes = []

    if (this.modelRoot) {
      this.disposeObject(this.modelRoot)
      // 原材质缓存须在 disposeObject（释放被替换的原材质）之后再清空
      this.editedMaterials.clear()
      this.scene.remove(this.modelRoot)
      this.modelRoot = null
    }
  }

  /** 收集节点快照并注册表（绑定目标解析与拾取上溯共用） */
  private collectNodes(root: THREE.Object3D) {
    const rootName = root.name || 'Scene'
    root.updateWorldMatrix(true, true)
    root.traverse((object) => {
      if (object === root) return
      const path = this.buildPath(root, object, rootName)
      const info: GltfNodeInfo = {
        uuid: object.uuid,
        name: object.name || '(unnamed)',
        path,
        type: object.type
      }
      this.nodes.push(info)
      this.registry.set(object.uuid, { info, object })
    })
  }

  /** 构建层级路径 `Scene/父名/子名`（未命名层级记 (unnamed)） */
  private buildPath(root: THREE.Object3D, target: THREE.Object3D, rootName: string): string {
    const chain: string[] = []
    let cur: THREE.Object3D | null = target
    while (cur && cur !== root) {
      chain.unshift(cur.name || '(unnamed)')
      cur = cur.parent
    }
    return [rootName, ...chain].join('/')
  }

  /** 模型加载后：包围盒居中 + 相机 auto-clip + 初始机位（借鉴 Tier0 auto-clip 思路） */
  private frameModel(root: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(root)
    if (box.isEmpty()) return
    const center = box.getCenter(new THREE.Vector3())
    const radius = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 0.001)

    // 居中：整体平移使包围盒中心位于原点
    root.position.sub(center)

    // auto-clip：按模型半径动态设置裁剪面，防大模型被裁剪或深度冲突
    this.camera.near = radius / 100
    this.camera.far = radius * 100 + 10
    this.camera.updateProjectionMatrix()

    // 初始机位：半径 2.2 倍距离斜上方俯视
    const direction = new THREE.Vector3(1, 0.8, 1).normalize()
    this.camera.position.copy(direction.multiplyScalar(radius * 2.2))
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  // ── 节点查询与绑定应用 ────────────────────────────────────────

  /** 当前节点快照 */
  getNodes(): GltfNodeInfo[] {
    return this.nodes
  }

  /**
   * 解析绑定对应的 three 对象（三级降级：uuid → path → 唯一 name，歧义不动）
   * @param binding 节点绑定
   */
  resolveNode(binding: NodeBinding): THREE.Object3D | null {
    const { node, matchedBy, reason } = resolveBindingTarget(binding, this.nodes)
    if (!node) {
      if (reason) console.warn(`[GlTFModel] ${reason}`)
      return null
    }
    void matchedBy
    return this.registry.get(node.uuid)?.object ?? null
  }

  /**
   * 应用一条绑定的实时值到模型节点
   * @param binding 节点绑定（动作类型决定视觉反馈）
   * @param value 属性最新值
   */
  applyBindingValue(binding: NodeBinding, value: unknown) {
    if (this.disposed) return
    const object = this.resolveNode(binding)
    if (!object) return

    if (binding.action.type === 'color') {
      const color = evaluateColor(binding.action, value)
      if (color) this.applyNodeColor(object, color)
      return
    }
    if (binding.action.type === 'visible') {
      const visible = evaluateVisible(binding.action, value)
      if (visible !== null) object.visible = visible
      return
    }
    if (binding.action.type === 'label') {
      this.upsertLabel(binding, value)
      return
    }
    if (binding.action.type === 'motion') {
      this.applyNodeMotion(binding, value)
    }
  }

  /** 位姿驱动目标表：节点 → 目标位姿（渲染循环内逐帧插值逼近，运动平滑） */
  private motionTargets = new Map<THREE.Object3D, { pos: THREE.Vector3; rot: THREE.Euler }>()

  /** 位姿驱动：属性值 × 系数 → 节点目标旋转（度）或位移（米），基于节点初始位姿叠加 */
  private applyNodeMotion(binding: NodeBinding, value: unknown) {
    const object = this.resolveNode(binding)
    if (!object) return
    const num = Number(value)
    if (Number.isNaN(num)) return
    const axis = binding.action.axis ?? 'ry'
    const factor = binding.action.factor ?? 1

    // 首次驱动时缓存初始位姿（叠加基准），模型重载后随节点重建自然复位
    let init = object.userData.__motionInit as { pos: THREE.Vector3; rot: THREE.Euler } | undefined
    if (!init) {
      init = { pos: object.position.clone(), rot: object.rotation.clone() }
      object.userData.__motionInit = init
    }

    const targetRot = init.rot.clone()
    const targetPos = init.pos.clone()
    if (axis[0] === 'r') {
      const rad = (num * factor * Math.PI) / 180
      if (axis === 'rx') targetRot.x = init.rot.x + rad
      else if (axis === 'rz') targetRot.z = init.rot.z + rad
      else targetRot.y = init.rot.y + rad
    } else {
      const off = num * factor
      if (axis === 'px') targetPos.x = init.pos.x + off
      else if (axis === 'pz') targetPos.z = init.pos.z + off
      else targetPos.y = init.pos.y + off
    }
    this.motionTargets.set(object, { rot: targetRot, pos: targetPos })
  }

  /** 渲染循环内逐帧向目标位姿插值（每帧逼近 18%，约 20 帧收敛，运动平滑无跳变） */
  private tickMotion() {
    if (this.motionTargets.size === 0) return
    const ALPHA = 0.18
    for (const [object, target] of this.motionTargets) {
      object.rotation.x += (target.rot.x - object.rotation.x) * ALPHA
      object.rotation.y += (target.rot.y - object.rotation.y) * ALPHA
      object.rotation.z += (target.rot.z - object.rotation.z) * ALPHA
      object.position.lerp(target.pos, ALPHA)
    }
  }

  /** 节点变色（首次先克隆材质，避免共享材质串色） */
  private applyNodeColor(object: THREE.Object3D, color: string) {
    const materials = this.ensureClonedMaterials(object)
    const target = new THREE.Color(color)
    for (const mat of materials) {
      if ('color' in mat) {
        ;(mat as THREE.MeshStandardMaterial | THREE.MeshPhongMaterial).color.copy(target)
      }
    }
  }

  /** 取节点可编辑材质（惰性克隆并缓存原材质；克隆材质带标记，重复调用返回已挂载的克隆实例） */
  private ensureClonedMaterials(object: THREE.Object3D): THREE.Material[] {
    const mesh = object as THREE.Mesh
    const current = mesh.material
    if (!current) return []

    // 已克隆过：直接返回当前挂在节点上的克隆材质（改色才能生效）
    const isClone = (m: THREE.Material) => Boolean((m.userData as any)?.__isGlTFBindClone)
    if (Array.isArray(current) ? current.every(isClone) : isClone(current)) {
      return Array.isArray(current) ? current : [current]
    }

    // 首次编辑：缓存原材质（供释放），克隆并打标记后赋回节点
    this.editedMaterials.set(object.uuid, current)
    const mark = (m: THREE.Material) => {
      ;(m.userData as any).__isGlTFBindClone = true
      return m
    }
    if (Array.isArray(current)) {
      const clones = current.map((m) => mark(m.clone()))
      mesh.material = clones
      return clones
    }
    const clone = mark(current.clone())
    mesh.material = clone
    return [clone]
  }

  // ── 数值标签 ────────────────────────────────────────────────

  /** 创建或更新节点数值标签（CSS2D，显示 `前缀: 值 单位`） */
  private upsertLabel(binding: NodeBinding, value: unknown) {
    const object = this.resolveNode(binding)
    if (!object) return
    const key = `${binding.productID}|${binding.deviceName}|${binding.dataID}|${binding.nodePath}`
    let entry = this.labels.get(key)
    if (!entry) {
      const el = document.createElement('div')
      el.className = 'gltf-model-label'
      el.style.cssText = [
        'padding: 2px 8px',
        'border-radius: 4px',
        'background: rgba(0,0,0,0.65)',
        'color: #fff',
        'font-size: 12px',
        'line-height: 18px',
        'white-space: nowrap',
        'pointer-events: none'
      ].join(';')
      const css2d = new CSS2DObject(el)
      // 标签挂模型根节点：位置取节点包围盒顶面上方（模型居中于原点，静态模型位置不变）
      const worldTop = this.getNodeTop(object)
      css2d.position.copy(worldTop)
      ;(this.modelRoot ?? this.scene).add(css2d)
      entry = { css2d, el }
      this.labels.set(key, entry)
    }
    entry.el.textContent = formatLabelText(binding.action, binding, value)
  }

  /** 取节点世界坐标包围盒顶面中心（略上移避免遮挡） */
  private getNodeTop(object: THREE.Object3D): THREE.Vector3 {
    object.updateWorldMatrix(true, false)
    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    return new THREE.Vector3(center.x, box.max.y + 0.06 * Math.max(box.getSize(new THREE.Vector3()).length(), 0.1), center.z)
  }

  // ── 拾取与高亮 ────────────────────────────────────────────────

  /** 绑定画布指针事件（点击拾取，4px 位移仲裁） */
  private bindPointerEvents() {
    const dom = this.renderer.domElement
    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY }
    })
    dom.addEventListener('pointerup', (e) => {
      const dx = e.clientX - this.pointerDownPos.x
      const dy = e.clientY - this.pointerDownPos.y
      if (Math.hypot(dx, dy) > CLICK_THRESHOLD_PX) return
      this.pick(e)
    })
  }

  /** raycaster 拾取：命中后沿 parent 链上溯到最近已注册节点 */
  private pick(e: PointerEvent) {
    if (this.disposed || !this.modelRoot) {
      this.onPick?.(null)
      return
    }
    const rect = this.renderer.domElement.getBoundingClientRect()
    const pointer = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    this.raycaster.setFromCamera(pointer, this.camera)
    const hits = this.raycaster.intersectObject(this.modelRoot, true)
    const hit = hits[0]
    if (!hit) {
      this.onPick?.(null)
      return
    }
    // 上溯：命中 mesh 自身或其祖先中最靠近命中点的已注册节点
    let cur: THREE.Object3D | null = hit.object
    while (cur) {
      const entry = this.registry.get(cur.uuid)
      if (entry) {
        this.selectNode(entry.info.path)
        this.onPick?.(entry.info)
        return
      }
      cur = cur.parent
    }
    this.onPick?.(null)
  }

  /**
   * 编辑态选中节点（画布高亮 + 与右侧树联动）
   * @param path 节点路径；空串取消选中
   */
  selectNode(path: string) {
    // 先还原上一个选中节点的 emissive
    if (this.selectedUuid) {
      this.restoreEmissive(this.selectedUuid)
      this.selectedUuid = ''
    }
    if (!path) return
    const entry = this.nodes.find((n) => n.path === path)
    if (!entry) return
    const object = this.registry.get(entry.uuid)?.object
    if (!object) return
    this.selectedUuid = entry.uuid
    this.setEmissive(object, 0x18a0fb)
  }

  /** 设置节点自发光（高亮） */
  private setEmissive(object: THREE.Object3D, hex: number) {
    const materials = this.ensureClonedMaterials(object)
    for (const mat of materials) {
      const standard = mat as THREE.MeshStandardMaterial
      if ('emissive' in standard && standard.emissive) {
        ;(mat as any).userData.__origEmissive = standard.emissive.getHex()
        ;(mat as any).userData.__origEmissiveIntensity = standard.emissiveIntensity
        standard.emissive.setHex(hex)
        standard.emissiveIntensity = 0.55
      }
    }
  }

  /** 还原节点自发光 */
  private restoreEmissive(uuid: string) {
    const object = this.registry.get(uuid)?.object
    if (!object) return
    // 注意：材质可能已被克隆替换，从克隆对象读回原始 emissive
    const mesh = object as THREE.Mesh
    const apply = (mat: any) => {
      if (mat?.userData?.__origEmissive !== undefined && 'emissive' in mat && mat.emissive) {
        mat.emissive.setHex(mat.userData.__origEmissive)
        mat.emissiveIntensity = mat.userData.__origEmissiveIntensity ?? 1
        delete mat.userData.__origEmissive
        delete mat.userData.__origEmissiveIntensity
      }
    }
    if (Array.isArray(mesh.material)) mesh.material.forEach(apply)
    else apply(mesh.material)
  }

  // ── 视角与尺寸 ────────────────────────────────────────────────

  /** 重置视角（回到初始机位） */
  resetView() {
    if (this.modelRoot) this.frameModel(this.modelRoot)
  }

  /**
   * 应用保存的视角（模型默认位置/朝向）：相机位置 + 观察目标点
   * @param state `{ camera: [x,y,z], target: [x,y,z] }`
   */
  applyViewState(state: { camera: number[]; target: number[] }) {
    // 严格索引检查下分量访问为 number | undefined，分量不全时直接忽略
    const cam = state?.camera ?? []
    const tgt = state?.target ?? []
    if (cam.length < 3 || tgt.length < 3) return
    this.camera.position.set(cam[0]!, cam[1]!, cam[2]!)
    this.controls.target.set(tgt[0]!, tgt[1]!, tgt[2]!)
    this.controls.update()
  }

  /** 导出当前视角（编辑器「保存当前视角」用） */
  getViewState(): { camera: number[]; target: number[] } {
    return {
      camera: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
      target: [this.controls.target.x, this.controls.target.y, this.controls.target.z]
    }
  }

  /** 设置自动旋转 */
  setAutoRotate(enabled: boolean) {
    this.controls.autoRotate = enabled
    this.controls.autoRotateSpeed = 1.5
  }

  /** 组件尺寸变化（throttle 由调用方控制） */
  updateSize(width: number, height: number) {
    if (this.disposed || width <= 0 || height <= 0) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.labelRenderer.setSize(width, height)
  }

  /** 设置画布背景透明（跟随大屏背景） */
  setBackgroundTransparent(transparent: boolean) {
    this.renderer.setClearAlpha(transparent ? 0 : 1)
  }

  // ── 渲染循环与释放 ────────────────────────────────────────────

  private startLoop() {
    const tick = () => {
      if (this.disposed) return
      this.rafId = requestAnimationFrame(tick)
      this.tickMotion()
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      this.labelRenderer.render(this.scene, this.camera)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  /** 递归释放对象几何体/材质/纹理（含因克隆被替换下来的原材质） */
  private disposeObject(root: THREE.Object3D) {
    root.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
      for (const mat of mats) {
        for (const value of Object.values(mat)) {
          if (value && (value as THREE.Texture).isTexture) {
            ;(value as THREE.Texture).dispose()
          }
        }
        mat.dispose()
      }
    })
    // 释放被克隆替换下来的原材质
    this.editedMaterials.forEach((original) => {
      const list = Array.isArray(original) ? original : [original]
      list.forEach((mat) => mat.dispose())
    })
  }

  /** 销毁查看器（组件卸载时调用，防内存泄漏） */
  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    this.clearModel()
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.labelRenderer.domElement.remove()
  }
}
