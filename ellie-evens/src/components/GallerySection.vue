<template>
  <section id="gallery" class="section">
    <div class="container">
      <p class="eyebrow" v-reveal>Gallery</p>
      <h2 class="section-title" v-reveal.mask>Production &amp; headshots</h2>

      <p v-if="loading" class="state">Loading photos…</p>
      <p v-else-if="error" class="state state--error">{{ error }}</p>

      <template v-else>
        <!--
          Keyboard handling lives on this container, not window: an inline
          gallery that grabbed arrow keys globally would steal them from page
          scrolling. They only act once focus is inside the gallery.
        -->
        <div
          v-if="photos.length"
          class="gallery"
          tabindex="0"
          aria-roledescription="carousel"
          aria-label="Photo gallery"
          @keydown="onKeydown"
        >
          <figure class="stage" v-reveal>
            <div class="stage__frame">
              <!-- :key remounts per photo, which replays the fade-in. -->
              <img
                v-if="active"
                :key="active.id"
                :src="active.url"
                :alt="active.altText || active.caption || ''"
                class="stage__img"
              />
            </div>
            <figcaption class="stage__meta">
              <span v-if="active?.caption" class="stage__caption">{{ active.caption }}</span>
              <span class="stage__count">{{ current + 1 }} / {{ photos.length }}</span>
            </figcaption>
          </figure>

          <div class="rail">
            <button
              v-if="hasMultiple"
              class="rail__arrow"
              type="button"
              aria-label="Previous photo"
              @click="prev"
            >&lsaquo;</button>

            <ul ref="strip" class="grid" v-reveal.stagger>
              <li
                v-for="(photo, index) in photos"
                :key="photo.id"
                class="grid__cell"
                :class="{
                  'grid__cell--on': index === current,
                  'grid__cell--near': Math.abs(index - current) === 1,
                }"
              >
                <button
                  class="grid__btn"
                  type="button"
                  :aria-label="`Show photo ${index + 1}`"
                  :aria-current="index === current"
                  @click="goTo(index)"
                >
                  <img
                    :src="photo.url"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    class="grid__img"
                  />
                </button>
              </li>
            </ul>

            <button
              v-if="hasMultiple"
              class="rail__arrow"
              type="button"
              aria-label="Next photo"
              @click="next"
            >&rsaquo;</button>
          </div>
        </div>

        <p v-else class="state">Photos coming soon.</p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">

import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from '@/store'
import { useCarousel } from '@/composables/useCarousel'
import type { Photo } from '@/types'

const store = useStore()

const photos = computed<Photo[]>(() => store.state.gallery.items)
const loading = computed<boolean>(() => store.getters['gallery/isLoading']('fetch'))
const error = computed<string | null>(() => store.getters['gallery/requestError']('fetch'))

const { current, hasMultiple, next, prev, goTo } = useCarousel(
  computed(() => photos.value.length),
)

// Optional on purpose: on the first render the fetch hasn't returned, so
// photos is [] and this is undefined. Typing it honestly is what forces the
// v-if on the stage image.
const active = computed<Photo | undefined>(() => photos.value[current.value])

const strip = ref<HTMLUListElement | null>(null)

/* One direction only: current drives the strip's scroll position, never the
   reverse. Clicks, arrows, and keys all just change current and this follows.
   If scrolling the strip also set current, the two would feed each other.

   scrollTo on the strip rather than scrollIntoView on the thumb, because
   scrollIntoView also scrolls every ancestor, including the page, and would
   yank the viewport whenever the strip was partly off screen. */
watch(current, (index) => {
  const el = strip.value
  const thumb = el?.children[index] as HTMLElement | undefined
  if (!el || !thumb) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollTo({
    left: thumb.offsetLeft - (el.clientWidth - thumb.offsetWidth) / 2,
    behavior: reduced ? 'auto' : 'smooth',
  })
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowRight') next()
  else if (event.key === 'ArrowLeft') prev()
  else return
  event.preventDefault()
}

onMounted(() => store.dispatch('gallery/fetch'))
</script>

<style scoped>
.gallery:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 6px;
}

/* ── Stage ───────────────────────────────────────────────────────── */
.stage { margin: 0; }

.stage__frame {
  position: relative;
  aspect-ratio: 4 / 3;
  max-height: 75vh;
  background: var(--paper-deep);
  overflow: hidden;
  box-shadow: 10px 10px 0 0 var(--teal);
}

/* contain, not cover: the set mixes portrait headshots with landscape
   production stills, and cover would crop one or the other. */
.stage__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: stage-in 0.45s ease;
}

@keyframes stage-in {
  from { opacity: 0; }
}

.stage__meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  font-size: var(--step--1);
  color: var(--ink-soft);
}

.stage__count {
  margin-left: auto;
  letter-spacing: 0.14em;
  font-variant-numeric: tabular-nums;
  color: var(--ink-mute);
}

/* ── Rail ────────────────────────────────────────────────────────── */
.rail {
  --thumb: 72px;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.rail__arrow {
  flex: 0 0 auto;
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.rail__arrow:hover {
  background: var(--ink);
  color: var(--paper);
}

.grid {
  /* min-width: 0 lets this flex child shrink below its content width. Without
     it the strip grows to fit every thumbnail and never scrolls. */
  flex: 1;
  min-width: 0;
  position: relative; /* offsetParent for the thumbs, which the watch relies on */
  list-style: none;
  margin: 0;
  /* overflow-x: auto silently forces overflow-y to auto too, so a scaled
     thumbnail gets clipped top and bottom. The block padding is headroom for
     the largest scale; the inline padding does the same at either end. */
  padding: 14px 16px;
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.grid::-webkit-scrollbar { display: none; }

/* The li owns layout and the stagger entrance; the button owns the scale.
   Splitting them matters: the stagger animates the li's transform, and two
   rules fighting over one element's transform would cancel each other. */
.grid__cell {
  flex: 0 0 var(--thumb);
  aspect-ratio: 1 / 1;
  scroll-snap-align: center;
}

.grid__btn {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: var(--paper-deep);
  overflow: hidden;
  cursor: pointer;
  opacity: 0.7;
  transition:
    transform 0.35s var(--ease-out-expo),
    opacity 0.35s ease;
}

/* scale(), not width: changing width reflows the strip on every selection and
   slides every other thumb sideways under the cursor. */
.grid__cell--near .grid__btn {
  transform: scale(1.15);
  opacity: 0.85;
}

.grid__cell--on .grid__btn {
  transform: scale(1.35);
  opacity: 1;
  outline: 2px solid var(--marigold);
  outline-offset: 2px;
}

.grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.grid__btn:hover { opacity: 1; }
.grid__btn:hover .grid__img { transform: scale(1.06); }

@media (max-width: 520px) {
  .rail { --thumb: 56px; }
  .grid { gap: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .stage__img { animation: none; }
  .grid__btn { transition: none; }
}
</style>
