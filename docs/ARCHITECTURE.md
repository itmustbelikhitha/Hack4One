# Architecture

Dayflow uses a layered web architecture: a React dashboard talks to an Express API, the API applies security and validation, business modules perform HR workflows, and persistence can move from seeded demo data to PostgreSQL through Prisma.

## System Diagram

```mermaid
flowchart TB
  subgraph Client
    Browser[Browser]
    Web[React + Vite Dashboard]
    UI[Dashboard Screens, Charts, Command Palette]
  end

  subgraph API
    Express[Express Server]
    Middleware[Helmet, CORS, Cookies, JSON Limit, Rate Limit]
    Auth[JWT Auth + RBAC]
    Routes[REST Routes /api/v1]
    Services[Business Services]
  end

  subgraph Data
    DemoData[Seeded Demo Data]
    Prisma[Prisma Schema]
    Postgres[(PostgreSQL)]
  end

  subgraph Operations
    Audit[Audit Logs]
    Notifications[Notifications]
    Reports[CSV/PDF Reports]
    Docs[Swagger Docs]
  end

  Browser --> Web
  Web --> UI
  Web -->|fetch + bearer token| Express
  Express --> Middleware
  Middleware --> Auth
  Auth --> Routes
  Routes --> Services
  Services --> DemoData
  Services -. production path .-> Prisma
  Prisma --> Postgres
  Services --> Audit
  Services --> Notifications
  Services --> Reports
  Express --> Docs
```

## Request Lifecycle

```mermaid
sequenceDiagram
  participant User
  participant Web
  participant API
  participant Auth
  participant Service
  participant Data
  participant Audit

  User->>Web: Clicks HR action
  Web->>API: HTTP request with access token
  API->>Auth: Authenticate and check permission
  Auth-->>API: User context
  API->>Service: Validate and execute workflow
  Service->>Data: Read/write records
  Service->>Audit: Store sensitive action
  Service-->>API: Result
  API-->>Web: JSON response
  Web-->>User: Updated UI, toast, chart, or table
```

## Code Organization

```text
apps/api/src/server.ts
  Express app, middleware, route registration, API handlers.

apps/api/src/security.ts
  JWT signing, authentication middleware, RBAC permission guards.

apps/api/src/business.ts
  Attendance, leave, salary, analytics, dashboards, audit helpers.

apps/api/src/data.ts
  Demo data, roles, permissions, seeded employees, payroll, documents.

apps/api/prisma/schema.prisma
  Production relational model for PostgreSQL.

apps/web/src/main.tsx
  React routes, screens, API calls, charts, command palette, forms.

apps/web/src/styles.css
  Theme tokens, responsive layout, advanced background, interactions.
```

## Frontend Flow

```mermaid
flowchart LR
  AuthScreen --> Token[dayflow_token localStorage]
  Token --> AppShell
  AppShell --> Sidebar
  AppShell --> Topbar
  AppShell --> PageRouter
  PageRouter --> Dashboard
  PageRouter --> Employees
  PageRouter --> Attendance
  PageRouter --> Leave
  PageRouter --> Payroll
  PageRouter --> Analytics
  PageRouter --> Reports
  PageRouter --> Settings
```

## Backend Flow

```mermaid
flowchart LR
  Request --> Middleware
  Middleware --> Authenticate
  Authenticate --> PermissionGuard
  PermissionGuard --> Handler
  Handler --> ZodValidation
  ZodValidation --> BusinessService
  BusinessService --> DataStore
  BusinessService --> AuditLog
  Handler --> Response
```

## Security Boundaries

- Public routes: signup, login, forgot password, reset password, health.
- Authenticated routes: profile, dashboards, attendance, leave, payroll, documents, notifications.
- Admin-only routes: employee management, analytics, reports, audit logs, organization settings.
- Self-service routes: employee users can access only their own profile, attendance, leave, payroll, documents, and notifications.

## Production Upgrade Path

1. Replace demo data calls in `apps/api/src/data.ts` with Prisma client queries.
2. Apply `apps/api/prisma/schema.prisma` migrations to PostgreSQL.
3. Move document metadata to the database and binaries to object storage.
4. Add server-side pagination, filtering, and search indexes.
5. Expand Swagger definitions from route list to full OpenAPI schemas.
