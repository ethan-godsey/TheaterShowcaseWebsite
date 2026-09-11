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

  // reset after end of carousel
  watch(count, (n) => {
    if (current.value >= n) current.value = 0
  })

  function next(): void {
    if (count.value > 0) current.value = (current.value + 1) % count.value
  }

  function prev(): void {
    // wrapper ensures no negative indexing
    if (count.value > 0) current.value = (current.value - 1 + count.value) % count.value
  }

  function goTo(index: number): void {
    if (index >= 0 && index < count.value) current.value = index
  }

  // autoplay timer: AI
  let timer: ReturnType<typeof setInterval> | null = null

  function stopTimer(): void {
    if (timer !== null) clearInterval(timer)
    timer = null
  }

  // restart on action
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
    
    // stop when component dies
    onBeforeUnmount(stopTimer)
  }

  return { current, hasMultiple, next, prev, goTo }
}
