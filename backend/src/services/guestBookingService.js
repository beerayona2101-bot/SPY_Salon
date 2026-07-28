/**
 * Production Guest Booking Workflow & Auto-Account Processing Service
 * SPY Salon Enterprise System
 */
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const notificationController = require('../controllers/notificationController');
const { broadcastEvent } = require('../utils/socket');
const User = require('../models/User');

class GuestBookingService {
  /**
   * Process Guest Booking Workflow Asynchronously
   * 1. Search existing customer by Email or Phone (Duplicate Prevention)
   * 2. Auto-create account if customer does not exist
   * 3. Link customer ID to booking
   * 4. Dispatch Email credentials & WhatsApp alerts
   * 5. Sync activity audit log & admin dashboard notifications
   */
  async processGuestBooking({
    appointment,
    customerName,
    customerEmail,
    customerPhone,
    service,
    branch,
    specialistName,
    appointmentDate,
    appointmentTime,
    paymentMethod,
    paymentStatus,
    price = 0
  }) {
    try {
      const cleanEmail = customerEmail ? String(customerEmail).trim().toLowerCase() : '';
      const cleanPhone = customerPhone ? String(customerPhone).trim() : '';
      const phoneDigits = cleanPhone.replace(/\D/g, '');

      console.log(`[GuestBookingService] Processing guest booking #${appointment?.bookingId || ''} for ${customerName} (${cleanPhone})`);

      // 1. DUPLICATE PREVENTION: Search existing customer by Email or Mobile Number
      let customer = store.customers.find(c => {
        const cEmail = (c.email || '').toLowerCase();
        const cPhone = (c.phone || '').replace(/\D/g, '');
        return (cleanEmail && cEmail === cleanEmail) ||
               (phoneDigits && phoneDigits.length >= 7 && cPhone.endsWith(phoneDigits));
      });

      let isNewAccountCreated = false;
      const plainPassword = cleanPhone || 'spysalon@123';
      const loginId = cleanEmail || cleanPhone;

      if (customer) {
        // Link booking to existing customer
        console.log(`[GuestBookingService] Matched existing customer account ID ${customer._id} for ${customerName}`);
        customer.visits = (customer.visits || 0) + 1;
        customer.totalSpent = (customer.totalSpent || 0) + Number(price || 0);
        if (!customer.visitedServices) customer.visitedServices = [];
        if (!customer.visitedServices.includes(service)) customer.visitedServices.push(service);
        customer.lastVisit = new Date().toISOString();

        store.logActivity(
          'Booking Linked to Customer',
          `Booking #${appointment?.bookingId} for ${customerName} linked to existing customer account (${customer.email || customer.phone}).`
        );
      } else {
        // 2. AUTO CREATION: Create new customer account
        isNewAccountCreated = true;
        const customerId = `cust_${Date.now()}`;

        customer = {
          _id: customerId,
          name: customerName ? customerName.trim() : 'Valued Guest',
          email: cleanEmail || `${phoneDigits || Date.now()}@spysalon.com`,
          phone: cleanPhone || '+91 98765 43210',
          password: plainPassword,
          role: 'customer',
          status: 'Active',
          registrationType: 'Guest Booking',
          requirePasswordChange: true,
          totalSpent: Number(price || 0),
          visits: 1,
          membershipTier: 'Classic Member',
          visitedServices: [service],
          favouriteServices: [service],
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString()
        };

        store.customers.unshift(customer);

        // Attempt MongoDB User sync in background if database connection is active
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(plainPassword, salt);

          await User.create({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            password: hashedPassword,
            role: 'customer',
            isVerified: true,
            createdAt: new Date()
          }).catch(() => {});
        } catch (dbErr) {
          // MongoDB silent fallback (in-memory store is fully active)
        }

        console.log(`[GuestBookingService] Automatically generated customer account ID ${customer._id} for ${customerName}`);
        store.logActivity(
          'Customer Account Created Automatically',
          `Guest booking triggered automatic customer registration for ${customerName} (${customer.email}). Registration Type: Guest Booking.`
        );
      }

      // Link Customer ID to Appointment Record
      if (appointment) {
        appointment.customerId = customer._id;
        appointment.registrationType = customer.registrationType || 'Guest Booking';
      }

      // 3. EMAIL CREDENTIALS DISPATCH (ASYNC)
      if (isNewAccountCreated && cleanEmail) {
        setImmediate(async () => {
          try {
            await emailService.sendGuestWelcomeCredentialsEmail({
              name: customerName,
              email: cleanEmail,
              phone: cleanPhone,
              loginId,
              password: plainPassword,
              bookingId: appointment?.bookingId || '',
              service,
              appointmentDate,
              appointmentTime
            });
            store.logActivity(
              'Credentials Sent via Email',
              `Welcome credentials email dispatched to guest customer ${customerName} (${cleanEmail}).`
            );
          } catch (emailErr) {
            console.error(`[GuestBookingService] Email dispatch failed for ${cleanEmail}:`, emailErr.message);
            store.logActivity(
              'Email Dispatch Warning',
              `Failed to send welcome credentials email to ${cleanEmail}: ${emailErr.message}`
            );
          }
        });
      }

      // 4. WHATSAPP & REALTIME ADMIN NOTIFICATIONS & SOCKET BROADCAST
      setImmediate(async () => {
        try {
          // Dispatch Admin Notification to MongoDB & Memory
          await notificationController.dispatchNotification(null, {
            notificationId: 'NOTIF-GUEST-' + Date.now(),
            role: 'admin',
            title: 'New Guest Booking Received 🛎️',
            message: `New ${isNewAccountCreated ? 'guest (auto-registered)' : 'returning'} customer booking #${appointment?.bookingId} for ${service} by ${customerName} (${cleanPhone}). Date: ${appointmentDate} at ${appointmentTime}. Payment: ${paymentStatus || 'Paid'}.`,
            type: 'booking',
            icon: 'Calendar',
            priority: 'high',
            link: '/admin?tab=appointments'
          });

          // Memory store fallback sync
          store.addNotification(
            'New Guest Booking Received 🛎️',
            `New ${isNewAccountCreated ? 'guest (auto-registered)' : 'returning'} customer booking #${appointment?.bookingId} for ${service} by ${customerName} (${cleanPhone}). Date: ${appointmentDate} at ${appointmentTime}. Payment: ${paymentStatus || 'Paid'}.`,
            'info',
            'Bell',
            'High'
          );

          // Broadcast Realtime Socket Events to Admin Dashboards
          if (appointment) {
            broadcastEvent('appointment:new', appointment);
            broadcastEvent('stats:updated', store.getAnalyticsStats());
          }

          // WhatsApp Notification to Customer & Admin
          if (cleanPhone) {
            await whatsappService.sendAppointmentConfirmation({
              customerName,
              customerPhone: cleanPhone,
              bookingId: appointment?.bookingId || 'SPY-BOOKING',
              service,
              branch: branch || 'Jubilee Hills Flagship',
              appointmentDate,
              appointmentTime,
              specialistName
            }).catch(() => {});
          }

          store.logActivity(
            'Admin Notification Sent',
            `Dashboard & WhatsApp notifications dispatched for booking #${appointment?.bookingId || ''}.`
          );
        } catch (notifErr) {
          console.warn('[GuestBookingService] Notification background dispatch notice:', notifErr.message);
        }
      });

      return {
        success: true,
        customerId: customer._id,
        isNewAccountCreated
      };
    } catch (error) {
      console.error('[GuestBookingService] Error processing guest booking:', error);
      store.logActivity('Guest Booking Processing Error', `Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new GuestBookingService();
