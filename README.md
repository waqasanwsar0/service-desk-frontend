# Dispatch — Service Desk Web (React)

React frontend for the Service Desk & Field Engineer Management System.
Talks to the Go backend in `../service-desk` over its REST API.

## Design

"Dispatch console" theme: a dark control-room sidebar, warm paper canvas,
and a signature **signal rail** — a lit progress track showing every
ticket's position in the 7-stage lifecycle
(`New → Assigned → Onsite → Timesheet Pending → Completed → Invoice → Paid`),
the same mental model a dispatcher uses on a physical board.

## Pages

- **Login** — sign in or create the first account (pick a role: admin,
  service_desk, engineer, recruiter, accounts — the UI adapts to it).
- **Overview** — open-ticket counts, critical alerts, recent activity.
- **Tickets** — list, filter, create, and a detail view with the signal
  rail, engineer assignment, status advance, and timesheet upload.
- **Engineers** — search by location/skill/availability, add new engineers.
- **Attendance** — "I am ON-SITE" check-in, leave requests + approval.
- **Timesheets** — review and approve/reject uploaded timesheets.
- **Invoices** — billing entities (multi-company), generate invoices from
  approved timesheets, mark sent/paid.
- **Applicants** — recruitment pipeline board with a per-candidate note
  thread ("Chat with Recruiter").
- **Contracts** — client SOWs, billing terms, and a 30-day renewal-reminder
  banner.

Additional depth on existing pages:
- **Overview** now shows real dashboard data — timesheets missing, leave
  calendar, tickets by client, upcoming visits sorted by SLA.
- **Ticket detail** shows per-ticket profitability (billed vs. vendor
  cost) and lets you add a vendor bill, for admin/accounts/service_desk.
- **Invoices** supports partial payments, cancel, mark-overdue, and
  credit/debit notes.
- **Engineers** has a "Projects" button per engineer for multi-project
  assignment (the "re-hire" flow) — one engineer can hold several active
  project assignments at once, each with its own rate.

Navigation adapts to the signed-in user's role — e.g. only
`recruiter`/`admin` see Applicants, only `admin`/`accounts` see Invoices.

## Run it

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if your backend isn't on :8080
npm run dev
```

Make sure the Go backend (`../service-desk`) is running first:

```bash
cd ../service-desk && go run ./cmd/server
```

Open the printed local URL (typically `http://localhost:5173`), then
register your first account (pick "Admin") and start creating tickets,
engineers, etc.

## Build for production

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## What's next

- Wire up the Outlook/WhatsApp intake once those backend integrations exist.
- Replace the client-only role gating with a proper "access denied" page
  for deep-linked routes.
- Add pagination once ticket/engineer volumes grow beyond a single page.
 
