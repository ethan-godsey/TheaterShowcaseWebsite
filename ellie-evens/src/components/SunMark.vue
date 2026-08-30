<template>
  <svg
    class="sun"
    :width="size"
    :height="size"
    viewBox="0 0 120 120"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Rays rotate slowly; the disc stays put so the mark never reads as a spinner. -->
    <g class="sun__rays" :class="{ 'sun__rays--spin': spin }">
      <line v-for="ray in rays" :key="ray" :transform="`rotate(${ray} 60 60)`"
            x1="60" y1="5" x2="60" y2="21" />
    </g>
    <circle class="sun__disc" cx="60" cy="60" r="26" />
    <circle class="sun__ring" cx="60" cy="60" r="26" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; spin?: boolean }>(), {
  size: 120,
  spin: false,
})

// Eight rays at 45° intervals, drawn once and rotated into place.
const rays = [0, 45, 90, 135, 180, 225, 270, 315]
</script>

<style scoped>
.sun { display: block; overflow: visible; }

.sun__rays line {
  stroke: var(--marigold);
  stroke-width: 4.5;
  stroke-linecap: round;
}

.sun__rays--spin {
  transform-origin: 60px 60px;
  animation: sun-spin 120s linear infinite;
}

@keyframes sun-spin { to { transform: rotate(360deg); } }

.sun__disc { fill: var(--marigold); }
.sun__ring { fill: none; stroke: var(--ink); stroke-width: 2.5; }

@media (prefers-reduced-motion: reduce) {
  .sun__rays--spin { animation: none; }
}
</style>
