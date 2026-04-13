- **Coding rules**
- Keep diffs minimal.
- Do not overengineer.
- Prefer the simplest working change.
- Reuse existing code, patterns, and components before adding new code.
- Match existing naming, structure, and style.
- Add code only when required.

- **File modification rules**
- Only touch files relevant to the task.
- Do not rewrite entire files unless necessary.
- Modify the smallest possible surface area.
- Do not move, rename, or delete files unless required.
- Do not change unrelated behavior.

- **Workflow rules**
- Read the relevant code before editing.
- Start every task from the local `dev` branch.
- Always create and use a separate `git worktree` for the task.
- For feature implementation or refactoring, create a new branch from `dev` in that worktree and leave a commit for the work.
- Make the change directly; avoid speculative refactors.
- Keep public behavior stable unless the task requires a change.
- Verify dependencies and existing helpers before creating new ones.
- Stop and reassess if the change starts spreading beyond the task scope.

- Always follow this order:
  1. Read relevant code
  2. Identify minimal change
  3. Apply change
  4. Run tests or validation
  5. Verify no unrelated impact

- **Testing rules**
- Run the relevant tests before finishing.
- If no targeted tests exist, run the smallest meaningful validation available.
- Do not finish with failing tests.
- Report any unrun or blocked tests explicitly.

- **Hard constraints (MUST NOT)**
- NEVER rewrite large parts of files
- NEVER introduce new abstractions without clear necessity
- NEVER change project structure
- NEVER modify types/interfaces unless required
- NEVER add new dependencies without necessity

- **Debug rules**
- Reproduce the issue first
- Identify the root cause
- Fix the cause, not the symptom
- Do not apply blind fixes

- **UI rules (Next.js)**
- Ensure all interactive elements in Next.js client components remain clickable on mobile by avoiding overlay blocking, improper z-index stacking, and scroll/touch conflicts, while using semantic elements and responsive layouts.
- Do not break existing layout
- Preserve clickability on mobile
- Avoid overlay blocking (z-index, pointer-events)
- Prevent scroll/touch conflicts
- Use semantic elements
- Keep responsive behavior intact
- Do not modify layout/spacing unless required


# Repository Service Analysis

> Last reviewed: 2026-04-09
> This summary is based on a repo-wide pass over the current source files, App Router routes, `lib` layer, admin feature code, Supabase migrations, CSS Modules, SVG assets, and the lockfile. Treat this document as a code-first service map. If README and code disagree, trust the code and migrations first.

## 1. Service Identity

- Service name: `앵클`
- Core concept: Seoul Han-river basketball social match platform
- Real product shape in this repo:
  - Public users browse open matches by date
  - Users sign in with Kakao through Supabase Auth
  - Match applications are cash-backed, not simple RSVP records
  - Users can charge cash through TossPayments
  - Users can view profile, application history, and cash ledger in My Page
  - Admins operate venues, matches, and cash ledgers from `/admin`

### One-line understanding

This is not just a landing page or a mock marketplace. It is already structured as a small but real operations system with:

- public discovery UI
- authenticated application flow
- cash debit/refund ledger
- payment order creation + server-side payment confirmation
- admin CRUD + manual cash adjustment tools


## 2. Tech Stack And Runtime Assumptions

### Framework and libraries

- Next.js App Router
- React 19
- TypeScript
- Supabase SSR + Supabase Auth + Postgres
- CSS Modules
- TossPayments browser SDK + Toss server confirm API

### Versions pinned by the current lockfile

- `next`: `16.2.2`
- `react`: `19.2.4`
- `react-dom`: `19.2.4`
- `@supabase/supabase-js`: `2.101.1`
- `@supabase/ssr`: `0.10.0`
- `typescript`: `5.9.3`

### Environment variables actually used

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - fallback only when `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is absent
- `SUPABASE_SERVICE_ROLE_KEY`
  - needed for cash approval and admin cash adjustment flows
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`
- `TOSS_SECRET_KEY`

### Runtime clients

There are three distinct Supabase client modes in this repo:

1. Browser client
   - file: `src/lib/supabase/client.ts`
   - used by login status sync, nav menus, and client-side auth/profile refresh
2. Server client with request cookies
   - file: `src/lib/supabase/server.ts`
   - used by authenticated pages and normal server routes
3. Service-role client
   - file: `src/lib/supabase/server.ts`
   - used only for privileged cash operations such as charge approval and admin balance adjustment

### Important dev/build assumptions

- `next.config.ts` allows dev origin `192.168.219.100`
- `next-env.d.ts` is generated scaffolding and should not be edited
- `proxy.ts` is used instead of classic `middleware.ts`

## 3. What Is Actually Implemented Right Now

### Public user-facing surface

- Home page with 14-day date browser
- Match detail page
- Login page
- Match apply page
- Cash charge page
- Cash charge success/fail result pages
- My Page

### Admin surface

- Admin dashboard
- Admin venue list/create/edit
- Admin match list/create/edit
- Admin cash dashboard

### Real backend-backed behavior

- Public match reads from Supabase when configured
- Fallback to mock match data when Supabase is not configured
- Kakao OAuth sign-in through Supabase
- Cash-backed application creation
- Cash-backed application cancellation with refund policy
- Admin-triggered application cancellation with full refund
- Toss cash charge order creation
- Toss charge confirmation through server-side verify + DB approval
- Cash ledger and charge-order event inspection for admins
- Manual admin cash adjustment

### UI-only or placeholder behavior

These exist visually but are not fully implemented end-to-end:

- Search boxes in header/detail/mypage
- Most home filter chips except `hideClosed`
- Home quick menu, notice bar, floating CTA components
  - components exist but are not currently mounted in `HomePage`
- Interest/wishlist save
  - match detail and home like state is local component state only
- Coupons
- FAQ
- Notices
- Profile edit
- Settings
- Manner/level profile metrics
- Real analytics for likes/views
  - detail page likes/views are synthetic view-model values, not DB-backed counters
- Webhook-driven payment reconciliation
  - webhook events are stored, but they do not finalize cash balances

## 4. High-Level Architecture

The repo is organized around a clean split between route entrypoints, domain/infra logic, UI view-model mapping, and admin-specific feature code.

### `src/app`

Owns route entrypoints and server component composition.

- Public pages fetch data and pass already-shaped view models into components
- Auth-sensitive pages gate access and redirect
- API routes mostly delegate business rules to SQL RPCs or `lib/payments`

### `src/lib`

This is the real service core.

- `matches-data.ts`
  - decides between real Supabase data and mock data
- `match-store.ts`
  - loads match entities from DB
- `venue-store.ts`
  - loads venue entities from DB
- `mypage.ts`
  - composes profile, applications, cash balance, and cash transactions
- `cash.ts`
  - cash account / transaction / charge order query layer
- `supabase/*`
  - env, auth, clients, schema checks, proxy session sync
- `payments/*`
  - Toss order helpers and server confirm helpers

### `src/components`

Owns page UI and lightweight client interactivity.

- `home/*`
  - date picker, filter chips, match list, hero
- `match/*`
  - detail sections, image carousel, apply page, sticky apply bar, toast
- `mypage/*`
  - profile and ledger display
- `cash/*`
  - charge flow UI and result screens
- `navigation/*`
  - app links with transition overlay and auth-aware nav

### `src/features/admin`

Owns admin-only view models, forms, server actions, and admin data adapters.

- `actions.ts`
  - main write path for venue/match creation and updates
- `data.ts`
  - reads admin data from Supabase or mock fallback
- `view-model.ts`
  - turns raw entities into admin table/form/dashboard rows

### `supabase/migrations`

This is the final source of truth for the data model and the hardest business rules.

If an agent needs to understand what the service really guarantees, start here before editing UI.

## 5. Route Map And Access Control

### Public pages

| Route | Auth | Purpose |
| --- | --- | --- |
| `/` | public | date-based match browsing |
| `/login` | public | Kakao login entry / signed-in status view |
| `/match/[slug]` | public | match detail |

### Auth-required user pages

| Route | Auth | Purpose |
| --- | --- | --- |
| `/match/[slug]/apply` | signed-in user | final application confirmation page |
| `/cash/charge` | signed-in user | Toss charge entry |
| `/cash/charge/success` | signed-in user | server-confirm result page |
| `/cash/charge/fail` | signed-in user | payment failure result page |
| `/mypage` | signed-in user | profile + applications + cash history |

### Admin pages

| Route | Auth | Purpose |
| --- | --- | --- |
| `/admin` | admin only | dashboard |
| `/admin/matches` | admin only | match list |
| `/admin/matches/new` | admin only | create new match |
| `/admin/matches/[id]/edit` | admin only | edit match |
| `/admin/venues` | admin only | venue list |
| `/admin/venues/new` | admin only | create venue |
| `/admin/venues/[id]/edit` | admin only | edit venue |
| `/admin/cash` | admin only | cash/account/order/event dashboard |

### Auth callback and sign-out routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/auth/callback` | `GET` | exchanges Supabase OAuth code for session |
| `/auth/signout` | `POST` | signs out and redirects home |

### API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/matches/[matchId]/applications` | `POST` | apply to match |
| `/api/matches/[matchId]/applications/me` | `DELETE` | cancel own application |
| `/api/cash/charge-orders` | `POST` | create charge order before opening Toss |
| `/api/payments/toss/confirm` | `POST` | verify Toss payment and approve charge order |
| `/api/payments/toss/fail` | `POST` | store payment failure on pending order |
| `/api/payments/toss/webhook` | `POST` | store payment events for ops visibility |

### Where auth is enforced

There are two layers of auth gating.

#### Layer 1: `proxy.ts`

`proxy.ts` protects:

- `/admin/:path*`
- `/mypage`
- `/match/[slug]/apply`
- application POST/DELETE APIs

It syncs Supabase session cookies and:

- redirects admin pages to login when not signed in
- redirects admin pages to login with `supabase_not_configured` when Supabase env is absent

#### Layer 2: per-route server checks

Many pages still perform their own server-side checks:

- `/mypage`
- `/match/[slug]/apply`
- `/cash/charge`
- `/cash/charge/success`
- `/cash/charge/fail`
- `/admin/layout.tsx`

Important nuance:

- `proxy.ts` does **not** protect `/cash/charge*`
- those routes rely on direct server redirects inside their page components

### Admin role source

- Role is stored in `profiles.role`
- values: `user`, `admin`
- admin routes call `getServerAuthState()`
- admin layout redirects non-admins to `/`

## 6. Public Browsing Flow

### Home page

Route file:

- `src/app/(home)/page.tsx`

Behavior:

- fetches `getPublicMatches()`
- converts them through `buildHomeMatchRows()`
- generates 14 date chips via `getDisplayDates()`
- revalidates every 60 seconds

Actual filtering behavior:

- only date selection is real
- only `hideClosed` changes the visible rows
- `region`, `gender`, `level`, `shade` chips are UI-only placeholders

Important UX notes:

- horizontal date/filter scrollers explicitly use `touch-action: pan-x`
- this is deliberate mobile scroll/click conflict prevention
- route transition overlay has `pointer-events: none`
- sticky headers and sticky/fixed bottom CTAs are layered to avoid mobile tap blocking

### Public match data source

`src/lib/matches-data.ts` decides the source:

- if Supabase is configured:
  - read from DB using `listPublicMatchEntities()` / `getPublicMatchEntityBySlug()`
- if not configured or read fails:
  - fall back to mock data from `src/lib/matches.ts`

`src/lib/match-store.ts` public reads only:

- future matches
- status in `open`, `closed`

So:

- `draft` and `cancelled` matches are hidden from the public site
- started matches are excluded because query requires `start_at >= now()`

### Public match cards

Each home card is a simplified view model:

- time
- status
- venue/title/meta
- lightweight badges such as `입문 환영` or `가벼운 참가비`

`isNew` is not real publishing metadata. It is derived from:

- match still applicable
- `status.kind === "open"`
- `currentParticipants <= 3`

## 7. Match Detail Flow

### Route and rendering

Route file:

- `src/app/match/[slug]/page.tsx`

Behavior:

- loads the public match by slug
- returns `notFound()` when missing
- revalidates every 60 seconds
- metadata is generated from match title/date/venue/price

### Detail view composition

`MatchDetail` renders:

- sticky header
- hero image area
- info section
- level distribution section
- court/facility section
- rules/how-it-works section
- safety section
- refund section
- sticky desktop sidebar
- mobile sticky apply bar

### What is real vs synthetic on the detail page

Real from match data:

- title
- date/time
- venue name/address
- rules
- safety notes
- price
- can-apply state

Synthetic in `match-detail-view-model.ts`:

- likes
- views
- some notice copy
- some facility inference
- some level hint copy
- how-to text

Facilities are inferred from strings such as parking or shower/locker descriptions, not from normalized DB booleans.

### Detail interactions

Real:

- copy page link
- copy address
- open map URL
- go to apply page

Local-only:

- save/unsave interest match

## 8. Login Flow

### Login page behavior

Route file:

- `src/app/login/page.tsx`

Client page:

- `src/components/login/login-page.tsx`

Behavior:

- reads `error` and `next` query params
- normalizes `next` with `normalizeNextPath()`
- if already signed in, shows current account and a sign-out button
- if signed out, opens Supabase OAuth with provider `kakao`

### Redirect behavior

- callback target is `/auth/callback`
- non-root target paths are forwarded through `next`
- final redirect after OAuth goes back to the original internal path

### Error handling

Server-side errors supported in the login UI:

- `callback_code_missing`
- `oauth_failed`
- `supabase_not_configured`

## 9. Match Application Flow

### Apply page route

Route file:

- `src/app/match/[slug]/apply/page.tsx`

Behavior:

- loads match and server user state in parallel
- redirects to login if missing auth or missing Supabase config
- loads current confirmed application and cash balance
- passes `alreadyApplied`, `canApply`, and `cashBalanceLabel` to the client page

### Apply page UI behavior

Client file:

- `src/components/match/match-apply-page.tsx`

Rules enforced in UI:

- three checkboxes must all be checked before submit
- if already applied, page immediately shows completed state
- if match cannot apply, submit stays blocked

### Submit behavior

On confirm:

1. client calls `POST /api/matches/[matchId]/applications`
2. if `401`, redirect to login
3. if `INSUFFICIENT_CASH`, redirect to `/cash/charge?next=...`
4. if success or `ALREADY_APPLIED`, show completed state and refresh route

### Server application endpoint

Route file:

- `src/app/api/matches/[matchId]/applications/route.ts`

Behavior:

- requires Supabase
- requires signed-in user
- verifies cash schema migration is present
- delegates the real business logic to SQL RPC `apply_to_match`
- maps SQL exception strings into stable HTTP codes

### Important business rule

Applications are **cash debits first-class**, not separate from payment.

Applying to a match:

- checks auth
- locks the match row
- validates match state, start time, and capacity
- checks duplicate confirmed application
- checks user cash balance
- debits cash account
- writes a cash transaction
- writes the application row using that debit as source context

## 10. Cash Charge Flow

### Entry page

Route file:

- `src/app/cash/charge/page.tsx`

Behavior:

- signed-in only
- requires Supabase and Toss charge operations schema
- loads cash balance
- loads recent charge orders
- forwards `next` path if provided

### Charge page client behavior

Client file:

- `src/components/cash/cash-charge-page.tsx`

Behavior:

- fixed packages only: `5000`, `10000`, `30000`
- creates a charge order via `/api/cash/charge-orders`
- lazily loads TossPayments SDK from `https://js.tosspayments.com/v2/standard`
- calls `requestPayment()` with success/fail URLs

### Success page behavior

Route file:

- `src/app/cash/charge/success/page.tsx`

Client file:

- `src/components/cash/cash-charge-success-page.tsx`

Behavior:

- reads `amount`, `orderId`, `paymentKey`, and optional `next`
- immediately POSTs to `/api/payments/toss/confirm`
- only after server confirm succeeds does the UI show “cash credited”

This is important:

- arriving on the success page does **not** mean the ledger is already updated
- the browser still asks the server to confirm and approve the charge order

### Confirm route behavior

Route file:

- `src/app/api/payments/toss/confirm/route.ts`

This is the most important payment route in the repo.

It does all of the following:

- requires normal signed-in user
- validates request payload shape
- checks charge-order schema migration
- uses service-role client for privileged DB reads/writes
- loads the charge order by `order_id`
- verifies order exists and belongs to the current user
- verifies amount matches the stored order amount
- handles idempotent already-paid case
- refuses non-`pending` orders
- calls Toss server confirm API
- validates returned `status`, `orderId`, `paymentKey`, and `totalAmount`
- calls SQL RPC `approve_cash_charge_order`
- clears previous failure fields after successful approval

### Failure page behavior

Route file:

- `src/app/cash/charge/fail/page.tsx`

Client file:

- `src/components/cash/cash-charge-fail-page.tsx`

Behavior:

- shows user-facing payment failure details
- asynchronously POSTs to `/api/payments/toss/fail`
- failure logging is best-effort and intentionally does not block rendering

### Webhook behavior

Route file:

- `src/app/api/payments/toss/webhook/route.ts`

Current implementation:

- stores incoming payment events in `cash_charge_order_events`
- deduplicates by provider transmission ID
- marks lightweight processed results such as:
  - `logged`
  - `order_not_found`
  - `ignored:done_unverified`

Important limitation:

- webhook events do **not** approve cash
- actual charge approval currently happens through the success-page confirm route

So if an agent is implementing payment hardening, this is a major future improvement area.

## 11. My Page Flow

### Route behavior

Route file:

- `src/app/mypage/page.tsx`

Behavior:

- signed-in only
- redirects unauthenticated users to `/login?next=/mypage`
- calls `getMyPageData()`

### What My Page actually shows

Real data:

- profile display name / avatar / provider / role
- current cash balance
- recent cash transactions
- application history

Placeholder sections:

- coupons
- wishlist
- profile edit
- settings
- FAQ
- notices
- manner
- level

### Data assembly

`src/lib/mypage.ts` joins:

- `profiles`
- `match_applications` joined to `matches`
- `cash_accounts`
- `cash_transactions`

Application cards show:

- status (`confirmed`, `cancelled_by_user`, `cancelled_by_admin`)
- match title and venue
- applied date and schedule summary
- cash debit / refund summary

Cash transaction cards show:

- delta amount
- resulting balance
- memo or derived title
- compact date

## 12. Admin Console Flow

### Admin shell

Main layout component:

- `src/features/admin/components/admin-shell.tsx`

Provides:

- sidebar navigation
- page title/actions frame
- shared sign-out

### Admin dashboard

Route:

- `/admin`

Shows:

- number of open matches
- number of drafts
- number near closing
- projected revenue based on current participant count

### Venue management

Routes:

- `/admin/venues`
- `/admin/venues/new`
- `/admin/venues/[id]/edit`

Purpose:

- maintain reusable venue templates
- store default image URLs, rules, and safety notes
- mark venues active/inactive for future match creation

### Match management

Routes:

- `/admin/matches`
- `/admin/matches/new`
- `/admin/matches/[id]/edit`

Important behavior split:

#### Create mode

- simpler form
- hides many fields behind hidden inputs
- intent is either:
  - `save_draft`
  - `publish_now`
- status is derived from intent, not directly entered

#### Edit mode

- richer form
- exposes status, summary, public notice, operator note, venue snapshot fields, image URLs, rules, safety notes
- shows participant summary read-only

### Venue reuse vs creation

When saving a match in `actions.ts`:

- if `venueEntryMode === "managed"` and venue ID exists:
  - reuse selected venue
- otherwise:
  - look up existing venue by exact address
  - reuse if found
  - create a new venue if missing

This means manual match entry can still backfill the managed venue table.

### Match editing constraints

- match capacity cannot be lowered below current confirmed participant count
- when status becomes `cancelled`, server action calls `cancel_match_applications_by_admin`

### Venue snapshot behavior

Matches store both:

- `venue_id`
- duplicated snapshot fields such as `venue_name`, `district`, `address`, `directions`, `parking`, `smoking`, `shower_locker`

Meaning:

- editing a venue does not automatically rewrite old matches
- each match keeps its own venue snapshot

This is explicitly reflected in admin copy and in the schema.

### Admin cash console

Route:

- `/admin/cash`

Shows:

- overview cards
- manual adjustment form
- recent cash transactions
- recent charge orders
- recent payment events
- current user balances

Manual adjustment uses:

- service-role RPC `adjust_cash_balance_by_admin`

## 13. Database Model And Business Rules

This is the most important section for any agent changing behavior.

### `profiles`

Purpose:

- per-user profile record keyed by `auth.users.id`
- stores `role`, `display_name`, `avatar_url`

Important behavior:

- trigger `handle_new_user()` auto-creates/updates profile after auth signup
- later migration extends the same trigger to also create a cash account

### `venues`

Purpose:

- canonical venue registry for admins

Stores:

- slug
- name
- district
- address
- directions
- parking
- smoking
- shower_locker
- `default_image_urls`
- `default_rules`
- `default_safety_notes`
- `is_active`

### `matches`

Purpose:

- individual match sessions

Stores:

- `venue_id`
- slug
- title / summary / public_notice / operator_note
- status: `draft`, `open`, `closed`, `cancelled`
- format: `3vs3`, `5vs5`
- start/end
- capacity
- price
- gender / level / preparation
- tags / image URLs / rules / safety notes
- view_count / like_count
- venue snapshot columns copied from venue

### `match_applications`

Purpose:

- per-user application state

Stores:

- user ID
- match ID
- status: `confirmed`, `cancelled_by_user`, `cancelled_by_admin`
- cancel_reason
- applied/cancelled timestamps
- `price_snapshot`
- debit/refund transaction linkage
- `refunded_amount`

Important nuance:

- seed data inserts application rows with `user_id = null`
- those rows only exist to simulate participant counts
- real user applications use authenticated user IDs

### `match_application_counts` view

Purpose:

- materialized-on-read count of confirmed applications per match

Used by:

- public match list/detail
- admin lists
- capacity validation

### `cash_accounts`

Purpose:

- one balance row per user

Rule:

- balance cannot go negative

### `cash_transactions`

Purpose:

- immutable-ish ledger rows describing balance changes

Current `type` values:

- `charge`
- `charge_refund`
- `match_debit`
- `match_refund`
- `adjustment`

Current `source_type` values:

- `charge_order`
- `match_application`
- `admin_adjustment`

### `cash_charge_orders`

Purpose:

- payment intent / payment attempt ledger before and after Toss confirm

Current status values:

- `pending`
- `paid`
- `failed`
- `cancelled`
- `expired`

Stores:

- user ID
- external order ID
- amount
- Toss payment key
- approved/failure/refund/cancel metadata
- provider snapshot
- last error fields for retries and ops visibility

### `cash_charge_order_events`

Purpose:

- webhook/event log for payment operations

Stores:

- optional charge order relation
- order ID
- provider event ID
- event type
- raw payload
- processed result
- processed time

## 14. SQL RPCs To Know

### `is_admin()`

- checks whether current `auth.uid()` has `profiles.role = 'admin'`

### `close_started_matches()`

- changes started `open` matches to `closed`

### `apply_to_match(uuid)`

Current version is cash-backed.

It:

- requires auth
- locks the match row
- auto-closes started open matches before failing with `MATCH_STARTED`
- rejects non-open matches
- rejects duplicates
- rejects full matches
- ensures cash account exists
- rejects insufficient cash
- debits cash
- inserts cash transaction
- inserts application
- returns JSON with application ID, debited amount, remaining cash

### `cancel_match_application(uuid)`

It:

- requires auth
- locks the active application and related match
- computes refund with `get_match_refund_amount`
- credits cash if refund > 0
- writes refund transaction
- marks application `cancelled_by_user`
- stores refund metadata

### `cancel_match_applications_by_admin(uuid, text)`

It:

- requires admin
- loops over all confirmed applications for a match
- fully refunds each one
- writes refund transactions
- marks them `cancelled_by_admin`

### `adjust_cash_balance_by_admin(uuid, integer, text)`

It:

- requires admin/service-role access
- adjusts user cash balance up or down
- prevents negative result
- writes `adjustment` ledger row

### `create_cash_charge_order(text, integer)`

It:

- requires auth
- creates a pending charge order
- ensures order belongs to the caller
- returns charge order metadata

### `approve_cash_charge_order(text, text, jsonb)`

It:

- is now restricted to `service_role`
- loads and locks the order
- is idempotent for already paid orders
- only approves `pending` orders
- ensures user cash account exists
- credits cash
- writes `charge` ledger row
- updates the charge order to `paid`

### `get_match_refund_amount(integer, timestamptz, boolean)`

Refund policy implemented in DB:

- admin-cancelled: full refund
- 24h or more before start: full refund
- 6h or more before start: 50% refund
- under 6h: no refund

## 15. Row-Level Security And Access Model

### Public readable

- active venues
- future matches with status `open` or `closed`
- match application counts

### User readable

- own profile
- own applications
- own cash account
- own cash transactions
- own charge orders

### Admin readable/manageable

- all venues
- all matches
- all applications
- all cash accounts
- all cash transactions
- all charge orders
- all charge order events

### Important security pattern

Most mutating business rules are not trusted to the client or even to plain route code. They are pushed into:

- SQL RPCs with `security definer`
- service-role gated operations for payment approval

## 16. Mock/Fallback Mode

When Supabase is not configured:

- public home uses mock matches from `src/lib/matches.ts`
- public match detail also uses mock match data
- login page still renders but sign-in button is disabled
- my page redirects to login with `supabase_not_configured`
- admin routes redirect through auth flow and are effectively unavailable
- apply API returns `503 SUPABASE_NOT_CONFIGURED`
- charge order API returns `503` when required config is absent
- admin data functions fall back to mock venues/matches where coded

This repo is intentionally built to remain demoable without a live backend, but only the public browsing layer degrades cleanly.

## 17. UI And Interaction Design Notes

### Styling model

- global design tokens live in `src/app/globals.css`
- page and component styling use CSS Modules
- user-facing screens use warm light surfaces with orange accent
- admin UI intentionally uses denser utilitarian styling

### SVG assets

- `public/court-a.svg`
- `public/court-b.svg`
- `public/court-c.svg`
- `public/court-d.svg`

These are branded court-preview placeholders, not uploaded venue media. They are reused as:

- mock gallery images
- hero backgrounds
- seed default visual placeholders

### Mobile click/touch safety already present

There is clear evidence that mobile tap safety was considered:

- route transition overlay has `pointer-events: none`
- horizontal scrollers use `touch-action: pan-x`
- bottom fixed bars include safe-area padding
- sticky/fixed bars use explicit z-index layering
- main CTA buttons remain semantic `button`/link elements

This matters because new overlays or gesture containers can easily break current mobile behavior if added carelessly.

## 18. Route Transition And Loading Design

### Loading files

Dedicated loading states exist for:

- home
- match detail
- match apply
- my page

### Transition overlay

`AppLink` triggers `RouteTransitionProvider` only for internal route changes that should show a skeleton.

Supported transition views:

- home
- match detail
- match apply
- my page

Behavior:

- overlay appears immediately
- remains visible for at least a minimum duration
- auto-clears after route change or safety timeout

This is purely a UX layer. It does not change data flow.

## 19. Key Files By Task

### If you are changing public match loading

Start with:

- `src/lib/matches-data.ts`
- `src/lib/match-store.ts`
- `src/lib/matches.ts`

### If you are changing apply/cancel behavior

Start with:

- `src/app/api/matches/[matchId]/applications/route.ts`
- `src/app/api/matches/[matchId]/applications/me/route.ts`
- `supabase/migrations/20260407120000_add_cash_foundation.sql`

### If you are changing charge/payment behavior

Start with:

- `src/components/cash/cash-charge-page.tsx`
- `src/app/api/cash/charge-orders/route.ts`
- `src/app/api/payments/toss/confirm/route.ts`
- `src/app/api/payments/toss/fail/route.ts`
- `src/app/api/payments/toss/webhook/route.ts`
- `src/lib/payments/toss-server.ts`
- `supabase/migrations/20260407120000_add_cash_foundation.sql`
- `supabase/migrations/20260407223000_add_toss_charge_operations.sql`

### If you are changing My Page

Start with:

- `src/lib/mypage.ts`
- `src/components/mypage/my-page.tsx`

### If you are changing admin CRUD

Start with:

- `src/features/admin/actions.ts`
- `src/features/admin/data.ts`
- `src/features/admin/view-model.ts`
- `src/lib/venue-store.ts`
- `src/lib/match-store.ts`

### If you are changing auth/session behavior

Start with:

- `proxy.ts`
- `src/lib/supabase/proxy.ts`
- `src/lib/supabase/auth.ts`
- `src/lib/supabase/server.ts`
- `src/app/auth/callback/route.ts`

## 20. Important Caveats For Future Agents

- README is partially outdated. It still frames payment as not connected, but code now includes cash charge orders, Toss payment confirmation, and admin cash ops.
- Webhook logging exists, but webhook-based charge finalization does not.
- Public likes/views are display-model values, not persisted counters.
- Home filters mostly do not affect server queries.
- Search UIs are placeholders.
- Some home helper components exist but are currently unused.
- Admin create and edit flows are intentionally asymmetric. Do not assume the create form exposes every match field the edit form does.
- Match rows intentionally duplicate venue fields. Do not “clean this up” without understanding why historical snapshotting is needed.
- Payment approval and admin cash adjustment depend on service-role access. If these fail in an environment, check `SUPABASE_SERVICE_ROLE_KEY` first.
- Schema guard helpers in `src/lib/supabase/schema.ts` are part of the runtime contract. They are there to fail fast when migrations lag behind code.

## 21. Practical Summary

If another agent needs the fastest correct mental model, use this:

1. Public users browse future `open`/`closed` matches.
2. Signed-in users apply by spending internal cash.
3. Cancels refund according to DB refund policy.
4. Cash is charged through Toss, but only after server confirm and SQL approval.
5. Admins manage venue templates, match sessions, and cash operations.
6. The real rules live in Supabase migrations and SQL RPCs, not in client components.
