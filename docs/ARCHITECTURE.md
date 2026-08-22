# Architecture

```mermaid
flowchart LR
  Web[React Vite Client] --> Api[Express REST API]
  Api --> Auth[Auth and RBAC Middleware]
  Api --> Services[Business Services]
  Services --> Prisma[Prisma ORM]
  Prisma --> Db[(PostgreSQL)]
  Services --> Events[Domain Events]
  Events --> Notifications
  Events --> AuditLogs
```

The API is split by module: auth, employees, attendance, leaves, payroll, documents, notifications, analytics, reports, audit logs, settings, and search. Multi-step workflows use transactions and emit domain events for notifications and audit entries.
