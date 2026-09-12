# Spice Haven — Restaurant Platform

A complete restaurant management and online ordering platform: customer website,
admin dashboard, and POS, sharing one backend and one PostgreSQL database.

## 1. Project Structure

```
restaurant-platform/
  backend/                 Express + TypeScript REST API
    prisma/schema.prisma   Full relational data model
    prisma/seed.ts         Demo data (Spice Haven restaurant)
    src/
      controllers/         Request handlers
      services/            Business logic (pricing, orders, notifications)
      routes/               API route definitions
      middleware/           Auth, validation, error handling
      validators/           Zod schemas
      config/               Env + Prisma client
    tests/                 Vitest unit tests
  frontend/                React + TypeScript + Vite + Tailwind
    src/
      pages/               Customer site pages
      pages/admin/         Admin dashboard + POS pages
      components/          Shared UI components
      api/                 Typed API client + service functions
      contexts/            Zustand stores (cart, auth)
  docker-compose.yml       Local full-stack orchestration
```

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, react-hook-form, Zod
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT + bcrypt, role-based (SUPER_ADMIN / MANAGER / CASHIER)
- **Validation**: Zod on the backend (source of truth); mirrored on the frontend forms

## 3. Local Development Setup

Prerequisites: Node.js 20+, PostgreSQL 14+ (local or Docker), npm.

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your local Postgres, set JWT_SECRET

npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

npm run dev        # starts the API on http://localhost:4000
```

Demo credentials created by the seed script (change immediately in production):

| Role         | Email                        | Password (default) |
|--------------|-------------------------------|---------------------|
| SUPER_ADMIN  | admin@spicehaven.example      | ChangeMe123!        |
| MANAGER      | manager@spicehaven.example    | ChangeMe123!        |
| CASHIER      | cashier@spicehaven.example    | ChangeMe123!        |

Override these via `SEED_ADMIN_PASSWORD`, `SEED_MANAGER_PASSWORD`, `SEED_CASHIER_PASSWORD`
environment variables before running the seed.

### Frontend

```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173, proxies /api to :4000
```

Visit `http://localhost:5173` for the customer site and
`http://localhost:5173/admin/login` for the admin panel / POS.

### Using Docker Compose instead (Postgres + backend + frontend in one command)

```bash
docker compose up --build
```

Frontend: http://localhost:5173 · Backend: http://localhost:4000

## 4. Running Tests

```bash
cd backend
npm test
```

Covers the centralized pricing service: discount pricing, stock validation,
availability checks, coupon validation (percentage/fixed, min order, max discount,
expiry), delivery-fee threshold logic, and tax computation.

## 5. Production Build & Deployment

### Database
Provision PostgreSQL (Neon, Supabase, Railway, or a managed VPS instance) and set
`DATABASE_URL` accordingly.

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start        # or: node dist/server.js
```
Deploy to Render, Railway, Fly.io, or any Node-capable host/VPS. Set all variables
from `.env.example` in the host's environment configuration — never commit `.env`.

### Frontend
```bash
cd frontend
npm install
npm run build         # outputs static files to dist/
```
Deploy the `dist/` folder to Cloudflare Pages, Vercel, Netlify, or any static host.
Set the API base URL (update `vite.config.ts` proxy or add a `VITE_API_URL` env
var and adjust `src/api/client.ts` `baseURL`) to point at your deployed backend's
public URL, and configure `FRONTEND_URL` in the backend's `.env` to match your
deployed frontend's origin (required for CORS).

### HTTPS & Domain
Terminate TLS at your hosting provider/load balancer (Render, Railway, Cloudflare,
and most VPS panels provide this out of the box via Let's Encrypt). Point your
domain's DNS at the frontend host, and use a subdomain (e.g. `api.yourdomain.com`)
for the backend.

## 5b. Alternative: Single Combined Deployment (One URL, One Service)

If you'd rather not run two separate hosted services, the backend can serve the
built frontend itself:

```bash
cd frontend
npm run build

cd ../backend
mkdir -p ../frontend-dist
cp -r ../frontend/dist/* ../frontend-dist/
# in backend/.env:
#   SERVE_FRONTEND=true
#   FRONTEND_DIST_PATH=../frontend-dist
npm run build
npm run start
```

Now a single Node process on a single port serves both the customer/admin
website and the `/api/*` REST API — deploy it to one Render/Railway/VPS
service and you have one URL for everything. This trades independent
frontend/backend scaling for deployment simplicity; for a single restaurant
location, that trade is usually fine. Note that `/admin` and `/admin/login`
are not a separate deployment either way — they're just routes inside the one
React app (see `frontend/src/App.tsx`), so "combined" here only refers to
frontend+backend, not customer+admin (which were never separate).

## 6. External Services — Now Fully Wired (Add Your Own Credentials)

All three integrations are **fully implemented, end-to-end**, and automatically
activate the moment you add real credentials — no code changes needed:

- **Cloudinary (image uploads)** — set `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. The admin Gallery page checks
  `GET /api/uploads/status` and automatically switches from URL-paste to a real
  drag-and-drop file upload widget once configured. Uploads are validated
  (type + 5MB size limit) and auto-optimized (format/quality) via Cloudinary's
  transformation pipeline before being stored.
- **Razorpay (UPI/Card payments)** — set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
  Checkout checks `GET /api/payments/razorpay/status`; once configured, UPI/Card
  options become selectable and launch the real Razorpay checkout modal. The
  amount charged is always re-read from the order record server-side (never
  trusted from the browser), and payment is only ever marked `PAID` after the
  backend verifies Razorpay's HMAC-SHA256 signature — this exact verification
  logic has unit test coverage, including a forged-signature rejection test.
- **WhatsApp Business API** (server-pushed notifications) — requires a Meta
  Business account, which is a manual approval process outside what credentials
  alone can unlock, so this one remains a documented adapter stub (see
  `src/services/notificationService.ts`). The fully-functional fallback used
  everywhere today is click-to-WhatsApp (`wa.me`) links with correctly
  URL-encoded, structured order messages — the floating button, order
  confirmation flow, and admin "Send WhatsApp Update" action all use this.

Until credentials are added, the platform never fakes success: image fields
accept a pasted URL instead of showing a broken upload button, and online
payment methods are simply not selectable (with an honest inline note) rather
than pretending to charge a card.

## 6b. Invoices

Every order gets a real, downloadable **A4 PDF invoice** (via `pdfkit` — pure
JS, no external binary dependency) at `GET /api/orders/:id/invoice.pdf`
(admin) and `GET /api/orders/track/:orderNumber/invoice.pdf` (customer,
no login required — mirrors the public order-tracking access model). It
includes restaurant branding/GST, itemized line items with add-ons, and the
full discount/tax/delivery breakdown. The POS additionally prints a
thermal-receipt-style summary immediately after a sale via the browser's
native print dialog.

## 7. Production Checklist

- [ ] Change all demo admin/manager/cashier passwords
- [ ] Set a strong, unique `JWT_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Configure real `DATABASE_URL` with connection pooling if expecting
      concurrent load
- [ ] Configure Cloudinary for image uploads
- [ ] Configure Razorpay if accepting online payments
- [ ] Set the real restaurant WhatsApp number in Admin → Settings
- [ ] Review and update tax percentage, delivery charge, and minimum order in
      Admin → Settings to match the real business
- [ ] Set up automated PostgreSQL backups (see below)
- [ ] Point DNS + enable HTTPS on both frontend and backend domains
- [ ] Set `FRONTEND_URL` in backend `.env` to the real deployed frontend origin

## 8. Database Backup Strategy

Use your PostgreSQL provider's built-in backup feature (Neon, Supabase, and
Railway all offer automated daily snapshots). For self-managed PostgreSQL, run:

```bash
pg_dump "$DATABASE_URL" -F c -f backup-$(date +%F).dump
```

on a daily cron job, and retain at least 7-30 days of backups off-server (e.g. S3
or another cloud storage bucket). To restore:

```bash
pg_restore --clean --if-exists -d "$DATABASE_URL" backup-2026-01-01.dump
```

Do not implement automatic data deletion — cancelled/old orders should be
retained for financial and tax reporting purposes.

## 9. Known Limitations of This Delivery

- WhatsApp Business API push notifications require a Meta Business account
  (manual approval, not just credentials) — the click-to-WhatsApp fallback is
  fully functional today; see section 6.
- E2E/browser integration tests are not included; automated unit test coverage
  focuses on the two highest-risk areas of business logic: the centralized
  pricing/discount/tax engine (9 tests) and Razorpay payment signature
  verification (3 tests, including forged-signature rejection) — all 12
  passing. Run them with `cd backend && npm test`.
- The admin Products/Combos forms are functional but intentionally minimal
  (core fields only) rather than exposing every optional schema field in the
  UI — all fields are supported by the API and can be extended into the forms
  as needed.
