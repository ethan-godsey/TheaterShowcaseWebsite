<template>
  <section id="gallery" class="section">
    <div class="container">
      <p class="eyebrow" v-reveal>Gallery</p>
      <h2 class="section-title" v-reveal.mask>Production &amp; headshots</h2>

      <p v-if="loading" class="state">Loading photos…</p>
      <p v-else-if="error" class="state state--error">{{ error }}</p>

      <template v-else>
        <ul v-if="photos.length" class="grid" v-reveal.stagger>
          <li v-for="(photo, index) in visible" :key="photo.id" class="grid__cell">
            <button class="grid__btn" type="button" @click="openAt(index)">
              <img
                :src="photo.url"
                :alt="photo.altText || photo.caption || ''"
                loading="lazy"
                decoding="async"
                class="grid__img"
              />
            </button>
          </li>

          <!-- The overflow tile: everything past the grid limit lives behind it. -->
          <li v-if="hidden > 0" class="grid__cell">
            <button
              class="grid__more"
              type="button"
              :aria-label="`View all ${photos.length} photos`"
              @click="openAt(GRID_LIMIT)"
            >
              <span class="grid__plus">+{{ hidden }}</span>
              <span class="grid__more-label">View all</span>
            </button>
          </li>
        </ul>

        <p v-else class="state">Photos coming soon.</p>
      </template>
    </div>

    <GalleryLightbox
      :photos="photos"
      :open="lightboxOpen"
      :start-index="startIndex"
      @close="lightboxOpen = false"
    />
  </section>
</template>

<script setup lang="ts">

import { ref, computed, onMounted } from 'vue'
import { useStore } from '@/store'
import type { Photo } from '@/types'
import GalleryLightbox from '@/components/GalleryLightbox.vue'

const store = useStore()

const GRID_LIMIT = 30
const lightboxOpen = ref(false)
const startIndex = ref(0)

const photos = computed<Photo[]>(() => store.state.gallery.items)
const loading = computed<boolean>(() => store.getters['gallery/isLoading']('fetch'))
const error = computed<string | null>(() => store.getters['gallery/requestError']('fetch'))

const visible = computed(() => photos.value.slice(0, GRID_LIMIT))
const hidden = computed(() => Math.max(photos.value.length - GRID_LIMIT, 0))

onMounted(() => store.dispatch('gallery/fetch'))

function openAt(index: number): void {
  startIndex.value = index
  lightboxOpen.value = true
}
</script>

<style scoped>
.grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.grid__cell {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--paper-deep);
}

.grid__btn,
.grid__more {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  display: block;
}

.grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.grid__btn:hover .grid__img { transform: scale(1.05); }

.grid__more {
  display: grid;
  place-content: center;
  gap: 0.2rem;
  background: var(--ink);
  color: var(--paper);
  transition: background 0.25s ease;
}

.grid__more:hover { background: var(--teal); }

.grid__plus {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-weight: 600;
}

.grid__more-label {
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.8;
}

@media (max-width: 900px) { .grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 520px) { .grid { grid-template-columns: repeat(3, 1fr); } }
</style>
