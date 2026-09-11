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

    <ul v-if="photos.length" class="php__grid">
      <li v-for="photo in photos" :key="photo.id" class="php__cell">
        <img :src="photo.url" :alt="photo.altText || ''" loading="lazy" />
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

.php__cell { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: var(--paper-deep); }
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

.php__cell:hover .php__del,
.php__del:focus-visible { opacity: 1; }
.php__del:hover { background: var(--coral); }
</style>
