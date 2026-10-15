import { watch, onBeforeUnmount, type Ref } from 'vue'
import Sortable from 'sortablejs'

/**
 * Drag-to-reorder for a v-for list, via SortableJS (mouse AND touch; native
 * HTML5 drag-and-drop doesn't fire on most phones).
 *
 * The subtle part is who owns the DOM. Sortable moves nodes itself, but Vue
 * owns this DOM: if both move the same element, Vue's idea of the list and
 * the real list disagree and the next re-render scrambles it. So on drop we
 * put Sortable's move back and report the indices; the caller changes the
 * DATA, and Vue re-renders from that.
 *
 * Dragging is disabled until onMove settles, so a second drag can't start
 * while the first is still saving.
 */
export function useSortable(
  el: Readonly<Ref<HTMLElement | null>>,
  onMove: (oldIndex: number, newIndex: number) => Promise<unknown> | void,
  options: Sortable.Options = {},
): void {
  let sortable: Sortable | null = null

  async function onEnd(evt: Sortable.SortableEvent): Promise<void> {
    const { oldIndex, newIndex, item, from } = evt
    if (oldIndex == null || newIndex == null || oldIndex === newIndex) return

    // After removing the node, whatever now sits at oldIndex is the sibling
    // it originally came before.
    from.removeChild(item)
    from.insertBefore(item, from.children[oldIndex] ?? null)

    sortable?.option('disabled', true)
    try {
      await onMove(oldIndex, newIndex)
    } finally {
      sortable?.option('disabled', false)
    }
  }

  // The list is usually behind a v-if (it doesn't exist until data arrives,
  // and is replaced if it empties and refills). Watching the element covers
  // both, where onMounted alone would run before the list exists.
  watch(el, (node) => {
    sortable?.destroy()
    sortable = node ? Sortable.create(node, { animation: 150, ...options, onEnd }) : null
  })

  onBeforeUnmount(() => {
    sortable?.destroy()
    sortable = null
  })
}

/** Move one id within a list, returning a new array. */
export function moveId(ids: string[], from: number, to: number): string[] {
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved!)
  return next
}
