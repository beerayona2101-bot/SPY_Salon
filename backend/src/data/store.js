/**
 * Clean In-Memory Store Module (No Hardcoded Dummy Data)
 * Used as fallback data structures when MongoDB is offline.
 */

const employees = [];
const services = [];
const membershipPlans = [];
const appointments = [];
const leaves = [];
const attendance = [];
const reviews = [];
const customers = [];
const activityLogs = [];
const notifications = [];
const userNotifications = [];
const payrolls = [];
const transactions = [];

function addTransaction(txn) {
  const newTxn = {
    _id: `txn_${Date.now()}`,
    txnId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'Settled',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...txn
  };
  transactions.unshift(newTxn);
  return newTxn;
}

function getEmployeeAttendanceMetrics(empId) {
  return { presentDays: 0, totalDays: 22, percentage: 0 };
}

function logActivity(action, details, user = 'System') {
  const log = {
    _id: `log_${Date.now()}`,
    action,
    details,
    user,
    createdAt: new Date().toISOString()
  };
  activityLogs.unshift(log);
  return log;
}

function addNotification(notif) {
  const n = {
    _id: `notif_${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...notif
  };
  notifications.unshift(n);
  return n;
}

function addUserNotification(userId, notif) {
  const n = {
    _id: `unotif_${Date.now()}`,
    userId,
    read: false,
    createdAt: new Date().toISOString(),
    ...notif
  };
  userNotifications.unshift(n);
  return n;
}

function getAnalyticsStats() {
  return {
    totalRevenue: 0,
    activeMembershipsCount: 0,
    totalAppointmentsCount: 0,
    satisfactionRate: 100,
    recentActivity: activityLogs.slice(0, 5)
  };
}

module.exports = {
  employees,
  services,
  membershipPlans,
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
