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
      <aside class="stats" aria-label="Performer details">
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
// none yet

/* ── 5. Local state ─────────────────────────────────────────────────────
   Hardcoded until the profile table exists. Swap for a store getter later —
   the template won't need to change. */
const headline = 'Singer, Actor, and Dancer trained at Illinois Wesleyan University.'

// TODO(content): real bio from Ellie.
const bio = [
  'PLACEHOLDER — Ellie is a musical theatre performer whose work spans ' +
    'contemporary musicals, classic book shows, and new-work development.',
  'PLACEHOLDER — Recent credits include leading roles at regional houses ' +
    'across the mid-Atlantic. She trained at [school] and studies voice with [teacher].',
]

/*
  Range leads because a G6 is genuinely uncommon and it's the first thing
  casting filters on. Deliberately says "Legit Soprano" and never claims belt
  — overclaiming a belt is how you end up in the wrong audition room.
*/
const stats = [
  { label: 'Voice type', value: 'Legit Soprano' },
  { label: 'Range', value: 'Up to G6' },             // TODO(content): full range once low note confirmed
  { label: 'Height', value: "5'3\"" },
  { label: 'Hair / Eyes', value: 'Brown / Blue' },   // TODO(content): confirm eyes
  // TODO(content): Dance level + styles, then re-add the row
  { label: 'Special skills', value: 'Improv' },      // TODO(content): rest of list
]
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
