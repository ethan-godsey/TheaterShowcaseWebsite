<template>
  <!--
    Two live regions: errors interrupt a screen reader (role="alert"), info
    waits its turn (role="status"). Both stay mounted while empty, because a
    live region only announces changes it was already present to observe.
  -->
  <div class="toasts">
    <div role="alert" class="toasts__stack">
      <TransitionGroup name="toast">
        <p v-for="t in errors" :key="t.id" class="toast toast--error">
          <span>{{ t.message }}</span>
          <button type="button" class="toast__x" aria-label="Dismiss" @click="dismiss(t.id)">&times;</button>
        </p>
      </TransitionGroup>
    </div>
    <div role="status" class="toasts__stack">
      <TransitionGroup name="toast">
        <p v-for="t in infos" :key="t.id" class="toast">
          <span>{{ t.message }}</span>
          <button type="button" class="toast__x" aria-label="Dismiss" @click="dismiss(t.id)">&times;</button>
        </p>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const errors = computed(() => toasts.value.filter((t) => t.tone === 'error'))
const infos = computed(() => toasts.value.filter((t) => t.tone === 'info'))
</script>

<style scoped>
.toasts {
  position: fixed;
  right: var(--space-sm);
  bottom: var(--space-sm);
  z-index: 100;
  display: grid;
  gap: 0.5rem;
  max-width: min(24rem, calc(100vw - 2 * var(--space-sm)));
  pointer-events: none; /* the empty container mustn't block clicks beneath */
}

.toasts__stack { display: grid; gap: 0.5rem; }

.toast {
  pointer-events: auto;
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: 0.75rem 0.9rem;
  background: var(--ink);
  color: var(--paper);
  font-size: var(--step--1);
  box-shadow: 6px 6px 0 0 var(--teal);
}

.toast--error { box-shadow: 6px 6px 0 0 var(--coral); }

.toast__x {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
}

.toast__x:hover { opacity: 1; }

.toast-enter-active,
.toast-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateY(8px); }

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active { transition: none; }
}
</style>
