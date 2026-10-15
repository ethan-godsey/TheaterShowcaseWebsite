/**
 * The site's paper (background) colour, which Ellie can change from the admin.
 *
 * One picked colour drives four tokens. --paper-card, --paper-deep, and --rule
 * were hand-tuned against the original cream, so they're derived from the
 * pick with the same relationships: lightness shifted by a fixed amount,
 * saturation scaled by a ratio (a ratio, so a neutral pick gives neutral
 * cards instead of gaining a tint). Picking the original cream reproduces
 * the original palette to within rounding.
 *
 * '' means "the built-in default": every override is removed and base.css
 * applies as written.
 */

/**
 * Limits on what can be picked. The text colours are fixed, so the paper has
 * to stay pale: at 86% lightness body text and teal links still clear WCAG
 * AA (4.5:1); below it teal fails. 60% saturation keeps colours soft and
 * still admits the original cream, hsl(36, 58%, 91%).
 *
 * Keep in sync with server/src/lib/paper-color.ts, which enforces the same.
 */
export const PAPER_LIMITS = {
  minLightness: 86,
  maxLightness: 96,
  maxSaturation: 60,
} as const

export const DEFAULT_PAPER = '#f5ead9'

/** Read by the inline script in index.html before the app loads. */
export const PAPER_CACHE_KEY = 'ellie:paper:v1'

export interface Hsl {
  h: number // 0–360
  s: number // 0–100
  l: number // 0–100
}

export function hexToHsl(hex: string): Hsl {
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

export function hslToHex({ h, s, l }: Hsl): string {
  const sat = s / 100
  const light = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return (
    '#' +
    [f(0), f(8), f(4)]
      .map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0'))
      .join('')
  )
}

export function clampToLimits({ h, s, l }: Hsl): Hsl {
  return {
    h: ((h % 360) + 360) % 360,
    s: Math.max(0, Math.min(PAPER_LIMITS.maxSaturation, s)),
    l: Math.max(PAPER_LIMITS.minLightness, Math.min(PAPER_LIMITS.maxLightness, l)),
  }
}

/** Measured from the original palette: cream → card / deep / rule. */
const SHADES = {
  '--paper-card': { hueShift: +0.2, satRatio: 1.187, lightShift: +4.3 },
  '--paper-deep': { hueShift: -0.4, satRatio: 0.88, lightShift: -5.9 },
  '--rule':       { hueShift: +2.6, satRatio: 0.647, lightShift: -11.4 },
} as const

const TOKENS = ['--paper', ...Object.keys(SHADES)] as const

/** Every token value for one picked colour. */
export function paletteFor(hex: string): Record<string, string> {
  const base = hexToHsl(hex)
  const palette: Record<string, string> = { '--paper': hex }
  for (const [name, { hueShift, satRatio, lightShift }] of Object.entries(SHADES)) {
    palette[name] = hslToHex({
      h: (base.h + hueShift + 360) % 360,
      s: Math.min(100, base.s * satRatio),
      l: Math.max(0, Math.min(99, base.l + lightShift)),
    })
  }
  return palette
}

/** Recolour the page now. '' restores the defaults from base.css. */
export function applyPaper(hex: string): void {
  const root = document.documentElement
  if (hex) {
    for (const [name, value] of Object.entries(paletteFor(hex))) {
      root.style.setProperty(name, value)
    }
  } else {
    for (const name of TOKENS) root.style.removeProperty(name)
  }
  // The browser chrome on phones (address bar) follows this.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex || DEFAULT_PAPER)
}

/**
 * Remember the palette in this browser, so the next visit paints it before
 * the app (and its API call) has loaded. Stores the derived tokens, not just
 * the hex, so the inline script in index.html needs no colour maths.
 * try/catch: storage throws in some private modes and when site data is
 * blocked — the cost there is only a brief flash of cream.
 */
export function cachePaper(hex: string): void {
  try {
    if (hex) localStorage.setItem(PAPER_CACHE_KEY, JSON.stringify(paletteFor(hex)))
    else localStorage.removeItem(PAPER_CACHE_KEY)
  } catch {
    /* storage unavailable: no cache, nothing else lost */
  }
}
