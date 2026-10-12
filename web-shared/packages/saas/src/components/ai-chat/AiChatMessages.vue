<!-- 文件说明：渲染会话消息与轮次定位标记，来源引用导航可跳转到对应原文。 -->
<script lang="ts" setup>
import { $t } from '@vben/saas/locales';
import type { AiToolEvent, ChatMessage } from './api';
import type { ResultFollowUp } from './interaction';

import { computed } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '../ai-elements';
import AiChatMessage from './AiChatMessage.vue';

interface DisplayMessage extends ChatMessage {
  clarify?: any;
  id: string;
  isLoading?: boolean;
  toolEventList?: AiToolEvent[];
  /** 历史轮次用于来源引用定位。 */
  turnIndex?: number;
}

interface Props {
  messages: DisplayMessage[];
  /** 结束或归档会话保留查看能力，隐藏继续提问。 */
  readOnly?: boolean;
}

defineOptions({ name: 'AiChatMessages' });
const props = defineProps<Props>();
const emit = defineEmits<{
  clarifySelect: [msg: DisplayMessage, option: string];
  followUp: [reference: ResultFollowUp];
  quickSend: [text: string];
  /** 重新生成指定 AI 回复，仅最后一条回复且会话可写时可用。 */
  regenerate: [msg: DisplayMessage];
}>();

/** 最后一条 AI 回复是重新生成的唯一入口，历史回复重放会破坏后续轮次。 */
const lastAssistantId = computed(() => [...props.messages].reverse().find((message) => message.role === 'assistant')?.id);

/** 快捷提问跟随当前界面语言更新。 */
const quickPrompts = computed(() => [$t('aiChat.ui.whatFunctionsDoesThisPlatformHave'), $t('aiChat.ui.helpMeAnalyzeTheDataOfTheCurrentApplication'), $t('aiChat.ui.whatFilesCanIUploadForAnalysis')]);
</script>

<template>
  <Conversation class="min-h-0 min-w-0 flex-1" :aria-label="$t('aiChat.ui.aiDialogueMessageList')">
    <ConversationContent v-if="props.messages.length > 0" class="mx-auto w-full min-w-0 max-w-[920px] px-5 py-7">
      <AiChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :data-turn-index="msg.turnIndex"
        :message="msg"
        :read-only="readOnly"
        :regenerable="!readOnly && !msg.isLoading && msg.id === lastAssistantId"
        @follow-up="emit('followUp', $event)"
        @clarify-select="(option: string) => emit('clarifySelect', msg, option)"
        @regenerate="emit('regenerate', msg)"
      />
    </ConversationContent>

    <!-- 空状态:欢迎语 + 快捷提问 -->
    <div v-else class="flex size-full items-center justify-center px-4">
      <ConversationEmptyState class="py-12">
        <div class="bg-muted mb-2 flex size-14 items-center justify-center rounded-2xl">
          <VbenIcon icon="lucide:message-square-text" class="text-foreground size-7" />
        </div>
        <h3 class="text-foreground mb-1 text-sm font-medium">{{ $t('aiChat.ui.howCanIHelpYou') }}</h3>
        <p class="text-muted-foreground mb-5 text-xs">{{ $t('aiChat.ui.enterAMessageToStartAConversationOrTryTheQuestio') }}</p>
        <div class="flex w-full flex-col gap-2">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            data-testid="ai-chat-quick-prompt"
            class="border-border bg-background hover:bg-muted text-foreground w-full rounded-lg border px-3 py-2.5 text-left text-xs transition-colors"
            @click="emit('quickSend', prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </ConversationEmptyState>
    </div>

    <ConversationScrollButton />
  </Conversation>
</template>
