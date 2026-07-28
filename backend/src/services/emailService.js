/**
 * Production Email Service using Nodemailer
 * SPY Salon Enterprise API
 */
const nodemailer = require('nodemailer');

/**
 * Dynamically get Nodemailer Transporter with current SMTP environment settings
 */
const getTransporter = () => {
  const user = process.env.SMTP_USER || 'beerayona143@gmail.com';
  const pass = (process.env.SMTP_PASS || 'pommmyimeqadzxxk').replace(/\s+/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

/**
 * Send Employee Welcome Credentials Email
 */
const sendEmployeeCredentialsEmail = async ({ email, name, username, tempPassword, empCode }) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"SPY Salon Admin" <beerayona143@gmail.com>';
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b090a; color: #f8f9fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #161214; border: 1px solid #d4af37; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .logo-header { text-align: center; margin-bottom: 24px; }
        .title { color: #f4c2c2; font-size: 24px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .subtitle { color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 24px; }
        .card { background: #221c1f; border-left: 4px solid #f4c2c2; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cred-item { margin: 10px 0; font-size: 14px; }
        .label { color: #a1a1aa; font-weight: 600; }
        .val { color: #ffffff; font-family: monospace; font-weight: bold; }
        .btn { display: block; width: 220px; margin: 28px auto 10px auto; padding: 14px; background: linear-gradient(135deg, #f4c2c2 0%, #d4af37 100%); color: #0b090a; text-align: center; font-weight: bold; text-decoration: none; border-radius: 30px; font-size: 14px; }
        .footer { text-align: center; font-size: 12px; color: #71717a; margin-top: 30px; border-t: 1px solid #27272a; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-header">
          <h1 style="color:#d4af37; margin:0; font-family:serif;">SPY SALON</h1>
          <span style="color:#a1a1aa; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Luxury Beauty Studio</span>
        </div>
        
        <div class="title">Welcome to the SPY Salon Team!</div>
        <div class="subtitle">Hello <strong>${name}</strong>, your employee portal account has been officially registered.</div>

        <div class="card">
          <div class="cred-item"><span class="label">Employee Code:</span> <span class="val">${empCode || 'EMP-1001'}</span></div>
          <div class="cred-item"><span class="label">Registered Email:</span> <span class="val">${email}</span></div>
          <div class="cred-item"><span class="label">Username:</span> <span class="val">${username || email}</span></div>
          <div class="cred-item"><span class="label">Portal Password:</span> <span class="val">${tempPassword}</span></div>
        </div>

        <p style="font-size:13px; color:#d4d4d8; text-align:center;">
          Please sign in using your portal password and update your profile from your staff portal.
        </p>

        <a href="${loginUrl}" class="btn">Sign In to Staff Portal</a>

        <div class="footer">
          SPY Salon Enterprise System &bull; Confidential Account Notice
        </div>
      </div>
    </body>
    </html>
  `;

  const recipientEmail = String(email || '').trim().toLowerCase();
  console.log(`[EmailService] Dispatching welcome credentials email to employee recipient: ${recipientEmail}`);

  try {
    const info = await transporter.sendMail({
      from,
      to: recipientEmail,
      subject: '🔐 Welcome to SPY Salon - Your Staff Account Credentials',
      html
    });
    console.log(`[EmailService] Credentials email sent successfully to employee recipient ${recipientEmail} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send credentials email to employee recipient ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send 6-Digit Password Reset OTP Email
 */
const sendPasswordResetOtpEmail = async ({ email, name, otp }) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"SPY Salon Security" <beerayona143@gmail.com>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b090a; color: #f8f9fa; margin: 0; padding: 20px; }
        .container { max-width: 550px; margin: 0 auto; background: #161214; border: 1px solid #d4af37; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .logo-header { text-align: center; margin-bottom: 24px; }
        .title { color: #f4c2c2; font-size: 22px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .subtitle { color: #a1a1aa; font-size: 13px; text-align: center; margin-bottom: 24px; }
        .otp-box { text-align: center; background: #221c1f; border: 2px dashed #f4c2c2; padding: 20px; border-radius: 12px; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 800; font-family: monospace; letter-spacing: 8px; color: #d4af37; }
        .footer { text-align: center; font-size: 12px; color: #71717a; margin-top: 30px; border-t: 1px solid #27272a; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-header">
          <h1 style="color:#d4af37; margin:0; font-family:serif;">SPY SALON</h1>
          <span style="color:#a1a1aa; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Account Recovery</span>
        </div>
        
        <div class="title">Password Reset Verification Code</div>
        <div class="subtitle">Hello ${name || 'Valued User'}, we received a request to reset your password for your SPY Salon account.</div>

        <div class="otp-box">
          <div style="font-size:12px; color:#a1a1aa; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Your 6-Digit OTP</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size:11px; color:#f4c2c2; margin-top:8px;">Valid for 10 minutes &bull; Do not share with anyone</div>
        </div>

        <p style="font-size:12px; color:#a1a1aa; text-align:center;">
          If you did not request a password reset, please ignore this email or contact SPY Salon support immediately.
        </p>

        <div class="footer">
          SPY Salon Security Desk &bull; Automated Email System
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `🔑 ${otp} is your SPY Salon Password Reset OTP`,
      html
    });
    console.log(`[EmailService] Reset OTP email dispatched to ${email} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send OTP email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Customer Enquiry Confirmation Email
 */
const sendCustomerEnquiryConfirmation = async ({ email, name, enquiryId, message }) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"SPY Salon Concierge" <beerayona143@gmail.com>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b090a; color: #f8f9fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #161214; border: 1px solid #e8b4b8; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .logo-header { text-align: center; margin-bottom: 24px; }
        .title { color: #f4c2c2; font-size: 22px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .subtitle { color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 20px; }
        .card { background: #221c1f; border-left: 4px solid #f4c2c2; padding: 18px; border-radius: 8px; margin: 20px 0; }
        .item { margin: 8px 0; font-size: 14px; }
        .label { color: #a1a1aa; font-weight: 600; }
        .val { color: #ffffff; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #71717a; margin-top: 25px; border-top: 1px solid #27272a; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-header">
          <h1 style="color:#e8b4b8; margin:0; font-family:serif;">SPY SALON</h1>
          <span style="color:#a1a1aa; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Luxury Beauty Studio & Botanical Spa</span>
        </div>
        
        <div class="title">Thank You For Reaching Out</div>
        <div class="subtitle">Dear <strong>${name}</strong>, we have received your inquiry. Our senior concierge team will contact you shortly.</div>

        <div class="card">
          <div class="item"><span class="label">Reference Enquiry ID:</span> <span class="val" style="color:#e8b4b8; font-family:monospace;">${enquiryId}</span></div>
          <div class="item"><span class="label">Submitted Email:</span> <span class="val">${email}</span></div>
          <div class="item" style="margin-top:12px;"><span class="label">Your Message:</span></div>
          <div style="background:#141012; p:10px; border-radius:6px; color:#d4d4d8; font-style:italic; margin-top:4px; padding:10px; font-size:13px;">"${message}"</div>
        </div>

        <p style="font-size:13px; color:#a1a1aa; text-align:center;">For immediate assistance, call our Jubilee Hills Concierge Desk at <strong style="color:#ffffff;">+91 98765 43210</strong>.</p>

        <div class="footer">
          SPY Salon Jubilee Hills Studio &bull; Concierge & Support Desk
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `✨ SPY Salon Concierge: Inquiry Received (${enquiryId})`,
      html
    });
    console.log(`[EmailService] Customer confirmation email sent to ${email} (${enquiryId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send customer confirmation to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Admin Enquiry Notification Email
 */
const sendAdminEnquiryNotification = async ({ name, email, phone, message, enquiryId, createdAt }) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"SPY Salon Alert" <beerayona143@gmail.com>';
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER || 'beerayona143@gmail.com';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b090a; color: #f8f9fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #161214; border: 1px solid #d4af37; border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .title { color: #d4af37; font-size: 20px; font-weight: bold; margin-bottom: 6px; text-align: center; }
        .card { background: #221c1f; border-left: 4px solid #d4af37; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .item { margin: 6px 0; font-size: 13px; }
        .label { color: #a1a1aa; font-weight: 600; }
        .val { color: #ffffff; font-weight: bold; }
        .btn { display: inline-block; padding: 10px 20px; background: #d4af37; color: #0b090a; text-decoration: none; font-weight: bold; border-radius: 20px; font-size: 12px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="text-align:center; margin-bottom:15px;">
          <span style="color:#d4af37; font-weight:bold; font-size:12px; letter-spacing:1px; text-transform:uppercase;">🚨 NEW CUSTOMER INQUIRY</span>
        </div>
        <div class="title">Website Lead Received</div>

        <div class="card">
          <div class="item"><span class="label">Enquiry ID:</span> <span class="val" style="color:#d4af37; font-family:monospace;">${enquiryId}</span></div>
          <div class="item"><span class="label">Customer Name:</span> <span class="val">${name}</span></div>
          <div class="item"><span class="label">Email:</span> <span class="val">${email}</span></div>
          <div class="item"><span class="label">Phone:</span> <span class="val">${phone || 'Not Provided'}</span></div>
          <div class="item"><span class="label">Date & Time:</span> <span class="val">${createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()}</span></div>
          <div class="item" style="margin-top:10px;"><span class="label">Message Content:</span></div>
          <div style="background:#141012; p:10px; border-radius:6px; color:#e4e4e7; margin-top:4px; padding:10px; font-size:13px;">"${message}"</div>
        </div>

        <div style="text-align:center; margin-top:20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?tab=enquiries" class="btn">View in Executive Admin Portal →</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: adminEmail,
      subject: `📩 [ALERT] New Inquiry #${enquiryId} from ${name}`,
      html
    });
    console.log(`[EmailService] Admin enquiry alert sent to ${adminEmail} (${enquiryId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send admin enquiry alert:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Customer Enquiry Resolution / Thank You Email when status becomes Resolved or Closed
 */
const sendEnquiryResolutionEmail = async ({ email, name, enquiryId, status, adminNotes, message }) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"SPY Salon Support" <beerayona143@gmail.com>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b090a; color: #f8f9fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #161214; border: 1px solid #d4af37; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .logo-header { text-align: center; margin-bottom: 24px; }
        .title { color: #d4af37; font-size: 22px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .subtitle { color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 20px; }
        .card { background: #221c1f; border-left: 4px solid #d4af37; padding: 18px; border-radius: 8px; margin: 20px 0; }
        .item { margin: 8px 0; font-size: 14px; }
        .label { color: #a1a1aa; font-weight: 600; }
        .val { color: #ffffff; font-weight: bold; }
        .btn { display: block; width: 220px; margin: 24px auto 10px auto; padding: 12px; background: linear-gradient(135deg, #f4c2c2 0%, #d4af37 100%); color: #0b090a; text-align: center; font-weight: bold; text-decoration: none; border-radius: 30px; font-size: 13px; }
        .footer { text-align: center; font-size: 12px; color: #71717a; margin-top: 25px; border-top: 1px solid #27272a; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-header">
          <h1 style="color:#d4af37; margin:0; font-family:serif;">SPY SALON</h1>
          <span style="color:#a1a1aa; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Luxury Beauty Studio & Botanical Spa</span>
        </div>
        
        <div class="title">Inquiry Resolution & Thank You</div>
        <div class="subtitle">Dear <strong>${name}</strong>, your inquiry <strong>${enquiryId}</strong> has been officially <span style="color:#4ade80; font-weight:bold;">${status}</span>.</div>

        <div class="card">
          <div class="item"><span class="label">Reference Enquiry ID:</span> <span class="val" style="color:#d4af37; font-family:monospace;">${enquiryId}</span></div>
          <div class="item"><span class="label">Resolution Status:</span> <span class="val" style="color:#4ade80;">${status}</span></div>
          ${message ? `<div class="item" style="margin-top:10px;"><span class="label">Your Original Inquiry:</span></div><div style="background:#141012; padding:10px; border-radius:6px; color:#d4d4d8; font-style:italic; margin-top:4px; font-size:13px;">"${message}"</div>` : ''}
          ${adminNotes ? `<div class="item" style="margin-top:12px;"><span class="label">Concierge Summary / Admin Notes:</span></div><div style="background:#1c181b; border:1px solid #d4af37; padding:12px; border-radius:8px; color:#ffffff; margin-top:4px; font-size:13px; font-weight:500;">${adminNotes}</div>` : ''}
        </div>

        <p style="font-size:13px; color:#d4d4d8; text-align:center; line-height:1.6;">
          Thank you for choosing <strong>SPY Salon</strong>. We appreciate your interest in our luxury treatments and look forward to pampering you soon!
        </p>

        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/book" class="btn">Book Next Service Slot →</a>

        <div class="footer">
          SPY Salon Jubilee Hills Studio &bull; Concierge & Support Desk
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `✨ Update on Inquiry #${enquiryId} — Thank You for Reaching Out to SPY Salon`,
      html
    });
    console.log(`[EmailService] Resolution/Thank you email sent to ${email} (${enquiryId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send resolution email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Guest Welcome Credentials & Booking Confirmation Email
 */
const sendGuestWelcomeCredentialsEmail = async ({
  name,
  email,
  phone,
  loginId,
  password,
  bookingId,
  service,
  appointmentDate,
  appointmentTime
}) => {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"SPY Salon Guest Desk" <beerayona143@gmail.com>';
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b090a; color: #f8f9fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #161214; border: 1px solid #d4af37; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .logo-header { text-align: center; margin-bottom: 24px; }
        .title { color: #f4c2c2; font-size: 24px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .subtitle { color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 24px; }
        .card { background: #221c1f; border-left: 4px solid #d4af37; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cred-item { margin: 10px 0; font-size: 14px; }
        .label { color: #a1a1aa; font-weight: 600; }
        .val { color: #ffffff; font-family: monospace; font-weight: bold; }
        .btn { display: block; width: 240px; margin: 28px auto 10px auto; padding: 14px; background: linear-gradient(135deg, #f4c2c2 0%, #d4af37 100%); color: #0b090a; text-align: center; font-weight: bold; text-decoration: none; border-radius: 30px; font-size: 14px; }
        .footer { text-align: center; font-size: 12px; color: #71717a; margin-top: 30px; border-t: 1px solid #27272a; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-header">
          <h1 style="color:#d4af37; margin:0; font-family:serif;">SPY SALON</h1>
          <span style="color:#a1a1aa; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Luxury Beauty Studio</span>
        </div>
        
        <div class="title">Welcome to SPY Salon</div>
        <div class="subtitle">Dear <strong>${name}</strong>, thank you for booking with SPY Salon.</div>

        <p style="font-size:14px; color:#d4d4d8; line-height:1.6;">
          Your salon reservation <strong>#${bookingId || 'SPY'}</strong> for <strong>${service || 'Salon Treatment'}</strong> on <strong>${appointmentDate} at ${appointmentTime}</strong> has been confirmed.
        </p>

        <div class="card">
          <div style="color:#d4af37; font-weight:bold; font-size:15px; margin-bottom:12px;">Your Account Credentials</div>
          <div class="cred-item"><span class="label">User ID / Login ID:</span> <span class="val">${loginId || email || phone}</span></div>
          <div class="cred-item"><span class="label">Password:</span> <span class="val">${password || phone}</span></div>
          <div class="cred-item"><span class="label">Login Link:</span> <span class="val">${loginUrl}</span></div>
        </div>

        <p style="font-size:12px; color:#a1a1aa; text-align:center; font-style:italic;">
          For security, please log in and change your password after your first login.
        </p>

        <a href="${loginUrl}" class="btn">Sign In to Customer VIP Dashboard</a>

        <div class="footer">
          SPY Salon Jubilee Hills Studio &bull; Official Booking Credentials Notice
        </div>
      </div>
    </body>
    </html>
  `;

  const recipientEmail = String(email || '').trim().toLowerCase();
  console.log(`[EmailService] Dispatching guest welcome credentials email to ${recipientEmail}`);

  try {
    const info = await transporter.sendMail({
      from,
      to: recipientEmail,
      subject: `✨ Welcome to SPY Salon - Account Credentials & Booking Confirmation #${bookingId}`,
      html
    });
    console.log(`[EmailService] Guest credentials email sent successfully to ${recipientEmail} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send guest credentials email to ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmployeeCredentialsEmail,
  sendPasswordResetOtpEmail,
  sendCustomerEnquiryConfirmation,
  sendAdminEnquiryNotification,
  sendEnquiryResolutionEmail,
  sendGuestWelcomeCredentialsEmail
};
