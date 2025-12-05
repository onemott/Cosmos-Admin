# EAM Wealth Platform – Admin Portal (Next.js)

This folder contains the Next.js web admin portal for the EAM Wealth Platform.

## Overview

A secure web application for platform administration and EAM management:
- **Super Admin**: Tenant management, global config, platform oversight
- **EAM Manager**: User management, module config, team dashboards
- **EAM Employee**: Client management, workflows (optional web access)

## Tech Stack

- **Framework**: Next.js 14+ (TypeScript, App Router)
- **UI Library**: MUI (Material UI) or shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query + React Context
- **Auth**: OIDC/OAuth2 integration (Auth0/Cognito)
- **Charts**: Recharts or Nivo for data visualization

## Project Structure (planned)

```
admin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, callback)
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── tenants/        # Super Admin: tenant management
│   │   │   ├── users/          # User management
│   │   │   ├── clients/        # Client management
│   │   │   ├── modules/        # Module configuration
│   │   │   ├── integrations/   # Bank connections
│   │   │   ├── reports/        # Reporting
│   │   │   ├── audit/          # Audit logs
│   │   │   └── settings/       # Platform settings
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── forms/              # Form components
│   │   ├── tables/             # Data tables
│   │   ├── charts/             # Chart components
│   │   └── layout/             # Layout components (sidebar, header)
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities and helpers
│   │   ├── api.ts              # API client
│   │   ├── auth.ts             # Auth utilities
│   │   └── utils.ts            # General utilities
│   ├── services/               # API service functions
│   ├── stores/                 # State stores
│   ├── types/                  # TypeScript types
│   └── styles/                 # Global styles
├── public/                     # Static assets
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Key Views by Role

### Super Admin
- **Tenant Management**: Onboard EAM firms, configure branding, enable modules
- **Global Config**: Bank connectors, risk engines, feature flags
- **Platform Logs**: Security events, system health, audit trails

### EAM Manager
- **User Management**: Assign roles, manage access within tenant
- **Module Config**: Enable/disable products for segments or clients
- **Dashboards**: AUM by advisor, risk exceptions, SLAs

### EAM Employee (optional)
- **Client Management**: Profiles, documents, workflows
- **Task Queues**: Onboarding, approvals
- **Analytics**: When enabled via modules

## Security Considerations

- Role-based access control (RBAC) with tenant scoping
- Session management with secure cookies
- CSRF protection
- Content Security Policy headers
- Audit logging for all sensitive actions

