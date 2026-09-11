<template>
  <nav aria-label="Primary" :class="{ 'is-scrolled': scrolled }">
    <a class="brand" href='#head'>Ellie Evens</a>
    <div class="links">
      <a href="#about">About</a>
      <a href="#gallery">Gallery</a>
      <a href="#reel">Reel</a>
      <a href="#shows">Shows</a>
      <a href="#contact">Contact</a>
    </div>

    <!-- For animation -->
    <div class="progress" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true" />
  </nav>
</template>

<script setup lang="ts">

import { ref, onMounted, onBeforeUnmount } from 'vue'

const progress = ref(0)
const scrolled = ref(false)

let frame = 0

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(frame)
})


function onScroll(): void {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

// Calculation for only one call rather than many
function measure(): void {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  progress.value = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0
  scrolled.value = window.scrollY > 24
}
</script>

<style scoped>
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 clamp(1.25rem, 4vw, 3rem);
  height: var(--nav-height);
  background: color-mix(in srgb, var(--paper) 92%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--rule);
  transition: box-shadow 0.3s ease, background 0.3s ease;
}

nav.is-scrolled {
  box-shadow: 0 1px 18px -6px rgba(42, 33, 27, 0.35);
}

.progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--marigold);
  transform-origin: 0 50%;
  transform: scaleX(0);
  /* Transform-only, so this never triggers layout while scrolling. */
  will-change: transform;
}

.brand {
  text-decoration: none;
  font-family: var(--font-display);
  font-variation-settings: var(--wonk-display);
  font-weight: 600;
  color: var(--ink);
  font-size: 1.3rem;
  letter-spacing: 0.05em;
}

.brand:hover {
  color: var(--teal);
}

.links {
  display: flex;
  gap: 2.5rem;
}

.links a {
  text-decoration: none;
  color: var(--ink-mute);
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: color 0.2s ease;
}

.links a:hover {
  color: var(--teal);
}

/* On phones the six items can't fit at full spacing. A horizontally
   scrollable row keeps every anchor reachable without a hamburger. */
@media (max-width: 720px) {
  nav { gap: var(--space-sm); }
  .brand { flex: none; }
  .links {
    gap: 1.1rem;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .links::-webkit-scrollbar { display: none; }
  .links a { white-space: nowrap; }
}
</style>