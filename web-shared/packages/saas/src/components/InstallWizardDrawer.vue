<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
  Separator,
  VbenIcon,
} from '@vben-core/shadcn-ui';

defineOptions({
  name: 'InstallWizardDrawer',
});

type StepStatus = 'done' | 'pending' | 'progress';

withDefaults(
  defineProps<{
    integrationDescription?: string;
    integrationName?: string;
    termsLabel?: string;
  }>(),
  {
    integrationName: 'Statsig',
    integrationDescription: 'Performant Feature Flags, Experiments, Analytics, and Log Drains',
    termsLabel: 'Terms of Service',
  },
);

const emit = defineEmits<{
  accepted: [];
  close: [];
}>();

const open = defineModel<boolean>('open', { default: false });

const selectedPlan = ref<null | 'free' | 'pro'>(null);
const activeStep = ref<1 | 2 | 3>(1);
const resourceName = ref('statsig-cobalt-cushion');
const cardNo = ref('');
const cardExpiry = ref('');
const cardCvc = ref('');
const billingName = ref(`xfinethestart-8044's projects`);
const countryRegion = ref('Singapore');
const billingAddress = ref('');
const usePrimaryAddress = ref(true);

const isPlanStep = computed(() => activeStep.value === 1);
const isConfirmStep = computed(() => activeStep.value === 2);
const isPaymentStep = computed(() => activeStep.value === 3);
const resourceLength = computed(() => resourceName.value.length);

watch(open, (value) => {
  if (value) {
    selectedPlan.value = null;
    activeStep.value = 1;
  }
});

function getStepClass(status: StepStatus) {
  if (status === 'done') return 'border-white bg-white text-black';
  if (status === 'progress') return 'border-white bg-white text-black';
  return 'border-border/70 bg-transparent text-muted-foreground';
}

function getStepIcon(status: StepStatus) {
  if (status === 'done') return 'carbon:checkmark';
  if (status === 'progress') return 'carbon:chevron-right';
  return '';
}

function handleAccept() {
  emit('accepted');
}

function handleClose() {
  open.value = false;
  emit('close');
}

function handleUsePrimaryChange(value: boolean | 'indeterminate') {
  usePrimaryAddress.value = value === true;
}

function selectPlan(plan: 'free' | 'pro') {
  selectedPlan.value = plan;
}

function getStepStatus(step: 1 | 2 | 3 | 4): StepStatus {
  if (step === 4) return 'pending';
  if (step < activeStep.value) return 'done';
  if (step === activeStep.value) return 'progress';
  return 'pending';
}

function goStep(step: 1 | 2 | 3) {
  activeStep.value = step;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :open="open"
      :modal="true"
      :show-close="true"
      class="!right-3 !left-auto !top-3 !h-[calc(100dvh-1.5rem)] !w-[430px] !max-w-[95vw] !translate-x-0 !translate-y-0 overflow-hidden rounded-xl border border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur-sm transform-gpu will-change-transform duration-300 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-full"
      @close="handleClose"
    >
      <div class="flex h-full flex-col">
        <DialogHeader class="px-5 pb-3 pt-4 text-left">
          <DialogTitle class="text-base font-semibold">Install Integration</DialogTitle>
          <DialogDescription class="sr-only">
            Install marketplace integration with step-by-step setup.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea class="min-h-0 flex-1 basis-0">
          <div class="flex w-full min-w-0 flex-col items-stretch space-y-5 p-4 text-left">
            <Card class="w-full border-border/60 bg-muted/15">
              <CardContent class="p-3.5">
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex size-8 items-center justify-center rounded-full bg-white text-black">
                    <VbenIcon icon="carbon:flash" class="size-4" />
                  </div>
                  <div class="min-w-0 space-y-1">
                    <p class="text-sm font-medium">{{ integrationName }}</p>
                    <p class="text-muted-foreground text-xs leading-5">
                      {{ integrationDescription }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div class="relative w-full">
              <div class="absolute bottom-6 left-5 top-5 z-0 w-px border-l border-dashed border-white/35" />

              <Card class="relative w-full overflow-visible border-border/60">
                <CardContent class="space-y-0 p-0">
                  <div
                    class="absolute left-2 top-3 flex size-6 items-center justify-center rounded-full border bg-background"
                    :class="getStepClass(getStepStatus(1))"
                  >
                    <VbenIcon
                      v-if="getStepIcon(getStepStatus(1))"
                      :icon="getStepIcon(getStepStatus(1))"
                      class="size-3.5"
                    />
                  </div>

                  <button
                    type="button"
                    class="flex h-14 w-full items-center gap-2 pl-12 pr-4 text-left outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    @click="goStep(1)"
                  >
                    <p class="text-foreground text-sm font-semibold">Configuration and Plan</p>
                  </button>

                  <div v-if="isPlanStep" class="space-y-3 p-4 pt-3">
                    <p class="text-sm font-semibold">Installation Plans</p>

                    <button
                      type="button"
                      class="bg-muted/20 hover:bg-muted/40 flex w-full items-start justify-between rounded-md border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                      :class="selectedPlan === 'free' ? 'border-border bg-muted/30' : 'border-border/60'"
                      @click="selectPlan('free')"
                    >
                      <div>
                        <p class="text-sm font-medium">Free Tier</p>
                        <p class="text-muted-foreground mt-0.5 text-xs">
                          Growth tools for individual builders
                        </p>
                      </div>
                      <VbenIcon
                        :icon="selectedPlan === 'free' ? 'carbon:checkmark-filled' : 'carbon:circle-outline'"
                        class="mt-0.5 size-4 text-foreground/80"
                      />
                    </button>

                    <button
                      type="button"
                      class="bg-muted/20 hover:bg-muted/40 flex w-full items-start justify-between rounded-md border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                      :class="selectedPlan === 'pro' ? 'border-border bg-muted/30' : 'border-border/60'"
                      @click="selectPlan('pro')"
                    >
                      <div>
                        <p class="text-sm font-medium">Pro Tier</p>
                        <p class="text-muted-foreground mt-0.5 text-xs">
                          A complete platform for growing teams
                        </p>
                      </div>
                      <VbenIcon
                        :icon="selectedPlan === 'pro' ? 'carbon:checkmark-filled' : 'carbon:circle-outline'"
                        class="mt-0.5 size-4 text-foreground/80"
                      />
                    </button>

                    <div class="flex justify-end pt-1">
                      <Button
                        size="sm"
                        class="h-9 rounded-md bg-white px-4 text-black hover:bg-white/90"
                        :disabled="!selectedPlan"
                        @click="goStep(2)"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card class="relative mt-6 w-full overflow-visible border-border/60">
                <CardContent class="space-y-0 p-0">
                  <div
                    class="absolute left-2 top-3 flex size-6 items-center justify-center rounded-full border bg-background"
                    :class="getStepClass(getStepStatus(2))"
                  >
                    <VbenIcon
                      v-if="getStepIcon(getStepStatus(2))"
                      :icon="getStepIcon(getStepStatus(2))"
                      class="size-3.5"
                    />
                  </div>

                  <button
                    type="button"
                    class="flex h-14 w-full items-center gap-2 pl-12 pr-4 text-left outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    @click="goStep(2)"
                  >
                    <p class="text-foreground text-sm font-semibold">Confirmation</p>
                  </button>

                  <div v-if="isConfirmStep" class="space-y-3 p-4 pt-3">
                    <div class="space-y-1.5">
                      <Label class="text-xs text-muted-foreground">Resource Name</Label>
                      <Input v-model="resourceName" class="h-9" />
                      <div class="flex items-center justify-between text-xs text-muted-foreground">
                        <span>This is how we call your Collection in dashboard.</span>
                        <span>{{ resourceLength }}/128</span>
                      </div>
                    </div>

                    <div class="rounded-md border border-border/70 bg-muted/10">
                      <div class="px-3 py-2">
                        <p class="text-sm font-medium">{{ selectedPlan === 'pro' ? 'Pro Tier' : 'Free Tier' }}</p>
                        <p class="text-muted-foreground text-xs">
                          {{ selectedPlan === 'pro' ? 'A complete platform for growing teams' : 'Growth tools for individual builders' }}
                        </p>
                      </div>
                      <div class="grid grid-cols-2 border-t border-border/70 px-3 py-2 text-sm">
                        <span class="text-muted-foreground">Events per month</span>
                        <span class="text-right">{{ selectedPlan === 'pro' ? '5M included, then $0.05 per 1K events' : '100k included' }}</span>
                      </div>
                      <div class="grid grid-cols-2 border-t border-border/70 px-3 py-2 text-sm">
                        <span class="text-muted-foreground">Flag & Config Checks</span>
                        <span class="text-right">Unlimited</span>
                      </div>
                      <div class="grid grid-cols-2 border-t border-border/70 px-3 py-2 text-sm">
                        <span class="text-muted-foreground">Session replays per month</span>
                        <span class="text-right">{{ selectedPlan === 'pro' ? '100,000' : '-' }}</span>
                      </div>
                      <div class="grid grid-cols-2 border-t border-border/70 px-3 py-2 text-sm">
                        <span class="text-muted-foreground">Seats</span>
                        <span class="text-right">{{ selectedPlan === 'pro' ? 'Unlimited' : '3' }}</span>
                      </div>
                    </div>

                    <p class="text-right text-xs text-muted-foreground">* Plus applicable tax and fees</p>

                    <div class="flex items-center justify-between pt-1">
                      <Button variant="outline" class="h-9 rounded-md" @click="goStep(1)">Back</Button>
                      <Button class="h-9 rounded-md bg-white px-4 text-black hover:bg-white/90" @click="goStep(3)">Create</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card class="relative mt-6 w-full overflow-visible border-border/60">
                <CardContent class="space-y-0 p-0">
                  <div
                    class="absolute left-2 top-3 flex size-6 items-center justify-center rounded-full border bg-background"
                    :class="getStepClass(getStepStatus(3))"
                  >
                    <VbenIcon
                      v-if="getStepIcon(getStepStatus(3))"
                      :icon="getStepIcon(getStepStatus(3))"
                      class="size-3.5"
                    />
                  </div>

                  <button
                    type="button"
                    class="flex h-14 w-full items-center gap-2 pl-12 pr-4 text-left outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    @click="goStep(3)"
                  >
                    <p class="text-foreground text-sm font-semibold">Payment Method</p>
                  </button>

                  <div v-if="isPaymentStep" class="space-y-3 p-4 pt-3">
                    <div class="space-y-1.5">
                      <Label class="text-xs text-muted-foreground">Card Number</Label>
                      <Input v-model="cardNo" class="h-9" placeholder="1234 1234 1234 1234" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div class="space-y-1.5">
                        <Label class="text-xs text-muted-foreground">Expiry</Label>
                        <Input v-model="cardExpiry" class="h-9" placeholder="MM/YY" />
                      </div>
                      <div class="space-y-1.5">
                        <Label class="text-xs text-muted-foreground">CVC</Label>
                        <Input v-model="cardCvc" class="h-9" placeholder="CVC" />
                      </div>
                    </div>
                    <div class="space-y-1.5">
                      <Label class="text-xs text-muted-foreground">Full Name</Label>
                      <Input v-model="billingName" class="h-9" />
                    </div>
                    <div class="space-y-1.5">
                      <Label class="text-xs text-muted-foreground">Country / Region</Label>
                      <Input v-model="countryRegion" class="h-9" />
                    </div>
                    <div class="space-y-1.5">
                      <Label class="text-xs text-muted-foreground">Address</Label>
                      <Input
                        v-model="billingAddress"
                        class="h-9"
                        :class="billingAddress.trim() ? '' : 'border-destructive/70'"
                      />
                      <p v-if="!billingAddress.trim()" class="text-xs text-destructive">
                        该字段不完整。
                      </p>
                    </div>
                    <label class="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        :checked="usePrimaryAddress"
                        @update:checked="handleUsePrimaryChange"
                      />
                      <span class="text-xs text-muted-foreground">
                        Use the billing address as my team's primary address
                      </span>
                    </label>
                    <div class="flex items-center justify-between pt-1">
                      <Button variant="outline" class="h-9 rounded-md" @click="goStep(2)">Back</Button>
                      <Button class="h-9 rounded-md bg-white px-4 text-black hover:bg-white/90" @click="handleAccept">Continue</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card class="relative mt-6 w-full overflow-visible border-border/60 opacity-85">
                <CardContent class="p-0">
                  <div
                    class="absolute left-2 top-3 flex size-6 items-center justify-center rounded-full border bg-background"
                    :class="getStepClass(getStepStatus(4))"
                  >
                    <VbenIcon
                      v-if="getStepIcon(getStepStatus(4))"
                      :icon="getStepIcon(getStepStatus(4))"
                      class="size-3.5"
                    />
                  </div>
                  <div class="flex h-14 items-center pl-12 pr-4">
                    <p class="text-sm font-semibold text-muted-foreground">Collection Provisioning</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>

        <Separator />
      </div>
    </DialogContent>
  </Dialog>
</template>
