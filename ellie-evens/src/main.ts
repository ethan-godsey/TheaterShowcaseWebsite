import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store, { key } from './store'
import { reveal } from './directives/reveal'

const app = createApp(App)

// The key is what makes useStore() typed in components. Passing the store
// without it still works at runtime, but silently degrades to Store<any>.
app.use(store, key)
app.use(router)
app.directive('reveal', reveal)

// Re-attach a surviving session before the first navigation guard runs.
void store.dispatch('auth/restore')

app.mount('#app')
