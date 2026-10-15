import type { ActionContext } from 'vuex'
import { api } from '@/api/client'
import { runRequest } from './requestState'

/**
 * Optimistic reorder shared by every module whose list the admin can drag.
 * The module must have an `items` array, a REPLACE_ITEMS mutation, a 'reorder'
 * request slot, and a `fetch` action that accepts { force: true }.
 *
 * The new order shows immediately, then is saved. On failure the old order is
 * put back AND the list is re-fetched — if the request actually succeeded but
 * the response was lost, the snapshot is the stale one, and only the server
 * knows which order really stuck.
 *
 * Resolves true on success, false on failure; the message is in
 * requestError('reorder').
 */
export async function reorderItems<T extends { id: string }, R>(
  { commit, dispatch, state }: ActionContext<{ items: T[] }, R>,
  path: string,
  ids: string[],
): Promise<boolean> {
  const snapshot = state.items
  const byId = new Map(snapshot.map((item) => [item.id, item]))
  commit(
    'REPLACE_ITEMS',
    ids.map((id) => byId.get(id)).filter((item): item is T => !!item),
  )

  const ok = await runRequest(commit, 'reorder', async () => {
    await api.put<void>(path, { ids })
    return true
  })

  if (!ok) {
    commit('REPLACE_ITEMS', snapshot)
    await dispatch('fetch', { force: true })
    return false
  }
  return true
}
