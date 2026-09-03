import type { Module } from 'vuex'
import { api } from '@/api/client'
import type { Photo, PresignResponse } from '@/types'
import type { RootState } from '../types'
import {
  createRequests,
  requestMutations,
  requestGetters,
  runRequest,
  type Requests,
} from '../requestState'

/** Photos, backed by S3. Rows carry the key; the API composes the URL. */
export interface GalleryState {
  items: Photo[]
  loadedAt: number | null
  requests: Requests<'fetch' | 'upload' | 'remove'>
}

const gallery: Module<GalleryState, RootState> = {
  namespaced: true,

  state: () => ({
    items: [],
    loadedAt: null,
    requests: createRequests('fetch', 'upload', 'remove'),
  }),

  mutations: {
    ...requestMutations,

    SET_ITEMS(state, items: Photo[]) {
      state.items = items
      state.loadedAt = Date.now()
    },

    ADD_ITEM(state, photo: Photo) {
      state.items = [...state.items, photo]
    },

    REMOVE_ITEM(state, id: string) {
      state.items = state.items.filter((p) => p.id !== id)
    },
  },

  getters: {
    ...requestGetters,

    isEmpty: (state, getters) =>
      getters.requestStatus('fetch') === 'success' && state.items.length === 0,
  },

  actions: {
    async fetch({ commit, state }, payload?: { force?: boolean }) {
      if (!payload?.force && state.loadedAt !== null) return

      await runRequest(commit, 'fetch', async () => {
        const items = await api.get<Photo[]>('/gallery')
        commit('SET_ITEMS', items)
      })
    },

    /**
     * Three steps, and the middle one bypasses our server entirely.
     *   1. ask the API where to PUT
     *   2. PUT the bytes straight to S3 with a plain fetch — using api.* here
     *      would attach our Authorization header to an Amazon URL, which S3
     *      rejects because it conflicts with the signature already in the URL
     *   3. tell the API it worked, so the row gets created
     */
    async upload({ commit }, payload: { file: File; caption?: string; altText?: string }) {
      return runRequest(commit, 'upload', async () => {
        const { file, caption = '', altText = '' } = payload

        const { key, uploadUrl } = await api.post<PresignResponse>('/gallery/presign', {
          contentType: file.type,
        })

        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!res.ok) throw new Error(`Upload to S3 failed (${res.status})`)

        const photo = await api.post<Photo>('/gallery', { key, caption, altText })
        commit('ADD_ITEM', photo)
        return photo
      })
    },

    async remove({ commit }, id: string) {
      return runRequest(commit, 'remove', async () => {
        await api.delete<void>(`/gallery/${id}`)
        commit('REMOVE_ITEM', id)
        return true
      })
    },

    /** Same pipeline, different folder. Used for the résumé PDF. */
    async uploadDocument({ commit }, file: File) {
      return runRequest(commit, 'upload', async () => {
        const { key, uploadUrl } = await api.post<PresignResponse>('/gallery/presign', {
          contentType: file.type,
          folder: 'doc',
        })

        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!res.ok) throw new Error(`Upload to S3 failed (${res.status})`)

        return key
      })
    },
  },
}

export default gallery
