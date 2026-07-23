const employees = [
  {
    _id: 'emp1',
    empCode: 'EMP-1001',
    name: 'Ananya Sharma',
    username: 'ananya_sharma',
    email: 'ananya_sharma@spysalon.com',
    tempPassword: 'ananya_sharma@123',
    phone: '+91 98765 11111',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    specialties: ['Senior Hair Stylist', 'Keratin Expert', 'Bridal Makeup'],
    services: ['Signature Keratin Hair Spa & Mask', 'HD Bridal Makeup & Hair Styling', '24K Royal Gold Glow Facial'],
    workingHours: { start: '09:00', end: '19:00' },
    breakTime: { start: '13:00', end: '14:00' },
    slotIntervalMinutes: 30,
    status: 'Active',
    createdAt: new Date('2026-01-15')
  },
  {
    _id: 'emp2',
    empCode: 'EMP-1002',
    name: 'Rahul Verma',
    username: 'rahul_verma',
    email: 'rahul_verma@spysalon.com',
    tempPassword: 'rahul_verma@123',
    phone: '+91 98765 22222',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    specialties: ['Master Barber', 'Beard Sculpting', 'Luxury Grooming'],
    services: ['Royal Beard Sculpting & Charcoal Steam'],
    workingHours: { start: '10:00', end: '20:00' },
    breakTime: { start: '14:00', end: '15:00' },
    slotIntervalMinutes: 30,
    status: 'Active',
    createdAt: new Date('2026-02-01')
  },
  {
    _id: 'emp3',
    empCode: 'EMP-1003',
    name: 'Priya Reddy',
    username: 'priya_reddy',
    email: 'priya_reddy@spysalon.com',
    tempPassword: 'priya_reddy@123',
    phone: '+91 98765 33333',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    specialties: ['Aesthetics Expert', '24K Gold Facial', 'Skin Therapy'],
    services: ['24K Royal Gold Glow Facial', 'Aroma Luxury Full Body Massage'],
    workingHours: { start: '09:30', end: '18:30' },
    breakTime: { start: '13:30', end: '14:30' },
    slotIntervalMinutes: 45,
    status: 'Active',
    createdAt: new Date('2026-02-10')
  },
  {
    _id: 'emp4',
    empCode: 'EMP-1004',
    name: 'Meera Kapoor',
    username: 'meera_kapoor',
    email: 'meera_kapoor@spysalon.com',
    tempPassword: 'meera_kapoor@123',
    phone: '+91 98765 44444',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    specialties: ['Nail Artist', 'Gel Couture', 'Pedicure Spa'],
    services: ['Gel Couture Manicure & Pedicure'],
    workingHours: { start: '10:00', end: '19:00' },
    breakTime: { start: '14:00', end: '15:00' },
    slotIntervalMinutes: 30,
    status: 'Active',
    createdAt: new Date('2026-03-05')
  }
];

const services = [
  { _id: 'srv1', id: '1', name: '24K Royal Gold Glow Facial', category: 'Skin', price: 1499, discountPrice: 1299, durationMinutes: 60, rating: 4.9, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80', isPopular: true, isActive: true },
  { _id: 'srv2', id: '2', name: 'Signature Keratin Hair Spa & Mask', category: 'Hair', price: 2199, discountPrice: 1899, durationMinutes: 75, rating: 4.9, image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500&auto=format&fit=crop&q=80', isPopular: true, isActive: true },
  { _id: 'srv3', id: '3', name: 'Aroma Luxury Full Body Massage', category: 'Spa', price: 2499, discountPrice: 1999, durationMinutes: 90, rating: 5.0, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&auto=format&fit=crop&q=80', isPopular: true, isActive: true },
  { _id: 'srv4', id: '4', name: 'Gel Couture Manicure & Pedicure', category: 'Nails', price: 1199, discountPrice: 999, durationMinutes: 45, rating: 4.8, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80', isPopular: false, isActive: true },
  { _id: 'srv5', id: '5', name: 'HD Bridal Makeup & Hair Styling', category: 'Bridal', price: 8999, discountPrice: 7499, durationMinutes: 180, rating: 5.0, image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&auto=format&fit=crop&q=80', isPopular: true, isActive: true },
  { _id: 'srv6', id: '6', name: 'Royal Beard Sculpting & Charcoal Steam', category: 'Grooming', price: 599, discountPrice: 499, durationMinutes: 30, rating: 4.7, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80', isPopular: false, isActive: true }
];

const appointments = [
  {
    _id: 'app1',
    bookingId: 'SPY-884920',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 43210',
    customerEmail: 'priya.s@gmail.com',
    branch: 'Jubilee Hills Flagship',
    service: '24K Royal Gold Glow Facial',
    specialistName: 'Priya Reddy (Aesthetics & Skin Expert)',
    bookingDateTime: '2026-07-23T09:15:00.000Z',
    bookingDate: '2026-07-23',
    bookingTimeFormatted: '09:15 AM',
    appointmentDate: '2026-07-23',
    appointmentTime: '11:00 AM',
    status: 'Confirmed',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    notes: 'Client prefers gentle scalp massage.',
    createdAt: '2026-07-23T09:15:00.000Z',
    updatedAt: '2026-07-23T09:15:00.000Z'
  },
  {
    _id: 'app2',
    bookingId: 'SPY-492104',
    customerName: 'Sneha Rao',
    customerPhone: '+91 98765 67890',
    customerEmail: 'sneha.rao@outlook.com',
    branch: 'Jubilee Hills Flagship',
    service: 'Signature Keratin Hair Spa & Mask',
    specialistName: 'Ananya Sharma (Senior Hair Stylist)',
    bookingDateTime: '2026-07-21T14:20:00.000Z',
    bookingDate: '2026-07-21',
    bookingTimeFormatted: '02:20 PM',
    appointmentDate: '2026-07-22',
    appointmentTime: '03:30 PM',
    status: 'Completed',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    notes: 'Pre-bridal hair consultation.',
    createdAt: '2026-07-21T14:20:00.000Z',
    updatedAt: '2026-07-22T15:30:00.000Z'
  },
  {
    _id: 'app3',
    bookingId: 'SPY-991204',
    customerName: 'Vikram Malhotra',
    customerPhone: '+91 98765 12345',
    customerEmail: 'vikram.m@yahoo.com',
    branch: 'Gachibowli Tech Hub',
    service: 'Royal Beard Sculpting & Charcoal Steam',
    specialistName: 'Rahul Verma (Master Barber)',
    bookingDateTime: '2026-07-23T10:05:00.000Z',
    bookingDate: '2026-07-23',
    bookingTimeFormatted: '10:05 AM',
    appointmentDate: '2026-07-24',
    appointmentTime: '05:00 PM',
    status: 'Pending',
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid',
    notes: 'First time visitor.',
    createdAt: '2026-07-23T10:05:00.000Z',
    updatedAt: '2026-07-23T10:05:00.000Z'
  }
];

const leaves = [
  { _id: 'leave1', employeeName: 'Ananya Sharma', startDate: '2026-07-25', endDate: '2026-07-26', reason: 'Personal leave', status: 'Approved' }
];

const attendance = [
  { _id: 'att1', employeeName: 'Ananya Sharma', date: '2026-07-22', clockIn: '09:02 AM', clockOut: '06:00 PM', status: 'Present' },
  { _id: 'att2', employeeName: 'Rahul Verma', date: '2026-07-22', clockIn: '10:00 AM', clockOut: '07:00 PM', status: 'Present' },
  { _id: 'att3', employeeName: 'Priya Reddy', date: '2026-07-22', clockIn: '09:30 AM', clockOut: '06:30 PM', status: 'Present' },
  { _id: 'att4', employeeName: 'Meera Kapoor', date: '2026-07-22', clockIn: '10:15 AM', clockOut: '07:00 PM', status: 'Late' }
];

const reviews = [
  { _id: 'rev1', customerName: 'Sneha Rao', serviceName: '24K Royal Gold Glow Facial', rating: 5, comment: 'Magical experience! Skin was glowing for days.' },
  { _id: 'rev2', customerName: 'Vikram Malhotra', serviceName: 'Signature Keratin Hair Spa', rating: 5, comment: 'Top-tier luxury service in Jubilee Hills. Ananya did a marvelous job.' },
  { _id: 'rev3', customerName: 'Kavita Patel', serviceName: 'Gel Couture Manicure', rating: 4, comment: 'Super fast service, highly hygienic disposable kits used.' }
];

const customers = [
  { _id: 'cust1', name: 'Priya Sharma', email: 'priya.s@gmail.com', phone: '+91 98765 43210', visits: 12, totalSpend: 18400, membership: 'VIP Gold', status: 'Active' },
  { _id: 'cust2', name: 'Sneha Rao', email: 'sneha.rao@outlook.com', phone: '+91 98765 67890', visits: 8, totalSpend: 12100, membership: 'VIP Silver', status: 'Active' },
  { _id: 'cust3', name: 'Vikram Malhotra', email: 'vikram.m@yahoo.com', phone: '+91 98765 12345', visits: 5, totalSpend: 7500, membership: 'Standard', status: 'Active' },
  { _id: 'cust4', name: 'Kavita Patel', email: 'kavita.p@gmail.com', phone: '+91 98765 99999', visits: 15, totalSpend: 24500, membership: 'VIP Platinum', status: 'Active' }
];

const activityLogs = [
  { _id: 'act1', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), action: 'Payment Confirmed', details: 'Cash payment of ₹2,199 confirmed for #SPY-492104 (Sneha Rao - Keratin Hair Spa).', user: 'Ananya Sharma (Stylist Desk)' },
  { _id: 'act2', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), action: 'Appointment Booked', details: 'VIP client Priya Sharma booked 24K Royal Gold Glow Facial (#SPY-884920).', user: 'Priya Sharma (VIP Client Portal)' },
  { _id: 'act3', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), action: 'Walk-In Recorded', details: 'Master barber Rahul Verma logged walk-in appointment #SPY-991204 for Vikram Malhotra.', user: 'Rahul Verma (Barber Desk)' },
  { _id: 'act4', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), action: 'Payroll Disbursed', details: 'Salary slip PAY-2026-07-101 (₹51,000) disbursed to Ananya Sharma via HDFC Bank Transfer.', user: 'System Admin' },
  { _id: 'act5', timestamp: new Date(Date.now() - 180 * 60000).toISOString(), action: 'Staff Attendance Logged', details: 'Ananya Sharma, Rahul Verma & Priya Reddy clocked in as Present 🟢 for July 2026 operational cycle.', user: 'Attendance Engine' },
  { _id: 'act6', timestamp: new Date(Date.now() - 240 * 60000).toISOString(), action: 'Customer VIP Upgraded', details: 'Kavita Patel upgraded to VIP Platinum Tier (Total Spend: ₹24,500 across 15 salon visits).', user: 'Customer Concierge' },
  { _id: 'act7', timestamp: new Date(Date.now() - 300 * 60000).toISOString(), action: 'System Initialized', details: 'SPY Salon production REST API & Socket.IO realtime server initialized cleanly.', user: 'System Administrator' }
];

const { broadcastEvent } = require('../utils/socket');

const notifications = [
  { _id: 'notif1', timestamp: new Date().toISOString(), title: 'System Online', message: 'SPY Salon Enterprise Portal active.', read: false, type: 'info' }
];

const logActivity = (action, details, user = 'System Admin') => {
  const logItem = {
    _id: 'act_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    action,
    details,
    user
  };
  activityLogs.unshift(logItem);
  broadcastEvent('activity:new', logItem);
};

const addNotification = (title, message, type = 'info', recipientRole = 'admin') => {
  const notifItem = {
    _id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    title,
    message,
    read: false,
    recipientRole,
    type
  };
  notifications.unshift(notifItem);
  broadcastEvent('notification:new', notifItem);
};

const getAnalyticsStats = () => {
  let paidAppointmentsTotal = appointments.reduce((sum, app) => {
    if (app.paymentStatus === 'Paid' || app.status === 'Completed' || app.status === 'Confirmed') {
      const matchSrv = services.find(s => s.name === app.service);
      return sum + (matchSrv ? matchSrv.price : 1499);
    }
    return sum;
  }, 0);

  const customerSpendTotal = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const totalRevenue = Math.max(paidAppointmentsTotal, customerSpendTotal, 284500);

  const activeEmployeesCount = employees.filter(e => e.status === 'Active').length;
  const totalAppointmentsCount = appointments.length;
  const totalCustomersCount = customers.length;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '4.9';

  const cashCollected = transactions
    .filter(t => t.type === 'Credited' && (t.paymentMethod === 'Cash' || t.paymentMethod === 'Counter Cash' || t.paymentMethod === 'UPI'))
    .reduce((sum, t) => sum + (t.amount || 0), 42500);

  return {
    totalRevenue,
    cashCollected,
    totalAppointments: totalAppointmentsCount,
    activeEmployees: activeEmployeesCount,
    totalCustomers: totalCustomersCount,
    averageRating: parseFloat(avgRating)
  };
};

const payrolls = [
  {
    _id: 'pay_1',
    slipId: 'PAY-2026-07-101',
    employeeId: 'emp1',
    employeeName: 'Ananya Sharma',
    empCode: 'EMP-1001',
    month: 'July 2026',
    baseSalary: 45000,
    incentives: 7500,
    deductions: 1500,
    netPay: 51000,
    paymentMethod: 'Bank Transfer (HDFC)',
    paymentDate: '2026-07-01',
    status: 'Paid'
  },
  {
    _id: 'pay_2',
    slipId: 'PAY-2026-07-102',
    employeeId: 'emp2',
    employeeName: 'Rahul Verma',
    empCode: 'EMP-1002',
    month: 'July 2026',
    baseSalary: 38000,
    incentives: 5200,
    deductions: 1000,
    netPay: 42200,
    paymentMethod: 'UPI Transfer',
    paymentDate: '2026-07-01',
    status: 'Paid'
  },
  {
    _id: 'pay_3',
    slipId: 'PAY-2026-07-103',
    employeeId: 'emp3',
    employeeName: 'Priya Reddy',
    empCode: 'EMP-1003',
    month: 'July 2026',
    baseSalary: 42000,
    incentives: 6800,
    deductions: 1200,
    netPay: 47600,
    paymentMethod: 'Bank Transfer (ICICI)',
    paymentDate: '2026-07-01',
    status: 'Paid'
  }
];

const transactions = [
  { _id: 'txn_101', txnId: 'TXN-2026-07-001', type: 'Credited', category: 'Appointment Booking', description: 'Customer Appointment #SPY-884920 - Priya Sharma (24K Gold Facial)', amount: 1499, paymentMethod: 'UPI', date: '2026-07-23 11:00 AM', status: 'Completed' },
  { _id: 'txn_102', txnId: 'TXN-2026-07-002', type: 'Debited', category: 'Staff Payroll Disbursal', description: 'Monthly Salary Disbursal - Ananya Sharma (EMP-1001)', amount: 51000, paymentMethod: 'Bank Transfer (HDFC)', date: '2026-07-20 04:30 PM', status: 'Settled' },
  { _id: 'txn_103', txnId: 'TXN-2026-07-003', type: 'Credited', category: 'Counter Product Sale', description: 'Keratin Nourishing Hair Serum & Organic Shampoo Set', amount: 3450, paymentMethod: 'Razorpay Online', date: '2026-07-22 02:15 PM', status: 'Completed' },
  { _id: 'txn_104', txnId: 'TXN-2026-07-004', type: 'Debited', category: 'Staff Payroll Disbursal', description: 'Monthly Salary Disbursal - Rahul Verma (EMP-1002)', amount: 42200, paymentMethod: 'UPI Transfer', date: '2026-07-20 05:10 PM', status: 'Settled' },
  { _id: 'txn_105', txnId: 'TXN-2026-07-005', type: 'Credited', category: 'VIP Package Booking', description: 'HD Bridal Styling Package Deposit - Sneha Rao', amount: 8999, paymentMethod: 'Razorpay Online', date: '2026-07-21 06:00 PM', status: 'Completed' },
  { _id: 'txn_106', txnId: 'TXN-2026-07-006', type: 'Debited', category: 'Staff Payroll Disbursal', description: 'Monthly Salary Disbursal - Priya Reddy (EMP-1003)', amount: 47600, paymentMethod: 'Bank Transfer (ICICI)', date: '2026-07-20 05:45 PM', status: 'Settled' },
  { _id: 'txn_107', txnId: 'TXN-2026-07-007', type: 'Debited', category: 'Salon Inventory Expense', description: 'L\'Oréal Professional Keratin & Botanical Serums Bulk Supply', amount: 18500, paymentMethod: 'Corporate Card', date: '2026-07-18 11:30 AM', status: 'Settled' },
  { _id: 'txn_108', txnId: 'TXN-2026-07-008', type: 'Credited', category: 'Appointment Booking', description: 'Customer Appointment #SPY-492104 - Sneha Rao (Keratin Hair Spa)', amount: 2199, paymentMethod: 'Cash', date: '2026-07-22 03:30 PM', status: 'Completed' }
];

const addTransaction = (type, category, description, amount, paymentMethod = 'UPI', status = 'Completed') => {
  const newTxn = {
    _id: 'txn_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    txnId: 'TXN-2026-07-' + Math.floor(100 + Math.random() * 900),
    type,
    category,
    description,
    amount: Number(amount),
    paymentMethod,
    date: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    status
  };
  transactions.unshift(newTxn);
  broadcastEvent('transaction:new', newTxn);
  broadcastEvent('stats:updated', getAnalyticsStats());
  return newTxn;
};

const getEmployeeAttendanceMetrics = () => {
  const salonOpenedDays = 26; // Monthly salon operational days
  return employees.map((emp, index) => {
    // Generate realistic monthly attendance metrics
    const workedDays = index === 0 ? 25 : index === 1 ? 24 : index === 2 ? 23 : 24;
    const absentDays = salonOpenedDays - workedDays;
    const otHours = index === 0 ? 12 : index === 1 ? 8 : index === 2 ? 6 : 4;
    const otTimes = index === 0 ? 4 : index === 1 ? 3 : index === 2 ? 2 : 2;

    return {
      employeeId: emp._id,
      empCode: emp.empCode || `EMP-100${index + 1}`,
      name: emp.name,
      avatar: emp.avatar,
      specialties: emp.specialties,
      salonOpenedDays,
      workedDays,
      absentDays,
      otHours,
      otTimes,
      attendancePercentage: ((workedDays / salonOpenedDays) * 100).toFixed(1) + '%',
      lastStatus: index === 3 ? 'Late' : 'Present'
    };
  });
};

const userNotifications = [];

const addUserNotification = (customerPhone, customerEmail, title, message, type = 'warning') => {
  const notifItem = {
    _id: 'cust_notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    customerPhone: customerPhone || '',
    customerEmail: customerEmail || '',
    title,
    message,
    read: false,
    type
  };
  userNotifications.unshift(notifItem);
  broadcastEvent('notification:user', notifItem);
};

module.exports = {
  employees,
  services,
  appointments,
  leaves,
  attendance,
  reviews,
  customers,
  activityLogs,
  notifications,
  userNotifications,
  payrolls,
  transactions,
  addTransaction,
  getEmployeeAttendanceMetrics,
  logActivity,
  addNotification,
  addUserNotification,
  getAnalyticsStats
};
