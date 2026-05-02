<template>
  <section id="head">
    <div class="carousel">
      <div class="track" :style="trackStyle">
        <img
          v-for="(photo, index) in photos"
          :key="index"
          :src="photo"
          class="slide"
        />
      </div>
      <div class="dots">
        <span
          v-for="(photo, index) in photos"
          :key="index"
          :class="['dot', { active: current === index }]"
          @click="goTo(index)"
        />
      </div>
      <button class="arrow left" @click="prev">‹</button>
      <button class="arrow right" @click="next">›</button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import headShot1 from '@/assets/HeadShot1.JPG'
import headShot2 from '@/assets/HeadShot2.png'

const photos = [headShot1, headShot2]
const current = ref(0)
let timer = null

const trackStyle = computed(() => ({
  transform: `translateX(-${current.value * 100}%)`
}))

function next() {
  current.value = (current.value + 1) % photos.length
}

function prev() {
  current.value = (current.value - 1 + photos.length) % photos.length
}

function goTo(index) {
  current.value = index
}

</script>

<style scoped>
#head {
  padding: 4rem;
}

.carousel {
  position: relative;
  width: 400px;
  overflow: hidden;
  border-radius: 8px;
}

.track {
  display: flex;
  transition: transform 0.3s ease;
}

.slide {
  min-width: 100%;
  height: 750px;
  object-fit: cover;
}

.dots {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background 0.2s;
}

.dot.active {
  background: white;
}

.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.3);
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.arrow:hover {
  background: rgba(0,0,0,0.6);
}

.arrow.left { left: 8px; }
.arrow.right { right: 8px; }
</style>