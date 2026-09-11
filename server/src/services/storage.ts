import { randomUUID } from 'node:crypto'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Presigned uploads to the media bucket.
 *
 * The browser PUTs the file DIRECTLY to S3 — bytes never pass through this
 * server. Two reasons: a t4g.micro would choke proxying multi-megabyte
 * uploads, and Express request-body limits would have to grow to match the
 * largest file anyone might send.
 *
 * Credentials come from the EC2 instance profile; nothing is stored here.
 */

const BUCKET = process.env.MEDIA_BUCKET ?? 'ellie-gallery-pics'
const REGION = process.env.MEDIA_BUCKET_REGION ?? 'us-east-2'
const URL_TTL_SECONDS = 300

const client = new S3Client({ region: REGION })

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
}

export function isAllowedType(contentType: string): boolean {
  return contentType in EXTENSIONS
}

/**
 * A random key, not the original filename to avoid injection and bugs
 */
export function buildKey(contentType: string, folder = 'gallery'): string {
  const ext = EXTENSIONS[contentType] ?? 'bin'
  return `media/${folder}/${randomUUID()}.${ext}`
}

export async function createUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: URL_TTL_SECONDS },
  )
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
