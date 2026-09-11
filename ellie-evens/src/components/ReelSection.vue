<template>
  <section id="reel" class="section">
    <div class="container container--narrow">
      <p class="eyebrow" v-reveal>Reel</p>
      <h2 class="section-title" v-reveal.mask>Watch</h2>

      <figure v-if="reels.length" class="reel">
        <div class="reel__frame">
          <!--
            Only the current reel is mounted, and :key forces a remount on
            change. Keeping all of them alive and merely hidden would leave a
            paused-but-loaded player behind — and a video that was playing
            would keep playing, audible, off screen.
          -->
          <iframe
            v-if="active"
            :key="active.id"
            :src="active.embedUrl"
            :title="active.title"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowfullscreen
          />

          <template v-if="hasMultiple">
            <button class="reel__arrow reel__arrow--prev" type="button" aria-label="Previous reel" @click="prev">
              &lsaquo;
            </button>
            <button class="reel__arrow reel__arrow--next" type="button" aria-label="Next reel" @click="next">
              &rsaquo;
            </button>
          </template>
        </div>

        <figcaption class="reel__caption">
          <span class="reel__title">{{ active?.title }}</span>
          <span v-if="active?.category" class="reel__tag">{{ active.category }}</span>
        </figcaption>

        <div v-if="hasMultiple" class="reel__nav">
          <div class="reel__dots">
            <button
              v-for="(reel, index) in reels"
              :key="reel.id"
              type="button"
              class="reel__dot"
              :class="{ 'reel__dot--on': index === current }"
              :aria-label="`Show ${reel.title}`"
              :aria-current="index === current"
              @click="goTo(index)"
            />
          </div>
          <span class="reel__count">{{ current + 1 }} / {{ reels.length }}</span>
        </div>
      </figure>

      <div v-else class="reel__empty" v-reveal>
        <p class="reel__empty-lead">Footage is being cut now.</p>
        <p>
          In the meantime, the fastest way to hear her is to ask, she'll send
          cuts for whatever you're casting.
        </p>
        <a class="btn" href="#contact">Request material</a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">

import { computed, onMounted } from 'vue'
import { useStore } from '@/store'
import { useCarousel } from '@/composables/useCarousel'
import type { Reel } from '@/types'

const store = useStore()

const reels = computed<Reel[]>(() => store.getters['media/reels'])

const { current, hasMultiple, next, prev, goTo } = useCarousel(
  computed(() => reels.value.length),
)

const active = computed<Reel | undefined>(() => reels.value[current.value])

onMounted(() => store.dispatch('media/fetch'))
</script>

<style scoped>
.reel { margin: 0; }

.reel__frame {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--paper-deep);
  overflow: hidden;
  box-shadow: 10px 10px 0 0 var(--teal);
}

.reel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--ink);
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  color: var(--ink);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.reel__arrow:hover { background: var(--marigold); }
.reel__arrow--prev { left: 0.6rem; }
.reel__arrow--next { right: 0.6rem; }

.reel__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: 0.75rem;
}

.reel__dots { display: flex; gap: 0.5rem; }

.reel__dot {
  width: 10px;
  height: 10px;
  padding: 0;
  border: 1px solid var(--ink);
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}

.reel__dot--on { background: var(--marigold); }

.reel__count {
  font-size: var(--step--1);
  color: var(--ink-mute);
  font-variant-numeric: tabular-nums;
}

.reel__frame iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.reel__caption {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-sm);
  padding-top: 0.6rem;
  border-top: 1px solid var(--rule);
  margin-top: 0.6rem;
}

.reel__title {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink);
}

.reel__tag {
  font-size: var(--step--1);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--teal);
  white-space: nowrap;
}

.reel__empty {
  border-left: 4px solid var(--marigold);
  padding: var(--space-sm) 0 var(--space-sm) var(--space-md);
  max-width: var(--measure);
}

.reel__empty-lead {
  font-family: var(--font-display);
  font-variation-settings: var(--wonk-heading);
  font-size: var(--step-1);
  color: var(--ink);
  margin-bottom: 0.4rem;
}

.reel__empty .btn {
  margin-top: var(--space-sm);
  text-decoration: none;
}
</style>
