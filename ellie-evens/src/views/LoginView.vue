<template>
  <main class="gate">
    <div class="gate__card">
      <SunMark :size="52" />

      <p class="eyebrow">Backstage</p>
      <h1 class="gate__title">Admin sign-in</h1>

      <p class="gate__body">
        Sign in with your account!
      </p>

      <p v-if="error" class="state state--error">{{ error }}</p>

      <button class="btn" type="button" :disabled="busy" @click="signIn">
        {{ busy ? 'Redirecting…' : 'Continue to sign-in' }}
      </button>

      <RouterLink class="gate__back" to="/">&larr; Back to the site</RouterLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useStore } from '@/store'
import SunMark from '@/components/SunMark.vue'

const store = useStore()
const router = useRouter()

const busy = ref(false)
const error = computed<string | null>(() => store.getters['auth/requestError']('login'))

// Already signed in? Don't make her click through a login she doesn't need.
onMounted(() => {
  if (store.getters['auth/isAuthenticated']) void router.replace('/admin')
})

async function signIn(): Promise<void> {
  busy.value = true
  await store.dispatch('auth/login')
}
</script>

<style scoped>
.gate {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-md);
  background: var(--paper-card);
}

.gate__card {
  width: min(28rem, 100%);
  background: var(--paper);
  border: 1px solid var(--rule);
  box-shadow: 10px 10px 0 0 var(--teal);
  padding: clamp(1.75rem, 5vw, 2.75rem);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.gate__title {
  font-size: var(--step-3);
  margin-bottom: 0.25rem;
}

.gate__body {
  color: var(--ink-soft);
  font-size: 0.95rem;
}

.gate .btn {
  margin-top: var(--space-xs);
  cursor: pointer;
}

.gate__back {
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-mute);
  text-decoration: none;
  margin-top: var(--space-xs);
}

.gate__back:hover { color: var(--teal); }
</style>
