
# SPY Salon - Production Architecture

Version: 1.0

## Technology Stack

### Frontend
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Glassmorphism
- Neumorphism
- Zustand
- TanStack Query
- React Hook Form
- Zod

### Backend
- Node.js
- Express.js
- MVC + Service + Repository Pattern
- JWT + Refresh Tokens
- bcrypt
- Multer
- Cloudinary
- Nodemailer
- Razorpay
- Twilio

### Database
- MongoDB Atlas
- Mongoose
- Indexes
- Aggregation Pipelines

---

# System Architecture

```text
Users
   │
   ▼
Cloudflare / CDN
   │
   ▼
Next.js Frontend
   │
Axios / HTTPS
   │
Express API
   │
├── Authentication
├── Authorization (RBAC)
├── Validation
├── Controllers
├── Services
├── Repositories
├── Models
└── MongoDB Atlas
```

---

# User Roles

- Seeded Admin
- Manager
- Receptionist
- Employee
- Customer

> Admin is **not** created from the UI. The first admin is created using a seed script.

---

# Project Structure

```text
spy-salon/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── lib/
│   ├── styles/
│   └── public/
├── backend/
│   └── src/
│       ├── config/
│       ├── routes/
│       ├── middlewares/
│       ├── validators/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── models/
│       ├── utils/
│       ├── jobs/
│       ├── sockets/
│       └── templates/
├── docs/
└── docker/
```

---

# Request Flow

```text
Browser
  │
  ▼
Next.js
  │
JWT Cookie
  │
Express Route
  │
Auth Middleware
  │
Role Middleware
  │
Validation
  │
Controller
  │
Service
  │
Repository
  │
MongoDB
  │
Response
```

---

# Modules

## Public
- Home
- About
- Services
- Gallery
- Pricing
- Contact
- Offers

## Authentication
- Login
- Customer Registration
- OTP
- Forgot Password
- Reset Password

## Customer
- Dashboard
- Profile
- Book Appointment
- History
- Payments
- Invoices
- Reviews

## Admin
- Dashboard
- Analytics
- Branches
- Managers
- Employees
- Customers
- Services
- Categories
- Products
- Inventory
- Appointments
- Billing
- Payments
- Reports
- Notifications
- Roles & Permissions
- Audit Logs
- Settings

## Manager
- Employees
- Customers
- Inventory
- Appointments
- Reports

## Receptionist
- Walk-ins
- Bookings
- Billing
- Check-in

## Employee
- Schedule
- Attendance
- Service Status
- Leave
- Salary

---

# Database Collections

- users
- roles
- permissions
- branches
- employees
- customers
- categories
- services
- appointments
- invoices
- payments
- attendance
- salaries
- products
- inventory
- memberships
- coupons
- reviews
- notifications
- settings
- activityLogs
- auditLogs
- refreshTokens
- otp

---

# Security

- JWT Authentication
- Refresh Token Rotation
- HttpOnly Cookies
- Helmet
- Rate Limiting
- CORS
- bcrypt
- Input Validation
- Audit Logging

---

# Deployment

Frontend:
- Vercel

Backend:
- Render / Railway / AWS EC2

Database:
- MongoDB Atlas

Media:
- Cloudinary

Monitoring:
- PM2
- Winston

CI/CD:
- GitHub Actions

---

# Development Flow

1. Public Website
2. Authentication
3. Customer Dashboard
4. Admin Dashboard
5. Manager Dashboard
6. Receptionist Dashboard
7. Employee Dashboard
8. Billing & Payments
9. Inventory
10. Reports
11. Testing
12. Production Deployment
