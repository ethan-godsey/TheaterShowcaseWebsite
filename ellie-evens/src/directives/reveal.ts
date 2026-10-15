import type { Directive } from 'vue'

/**
 * v-reveal — scroll-triggered entrances.
 *
 * Modifiers:
 *   v-reveal            fade + rise
 *   v-reveal.mask       text rises out from behind a clipping edge (headings)
 *   v-reveal.wipe       clip-path wipe upward (images, plates)
 *   v-reveal.stagger    direct children animate in sequence
 *
 * Value (optional): { delay } in ms, applied to the whole element.
 *
 * Bails out completely under prefers-reduced-motion — the element is simply
 * visible, which is the correct fallback rather than a degraded animation.
 */

interface RevealEl extends HTMLElement {
  _revealObserver?: IntersectionObserver
  _revealFallback?: ReturnType<typeof setTimeout>
}

const STAGGER_STEP_MS = 70

/* The wipe hides content until the observer fires, so anything that stops it
   firing hides real content for good. After this long, reveal regardless and
   lose the animation — a missing entrance beats a missing headshot. */
const FAILSAFE_MS = 3000

export const reveal: Directive<RevealEl, { delay?: number } | undefined> = {
  mounted(el, binding) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-revealed')
      return
    }

    const { mask, wipe, stagger } = binding.modifiers

    if (mask) {
      // Wrap the existing children in a block span so the parent can clip it
      // while the span slides up from underneath.
      const inner = document.createElement('span')
      inner.className = 'reveal-mask__inner'
      while (el.firstChild) inner.appendChild(el.firstChild)
      el.appendChild(inner)
      el.classList.add('reveal-mask')
    } else if (wipe) {
      el.classList.add('reveal-wipe')
    } else if (stagger) {
      el.classList.add('reveal-stagger')
    } else {
      el.classList.add('reveal')
    }

    if (stagger) {
      const children = Array.from(el.children)
      // A 25-cell gallery at the full step would take 1.75s to finish. Tighten
      // the interval for long lists so the sequence stays snappy either way.
      const step = children.length > 12 ? STAGGER_STEP_MS / 2 : STAGGER_STEP_MS
      children.forEach((child, i) => {
        ;(child as HTMLElement).style.setProperty('--i', String(i))
      })
      el.style.setProperty('--stagger-step', `${step}ms`)
    }

    const delay = binding.value?.delay
    if (delay) el.style.transitionDelay = `${delay}ms`

    const done = () => {
      el.classList.add('is-revealed')
      observer.disconnect()
      if (el._revealFallback) clearTimeout(el._revealFallback)
      el._revealFallback = undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          done() // fire once
        }
      },
      // Threshold 0 matters as much as 0.08: a zero-area element has ratio 0
      // and would never cross an 8% threshold, so it would stay clipped
      // forever — invisible for a reason that has nothing to do with scroll.
      { rootMargin: '0px 0px -10% 0px', threshold: [0, 0.08] },
    )

    observer.observe(el)
    el._revealObserver = observer
    el._revealFallback = setTimeout(done, FAILSAFE_MS)
  },

  unmounted(el) {
    el._revealObserver?.disconnect()
    delete el._revealObserver
    if (el._revealFallback) clearTimeout(el._revealFallback)
    delete el._revealFallback
  },
}
