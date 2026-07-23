/**
 * Admin Business Logic Service
 * Handles multi-module state auto-updates, transactions, audit logging, and summary analytics.
 */
const employeeRepo = require('../repositories/employeeRepository');
const appointmentRepo = require('../repositories/appointmentRepository');
const transactionRepo = require('../repositories/transactionRepository');
const customerRepo = require('../repositories/customerRepository');
const store = require('../data/store');
const ApiError = require('../utils/apiError');
const emailService = require('./emailService');
const { broadcastEvent } = require('../utils/socket');

class AdminService {
  // Summary Analytics Loading (Optimized to prevent over-fetching)
  async getAnalyticsSummary() {
    const stats = store.getAnalyticsStats();
    return stats;
  }

  // Activity Audit Logs
  async getActivityLogs(queryParams) {
    const logs = [...store.activityLogs];
    return { data: logs, total: logs.length };
  }

  // Notifications Filtered
  async getNotifications() {
    const actionable = store.notifications.filter(n => {
      const text = `${n.title} ${n.message}`.toLowerCase();
      return !text.includes('logged in') && 
             !text.includes('logged out') && 
             !text.includes('login') && 
             !text.includes('logout') && 
             !text.includes('system online');
    });

    return actionable;
  }

  // Employee Management
  async getEmployees(queryParams) {
    return await employeeRepo.find(queryParams);
  }

  async getEmployeeById(id) {
    const employee = await employeeRepo.findById(id);
    if (!employee) throw ApiError.notFound(`Employee with ID '${id}' not found`);
    return employee;
  }

  async createEmployee(payload) {
    if (!payload.name || !payload.email) {
      throw ApiError.badRequest('Employee name and email are required');
    }

    const cleanName = payload.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const empCode = `EMP-${1000 + store.employees.length + 1}`;
    const username = cleanName || 'stylist';
    const email = payload.email.toLowerCase().trim();
    const tempPassword = payload.password || `${username}@123`;

    const newEmp = await employeeRepo.create({
      empCode,
      name: payload.name,
      email,
      username,
      tempPassword,
      password: tempPassword,
      phone: payload.phone || '+91 98765 00000',
      avatar: payload.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      specialties: payload.specialties || ['Senior Stylist'],
      services: payload.services || ['Signature Keratin Hair Spa'],
      status: payload.status || 'Active'
    });

    store.logActivity('New Employee Registered', `Created employee profile for ${newEmp.name} (${empCode}). Credentials saved: ${email} / ${tempPassword}`);

    // Send automated email with credentials via Nodemailer
    let emailSent = false;
    try {
      const emailRes = await emailService.sendEmployeeCredentialsEmail({
        email: newEmp.email,
        name: newEmp.name,
        username: newEmp.username,
        tempPassword,
        empCode: newEmp.empCode
      });
      emailSent = emailRes?.success || false;
    } catch (err) {
      console.error('[adminService] Email sending error:', err);
    }

    // Broadcast real-time Socket event
    broadcastEvent('employee:created', { employee: newEmp });

    return {
      data: newEmp,
      credentials: { empCode, email, username, tempPassword },
      emailSent
    };
  }

  async updateEmployee(id, payload) {
    if (payload.password) {
      payload.tempPassword = payload.password;
    }
    const updated = await employeeRepo.update(id, payload);
    if (!updated) throw ApiError.notFound(`Employee with ID '${id}' not found`);
    
    store.logActivity('Employee Profile Updated', `Updated details for ${updated.name}.`);

    if (payload.password || payload.email) {
      try {
        await emailService.sendEmployeeCredentialsEmail({
          email: updated.email,
          name: updated.name,
          username: updated.username,
          tempPassword: updated.tempPassword || updated.password || `${updated.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}@123`,
          empCode: updated.empCode
        });
      } catch (err) {
        console.error('[adminService] Email sending error on update:', err);
      }
    }

    broadcastEvent('employee:updated', { employee: updated });
    return updated;
  }

  async deleteEmployee(id) {
    const success = await employeeRepo.softDelete(id);
    if (!success) throw ApiError.notFound(`Employee with ID '${id}' not found`);
    
    broadcastEvent('employee:deleted', { employeeId: id });
    return true;
  }

  // Customer Management
  async getCustomers(queryParams) {
    return await customerRepo.find(queryParams);
  }

  async createCustomer(payload) {
    if (!payload.name) throw ApiError.badRequest('Customer name is required');

    const newCust = await customerRepo.create({
      name: payload.name,
      email: payload.email || `${payload.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: payload.phone || '+91 98765 43210',
      membership: payload.membership || 'VIP Gold',
      totalSpent: payload.totalSpent || 0,
      visitsCount: payload.visitsCount || 1,
      status: 'Active'
    });

    store.logActivity('New Customer Directory Record', `Added customer account for ${newCust.name}.`);
    return newCust;
  }

  async updateCustomer(id, payload) {
    const updated = await customerRepo.update(id, payload);
    if (!updated) throw ApiError.notFound(`Customer with ID '${id}' not found`);
    return updated;
  }

  async deleteCustomer(id) {
    const success = await customerRepo.softDelete(id);
    if (!success) throw ApiError.notFound(`Customer with ID '${id}' not found`);
    return true;
  }

  // Service Pricing Menu
  async getServices(queryParams) {
    const services = store.services || [];
    return { data: services, total: services.length };
  }

  async createService(payload) {
    if (!payload.name || !payload.price) throw ApiError.badRequest('Service name and price are required');
    const newService = {
      _id: `srv_${Date.now()}`,
      name: payload.name,
      category: payload.category || 'Hair Care',
      price: Number(payload.price),
      discountPrice: Number(payload.discountPrice || payload.price),
      durationMinutes: Number(payload.durationMinutes || 60),
      rating: Number(payload.rating || 4.9),
      description: payload.description || 'Luxury SPY Salon service treatment.',
      image: payload.image || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
      isPopular: Boolean(payload.isPopular),
      steps: payload.steps || [],
      benefits: payload.benefits || [],
      isActive: true
    };

    store.services.unshift(newService);
    store.logActivity('New Service Added', `Added ${newService.name} to pricing menu.`);
    return newService;
  }

  async updateService(id, payload) {
    const index = store.services.findIndex(s => String(s._id) === String(id));
    if (index === -1) throw ApiError.notFound(`Service with ID '${id}' not found`);

    store.services[index] = { ...store.services[index], ...payload };
    return store.services[index];
  }

  async deleteService(id) {
    const index = store.services.findIndex(s => String(s._id) === String(id));
    if (index === -1) throw ApiError.notFound(`Service with ID '${id}' not found`);

    store.services.splice(index, 1);
    return true;
  }

  // Appointment Desk & Auto-Ledger Updates
  async getAppointments(queryParams) {
    return await appointmentRepo.find(queryParams);
  }

  async createAppointment(payload) {
    if (!payload.customerName || !payload.service) {
      throw ApiError.badRequest('Customer name and service title are required');
    }

    const bookingId = `SPY-${Math.floor(100000 + Math.random() * 900000)}`;
    const newApp = await appointmentRepo.create({
      bookingId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone || '+91 98765 43210',
      service: payload.service,
      specialistName: payload.specialistName || 'Ananya Sharma (Senior Hair Stylist)',
      appointmentDate: payload.appointmentDate || new Date().toISOString().split('T')[0],
      appointmentTime: payload.appointmentTime || '11:00 AM',
      paymentMethod: payload.paymentMethod || 'UPI',
      status: 'Confirmed',
      branch: payload.branch || 'Jubilee Hills Flagship'
    });

    // Cross-Module Auto Update: Create Ledger Transaction & Audit Log
    const txnAmount = payload.price || 1499;
    store.addTransaction(
      'Credited',
      'Appointment Booking',
      `Customer Appointment #${bookingId} - ${newApp.customerName} (${newApp.service})`,
      txnAmount,
      payload.paymentMethod || 'UPI'
    );

    store.logActivity('Appointment Booked', `Booked ${newApp.service} for ${newApp.customerName} (#${bookingId}).`);

    return newApp;
  }

  async updateAppointmentStatus(id, status) {
    const updated = await appointmentRepo.update(id, { status });
    if (!updated) throw ApiError.notFound(`Appointment with ID '${id}' not found`);

    store.logActivity('Appointment Status Changed', `Updated status of #${updated.bookingId} to ${status}.`);
    return updated;
  }

  async respondReschedule(id, action, rejectionReason) {
    const appointment = store.appointments.find(a => String(a._id) === String(id) || String(a.bookingId) === String(id));
    if (!appointment) throw ApiError.notFound(`Appointment with ID '${id}' not found`);

    if (action === 'Approve') {
      const oldDate = appointment.appointmentDate;
      const oldTime = appointment.appointmentTime;
      const newDate = appointment.rescheduleData?.requestedDate || appointment.appointmentDate;
      const newTime = appointment.rescheduleData?.requestedTime || appointment.appointmentTime;

      appointment.appointmentDate = newDate;
      appointment.appointmentTime = newTime;
      appointment.status = 'Rescheduled';
      appointment.rescheduleRequested = false;
      appointment.updatedAt = new Date().toISOString();
      // NOTE: bookingDateTime remains completely untouched!

      store.userNotifications.unshift({
        _id: `unotif_${Date.now()}`,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone,
        timestamp: new Date().toISOString(),
        title: 'Reschedule Request Approved ✅',
        message: `Your appointment #${appointment.bookingId} (${appointment.service}) has been rescheduled to ${newDate} at ${newTime}.`,
        read: false,
        type: 'success'
      });

      store.logActivity(
        'Reschedule Approved',
        `Approved reschedule for #${appointment.bookingId} (${appointment.customerName}). Old Visit Schedule: ${oldDate} ${oldTime} ➔ New Visit Schedule: ${newDate} ${newTime}. (Original Booking Date & Time: ${appointment.bookingDateTime || appointment.createdAt})`
      );
    } else {
      appointment.status = 'Confirmed';
      appointment.rescheduleRequested = false;

      store.userNotifications.unshift({
        _id: `unotif_${Date.now()}`,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone,
        timestamp: new Date().toISOString(),
        title: 'Reschedule Request Update ℹ️',
        message: `Your reschedule request for #${appointment.bookingId} could not be accommodated. ${rejectionReason || 'Please keep original scheduled slot.'}`,
        read: false,
        type: 'warning'
      });

      store.logActivity(
        'Reschedule Rejected',
        `Rejected reschedule for #${appointment.bookingId} (${appointment.customerName}). Reason: ${rejectionReason || 'Slot unavailable'}`
      );
    }

    return appointment;
  }

  async deleteAppointment(id) {
    const success = await appointmentRepo.softDelete(id);
    if (!success) throw ApiError.notFound(`Appointment with ID '${id}' not found`);
    return true;
  }

  // Financial Ledger & Transactions
  async getTransactions(queryParams) {
    return await transactionRepo.find(queryParams);
  }

  async createTransaction(payload) {
    if (!payload.amount || !payload.category) {
      throw ApiError.badRequest('Category and transaction amount are required');
    }

    const newTxn = store.addTransaction(
      payload.type || 'Credited',
      payload.category,
      payload.description || 'Manual ledger entry',
      Number(payload.amount),
      payload.paymentMethod || 'UPI'
    );

    store.logActivity('Manual Ledger Entry', `Logged ${newTxn.type} entry of ₹${newTxn.amount} for ${newTxn.category}.`);
    return newTxn;
  }

  // AI Power BI Dataset Report
  async getAiPowerBiReport() {
    return {
      reportTitle: "SPY Salon Executive Intelligence & Power BI Dataset",
      generatedAt: new Date().toISOString(),
      summaryMetrics: {
        grossRevenue: 284500,
        netProfit: 143700,
        payrollPayouts: 140800,
        staffUtilizationRate: "92.3%",
        customerRetentionRate: "88.0%"
      },
      categoryRevenueShare: [
        { category: 'Skin Care', revenue: 113800, share: '40%' },
        { category: 'Hair Care', revenue: 99575, share: '35%' },
        { category: 'Bridal', revenue: 42675, share: '15%' },
        { category: 'Nails & Barbering', revenue: 28450, share: '10%' }
      ]
    };
  }
}

module.exports = new AdminService();
