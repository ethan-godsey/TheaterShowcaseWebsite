 
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

export interface ShowsState {
  items: Show[]
  /** null = never fetched. Used to skip redundant requests. */
  loadedAt: number | null
  requests: Requests<'fetch' | 'save'>
}

const shows: Module<ShowsState, RootState> = {
  namespaced: true,

  state: () => ({
    items: [],
    loadedAt: null,
    requests: createRequests('fetch', 'save'),
  }),

  mutations: {
    ...requestMutations,

    SET_ITEMS(state: ShowsState, items: Show[]){
      state.items = items
      state.loadedAt = Date.now()
    }
    // TODO UPSERT_ITEM(state, show: Show)
    //   Insert when show.id isn't present, replace it when it is.
    //   In-place mutation is tempting here. Resist it.
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
    past(state: ShowsState) {
      const now = Date.now()
      return state.items
        .filter((show) => new Date(show.date).getTime() < now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
 
    //   Skip the network when loadedAt is set and force isn't true.
    //   Wrap in runRequest(commit, 'fetch', async () => { ... }).
    //   api.get<Show[]>('/shows')

    // TODO save({ commit }, show: Show | Omit<Show, 'id'>)
    //   POST when there's no id, PUT /shows/:id when there is.
    //   Commit the RESPONSE, not the argument — the server assigns the id.
  },
}

export default shows
