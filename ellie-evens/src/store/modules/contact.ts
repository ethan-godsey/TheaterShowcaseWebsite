import type { Module } from 'vuex'
import { api } from '@/api/client'
import type { ContactPayload } from '@/types'
import type { RootState } from '../types'
import {
  createRequests,
  requestMutations,
  requestGetters,
  runRequest,
  type Requests,
} from '../requestState'

/** Contact form submissions. Write-only from the public site's point of view. */
export interface ContactState {
  lastSubmittedAt: number | null
  requests: Requests<'submit'>
}

const contact: Module<ContactState, RootState> = {
  namespaced: true,

  state: () => ({
    lastSubmittedAt: null,
    requests: createRequests('submit'),
  }),

  mutations: {
    ...requestMutations,

    MARK_SUBMITTED(state) {
      state.lastSubmittedAt = Date.now()
    },
  },

  getters: {
    ...requestGetters,

    /** Drives the "thanks, I'll be in touch" panel. */
    wasSubmitted: (state) => state.lastSubmittedAt !== null,
  },

  actions: {
    async submit({ commit }, payload: ContactPayload) {
      await runRequest(commit, 'submit', async () => {
        await api.post<void>('/contact', payload)
        commit('MARK_SUBMITTED')
      })
    },
  },
}

export default contact
