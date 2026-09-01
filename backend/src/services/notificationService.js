/**
 * SPY Salon Enterprise Notification Service
 * Orchestrates multi-channel notifications:
 * - Email Notifications (via emailService)
 * - Dashboard Real-time Notifications (via Socket.io & Notification Model)
 * - WhatsApp Notifications (via whatsappService)
 */

const { dispatchNotification } = require('../controllers/notificationController');
const { sendCustomerEnquiryConfirmation, sendAdminEnquiryNotification: sendAdminEmailNotification } = require('./emailService');
const whatsappService = require('./whatsappService');

/**
 * Handle all notifications associated with a newly submitted enquiry.
 * Trigger order:
 * 1. Form validation & DB Save (handled by enquiryService)
 * 2. Email notifications
 * 3. Dashboard + WhatsApp notifications (non-blocking)
 */
const handleEnquiryNotifications = async ({ enquiryRecord, app }) => {
  console.log(`[NotificationService] Processing multi-channel notifications for Enquiry #${enquiryRecord.enquiryId}`);

  // 1. Email Notifications (Customer Confirmation & Admin Email Alert)
  let emailResults = { customerEmail: false, adminEmail: false };
  try {
    const customerEmailRes = await sendCustomerEnquiryConfirmation({
      email: enquiryRecord.email,
      name: enquiryRecord.name,
      enquiryId: enquiryRecord.enquiryId,
      message: enquiryRecord.message
    });

    const adminEmailRes = await sendAdminEmailNotification({
      name: enquiryRecord.name,
      email: enquiryRecord.email,
      phone: enquiryRecord.phone,
      message: enquiryRecord.message,
      enquiryId: enquiryRecord.enquiryId,
      createdAt: enquiryRecord.createdAt
    });

    emailResults = {
      customerEmail: customerEmailRes?.success || false,
      adminEmail: adminEmailRes?.success || false
    };

    console.log(`[NotificationService] Email dispatches completed for Enquiry #${enquiryRecord.enquiryId}:`, emailResults);
  } catch (emailErr) {
    console.error(`[NotificationService] Email notification error for Enquiry #${enquiryRecord.enquiryId}:`, emailErr.message);
  }

  // 2. Real-Time Admin Dashboard Notification (Socket.io + Mongo/Store Save)
  let dashboardNotification = null;
  try {
    dashboardNotification = await dispatchNotification(app, {
      role: 'admin',
      title: `🚨 New Enquiry Received (#${enquiryRecord.enquiryId})`,
      message: `Customer ${enquiryRecord.name} (${enquiryRecord.phone || enquiryRecord.email}) submitted a new enquiry: "${enquiryRecord.message.substring(0, 60)}..."`,
      type: 'enquiry',
      priority: 'high',
      icon: 'bell',
      link: `/admin?tab=enquiries&id=${enquiryRecord.enquiryId}`
    });
    console.log(`[NotificationService] Admin dashboard notification dispatched for #${enquiryRecord.enquiryId}`);
  } catch (dashErr) {
    console.error(`[NotificationService] Dashboard notification error for Enquiry #${enquiryRecord.enquiryId}:`, dashErr.message);
  }

  // Also dispatch user receipt notification if email present
  if (enquiryRecord.email) {
    try {
      await dispatchNotification(app, {
        role: 'user',
        email: enquiryRecord.email.toLowerCase().trim(),
        title: `Inquiry Submitted #${enquiryRecord.enquiryId}`,
        message: `Your inquiry ${enquiryRecord.enquiryId} has been successfully received. Initial Status: "New". Our concierge team will review it shortly.`,
        type: 'enquiry',
        priority: 'normal',
        icon: 'bell'
      });
    } catch (uErr) {
      console.warn(`[NotificationService] Customer user notification error:`, uErr.message);
    }
  }

  // 3. WhatsApp Admin Notification & Customer Confirmation (Triggered ONLY after Email notifications stage)
  let whatsappResult = null;
  let customerWaResult = null;
  try {
    whatsappResult = await whatsappService.sendAdminEnquiryNotification({
      enquiryId: enquiryRecord.enquiryId,
      name: enquiryRecord.name,
      email: enquiryRecord.email,
      phone: enquiryRecord.phone,
      service: enquiryRecord.service || enquiryRecord.serviceName || 'General Enquiry',
      date: enquiryRecord.preferredDate || enquiryRecord.appointmentDate || 'N/A',
      time: enquiryRecord.preferredTime || enquiryRecord.appointmentTime || 'N/A',
      message: enquiryRecord.message,
      createdAt: enquiryRecord.createdAt
    });
    console.log(`[NotificationService] Admin WhatsApp notification dispatched for #${enquiryRecord.enquiryId}:`, whatsappResult);

    // Customer WhatsApp confirmation
    if (enquiryRecord.phone) {
      customerWaResult = await whatsappService.sendCustomerWhatsAppConfirmation({
        enquiryId: enquiryRecord.enquiryId,
        name: enquiryRecord.name,
        email: enquiryRecord.email,
        phone: enquiryRecord.phone,
        service: enquiryRecord.service || enquiryRecord.serviceName || 'General Enquiry',
        date: enquiryRecord.preferredDate || enquiryRecord.appointmentDate || 'N/A',
        time: enquiryRecord.preferredTime || enquiryRecord.appointmentTime || 'N/A',
        message: enquiryRecord.message
      });
      console.log(`[NotificationService] Customer WhatsApp confirmation dispatched for #${enquiryRecord.enquiryId}:`, customerWaResult);
    }
  } catch (waErr) {
    console.error(`[NotificationService] WhatsApp alert dispatch error for Enquiry #${enquiryRecord.enquiryId}:`, waErr.message);
  }

  return {
    enquiryId: enquiryRecord.enquiryId,
    emailsSent: emailResults,
    dashboardDispatched: Boolean(dashboardNotification),
    whatsappDispatched: whatsappResult,
    customerWhatsappDispatched: customerWaResult
  };
};

module.exports = {
  handleEnquiryNotifications,
  dispatchDashboardNotification: dispatchNotification
};
