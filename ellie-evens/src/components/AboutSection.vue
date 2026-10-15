<template>
  <section id="about" class="section section--tint">
    <div class="container about" v-reveal>
      <div class="about__body">
        <p class="eyebrow" v-reveal>About</p>
        <h2 class="section-title" v-reveal.mask>{{ headline }}</h2>

        <!-- TODO(content): replace with Ellie's real bio. -->
        <div
          id="about-bio"
          ref="clamp"
          class="bio"
          :class="{ 'bio--clamped': overflowing && !expanded }"
          v-reveal="{ delay: 120 }"
        >
          <div ref="prose" class="prose">
            <p v-for="(paragraph, i) in bio" :key="i">{{ paragraph }}</p>
          </div>
        </div>

        <button
          v-if="overflowing"
          class="bio__toggle"
          type="button"
          aria-controls="about-bio"
          :aria-expanded="expanded"
          @click="toggle"
        >
          {{ expanded ? 'View less' : 'View more' }}
        </button>
      </div>

  
      <aside v-if="stats.length" class="stats" aria-label="Performer details">
        <dl v-reveal.stagger>
          <div v-for="stat in stats" :key="stat.label" class="stats__row">
            <dt>{{ stat.label }}</dt>
            <dd>{{ stat.value }}</dd>
          </div>
        </dl>

        <a v-if="resumeUrl" class="btn stats__cta" :href="resumeUrl" download="Ellie-Evens-Resume.pdf">
          Download résumé
        </a>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/store'

// Store
const store = useStore()

const FALLBACK_HEADLINE = 'Actor, singer, and dancer trained at Illinois Wesleyan University.'
const FALLBACK_BIO = [
  'Ellie is a musical theatre performer whose work spans ' +
    'contemporary musicals, classic book shows, and new-work development.',
]

// Computeds
const headline = computed<string>(
  () => store.state.profile.profile?.headline || FALLBACK_HEADLINE,
)

const bio = computed<string[]>(() => {
  const paragraphs = store.getters['profile/bioParagraphs'] as string[]
  return paragraphs.length ? paragraphs : FALLBACK_BIO
})


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
  
  // don't show empty row
  ].filter((row) => row.value !== '')
})

const resumeUrl = computed<string | null>(() => store.getters['profile/resumeUrl'])

/* ── View more ─────────────────────────────────────────────────────
   The bio is clamped by height rather than paragraph count, so one long
   pasted paragraph gets cut down too. Whether the toggle is needed at all is
   measured, not guessed: it depends on the text, the font, and the width. */
const clamp = ref<HTMLElement | null>(null)
const prose = ref<HTMLElement | null>(null)
const expanded = ref(false)
const overflowing = ref(false)

// Matches .bio--clamped's max-height. A number here rather than reading the
// element's current height, because once expanded that height IS the content
// height and the comparison would always say "fits", hiding the toggle.
const CLAMP_REM = 18

function measure(): void {
  if (!prose.value) return
  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
  // A little slack so a bio that's barely over doesn't get a toggle that
  // reveals one extra line.
  overflowing.value = prose.value.scrollHeight > CLAMP_REM * rootPx + 32
}

// Re-measure whenever the text box changes size: the profile arriving, web
// fonts swapping in, or the viewport resizing all change the height.
let observer: ResizeObserver | null = null

function toggle(): void {
  expanded.value = !expanded.value

  // Collapsing from far down the bio would leave the reader staring at
  // whatever comes after About. Bring the top of the bio back into view.
  if (!expanded.value && clamp.value) {
    const top = clamp.value.getBoundingClientRect().top
    if (top < 0) clamp.value.scrollIntoView({ block: 'start' })
  }
}

// Lifecycle of component
onMounted(() => {
  store.dispatch('profile/fetch')

  if (prose.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(prose.value)
  }
  measure()
})

onBeforeUnmount(() => observer?.disconnect())
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

/* ── Bio clamp ──────────────────────────────────────────────────── */
.bio--clamped {
  max-height: 18rem; /* keep in sync with CLAMP_REM */
  overflow: hidden;
  /* Fade the last lines out. A mask rather than a gradient overlay, so it
     doesn't need to know the tinted section's background colour. */
  -webkit-mask-image: linear-gradient(to bottom, #000 65%, transparent);
  mask-image: linear-gradient(to bottom, #000 65%, transparent);
}

.bio__toggle {
  margin-top: var(--space-sm);
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: var(--step--1);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--teal);
  transition: color 0.2s ease;
}

.bio__toggle:hover { color: var(--ink); }

.bio__toggle:focus-visible {
  outline: 2px solid var(--teal);
  outline-offset: 4px;
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
