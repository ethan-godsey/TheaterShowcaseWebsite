<template>
  <section class="mp">
    <header class="mp__head">
      <div>
        <h2 class="mp__title">Reel &amp; clips</h2>
        <p class="mp__count">{{ items.length }} on the site</p>
      </div>
      <button v-if="!editing" class="btn" type="button" @click="startNew">Add reel</button>
    </header>

    <p v-if="loading" class="state">Loading…</p>
    <p v-else-if="loadError" class="state state--error">{{ loadError }}</p>

    <template v-else>
      <form v-if="editing" class="mf" @submit.prevent="onSubmit">
        <h3 class="mf__title">{{ draft ? 'Edit reel' : 'Add a reel' }}</h3>

        <label class="field">
          <span>Title</span>
          <input v-model.trim="title" type="text" required placeholder="Performance reel 2026" />
        </label>

        <label class="field">
          <span>Video link</span>
          <input
            v-model.trim="rawUrl"
            type="url"
            required
            placeholder="https://vimeo.com/76979871"
          />
          <!-- Paste anything; we normalise it. A watch link in an iframe
               renders a blank box, which is the #1 way this goes wrong. -->
          <small v-if="embedUrl" class="mf__hint">
            <Kbd>Linked as</Kbd> 
            <code>{{ embedUrl }}</code></small>
          <small v-else-if="rawUrl" class="mf__hint mf__hint--warn">
            Not a Vimeo or YouTube link, it may not play.
          </small>
        </label>

        <label class="field">
          <span>Category <em>(optional)</em></span>
          <input v-model.trim="category" type="text" placeholder="Ballad, uptempo, comedic…" />
        </label>

        <div class="mf__actions">
          <button class="btn" type="submit" :disabled="saving || !isValid">
            {{ saving ? 'Saving…' : draft ? 'Save changes' : 'Add reel' }}
          </button>
          <button class="mp__ghost" type="button" @click="editing = false">Cancel</button>
        </div>
      </form>

      <p v-if="saveError" class="state state--error">{{ saveError }}</p>

      <ul class="mp__list">
        <li v-for="item in items" :key="item.id" class="mp__item">
          <div class="mp__info">
            <span class="mp__name">{{ item.title }}</span>
            <span v-if="item.category" class="mp__tag">{{ item.category }}</span>
            <span class="mp__url">{{ item.embedUrl }}</span>
          </div>
          <div class="mp__row-actions">
            <button type="button" @click="startEdit(item)">Edit</button>
            <button type="button" class="mp__danger" @click="onDelete(item)">Delete</button>
          </div>
        </li>
        <li v-if="!items.length" class="mp__empty">
          No reel yet. Paste a Vimeo or YouTube link to add one.
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from '@/store'
import type { MediaItem } from '@/types'
import type { MediaDraft } from '@/store/modules/media'

const store = useStore()

const editing = ref(false)
const draft = ref<MediaItem | null>(null)

const title = ref('')
const rawUrl = ref('')
const category = ref('')

const items = computed<MediaItem[]>(() => store.getters['media/reels'])
const loading = computed<boolean>(() => store.getters['media/isLoading']('fetch'))
const loadError = computed<string | null>(() => store.getters['media/requestError']('fetch'))
const saving = computed<boolean>(() => store.getters['media/isLoading']('save'))
const saveError = computed<string | null>(() => store.getters['media/requestError']('save'))

onMounted(() => store.dispatch('media/fetch'))

/**
 * Turns whatever she pasted into a URL an iframe can actually play.
 * Vimeo share links, YouTube watch links and youtu.be shorteners all render
 * blank in an iframe — only the /embed/ forms work.
 */
const embedUrl = computed<string | null>(() => {
  const url = rawUrl.value.trim()
  if (!url) return null
  if (url.includes('player.vimeo.com') || url.includes('youtube.com/embed/')) return url

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`

  return null
})

const isValid = computed(() => title.value !== '' && embedUrl.value !== null)

watch(draft, (item) => {
  title.value = item?.title ?? ''
  rawUrl.value = item?.embedUrl ?? ''
  category.value = item?.category ?? ''
})

function startNew(): void {
  draft.value = null
  title.value = ''
  rawUrl.value = ''
  category.value = ''
  editing.value = true
}

function startEdit(item: MediaItem): void {
  draft.value = item
  editing.value = true
}

async function onSubmit(): Promise<void> {
  if (!isValid.value || !embedUrl.value) return
  const payload: MediaDraft = {
    ...(draft.value ? { id: draft.value.id } : {}),
    kind: 'reel',
    title: title.value,
    embedUrl: embedUrl.value,
    s3Key: null,
    category: category.value || null,
    durationSeconds: null,
    sortOrder: draft.value?.sortOrder ?? 0,
  }
  const saved = await store.dispatch('media/save', payload)
  if (saved) editing.value = false
}

async function onDelete(item: MediaItem): Promise<void> {
  if (!window.confirm(`Delete "${item.title}"?`)) return
  await store.dispatch('media/remove', item.id)
}
</script>

<style scoped>
.mp { display: grid; gap: var(--space-sm); width: 100%; }
.mp__head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-sm); flex-wrap: wrap; }
.mp__title { font-size: var(--step-2); }
.mp__count { font-size: var(--step--1); color: var(--ink-mute); }
.mp .btn { cursor: pointer; }

.mf { border: 1px solid var(--rule); background: var(--paper-card); padding: clamp(1.1rem, 3vw, 1.75rem); display: grid; gap: var(--space-sm); }
.mf__title { font-size: var(--step-1); }
.mf__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); }
.mf__hint { font-size: 0.8rem; color: var(--ink-mute); word-break: break-all; }
.mf__hint--warn { color: var(--coral); }
.mf__hint code { background: var(--paper-deep); padding: 0.1em 0.3em; }

.field { display: grid; gap: 0.3rem; }
.field span { font-size: var(--step--1); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-mute); }
.field em { text-transform: none; letter-spacing: 0; font-style: normal; opacity: 0.7; }
.field input { border: 1px solid var(--rule); background: var(--paper); padding: 0.6rem 0.75rem; width: 100%; }
.field input:focus { border-color: var(--teal); }

.mp__list { list-style: none; padding: 0; margin: 0; border: 1px solid var(--rule); background: var(--paper-card); }
.mp__item { display: flex; justify-content: space-between; align-items: center; gap: var(--space-sm); padding: 0.85rem 1rem; border-bottom: 1px solid var(--rule); flex-wrap: wrap; }
.mp__item:last-child { border-bottom: 0; }
.mp__info { display: grid; gap: 0.15rem; min-width: 0; }
.mp__name { font-family: var(--font-display); font-weight: 600; color: var(--ink); }
.mp__tag { font-size: var(--step--1); letter-spacing: 0.1em; text-transform: uppercase; color: var(--teal); }
.mp__url { font-size: 0.78rem; color: var(--ink-mute); word-break: break-all; }
.mp__empty { padding: var(--space-md); text-align: center; color: var(--ink-mute); }

.mp__row-actions { display: flex; gap: 0.75rem; }
.mp__row-actions button, .mp__ghost { background: none; border: 0; padding: 0; font-size: var(--step--1); letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-mute); cursor: pointer; }
.mp__row-actions button:hover, .mp__ghost:hover { color: var(--teal); }
.mp__row-actions .mp__danger:hover { color: var(--coral); }
</style>
