<template>
  <main>
    <h1>{{ name }}</h1>
    <p>{{ tagline }}</p>
    <div class="headshot">
      <img src = "headShotImage">
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import headShotImage from '@/assets/logo.svg'
const name = ref('Ellie Evens')
const tagline = ref('Actor · Singer · Dancer')
</script>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-family: 'Georgia', serif;
}

h1 {
  font-size: 3rem;
  margin: 0;
}

p {
  font-size: 1.2rem;
  color: #666;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-top: 0.5rem;
}
</style>
