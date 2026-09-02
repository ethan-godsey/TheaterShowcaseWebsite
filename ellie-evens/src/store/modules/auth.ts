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

/**
 * Admin session.
 *
 * The password never reaches this code — Cognito's hosted page collects it and
 * hands back tokens. This module only stores them and keeps the API client
 * supplied with the access token.
 *
 * KNOWN TRADEOFF: tokens live in sessionStorage, readable by any XSS on the
 * page. The hardened alternative is an httpOnly cookie set by our own API,
 * which costs a token-exchange proxy plus CSRF protection. Acceptable here
 * because the blast radius is "edit a public portfolio" and tokens expire
 * within the hour — but it is a real, deliberate compromise.
 */
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
    // An expired token is the same as no token.
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

    /**
     * The token lives in three places: the API client, the store, and
     * sessionStorage. Clearing fewer than all three leaves a ghost session.
     * Then Cognito's own session must end too, or its login page will wave
     * the next visitor straight back in without asking for a password.
     */
    logout({ commit }) {
      setAuthToken(null)
      sessionStorage.removeItem(STORAGE_KEY)
      commit('CLEAR_SESSION')
      window.location.assign(logoutUrl())
    },
  },
}

export default auth
