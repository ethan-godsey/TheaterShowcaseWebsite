# Ellie Evens — Performer Portfolio Site

Context doc for AI chats and for future-me. 
Last updated: 2026-08-25

## What this is

A musical-theatre performer's professional portfolio site, with an
authenticated admin area so Ellie can add shows, photos, and reels herself
without touching code.

**Primary audience is casting directors and agents** — skimming on a phone,
comparing many submissions. Design and feature decisions should optimize for
"useful to a CD in 45 seconds," not for looking impressive.

**Constraints:** solo build, ~40 hours, target ship date ~2026-09-03.
Secondary goal: I'm relearning Vue for work, so I want to write the
patterns myself rather than have them generated for me.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vue 3 (`<script setup>`) + TypeScript | strict mode on |
| Build | Vite 8 | |
| State | **Vuex 4** | deliberate — NOT Pinia, see decisions |
| Routing | vue-router 5 | |
| Backend | Express + TypeScript | not started yet |
| Database | PostgreSQL | host undecided (RDS vs Neon) |
| Files | S3 | images, reel, audio clips |
| CDN / TLS | CloudFront | |
| Auth | AWS Cognito user pool | |
| Email | AWS SES | contact form → her inbox |
| Lint | oxlint + eslint + prettier | |

## Architecture

```
                        ellieevens.com  (LIVE)
                              │
                        ┌─────▼──────┐
                        │ CloudFront │
                        └─────┬──────┘
                  ┌───────────┴───────────┐
               /api/*                    /*
                  │                       │
        ┌─────────▼─────────┐   ┌─────────▼─────────┐
        │ Express on EC2    │   │ S3 (private)      │
        │ t4g.micro :3000   │   │ ellie-website     │
        │ systemd, us-east-1│   │ served via OAC    │
        └────┬─────────┬────┘   └───────────────────┘
      ┌──────▼───┐ ┌───▼────┐
      │ Postgres │ │ S3     │   media bucket
      │ metadata │ │ bytes  │   (presigned PUT from browser)
      └──────────┘ └────────┘
```

Single CloudFront distribution with two behaviors, so the browser sees one
origin and **there is no CORS in production**. `client.ts` defaults to `/api`,
which is correct in both dev (Vite proxy) and prod.

Browser → Cognito directly for login. The password never touches Express;
Express only verifies the JWT against Cognito's JWKS.

Uploads go browser → S3 directly via presigned URLs. Files never pass through
Express.

## Repo layout

```
MTShowcaseWebsite/
├── ARCHITECTURE.md          this file
├── ellie-evens/             Vue frontend
│   └── src/
│       ├── api/client.ts    fetch wrapper, ApiError, auth token holder
│       ├── types.ts         Show, Photo, ContactPayload, Session
│       ├── store/
│       │   ├── index.ts     root store + InjectionKey + typed useStore()
│       │   ├── types.ts     RootState
│       │   ├── requestState.ts   shared async status helper
│       │   └── modules/     gallery, shows, contact, auth
│       ├── components/      NavBar, Head, About, Gallery, Reel, Shows, Contact
│       └── views/HomeView.vue
└── server/                  NOT CREATED YET — Express API
```

## Data model (planned)

Postgres holds structured data and **metadata about** files. S3 holds bytes.
Rows store the **S3 key**, never a full URL — so the CDN domain can change
without rewriting every row.

```
shows              id, title, role, venue, date (DATE), production_company,
                   director, poster_key, is_featured, created_at (TIMESTAMPTZ)
photos             id, s3_key, caption, alt_text, width, height,
                   tags (TEXT[]), sort_order, created_at
media              id, kind ('reel'|'song'), title, embed_url, s3_key,
                   duration_seconds, category, sort_order
                   -- reels use embed_url (YouTube/Vimeo); song clips use s3_key
share_links        id, slug (unique, random, unguessable), label, note,
                   show_ids UUID[], photo_ids UUID[], media_ids UUID[],
                   expires_at TIMESTAMPTZ, view_count, last_viewed_at,
                   created_at
contact_messages   id, name, email, message, created_at, ip, status
profile            single row: bio, height_inches, vocal_range_low/high,
                   voice_type, headshot_key
```

`DATE` for show dates (a calendar date, no timezone); `TIMESTAMPTZ` for
"when did this happen."

## Key decisions and why

**Vuex, not Pinia.** Deliberate. Vuex is in maintenance mode and its TS story
is genuinely bad — `commit`/`dispatch` are typed `(type: string, payload?: any)`,
so typos compile fine. Accepted anyway: the mutation/action split and the
"single source of truth" model transfer to Redux/NgRx, which is the point.

**Store modules sliced by domain noun, not by page.** `shows`, `gallery`,
`contact`, `auth`. Pages get renamed and merged constantly; "a show" doesn't.
Also why gallery is one module and not separate public/admin modules.

**Per-request status, not a global `loading` flag.** Each module has a
`requests` object keyed by operation name (`'fetch'`, `'upload'`, `'save'`).
A single global flag breaks the moment two fetches overlap. Status is an enum
(`idle|loading|success|error`) rather than a boolean + error string, so
"loading AND errored" is unrepresentable.

**`runRequest()` swallows errors rather than throwing.** Returns `T | undefined`;
the error lives in state and components read it from a getter. Aborted requests
are excluded — a cancelled fetch is intentional, not a failure.

**S3 buckets stay fully private with Block Public Access on**, even for the
public site. CloudFront reaches them via OAC with a `SourceArn` condition.
S3 static website hosting stays OFF (HTTP-only, requires a public bucket).

**Login goes browser → Cognito directly**, not through Express. Password never
enters my code. Cognito self-registration must be DISABLED — it's on by
default, and the pool ID ships in the JS bundle.

**Reels are embed URLs, not hosted video.** Performer reels already live on
YouTube/Vimeo. Self-hosting video means transcoding, adaptive bitrates, and
real bandwidth cost for zero gain. The `media` table stores an `embed_url` for
reels and renders an iframe. Photos still go to S3 — images are small and the
responsive pipeline is worth having.

**Cognito Hosted UI, not a custom login form.** Roughly 2-3 hrs instead of the
~8 a custom form plus SRP handling costs, and there's no password-handling code
of mine to get wrong. Cost is no control over how the login page looks, which
for a single-user admin doesn't matter. Rejected alternative: a temporary
shared password swapped for Cognito "later" — faster, but "later" never comes
and it leaves a standing security TODO.

**Contact form uses SES, not SMTP.** AWS blocks port 25; fresh cloud IPs have
no sender reputation. Staying in the SES sandbox is fine because the only
recipient is ever Ellie. `From: noreply@domain`, `Reply-To: visitor` — putting
the visitor's address in `From` fails SPF/DKIM.

## Build order

| Day | Work |
|---|---|
| 1-2 | Shows slice end to end: store -> Express -> Postgres |
| 3 | Photos: S3 wiring + `GET /api/gallery` |
| 4-5 | Cognito Hosted UI + JWT verification in Express + protected route |
| 6 | Admin: add/edit shows, paste reel URLs — **she starts entering content** |
| 7 | Admin: photo upload via presigned URLs |
| 8-10 | Public sections, design, deploy |

Stretch, only if week two runs ahead: audition share links.

She's unblocked around day 6 rather than day 10, and everything after that she
does in parallel.

## How I want help

I'm doing this to get better at engineering, not to get working code.

- **Don't write implementation for me.** Empty files, skeletons, and TODOs are
  great. Review what I write instead of replacing it.
- **Make me guess first** on errors and on design, before giving the answer.
- **Name the failure class** when a bug shows up (off-by-one, stale closure,
  TOCTOU, N+1) — the vocabulary is the transferable part.
- Push back if I'm about to do something dumb, once, then let me decide.
