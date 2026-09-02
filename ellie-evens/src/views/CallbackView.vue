<template>
  <main class="cb">
    <div class="cb__inner">
      <SunMark :size="44" spin />
      <p v-if="!error" class="cb__status">Signing you in…</p>

      <template v-else>
        <h1 class="cb__title">Sign-in didn't complete</h1>
        <p class="state state--error">{{ error }}</p>
        <RouterLink class="btn" to="/login">Try again</RouterLink>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
/*
 * The OAuth landing strip. Cognito redirects here with ?code=…; this view
 * trades it for tokens and gets out of the way. It is never linked to and
 * never bookmarked — which is exactly why it's a separate route from /admin.
 */
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useStore } from '@/store'
import SunMark from '@/components/SunMark.vue'

const store = useStore()
const route = useRoute()
const router = useRouter()

const error = ref<string | null>(null)

onMounted(async () => {
  // Cognito reports its own failures in the query string too.
  const denied = route.query.error_description ?? route.query.error
  if (typeof denied === 'string') {
    error.value = denied
    return
  }

  const code = route.query.code
  if (typeof code !== 'string') {
    error.value = 'No authorization code was returned.'
    return
  }

  const session = await store.dispatch('auth/completeLogin', code)
  if (!session) {
    error.value = store.getters['auth/requestError']('login') ?? 'Sign-in failed.'
    return
  }

  // replace(), not push() — the code is spent, so this URL must never be
  // reachable with the back button.
  await router.replace('/admin')
})
</script>

<style scoped>
.cb { min-height: 100vh; display: grid; place-items: center; padding: var(--space-md); }

.cb__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  text-align: center;
  max-width: 30rem;
}

.cb__status {
  font-family: var(--font-display);
  font-size: var(--step-1);
  color: var(--ink);
}

.cb__title { font-size: var(--step-2); }
.cb .btn { text-decoration: none; margin-top: var(--space-xs); }
</style>
