<div align="center">

# 🎭 Club Cult

### *Your Campus Event Hub*

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**Discover, Register, and Manage Campus Events with Ease**

[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 👨‍🎓 For Students
- 🎫 **Browse Events** - Discover campus events with beautiful cards
- 📱 **One-Click Registration** - Register with QR code tickets
- 🎟️ **My Tickets** - View all your registrations in one place
- 👤 **Profile Management** - Update your info anytime

</td>
<td width="50%">

### 🏛️ For Club Admins
- ➕ **Create Events** - Rich event creation with image uploads
- 📊 **Dashboard** - View registrations and analytics
- ✏️ **Edit Events** - Update event details on the fly
- 📋 **Attendee Management** - Track who's coming

</td>
</tr>
</table>

### 🔐 Authentication & Security
- **Email/Password Auth** with Supabase
- **Forgot Password** flow with email reset
- **Role-Based Access** (Student, Club Admin, Super Admin)
- **Row Level Security** on all database tables

---

## 🎨 Screenshots

<div align="center">

| Home Page | Event Details | Profile |
|:---------:|:-------------:|:-------:|
| Browse all events | View event info & register | Manage your profile |

</div>

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technology |
|:--------:|:----------:|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Forms** | React Hook Form, Zod |
| **State** | TanStack Query |
| **Routing** | React Router v6 |

</div>

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Quick Start

```bash
# Clone the repository
git clone https://github.com/NishchalKap/Club-Cult.git
cd Club-Cult

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navbar.tsx      # Navigation bar
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom hooks
├── integrations/       # External service configs
│   └── supabase/       # Supabase client & types
├── pages/              # Route components
│   ├── Home.tsx        # Event listing
│   ├── Auth.tsx        # Login/Signup
│   ├── Profile.tsx     # User profile
│   ├── EventDetail.tsx # Event details
│   ├── CreateEvent.tsx # Event creation
│   ├── AdminDashboard.tsx
│   └── SuperAdminDashboard.tsx
└── lib/                # Utilities
```

---

## 👥 User Roles

| Role | Permissions |
|:----:|:------------|
| **Student** | Browse events, register, view tickets, manage profile |
| **Club Admin** | All student perms + create/edit events, view registrations |
| **Super Admin** | All perms + create clubs, assign admins |

---

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ by [Nishchal](https://github.com/NishchalKap)**

⭐ Star this repo if you find it helpful!

</div>
