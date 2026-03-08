# Skynet EPR System

Electronic Progress & Performance Records system for flight school management.

## Overview

Skynet EPR is a full-stack application for managing student pilot evaluations, instructor assignments, and performance tracking at flight training schools.

### Features

- **Authentication & Authorization**
  - JWT-based authentication with HTTP-only cookies
  - Role-based access control (Admin, Instructor, Student)
  - Password reset functionality
  - Secure session management with refresh tokens

- **User Management**
  - Admin panel for user administration
  - Activate/deactivate user accounts
  - Create new users (Admin/Instructor only)
  - Instructor-student assignments

- **EPR Management**
  - Create, view, and edit performance evaluations
  - EPR workflow: Draft → Submitted → Approved/Rejected
  - AI-assisted remarks generation
  - Performance summaries with trends
  - Export reports (JSON/CSV)

- **Dashboards**
  - Role-specific dashboards
  - System statistics
  - Recent activity tracking

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Express 5, TypeScript, Node.js |
| Database | PostgreSQL with Drizzle ORM |
| Auth | JWT (jsonwebtoken), bcryptjs |

---

## Project Structure

```
skynet-epr/
├── skynet-epr-backend/          # Express API server
│   ├── src/
│   │   ├── app.ts               # Express app entry point
│   │   ├── config/              # Database configuration
│   │   ├── controllers/         # Request handlers
│   │   ├── db/                  # Schema & migrations
│   │   ├── middleware/          # Auth, error handling
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   └── utils/               # JWT, validation helpers
│   └── package.json
│
├── skynet-epr-frontend/         # Next.js application
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   ├── components/          # React components
│   │   ├── context/             # React context (Auth)
│   │   └── lib/                 # API client, types
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
# Install backend dependencies
cd skynet-epr-backend
npm install

# Install frontend dependencies
cd ../skynet-epr-frontend
npm install
```

### 2. Database Setup

Create a PostgreSQL database and configure the connection:

```bash
# skynet-epr-backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/skynet_epr
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

Push the schema and seed data:

```bash
cd skynet-epr-backend
npm run db:push    # Apply schema
npm run seed       # Seed sample data
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend (Port 3000)
cd skynet-epr-backend
npm run dev

# Terminal 2 - Frontend (Port 3001)
cd skynet-epr-frontend
npm run dev -- -p 3001
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@skynet.com | Password123! |
| Instructor | sarah.m@skynet.com | Password123! |
| Student | student1@airman.edu | Password123! |

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/login` | User login | Public |
| POST | `/logout` | User logout | Authenticated |
| POST | `/refresh` | Refresh tokens | Public |
| GET | `/me` | Get current user | Authenticated |
| POST | `/users` | Create user | Admin, Instructor |
| POST | `/forgot-password` | Request reset | Public |
| POST | `/reset-password` | Reset password | Public |
| POST | `/admin/reset-password` | Admin reset | Admin |

### People (`/api/people`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List people | Authenticated (filtered by role) |
| GET | `/:id` | Get person | Authenticated |
| PATCH | `/:id` | Update person | Admin |
| POST | `/:id/toggle-active` | Toggle active | Admin |

### EPR Records (`/api/epr`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List EPRs | Authenticated |
| GET | `/:id` | Get EPR detail | Authenticated |
| POST | `/` | Create EPR | Admin, Instructor |
| PATCH | `/:id` | Update EPR | Authenticated |
| GET | `/summary/:personId` | Performance summary | Authenticated |
| POST | `/assist` | AI remarks assist | Authenticated |
| POST | `/:id/submit` | Submit for review | Authenticated |
| POST | `/:id/review` | Approve/reject | Admin, Instructor |
| GET | `/pending-reviews` | List pending | Admin, Instructor |
| GET | `/export/:personId` | Export report | Authenticated |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/stats` | Dashboard stats | Admin, Instructor |
| GET | `/users` | List all users | Admin |
| GET | `/assignments` | List assignments | Admin |
| POST | `/assignments` | Create assignment | Admin |
| DELETE | `/assignments/:id` | Remove assignment | Admin |

---

## Database Schema

### Users
- `id` (UUID)
- `name`, `email`, `passwordHash`
- `role` (student | instructor | admin)
- `isActive`, `lastLoginAt`
- `passwordResetToken`, `passwordResetExpiry`

### EPR Records
- `id` (UUID)
- `personId`, `evaluatorId`
- `roleType` (student | instructor)
- `periodStart`, `periodEnd`
- `overallRating`, `technicalSkillsRating`, `nonTechnicalSkillsRating` (1-5)
- `remarks`, `status` (draft | submitted | approved | rejected | archived)
- `reviewedBy`, `reviewedAt`, `reviewNotes`

### Instructor Assignments
- `id` (UUID)
- `instructorId`, `studentId`
- `assignedAt`, `isActive`

---

## Scripts

### Backend

```bash
npm run dev        # Start dev server with tsx watch
npm run build      # Compile TypeScript
npm run start      # Run compiled JS
npm run db:push    # Push schema to database
npm run db:studio  # Open Drizzle Studio
npm run seed       # Seed database
```

### Frontend

```bash
npm run dev        # Start Next.js dev server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

---

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/skynet_epr
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d
NODE_ENV=development
PORT=3000
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Role Permissions

| Permission | Student | Instructor | Admin |
|------------|---------|------------|-------|
| View own EPRs | ✅ | ✅ | ✅ |
| View assigned students | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Create EPRs | ❌ | ✅ | ✅ |
| Submit EPRs | ✅* | ✅ | ✅ |
| Review EPRs | ❌ | ✅ | ✅ |
| Create users | ❌ | Students only | ✅ |
| Manage assignments | ❌ | ❌ | ✅ |
| Activate/deactivate users | ❌ | ❌ | ✅ |

*Students can only submit their own EPRs if allowed

---

## License

MIT
