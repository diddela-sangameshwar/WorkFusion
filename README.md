# ⚡ WorkFusion — Intelligent Employee Progress Tracking & Productivity Optimization

A full-stack enterprise application with **role-based access** (Employee/HR/Admin), **task tracking**, **productivity analytics**, **AI-based scoring**, **automated alerting**, and **real-time dashboards**.

---

## 🏗️ Architecture

```
WorkFusion_Project/
├── Backend/            # Express.js + MongoDB API server
│   ├── src/
│   │   ├── config/     # DB connection, constants
│   │   ├── models/     # 6 Mongoose schemas
│   │   ├── middleware/  # auth, RBAC, error handler
│   │   ├── routes/     # 8 route modules
│   │   ├── controllers/# Business logic
│   │   ├── services/   # Scoring engine, alert engine, reports
│   │   ├── automation/ # Cron-based workflow engine
│   │   ├── socket/     # Socket.io event handlers
│   │   └── utils/      # Helpers, seed script
│   └── server.js
├── Frontend/           # React (Vite) SPA
│   ├── src/
│   │   ├── api/        # Axios instance + typed API functions
│   │   ├── components/ # StatCard, StatusBadge, DataTable
│   │   ├── context/    # AuthContext, SocketContext
│   │   ├── hooks/      # useDebounce, useFetch, useSocketEvents
│   │   ├── layouts/    # DashboardLayout with sidebar
│   │   ├── pages/      # Login, Dashboard, Tasks, Analytics, etc.
│   │   ├── routes/     # ProtectedRoute, RoleRoute, GuestRoute
│   │   └── utils/      # helpers, constants
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** v18+ and **npm**
- **MongoDB** running locally on `mongodb://localhost:27017`

### 1. Backend Setup

```bash
cd Backend
cp .env.example .env   # Edit .env if needed
npm install
npm run seed           # Seed demo data
npm run dev            # Starts on http://localhost:5001
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
npm run dev            # Starts on http://localhost:5173
```

### 3. Open the App

Navigate to **http://localhost:5173** and use one of the demo credentials below.

---

## 🐳 Docker Deployment

```bash
# From project root
docker-compose up --build -d

# Access:
#   Frontend: http://localhost
#   Backend:  http://localhost:5000/api
#   MongoDB:  localhost:27017

# Seed data (run once):
docker exec workfusion-api node src/utils/seed.js
```

---

## 🔑 Demo Login Credentials

| Role     | Email                    | Password       |
|----------|--------------------------|----------------|
| **Admin**    | `admin@workfusion.com`   | `Admin@123`    |
| **HR**       | `hr@workfusion.com`      | `Hr@123`       |
| **Employee** | `john@workfusion.com`    | `Employee@123` |
| **Employee** | `jane@workfusion.com`    | `Employee@123` |
| **Employee** | `bob@workfusion.com`     | `Employee@123` |
| **Employee** | `alice@workfusion.com`   | `Employee@123` |
| **Employee** | `charlie@workfusion.com` | `Employee@123` |

---

## 📋 Features

### Authentication & Authorization
- JWT-based authentication (24h expiry)
- Bcrypt password hashing (12 salt rounds)
- Role-based access control (Employee / HR / Admin)
- Data scoping: employees see only their own data

### Task Management
- Full CRUD with assignment, priority, deadlines
- Status workflow: Pending → In Progress → Completed / Overdue
- Progress tracking with completion percentage
- Comments and time tracking (estimated vs actual hours)

### Productivity Scoring Engine
```
Score = (taskCompletionRate × 40) + (onTimeRate × 30) + (qualityFactor × 20) + (consistencyBonus × 10)
```
- Rule-based AI scoring out of 100
- Weekly trend analysis (improving / stable / declining)
- Next-period score prediction

### Automated Workflows (Cron)
| Schedule       | Workflow                 | Description                          |
|----------------|--------------------------|--------------------------------------|
| Every hour     | Deadline Check           | Alert for tasks due within 24h       |
| Daily midnight | Overdue Detection        | Flag overdue tasks, generate alerts  |
| Daily 6 AM     | Productivity Check       | Alert for scores below 40/100        |
| Weekly Sunday  | Score Calculation        | Recalculate all employee scores      |
| Monthly 1st    | Monthly Report           | Auto-generate monthly analytics      |

### Real-time Updates (Socket.io)
- Live task status changes
- Instant alert notifications
- Progress log events
- Room-based: personal + department + management rooms

### Analytics & Reporting
- KPI dashboard cards
- Productivity trend line charts (30 days)
- Task distribution pie/donut charts
- Department performance bar + radar charts
- Top performers leaderboard
- On-demand report generation (daily / weekly / monthly)

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint            | Access  |
|--------|---------------------|---------|
| POST   | `/api/auth/register`| Public  |
| POST   | `/api/auth/login`   | Public  |
| GET    | `/api/auth/me`      | Auth    |

### Users
| Method | Endpoint              | Access      |
|--------|-----------------------|-------------|
| GET    | `/api/users`          | HR, Admin   |
| GET    | `/api/users/:id`      | Self, HR, Admin |
| PUT    | `/api/users/:id`      | Self, Admin |
| DELETE | `/api/users/:id`      | Admin       |

### Tasks
| Method | Endpoint                 | Access          |
|--------|--------------------------|-----------------|
| POST   | `/api/tasks`             | HR, Admin       |
| GET    | `/api/tasks`             | Scoped by role  |
| GET    | `/api/tasks/:id`         | Scoped          |
| PUT    | `/api/tasks/:id`         | Assignee, HR, Admin |
| PATCH  | `/api/tasks/:id/status`  | Assignee        |
| DELETE | `/api/tasks/:id`         | Admin           |

### Progress
| Method | Endpoint                      | Access          |
|--------|-------------------------------|-----------------|
| POST   | `/api/progress`               | Employee        |
| GET    | `/api/progress`               | Scoped          |
| GET    | `/api/progress/summary/:userId`| Self, HR, Admin |

### Analytics
| Method | Endpoint                             | Access |
|--------|--------------------------------------|--------|
| GET    | `/api/analytics/dashboard`           | Auth   |
| GET    | `/api/analytics/productivity-trends` | Auth   |
| GET    | `/api/analytics/department-stats`    | Auth   |
| GET    | `/api/analytics/task-distribution`   | Auth   |
| GET    | `/api/analytics/top-performers`      | Auth   |

### Alerts, Reports, Automation
- `GET /api/alerts` — List alerts (scoped)
- `POST /api/reports/generate` — Generate report (HR, Admin)
- `POST /api/automation/trigger/:workflow` — Manual trigger (Admin)

---

## 🛠️ Environment Variables

| Variable       | Default                              | Description              |
|----------------|--------------------------------------|--------------------------|
| `PORT`         | `5001`                               | Backend server port      |
| `MONGODB_URI`  | `mongodb://localhost:27017/workfusion`| MongoDB connection       |
| `JWT_SECRET`   | —                                    | JWT signing secret       |
| `JWT_EXPIRES_IN`| `24h`                               | Token expiration         |
| `NODE_ENV`     | `development`                        | Environment mode         |
| `CLIENT_URL`   | `http://localhost:5173`              | CORS allowed origin      |

---

## 📦 Tech Stack

| Layer      | Technology                                       |
|------------|--------------------------------------------------|
| Frontend   | React 19, Vite, React Router v7, Recharts, Axios |
| Backend    | Express 5, Mongoose, JWT, Socket.io, node-cron   |
| Database   | MongoDB 7                                        |
| Styling    | Vanilla CSS (dark theme, glassmorphism)           |
| Real-time  | Socket.io (WebSocket)                            |
| Deployment | Docker, Docker Compose, Nginx                    |

---

## 📄 License

ISC
