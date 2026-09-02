<template>
  <form class="sf" @submit.prevent="onSubmit">
    <h3 class="sf__title">{{ isNew ? 'Add a credit' : 'Edit credit' }}</h3>

    <div class="sf__grid">
      <label class="field">
        <span>Production</span>
        <input v-model.trim="title" type="text" required placeholder="The SpongeBob Musical" />
      </label>

      <label class="field">
        <span>Role</span>
        <input v-model.trim="role" type="text" required placeholder="SpongeBob" />
      </label>

      <label class="field">
        <span>Venue</span>
        <input v-model.trim="venue" type="text" required placeholder="University Mainstage" />
      </label>

      <label class="field">
        <!-- type="date" binds a plain YYYY-MM-DD string, which is exactly the
             `date: string` contract the API and DB already speak. No parsing. -->
        <span>Date</span>
        <input v-model="date" type="date" required />
      </label>
    </div>

    <div class="sf__actions">
      <button class="btn" type="submit" :disabled="saving || !isValid">
        {{ saving ? 'Saving…' : isNew ? 'Add credit' : 'Save changes' }}
      </button>
      <button class="sf__ghost" type="button" @click="emit('cancel')">Cancel</button>
      <span v-if="dirty" class="sf__dirty">unsaved changes</span>
    </div>
  </form>
</template>

<script setup lang="ts">
/*
 * A presentational form. It takes a show in and emits the edited values out —
 * it never touches the store. That's what makes it reusable and testable, and
 * it's the props-down / events-up contract in its simplest honest form.
 */
import { ref, computed, watch } from 'vue'
import type { Show } from '@/types'
import type { ShowDraft } from '@/store/modules/shows'

const props = defineProps<{
  /** null when adding a new credit. */
  show: Show | null
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [draft: ShowDraft]
  cancel: []
}>()

/*
 * Local copies, not direct edits to props. Props are readonly, and a form the
 * user can abandon must be able to throw its changes away.
 */
const title = ref('')
const role = ref('')
const venue = ref('')
const date = ref('')

const isNew = computed(() => props.show === null)

/*
 * The parent swaps which show is being edited without unmounting this
 * component, so a watcher re-seeds the fields. `immediate` makes it also run
 * on first render, which is why there's no duplicate setup in onMounted.
 */
watch(
  () => props.show,
  (show) => {
    title.value = show?.title ?? ''
    role.value = show?.role ?? ''
    venue.value = show?.venue ?? ''
    date.value = show?.date ?? ''
  },
  { immediate: true },
)

const isValid = computed(
  () => title.value !== '' && role.value !== '' && venue.value !== '' && date.value !== '',
)

/** Drives the "unsaved changes" hint — cheap protection against a lost edit. */
const dirty = computed(() => {
  if (!props.show) {
    return title.value !== '' || role.value !== '' || venue.value !== '' || date.value !== ''
  }
  return (
    title.value !== props.show.title ||
    role.value !== props.show.role ||
    venue.value !== props.show.venue ||
    date.value !== props.show.date
  )
})

function onSubmit(): void {
  if (!isValid.value) return
  emit('save', {
    ...(props.show ? { id: props.show.id } : {}),
    title: title.value,
    role: role.value,
    venue: venue.value,
    date: date.value,
    poster: props.show?.poster ?? null,
  })
}
</script>

<style scoped>
.sf {
  border: 1px solid var(--rule);
  background: var(--paper-card);
  padding: clamp(1.1rem, 3vw, 1.75rem);
  display: grid;
  gap: var(--space-sm);
  width: 100%;
}

.sf__title { font-size: var(--step-1); }

.sf__grid { display: grid; gap: var(--space-sm); grid-template-columns: 1fr; }
@media (min-width: 640px) { .sf__grid { grid-template-columns: 1fr 1fr; } }

.field { display: grid; gap: 0.3rem; }

.field span {
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

.field input {
  border: 1px solid var(--rule);
  background: var(--paper);
  padding: 0.6rem 0.75rem;
  width: 100%;
}

.field input:focus { border-color: var(--teal); }

.sf__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); }
.sf .btn { cursor: pointer; }

.sf__ghost {
  background: none;
  border: 0;
  padding: 0.4rem 0;
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-mute);
  cursor: pointer;
}

.sf__ghost:hover { color: var(--teal); }

.sf__dirty { font-size: var(--step--1); color: var(--coral); }
</style>
