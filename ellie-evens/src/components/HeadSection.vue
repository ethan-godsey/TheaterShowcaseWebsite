<template>
  <header id="head" class="hero">
    <div class="hero__inner">
      <div class="hero__type">
        <h1 class="hero__name" v-reveal.mask>Ellie Evens</h1>

        <!--
          Editable from the admin. Held invisible (space still reserved, so
          nothing below jumps) until the profile has answered, so a visitor
          never sees the default wording swap to Ellie's.
        -->
        <div class="hero__copy" :class="{ 'hero__copy--pending': !profileReady }">
          <p class="hero__billing" v-reveal="{ delay: 250 }">
            <!-- Any '·' she types keeps the marigold dot styling. Text is
                 interpolated, never v-html: what she types can't become markup. -->
            <template v-for="(part, i) in billingParts" :key="i">
              <span v-if="i > 0" class="hero__dot">&middot;</span>{{ part }}
            </template>
          </p>

          <p class="hero__lede" v-reveal="{ delay: 350 }">{{ lede }}</p>
        </div>

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

import { computed, onMounted } from 'vue'
import { useStore } from '@/store'
import { useCarousel } from '@/composables/useCarousel'
import { HERO_DEFAULTS } from '@/content/hero'
import type { Photo } from '@/types'
import headShot1 from '@/assets/opt/HeadShot1.jpg'
import headShot2 from '@/assets/opt/HeadShot2.jpg'

const store = useStore()

/* ── Headshots ─────────────────────────────────────────────────────
   Gallery photos Ellie has marked "Use in hero", in gallery order. The two
   bundled photos are the fallback — when none are marked, or the gallery
   can't load. While the gallery is still loading, show nothing (the frame's
   own background), rather than flashing the fallback and swapping it out. */
const FALLBACK = [headShot1, headShot2]

const galleryReady = computed<boolean>(
  () =>
    store.state.gallery.loadedAt !== null ||
    store.getters['gallery/requestError']('fetch') !== null,
)
const marked = computed<Photo[]>(() => store.getters['gallery/headshots'])

const photos = computed<string[]>(() => {
  if (!galleryReady.value) return []
  return marked.value.length ? marked.value.map((p) => p.url) : FALLBACK
})

const { current, goTo } = useCarousel(
  computed(() => photos.value.length),
  { autoplayMs: 7000 },
)

/* ── Billing and lede ──────────────────────────────────────────── */
const profileReady = computed<boolean>(
  () =>
    store.state.profile.loadedAt !== null ||
    store.getters['profile/requestError']('fetch') !== null,
)

const billing = computed(
  () => store.state.profile.profile?.heroBilling?.trim() || HERO_DEFAULTS.billing,
)
const billingParts = computed(() => billing.value.split('·'))
const lede = computed(
  () => store.state.profile.profile?.heroLede?.trim() || HERO_DEFAULTS.lede,
)

onMounted(() => {
  // Both no-op if another section already loaded them.
  store.dispatch('gallery/fetch')
  store.dispatch('profile/fetch')
})
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

/* Pending: invisible but still taking up its space. opacity on the wrapper,
   not the <p>s, because v-reveal animates the <p>s' own opacity. */
.hero__copy { transition: opacity 0.4s ease; }
.hero__copy--pending { opacity: 0; }

.hero__billing {
  white-space: pre-line; /* her line breaks show; runs of spaces still collapse */
  margin-top: var(--space-sm);
  font-size: var(--step--1);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--teal);
}

.hero__dot { color: var(--marigold); }

.hero__lede {
  white-space: pre-line;
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

/* Engines without aspect-ratio (Chrome/Edge < 88, Safari < 15) drop the
   declaration, and since every child here is absolutely positioned the frame
   has no in-flow content to give it height — it collapses to zero and the
   headshots disappear while the dots below still render. The padding ratio
   reproduces 3:4 for those engines only. */
@supports not (aspect-ratio: 3 / 4) {
  .hero__frame {
    height: 0;
    padding-bottom: 133.3333%; /* 4 / 3 */
  }
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
