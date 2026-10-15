<template>
  <section class="php">
    <header class="php__head">
      <div>
        <h2 class="php__title">Photos</h2>
        <p class="php__count">{{ photos.length }} in the gallery</p>
      </div>

      <div class="php__upload">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          class="visually-hidden"
          @change="onFilesPicked"
        />
        <button class="btn" type="button" :disabled="busy" @click="fileInput?.click()">
          {{ busy ? `Uploading ${done}/${total}…` : 'Add photos' }}
        </button>
      </div>
    </header>

    <p v-if="loading" class="state">Loading…</p>
    <p v-else-if="loadError" class="state state--error">{{ loadError }}</p>
    <p v-if="uploadError" class="state state--error">{{ uploadError }}</p>

    <p v-if="photos.length > 1" class="php__hint">
      Drag to reorder. On a phone, press and hold a photo first.
      Mark photos <strong>★ Hero</strong> to show them at the top of the site, in this order.
    </p>

    <ul
      v-if="photos.length"
      ref="grid"
      class="php__grid"
      :class="{ 'php__grid--saving': saving }"
      :aria-busy="saving"
    >
      <li v-for="photo in photos" :key="photo.id" class="php__cell">
        <img :src="photo.url" :alt="photo.altText || ''" loading="lazy" />
        <button
          class="php__hero"
          :class="{ 'php__hero--on': isHeadshot(photo) }"
          type="button"
          :aria-pressed="isHeadshot(photo)"
          :disabled="pendingHero.has(photo.id)"
          :title="isHeadshot(photo) ? 'Shown in the hero — click to remove' : 'Use in the hero'"
          @click="onToggleHero(photo)"
        >
          <span aria-hidden="true">{{ isHeadshot(photo) ? '★' : '☆' }}</span> Hero
        </button>
        <button
          class="php__del"
          type="button"
          :aria-label="`Delete photo`"
          @click="onDelete(photo)"
        >&times;</button>
      </li>
    </ul>
    <p v-else-if="!loading" class="state">No photos yet.</p>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef } from 'vue'
import { useStore } from '@/store'
import { useSortable, moveId } from '@/composables/useSortable'
import { useToast } from '@/composables/useToast'
import { HEADSHOT_TAG } from '@/content/hero'
import type { Photo } from '@/types'

const store = useStore()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const busy = ref(false)
const done = ref(0)
const total = ref(0)

const photos = computed<Photo[]>(() => store.state.gallery.items)
const loading = computed<boolean>(() => store.getters['gallery/isLoading']('fetch'))
const loadError = computed<string | null>(() => store.getters['gallery/requestError']('fetch'))
const uploadError = computed<string | null>(() => store.getters['gallery/requestError']('upload'))

onMounted(() => store.dispatch('gallery/fetch'))

async function onFilesPicked(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (!files.length) return

  busy.value = true
  done.value = 0
  total.value = files.length

  // one by one uploads of photos
  for (const file of files) {
    await store.dispatch('gallery/upload', { file, altText: 'Ellie Evens' })
    done.value += 1
  }

  busy.value = false
  // Clear the input, or picking the same file twice fires no change event.
  input.value = ''
}

/* ── Drag to reorder ─────────────────────────────────────────────── */
const toast = useToast()
const grid = useTemplateRef<HTMLUListElement>('grid')
const saving = ref(false)

useSortable(
  grid,
  async (from, to) => {
    saving.value = true
    const ids = moveId(photos.value.map((p) => p.id), from, to)
    const ok = await store.dispatch('gallery/reorder', ids)
    saving.value = false

    if (!ok) {
      const reason = store.getters['gallery/requestError']('reorder') as string | null
      toast.error(`Couldn't save the new order${reason ? `: ${reason}` : '.'}`)
    }
  },
  {
    // Touch: hold briefly before dragging, so a normal swipe still scrolls.
    delay: 180,
    delayOnTouchOnly: true,
    // The buttons on a photo must stay buttons, not drag handles.
    filter: '.php__del, .php__hero',
    preventOnFilter: false,
    ghostClass: 'php__cell--ghost',
    chosenClass: 'php__cell--chosen',
  },
)

/* ── Hero headshots ──────────────────────────────────────────────── */
const pendingHero = ref(new Set<string>())

function isHeadshot(photo: Photo): boolean {
  return photo.tags?.includes(HEADSHOT_TAG) ?? false
}

async function onToggleHero(photo: Photo): Promise<void> {
  // A new Set each time: Vue tracks the ref's value, and mutating the same
  // Set in place wouldn't re-render the disabled state.
  pendingHero.value = new Set(pendingHero.value).add(photo.id)
  const ok = await store.dispatch('gallery/setHeadshot', {
    id: photo.id,
    headshot: !isHeadshot(photo),
  })
  const next = new Set(pendingHero.value)
  next.delete(photo.id)
  pendingHero.value = next

  if (!ok) {
    const reason = store.getters['gallery/requestError']('headshot') as string | null
    toast.error(`Couldn't update the hero${reason ? `: ${reason}` : '.'}`)
  }
}

async function onDelete(photo: Photo): Promise<void> {
  if (!window.confirm('Delete this photo? It will be removed from the site and S3.')) return
  await store.dispatch('gallery/remove', photo.id)
}
</script>

<style scoped>
.php { display: grid; gap: var(--space-sm); width: 100%; }
.php__head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-sm); flex-wrap: wrap; }
.php__title { font-size: var(--step-2); }
.php__count { font-size: var(--step--1); color: var(--ink-mute); }
.php .btn { cursor: pointer; }

.php__grid {
  list-style: none; padding: 0; margin: 0;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px;
}

.php__hint { font-size: var(--step--1); color: var(--ink-mute); }

.php__cell {
  position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: var(--paper-deep);
  cursor: grab;
  /* Stops iOS from popping its own image "save / share" menu on long-press,
     which would hijack the hold-to-drag gesture. */
  -webkit-touch-callout: none;
  user-select: none;
}
.php__cell img { pointer-events: none; } /* no native image-drag ghost */

/* Where the photo will land. */
.php__cell--ghost { opacity: 0.35; outline: 2px dashed var(--teal); outline-offset: -2px; }
.php__cell--chosen { cursor: grabbing; }

.php__grid--saving { opacity: 0.7; transition: opacity 0.2s ease; }
.php__cell img { width: 100%; height: 100%; object-fit: cover; }

.php__del {
  position: absolute; top: 4px; right: 4px;
  width: 1.5rem; height: 1.5rem;
  display: grid; place-items: center;
  border: 0; border-radius: 50%;
  background: color-mix(in srgb, var(--ink) 80%, transparent);
  color: var(--paper); font-size: 1rem; line-height: 1; cursor: pointer;
  opacity: 0; transition: opacity 0.2s ease, background 0.2s ease;
}

.php__hero {
  position: absolute; left: 4px; bottom: 4px;
  padding: 0.15rem 0.45rem;
  border: 0;
  background: color-mix(in srgb, var(--ink) 70%, transparent);
  color: var(--paper);
  font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase;
  cursor: pointer;
  /* Unmarked: only on hover/focus, like delete. Marked: always visible, so
     she can see at a glance which photos are in the hero. Always visible on
     touch screens, which have no hover. */
  opacity: 0; transition: opacity 0.2s ease, background 0.2s ease;
}
.php__hero--on { opacity: 1; background: var(--marigold); color: var(--ink); }
.php__hero:disabled { cursor: progress; }
.php__cell:hover .php__hero,
.php__hero:focus-visible { opacity: 1; }
@media (hover: none) { .php__hero { opacity: 1; } }

.php__cell:hover .php__del,
.php__del:focus-visible { opacity: 1; }
.php__del:hover { background: var(--coral); }
</style>
