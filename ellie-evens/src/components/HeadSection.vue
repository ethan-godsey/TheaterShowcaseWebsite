<template>
  <header id="head" class="hero">
    <div class="hero__inner">
      <div class="hero__type">
        <h1 class="hero__name" v-reveal.mask>Ellie Evens</h1>

        <p class="hero__billing" v-reveal="{ delay: 250 }">
          Soprano <span class="hero__dot">&middot;</span>
          Improv <span class="hero__dot">&middot;</span>
          Acting
        </p>

        <p class="hero__lede" v-reveal="{ delay: 350 }">
          Musical Theater Student studying at Illinois Wesleyan, from Lincolnwood, IL
        </p>

        <div class="hero__actions" v-reveal="{ delay: 450 }">
          <a class="btn" href="#shows">See credits</a>
          <a class="hero__link" href="#contact">Get in touch &rarr;</a>
        </div>
      </div>

      <div class="hero__plate">
        <div class="hero__frame" v-reveal.wipe>
          <img
            v-for="(photo, index) in photos"
            :key="photo"
            :src="photo"
            :alt="index === 0 ? 'Ellie Evens headshot' : ''"
            :class="['hero__img', { 'hero__img--on': index === current }]"
            :aria-hidden="index === current ? undefined : 'true'"
            decoding="async"
            :fetchpriority="index === 0 ? 'high' : 'low'"
          />
        </div>

        <div v-if="photos.length > 1" class="hero__dots">
          <button
            v-for="(photo, index) in photos"
            :key="photo"
            type="button"
            class="hero__dotbtn"
            :class="{ 'hero__dotbtn--on': index === current }"
            :aria-label="`Show headshot ${index + 1}`"
            :aria-current="index === current"
            @click="goTo(index)"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { useCarousel } from '@/composables/useCarousel'
import headShot1 from '@/assets/opt/HeadShot1.jpg'
import headShot2 from '@/assets/opt/HeadShot2.jpg'

const photos = [headShot1, headShot2]

const { current, goTo } = useCarousel(
  computed(() => photos.length),
  { autoplayMs: 7000 },
)
</script>

<style scoped>
.hero {
  position: relative;
  padding: calc(var(--nav-height) + var(--space-lg)) var(--space-md) var(--space-xl);
  overflow: hidden;
}

.hero__inner {
  position: relative;
  z-index: 1;
  max-width: var(--container);
  margin-inline: auto;
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: 1fr;
  align-items: center;
}

@media (min-width: 900px) {
  .hero__inner {
    grid-template-columns: 1.1fr 0.9fr;
    gap: var(--space-xl);
  }
}

/* ── Name ─────────────────────────────────────────────────────────── */
.hero__name {
  line-height: 0.95;
  letter-spacing: -0.025em;
  color: var(--ink);
  padding-bottom: 0.08em;
}

.hero__billing {
  margin-top: var(--space-sm);
  font-size: var(--step--1);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--teal);
}

.hero__dot { color: var(--marigold); }

.hero__lede {
  margin-top: var(--space-sm);
  max-width: 34ch;
  font-size: var(--step-1);
  color: var(--ink-soft);
}

.hero__actions {
  margin-top: var(--space-md);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-md);
}

.hero__actions .btn { text-decoration: none; }

.hero__link {
  text-decoration: none;
  font-size: var(--step--1);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink-mute);
  transition: color 0.2s ease;
}

.hero__link:hover { color: var(--teal); }

/* ── Photo plate ─────────────────────────────────────────────────────── */
.hero__plate { position: relative; }

.hero__frame {
  position: relative;
  aspect-ratio: 3 / 4;
  background: var(--paper-deep);
  overflow: hidden;
  /* Offset ink border — the plate reads as printed onto the page. */
  box-shadow: 12px 12px 0 0 var(--teal);
}

.hero__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* --crop-y is the single knob: lower % pulls the crop toward the top of
     the photo. Nudge it if her head sits too high or too low. */
  object-position: 50% var(--crop-y, 14%);
  opacity: 0;
  transition: opacity 1.1s ease;
}

.hero__img--on { opacity: 1; }

.hero__dots {
  display: flex;
  gap: 0.5rem;
  margin-top: var(--space-sm);
}

.hero__dotbtn {
  width: 10px;
  height: 10px;
  padding: 0;
  border: 1px solid var(--ink);
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}

.hero__dotbtn--on { background: var(--marigold); }
</style>
