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

      <div class="sp__scroll">
        <table class="sp__table">
          <thead>
            <tr>
              <th scope="col">Production</th>
              <th scope="col">Role</th>
              <th scope="col">Venue</th>
              <th scope="col">Date</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="show in shows" :key="show.id">
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
              <td colspan="5" class="sp__empty">No credits yet. Add the first one.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
/*
 * The container. It owns the store conversation and the "which row is being
 * edited" state; ShowForm stays ignorant of both. One component talks to the
 * store, the other is reusable anywhere.
 */
import { ref, computed, onMounted } from 'vue'
import { useStore } from '@/store'
import type { Show } from '@/types'
import type { ShowDraft } from '@/store/modules/shows'
import ShowForm from './ShowForm.vue'

const store = useStore()

const editing = ref(false)
/** null = adding new; a Show = editing that one. */
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
  // runRequest returns undefined on failure; the error is already in state,
  // so we simply keep the form open with the user's work intact.
  if (saved) editing.value = false
}

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
