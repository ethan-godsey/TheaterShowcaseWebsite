import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

/**
 * Contact-form notifications via SES.
 *
 * EC2 has an IAM instance profile, and the
 * SDK picks those up from the instance metadata service automatically
 */

const REGION = process.env.AWS_REGION ?? 'us-east-1'
const FROM = process.env.CONTACT_FROM_EMAIL ?? 'noreply@ellieevens.com'
const TO = process.env.CONTACT_TO_EMAIL

const client = new SESv2Client({ region: REGION })

export interface ContactNotification {
  name: string
  email: string
  message: string
}

export async function sendContactNotification(
  contact: ContactNotification,
): Promise<boolean> {
  if (!TO) {
    console.warn('[email] CONTACT_TO_EMAIL not set — skipping notification')
    return false
  }

  const body = [
    `From: ${contact.name} <${contact.email}>`,
    '',
    contact.message,
    '',
    '—',
    'Sent from the contact form at ellieevens.com',
  ].join('\n')

  try {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: FROM,
        Destination: { ToAddresses: [TO] },
        /*
         * ReplyTo carries the visitor's address; From stays on own domain.
         */
        ReplyToAddresses: [contact.email],
        Content: {
          Simple: {
            Subject: { Data: `Website message from ${contact.name}` },
            Body: { Text: { Data: body } },
          },
        },
      }),
    )
    return true
  } catch (err) {
    console.error('[email] send failed:', err instanceof Error ? err.message : err)
    return false
  }
}
