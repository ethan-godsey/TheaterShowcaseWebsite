import type { Module } from 'vuex'
import { setAuthToken } from '@/api/client'
import { beginLogin, exchangeCode, readClaim, logoutUrl } from '@/api/cognito'
import type { Session } from '@/types'
import type { RootState } from '../types'
import {
  createRequests,
  requestMutations,
  requestGetters,
  runRequest,
  type Requests,
} from '../requestState'


const STORAGE_KEY = 'ee.admin.session'

export interface AuthState {
  session: Session | null
  requests: Requests<'login'>
}

function readStored(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (!session.accessToken || session.expiresAt <= Date.now()) return null
    return session
  } catch {
    return null
  }
}

const auth: Module<AuthState, RootState> = {
  namespaced: true,

  state: () => ({
    session: null,
    requests: createRequests('login'),
  }),

  mutations: {
    ...requestMutations,

    SET_SESSION(state, session: Session) {
      state.session = session
    },

    CLEAR_SESSION(state) {
      state.session = null
    },
  },

  getters: {
    ...requestGetters,

    // Existing AND unexpired. A token that exists is not a token that's valid.
    isAuthenticated: (state) =>
      state.session !== null && state.session.expiresAt > Date.now(),

    username: (state) => state.session?.username ?? null,
  },

  actions: {
    /** Re-attach a surviving session on boot, before the first route guard. */
    restore({ commit }) {
      const session = readStored()
      if (!session) {
        setAuthToken(null)
        return
      }
      setAuthToken(session.accessToken)
      commit('SET_SESSION', session)
    },

    /** Navigates away to Cognito; nothing after this runs. */
    async login() {
      await beginLogin()
    },

    /** Called by the /callback route with the code Cognito redirected back with. */
    async completeLogin({ commit }, code: string) {
      return runRequest(commit, 'login', async () => {
        const tokens = await exchangeCode(code)

        const session: Session = {
          accessToken: tokens.access_token,
          idToken: tokens.id_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
          username:
            readClaim(tokens.id_token, 'email') ??
            readClaim(tokens.access_token, 'username') ??
            'admin',
        }

        setAuthToken(session.accessToken)
        commit('SET_SESSION', session)
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        return session
      })
    },

    logout({ commit }) {
      // clear token from API client
      setAuthToken(null)

      // from session
      sessionStorage.removeItem(STORAGE_KEY)

      // and from store
      commit('CLEAR_SESSION')

      window.location.assign(logoutUrl())
    },
  },
}

export default auth
