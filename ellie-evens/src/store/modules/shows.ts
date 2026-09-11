 
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


export type ShowDraft = Omit<Show, 'id'> & { id?: string }

export interface ShowsState {
  items: Show[]
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

    // Sort by date for shows after now
    upcoming(state: ShowsState) {
      const now = Date.now()
      return state.items
        .filter((show) => new Date(show.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },


    // sort new to old
    past(state) {
      const now = Date.now()
      return state.items
        .filter((show) => new Date(show.date).getTime() < now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
  },

    actions: {
      async fetch({ commit, state }, payload?: { force?: boolean }) {
        if (!payload?.force && state.loadedAt !== null) return

        await runRequest(commit, 'fetch', async () => {
          const items = await api.get<Show[]>('/shows')
          commit('SET_ITEMS', items)
      })
    },
 
   // post edit or new to DB and update display
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
