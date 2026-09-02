<template>
  <section class="pp">
    <header class="pp__head">
      <div>
        <h2 class="pp__title">Bio &amp; details</h2>
        <p class="pp__count">Shown in the About section</p>
      </div>
    </header>

    <p v-if="loading" class="state">Loading…</p>
    <p v-else-if="loadError" class="state state--error">{{ loadError }}</p>

    <form v-else class="pf" @submit.prevent="onSubmit">
      <label class="field">
        <span>Headline</span>
        <input v-model.trim="headline" type="text" placeholder="Actor, singer, and mover based in the DMV." />
      </label>

      <label class="field">
        <span>Bio</span>
        <textarea v-model="bio" rows="9" placeholder="Two paragraphs, third person. Leave a blank line between them."></textarea>
        <small class="pf__hint">
          Blank line = new paragraph. {{ paragraphCount }}
          {{ paragraphCount === 1 ? 'paragraph' : 'paragraphs' }}.
        </small>
      </label>

      <div class="pf__grid">
        <label class="field">
          <span>Voice type</span>
          <input v-model.trim="voiceType" type="text" placeholder="Legit Soprano" />
        </label>

        <label class="field">
          <span>Range — low</span>
          <input v-model.trim="rangeLow" type="text" placeholder="F3" />
        </label>

        <label class="field">
          <span>Range — high</span>
          <input v-model.trim="rangeHigh" type="text" placeholder="G6" />
        </label>

        <label class="field">
          <span>Height (inches)</span>
          <input v-model.number="heightInches" type="number" min="36" max="84" placeholder="63" />
          <small v-if="heightLabel" class="pf__hint">{{ heightLabel }}</small>
        </label>
      </div>

      <p v-if="saveError" class="state state--error">{{ saveError }}</p>
      <p v-if="justSaved" class="pf__saved">Saved.</p>

      <div class="pf__actions">
        <button class="btn" type="submit" :disabled="saving || !dirty">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
        <span v-if="dirty" class="pf__dirty">unsaved changes</span>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from '@/store'
import type { Profile } from '@/types'

const store = useStore()

const headline = ref('')
const bio = ref('')
const voiceType = ref('')
const rangeLow = ref('')
const rangeHigh = ref('')
const heightInches = ref<number | null>(null)
const justSaved = ref(false)

const profile = computed<Profile | null>(() => store.state.profile.profile)
const loading = computed<boolean>(() => store.getters['profile/isLoading']('fetch'))
const loadError = computed<string | null>(() => store.getters['profile/requestError']('fetch'))
const saving = computed<boolean>(() => store.getters['profile/isLoading']('save'))
const saveError = computed<string | null>(() => store.getters['profile/requestError']('save'))

onMounted(() => store.dispatch('profile/fetch'))

// Re-seed the fields whenever the stored profile changes — on first load, and
// again after a save so the form reflects exactly what the server kept.
watch(
  profile,
  (value) => {
    headline.value = value?.headline ?? ''
    bio.value = value?.bio ?? ''
    voiceType.value = value?.voiceType ?? ''
    rangeLow.value = value?.rangeLow ?? ''
    rangeHigh.value = value?.rangeHigh ?? ''
    heightInches.value = value?.heightInches ?? null
  },
  { immediate: true },
)

const paragraphCount = computed(
  () => bio.value.split(/\n\s*\n/).filter((p) => p.trim()).length,
)

/** 63 -> 5'3" — so she can sanity-check the number she typed. */
const heightLabel = computed(() => {
  const inches = heightInches.value
  if (!inches) return ''
  return `${Math.floor(inches / 12)}'${inches % 12}"`
})

const dirty = computed(() => {
  const p = profile.value
  return (
    headline.value !== (p?.headline ?? '') ||
    bio.value !== (p?.bio ?? '') ||
    voiceType.value !== (p?.voiceType ?? '') ||
    rangeLow.value !== (p?.rangeLow ?? '') ||
    rangeHigh.value !== (p?.rangeHigh ?? '') ||
    heightInches.value !== (p?.heightInches ?? null)
  )
})

async function onSubmit(): Promise<void> {
  justSaved.value = false
  const saved = await store.dispatch('profile/save', {
    headline: headline.value,
    bio: bio.value,
    voiceType: voiceType.value,
    rangeLow: rangeLow.value,
    rangeHigh: rangeHigh.value,
    heightInches: heightInches.value,
  })
  if (saved) {
    justSaved.value = true
    setTimeout(() => (justSaved.value = false), 2500)
  }
}
</script>

<style scoped>
.pp { display: grid; gap: var(--space-sm); width: 100%; }
.pp__head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-sm); flex-wrap: wrap; }
.pp__title { font-size: var(--step-2); }
.pp__count { font-size: var(--step--1); color: var(--ink-mute); }

.pf { border: 1px solid var(--rule); background: var(--paper-card); padding: clamp(1.1rem, 3vw, 1.75rem); display: grid; gap: var(--space-sm); }
.pf__grid { display: grid; gap: var(--space-sm); grid-template-columns: 1fr; }
@media (min-width: 640px) { .pf__grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 900px) { .pf__grid { grid-template-columns: repeat(4, 1fr); } }

.field { display: grid; gap: 0.3rem; }
.field span { font-size: var(--step--1); letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-mute); }
.field input, .field textarea { border: 1px solid var(--rule); background: var(--paper); padding: 0.6rem 0.75rem; width: 100%; font: inherit; }
.field textarea { resize: vertical; line-height: 1.6; }
.field input:focus, .field textarea:focus { border-color: var(--teal); }

.pf__hint { font-size: 0.8rem; color: var(--ink-mute); }
.pf__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); }
.pf .btn { cursor: pointer; justify-self: start; }
.pf__dirty { font-size: var(--step--1); color: var(--coral); }
.pf__saved { font-size: var(--step--1); color: var(--teal); }
</style>
