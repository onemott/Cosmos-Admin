# EAM Admin Portal - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:8000)

## Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
```

3. **Run development server:**

```bash
npm run dev
```

The admin portal will be available at http://localhost:3001

## Development

### Project Structure

```
admin/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Authentication pages
│   │   └── (dashboard)/      # Dashboard pages
│   ├── components/
│   │   ├── ui/               # Base UI components
│   │   └── layout/           # Layout components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and API client
│   └── types/                # TypeScript definitions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Features

### Implemented Pages

- **Dashboard** - Platform overview and metrics
- **Tenants** - EAM firm management
- **Users** - User account management
- **Clients** - Client directory
- **Modules** - Feature module configuration
- **Integrations** - Bank connection management
- **Audit Logs** - Security and activity logs
- **Settings** - Platform configuration

### Authentication

The admin portal uses NextAuth.js for authentication. Configure your OIDC provider (Auth0/Cognito) in the environment variables.

### API Integration

All API calls are handled through:
- `src/lib/api.ts` - API client and endpoint definitions
- `src/hooks/use-api.ts` - React Query hooks for data fetching

## Next Steps

1. **Implement Authentication**
   - Configure NextAuth.js provider
   - Add protected route middleware
   - Implement token refresh logic

2. **Connect to Backend API**
   - Ensure backend is running
   - Update API URLs in `.env`
   - Test API endpoints

3. **Customize Branding**
   - Update colors in `tailwind.config.js`
   - Add logo in sidebar
   - Customize theme

4. **Add Missing Features**
   - Table components for data lists
   - Form components for create/edit
   - Data visualization charts
   - Export functionality

## Troubleshooting

### Port Already in Use

If port 3001 is in use, change the port:

```bash
npm run dev -- -p 3002
```

### API Connection Issues

Verify backend is running and accessible:

```bash
curl http://localhost:8000/health
```

## Production Deployment

1. **Build the application:**

```bash
npm run build
```

2. **Start production server:**

```bash
npm start
```

3. **Deploy to Vercel (recommended):**

```bash
npm install -g vercel
vercel
```

Or deploy to any Node.js hosting platform.

