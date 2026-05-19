# Facilitas — System Architecture

**Version:** 0.0.0  
**Brand:** Facilitas — "School facility reservations"  
**Tech Stack:** React 19 · TypeScript · Vite · Convex · Tailwind CSS v4 · shadcn/ui · React Router v7 · Lucide React

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Flow & Request Lifecycle](#2-data-flow--request-lifecycle)
3. [Routing Architecture](#3-routing-architecture)
4. [Authentication & Session Layer](#4-authentication--session-layer)
5. [Role-Based Access Control](#5-role-based-access-control)
6. [Backend — Convex Data Layer](#6-backend--convex-data-layer)
7. [Data Structures (Explicit)](#7-data-structures-explicit)
8. [UI Architecture](#8-ui-architecture)
9. [State Management](#9-state-management)
10. [Directory Structure](#10-directory-structure)
11. [Styling System](#11-styling-system)

---

## 1. System Overview

Facilitas is a **role-based facility reservation platform** for a school setting. It is a single-page application (SPA) backed entirely by Convex as its BaaS (Backend-as-a-Service):

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                          │
│  React 19 + TypeScript + Vite + Router v7 + shadcn/ui        │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Pages    │  │ Layouts  │  │ AuthContext (React Context)│  │
│  │ (8 views)│  │3 layouts │  │ + useQuery / useMutation  │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ Convex React Client SDK
┌────────────────────────────▼────────────────────────────────┐
│                   Convex Cloud (BaaS)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ queries/ │  │mutations/│  │ actions/ │  │  Auth (JWT) │ │
│  │ dashboard│  │facilities│  │   seed   │  │             │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Convex Document Database (JSON docs)            │ │
│  │  users · facilities · reservations                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | **Convex** | Real-time reactive queries (`useQuery`), no REST/GraphQL boilerplate, built-in pagination/indexing |
| Frontend framework | **React 19** | Functional components, concurrent features |
| Router | **React Router v7** | Nested layouts with route-level auth guards |
| Styling | **Tailwind CSS v4** | Utility-first, CSS variables for theming |
| Component library | **shadcn/ui** | Reusable `Card`, `Badge`, `Button`, `Input`, `Sheet` primitives |
| Icons | **Lucide React** | Consistent, tree-shakeable icon set |
| Auth strategy | **Convex built-in auth** (email/password stored in `users` table) | Self-contained, no external IDP required |
| Real-time data | **Convex reactive queries** | `useQuery` automatically re-subscribes and re-renders on DB changes |

---

## 2. Data Flow & Request Lifecycle

### Page Render Lifecycle

```
Browser URL
    │
    ▼
React Router matches route
    │
    ▼
AuthLayout gating (is user authenticated?)
    ├── No   →  Login page
    │             └── login() → convex.query(api.auth.login, {email, password})
    │                           → stores userId in localStorage
    ├── Yes  →  Outlet → RoleBasedLayout
                   │
                   ├── isStudent  → StudentLayout ──┐
                   └── else       → AdminLayout   ──┤
                                                     │
                                        Page component
                                             │
                                             ▼
                                   useQuery(api.dashboard.getDashboardStats)
                                   useQuery(api.dashboard.getRecentReservations)
                                             │
                                             ▼
                                   Convex query handler runs in Convex Cloud
                                   reads from document DB, returns plain data
                                             │
                                             ▼
                                   React state updates → component re-renders
```

### Convex Query → Database Path

Convex queries execute inside Convex's cloud runtime, never on the client:

```
useQuery(api.dashboard.getDashboardStats)   ← React call (client)
        │
        ▼                                    ← Convex Cloud runtime
 getDashboardStats handler(ctx)               executes handler
        │
        ├── ctx.db.query('reservations')       reads from LLM-annotated
        │     .withIndex('by_status')          indexes declared in schema
        │     .collect()                        uses persistent indexes
        │
        ├── ctx.db.query('facilities').collect()
        │
        ▼
returns { pendingCount, approvedCount, facilitiesCount }
        ▼
React receives data → re-renders stat cards
```

### Why Queries Run Server-Side

- Queries are **deterministic** — they always produce the same result given the same DB state.
- They cannot **mutate** data — read-only by design.
- They are **cached** by Convex and invalidated automatically when underlying data changes.
- `ctx.runQuery` can only call other `query`-typed functions (not `internalQuery`), which prevents a public query from indirectly exposing an internal data path.

---

## 3. Routing Architecture

### Route Table

Defined in `src/routes/index.tsx` using `createBrowserRouter`:

| Path | Wrapper | Component | Description |
|---|---|---|---|
| `/` | — | `RoleHomeRedirect` | Auto-redirects to `/home` or `/dashboard` by role |
| `/home` | `RequireStudent` | `HomePage` | Student landing page |
| `/my-reservations` | `RequireStudent` | `MyReservationsPage` | Student's booking history |
| `/dashboard` | `RequireAdmin` | `DashboardPage` | Admin overview + stats |
| `/approvals` | `RequireAdmin` | `PendingApprovalsPage` | Reservation approval queue |
| `/reports` | `RequireAdmin` | `ReportsPage` | Summary reports |
| `/settings` | `RequireAdmin` | `SettingsPage` | Settings |
| `/users` | `RequireSuperadmin` | `UsersPage` | User role management |
| `/facilities` | — | `FacilitiesPage` | Facility listing (no role gate) |

### Layout Hierarchy

```
AuthLayout (top-level route guard)
 └── RoleBasedLayout (reads user role from Convex)
      ├── StudentLayout          ← role === 'student'
      │    ├── BrandMark (nav)
      │    ├── NavLinks (Home / Facilities / My Reservations)
      │    ├── UserMenu
      │    └── Outlet
      │
      └── AdminLayout             ← role === 'admin' | 'superadmin'
           ├── Sidebar (Dashboard / Facilities / Approvals / Reports / Users* / Settings)
           ├── UserMenu
           └── Outlet

* Users link hidden from admins without superadminOnly flag
```

### Route Guard Contracts

| Guard | Passes if | Default redirect |
|---|---|---|
| `RequireStudent` | `role === 'student'` | `/dashboard` |
| `RequireAdmin` | `role === 'admin' or 'superadmin'` | `/home` |
| `RequireSuperadmin` | `role === 'superadmin'` | `/dashboard` |
| `RoleHomeRedirect` | — | `/home` (student) or `/dashboard` (admin/superadmin) |

Guards show a loading spinner while `isInitializing` is `true` and a `Navigate` (silent redirect) if the role check fails.

---

## 4. Authentication & Session Layer

### File: `src/context/AuthContext.tsx`

`AuthContext` is a **React Context** that holds the global auth state and exposes three operations:

```ts
type AuthContextValue = {
  currentUser: AuthUser | null | undefined
  isInitializing: boolean
  login: (email: string, password: string) => Promise<AuthUser | null>
  register: (input: RegisterInput) => Promise<AuthUser>
  logout: () => void
}
```

**Session persistence:** On page load, Convex queries `getUserById` using the `userId` read from `localStorage` (`STORAGE_KEY = 'facilitas_user_id'`). If the stored ID is stale (e.g. user was deleted), an effect detects `currentUser === null` and calls `logout()`.

**Login flow:**
1. User submits email + password in `Login.tsx`
2. `AuthContext.login()` calls `convex.query(api.auth.login, { email, password })`
3. Convex `auth.login` looks up the user by lowercased email and compares plaintext passwords
4. On success, `_id` is saved to `localStorage` and React state is updated to trigger `getUserById` re-query
5. On failure (`null`), `Login.tsx` shows an error

**Logout flow:**
1. `AuthContext.logout()` removes `STORAGE_KEY` from `localStorage` and sets `userId = null`
2. `useQuery(api.auth.getUserById, 'skip')` stops resolving → `currentUser` becomes `null`
3. `AuthLayout` renders `Login` instead of routes

### Why Passwords Are Now Securely Hashed

Passwords are hashed using PBKDF2-SHA256 with the Web Crypto API:

- **Algorithm:** PBKDF2-SHA256 with 100,000 iterations
- **Salt:** 16 random bytes per password (unique per user)
- **Output:** 32-byte derived key (256 bits)
- **Format:** `pbkdf2_sha256$iterations$salt$hash` (stored in `passwordHash` field)

The `hashPassword` and `verifyPassword` functions in `convex/auth.ts` use `crypto.subtle` APIs available in the Convex runtime, avoiding native module dependencies.

---

## 5. Role-Based Access Control

Defined in `convex/schema.ts` as a discriminated union:

```ts
export const userRole = v.union(
  v.literal('superadmin'),
  v.literal('admin'),
  v.literal('student'),
)
```

| Role | Can access |
|---|---|
| `student` | `/home`, `/facilities`, `/my-reservations` |
| `admin` | Everything a student can, plus `/dashboard`, `/approvals`, `/reports`, `/settings` |
| `superadmin` | Everything admin can, plus `/users` (user management) |

Role is enforced at **two levels** — client-side via React Router data guards, and server-side in any future mutations (currently unimplemented), but Convex does not automatically enforce access control on queries; that is the developer's responsibility for mutations.

---

## 6. Backend — Convex Data Layer

### Convex Module Map

```
convex/
├── schema.ts          Table definitions + indexes + value validators
├── auth.ts            login · getUserById · register
├── facilities.ts      list · listAvailable · create
├── dashboard.ts       getDashboardStats · getRecentReservations
└── seed.ts            seedUsers (one-shot demo mutation)

convex/_generated/
├── api.d.ts           TypeScript API surface (auto-generated by npx convex dev)
├── server.d.ts        query / mutation / internalQuery builders (gen'd)
└── dataModel.d.ts     Doc<TableName> and Id<TableName> types (gen'd)
```

### Why Queries Are Flat

All dashboard statistics are resolved **in a single database scan** rather than composing sub-queries:

```ts
// ❌ Fails: ctx.runQuery only accepts internalQuery references from a public query
// ✅ Works: direct ctx.db.query(...) calls
const [pending, approved] = await Promise.all([   // 2 parallel reads
  ctx.db.query('reservations').withIndex('by_status', q => q.eq('status', 'pending')).collect(),
  ctx.db.query('reservations').withIndex('by_status', q => q.eq('status', 'approved')).collect(),
])
const facilities = await ctx.db.query('facilities').collect() // 1 read
```

This keeps the public query surface minimal, avoids sub-query overhead, and requires only two network round-trips from the frontend instead of three.

---

## 7. Data Structures (Explicit)

### 7.1 `src/types/index.ts`

```ts
// ── Primitive domain types ──────────────────────────────────

export type UserRole         = 'superadmin' | 'admin' | 'student'
export type FacilityStatus   = 'available' | 'maintenance'
export type ReservationStatus = 'pending' | 'approved' | 'rejected'
export type ReportRange      = '7days' | 'week' | 'month'

// ── AuthUser — public identity shape returned from Convex auth ──

export type AuthUser = {
  _id:         Id<'users'>   // Convex document ID (opaque string)
  name:        string        // Full display name, e.g. "Alex Student"
  email:       string        // Lowercase email address
  role:        UserRole      // 'superadmin' | 'admin' | 'student'
}
```

**Justification:**
- `AuthUser` is the **only type** exposed to UI components — it is intentionally a subset of the full `users` table doc (excludes `password` via `toPublicUser()` in `auth.ts`).
- `UserRole` is a string union, so exhaustive `switch` / if-else type-checking works in TS.
- `FacilityStatus` and `ReservationStatus` mirror the Convex schema literal unions and are shared between the frontend and backend.

---

### 7.2 `convex/schema.ts` — Backend Schema

Every table in Convex is declared with a schema + set of indexed fields:

```ts
// ── users table ──────────────────────────────────────────
export const userRole = v.union(
  v.literal('superadmin'),
  v.literal('admin'),
  v.literal('student'),
)

defineTable({
   name:    v.string(),
   email:   v.string(),
   passwordHash: v.string(),  // PBKDF2-SHA256 hash with salt
   role:    userRole,
  })
  .index('by_email', ['email'])   // ← lookup by email (login)
  .index('by_role',   ['role'])   // ← role-based scans (RBAC, admin views)

// ── facilities table ──────────────────────────────────────
export const facilityStatus = v.union(
  v.literal('available'),
  v.literal('maintenance'),
)

defineTable({
  name:        v.string(),
  description: v.string(),
  status:      facilityStatus,
})
  .index('by_status', ['status'])  // ← filter "available" for students
  .index('by_name',   ['name'])    // ← deduplicate on insert

// ── reservations table ───────────────────────────────────
export const reservationStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected'),
)

defineTable({
  facilityId:  v.id('facilities'),  // ← foreign key to facilities
  userId:      v.id('users'),        // ← foreign key to users
  date:        v.string(),           // ← ISO date, e.g. "2025-01-15"
  startTime:   v.string(),           // ← "HH:MM"
  endTime:     v.string(),           // ← "HH:MM"
  status:      reservationStatus,    // ← workflow state
})
  .index('by_facility',     ['facilityId'])      // ← user's bookings at a facility
  .index('by_user',         ['userId'])          // ← admin: all bookings by one user
  .index('by_status',       ['status'])          // ← dashboard counts, admin filter
  .index('by_facility_date',['facilityId','date']) // ← availability check per day
  .index('by_date',         ['date'])            // ← date-range overviews
```

**Foreign key semantics:** Convex `Id<T>` is a branded string wrapped at the type level. `v.id('facilities')` guarantees only a valid facility document ID can be assigned to `facilityId`. There is no cascading delete — orphaned reservations remain in the table if either parent document is deleted.

---

### 7.3 Convex Runtime Types (`Doc` and `Id`)

Defined in `convex/_generated/dataModel.d.ts`, auto-generated from the schema:

```ts
// Unique document identifier for any table
export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;   // opaque string at runtime, typed at compile time

// Full document shape at runtime (includes metadata fields)
export type Doc<TableName extends TableNames> = DocumentByName<DataModel, TableName>;
```

Each Convex document has at minimum `_id: Id<'tablename'>`, `_creationTime: number`, and the user-defined fields:

```
Doc<'users'>          { _id, _creationTime, name, email, passwordHash, role }
Doc<'facilities'>     { _id, _creationTime, name, description, status }
Doc<'reservations'>   { _id, _creationTime, facilityId, userId, date, startTime, endTime, status }
```

`Doc` types are **internal** — they include `passwordHash`. The `toPublicUser()` helper in `auth.ts` strips the `passwordHash` field, so only the `AuthUser` type flows to the frontend.

---

### 7.4 Convex Query Handler Contexts

```ts
// Read access only — for public mutations
type QueryCtx = GenericQueryCtx<DataModel>;
// services: db, auth, storage, log, runQuery, ...

// Read + write access — for mutations
type MutationCtx = GenericMutationCtx<DataModel>;
// services: db, auth, storage, log, runQuery, ...

// Arbitrary JS — actions (can call third-party APIs)
type ActionCtx = GenericActionCtx<DataModel>;
```

---

### 7.5 Dashboard Query Return Types

#### `getDashboardStats` — `convex/dashboard.ts`

```ts
type DashboardStats = {
  pendingCount:    number   // reservations WHERE status == 'pending'
  approvedCount:   number   // reservations WHERE status == 'approved'
  facilitiesCount: number   // count of all documents in facilities table
}
// Query resolution time: O(2 * index_scan_by_status + full_facilities_scan)
```

#### `getRecentReservations` — `convex/dashboard.ts`

```ts
type RecentReservationRow = {
  _id:             Id<'reservations'>
  _creationTime:   number
  facilityName:    string        // denormalised from facilities.name
  userName:        string        // denormalised from users.name
  date:            string        // e.g. "2025-01-15"
  startTime:       string        // e.g. "08:00"
  endTime:         string        // e.g. "10:00"
  status:          ReservationStatus
}
```

**Denormalisation rationale:** The `reservations` table stores only `userId` and `facilityId`. The query fetches the parent docs in a single `Promise.all` pass so the UI receives a single flat array rather than a nested structure. This is intentional denormalisation — changing a user/facility name updates the dashboard on the next query execution; the data is always fresh because Convex queries have no caching TTL (only real-time subscription).

---

### 7.6 `AuthContextValue` — `src/context/AuthContext.tsx`

```ts
type AuthContextValue = {
  currentUser: AuthUser | null | undefined   // undefined = loading, null = unauthenticated
  isInitializing: boolean                    // true while Convex hydrates from localStorage
  login:    (email: string, password: string) => Promise<AuthUser | null>
  register: (input: RegisterInput)  => Promise<AuthUser>
  logout:   () => void
}

type RegisterInput = {
  name:     string
  email:    string
  password: string
  role:     UserRole
}
```

**Three states matter for gating:**
- `currentUser === undefined` (or `isInitializing === true`) — still loading → show spinner in auth guards
- `currentUser === null` — not authenticated → `AuthLayout` renders `Login`
- `currentUser !== null` — authenticated → routes are rendered

---

### 7.7 `useCurrentUser()` — `src/hooks/useCurrentUser.ts`

```ts
// Abstraction layer on top of AuthContext
function useCurrentUser() {
  const { currentUser, isInitializing } = useAuth()

  return {
    user:       currentUser ?? undefined,   // null → undefined for guard simplicity
    isLoading:  isInitializing,
    role:       currentUser?.role as UserRole | undefined,
    isStudent:  currentUser?.role === 'student',
    isAdmin:    currentUser?.role === 'admin' || currentUser?.role === 'superadmin',
    isSuperadmin: currentUser?.role === 'superadmin',
  }
}
```

Converts three-way `null | AuthUser | undefined` into positive boolean flags for guards and layouts.

---

### 7.8 `ConvexClientProvider` — `src/providers/ConvexClientProvider.tsx`

```ts
type ConvexClientProviderProps = {
  children: ReactNode
}

// Builds ConvexReactClient from VITE_CONVEX_URL env var
const convex = new ConvexReactClient(convexUrl ?? 'https://placeholder.convex.cloud')
```

Reads the Convex deployment URL from `VITE_CONVEX_URL` (set in `.env.local`). The placeholder URL prevents a crash if the variable is absent, but `useQuery` and `useMutation` calls will silently fail at runtime.

---

### 7.9 Brand Config — `src/lib/branding.ts`

```ts
export const branding = {
  name:       'Facilitas',
  tagline:    'School facility reservations',
  description: 'Reserve labs, gyms, and shared spaces in real time — built for students and staff.',
  shortName:  'facilitas',
}
```

Used by `PageHeader`, `BrandMark`, and `Login` to keep brand text in one location.

---

### 7.10 `Doc<'users'>` Exposed via Convex (pre-sanitisation)

```ts
// Full raw doc (passwordHash included) — never sent to frontend
Doc<'users'> = { _id: Id<'users'>, _creationTime: number,
                 name: string, email: string,
                 passwordHash: string,  ← hashed via PBKDF2-SHA256
                 role: UserRole }

// Public / frontend-safe shape after toPublicUser()
AuthUser = { _id: Id<'users'>, _creationTime: number,
             name: string, email: string,
             role: UserRole }
```

**Justification:** `Doc<'users'>` is never imported by page components. The `AuthUser` type is the only shape declared in `src/types/index.ts` and is what all UI consumers receive. The `passwordHash` field is never exposed to the client.

---

## 8. UI Architecture

### Component Layers

```
src/
├── App.tsx                          Root — wraps everything in ConvexClientProvider → RouterProvider
├── main.tsx                         React entry point
├── pages/                           8 page components (all React functional components)
│   ├── DashboardPage.tsx            ← functional (real data from Convex)
│   ├── Login.tsx                    ← functional
│   ├── HomePage.tsx / StudentsPage ├─ stub (shown, minimal implementation)
│   ├── FacilitiesPage.tsx
│   ├── MyReservationsPage.tsx
│   ├── PendingApprovalsPage.tsx
│   ├── ReportsPage.tsx
│   ├── SettingsPage.tsx
│   └── UsersPage.tsx
├── components/
│   ├── auth/RouteGuards.tsx         RequireStudent / RequireAdmin / RequireSuperadmin
│   ├── brand/BrandMark.tsx          Logo mark (F initial + wordmark)
│   ├── layout/
│   │   ├── AuthLayout.tsx           Session gate → Login | Outlet
│   │   ├── RoleBasedLayout.tsx      StudentLayout | AdminLayout
│   │   ├── AdminLayout.tsx          Sidebar nav + header bar
│   │   ├── StudentLayout.tsx        Top nav + sheet drawer (mobile)
│   │   ├── UserMenu.tsx             Avatar dropdown (Profile / Sign out)
│   │   └── PageHeader.tsx           H2 title + golden badge + description
│   └── ui/                          shadcn/ui primitives
│       ├── badge.tsx                Badge with CVA variants
│       ├── button.tsx               Button with variant styles
│       ├── card.tsx                 Card / CardHeader / CardContent / ...
│       ├── input.tsx
│       ├── label.tsx
│       └── sheet.tsx
├── context/AuthContext.tsx          Auth state (React Context + Convex)
├── hooks/useCurrentUser.ts          Auth role booleans
├── providers/ConvexClientProvider   ConvexReactClient singleton
├── types/index.ts                   AuthUser + role/status unions
└── lib/
    └── utils.ts                     cn() for class-merge
```

### Page Implementation Status

| Page | Status | Convex Data |
|---|---|---|
| `DashboardPage` | Functional | `getDashboardStats`, `getRecentReservations` |
| `Login` | Functional | `auth.login`, `auth.register` |
| `HomePage` | Stub | none |
| `FacilitiesPage` | Stub | none |
| `MyReservationsPage` | Stub | none |
| `PendingApprovalsPage` | Stub | none |
| `ReportsPage` | Stub | none |
| `SettingsPage` | Stub | none |
| `UsersPage` | Stub | none |

---

## 9. State Management

Facilitas uses **two complementary strategies** — no Redux, Zustand, or external store library.

### 9.1 Convex Reactive State (primary)

Convex's `useQuery` and `useMutation` hooks replace any need for client-side state management:

```ts
// DashboardPage — Re-renders automatically when reservations/facilities change
const stats  = useQuery(api.dashboard.getDashboardStats)
const recent = useQuery(api.dashboard.getRecentReservations)
```

Convex maintains these subscriptions for the lifetime of the component and invalidates/re-fetches only when underlying DB values change. No manual `useEffect` polling or `setState` bookkeeping required.

### 9.2 React Context (auth session)

Auth state uses a thin **React Context** because it involves:
- Session persistence to `localStorage`
- Mutation (`register`) that must trigger a refetch on success
- Global access from many deeply-nested components (guards + menus)

Auth values are held as standard React state inside `AuthProvider`. When `userId` changes, `useQuery(api.auth.getUserById, {userId})` fires automatically — same reactive mechanism as any other Convex query.

### 9.3 Local Component State (UI only)

`useState` / `useCallback` / `useEffect` are used only for transient UI state:
- Open/closed sheet state in `StudentLayout`
- Dropdown open state in `UserMenu`
- Form field values in `Login.tsx`

No local state stores application/domain data.

---

## 10. Directory Structure

```
commodus/
├── convex/
│   ├── schema.ts          Table definitions + value validators + indexes
│   ├── auth.ts             login · getUserById · register (queries)
│   ├── facilities.ts       list · listAvailable · create
│   ├── dashboard.ts        getDashboardStats · getRecentReservations
│   ├── seed.ts             seedUsers (one-shot demo mutation)
│   └── _generated/
│       ├── api.d.ts        TypeScript typed API surface (public + internal)
│       ├── server.d.ts     query / mutation / internalQuery builders
│       └── dataModel.d.ts  Doc<TableName> / Id<TableName> / DataModel
│
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css           Tailwind v4 theme — brand colors, Sora font, dark mode
│   ├── index.html
│   │
│   ├── types/index.ts          AuthUser + UserRole + FacilityStatus + ReservationStatus
│   │
│   ├── providers/
│   │   └── ConvexClientProvider.tsx   ConvexReactClient from VITE_CONVEX_URL
│   │
│   ├── context/
│   │   └── AuthContext.tsx           AuthContext + useAuth hook
│   │
│   ├── hooks/
│   │   └── useCurrentUser.ts         isStudent | isAdmin | isSuperadmin flags
│   │
│   ├── lib/
│   │   ├── branding.ts               { name, tagline, description, shortName }
│   │   └── utils.ts                  cn() class-name merge
│   │
│   ├── pages/
│   │   ├── DashboardPage.tsx         ← functional, Convex queries
│   │   ├── Login.tsx                 ← functional
│   │   └── [others are stubs]
│   │
│   ├── components/
│   │   ├── auth/RouteGuards.tsx
│   │   ├── brand/BrandMark.tsx
│   │   ├── layout/
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── RoleBasedLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── StudentLayout.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── PageHeader.tsx
│   │   └── ui/  (shadcn/ui primitives)
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── sheet.tsx
│   │
│   └── routes/
│       └── index.tsx           createBrowserRouter route definitions
│
├── public/
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── package.json
├── components.json            shadcn/ui configuration (base-nova style)
├── .env.local                 VITE_CONVEX_URL (not committed)
├── .env.example
└── eslint.config.js
```

---

## 11. Styling System

### 11.1 Theme — `src/index.css`

Tailwind v4 uses CSS custom properties declared inside `@theme inline { ... }`:

```css
@theme inline {
  --font-sans:     'Sora', system-ui, 'Segoe UI', sans-serif;
  --color-brand-blue:  rgb(6, 4, 129);
  --color-brand-gold:  #d4af37;
  --color-brand-blue:  --primary;
  --color-brand-gold:  --accent;
  --color-ring:        --ring;
  /* … all shadcn semantic slots mapped to CSS vars … */
}

:root {
  --primary:        rgb(6, 4, 129);   /* brand-blue */
  --primary-foreground: #ffffff;
  --accent:         #d4af37;            /* brand-gold */
  --accent-foreground: rgb(6, 4, 129);
  --ring:           #d4af37;
  --destructive:    #dc2626;
  --card:           #ffffff;
  --background:     #f8f9fc;
  --foreground:     #0f1029;
  /* … */
}
```

**Dark mode** is activated with `.dark` on `<html>` and overrides all color tokens with indigo/violet values.

### 11.2 Shadcn/ui — `components.json`

```
Style:      base-nova
RSC:        false       (client-side rendering)
TSX:        true
Icon lib:   lucide
CSS vars:   true (CSS custom properties, not JS object)
Tailwind:   v4 / @import 'tailwindcss'
```

`base-nova` ships neutral surfaces with a single accent colour. The second accent (`brand-gold`) is layered on top by manual class names where needed.

### 11.3 Tailwind Config — `tailwind.config.js`

```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Sora', 'system-ui', 'Segoe UI', 'sans-serif'] },
      colors: {
        'brand-blue': 'rgb(6, 4, 129)',
        'brand-gold': '#D4AF37',
      },
    },
  },
  plugins: [],
}
```

The two brand colours (`brand-blue`, `brand-gold`) are available as Tailwind utility classes at-will, in addition to the shadcn semantic tokens (`text-primary`, `bg-accent/15`, etc.).

### 11.4 Colour Palette Usage Map

| Token | Value | Primary use |
|---|---|---|
| `brand-blue` / `--primary` | `rgb(6, 4, 129)` | Logo mark, sidebar bg, nav active state, primary buttons |
| `brand-gold` / `--accent` | `#d4af37` | Logo mark, nav active badge (admin sidebar), pending status badge, login CTA button, page-admin badge, ring focus |
| `bg-card` | `#ffffff` | Card surfaces, form cards, table wrapper |
| `bg-muted` | `#eef0f8` | Loading skeleton, inactive nav items, table head |
| `text-destructive` | `#dc2626` | Error messages, rejected badges |
| `border-border` | `#e2e4ef` | All borders, dividers |
