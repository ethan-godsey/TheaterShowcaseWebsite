 
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
import { reorderItems } from '../reorder'


export type ShowDraft = Omit<Show, 'id'> & { id?: string }

export interface ShowsState {
  items: Show[]
  loadedAt: number | null
  requests: Requests<'fetch' | 'save' | 'remove' | 'reorder'>
}

const shows: Module<ShowsState, RootState> = {
  namespaced: true,

  state: () => ({
    items: [],
    loadedAt: null,
    requests: createRequests('fetch', 'save', 'remove', 'reorder'),
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

    /** Replace the list wholesale without touching loadedAt — used for the
     *  optimistic reorder and for rolling it back. */
    REPLACE_ITEMS(state, items: Show[]) {
      state.items = items
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


    // Ellie's own order, as dragged in the admin — strongest credits first,
    // the way a résumé reads. items already arrive in that order from the
    // API, so this only filters. Don't re-sort here: a date sort would
    // silently undo every reorder she makes.
    past(state) {
      const now = Date.now()
      return state.items.filter((show) => new Date(show.date).getTime() < now)
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

    /** Save a new order. See store/reorder.ts. */
    reorder(ctx, ids: string[]): Promise<boolean> {
      return reorderItems(ctx, '/shows/order', ids)
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
