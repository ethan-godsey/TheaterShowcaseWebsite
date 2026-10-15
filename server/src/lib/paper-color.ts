/**
 * The admin can recolour the site's paper (background). The picker only
 * offers colours inside these limits, but the server checks again: the
 * picker runs in a browser, and anything a browser sends can be edited.
 *
 * Why these limits: the text colours are fixed, so the background has to
 * stay pale enough for them. At 86% lightness body text (--ink-soft) and
 * links (--teal) still clear the 4.5:1 WCAG AA contrast minimum; below it,
 * teal fails. The 60% saturation cap keeps colours soft, and still admits
 * the original cream, hsl(36, 58%, 91%).
 *
 * Keep in sync with ellie-evens/src/theme/paper.ts.
 */
export const PAPER_LIMITS = {
  minLightness: 86,
  maxLightness: 96,
  maxSaturation: 60,
} as const

const HEX = /^#[0-9a-f]{6}$/i

/** HSL in degrees / percent. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number, number, number,
  ]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60
  if (h < 0) h += 360
  return { h, s: s * 100, l: l * 100 }
}

/**
 * '' (reset to the default cream) or a #rrggbb inside the limits. Half a
 * percent of slack each way, because the picker works in HSL, the value is
 * stored as hex, and rounding to whole RGB channels moves it slightly.
 */
export function isAllowedPaperColor(value: unknown): value is string {
  if (value === '') return true
  if (typeof value !== 'string' || !HEX.test(value)) return false
  const { s, l } = hexToHsl(value)
  return (
    l >= PAPER_LIMITS.minLightness - 0.5 &&
    l <= PAPER_LIMITS.maxLightness + 0.5 &&
    s <= PAPER_LIMITS.maxSaturation + 0.5
  )
}
