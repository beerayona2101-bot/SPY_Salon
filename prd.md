# SPY Salon -- Product Requirements Document (PRD)

**Version:** 2.0 (Production Ready)\
**Product:** SPY Salon\
**Platform:** Web Admin + Customer Web + Android + iOS\
**Technology:** MERN Stack (MongoDB, Express.js, React.js, Node.js)

------------------------------------------------------------------------

# 1. Product Overview

SPY Salon is a cloud-based Salon, Spa & Beauty Studio Management
Platform designed to automate appointments, customers, employees,
inventory, billing, memberships, marketing, analytics, and multi-branch
operations.

------------------------------------------------------------------------

# 2. Vision

Build a scalable, enterprise-grade Salon ERP that helps salons increase
revenue, improve customer experience, and automate business operations.

------------------------------------------------------------------------

# 3. Objectives

-   Automate salon operations
-   Reduce appointment no-shows
-   Increase customer retention
-   Simplify billing and payments
-   Optimize inventory
-   Improve employee productivity
-   Support multi-branch businesses
-   Deliver enterprise-grade security

------------------------------------------------------------------------

# 4. Roles

## Admin

Full system access.

### Permissions

-   Dashboard & Analytics
-   Customer Management
-   Appointment Management
-   Employee Management
-   Service Management
-   Inventory Management
-   Billing & POS
-   Membership & Packages
-   Loyalty Program
-   Marketing
-   Reports & Analytics
-   Expense Management
-   Vendor Management
-   Settings
-   User & Permission Management
-   Audit Logs
-   Multi-Branch Management

------------------------------------------------------------------------

## User

Permission-based employee account (Receptionist, Stylist, Therapist,
Cashier, Inventory Staff, etc.).

### Available Permissions

-   Dashboard
-   Customers
-   Appointments
-   Services
-   Billing
-   Inventory
-   Attendance
-   Reports (View Only)
-   Profile Management

------------------------------------------------------------------------

# 5. Functional Modules

## Dashboard

-   Revenue
-   Appointments
-   Customers
-   Employee Performance
-   Inventory Alerts
-   Business KPIs

## Customer Management

-   Registration
-   Customer History
-   Memberships
-   Wallet
-   Loyalty
-   Reviews

## Appointment Management

-   Online Booking
-   Walk-ins
-   Calendar
-   Check-in / Check-out
-   Reminders
-   No-show Tracking

## Employee Management

-   Attendance
-   Leave
-   Payroll
-   Commission
-   Performance

## Service Management

-   Categories
-   Pricing
-   Packages
-   Discounts

## Inventory Management

-   Products
-   Vendors
-   Purchases
-   Stock
-   Barcode
-   Low Stock Alerts

## Billing & POS

-   Invoices
-   GST
-   Discounts
-   UPI/Card/Cash
-   Refunds
-   PDF Invoices

## Memberships & Packages

-   Membership Plans
-   Service Packages
-   Renewals
-   Expiry Tracking

## Marketing

-   SMS
-   WhatsApp
-   Email
-   Coupons
-   Referral Program

## Reports

-   Sales
-   Revenue
-   Inventory
-   Employees
-   Customers
-   Profit & Loss

## Settings

-   Salon Profile
-   Taxes
-   Business Hours
-   Payment Gateways
-   Notification Settings

------------------------------------------------------------------------

# 6. Non-Functional Requirements

## Performance

-   \< 2 second response time
-   99.9% uptime
-   Redis caching

## Security

-   JWT Authentication
-   Refresh Tokens
-   RBAC
-   bcrypt
-   HTTPS
-   Helmet
-   Rate Limiting

## Scalability

-   Multi-Tenant SaaS
-   Docker
-   Kubernetes Ready
-   BullMQ
-   Horizontal Scaling

------------------------------------------------------------------------

# 7. Database Collections

-   Users
-   Roles
-   Permissions
-   Salons
-   Branches
-   Customers
-   Employees
-   Appointments
-   Services
-   Products
-   Inventory
-   Vendors
-   Purchases
-   Payments
-   Invoices
-   Memberships
-   Packages
-   Expenses
-   Notifications
-   AuditLogs
-   Settings

------------------------------------------------------------------------

# 8. API Standards

-   REST API
-   Versioning (/api/v1)
-   JWT Authentication
-   Pagination
-   Filtering
-   Search
-   Swagger Documentation

------------------------------------------------------------------------

# 9. Integrations

-   Razorpay
-   PhonePe
-   Google Calendar
-   Google Maps
-   Firebase
-   WhatsApp Business API
-   Cloudinary
-   AWS S3

------------------------------------------------------------------------

# 10. Tech Stack

## Frontend

-   React
-   Redux Toolkit
-   Tailwind CSS
-   Material UI
-   Axios

## Backend

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   Redis
-   Socket.IO
-   JWT

## DevOps

-   Docker
-   GitHub Actions
-   Nginx
-   PM2
-   AWS
-   Cloudflare

------------------------------------------------------------------------

# 11. KPIs

-   Appointment Booking Rate
-   Customer Retention
-   Revenue Growth
-   Employee Productivity
-   Inventory Turnover
-   Membership Conversion
-   CSAT

------------------------------------------------------------------------

# 12. Future Roadmap

-   AI Hairstyle Preview
-   AI Skin Analysis
-   Customer Mobile App
-   Live Queue
-   Franchise Management
-   Dynamic Pricing

------------------------------------------------------------------------

# 13. Success Criteria

-   30% fewer no-shows
-   25% higher repeat customers
-   Billing under 60 seconds
-   99.9% uptime
-   Multi-branch support
-   Enterprise-grade SaaS architecture
