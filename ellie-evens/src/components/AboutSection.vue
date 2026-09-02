<template>
  <section id="about" class="section section--tint">
    <div class="container about" v-reveal>
      <div class="about__body">
        <p class="eyebrow" v-reveal>About</p>
        <h2 class="section-title" v-reveal.mask>{{ headline }}</h2>

        <!-- TODO(content): replace with Ellie's real bio. -->
        <div class="prose" v-reveal="{ delay: 120 }">
          <p v-for="(paragraph, i) in bio" :key="i">{{ paragraph }}</p>
        </div>
      </div>

      <!--
        Stats panel. Casting directors scan for exactly these fields, and most
        performer sites bury or omit them. Keep it above the fold on mobile.
      -->
      <aside v-if="stats.length" class="stats" aria-label="Performer details">
        <dl v-reveal.stagger>
          <div v-for="stat in stats" :key="stat.label" class="stats__row">
            <dt>{{ stat.label }}</dt>
            <dd>{{ stat.value }}</dd>
          </div>
        </dl>

        <!-- TODO(content): drop a real PDF in /public and point this at it. -->
        <a class="btn stats__cta" href="/ellie-evens-resume.pdf" download>
          Download résumé
        </a>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
/* ── 1. Imports ─────────────────────────────────────────────────────── */
import { computed, onMounted } from 'vue'
import { useStore } from '@/store'

/* ── 4. Store ───────────────────────────────────────────────────────── */
const store = useStore()

/* ── 5. Local state ─────────────────────────────────────────────────────
   Fallbacks, used only until Ellie fills the profile in through the admin.
   Keeping them means the section is never blank mid-migration. */
const FALLBACK_HEADLINE = 'Actor, singer, and mover based in the DMV.'
const FALLBACK_BIO = [
  'PLACEHOLDER — Ellie is a musical theatre performer whose work spans ' +
    'contemporary musicals, classic book shows, and new-work development.',
]

/* ── 6. Computed ────────────────────────────────────────────────────── */
const headline = computed<string>(
  () => store.state.profile.profile?.headline || FALLBACK_HEADLINE,
)

const bio = computed<string[]>(() => {
  const paragraphs = store.getters['profile/bioParagraphs'] as string[]
  return paragraphs.length ? paragraphs : FALLBACK_BIO
})

/*
 * Rows are built from the profile, and any row with no value is dropped —
 * so an unfilled field simply doesn't appear rather than rendering "TODO".
 */
const stats = computed(() => {
  const p = store.state.profile.profile
  const range = store.getters['profile/range'] as string
  const height = p?.heightInches
    ? `${Math.floor(p.heightInches / 12)}'${p.heightInches % 12}"`
    : ''

  return [
    { label: 'Voice type', value: p?.voiceType ?? '' },
    { label: 'Range', value: range },
    { label: 'Height', value: height },
  ].filter((row) => row.value !== '')
})

/* ── 8. Lifecycle ───────────────────────────────────────────────────── */
onMounted(() => store.dispatch('profile/fetch'))
</script>

<style scoped>
.about {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 900px) {
  .about {
    grid-template-columns: 1fr 20rem;
    gap: var(--space-xl);
    align-items: start;
  }
}

.stats {
  border-top: 2px solid var(--ink);
  padding-top: var(--space-sm);
}

.stats__row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--rule);
}

.stats dt {
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

.stats dd {
  margin: 0;
  text-align: right;
  color: var(--ink);
}

.stats__cta {
  margin-top: var(--space-md);
  width: 100%;
  text-align: center;
  text-decoration: none;
}
</style>
