 
import type { Module } from 'vuex'
import type { RootState } from '../types'
import {
  createRequests,
  requestMutations,
  requestGetters,
  type Requests,
} from '../requestState'

// You'll need these as you fill in the TODOs:
//   import { api, setAuthToken } from '@/api/client'
//   import type { Session } from '@/types'
//   import { runRequest } from '../requestState'

/**
 * Admin session for the upload page.
 *
 * OPEN DECISION: where the token lives. sessionStorage is readable by any XSS
 * on the page; an httpOnly + SameSite cookie set by the API is not, but costs
 * CORS credentials config plus a CSRF token. Pick one deliberately.
 */
export interface AuthState {
  token: string | null
  expiresAt: string | null
  requests: Requests<'login'>
}

const auth: Module<AuthState, RootState> = {
  namespaced: true,

  state: () => ({
    token: null,
    expiresAt: null,
    requests: createRequests('login'),
  }),

  mutations: {
    ...requestMutations,

    // TODO SET_SESSION(state, session: Session)
    // TODO CLEAR_SESSION(state)
  },

  getters: {
    ...requestGetters,

    // TODO isAuthenticated(state): boolean
    //   A token that EXISTS is not a token that's VALID. Check expiry.
  },

  actions: {
    // TODO restore({ commit })
    //   Persist under a single module-level const, e.g. 'ee.admin.session'.
    //   Read it on boot, reject it if expired or malformed,
    //   call setAuthToken. JSON.parse on storage can throw — handle it.

    // TODO login({ commit }, payload: { password: string })
    //   api.post<Session>('/auth/login', payload), then setAuthToken + persist.

    // TODO logout({ commit })
    //   The token lives in THREE places. Missing one is the classic bug here.
  },
}

export default auth
