 
import type { Module } from 'vuex'
import type { Photo } from '@/types'
import type { RootState } from '../types'
import {
  createRequests,
  requestMutations,
  requestGetters,
  type Requests,
} from '../requestState'

// You'll need these as you fill in the TODOs:
//   import { api } from '@/api/client'
//   import type { PresignResponse } from '@/types'
//   import { runRequest } from '../requestState'

export interface GalleryState {
  items: Photo[]
  loadedAt: number | null
  activeTag: string | null
  requests: Requests<'fetch' | 'upload' | 'remove'>
}

const gallery: Module<GalleryState, RootState> = {
  namespaced: true,

  state: () => ({
    items: [],
    loadedAt: null,
    activeTag: null,
    requests: createRequests('fetch', 'upload', 'remove'),
  }),

  mutations: {
    ...requestMutations,

    // TODO SET_ITEMS / ADD_ITEM / REMOVE_ITEM / SET_ACTIVE_TAG
    //   REMOVE_ITEM takes a Photo['key'], not an index.
  },

  getters: {
    ...requestGetters,

    // TODO visible(state): Photo[]  -> items matching activeTag, all when null
    // TODO allTags(state): string[] -> every tag across items, deduped + sorted
    // TODO isEmpty(state, getters): boolean -> fetch succeeded AND items empty
    //   `getters` is the 2nd arg — that's how a getter reads another getter.
  },

  actions: {
    // TODO fetch  -> api.get<Photo[]>('/gallery'), same skip-if-loaded shape

    // TODO upload({ commit }, payload: { file: File; caption?: string; tags?: string[] })
    //   Two steps:
    //     1. api.post<PresignResponse>('/gallery/presign', {...})
    //     2. PUT the file DIRECTLY to uploadUrl with plain fetch(), not api.*
    //   Why must the file not pass through the Express server? Two reasons.

    // TODO remove({ commit }, key: string)
    // TODO filterByTag({ commit }, tag: string | null)
  },
}

export default gallery
