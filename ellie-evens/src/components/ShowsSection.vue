<template>
  <section id="shows" class="section">
    <div class="container">
      <p class="eyebrow" v-reveal>Credits</p>
      <h2 class="section-title" v-reveal.mask>Shows</h2>

      <p v-if="loading" class="state">Loading credits…</p>
      <p v-else-if="error" class="state state--error">{{ error }}</p>

      <template v-else>
        <div v-if="upcoming.length" class="upcoming">
          <h3 class="upcoming__head">Coming up</h3>
          <ul class="upcoming__list" v-reveal.stagger>
            <li v-for="show in upcoming" :key="show.id" class="upcoming__item">
              <span class="upcoming__title">{{ show.title }}</span>
              <span class="upcoming__role">{{ show.role }}</span>
              <span class="upcoming__meta">{{ show.venue }} · {{ formatDate(show.date) }}</span>
            </li>
          </ul>
        </div>

        <!--
          A table, not cards. Casting scans production / role / venue in
          columns — that's how a paper résumé is laid out, and matching it
          means they find what they're looking for without reading.
        -->
        <div class="credits-scroll">
          <table class="credits">
            <caption class="visually-hidden">Selected theatre credits</caption>
            <thead>
              <tr>
                <th scope="col">Production</th>
                <th scope="col">Role</th>
                <th scope="col">Venue</th>
                <th scope="col" class="credits__date">Date</th>
              </tr>
            </thead>
            <tbody v-reveal.stagger>
              <tr v-for="show in past" :key="show.id">
                <td>{{ show.title }}</td>
                <td class="credits__role">{{ show.role }}</td>
                <td>{{ show.venue }}</td>
                <td class="credits__date">{{ formatDate(show.date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="!past.length && !upcoming.length" class="state">
          Credits coming soon.
        </p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
/* ── 1. Imports ─────────────────────────────────────────────────────── */
import { computed, onMounted } from 'vue'
import { useStore } from '@/store'

/* ── 4. Store ───────────────────────────────────────────────────────── */
const store = useStore()

/* ── 6. Computed ────────────────────────────────────────────────────── */
const loading = computed(() => store.getters['shows/isLoading']('fetch'))
const error = computed(() => store.getters['shows/requestError']('fetch'))
const upcoming = computed(() => store.getters['shows/upcoming'])
const past = computed(() => store.getters['shows/past'])

/* ── 8. Lifecycle ───────────────────────────────────────────────────── */
onMounted(() => {
  store.dispatch('shows/fetch')
})

/* ── 9. Handlers ────────────────────────────────────────────────────── */

/**
 * new Date('2026-11-04') parses as UTC midnight, which renders as Nov 3 in
 * any negative-offset timezone. Splitting the parts and building a *local*
 * date keeps the day correct.
 */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}
</script>

<style scoped>
/* ── Upcoming ────────────────────────────────────────────────────────── */
.upcoming {
  border-left: 4px solid var(--coral);
  padding-left: var(--space-md);
  margin-bottom: var(--space-lg);
}

.upcoming__head {
  font-size: var(--step--1);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-family: var(--font-body);
  font-weight: 700;
  color: var(--coral);
}

.upcoming__list { list-style: none; padding: 0; margin: var(--space-xs) 0 0; }

.upcoming__item { display: grid; gap: 0.1rem; padding: 0.5rem 0; }

.upcoming__title {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 600;
  color: var(--ink);
}

.upcoming__role { color: var(--teal); }

.upcoming__meta { font-size: var(--step--1); color: var(--ink-mute); }

/* ── Credits table ───────────────────────────────────────────────────── */
.credits-scroll { overflow-x: auto; }

.credits {
  width: 100%;
  border-collapse: collapse;
  min-width: 34rem;
}

.credits th {
  text-align: left;
  font-size: var(--step--1);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-mute);
  font-weight: 700;
  padding: 0 0.75rem 0.6rem 0;
  border-bottom: 2px solid var(--ink);
}

.credits td {
  padding: 0.8rem 0.75rem 0.8rem 0;
  border-bottom: 1px solid var(--rule);
  vertical-align: baseline;
}

.credits tbody tr:hover { background: var(--paper-card); }

.credits td:first-child {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink);
}

.credits__role { color: var(--teal); }

.credits__date {
  text-align: right;
  white-space: nowrap;
  color: var(--ink-mute);
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
  padding-right: 0 !important;
}
</style>
