<!-- 文件说明：字段级引用新增/编辑/重挂表单，选择知识库内文档与章节（切片）产物锚定定位，按定位类型填写位置与参数名；提交动作上报宿主执行。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { KnowledgeArtifact, KnowledgeFieldReference, KnowledgeTreeNode } from './data';
import type { KnowledgeFieldReferenceAnchor, KnowledgeFieldReferenceFormValues, KnowledgeFieldReferenceSubmitPayload } from './field-reference';

import { computed, reactive, ref, watch } from 'vue';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Label } from '@unitedrhino/saas-ui/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unitedrhino/saas-ui/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@unitedrhino/saas-ui/ui/sheet';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { LoaderCircle } from 'lucide-vue-next';

import { Api } from './index.api';
import {
  fieldLocatorSummary,
  fieldReferenceKindOptions,
  filterKnowledgeSections,
  formValuesFromEndpoint,
  knowledgeSectionOptionLabel,
  toFormLocator,
  validateFieldReferenceForm,
} from './field-reference';

/** 表单承载于 Sheet；anchor 是被编辑/新挂一侧的既有端点，用于回填与保留 artifactID。 */
const props = withDefaults(
  defineProps<{
    /** 更新模式中被整体替换的一侧；新增模式忽略。 */
    allowMarkReviewed?: boolean;
    /** 被编辑/新挂一侧的既有端点；新增模式必传（引用方定位），更新模式回退引用对应侧。 */
    anchor?: KnowledgeFieldReferenceAnchor | null;
    canWrite?: boolean;
    knowledgeID: number;
    mode: 'create' | 'update';
    open: boolean;
    /** 更新模式的目标引用；新增模式忽略。 */
    reference?: KnowledgeFieldReference | null;
    submitting?: boolean;
    side: 'from' | 'to';
  }>(),
  { allowMarkReviewed: false, anchor: null, canWrite: true, reference: null, submitting: false },
);

/** submit 上报完整载荷，宿主负责调用接口、关闭弹层并刷新列表；markReviewed 是「标记无影响」快捷动作。 */
const emit = defineEmits<{
  markReviewed: [reference: KnowledgeFieldReference];
  submit: [payload: KnowledgeFieldReferenceSubmitPayload];
  'update:open': [open: boolean];
}>();

const values = reactive<KnowledgeFieldReferenceFormValues>(formValuesFromEndpoint(undefined));
const errors = reactive<Record<string, string>>({});
/** 表单实例标识：字段错误提示的 DOM id 需要与 aria-describedby 成对且唯一。 */
const uid = Math.random().toString(36).slice(2, 8);

const documents = ref<KnowledgeTreeNode[]>([]);
const documentsLoading = ref(false);
const documentsError = ref('');

/** 目标文档的章节（切片）产物列表：chunk_section 引用必须锚定切片，服务端按 artifactID 校验归属并快照版本。 */
const sections = ref<KnowledgeArtifact[]>([]);
const sectionsLoading = ref(false);
const sectionsError = ref('');
/** 已加载章节的文档 id，避免同文档重复请求；0 表示尚未加载。 */
const sectionsLoadedFor = ref(0);
const sectionSearch = ref('');
const visibleSections = computed(() => filterKnowledgeSections(sections.value, sectionSearch.value));

/** anchorEndpoint 统一取被编辑一侧的既有端点：更新模式来自引用本身，缺失时回退 anchor。 */
const anchorEndpoint = computed<KnowledgeFieldReferenceAnchor | null>(() => {
  if (props.mode === 'update') return props.reference?.[props.side] ?? props.anchor ?? null;
  return props.anchor;
});

/** resetForm 按模式回填初始值：新增模式从 anchor 预填定位类型与位置字段，目标文档与章节留给用户选择；更新模式整体回填被编辑一侧。 */
function resetForm() {
  const source = props.mode === 'update' ? anchorEndpoint.value : null;
  Object.assign(values, formValuesFromEndpoint(source ?? undefined));
  if (props.mode === 'create') {
    const anchor = anchorEndpoint.value;
    if (anchor?.locator) {
      const prefilled = formValuesFromEndpoint(anchor);
      values.kind = prefilled.kind;
      if (prefilled.kind === 'table_formula') {
        values.sheet = prefilled.sheet;
        values.cell = prefilled.cell;
        values.formula = prefilled.formula;
      } else if (prefilled.kind === 'equation') {
        values.latex = prefilled.latex;
      } else {
        values.headingPath = prefilled.headingPath;
      }
    }
  }
  values.evidence = props.mode === 'update' ? (props.reference?.evidence ?? '') : '';
  sectionSearch.value = '';
  for (const key of Object.keys(errors)) delete errors[key];
}

/** loadDocuments 拉取当前知识库目录并平铺出可选择的文档节点。 */
async function loadDocuments() {
  if (!props.knowledgeID) return;
  documentsLoading.value = true;
  documentsError.value = '';
  try {
    const response = await Api.getTree(props.knowledgeID);
    const files: KnowledgeTreeNode[] = [];
    const walk = (nodes: KnowledgeTreeNode[]) => {
      for (const node of nodes) {
        if (node.nodeType === 'file') files.push(node);
        if (node.children?.length) walk(node.children);
      }
    };
    walk(response.nodes ?? []);
    documents.value = files;
  } catch {
    documentsError.value = $t('knowledgeBase.text_9a4e0a7775f2');
  } finally {
    documentsLoading.value = false;
  }
}

/** loadSections 拉取目标文档的章节切片产物；chunk_section 引用的 artifactID 由此产生。 */
async function loadSections(documentID: number) {
  if (!documentID) return;
  sectionsLoading.value = true;
  sectionsError.value = '';
  try {
    const detail = await Api.getDetail(documentID);
    sections.value = detail.chunks ?? [];
    sectionsLoadedFor.value = documentID;
  } catch {
    sectionsError.value = $t('knowledgeBase.text_70d35235bc09');
  } finally {
    sectionsLoading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    resetForm();
    if (documents.value.length === 0) void loadDocuments();
    // 更新模式回填了目标文档，章节选项按需加载以显示已选章节
    if (values.documentID > 0 && sectionsLoadedFor.value !== values.documentID) void loadSections(values.documentID);
  },
  { immediate: true },
);

/** clearError 字段变更时移除对应错误，避免旧错误滞留。 */
function clearError(key: string) {
  delete errors[key];
}

/** setDocumentID 切换目标文档：原章节归属失效，清空章节选择并重新加载切片列表。 */
function setDocumentID(value: unknown) {
  const documentID = Number(value || 0);
  if (documentID === values.documentID) return;
  values.documentID = documentID;
  values.artifactID = 0;
  values.headingPath = '';
  sectionSearch.value = '';
  clearError('documentID');
  clearError('artifactID');
  clearError('headingPath');
  void loadSections(documentID);
}

/** selectSection 选中章节切片：回填产物 id 与标题路径，二者随后仍可人工微调。 */
function selectSection(value: unknown) {
  const artifactID = Number(value || 0);
  const section = sections.value.find((item) => item.id === artifactID);
  values.artifactID = artifactID;
  if (section) values.headingPath = knowledgeSectionOptionLabel(section);
  clearError('artifactID');
  clearError('headingPath');
}

/** setKind 切换定位类型；保留已填内容，切换后按新类型校验。 */
function setKind(kind: KnowledgeFieldReferenceFormValues['kind']) {
  values.kind = kind;
  clearError('headingPath');
  clearError('artifactID');
  clearError('formula');
  clearError('latex');
}

/** submit 校验通过后装配契约载荷：更新模式只替换 side 一侧端点；端点优先携带选中的章节产物 id。 */
function submit() {
  const found = validateFieldReferenceForm(values);
  for (const key of Object.keys(errors)) delete errors[key];
  Object.assign(errors, found);
  if (Object.keys(found).length > 0) return;
  // artifactID 三级来源：显式选择的章节 > 同文档场景回退 anchor 产物 > 缺省（仅 external 允许，由服务端校验拦截）
  const artifactID =
    values.artifactID > 0
      ? { artifactID: values.artifactID }
      : anchorEndpoint.value?.artifactID && anchorEndpoint.value.documentID === values.documentID
        ? { artifactID: anchorEndpoint.value.artifactID }
        : {};
  const endpoint = {
    ...artifactID,
    documentID: values.documentID,
    locator: toFormLocator(values),
  };
  if (props.mode === 'create') {
    const from = anchorEndpoint.value;
    if (!from?.documentID || !from.locator) {
      errors.anchor = $t('knowledgeBase.text_b102272c9e41');
      return;
    }
    emit('submit', {
      data: { evidence: values.evidence.trim(), from: { artifactID: from.artifactID, documentID: from.documentID, locator: from.locator }, to: endpoint },
      kind: 'create',
    });
    return;
  }
  if (!props.reference?.id) return;
  emit('submit', { data: { endpoint, evidence: values.evidence.trim(), id: props.reference.id, side: props.side }, kind: 'update' });
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent class="kb-ui flex w-full max-w-[480px] flex-col gap-0 overflow-y-auto p-0 pt-12">
      <div class="space-y-1 border-b px-4 pb-3">
        <SheetTitle class="text-base font-semibold">
          {{
            mode === 'create'
              ? $t('knowledgeBase.text_ea571f53750f')
              : side === 'to'
                ? $t('knowledgeBase.text_9726c7a3f15a')
                : $t('knowledgeBase.text_23fa0d43db9c')
          }}
        </SheetTitle>
        <SheetDescription class="text-muted-foreground text-xs leading-5">
          {{
            mode === 'create'
              ? $t('knowledgeBase.text_2449f6cecd30')
              : side === 'to'
                ? $t('knowledgeBase.text_e0121f764384')
                : $t('knowledgeBase.text_843a2ef0afdb')
          }}
        </SheetDescription>
      </div>

      <form class="space-y-4 p-4" @submit.prevent="submit">
        <p v-if="errors.anchor" role="alert" class="text-destructive border-destructive/40 rounded-md border p-2.5 text-xs">{{ errors.anchor }}</p>
        <div v-if="mode === 'create' && anchorEndpoint" class="text-muted-foreground bg-muted/30 rounded-md border p-2.5 text-xs leading-5">
          {{ $t('knowledgeBase.text_b3968bbc7632') }}{{ fieldLocatorSummary(anchorEndpoint.locator) || $t('knowledgeBase.text_f48328576008') }}
        </div>

        <div class="space-y-1.5">
          <Label :for="`${uid}-document`">{{ $t('knowledgeBase.text_3eeddf776957') }}</Label>
          <Select :model-value="values.documentID > 0 ? String(values.documentID) : ''" :disabled="documentsLoading" @update:model-value="setDocumentID">
            <SelectTrigger
              :id="`${uid}-document`"
              :aria-invalid="!!errors.documentID"
              :aria-describedby="errors.documentID ? `${uid}-document-error` : undefined"
            >
              <SelectValue :placeholder="$t('knowledgeBase.text_659a39d10c3b')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="node in documents" :key="node.id" :value="String(node.id)" :title="node.path">
                {{ node.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="errors.documentID" :id="`${uid}-document-error`" role="alert" class="text-destructive text-xs">{{ errors.documentID }}</p>
          <p v-if="documentsError" role="alert" class="text-destructive flex items-center gap-2 text-xs">
            {{ documentsError }}
            <Button variant="ghost" size="sm" class="h-6 px-2" @click="loadDocuments">{{ $t('knowledgeBase.text_e2d53a6d3a6a') }}</Button>
          </p>
        </div>

        <div class="space-y-1.5">
          <Label :for="`${uid}-kind`">{{ $t('knowledgeBase.text_405d735c00da') }}</Label>
          <Select :model-value="values.kind" @update:model-value="setKind($event as KnowledgeFieldReferenceFormValues['kind'])">
            <SelectTrigger :id="`${uid}-kind`">
              <SelectValue :placeholder="$t('knowledgeBase.text_8fa64055f680')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in fieldReferenceKindOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <template v-if="values.kind === 'chunk_section'">
          <div class="space-y-1.5">
            <Label :for="`${uid}-section-search`">{{ $t('knowledgeBase.text_b9dc4e2915c5') }}</Label>
            <Input :id="`${uid}-section-search`" v-model="sectionSearch" :placeholder="$t('knowledgeBase.text_a07215446f69')" />
          </div>
          <div class="space-y-1.5">
            <Label :for="`${uid}-section`">{{ $t('knowledgeBase.text_79485c85013c') }}</Label>
            <Select :model-value="values.artifactID > 0 ? String(values.artifactID) : ''" :disabled="sectionsLoading" @update:model-value="selectSection">
              <SelectTrigger
                :id="`${uid}-section`"
                :aria-invalid="!!errors.artifactID"
                :aria-describedby="errors.artifactID ? `${uid}-artifact-error` : undefined"
              >
                <SelectValue :placeholder="$t('knowledgeBase.text_a98211ba7be8')" />
              </SelectTrigger>
              <SelectContent class="max-h-64">
                <div v-if="sectionsLoading" class="text-muted-foreground px-3 py-2 text-xs">{{ $t('knowledgeBase.text_ed9e03cfb4a2') }}</div>
                <p v-else-if="sectionsError" role="alert" class="text-destructive flex items-center gap-2 px-3 py-2 text-xs">
                  {{ sectionsError }}
                  <Button variant="ghost" size="sm" class="h-6 px-2" @click="loadSections(values.documentID)">{{
                    $t('knowledgeBase.text_e2d53a6d3a6a')
                  }}</Button>
                </p>
                <p v-else-if="visibleSections.length === 0" class="text-muted-foreground px-3 py-2 text-xs">
                  {{ sections.length === 0 ? $t('knowledgeBase.text_5326887a5a24') : $t('knowledgeBase.text_8997ff9b2289') }}
                </p>
                <SelectItem v-for="section in visibleSections" :key="section.id" :value="String(section.id)" :title="section.content?.slice(0, 120)">
                  {{ knowledgeSectionOptionLabel(section) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.artifactID" :id="`${uid}-artifact-error`" role="alert" class="text-destructive text-xs">{{ errors.artifactID }}</p>
          </div>
          <div class="space-y-1.5">
            <Label :for="`${uid}-heading`">{{ $t('knowledgeBase.text_8fd1ed164203') }}</Label>
            <Input
              :id="`${uid}-heading`"
              v-model="values.headingPath"
              :placeholder="$t('knowledgeBase.text_3cfa8f2eb735')"
              :aria-invalid="!!errors.headingPath"
              :aria-describedby="errors.headingPath ? `${uid}-heading-error` : undefined"
              @update:model-value="clearError('headingPath')"
            />
            <p v-if="errors.headingPath" :id="`${uid}-heading-error`" role="alert" class="text-destructive text-xs">{{ errors.headingPath }}</p>
          </div>
        </template>

        <template v-else-if="values.kind === 'table_formula'">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label :for="`${uid}-sheet`">{{ $t('knowledgeBase.text_96f4b566bd2b') }}</Label>
              <Input
                :id="`${uid}-sheet`"
                v-model="values.sheet"
                :placeholder="$t('knowledgeBase.text_668ad49b898f')"
                @update:model-value="clearError('formula')"
              />
            </div>
            <div class="space-y-1.5">
              <Label :for="`${uid}-cell`">{{ $t('knowledgeBase.text_56e82238101c') }}</Label>
              <Input
                :id="`${uid}-cell`"
                v-model="values.cell"
                :placeholder="$t('knowledgeBase.text_045295de00e6')"
                @update:model-value="clearError('formula')"
              />
            </div>
          </div>
          <div class="space-y-1.5">
            <Label :for="`${uid}-formula`">{{ $t('knowledgeBase.text_3f27035af46b') }}</Label>
            <Input
              :id="`${uid}-formula`"
              v-model="values.formula"
              :placeholder="$t('knowledgeBase.text_140d282a9716')"
              :aria-invalid="!!errors.formula"
              :aria-describedby="errors.formula ? `${uid}-formula-error` : undefined"
              @update:model-value="clearError('formula')"
            />
            <p v-if="errors.formula" :id="`${uid}-formula-error`" role="alert" class="text-destructive text-xs">{{ errors.formula }}</p>
          </div>
        </template>

        <template v-else>
          <div class="space-y-1.5">
            <Label :for="`${uid}-latex`">{{ $t('knowledgeBase.text_34744b722f6e') }}</Label>
            <Input
              :id="`${uid}-latex`"
              v-model="values.latex"
              :placeholder="$t('knowledgeBase.text_fa4552042f58')"
              :aria-invalid="!!errors.latex"
              :aria-describedby="errors.latex ? `${uid}-latex-error` : undefined"
              @update:model-value="clearError('latex')"
            />
            <p v-if="errors.latex" :id="`${uid}-latex-error`" role="alert" class="text-destructive text-xs">{{ errors.latex }}</p>
          </div>
        </template>

        <div class="space-y-1.5">
          <Label :for="`${uid}-params`">{{ $t('knowledgeBase.text_ecb6c72b4c56') }}</Label>
          <Input
            :id="`${uid}-params`"
            v-model="values.paramNames"
            :placeholder="$t('knowledgeBase.text_be3ce84a1487')"
            :aria-invalid="!!errors.paramNames"
            :aria-describedby="errors.paramNames ? `${uid}-params-error` : undefined"
            @update:model-value="clearError('paramNames')"
          />
          <p v-if="errors.paramNames" :id="`${uid}-params-error`" role="alert" class="text-destructive text-xs">{{ errors.paramNames }}</p>
        </div>

        <div class="space-y-1.5">
          <Label :for="`${uid}-page`">{{ $t('knowledgeBase.text_c97e479db334') }}</Label>
          <Input
            :id="`${uid}-page`"
            v-model="values.pageIdx"
            inputmode="numeric"
            :placeholder="$t('knowledgeBase.text_7d618dd2e20e')"
            :aria-invalid="!!errors.pageIdx"
            :aria-describedby="errors.pageIdx ? `${uid}-page-error` : undefined"
            @update:model-value="clearError('pageIdx')"
          />
          <p v-if="errors.pageIdx" :id="`${uid}-page-error`" role="alert" class="text-destructive text-xs">{{ errors.pageIdx }}</p>
        </div>

        <div class="space-y-1.5">
          <Label :for="`${uid}-evidence`">{{ $t('knowledgeBase.text_dde95eb32fff') }}</Label>
          <Textarea :id="`${uid}-evidence`" v-model="values.evidence" rows="3" :placeholder="$t('knowledgeBase.text_d6df9937189f')" />
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          <Button
            v-if="allowMarkReviewed && reference"
            type="button"
            variant="outline"
            class="mr-auto"
            :disabled="submitting"
            @click="emit('markReviewed', reference)"
          >
            {{ $t('knowledgeBase.text_4399175f025d') }}
          </Button>
          <Button type="button" variant="outline" :disabled="submitting" @click="emit('update:open', false)">{{
            $t('knowledgeBase.text_4d0b4688c787')
          }}</Button>
          <Button type="button" :disabled="submitting || !canWrite" @click="submit">
            <LoaderCircle v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
            {{ mode === 'create' ? $t('knowledgeBase.text_88ad1745ef38') : $t('knowledgeBase.text_fadf24dbc5a9') }}
          </Button>
        </div>
      </form>
    </SheetContent>
  </Sheet>
</template>
