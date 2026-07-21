# SPY Salon Management System

## Technical Requirements Document (TRD)

**Version:** 1.0
**Architecture:** MERN + Next.js
**Deployment:** Production Ready

---

# 1. Technology Stack

## Frontend

| Technology      | Version             |
| --------------- | ------------------- |
| Next.js         | Latest (App Router) |
| React           | Latest              |
| Tailwind CSS    | Latest              |
| TypeScript      | Recommended         |
| Axios           | API Requests        |
| React Hook Form | Forms               |
| Zod             | Validation          |
| Framer Motion   | Animations          |
| React Icons     | Icons               |
| Recharts        | Dashboard Charts    |
| TanStack Query  | Data Fetching       |
| Zustand         | Global State        |
| NextAuth / JWT  | Authentication      |

---

## UI Design

### Design Language

* Modern Premium UI
* Glassmorphism
* Neumorphism
* Smooth Animations
* Responsive Design
* Dark Mode
* Light Mode

### Color Theme

Primary

* #7C3AED

Secondary

* #EC4899

Success

* #10B981

Danger

* #EF4444

Background

* White
* Dark Gray

---

## UI Effects

### Glassmorphism

* Transparent cards
* Blur effects
* Soft borders
* Floating panels

### Neumorphism

* Buttons
* Input Fields
* Dashboard Cards

### Animations

Framer Motion

* Page Transition
* Card Hover
* Sidebar Animation
* Modal Animation
* Fade
* Slide
* Scale
* Skeleton Loading
* Success Animation

---

# 2. Backend

Node.js

Express.js

Architecture

MVC Pattern

```
Routes
↓

Controllers
↓

Services

↓

Models

↓

MongoDB
```

Authentication

JWT

Password Encryption

bcrypt

Validation

Express Validator

File Upload

Multer

Image Storage

Cloudinary

Email

Nodemailer

SMS

Twilio

Payments

Razorpay

Logging

Morgan

Security

Helmet

Rate Limiter

CORS

Compression

Redis (Optional)

---

# 3. Database

MongoDB Atlas

Collections

Users

Admins

Customers

Employees

Services

Categories

Appointments

Payments

Invoices

Attendance

Salary

Coupons

Branches

Reviews

Notifications

Settings

AuditLogs

ActivityLogs

OTP

RefreshTokens

---

# 4. Folder Structure

```
spy-salon/

frontend/

app/

components/

features/

hooks/

services/

lib/

store/

styles/

public/

backend/

controllers/

routes/

models/

middlewares/

services/

utils/

validators/

config/

uploads/

logs/

```

---

# 5. Authentication

Login

Register

Forgot Password

Reset Password

OTP Verification

Refresh Token

JWT Authentication

Role Based Authentication

---

# 6. Roles

## Admin

Full Access

## Manager

Branch Management

## Receptionist

Appointment Management

## Employee

Assigned Services

## Customer

Booking

---

# 7. Frontend Pages

Landing Page

About

Services

Gallery

Offers

Contact

Login

Register

Forgot Password

Dashboard

Appointments

Bookings

Employees

Customers

Reports

Payments

Invoices

Profile

Settings

Notifications

404

500

---

# 8. API Modules

Authentication

Users

Admin

Employees

Customers

Services

Categories

Appointments

Payments

Reports

Dashboard

Notifications

Settings

Coupons

Branches

Reviews

Invoices

Attendance

Salary

Audit Logs

---

# 9. Dashboard

Cards

Today's Appointments

Revenue

Customers

Employees

Bookings

Charts

Monthly Revenue

Daily Appointments

Top Services

Recent Activity

---

# 10. Security

JWT Authentication

Password Hashing

HTTPS

Helmet

Rate Limiting

CORS

Input Validation

MongoDB Injection Protection

XSS Protection

CSRF Protection

Secure Cookies

Refresh Token Rotation

Audit Logs

---

# 11. Performance

Lazy Loading

Code Splitting

SSR

Image Optimization

Caching

Compression

Pagination

Debouncing

Memoization

Database Indexing

Aggregation Pipeline

---

# 12. Production Deployment

Frontend

* Vercel

Backend

* Render / Railway / AWS EC2

Database

* MongoDB Atlas

Storage

* Cloudinary

Domain

* HTTPS SSL

Monitoring

* PM2
* Winston Logs
* Uptime Robot

---

# 13. Environment Variables

Frontend

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_RAZORPAY_KEY=
NEXT_PUBLIC_GOOGLE_MAP_KEY=
```

Backend

```
PORT=

MONGO_URI=

JWT_SECRET=

JWT_REFRESH_SECRET=

CLOUDINARY_NAME=

CLOUDINARY_KEY=

CLOUDINARY_SECRET=

SMTP_EMAIL=

SMTP_PASSWORD=

RAZORPAY_KEY=

RAZORPAY_SECRET=
```

---

# 14. Admin Features

* Dashboard Overview
* Salon Settings
* Branch Management
* Employee Management
* Customer Management
* Service Management
* Category Management
* Appointment Management
* Payment Management
* Invoice Management
* Attendance Management
* Salary Management
* Coupons & Offers
* Notifications
* Gallery Management
* Reviews Management
* Reports & Analytics
* Audit Logs
* Backup & Restore
* Role & Permission Management
* Profile Management
* Security Settings
* System Configuration

---

# 15. Coding Standards

Frontend

* TypeScript
* Functional Components
* Custom Hooks
* Reusable Components
* Atomic Design

Backend

* MVC Architecture
* RESTful APIs
* Repository/Service Layer
* Proper Error Handling
* Request Validation
* Response Standardization

Database

* Mongoose Models
* Indexes
* Aggregation Pipelines
* Soft Delete Support

---

# 16. Future Enhancements

* AI Hairstyle Recommendation
* AI Face Analysis
* WhatsApp Notifications
* Loyalty Program
* Membership Plans
* Gift Cards
* QR Check-in
* Multi-Branch Support
* Inventory Management
* POS Billing
* Staff Performance Analytics
* Customer Mobile App
* Online Payments
* Push Notifications
* AI Business Insights
