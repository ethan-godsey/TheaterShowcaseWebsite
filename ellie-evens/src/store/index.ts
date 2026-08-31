import type { InjectionKey } from 'vue'
import { createStore, useStore as baseUseStore, type Store } from 'vuex'

import gallery from './modules/gallery'
import shows from './modules/shows'
import contact from './modules/contact'
import auth from './modules/auth'
import media from './modules/media'
import type { RootState } from './types'

export type { RootState }

/**
 * Modules are sliced by domain noun, not by page. Pages get renamed, merged and
 * split constantly; "a show" does not. It's also why gallery is one module and
 * not two (public grid + admin uploader) — both look at the same photos.
 */
const store = createStore<RootState>({
  modules: { gallery, shows, contact, auth, media },

  // Throws the moment state is written outside a mutation. Dev only: the deep
  // watcher backing it is genuinely expensive on large state.
  strict: import.meta.env.DEV,
})

/**
 * Vuex has no way to infer the store type at the injection site, so we hand it
 * one. Without this key, useStore() in a component returns Store<any> and every
 * bit of type safety above evaporates.
 */
export const key: InjectionKey<Store<RootState>> = Symbol('store')

/** Always import THIS, never vuex's useStore — this one is typed. */
export function useStore(): Store<RootState> {
  return baseUseStore(key)
}

export default store
