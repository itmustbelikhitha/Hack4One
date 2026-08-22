# DAYFLOW

Every workday, perfectly aligned.

Dayflow is a production-oriented Human Resource Management System covering authentication, RBAC, employee profiles, attendance, leave, payroll, notifications, analytics, reports, documents, audit logs, and admin operations.

## Architecture

- `apps/api`: Node.js, Express, TypeScript, Prisma-ready REST API.
- `apps/web`: React, TypeScript, Vite dashboard client.
- `apps/api/prisma/schema.prisma`: normalized PostgreSQL schema with constraints, relationships, indexes, and audit/session/document/payroll models.
- `docs`: ER, architecture, workflows, API, and permission matrix.

The backend keeps business rules in services and exposes versioned APIs under `/api/v1/*`. The frontend uses protected routes, reusable dashboard surfaces, validated forms, responsive layouts, dark mode, command palette, notifications, and real API calls.

## Demo Credentials

- Admin: `hr@dayflow.test` / `Dayflow@123`
- Employee: `maya@dayflow.test` / `Dayflow@123`

## Setup

```bash
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

API: `http://localhost:4200/api/v1`

Web: `http://localhost:5173`

## Commands

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run format
npm run migrate
npm run seed
```

## Security

Dayflow implements password hashing, short-lived access tokens, refresh-token rotation, HTTP-only refresh cookies, central RBAC middleware, secure headers, CORS allowlists, rate limiting, request validation, safe upload checks, sensitive-field filtering, and audit logging. Employees can only access their own private profile, attendance, leave, payroll, notifications, and documents.

## Documentation

- [Requirements Traceability](./REQUIREMENTS.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [ER Diagram](./docs/ER_DIAGRAM.md)
- [API Documentation](./docs/API.md)
- [Permission Matrix](./docs/PERMISSION_MATRIX.md)
- [Workflow Diagrams](./docs/WORKFLOWS.md)
