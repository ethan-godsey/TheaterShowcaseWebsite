<template>
  <nav>
    <a class="brand" href='#head'>Ellie Evens</a>
    <div class="links">
      <a href="#about">About</a>
      <a href="#gallery">Gallery</a>
      <a href="#reel">Reel</a>
      <a href="#shows">Shows</a>
      <a href="#contact">Contact</a>
    </div>
  </nav>
</template>

<script setup>
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
  padding: 1.2rem 3rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #eee;
}

.brand {
  text-decoration: none;
  font-family: 'Georgia', serif;
  color: #2b8816;
  font-size: 1.3rem;
  letter-spacing: 0.05em;
}

.brand a:hover {
    font-size: 1.5rem;
    color: #1b8703; 
}

.links {
  display: flex;
  gap: 2.5rem;
}

.links a {
  text-decoration: none;
  color: #2b8816;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: color 0.2s ease;
}

.links a:hover {
  color: #999;
}
</style>