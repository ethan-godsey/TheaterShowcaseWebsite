<template>
  <section id="gallery">
    <div id='pics'>
      <img
          v-for="(photo, index) in imagePaths"
          :key="index"
          :src="photo"
          class="slide"
        />
    </div>
  </section>
</template>

<script setup>
  const images = import.meta.glob('@/assets/IMG_*', { eager: true });

  // Access them as an object where the key is the path
  const imagePaths = Object.values(images).map(img => img.default);
</script>

<style scoped>
  #gallery{
      padding: 4rem;
  }

  #pics img{
    padding: 0.5px;
    width: 250px;
    height: 250px;
    object-fit: cover;
  }
</style>