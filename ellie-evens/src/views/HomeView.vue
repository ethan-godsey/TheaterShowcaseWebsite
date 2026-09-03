<template>
  <CurtainOverlay />
  <a class="skip-link" href="#main">Skip to content</a>
  <NavBar />
  <main id="main">
    <HeadSection />
    <AboutSection />
    <GallerySection />
    <ReelSection />
    <ShowsSection />
    <ContactForm />
  </main>
  <SiteFooter />
</template>

<script setup lang="ts">
import CurtainOverlay from '@/components/CurtainOverlay.vue'
import NavBar from '@/components/NavBar.vue'
import HeadSection from '@/components/HeadSection.vue'
import AboutSection from '@/components/AboutSection.vue'
import GallerySection from '@/components/GallerySection.vue'
import ReelSection from '@/components/ReelSection.vue'
import ShowsSection from '@/components/ShowsSection.vue'
import ContactForm from '@/components/ContactForm.vue'
import SiteFooter from '@/components/SiteFooter.vue'
</script>
