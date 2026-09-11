<template>
  <div v-if="present" class="curtain" :class="{ 'curtain--open': open }" aria-hidden="true">
    <div class="curtain__side curtain__side--left">
      <div v-for="i in FOLDS" :key="`l${i}`" class="curtain__fold" :style="foldStyle(i)"></div>
    </div>

    <div class="curtain__side curtain__side--right">
      <div v-for="i in FOLDS" :key="`r${i}`" class="curtain__fold" :style="foldStyle(i)"></div>
    </div>

    <!-- Vignette: dark at the top, clearing as the curtains part. Sells depth
         that flat panels can't. -->
    <div class="curtain__vignette"></div>
  </div>
</template>

<script setup lang="ts">
/*
 * Theatre curtains that part on first load.
 *
 * Built from overlapping vertical strips rather than two solid panels: each
 * strip hangs from the top and sways on a staggered delay, so the fabric
 * ripples instead of sliding as a slab. On open the whole side translates
 * away AND scales to zero width, which reads as the curtain gathering into
 * the wings.
 */

import { ref, onMounted } from 'vue'

const SEEN_KEY = 'ee.curtain.seen'
const FOLDS = 9
const OPEN_MS = 2000

const present = ref(false)
const open = ref(false)

/** Negative, staggered delays so the sway is mid-cycle and out of phase. */
function foldStyle(index: number): Record<string, string> {
  return { animationDelay: `${-0.18 * index}s` }
}

onMounted(() => {
  // Storage throws in some private modes — a missing curtain is fine, a crash isn't.
  let seen = false
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    seen = false
  }

  if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  present.value = true
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* ignore */
  }

  /*
   * Two frames before opening. Mount closed and open in the same tick and the
   * browser may batch both into one style recalculation — the transition never
   * runs and the curtains simply aren't there.
   */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      open.value = true
    })
  })

  window.setTimeout(() => {
    present.value = false
  }, OPEN_MS + 300)
})
</script>

<style scoped>
.curtain {
  position: fixed;
  inset: 0;
  z-index: 10000; /* above the paper grain (9999) */
  pointer-events: none;
  overflow: hidden;
}

.curtain__side {
  position: absolute;
  /* Overhang top and bottom so the swaying strips never expose an edge. */
  top: -6%;
  bottom: -6%;
  width: 54%;
  display: flex;
  overflow: hidden;
  transition: transform 2s cubic-bezier(0.62, 0, 0.36, 1);
  will-change: transform;
}

.curtain__side--left {
  left: 0;
  justify-content: flex-start;
  transform-origin: left top;
  border-right: 2px solid var(--marigold);
}

.curtain__side--right {
  right: 0;
  justify-content: flex-end;
  transform-origin: right top;
  border-left: 2px solid var(--marigold);
}

/*
 * translate AND scaleX(0): sliding alone looks like a panel leaving; scaling
 * to nothing as it goes is what reads as fabric gathering into the wings.
 */
.curtain--open .curtain__side--left { transform: translateX(-100%) scaleX(0); }
.curtain--open .curtain__side--right { transform: translateX(100%) scaleX(0); }

.curtain__fold {
  flex: 0 0 auto;
  width: 26%;
  height: 100%;
  /* Negative margin overlaps the strips so the folds read as continuous cloth. */
  margin-left: -12%;

  background: repeating-linear-gradient(
    to left,
    #1b1510 0%,
    #3a2c20 38%,
    #574029 62%,
    #3a2c20 82%,
    #1b1510 100%
  );

  /* Hung from the top, like real cloth on a track. */
  transform-origin: top left;
  transform: rotate(1.6deg);
  animation: curtain-sway 3.6s ease-in-out infinite;
}

.curtain__fold:first-child { margin-left: 0; }

@keyframes curtain-sway {
  50% { transform: rotate(-1.6deg); }
}

.curtain__vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 100%);
  transition: opacity 1.6s ease;
}

.curtain--open .curtain__vignette { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .curtain { display: none; }
}
</style>
