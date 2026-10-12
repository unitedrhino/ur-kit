<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { watch, computed, ref } from 'vue';
import { NInput, NModal } from 'naive-ui';
import { uploadPublicFile } from '../api/upload';

interface Props {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: string;
  /** 上传业务标识（用于公开桶路径） */
  uploadBusiness?: string;
  /** 上传使用级别：user/tenant/platform */
  uploadUseBy?: 'user' | 'tenant' | 'platform';
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  placeholder: '请输入正文内容...',
  disabled: false,
  maxHeight: '400px',
  uploadBusiness: 'richtext',
  uploadUseBy: 'tenant',
});

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

// 图片上传状态
const isUploading = ref(false);

// 链接弹窗状态
const showLinkModal = ref(false);
const linkUrl = ref('');

// 打开链接弹窗
function openLinkModal() {
  const currentUrl = editor.value?.getAttributes('link').href as string;
  linkUrl.value = currentUrl || '';
  showLinkModal.value = true;
}

// 确认插入链接
function confirmLink() {
  if (linkUrl.value.trim()) {
    editor.value?.chain().focus().setLink({ href: linkUrl.value.trim() }).run();
  } else {
    editor.value?.chain().focus().unsetLink().run();
  }
  showLinkModal.value = false;
}

// 全屏状态
const isFullscreen = ref(false);
const editorContainerRef = ref<HTMLElement | null>(null);

// 切换全屏
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// 处理图片上传
async function handleImageUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    isUploading.value = true;
    try {
      const res = await uploadPublicFile(file, {
        business: props.uploadBusiness,
        useBy: props.uploadUseBy,
      });
      // 使用公开桶返回的 fileUri 作为图片 src
      const imageUrl = res.fileUri || res.filePath;
      if (imageUrl) {
        editor.value?.chain().focus().setImage({ src: imageUrl }).run();
      }
    } catch (error) {
      console.error('图片上传失败:', error);
    } finally {
      isUploading.value = false;
    }
  };
  input.click();
}

// 计算编辑器内容
const editorContent = computed(() => props.value || '');

const editor = useEditor({
  content: editorContent.value,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline',
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full rounded',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editable: !props.disabled,
  onUpdate: ({ editor }) => {
    // 输出 HTML 内容
    emit('update:value', editor.getHTML());
  },
});

// 监听外部值变化
watch(
  () => props.value,
  (newValue) => {
    if (editor.value && newValue !== editor.value.getHTML()) {
      editor.value.commands.setContent(newValue || '', { emitUpdate: false });
    }
  },
);

// 监听禁用状态
watch(
  () => props.disabled,
  (newDisabled) => {
    if (editor.value) {
      editor.value.setEditable(!newDisabled);
    }
  },
);

// 工具栏按钮
const toolbarButtons = [
  { label: '加粗', action: () => editor.value?.chain().focus().toggleBold().run(), icon: 'bold', active: () => editor.value?.isActive('bold') },
  { label: '斜体', action: () => editor.value?.chain().focus().toggleItalic().run(), icon: 'italic', active: () => editor.value?.isActive('italic') },
  { label: '标题1', action: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(), icon: 'h1', active: () => editor.value?.isActive('heading', { level: 1 }) },
  { label: '标题2', action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(), icon: 'h2', active: () => editor.value?.isActive('heading', { level: 2 }) },
  { label: '标题3', action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(), icon: 'h3', active: () => editor.value?.isActive('heading', { level: 3 }) },
  { label: '无序列表', action: () => editor.value?.chain().focus().toggleBulletList().run(), icon: 'bulletList', active: () => editor.value?.isActive('bulletList') },
  { label: '有序列表', action: () => editor.value?.chain().focus().toggleOrderedList().run(), icon: 'orderedList', active: () => editor.value?.isActive('orderedList') },
  { label: '引用', action: () => editor.value?.chain().focus().toggleBlockquote().run(), icon: 'quote', active: () => editor.value?.isActive('blockquote') },
  { label: '分割线', action: () => editor.value?.chain().focus().setHorizontalRule().run(), icon: 'hr', active: () => false },
  { label: '链接', action: openLinkModal, icon: 'link', active: () => editor.value?.isActive('link') },
  { label: '取消链接', action: () => editor.value?.chain().focus().unsetLink().run(), icon: 'unlink', active: () => false },
  { label: '上传图片', action: handleImageUpload, icon: 'image', active: () => false },
  { label: '清除格式', action: () => editor.value?.chain().focus().clearNodes().unsetAllMarks().run(), icon: 'clear', active: () => false },
];

// SVG 图标
const icons: Record<string, string> = {
  bold: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>`,
  italic: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>`,
  h1: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="m17 12 3-2v8"></path></svg>`,
  h2: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M21 18h-4c0-4 4-3 4-6 0-3.5-2-3.5-4-1"></path></svg>`,
  h3: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M17.5 10.5c1.7-1 3.5 0 3.5 2 0 1.8-1.5 2.5-3 2.5h-1v2"></path></svg>`,
  bulletList: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
  orderedList: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>`,
  quote: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.917V6c0 1.25.75 2 2 2h1"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.917V6c0 1.25.75 2 2 2h1"></path></svg>`,
  hr: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  link: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
  unlink: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 7.5 9 9"></path><path d="M8.5 3.5a5 5 0 0 1 7.54.54l3 3a5 5 0 0 1-7.07 7.07"></path><path d="M7 11l-1.72 1.72a5 5 0 0 0 7.07 7.07l3-3"></path></svg>`,
  image: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  clear: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path><path d="M22 21H7"></path><path d="m5 11 9 9"></path></svg>`,
  fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>`,
  exitFullscreen: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 8h-3a2 2 0 0 1-2-2V3"></path><path d="M3 16h3a2 2 0 0 1 2 2v3"></path><path d="M16 21v-3a2 2 0 0 1 2-2h3"></path></svg>`,
};
</script>

<template>
  <div
    ref="editorContainerRef"
    class="tiptap-editor-container border border-gray-200 rounded-md overflow-hidden bg-white"
    :class="{
      'opacity-50 cursor-not-allowed': disabled,
      'fixed inset-0 z-50 rounded-none': isFullscreen
    }"
  >
    <!-- 工具栏 -->
    <div class="toolbar flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 items-center justify-between" v-if="!disabled">
      <div class="flex flex-wrap gap-1 items-center">
        <button
          v-for="btn in toolbarButtons"
          :key="btn.icon"
          type="button"
          class="toolbar-btn p-1.5 rounded hover:bg-gray-200 transition-colors"
          :class="{ 'bg-gray-200': btn.active?.() }"
          :title="btn.label"
          @click="btn.action"
        >
          <span v-html="icons[btn.icon]"></span>
        </button>
        <!-- 上传状态提示 -->
        <span v-if="isUploading" class="text-xs text-gray-500 ml-2">上传中...</span>
      </div>
      <!-- 全屏按钮 -->
      <button
        type="button"
        class="toolbar-btn p-1.5 rounded hover:bg-gray-200 transition-colors ml-auto"
        :title="isFullscreen ? '退出全屏' : '全屏编辑'"
        @click="toggleFullscreen"
      >
        <span v-html="isFullscreen ? icons.exitFullscreen : icons.fullscreen"></span>
      </button>
    </div>

    <!-- 编辑区域 -->
    <div
      class="editor-content-wrapper overflow-auto"
      :style="isFullscreen ? { height: 'calc(100vh - 48px)' } : { maxHeight: maxHeight }"
    >
      <EditorContent :editor="editor" class="prose prose-sm max-w-none p-4 focus:outline-none" />
    </div>

    <!-- 链接弹窗 -->
    <NModal
      v-model:show="showLinkModal"
      title="插入链接"
      preset="dialog"
      positive-text="确定"
      negative-text="取消"
      @positive-click="confirmLink"
    >
      <div class="pt-2"
      >
        <NInput
          v-model:value="linkUrl"
          placeholder="请输入链接地址"
          clearable
          @keydown.enter="confirmLink"
        />
      </div>
    </NModal>
  </div>
</template>

<style>
.tiptap-editor-container .ProseMirror {
  outline: none;
  min-height: 150px;
}

.tiptap-editor-container .ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap-editor-container .ProseMirror h1 {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.tiptap-editor-container .ProseMirror h2 {
  font-size: 1.25em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.tiptap-editor-container .ProseMirror h3 {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.tiptap-editor-container .ProseMirror ul,
.tiptap-editor-container .ProseMirror ol {
  padding-left: 1.5em;
  margin-bottom: 0.5em;
}

.tiptap-editor-container .ProseMirror blockquote {
  border-left: 3px solid #cbd5e1;
  padding-left: 1em;
  margin-left: 0;
  color: #64748b;
}

.tiptap-editor-container .ProseMirror hr {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 1em 0;
}

.tiptap-editor-container .ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.tiptap-editor-container .ProseMirror a {
  color: #3b82f6;
  text-decoration: underline;
}
</style>