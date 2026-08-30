<template>
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <span class="footer__name">Ellie Evens</span>
      </div>

      <nav class="footer__nav" aria-label="Footer">
        <a href="#about">About</a>
        <a href="#gallery">Gallery</a>
        <a href="#reel">Reel</a>
        <a href="#shows">Shows</a>
        <a href="#contact">Contact</a>
      </nav>

      <p class="footer__legal">&copy; {{ year }} Ellie Evens</p>
    </div>
  </footer>
</template>

<script setup lang="ts">

const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  background: var(--paper-deep);
  border-top: 1px solid var(--rule);
  padding: var(--space-lg) var(--space-md);
}

.footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer__name {
  font-family: var(--font-display);
  font-variation-settings: var(--wonk-display);
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--ink);
}

.footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.footer__nav a {
  text-decoration: none;
  font-size: var(--step--1);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-mute);
  transition: color 0.2s ease;
}

.footer__nav a:hover { color: var(--teal); }

.footer__legal {
  width: 100%;
  font-size: var(--step--1);
  color: var(--ink-mute);
}

@media (min-width: 720px) {
  .footer__legal { width: auto; }
}
</style>
