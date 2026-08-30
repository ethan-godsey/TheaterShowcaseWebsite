/** Domain shapes. These mirror the Express API's JSON contract exactly. */

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
