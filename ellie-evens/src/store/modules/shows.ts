 
import type { Module } from 'vuex'
import type { Show } from '@/types'
import type { RootState } from '../types'
import { api } from '@/api/client'

import {
  createRequests,
  requestMutations,
  requestGetters,
  runRequest,
  type Requests,
} from '../requestState'

// You'll need these as you fill in the TODOs:
//   import { api } from '@/api/client'
//   import { runRequest } from '../requestState'

/** A show being edited: no id yet when it's new. */
export type ShowDraft = Omit<Show, 'id'> & { id?: string }

export interface ShowsState {
  items: Show[]
  /** null = never fetched. Used to skip redundant requests. */
  loadedAt: number | null
  requests: Requests<'fetch' | 'save' | 'remove'>
}

const shows: Module<ShowsState, RootState> = {
  namespaced: true,

  state: () => ({
    items: [],
    loadedAt: null,
    requests: createRequests('fetch', 'save', 'remove'),
  }),

  mutations: {
    ...requestMutations,

    SET_ITEMS(state, items: Show[]) {
      state.items = items
      state.loadedAt = Date.now()
    },

    // Insert when the id is new, replace when it exists. Builds a new array
    // rather than splicing, so the change is a reassignment Vue can't miss.
    UPSERT_ITEM(state, show: Show) {
      const exists = state.items.some((s) => s.id === show.id)
      state.items = exists
        ? state.items.map((s) => (s.id === show.id ? show : s))
        : [...state.items, show]
    },

    REMOVE_ITEM(state, id: string) {
      state.items = state.items.filter((s) => s.id !== id)
    },
  },

  getters: {
    ...requestGetters,

    // TODO upcoming(state): Show[]  -> date >= now, soonest first
    upcoming(state: ShowsState) {
      const now = Date.now()
      return state.items
        .filter((show) => new Date(show.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },


    // TODO past(state): Show[]      -> date < now, most recent first
    //   Remember what .sort() does to the array you call it on.
    past(state) {
      const now = Date.now()
      return state.items
        .filter((show) => new Date(show.date).getTime() < now)
        // b - a, not a - b: most recent credit first.
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
    // TODO byId(state)  -> returns a FUNCTION: (id: string) => Show | null
    //   Its return type differs from the others. Work out why before writing it.
  },

    actions: {
      async fetch({ commit, state }, payload?: { force?: boolean }) {
        if (!payload?.force && state.loadedAt !== null) return

        await runRequest(commit, 'fetch', async () => {
          const items = await api.get<Show[]>('/shows')
          commit('SET_ITEMS', items)
      })
    },
 
    /**
     * Create when there's no id, update when there is.
     * Commits the RESPONSE, never the argument — the server assigns the id
     * and any defaults, so the row it returns is the only accurate one.
     */
    async save({ commit }, show: ShowDraft) {
      return runRequest(commit, 'save', async () => {
        const saved = show.id
          ? await api.put<Show>(`/shows/${show.id}`, show)
          : await api.post<Show>('/shows', show)
        commit('UPSERT_ITEM', saved)
        return saved
      })
    },

    async remove({ commit }, id: string) {
      return runRequest(commit, 'remove', async () => {
        await api.delete<void>(`/shows/${id}`)
        commit('REMOVE_ITEM', id)
        return true
      })
    },
  },
}

export default shows
