import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store, { key } from './store'
import { reveal } from './directives/reveal'
import { applyPaper, cachePaper } from './theme/paper'

const app = createApp(App)

// The key is what makes useStore() typed in components. Passing the store
// without it still works at runtime, but silently degrades to Store<any>.
app.use(store, key)
app.use(router)
app.directive('reveal', reveal)

// Ellie's saved paper colour: apply it, and cache it for the next visit's
// pre-paint script in index.html. Fires only on the SAVED value — the admin
// picker's live preview recolours the page directly, without touching this.
// null = profile not loaded yet; leave whatever the cache already painted.
store.watch(
  (state) => state.profile.profile?.paperColor ?? null,
  (color) => {
    if (color === null) return
    applyPaper(color)
    cachePaper(color)
  },
)

// Re-attach a surviving session before the first navigation guard runs.
void store.dispatch('auth/restore')

app.mount('#app')
