<template>
  <section class="sp">
    <header class="sp__head">
      <div>
        <h2 class="sp__title">Credits</h2>
        <p class="sp__count">{{ shows.length }} on the site</p>
      </div>
      <button v-if="!editing" class="btn" type="button" @click="startNew">Add credit</button>
    </header>

    <p v-if="loading" class="state">Loading credits…</p>
    <p v-else-if="loadError" class="state state--error">{{ loadError }}</p>

    <template v-else>
      <ShowForm
        v-if="editing"
        :show="draft"
        :saving="saving"
        @save="onSave"
        @cancel="editing = false"
      />

      <p v-if="saveError" class="state state--error">{{ saveError }}</p>

      <p v-if="shows.length > 1" class="sp__hint">
        Drag the <span aria-hidden="true">⠿</span> handle to reorder. The site lists past
        credits in this order; upcoming shows stay in date order.
      </p>

      <div class="sp__scroll" :class="{ 'sp__scroll--saving': reordering }" :aria-busy="reordering">
        <table class="sp__table">
          <thead>
            <tr>
              <th scope="col"><span class="visually-hidden">Reorder</span></th>
              <th scope="col">Production</th>
              <th scope="col">Role</th>
              <th scope="col">Venue</th>
              <th scope="col">Date</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody ref="rows">
            <tr v-for="show in shows" :key="show.id">
              <td class="sp__grip">
                <span class="sp__handle" :title="`Drag to move ${show.title}`" aria-hidden="true">⠿</span>
              </td>
              <td class="sp__strong">{{ show.title }}</td>
              <td class="sp__role">{{ show.role }}</td>
              <td>{{ show.venue }}</td>
              <td class="sp__date">{{ show.date }}</td>
              <td class="sp__row-actions">
                <button type="button" @click="startEdit(show)">Edit</button>
                <button type="button" class="sp__danger" @click="onDelete(show)">Delete</button>
              </td>
            </tr>
            <tr v-if="!shows.length">
              <td colspan="6" class="sp__empty">No credits yet. Add the first one.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">

import { ref, computed, onMounted, useTemplateRef } from 'vue'
import { useStore } from '@/store'
import { useToast } from '@/composables/useToast'
import { useSortable, moveId } from '@/composables/useSortable'
import type { Show } from '@/types'
import type { ShowDraft } from '@/store/modules/shows'
import ShowForm from './ShowForm.vue'

const store = useStore()

const editing = ref(false)

// null = adding new; a Show = editing that one.
const draft = ref<Show | null>(null)

const shows = computed<Show[]>(() => store.state.shows.items)
const loading = computed<boolean>(() => store.getters['shows/isLoading']('fetch'))
const loadError = computed<string | null>(() => store.getters['shows/requestError']('fetch'))
const saving = computed<boolean>(() => store.getters['shows/isLoading']('save'))
const saveError = computed<string | null>(() => store.getters['shows/requestError']('save'))

onMounted(() => store.dispatch('shows/fetch'))

function startNew(): void {
  draft.value = null
  editing.value = true
}

function startEdit(show: Show): void {
  draft.value = show
  editing.value = true
}

async function onSave(payload: ShowDraft): Promise<void> {
  const saved = await store.dispatch('shows/save', payload)
  
  // keep the form open with the user's work intact.
  if (saved) editing.value = false
}

/* ── Drag to reorder ───────────────────────────────────────────────
   Rows drag by the handle only, not anywhere on the row: the cells hold text
   she may want to select, and Edit/Delete must stay plain buttons. A handle
   also means touch drags can start immediately (no hold delay) without
   breaking scrolling, because a swipe elsewhere on the row still scrolls. */
const toast = useToast()
const rows = useTemplateRef<HTMLTableSectionElement>('rows')
const reordering = ref(false)

useSortable(
  rows,
  async (from, to) => {
    reordering.value = true
    const ids = moveId(shows.value.map((s) => s.id), from, to)
    const ok = await store.dispatch('shows/reorder', ids)
    reordering.value = false

    if (!ok) {
      const reason = store.getters['shows/requestError']('reorder') as string | null
      toast.error(`Couldn't save the new order${reason ? `: ${reason}` : '.'}`)
    }
  },
  {
    handle: '.sp__handle',
    ghostClass: 'sp__row--ghost',
    chosenClass: 'sp__row--chosen',
  },
)

async function onDelete(show: Show): Promise<void> {
  if (!window.confirm(`Delete "${show.title}"? This can't be undone.`)) return
  await store.dispatch('shows/remove', show.id)
}
</script>

<style scoped>
.sp { display: grid; gap: var(--space-sm); width: 100%; }

.sp__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.sp__title { font-size: var(--step-2); }
.sp__count { font-size: var(--step--1); color: var(--ink-mute); }
.sp .btn { cursor: pointer; }

.sp__scroll { overflow-x: auto; border: 1px solid var(--rule); background: var(--paper-card); }
.sp__table { width: 100%; border-collapse: collapse; min-width: 44rem; }

.sp__table th {
  text-align: left;
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-mute);
  padding: 0.7rem 0.9rem;
  border-bottom: 2px solid var(--ink);
}

.sp__table td { padding: 0.7rem 0.9rem; border-bottom: 1px solid var(--rule); vertical-align: baseline; }
.sp__table tbody tr:last-child td { border-bottom: 0; }
.sp__strong { font-family: var(--font-display); font-weight: 600; color: var(--ink); }
.sp__role { color: var(--teal); }
.sp__date { white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--ink-mute); }
.sp__empty { color: var(--ink-mute); text-align: center; padding: var(--space-md) !important; }

.sp__row-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

.sp__hint { font-size: var(--step--1); color: var(--ink-mute); }

.sp__grip { width: 1%; padding-right: 0 !important; }

.sp__handle {
  display: inline-block;
  padding: 0.15rem 0.3rem;
  color: var(--ink-mute);
  cursor: grab;
  touch-action: none; /* the handle is for dragging, never scrolling */
  user-select: none;
}

.sp__handle:hover { color: var(--teal); }

.sp__row--ghost td { opacity: 0.35; background: var(--paper-deep); }
.sp__row--chosen .sp__handle { cursor: grabbing; }

.sp__scroll--saving { opacity: 0.7; transition: opacity 0.2s ease; }

.sp__row-actions button {
  background: none;
  border: 0;
  padding: 0;
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-mute);
  cursor: pointer;
}

.sp__row-actions button:hover { color: var(--teal); }
.sp__row-actions .sp__danger:hover { color: var(--coral); }
</style>
