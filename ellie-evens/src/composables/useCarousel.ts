import { ref, computed, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'

/**
 * Index state for anything that shows one item at a time.
 *
 * A composable rather than a component because the markup differs everywhere
 * it's used — the hero crossfades images, the reel swaps an iframe — while
 * the navigation logic is identical. Extract logic with a composable; extract
 * logic AND markup with a component.
 *
 * Autoplay is opt-in: pass `autoplayMs`. It's right for a photo strip and
 * wrong for video, where auto-advancing would interrupt someone watching.
 */
export function useCarousel(
  count: Ref<number>,
  options: { autoplayMs?: number } = {},
) {
  const current = ref(0)
  const hasMultiple = computed(() => count.value > 1)

  /*
   * The collection can change size after mount (the reels arrive from the
   * store), and it can shrink. Without this, deleting the last item leaves
   * `current` pointing past the end and the template renders nothing.
   */
  watch(count, (n) => {
    if (current.value >= n) current.value = 0
  })

  function next(): void {
    if (count.value > 0) current.value = (current.value + 1) % count.value
  }

  function prev(): void {
    // + count before the modulo: JS's % returns negative for negative operands,
    // so going back from 0 would otherwise land on -1.
    if (count.value > 0) current.value = (current.value - 1 + count.value) % count.value
  }

  function goTo(index: number): void {
    if (index >= 0 && index < count.value) current.value = index
  }

  /* ── Autoplay ─────────────────────────────────────────────────────── */
  let timer: ReturnType<typeof setInterval> | null = null

  function stopTimer(): void {
    if (timer !== null) clearInterval(timer)
    timer = null
  }

  /*
   * Restarting on every change — including a manual click — is the whole
   * point. A timer that keeps its original schedule will advance the slide
   * moments after someone taps a dot, which reads as broken.
   */
  function restartTimer(): void {
    stopTimer()
    if (!options.autoplayMs || !hasMultiple.value) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer = setInterval(next, options.autoplayMs)
  }

  if (options.autoplayMs) {
    watch(current, restartTimer)
    watch(hasMultiple, restartTimer)
    onMounted(restartTimer)
    // Anything started on mount is torn down on unmount, or it outlives the
    // component and keeps firing forever.
    onBeforeUnmount(stopTimer)
  }

  return { current, hasMultiple, next, prev, goTo }
}
