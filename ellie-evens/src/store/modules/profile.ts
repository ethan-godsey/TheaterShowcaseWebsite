import type { Module } from 'vuex'
import { api } from '@/api/client'
import type { Profile } from '@/types'
import type { RootState } from '../types'
import {
  createRequests,
  requestMutations,
  requestGetters,
  runRequest,
  type Requests,
} from '../requestState'

/**
 * The single profile row: bio, headline, and the stats casting scans for.
 * One record rather than a collection — so no items array, no upsert, just
 * fetch and save.
 */
export interface ProfileState {
  profile: Profile | null
  loadedAt: number | null
  requests: Requests<'fetch' | 'save'>
}

const profile: Module<ProfileState, RootState> = {
  namespaced: true,

  state: () => ({
    profile: null,
    loadedAt: null,
    requests: createRequests('fetch', 'save'),
  }),

  mutations: {
    ...requestMutations,

    SET_PROFILE(state, value: Profile | null) {
      state.profile = value
      state.loadedAt = Date.now()
    },
  },

  getters: {
    ...requestGetters,

    /** Split into paragraphs for rendering; blank lines separate them. */
    bioParagraphs: (state) =>
      (state.profile?.bio ?? '')
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),

    /** "F3 – G6", or just the high note if that's all we know. */
    range: (state) => {
      const low = state.profile?.rangeLow?.trim()
      const high = state.profile?.rangeHigh?.trim()
      if (low && high) return `${low} – ${high}`
      if (high) return `Up to ${high}`
      return ''
    },
  },

  actions: {
    async fetch({ commit, state }, payload?: { force?: boolean }) {
      if (!payload?.force && state.loadedAt !== null) return

      await runRequest(commit, 'fetch', async () => {
        const value = await api.get<Profile | null>('/profile')
        commit('SET_PROFILE', value)
      })
    },

    /**
     * The API COALESCEs every field, so a partial payload only changes what
     * it names. Sending the whole object is fine and simpler.
     */
    async save({ commit }, value: Partial<Profile>) {
      return runRequest(commit, 'save', async () => {
        const saved = await api.put<Profile>('/profile', value)
        commit('SET_PROFILE', saved)
        return saved
      })
    },
  },
}

export default profile
