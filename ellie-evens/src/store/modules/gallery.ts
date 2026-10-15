import type { Module } from 'vuex'
import { api } from '@/api/client'
import type { Photo, PresignResponse } from '@/types'
import { HEADSHOT_TAG } from '@/content/hero'
import type { RootState } from '../types'
import {
  createRequests,
  requestMutations,
  requestGetters,
  runRequest,
  type Requests,
} from '../requestState'
import { reorderItems } from '../reorder'

/** Photos, backed by S3. Rows carry the key; the API composes the URL. */
export interface GalleryState {
  items: Photo[]
  loadedAt: number | null
  requests: Requests<'fetch' | 'upload' | 'remove' | 'reorder' | 'headshot'>
}

const gallery: Module<GalleryState, RootState> = {
  namespaced: true,

  state: () => ({
    items: [],
    loadedAt: null,
    requests: createRequests('fetch', 'upload', 'remove', 'reorder', 'headshot'),
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

    /** Replace the list wholesale without touching loadedAt — used for the
     *  optimistic reorder and for rolling it back. */
    REPLACE_ITEMS(state, items: Photo[]) {
      state.items = items
    },

    REPLACE_ITEM(state, photo: Photo) {
      state.items = state.items.map((p) => (p.id === photo.id ? photo : p))
    },
  },

  getters: {
    ...requestGetters,

    isEmpty: (state, getters) =>
      getters.requestStatus('fetch') === 'success' && state.items.length === 0,

    /** Photos marked for the hero, in gallery order. */
    headshots: (state): Photo[] =>
      state.items.filter((p) => p.tags?.includes(HEADSHOT_TAG)),
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

    /** Save a new order. See store/reorder.ts. */
    reorder(ctx, ids: string[]): Promise<boolean> {
      return reorderItems(ctx, '/gallery/order', ids)
    },

    /** Mark or unmark a photo as a hero headshot. Resolves true on success. */
    async setHeadshot({ commit }, payload: { id: string; headshot: boolean }) {
      return runRequest(commit, 'headshot', async () => {
        const photo = await api.put<Photo>(`/gallery/${payload.id}/headshot`, {
          headshot: payload.headshot,
        })
        commit('REPLACE_ITEM', photo)
        return true
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
