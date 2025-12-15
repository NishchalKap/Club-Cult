# Club Cult - University Event Management Platform

> Your Campus, Your Culture — Discover, register, and experience the best university events.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project ([create one free](https://supabase.com))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd club-cult

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Get these from: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Run E2E tests
npm run test
```

## Database Setup

1. Create a new Supabase project
2. Run the SQL migrations in `supabase/` folder:
   - `policies.sql` - RLS policies
   - `subscription_migration.sql` - Subscription tables

3. Create storage bucket:
   - Go to Storage → Create bucket "event-banners"
   - Set to Public

## Project Structure

```
src/
├── components/       # Reusable UI components
│   └── ui/          # shadcn/ui components
├── contexts/        # React contexts (Auth)
├── hooks/           # Custom React hooks
├── integrations/    # External integrations (Supabase)
├── lib/             # Utility functions
└── pages/           # Page components
    ├── Home.tsx
    ├── Auth.tsx
    ├── AdminDashboard.tsx
    ├── CreateEvent.tsx
    └── ...
```

## Features

### For Students
- Browse published events
- Search and filter by category
- Register for events
- View tickets with QR codes

### For Club Admins
- Create and manage events
- Upload event banners
- View registrations
- Subscription management

### Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Scoped storage access per club

## Deployment

### Vercel / Netlify

1. Connect your repository
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy

### Manual

```bash
npm run build
# Deploy the `dist/` folder to any static host
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Submit a pull request

## License

MIT License - feel free to use this project for your university!
