import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

/**
 * Contact-form notifications via SES.
 *
 * No credentials in code or env: the EC2 has an IAM instance profile, and the
 * SDK picks those up from the instance metadata service automatically. That's
 * the whole reason to run on EC2 with a role rather than storing an access key.
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

/**
 * Fire-and-report. Never throws.
 *
 * The message is already committed to contact_messages before this runs, so a
 * send failure must not fail the request — the visitor did nothing wrong and
 * the message isn't lost. This is exactly why the table exists: email delivery
 * is a notification, the row is the record.
 */
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
         * ReplyTo carries the visitor's address; From stays on our own domain.
         * Putting the visitor in From would fail SPF/DKIM — we can't
         * authenticate mail as a domain we don't own — and land in spam or be
         * rejected outright. Reply-To gets the behaviour you actually wanted:
         * hit reply, it goes to them.
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
