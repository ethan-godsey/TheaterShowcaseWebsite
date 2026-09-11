 
import type { Module } from 'vuex'
import type { MediaItem } from '@/types'
import type { RootState } from '../types'
import { api } from '@/api/client'
import {
  createRequests,
  requestMutations,
  requestGetters,
  type Requests,
  runRequest,
} from '../requestState'


export type MediaDraft = Omit<MediaItem, 'id'> & { id?: string }

export interface MediaState {
  items: MediaItem[]
  loadedAt: number | null
  activeTag: string | null
  requests: Requests<'fetch' | 'save' | 'remove'>
}

const media: Module<MediaState, RootState> = {
  namespaced: true,

  state: () => ({
    items: [],
    loadedAt: null,
    activeTag: null,
    requests: createRequests('fetch', 'save', 'remove'),
  }),

  mutations: {
    ...requestMutations,
    SET_ITEMS(state, items: MediaItem[]){
      state.activeTag = null
      state.loadedAt = Date.now()
      state.items = items
    },

    UPSERT_ITEM(state, item: MediaItem) {
      const exists = state.items.some((i) => i.id === item.id)
      state.items = exists
        ? state.items.map((i) => (i.id === item.id ? item : i))
        : [...state.items, item]
    },

    REMOVE_ITEM(state, id: string) {
      state.items = state.items.filter((i) => i.id !== id)
    },
  },

  getters: {
    ...requestGetters,

      songs: (state) => state.items.filter((i) => i.kind == 'song'),
      reels: (state) => state.items.filter((i) => i.kind == 'reel')
  },

  actions: {

    // Network log: REQ Pending, SET_ITEMS, REQ Success
    async fetch({ commit, state }, payload?: { force?: boolean }) {
  if (!payload?.force && state.loadedAt !== null) return

  await runRequest(commit, 'fetch', async () => { // set request logic
    const items = await api.get<MediaItem[]>('/media') // send GET request
    commit('SET_ITEMS', items) // write to state
  })
},

    /** Create when there's no id, update when there is. Commits the response. */
    async save({ commit }, item: MediaDraft) {
      return runRequest(commit, 'save', async () => {
        const saved = item.id
          ? await api.put<MediaItem>(`/media/${item.id}`, item)
          : await api.post<MediaItem>('/media', item)
        commit('UPSERT_ITEM', saved)
        return saved
      })
    },

    async remove({ commit }, id: string) {
      return runRequest(commit, 'remove', async () => {
        await api.delete<void>(`/media/${id}`)
        commit('REMOVE_ITEM', id)
        return true
      })
    },
  },
}

export default media
