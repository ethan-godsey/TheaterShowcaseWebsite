<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="dialog"
      class="lb"
      role="dialog"
      aria-modal="true"
      :aria-label="`Photo ${current + 1} of ${photos.length}`"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <button class="lb__close" type="button" aria-label="Close" @click="emit('close')">&times;</button>

      <button
        v-if="photos.length > 1"
        class="lb__arrow lb__arrow--prev"
        type="button"
        aria-label="Previous photo"
        @click="prev"
      >&lsaquo;</button>

      <figure class="lb__stage">
        <img
          v-if="active"
          :key="active.id"
          :src="active.url"
          :alt="active.altText || active.caption || ''"
          class="lb__img"
        />
        <figcaption class="lb__meta">
          <span v-if="active?.caption" class="lb__caption">{{ active.caption }}</span>
          <span class="lb__count">{{ current + 1 }} / {{ photos.length }}</span>
        </figcaption>
      </figure>

      <button
        v-if="photos.length > 1"
        class="lb__arrow lb__arrow--next"
        type="button"
        aria-label="Next photo"
        @click="next"
      >&rsaquo;</button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">

/* TO-DO: Big image with gallery wheel below as breadcrumbs */
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import type { Photo } from '@/types'
import { useCarousel } from '@/composables/useCarousel'

const props = defineProps<{
  photos: Photo[]
  open: boolean
  startIndex?: number
}>()

const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLElement | null>(null)

const { current, next, prev, goTo } = useCarousel(computed(() => props.photos.length))

const active = computed<Photo | undefined>(() => props.photos[current.value])

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      goTo(props.startIndex ?? 0)

      // Stop the page behind from scrolling under the overlay.
      document.body.style.overflow = 'hidden'
      await nextTick()
      dialog.value?.focus()
    } else {
      document.body.style.overflow = ''
    }
  },
)

// If this unmounts while open, the page would be left permanently unscrollable.
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
  else if (event.key === 'ArrowRight') next()
  else if (event.key === 'ArrowLeft') prev()
}
</script>

<style scoped>
.lb {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: clamp(0.5rem, 2vw, 1.5rem);
  padding: clamp(1rem, 4vw, 3rem);
  background: color-mix(in srgb, var(--ink) 94%, transparent);
}

.lb:focus { outline: none; }

.lb__stage {
  margin: 0;
  display: grid;
  gap: 0.75rem;
  justify-items: center;
  min-width: 0;
  min-height: 0;
}

.lb__img {
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  background: var(--paper-deep);
}

.lb__meta {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  color: var(--paper);
  font-size: var(--step--1);
}

.lb__caption { font-family: var(--font-display); }
.lb__count { color: var(--marigold); font-variant-numeric: tabular-nums; }

.lb__arrow,
.lb__close {
  border: 1px solid var(--paper);
  background: transparent;
  color: var(--paper);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s ease, color 0.2s ease;
}

.lb__arrow {
  width: 2.75rem;
  height: 2.75rem;
  font-size: 1.6rem;
  line-height: 1;
}

.lb__close {
  position: absolute;
  top: clamp(0.75rem, 3vw, 1.5rem);
  right: clamp(0.75rem, 3vw, 1.5rem);
  width: 2.25rem;
  height: 2.25rem;
  font-size: 1.4rem;
  line-height: 1;
}

.lb__arrow:hover,
.lb__close:hover { background: var(--marigold); color: var(--ink); border-color: var(--marigold); }

@media (max-width: 640px) {
  .lb { grid-template-columns: 1fr; }
  .lb__arrow--prev { position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); }
  .lb__arrow--next { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); }
}
</style>
