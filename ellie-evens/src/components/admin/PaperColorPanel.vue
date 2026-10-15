<template>
  <section class="pc">
    <header class="pc__head">
      <div>
        <h2 class="pc__title">Background colour</h2>
        <p class="pc__sub">
          Drag to preview on this page. Nothing changes on the site until you save.
        </p>
      </div>
    </header>

    <p v-if="!profile" class="state">Loading…</p>

    <div v-else class="pc__body">
      <div class="pc__picker">
        <!--
          The pad only spans the allowed range (soft, pale colours), so every
          point on it is a colour that keeps the text readable.
        -->
        <div
          class="pc__pad"
          tabindex="0"
          role="group"
          aria-label="Colour softness and lightness. Arrow keys adjust; hold Shift for bigger steps."
          :aria-description="`Saturation ${Math.round(hsl.s)}%, lightness ${Math.round(hsl.l)}%`"
          @pointerdown="onPadDown"
          @pointermove="onPadMove"
          @pointerup="onPadUp"
          @pointercancel="onPadUp"
          @keydown="onPadKey"
        >
          <canvas ref="canvas" class="pc__canvas" width="240" height="120" aria-hidden="true" />
          <span class="pc__marker" :style="markerStyle" aria-hidden="true" />
        </div>

        <label class="pc__hue-label">
          <span class="visually-hidden">Hue</span>
          <input
            v-model.number="hue"
            class="pc__hue"
            type="range"
            min="0"
            max="359"
            step="1"
            :style="{ background: hueTrack }"
          />
        </label>

        <div class="pc__ends">
          <span>softer</span><span>more colour</span>
        </div>
      </div>

      <div class="pc__side">
        <div class="pc__swatch" :style="{ background: outgoing || DEFAULT_PAPER }">
          <span class="pc__sample-ink">Aa</span>
          <span class="pc__sample-teal">Aa</span>
        </div>
        <code class="pc__hex">{{ outgoing || 'original cream' }}</code>

        <div class="pc__actions">
          <button class="btn" type="button" :disabled="!dirty || saving" @click="onSave">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button v-if="dirty" class="pc__ghost" type="button" @click="discard">Discard</button>
        </div>
        <button class="pc__ghost" type="button" :disabled="outgoing === ''" @click="resetToCream">
          Reset to original cream
        </button>
        <span v-if="dirty" class="pc__dirty">preview only, not saved</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, useTemplateRef, nextTick } from 'vue'
import { useStore } from '@/store'
import { useToast } from '@/composables/useToast'
import {
  PAPER_LIMITS,
  DEFAULT_PAPER,
  applyPaper,
  clampToLimits,
  hexToHsl,
  hslToHex,
  type Hsl,
} from '@/theme/paper'
import type { Profile } from '@/types'

const store = useStore()
const toast = useToast()

const { minLightness: L_MIN, maxLightness: L_MAX, maxSaturation: S_MAX } = PAPER_LIMITS

const profile = computed<Profile | null>(() => store.state.profile.profile)
const saving = computed<boolean>(() => store.getters['profile/isLoading']('save'))

/** What's on the live site: '#rrggbb', or '' for the default cream. */
const saved = computed<string>(() => profile.value?.paperColor ?? '')

const hsl = ref<Hsl>(clampToLimits(hexToHsl(DEFAULT_PAPER)))
/** True after "Reset": send '' so the site uses base.css as written. */
const useDefault = ref(true)

/** The value Save would send. */
const outgoing = computed<string>(() => (useDefault.value ? '' : hslToHex(hsl.value)))
const dirty = computed(() => outgoing.value !== saved.value)

function seed(value: string): void {
  useDefault.value = value === ''
  hsl.value = clampToLimits(hexToHsl(value || DEFAULT_PAPER))
}

/* Follow the saved value — but only when there's no unsaved preview. Saving
   another part of the profile (bio, résumé) also changes `profile`, and that
   must not throw away a colour she's still trying out. */
watch(
  saved,
  (now, before) => {
    if (before === undefined || outgoing.value === before) seed(now)
  },
  { immediate: true },
)

// Live preview: recolour this page as she drags. The site itself only
// changes on Save (main.ts applies and caches the saved value).
watch(outgoing, (value) => applyPaper(value))

// Leaving the admin with an unsaved preview: put the saved colour back.
onBeforeUnmount(() => applyPaper(saved.value))

function discard(): void {
  seed(saved.value)
}

function resetToCream(): void {
  hsl.value = clampToLimits(hexToHsl(DEFAULT_PAPER))
  useDefault.value = true
}

function pick(next: Partial<Hsl>): void {
  hsl.value = clampToLimits({ ...hsl.value, ...next })
  useDefault.value = false
}

async function onSave(): Promise<void> {
  const ok = await store.dispatch('profile/save', { paperColor: outgoing.value })
  if (ok) {
    toast.show('Background colour saved.')
  } else {
    const reason = store.getters['profile/requestError']('save') as string | null
    toast.error(`Couldn't save the colour${reason ? `: ${reason}` : '.'}`)
  }
}

/* ── Hue slider ────────────────────────────────────────────────── */
const hue = computed<number>({
  get: () => Math.round(hsl.value.h),
  set: (h) => pick({ h }),
})

// The track shows real hues, at a strength she could actually pick.
const hueTrack = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360]
  .map((h) => `hsl(${h} ${S_MAX}% ${L_MIN}%)`)
  .join(', ')})`

/* ── 2D pad: x = saturation 0→max, y = lightness max (top) → min ── */
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

function drawPad(): void {
  const el = canvas.value
  const ctx = el?.getContext('2d')
  if (!el || !ctx) return
  const cell = 4
  for (let x = 0; x < el.width; x += cell) {
    for (let y = 0; y < el.height; y += cell) {
      const s = (x / el.width) * S_MAX
      const l = L_MAX - (y / el.height) * (L_MAX - L_MIN)
      ctx.fillStyle = `hsl(${hsl.value.h} ${s}% ${l}%)`
      ctx.fillRect(x, y, cell, cell)
    }
  }
}

// Redraw when the hue changes, and once the canvas exists (it's behind v-if).
watch(() => Math.round(hsl.value.h), drawPad)
watch(canvas, () => nextTick(drawPad), { immediate: true })

const markerStyle = computed(() => ({
  left: `${(hsl.value.s / S_MAX) * 100}%`,
  top: `${((L_MAX - hsl.value.l) / (L_MAX - L_MIN)) * 100}%`,
}))

function pickFromPointer(event: PointerEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const fx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const fy = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
  pick({ s: fx * S_MAX, l: L_MAX - fy * (L_MAX - L_MIN) })
}

let dragging = false

function onPadDown(event: PointerEvent): void {
  dragging = true
  // Keep receiving moves even when the pointer leaves the pad mid-drag.
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  pickFromPointer(event)
}

function onPadMove(event: PointerEvent): void {
  if (dragging) pickFromPointer(event)
}

function onPadUp(): void {
  dragging = false
}

function onPadKey(event: KeyboardEvent): void {
  const big = event.shiftKey
  const step: Record<string, Partial<Hsl>> = {
    ArrowRight: { s: hsl.value.s + (big ? 5 : 1) },
    ArrowLeft: { s: hsl.value.s - (big ? 5 : 1) },
    ArrowUp: { l: hsl.value.l + (big ? 2 : 0.5) },
    ArrowDown: { l: hsl.value.l - (big ? 2 : 0.5) },
  }
  const next = step[event.key]
  if (!next) return
  event.preventDefault()
  pick(next)
}
</script>

<style scoped>
.pc { display: grid; gap: var(--space-sm); width: 100%; }
.pc__head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-sm); flex-wrap: wrap; }
.pc__title { font-size: var(--step-2); }
.pc__sub { font-size: var(--step--1); color: var(--ink-mute); }

.pc__body {
  border: 1px solid var(--rule);
  background: var(--paper-card);
  padding: clamp(1.1rem, 3vw, 1.75rem);
  display: grid;
  gap: var(--space-md);
  grid-template-columns: 1fr;
}
@media (min-width: 720px) { .pc__body { grid-template-columns: minmax(0, 22rem) 1fr; } }

.pc__picker { display: grid; gap: 0.6rem; }

.pc__pad {
  position: relative;
  aspect-ratio: 2 / 1;
  border: 1px solid var(--rule);
  cursor: crosshair;
  touch-action: none; /* dragging on the pad must not scroll the page */
}
.pc__pad:focus-visible { outline: 2px solid var(--teal); outline-offset: 3px; }

.pc__canvas { display: block; width: 100%; height: 100%; }

.pc__marker {
  position: absolute;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--paper-card);
  pointer-events: none;
}

.pc__hue {
  width: 100%;
  height: 14px;
  appearance: none;
  border: 1px solid var(--rule);
  cursor: pointer;
}
.pc__hue::-webkit-slider-thumb {
  appearance: none;
  width: 14px; height: 22px;
  background: var(--paper-card);
  border: 2px solid var(--ink);
}
.pc__hue::-moz-range-thumb {
  width: 12px; height: 20px;
  background: var(--paper-card);
  border: 2px solid var(--ink);
  border-radius: 0;
}

.pc__ends {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

.pc__side { display: grid; gap: 0.75rem; align-content: start; justify-items: start; }

.pc__swatch {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  width: 9rem;
  height: 5rem;
  border: 1px solid var(--rule);
  font-family: var(--font-display);
  font-size: var(--step-2);
}
.pc__sample-ink { color: var(--ink); }
.pc__sample-teal { color: var(--teal); }

.pc__hex { font-size: var(--step--1); color: var(--ink-soft); }

.pc__actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); align-items: center; }
.pc .btn { cursor: pointer; }

.pc__ghost {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-mute);
  cursor: pointer;
}
.pc__ghost:hover:not(:disabled) { color: var(--teal); }
.pc__ghost:disabled { opacity: 0.5; cursor: default; }

.pc__dirty { font-size: var(--step--1); color: var(--coral); }
</style>
