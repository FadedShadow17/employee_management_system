# Employee Management System

A production-style MERN Employee Management System with JWT authentication, role-based access, employee records, departments, tasks, attendance, leave, payroll, performance reviews, announcements, notifications, and dashboard analytics.

## Tech Stack

- MongoDB, Mongoose
- Express.js, Node.js
- React.js with Vite
- JavaScript
- Tailwind CSS
- JWT authentication, bcryptjs
- Axios, React Router
- React Hook Form, Zod
- Recharts
- React Hot Toast

## Folder Structure

```text
employee-management-system/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      validators/
      seeds/
      app.js
      server.js
  frontend/
    src/
      components/
      context/
      pages/
      services/
      utils/
  README.md
  .gitignore
  package.json
```

## Features

- Signup, login, logout, persisted current user, change password, protected routes
- Roles: Admin, HR Manager, Employee
- Admin-only HR Manager creation endpoint
- Employee CRUD with search, filters, profile image URL, generated employee IDs, pagination, card/detail/table-oriented views
- Department CRUD with manager assignment and employee counts
- Task assignment, comments API, progress updates, filters, overdue dashboard count, Kanban board
- Attendance check-in/check-out API, manual corrections, reports-ready records
- Leave requests with validation, approval/rejection, remaining balance
- Payroll records with net salary calculation and employee scoping
- Performance reviews, announcements, notifications, activity logs
- Dashboard analytics from MongoDB data
- Responsive SaaS layout with sidebar, top navigation, dark mode, loading and empty states

## Environment Setup

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here (must point to the `ems` database, see examples below)
JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Do not hardcode MongoDB URLs, JWT secrets, or API URLs.

## Installation

From the root folder:

```bash
npm install
npm run install-all
```

## MongoDB Setup

Use MongoDB Atlas or a local MongoDB server. Put the connection string in `backend/.env` as `MONGODB_URI`.

Important: The connection URI must reference the `ems` database. Examples:

- Atlas / cloud URI:

```env
MONGODB_URI=mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/ems?retryWrites=true&w=majority
```

- Local MongoDB:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/ems
```

The backend also supports an optional `MONGODB_DB_NAME` variable. If set, Mongoose will explicitly connect to that database name (defaults to `ems`). The seed script will refuse to run if the active connection is not the configured database to avoid accidental writes to other databases (for example `test`).

## Run the App

Start frontend and backend together:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5000/api`

## Seed Data

After configuring `backend/.env`, run:

```bash
npm run seed
```

Development admin login:

- Email: `admin@example.com`
- Password: `Admin@123`

Change these credentials before production use.

## API Overview

All APIs are mounted under `/api`:

- `/api/auth`
- `/api/users`
- `/api/employees`
- `/api/departments`
- `/api/tasks`
- `/api/attendance`
- `/api/leaves`
- `/api/payroll`
- `/api/performance`
- `/api/announcements`
- `/api/notifications`
- `/api/dashboard`

Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

## Production Deployment

1. Set strong production values for `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_URL`.
2. Set `VITE_API_URL` to the deployed backend API URL.
3. Run `npm run build` to build the frontend.
4. Deploy the backend to a Node.js host such as Render, Railway, Fly.io, AWS, or Azure.
5. Deploy the frontend `frontend/dist` folder to Netlify, Vercel, Cloudflare Pages, or a static host.
6. Configure CORS by setting backend `CLIENT_URL` to the deployed frontend origin.
7. Rotate the seeded development credentials and create real administrator accounts.

## Useful Commands

```bash
npm run install-all
npm run dev
npm run seed
npm run build
```
