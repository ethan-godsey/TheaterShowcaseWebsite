/** Domain shapes. These mirror the Express API's JSON contract exactly. */
import { Status } from './store/requestState'

export interface Show {
  id: string
  title: string
  role: string
  venue: string
  /** ISO 8601 date string, e.g. "2026-03-14". */
  date: string
  poster: string | null
}

export interface Photo {
  id: string
  /** S3 object key — the identity in the bucket. */
  key: string
  /** Composed by the API at read time from the CDN base. */
  url: string
  caption: string
  altText: string
  tags: string[]
  sortOrder: number
}

/** Returned by POST /gallery/presign. */
export interface PresignResponse {
  key: string
  uploadUrl: string
}

export interface ContactPayload {
  name: string
  email: string
  message: string
}

/** What we keep after a successful Cognito login. */
export interface Session {
  /** Sent to our API as `Authorization: Bearer`. */
  accessToken: string
  /** Identity claims for display only — never sent to the API. */
  idToken: string
  /** Used to mint a new access token without a fresh login. */
  refreshToken: string
  /** Epoch milliseconds. */
  expiresAt: number
  username: string
}

/** Returned by POST /gallery/presign. */
export interface PresignResponse {
  uploadUrl: string
  item: Photo
}

// invariant: shared stuff between media in db (sum type)
interface MediaBase {                     
  id: string
  title: string
  category: string | null
  durationSeconds: number | null
  sortOrder: number
}

// variant for reel. Not hosted in a bucket (too large)
export interface Reel extends MediaBase {
  kind: 'reel'                             
  embedUrl: string                         
  s3Key: null
}

// variant for a song. Hosted in a bucket, not externally (no embedUrl)
export interface Song extends MediaBase {
  kind: 'song'
  embedUrl: null
  s3Key: string                            
}

// actual sum type
export type MediaItem = Reel | Song        

/** The single profile row — bio and the stats casting scans for. */
export interface Profile {
  bio: string
  headline: string
  voiceType: string
  rangeLow: string
  rangeHigh: string
  heightInches: number | null
  headshotKey: string | null
  resumeKey: string | null
  updatedAt?: string
}
