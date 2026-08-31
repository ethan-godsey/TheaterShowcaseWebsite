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
  /** S3 object key. Also the identity used for update/delete. */
  key: string
  url: string
  caption: string
  tags: string[]
}

export interface ContactPayload {
  name: string
  email: string
  message: string
}

export interface Session {
  token: string
  /** ISO 8601 timestamp. */
  expiresAt: string
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
