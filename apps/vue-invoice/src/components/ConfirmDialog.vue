<script setup lang="ts">
/**
 * @file ConfirmDialog.vue
 * Accessible confirmation built on the native <dialog> element:
 * showModal() traps focus and makes the page inert, Escape cancels, and
 * focus goes back to the button that opened it.
 */
import { nextTick, ref, useId, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
}>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const dialog = ref<HTMLDialogElement | null>(null);
const cancelButton = ref<HTMLButtonElement | null>(null);
const titleId = useId();
const textId = useId();
let opener: HTMLElement | null = null;

watch(
  () => props.open,
  async (open) => {
    const element = dialog.value;
    if (!element) return;
    if (open && !element.open) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
      await nextTick();
      cancelButton.value?.focus(); // the safe choice gets focus first
    } else if (!open && element.open) {
      element.close();
    }
  },
);

/** Native "close" (also after Escape): restore focus to the opener. */
function onClose(): void {
  if (opener?.isConnected) opener.focus();
  opener = null;
  if (props.open) emit('cancel');
}

function onCancel(event: Event): void {
  event.preventDefault(); // let Vue state close the dialog
  emit('cancel');
}
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    :aria-labelledby="titleId"
    :aria-describedby="textId"
    @close="onClose"
    @cancel="onCancel"
  >
    <h2 :id="titleId" class="dialog__title">{{ title }}</h2>
    <p :id="textId">{{ text }}</p>
    <div class="dialog__actions">
      <button ref="cancelButton" type="button" class="btn btn--secondary" @click="emit('cancel')">
        {{ cancelLabel }}
      </button>
      <button type="button" class="btn btn--danger" @click="emit('confirm')">
        {{ confirmLabel }}
      </button>
    </div>
  </dialog>
</template>
