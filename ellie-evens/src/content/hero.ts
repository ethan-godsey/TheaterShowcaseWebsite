/**
 * What the hero says when Ellie hasn't written her own lede or billing in the
 * admin (or the profile couldn't load). Shared by the hero itself and by the
 * admin form, which shows these as placeholders.
 */
export const HERO_DEFAULTS = {
  billing: 'Soprano · Improv · Acting',
  lede: 'Musical Theater Student studying at Illinois Wesleyan, from Lincolnwood, IL',
} as const

/** The tag that puts a gallery photo in the hero. */
export const HEADSHOT_TAG = 'headshot'
