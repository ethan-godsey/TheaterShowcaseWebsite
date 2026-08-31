<template>
  <section id="reel" class="section">
    <div class="container container--narrow">
      <p class="eyebrow" v-reveal>Reel</p>
      <h2 class="section-title" v-reveal.mask>Watch</h2>

      <!--
        Rendered from an array, not a hardcoded embed — this is a `media` table
        today in shape, tomorrow in fact. When the store lands, `items` becomes
        a getter and nothing in this template changes.
      -->
      <div v-if="reels.length" class="reels">
        <figure v-for="reel in reels" :key="reel.id" class="reel">
          <div class="reel__frame">
            <iframe
              :src="reel.embedUrl"
              :title="reel.title"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowfullscreen
            />
          </div>
          <figcaption class="reel__caption">
            <span class="reel__title">{{ reel.title }}</span>
            <span v-if="reel.category" class="reel__tag">{{ reel.category }}</span>
          </figcaption>
        </figure>
      </div>

      <!--
        No reel yet, and that's normal for a 2027 grad. Say something
        intentional rather than showing an empty box.
      -->
      <div v-else class="reel__empty" v-reveal>
        <p class="reel__empty-lead">Footage is being cut now.</p>
        <p>
          In the meantime, the fastest way to hear her is to ask — she'll send
          cuts for whatever you're casting.
        </p>
        <a class="btn" href="#contact">Request material</a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useStore } from '@/store'          // your typed one, not vuex's

/* ── 5. Local state ─────────────────────────────────────────────────────
   Empty until Ellie uploads through the admin. Shape matches the planned
   `media` table: reels store an embed URL (Vimeo/YouTube host the video —
   we never do), song cuts will store an S3 key. */

const store = useStore()

onMounted(() => store.dispatch('media/fetch'))

const reels = computed(() => store.getters['media/reels'])

</script>

<style scoped>
.reels {
  display: grid;
  gap: var(--space-md);
}

.reel {
  margin: 0;
}

.reel__frame {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--paper-deep);
  overflow: hidden;
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
