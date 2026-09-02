import type { GalleryState } from './modules/gallery'
import type { ShowsState } from './modules/shows'
import type { ContactState } from './modules/contact'
import type { AuthState } from './modules/auth'
import type { ProfileState } from './modules/profile'
import type { MediaState } from './modules/media'

/**
 * The shape of `store.state`. Lives in its own file so modules can import it
 * without a runtime import cycle back through store/index.ts — these are all
 * `import type`, so they erase completely at build time.
 */
export interface RootState {
  gallery: GalleryState
  shows: ShowsState
  contact: ContactState
  auth: AuthState
  profile: ProfileState
  media: MediaState
}
