<template>
  <div class="admin">
    <header class="admin__bar">
      <div class="admin__brand">
        <SunMark :size="26" />
        <span>Ellie Evens &middot; Admin</span>
      </div>
      <div class="admin__who">
        <span class="admin__user">{{ username }}</span>
        <button class="admin__out" type="button" @click="signOut">Sign out</button>
      </div>
    </header>

    <main class="admin__body container">
      <p class="eyebrow">Backstage</p>
      <h1 class="admin__title">Welcome back</h1>
      <p class="admin__lede">
        You're signed in and your session is verified by the API.
      </p>

      <ShowsPanel />
      <MediaPanel />
      <ProfilePanel />

      <!-- TODO(next): photo upload. Needs a presign route + AWS SDK on the
           server, an IAM role on the instance, and CORS on the media bucket. -->
      <section class="admin__todo">
        <h2 class="admin__h2">Coming next</h2>
        <ul>
          <li>Upload photos</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '@/store'
import { api, ApiError } from '@/api/client'
import SunMark from '@/components/SunMark.vue'
import ShowsPanel from '@/components/admin/ShowsPanel.vue'
import MediaPanel from '@/components/admin/MediaPanel.vue'
import ProfilePanel from '@/components/admin/ProfilePanel.vue'

const store = useStore()

const username = computed<string | null>(() => store.getters['auth/username'])

const checking = ref(false)
const result = ref<string | null>(null)

async function check(): Promise<void> {
  checking.value = true
  result.value = null
  try {
    const me = await api.get<{ sub: string; username?: string }>('/auth/me')
    result.value = JSON.stringify(me, null, 2)
  } catch (err) {
    result.value =
      err instanceof ApiError
        ? `${err.status} — ${err.message}`
        : 'Request failed'
  } finally {
    checking.value = false
  }
}

function signOut(): void {
  void store.dispatch('auth/logout')
}
</script>

<style scoped>
.admin { min-height: 100vh; background: var(--paper); }

.admin__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  padding: 0.85rem clamp(1.25rem, 4vw, 3rem);
  border-bottom: 2px solid var(--ink);
  background: var(--paper-card);
}

.admin__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink);
}

.admin__who { display: flex; align-items: center; gap: var(--space-sm); }

.admin__user {
  font-size: var(--step--1);
  color: var(--ink-mute);
  font-variant-numeric: tabular-nums;
}

.admin__out {
  background: none;
  border: 1px solid var(--rule);
  padding: 0.4rem 0.9rem;
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
  cursor: pointer;
}

.admin__out:hover { border-color: var(--teal); color: var(--teal); }

.admin__body { padding: var(--space-lg) var(--space-md); display: grid; gap: var(--space-lg); justify-items: start; }
.admin__body > * { width: 100%; }
.admin__title { font-size: var(--step-3); margin-top: 0.3rem; }
.admin__lede { color: var(--ink-soft); }
.admin__h2 { font-size: var(--step-1); margin-bottom: 0.4rem; }
.admin__hint { font-size: 0.92rem; color: var(--ink-mute); margin-bottom: var(--space-sm); max-width: 46ch; }

.admin__result {
  margin-top: var(--space-sm);
  background: var(--paper-card);
  border: 1px solid var(--rule);
  padding: 0.9rem 1.1rem;
  font-size: 0.85rem;
  overflow-x: auto;
  max-width: 100%;
}

.admin__todo ul { color: var(--ink-mute); padding-left: 1.1rem; display: grid; gap: 0.35rem; }
.admin .btn { cursor: pointer; }
</style>
