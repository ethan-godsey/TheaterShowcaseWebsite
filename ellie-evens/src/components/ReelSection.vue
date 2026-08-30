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
      <div v-if="items.length" class="reels">
        <figure v-for="item in items" :key="item.id" class="reel">
          <div class="reel__frame">
            <iframe
              :src="item.embedUrl"
              :title="item.title"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowfullscreen
            />
          </div>
          <figcaption class="reel__caption">
            <span class="reel__title">{{ item.title }}</span>
            <span v-if="item.category" class="reel__tag">{{ item.category }}</span>
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
/* ── 5. Local state ─────────────────────────────────────────────────────
   Empty until Ellie uploads through the admin. Shape matches the planned
   `media` table: reels store an embed URL (Vimeo/YouTube host the video —
   we never do), song cuts will store an S3 key. */
interface MediaItem {
  id: string
  title: string
  embedUrl: string
  category?: string
}

const items: MediaItem[] = []
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
