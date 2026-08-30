# Deploy checklist

Two-phase launch: **Phase 1** is the public site (no auth needed, ships first);
**Phase 2** is the admin. Companion to ARCHITECTURE.md. Last updated 2026-08-28.

## Phase 0 — hygiene (do regardless)

- [X] **Commit the working tree** — ~2 weeks of work is currently uncommitted
- [X] **Resolve the announced planted bug** in the server write routes
      (it's in a success response body; wrong in a way status codes don't show)
- [ ] **Flip `requireAuth` to fail-closed**: reject 401 unless
      `AUTH_DEV_BYPASS=true`, so dev works but early-deployed writes are locked

## Phase 1 — public launch

### Content (Ellie — critical path)
- [ ] **Real credits in the DB** — the 4 seeded shows are FICTIONAL and must
      never go live (delete seed rows, insert real ones)
- [ ] Bio (2 paragraphs, third person)
- [ ] Low end of vocal range · dance level/styles · special skills · eye color
- [ ] Résumé PDF → `ellie-evens/public/ellie-evens-resume.pdf`
- [ ] Reel link if one exists (the empty state is fine if not)
- [ ] Ellie's sign-off on the design

### Infra (Ethan)
- [X] Buy domain (first — DNS + cert validation have latency)
- [X] ACM cert **in us-east-1** (CloudFront requirement, regardless of stack region)
- [X] Site bucket: Block Public Access ON, static website hosting OFF,
      versioning on, SSE-S3
- [X] CloudFront: OAC to site bucket; bucket policy scoped to the
      distribution ARN (`AWS:SourceArn` condition)
- [X] CloudFront error responses: 403 AND 404 → `/index.html` with code 200
      (vue-router refresh breaks without this)
- [X] CloudFront: compress on; long TTL for `/assets/*`; no-cache for `index.html`
- [ ] Host Express (App Runner = low-friction) with env: `DATABASE_URL`
      (Neon **pooled** string), later `ASSET_BASE_URL`
- [ ] `/api/*` behavior on the same distribution — caching disabled, all
      methods + headers forwarded (single origin ⇒ no CORS in prod)
- [ ] `app.set('trust proxy', 1)` behind CloudFront — rate limiter keys on
      req.ip and sees only the proxy otherwise
- [ ] Tighten or remove `cors()` for prod
- [ ] `og:image` → absolute URL once domain exists (scrapers ignore relative)
- [ ] Prod smoke test: deep-link refresh, contact form end to end, on a phone

## Phase 2 — admin launch

- [ ] Cognito user pool: **self-signup DISABLED**, Ellie's user via
      `admin-create-user`, no client secret, Hosted UI
- [ ] `requireAuth` verifies JWTs for real (`aws-jwt-verify` against JWKS)
- [ ] Vuex: `media` + `auth` store modules (Ethan — learning lane)
- [ ] `/login` + `/admin` routes, lazy-loaded, router guard on `auth/isAuthenticated`
- [ ] Admin forms: shows CRUD, reel links (paste embed URL), profile editor
- [ ] Presign upload flow (POST /gallery/presign → browser PUT → confirm)
      + media bucket CORS (allow site origin, PUT/GET, expose ETag)
- [ ] SES: verify Ellie's address (sandbox is fine — she's the only recipient),
      `From:` own domain + `Reply-To:` visitor, send as side effect of the
      existing contact insert
- [ ] Curtain opening start animation (look at CodePen and Josh Comaneau)
## Not blocking anything

- Git history purge (`git filter-repo`, 43 MB of images) — only if repo goes
  public, and ask Ellie before that
- Audition share links · tagged song cuts · image-resize Lambda
  (sips derivatives hold until uploads exist)
