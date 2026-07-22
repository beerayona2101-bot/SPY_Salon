# SPY Salon - Development Phases & System Specification

## Phase 1 - Public Website [Completed ✅]
- Home Page (`/`)
- About Us (`/about`)
- Services Menu (`/services`)
- Service Details (`/services/[slug]`)
- Pricing (`/pricing`)
- Offers & Coupons (`/offers`)
- Gallery (`/gallery`)
- Our Team & Specialists
- Testimonials & Verified Reviews
- Blog (`/blog`)
- FAQs (`/faqs`)
- Contact Us (`/contact`)
- Branch Locations
- Careers (`/careers`)
- Privacy Policy (`/privacy`)
- Terms & Conditions (`/terms`)
- Book Appointment (`/book`)

---

## Phase 2 - Authentication [Completed ✅]
> Admin registration is NOT allowed via public endpoints. Default admin is created using seed script.

- Customer Registration (`/register`)
- Customer & Staff Login (`/login`)
- OTP Verification (`/verify-otp`)
- Forgot Password (`/forgot-password`)
- Reset Password (`/reset-password`)
- Change Password (`/change-password`)
- JWT Authentication (Access Token + Refresh Token flow)
- Secure Logout & Session Clearance

---

## Phase 3 - Customer Dashboard [Completed ✅]
- **My Profile (`/profile`)**:
  - Personal Information (Name, Email, Phone, Verification Badge)
  - VIP Account Status & Loyalty Membership Level
- **Appointment Booking (`/book`)**:
  - Service selection & quick category picker
  - Staff / Specialist selection (Employee name display)
  - Date & Time slot picker with dark-mode high-contrast visibility
  - Payment Options: Instant UPI (`spysalon@upi`) or Pay at Salon (Cash)
- **Appointment History**:
  - Past & upcoming appointment cards
  - Status badges (Confirmed, Completed, Pending, Cancelled)
  - Specialist assigned details & Branch location
  - Payment status tracking (Paid, Unpaid, Pending verification)
- **Membership & Promotional Offers**:
  - Displays present active membership plan details
  - Fallback view displaying active promotional offers and VIP packages if no active plan exists
- **Reviews & Feedback**:
  - Submit star rating and written review for completed services
  - View verified customer ratings

---

## Phase 4 - Admin Dashboard [Completed ✅]
- **Executive Dashboard (`/admin`)**:
  - Real-time KPIs: Total Staff, Active Leaves, Today's Attendance, Customer Feedback counts
  - Operational tab navigation
- **Employee & Specialist Management**:
  - Specialist CRUD (Add/Edit/Remove employee profiles)
  - Specialist skill categories assignment (Hair Stylist, Skin Expert, Master Barber, Nail Artist, etc.)
  - Assigned services provided per employee
  - Working shift hours configuration (e.g., `09:00 - 19:00`)
  - Mandatory Breaktime settings (e.g., `13:00 - 14:00`)
- **Time Slot Settings**:
  - Global slot interval duration configuration (15m, 30m, 45m, 60m)
  - Individual staff slot assignment
- **Employee Leave Management**:
  - Track leave dates, reasons, and status (Pending, Approved, Rejected)
  - Admin one-click approve/reject actions
- **Attendance Tracker**:
  - Daily employee attendance log (Present, Late, Absent, On Leave)
  - Clock-in & Clock-out time tracking
- **Customer Reviews & Moderation**:
  - Moderation desk displaying customer comments and ratings
  - One-click removal of bad or inappropriate comments
- **Dynamic Service Availability**:
  - Backend filtering hiding/disabling services if no specialist is available

---

## Phase 5 - Manager Dashboard [Planned]
- Store Branch Overview
- Daily Roster Management
- Staff Assignment & Schedule Shifts
- Local Inventory Alert Tracking
- Walk-in Customer Check-in

---

## Phase 6 - Receptionist Dashboard [Planned]
- Walk-in Customer Registration
- Quick Desk Booking
- Billing & POS Terminal
- Invoice Generation & UPI/Cash Receipts

---

## Phase 7 - Employee / Stylist Portal [Planned]
- Stylist Personal Schedule & Appointments
- Daily Service Queue
- Clock-In / Clock-Out Interface
- Personal Leave Request Submission

---

## Phase 8 - Enterprise & Advanced System Modules [Planned]
- Multi-Branch Sync
- Automated SMS/WhatsApp Appointment Reminders
- PDF Invoice Download
- Audit Logging & Role-Based Access Control (RBAC)
