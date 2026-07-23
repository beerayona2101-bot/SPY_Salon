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

module.exports = {
  sendEmployeeCredentialsEmail,
  sendPasswordResetOtpEmail
};
