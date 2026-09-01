/**
 * Production Guest Booking Workflow & Auto-Account Processing Service
 * SPY Salon Enterprise System
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const { broadcastEvent } = require('../utils/socket');

class GuestBookingService {
  /**
   * Process Guest Booking Workflow
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

      // 1. DUPLICATE PREVENTION: Search existing customer in MongoDB
      let customer = await User.findOne({
        $or: [
          { email: cleanEmail },
          { phone: cleanPhone },
          { phone: new RegExp(phoneDigits + '$') }
        ]
      });

      let isNewAccountCreated = false;
      const crypto = require('crypto');
      const plainPassword = 'SPY-' + crypto.randomBytes(5).toString('hex').toUpperCase();
      const loginId = cleanEmail || cleanPhone;

      if (customer) {
        // Update stats on existing customer
        console.log(`[GuestBookingService] Matched existing customer account ID ${customer._id} for ${customerName}`);
        customer.visits = (customer.visits || 0) + 1;
        customer.totalSpent = (customer.totalSpent || 0) + Number(price || 0);
        await customer.save();

        await ActivityLog.create({
          action: 'Booking Linked to Customer',
          details: `Booking #${appointment?.bookingId} for ${customerName} linked to existing customer account (${customer.email}).`,
          user: 'System',
          branchId: appointment?.branchId || null
        });
      } else {
        // 2. AUTO CREATION: Create new customer account in MongoDB
        isNewAccountCreated = true;

        customer = await User.create({
          name: customerName ? customerName.trim() : 'Valued Guest',
          email: cleanEmail || `${phoneDigits || Date.now()}@spysalon.com`,
          phone: cleanPhone || '+91 98765 43210',
          password: plainPassword,
          role: 'customer',
          status: 'Active',
          totalSpent: Number(price || 0),
          visits: 1,
          membership: {
            status: 'Inactive',
            tier: 'Classic',
            code: 'classic',
            badge: '🥉 Classic Member',
            discountPercent: 0
          },
          branchId: appointment?.branchId || null
        });

        console.log(`[GuestBookingService] Automatically generated customer account ID ${customer._id} for ${customerName}`);
        await ActivityLog.create({
          action: 'Customer Account Created Automatically',
          details: `Guest booking triggered automatic customer registration for ${customerName} (${customer.email}).`,
          user: 'System',
          branchId: appointment?.branchId || null
        });
      }

      // Link Customer ID to Appointment Record
      if (appointment) {
        await Appointment.findByIdAndUpdate(appointment._id, {
          customerId: customer._id.toString()
        });
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
            await ActivityLog.create({
              action: 'Credentials Sent via Email',
              details: `Welcome credentials email dispatched to guest customer ${customerName} (${cleanEmail}).`,
              user: 'System',
              branchId: appointment?.branchId || null
            });
          } catch (emailErr) {
            console.error(`[GuestBookingService] Email dispatch failed for ${cleanEmail}:`, emailErr.message);
          }
        });
      }

      // 4. WHATSAPP & REALTIME ADMIN NOTIFICATIONS & SOCKET BROADCAST
      setImmediate(async () => {
        try {
          // Dispatch Admin Notification to MongoDB
          await Notification.create({
            role: 'admin',
            title: 'New Guest Booking Received 🛎️',
            message: `New ${isNewAccountCreated ? 'guest (auto-registered)' : 'returning'} customer booking #${appointment?.bookingId} for ${service} by ${customerName} (${cleanPhone}). Date: ${appointmentDate} at ${appointmentTime}.`,
            type: 'booking',
            branchId: appointment?.branchId || null
          }).catch(() => {});

          // Dispatch Customer Confirmed & Time Alert Notifications
          if (customerUser || cleanEmail || cleanPhone) {
            const customerUserId = customerUser ? customerUser._id.toString() : null;

            // 1. Customer Confirmed Notification
            await Notification.create({
              userId: customerUserId,
              email: cleanEmail,
              role: 'user',
              title: 'Appointment Confirmed! 🎉',
              message: `Dear ${customerName}, your appointment for ${service} (#${appointment?.bookingId || ''}) on ${appointmentDate} at ${appointmentTime} has been successfully booked.`,
              type: 'appointment',
              link: '/appointments',
              bookingId: appointment?.bookingId || null,
              appointmentId: appointment?._id?.toString() || null,
              branchId: appointment?.branchId || null
            }).catch(() => {});

            // 2. Customer Time Alert Notification
            await Notification.create({
              userId: customerUserId,
              email: cleanEmail,
              role: 'user',
              title: 'Upcoming Appointment Alert ⏰',
              message: `Time Alert: Your ${service} appointment is scheduled for ${appointmentDate} at ${appointmentTime} at ${branch || 'SPY Salon Jubilee Hills'}.`,
              type: 'appointment',
              link: '/appointments',
              bookingId: appointment?.bookingId || null,
              appointmentId: appointment?._id?.toString() || null,
              branchId: appointment?.branchId || null
            }).catch(() => {});
          }

          // Broadcast Realtime Socket Events to Admin Dashboards
          if (appointment) {
            broadcastEvent('appointment:new', appointment);
            
            // Recalculate stats and broadcast
            const stats = {
              totalAppointments: await Appointment.countDocuments(),
              activeEmployees: await Employee.countDocuments({ status: 'Active' }),
              totalCustomers: await User.countDocuments({ role: 'customer' })
            };
            broadcastEvent('stats:updated', stats);
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

          await ActivityLog.create({
            action: 'Admin Notification Sent',
            details: `Dashboard notifications dispatched for booking #${appointment?.bookingId || ''}.`,
            user: 'System',
            branchId: appointment?.branchId || null
          });
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
      return { success: false, error: error.message };
    }
  }
}

module.exports = new GuestBookingService();
