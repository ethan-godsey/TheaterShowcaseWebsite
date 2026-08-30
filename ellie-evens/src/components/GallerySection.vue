<template>
  <section id="gallery" class="section">
    <div class="container">
      <p class="eyebrow" v-reveal>Gallery</p>
      <h2 class="section-title" v-reveal.mask>Production &amp; headshots</h2>

      <ul class="grid" v-reveal.stagger>
        <li v-for="photo in photos" :key="photo" class="grid__cell">
          <img
            :src="photo"
            alt=""
            loading="lazy"
            decoding="async"
            class="grid__img"
          />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
/* ── 5. Local state ─────────────────────────────────────────────────────
   TEMPORARY: build-time bundling of local assets, served from sips-resized
   1200px derivatives in assets/opt (~6 MB total vs 53 MB of originals).
   The originals stay in assets/ untouched — they're what gets uploaded to S3
   when the real pipeline lands, and this block becomes the gallery store. */
const modules = import.meta.glob<string>('@/assets/opt/IMG_*.jpg', {
  eager: true,
  import: 'default',
})

/* 25 keeps it a clean 5 x 5 block on desktop. Change GRID_COUNT to show more.
   Sorted by path so the order is stable across builds instead of whatever
   order the filesystem happened to hand back. */
const GRID_COUNT = 25

const photos = Object.keys(modules)
  .sort()
  .map((path) => modules[path] as string)
  .slice(0, GRID_COUNT)
</script>

<style scoped>
.grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}

.grid__cell {
  /* Square cells regardless of the source image's proportions. */
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--paper-deep);
}

.grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.grid__cell:hover .grid__img {
  transform: scale(1.04);
}

@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 520px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
