# MERN Visitor Pass Management System

**Role-Based Access Control & Real-time Request Management**

A production-ready full-stack application for managing visitor registration, approvals, passes, and comprehensive reporting with role-based access control.

---

## Table of Contents

- [Features & Constraints](#features--constraints)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Local Setup & Installation](#local-setup--installation)
- [Environment Variables](#environment-variables)
- [Demo Credentials](#demo-credentials)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

---

## Features & Constraints

### Role-Based Access Control (RBAC)

The system implements three distinct user roles with granular permissions:

| Role             | Permissions                                                           |
| ---------------- | --------------------------------------------------------------------- |
| **Admin**        | Dashboard overview, user management, view reports, audit trail access |
| **Receptionist** | Visitor registration, check-in/check-out operations                   |
| **Employee**     | Approve/reject pending visit requests, view personal requests         |

### Business Rules & Constraints

- **Request Limits**: Each employee can have a maximum of **3 pending visit requests** at any given time
- **Time Validation**: Visit requests must specify valid future dates and expected arrival times
- **Status Workflow**: Strict state machine for visit requests (Pending → Approved/Rejected → CheckedIn → CheckedOut/Cancelled)
- **Audit Trail**: Complete activity logging for all state transitions and user actions
- **JWT Authentication**: Secure token-based authentication with role-based route protection

---

## Tech Stack

### Backend

- **Runtime**: Node.js >= 18
- **Framework**: Express.js 4.21
- **Database**: MongoDB Atlas (Mongoose ODM 8.8)
- **Authentication**: JWT (jsonwebtoken 9.0) + bcryptjs
- **Security**: CORS enabled, password hashing

### Frontend

- **Framework**: React 18.3 with Vite 5.4
- **Routing**: React Router 6.28
- **State Management**: Context API (AuthContext)
- **HTTP Client**: Axios 1.7
- **Styling**: Tailwind CSS 3.4 + PostCSS
- **Icons**: Lucide React 0.468

### Build & Development

- **Backend**: Nodemon for hot reloading
- **Frontend**: Vite HMR, Autoprefixer
- **Package Manager**: npm

---

## Project Architecture

```
visitor-pass-system/
├── backend/                          # Express.js API Server
│   ├── config/
│   │   └── db.js                     # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js         # Authentication logic
│   │   ├── userController.js         # User management
│   │   ├── visitorController.js      # Visitor & visit request operations
│   │   └── reportController.js       # Dashboard & analytics
│   ├── middleware/
│   │   ├── auth.js                   # JWT verification middleware
│   │   └── error.js                  # Global error handler
│   ├── models/
│   │   ├── User.js                   # User schema (Admin/Receptionist/Employee)
│   │   ├── Visitor.js                # Visitor information schema
│   │   ├── VisitRequest.js           # Visit request with status workflow
│   │   └── ActivityLog.js            # Audit trail schema
│   ├── routes/
│   │   ├── auth.js                   # Auth routes
│   │   ├── users.js                  # User management routes
│   │   ├── visitors.js               # Visitor & visit request routes
│   │   └── reports.js                # Reports & analytics routes
│   ├── utils/
│   │   └── generateToken.js          # JWT token generation utility
│   ├── seed.js                       # Database seeding script
│   ├── server.js                     # Express server entry point
│   ├── .env                          # Environment variables (not in repo)
│   └── package.json
│
├── frontend/                         # React + Vite Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx            # Main layout wrapper
│   │   │   ├── Navbar.jsx            # Top navigation bar
│   │   │   ├── Sidebar.jsx           # Role-based sidebar
│   │   │   └── ProtectedRoute.jsx    # Route guard component
│   │   ├── config/
│   │   │   └── navigation.js         # Role-based navigation configuration
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state management
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Login page
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx     # Admin dashboard
│   │   │   │   ├── Employees.jsx     # User management
│   │   │   │   ├── Reports.jsx       # Analytics & reports
│   │   │   │   └── ActivityLogs.jsx  # Audit trail viewer
│   │   │   ├── receptionist/
│   │   │   │   ├── RegisterVisitor.jsx  # Visitor registration
│   │   │   │   └── CheckInOut.jsx        # Check-in/out management
│   │   │   └── employee/
│   │   │       └── PendingRequests.jsx   # Request approval interface
│   │   ├── services/
│   │   │   └── api.js                # Axios instance with interceptors
│   │   ├── App.jsx                   # Main app component with routing
│   │   └── main.jsx                  # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env                          # Environment variables (not in repo)
│   └── package.json
│
└── README.md
```

### Data Flow

```
┌─────────────┐      JWT Token       ┌──────────────┐
│   React     │ ◄──────────────────► │   Express    │
│  Frontend   │   Authorization      │   Backend    │
│  (Vite)     │                      │   (Node.js)  │
└──────┬──────┘                      └──────┬───────┘
       │                                    │
       │ Axios Requests                     │ Mongoose ODM
       │                                    │
       ▼                                    ▼
┌─────────────┐                      ┌──────────────┐
│  Tailwind   │                      │   MongoDB    │
│    CSS      │                      │    Atlas     │
└─────────────┘                      └──────────────┘
```

---

## Local Setup & Installation

### Prerequisites

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/atlas/database)) or local MongoDB instance
- **npm** or **yarn** package manager
- **Git** for cloning the repository

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd visitor-pass-system
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file from template
cp .env.example .env

# Edit .env with your MongoDB Atlas credentials
# (See Environment Variables section below)
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file from template
cp .env.example .env

# Edit .env with your API base URL
# (See Environment Variables section below)
```

### Step 4: Seed the Database

```bash
# From the backend directory, run the seed script
cd backend
npm run seed
```

**Expected Output:**

```
Connected to MongoDB...
Cleared existing users...
Seed data inserted successfully!
Users created:
  - Admin User | Email: admin@test.com | Password: password123 | Role: Admin | Department: IT
  - Receptionist User | Email: receptionist@test.com | Password: password123 | Role: Receptionist | Department: Front Desk
  - Employee User | Email: employee@test.com | Password: password123 | Role: Employee | Department: Engineering
  - Employee Two | Email: employee2@test.com | Password: password123 | Role: Employee | Department: Engineering
Database connection closed.
```

### Step 5: Launch the Application

**Option A: Run Both Servers Simultaneously (Recommended)**

Open **two separate terminal windows**:

```bash
# Terminal 1 - Backend Server
cd backend
npm start
# Server runs at http://localhost:5000
```

```bash
# Terminal 2 - Frontend Development Server
cd frontend
npm run dev
# Client runs at http://localhost:5173
```

**Option B: Using npm-run-all (if installed)**

```bash
# Install concurrently (optional)
npm install -g concurrently

# Run both from project root
concurrently "cd backend && npm start" "cd frontend && npm run dev"
```

### Step 6: Access the Application

Open your browser and navigate to:

```
Frontend: http://localhost:5173
Backend API: http://localhost:5000/api
API Health Check: http://localhost:5000/api/health
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable      | Description                           | Required                    | Example                                                                                 |
| ------------- | ------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| `PORT`        | Backend server port                   | Yes                         | `5000`                                                                                  |
| `MONGO_URI`   | MongoDB Atlas connection string       | Yes                         | `mongodb+srv://user:pass@cluster0.mongodb.net/visitor-pass?retryWrites=true&w=majority` |
| `JWT_SECRET`  | Secret key for signing JWT tokens     | Yes                         | `your_super_secret_jwt_key_min_32_chars`                                                |
| `SMTP_HOST`   | SMTP server hostname                  | Yes for email notifications | `smtp.gmail.com`                                                                        |
| `SMTP_PORT`   | SMTP server port                      | No                          | `587`                                                                                   |
| `SMTP_USER`   | SMTP account username                 | Yes for email notifications | `notifications@example.com`                                                             |
| `SMTP_PASS`   | SMTP account password or app password | Yes for email notifications | `your_smtp_app_password`                                                                |
| `SMTP_SECURE` | Use TLS from connection start         | No                          | `false` for port `587`                                                                  |
| `SMTP_FROM`   | Sender address shown in emails        | No                          | `Visitor Pass System <notifications@example.com>`                                       |

**Example `backend/.env` file:**

```env
PORT=5000
MONGO_URI=mongodb+srv://admin:your_password@cluster0.mongodb.net/visitor-pass?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASS=your_smtp_app_password
SMTP_SECURE=false
SMTP_FROM="Visitor Pass System <notifications@example.com>"
```

### Frontend (`frontend/.env`)

| Variable       | Description          | Required | Example                     |
| -------------- | -------------------- | -------- | --------------------------- |
| `VITE_API_URL` | Backend API base URL | Yes      | `http://localhost:5000/api` |

**Example `frontend/.env` file:**

```env
VITE_API_URL=http://localhost:5000/api
```

### Important Security Notes

- **Never commit `.env` files** to version control (they are in `.gitignore`)
- Use strong, randomly generated secrets for `JWT_SECRET` (minimum 32 characters)
- For production, use environment variables provided by your hosting platform (Vercel, Render, etc.)
- Rotate `JWT_SECRET` periodically in production environments

---

## Demo Credentials

After running `npm run seed`, the following test accounts are created with the password **`password123`** for all users:

| Name              | Email                   | Role         | Department  |
| ----------------- | ----------------------- | ------------ | ----------- |
| Admin User        | `admin@test.com`        | Admin        | IT          |
| Receptionist User | `receptionist@test.com` | Receptionist | Front Desk  |
| Employee User     | `employee@test.com`     | Employee     | Engineering |
| Employee Two      | `employee2@test.com`    | Employee     | Engineering |

### Testing Different Roles

1. **Admin Access**: Login with `admin@test.com` / `password123`
   - Access: Dashboard, Employee Management, Reports, Activity Logs

2. **Receptionist Access**: Login with `receptionist@test.com` / `password123`
   - Access: Register Visitors, Check-In/Out Management

3. **Employee Access**: Login with `employee@test.com` / `password123`
   - Access: Pending Visit Requests (Approve/Reject)

---

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected routes require a JWT token in the request header:

```
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### Authentication

| Method | Endpoint         | Description                 | Access |
| ------ | ---------------- | --------------------------- | ------ |
| `POST` | `/auth/register` | Register a new user         | Admin  |
| `POST` | `/auth/login`    | Login and receive JWT token | Public |

**Login Request:**

```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

**Login Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a1b2c3d4e5f6789abcdef0",
    "name": "Admin User",
    "email": "admin@test.com",
    "role": "Admin",
    "department": "IT"
  }
}
```

#### Users

| Method | Endpoint     | Description                                      | Access        |
| ------ | ------------ | ------------------------------------------------ | ------------- |
| `GET`  | `/users`     | Get all users (optional `?role=Employee` filter) | Authenticated |
| `GET`  | `/users/:id` | Get user by ID                                   | Authenticated |

#### Visitors & Visit Requests

| Method  | Endpoint                  | Description                                 | Access        |
| ------- | ------------------------- | ------------------------------------------- | ------------- |
| `POST`  | `/visitors/register`      | Register visitor + create visit request     | Receptionist  |
| `PATCH` | `/visitors/:id/status`    | Approve or reject visit request             | Employee      |
| `PATCH` | `/visitors/:id/check-in`  | Check in visitor                            | Receptionist  |
| `PATCH` | `/visitors/:id/check-out` | Check out visitor                           | Receptionist  |
| `GET`   | `/visitors/pending`       | Get pending requests for logged-in employee | Employee      |
| `GET`   | `/visitors/active`        | Get all active visits (excludes Cancelled)  | Authenticated |
| `GET`   | `/visitors/history`       | Get visit history                           | Authenticated |

**Register Visitor Request:**

```json
{
  "visitor": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "govtId": "DL1234567890"
  },
  "visitRequest": {
    "employeeId": "64a1b2c3d4e5f6789abcdef0",
    "purpose": "Business Meeting",
    "visitDate": "2024-12-25",
    "expectedArrivalTime": "14:30"
  }
}
```

#### Reports & Analytics

| Method | Endpoint                 | Description                 | Access |
| ------ | ------------------------ | --------------------------- | ------ |
| `GET`  | `/reports/dashboard`     | Get admin dashboard metrics | Admin  |
| `GET`  | `/reports/activity-logs` | Get complete audit trail    | Admin  |
| `GET`  | `/reports/visitor-stats` | Get visitor statistics      | Admin  |

#### Health Check

| Method | Endpoint  | Description         |
| ------ | --------- | ------------------- |
| `GET`  | `/health` | Server health check |

**Health Check Response:**

```json
{
  "status": "success",
  "message": "Visitor Pass Management API is running!",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Database Schema

### User Model

```javascript
{
  name: String,           // Full name
  email: String,          // Unique email address
  password: String,       // Bcrypt hashed password
  role: String,           // Enum: ['Admin', 'Receptionist', 'Employee']
  department: String,     // Department name
  createdAt: Date,
  updatedAt: Date
}
```

### Visitor Model

```javascript
{
  name: String,           // Visitor full name
  phone: String,          // Contact number
  email: String,          // Visitor email
  govtId: String,         // Government ID (unique)
  createdAt: Date,
  updatedAt: Date
}
```

### VisitRequest Model

```javascript
{
  visitorId: ObjectId,    // Reference to Visitor
  employeeId: ObjectId,   // Reference to User (Employee)
  purpose: String,        // Visit purpose
  visitDate: Date,        // Scheduled visit date
  expectedArrivalTime: String,  // Expected time (HH:MM format)
  status: String,         // Enum: ['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut', 'Cancelled']
  checkInTime: Date,      // Actual check-in timestamp
  checkOutTime: Date,     // Actual check-out timestamp
  remarks: String,        // Additional notes
  createdBy: ObjectId,    // Reference to User (Receptionist)
  createdAt: Date,
  updatedAt: Date
}
```

### ActivityLog Model

```javascript
{
  visitRequestId: ObjectId,  // Reference to VisitRequest
  action: String,            // Action performed (e.g., 'Approved', 'CheckedIn')
  performedBy: ObjectId,     // Reference to User who performed action
  timestamp: Date,           // Action timestamp
  details: String            // Additional context
}
```

---

## Deployment

### Backend Deployment (Render)

1. Push your repository to GitHub
2. Go to [Render](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT` → `5000`
     - `MONGO_URI` → Your MongoDB Atlas connection string
     - `JWT_SECRET` → Strong random secret (use `openssl rand -hex 32`)
5. Click **Create Web Service**

### Frontend Deployment (Vercel)

1. Push your repository to GitHub
2. Go to [Vercel](https://vercel.com) → **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL` → `https://your-backend.onrender.com/api`
5. Click **Deploy**

### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write permissions
3. Whitelist your IP address (or use 0.0.0.0/0 for testing)
4. Get your connection string and update `MONGO_URI` in backend `.env`

### Production Checklist

- [ ] Update CORS configuration in `backend/server.js` to allow only your frontend domain
- [ ] Use strong, unique `JWT_SECRET` (generate with `openssl rand -hex 32`)
- [ ] Enable MongoDB Atlas IP whitelist for production IPs only
- [ ] Set up environment variables in hosting platform (never commit to Git)
- [ ] Configure custom domain and SSL certificates
- [ ] Enable rate limiting and request validation
- [ ] Set up logging and monitoring (e.g., LogRocket, Sentry)
- [ ] Configure automated backups for MongoDB

---

## Development Scripts

### Backend Scripts

| Command        | Description                                        |
| -------------- | -------------------------------------------------- |
| `npm start`    | Start server with Nodemon (auto-reload on changes) |
| `npm run seed` | Seed database with demo users                      |

### Frontend Scripts

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start Vite development server with HMR |
| `npm run build`   | Build optimized production bundle      |
| `npm run preview` | Preview production build locally       |

---

## Key Implementation Details

### Authentication Flow

1. User submits login credentials
2. Backend validates credentials and generates JWT token
3. Token is stored in localStorage (frontend)
4. Axios interceptor attaches token to all subsequent requests
5. Backend middleware verifies token on protected routes
6. Token expiration handled with automatic logout

### Role-Based Route Protection

- **Frontend**: `ProtectedRoute` component checks user role before rendering
- **Backend**: Middleware validates JWT and role before processing requests
- **Navigation**: Sidebar dynamically renders based on user role

### Visit Request State Machine

```
Pending ──(Employee Approves)──► Approved
   │                               │
   │                         (Receptionist Checks In)
   │                               │
   └──(Employee Rejects)──► Rejected   CheckedIn ──(Receptionist Checks Out)──► CheckedOut
                                                       │
                                                   (Any time before check-in)
                                                       │
                                                   ┌───────┴───────┐
                                                   ▼               ▼
                                              Cancelled      (Auto-complete)
```

### Request Limit Enforcement

- Maximum of 3 pending requests per employee
- Checked during visit request creation
- Returns `400 Bad Request` with descriptive error message if limit exceeded

---

## Troubleshooting

### Common Issues

**1. MongoDB Connection Error**

- Verify `MONGO_URI` is correct in `backend/.env`
- Check MongoDB Atlas cluster is running
- Ensure IP whitelist includes your current IP

**2. CORS Errors**

- Update CORS configuration in `backend/server.js`
- Ensure `VITE_API_URL` matches backend URL exactly

**3. JWT Token Errors**

- Verify `JWT_SECRET` is set in `backend/.env`
- Clear localStorage and re-login if token expired

**4. Port Already in Use**

- Change `PORT` in `backend/.env` (default: 5000)
- For frontend, Vite will auto-increment (default: 5173)

---

## Contributing

This is a demonstration project for technical review. For production use:

1. Add input validation (Joi/Zod)
2. Implement rate limiting
3. Add request logging (Winston/Morgan)
4. Set up error tracking (Sentry)
5. Add unit and integration tests (Jest)
6. Implement refresh token mechanism
7. Add email notifications for request updates
8. Implement file upload for visitor photos/IDs

---

**Built with ❤️ using the MERN Stack**

---

## 🔄 Recent Updates & Enhancements

### 🚀 Newly Added Features

- **PDF & Excel Export:** Added single-click PDF (`jspdf`) and Excel (`xlsx`) export triggers on the Reports view for visitor logs and audit records.
- **Dashboard Visual Analytics:** Integrated interactive Recharts bar and pie chart visualizations on the dashboard for real-time visitor traffic trends and department distribution.
- **Advanced Search & Server-Side Filtering:** Upgraded date-range, status, department, and search filters to run dynamic MongoDB `$match` queries on the backend instead of client-side arrays.
- **Bulk Visitor Operations:** Added multi-select table checkboxes along with backend batch operations (`updateMany`) for bulk pass approval and check-out.
- **Multi-Stage Email Workflow:** Integrated automated Nodemailer notification alerts triggered across pass creation, approval, check-in, and check-out events.

### 🛡️ Backend & Performance Optimizations

- **Strict Business-Rule Validation:** Enforced status-transition locks, host-employee role verification, duplicate active-pass prevention, and required payload validations across Express routes.
- **MongoDB Query Optimization:** Added single and compound indexes on `visitDate`, `status`, `createdAt`, and `department` fields in Mongoose schemas for high-traffic query optimization.
- **Standardized API Response Contract:** Unified all Express controllers and global error middleware to follow a consistent JSON response shape (`{ success, message, data, error }`).

---

### 🛡️ Production Security & Reliability Hardening

- **Credential & Log Protection:** Sanitized backend authentication controllers (`authController.js`) to remove sensitive password hashes and diagnostic logs from production output.
- **Role-Based User Protection:** Secured user list enumeration (`GET /api/users`) behind `authorizeRoles("Admin", "Receptionist")` middleware to prevent unauthorized account discovery.
- **Timezone Date Alignment:** Refactored visitor registration and date parsing logic to handle local calendar dates (`YYYY-MM-DD`), eliminating UTC timezone offset errors during pass creation.
- **Server Resilience & API Security:** Enforced mandatory database connection initialization prior to HTTP listener startup, restricted CORS policies to authorized client domains, and integrated `helmet` with rate-limiting middleware.
- **Notification Parity & UI Guardrails:** Standardized bulk checkout handlers to dispatch visitor/host notification alerts and added defensive array type checks (`Array.isArray()`) across React page states to prevent client-side render exceptions.
