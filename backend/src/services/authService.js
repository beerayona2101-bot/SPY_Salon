/**
 * Authentication & JWT Refresh Token Service
 * Supports login via Email Address, Mobile Phone Number, Username, or Employee Code.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const Employee = require('../models/Employee');
const RefreshToken = require('../models/RefreshToken');
const Otp = require('../models/Otp');
const emailService = require('./emailService');
const smsService = require('./smsService');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

class AuthService {
  // Generate Access Token (Short-Lived 15m)
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
        branchId: user.branchId || null
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );
  }

  // Generate Refresh Token (Long-Lived 7d)
  generateRefreshToken(user) {
    return jwt.sign(
      { 
        id: user._id || user.id,
        jti: crypto.randomBytes(16).toString('hex')
      },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRE }
    );
  }

  // Hash helper for OTPs and Tokens
  hashOtp(otp) {
    return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
  }

  hashToken(token) {
    if (!token) return null;
    return crypto.createHash('sha256').update(String(token)).digest('hex');
  }

  // Parse Client User Agent
  parseUserAgent(ua) {
    if (!ua) {
      return { deviceType: 'Desktop', browser: 'Unknown Browser', os: 'Unknown OS' };
    }
    let deviceType = 'Desktop';
    if (/mobile/i.test(ua)) deviceType = 'Mobile';
    else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

    let browser = 'Chrome';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/opr|opera/i.test(ua)) browser = 'Opera';
    else if (/chrome/i.test(ua)) browser = 'Chrome';

    let os = 'Windows';
    if (/mac/i.test(ua)) os = 'macOS';
    else if (/win/i.test(ua)) os = 'Windows';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    return { deviceType, browser, os };
  }

  // Helper to Create Session Record in MongoDB
  async createSessionRecord(user, refreshToken, reqMeta = {}) {
    const expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + 7);

    const uaInfo = this.parseUserAgent(reqMeta.userAgent);
    const clientIp = reqMeta.ipAddress || reqMeta.ip || '127.0.0.1';

    return await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: expiresAtDate,
      deviceType: uaInfo.deviceType,
      browser: uaInfo.browser,
      os: uaInfo.os,
      ipAddress: clientIp,
      userAgent: reqMeta.userAgent || '',
      createdByIp: clientIp,
      lastActiveAt: new Date(),
      isRevoked: false
    });
  }

  // Login Authentication Handler (Email or Mobile Phone Number)
  async login(identifier, password, role, reqMeta = {}) {
    if (!identifier || !password) {
      throw ApiError.badRequest('Please provide your email address, employee code, or mobile number and password');
    }

    const input = String(identifier).trim().toLowerCase();

    // Check if input is an Employee Code (e.g. EMP-1001)
    let searchEmail = input;
    if (input.startsWith('emp-') || input.startsWith('emp')) {
      const empDoc = await Employee.findOne({ empCode: new RegExp(`^${input}$`, 'i') });
      if (empDoc && empDoc.email) {
        searchEmail = empDoc.email.toLowerCase().trim();
      }
    }
    
    // Find User in MongoDB (Include password for checking)
    let user = await User.findOne({
      $or: [
        { email: searchEmail },
        { email: input },
        { phone: input },
        { phone: new RegExp(input.replace(/[^0-9]/g, '') + '$') }
      ]
    }).select('+password');

    // If user account is not found in MongoDB users collection, deny access
    if (!user) {
      throw ApiError.badRequest('No registered account found with these credentials. Please check your login details or contact Admin.');
    }

    // Verify Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw ApiError.badRequest('Invalid password. Please check your password or reset it.');
    }

    // Check Status
    if (user.status === 'Inactive') {
      throw ApiError.badRequest('Your account is currently deactivated. Please contact support.');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Save Refresh Session Record in MongoDB
    await this.createSessionRecord(user, refreshToken, reqMeta);

    // Log Activity
    await ActivityLog.create({
      action: 'User Logged In',
      details: `${user.name} (${user.role}) logged in successfully.`,
      user: user.name,
      branchId: user.branchId || null
    });

    // Remove password before returning
    user.password = undefined;

    return { user, token: accessToken, refreshToken };
  }

  // Dedicated Public Customer Account Registration
  async register(name, email, phone, password, reqMeta = {}) {
    if (!name || (!email && !phone) || !password) {
      throw ApiError.badRequest('Please provide your full name, email address or phone number, and password.');
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanPhone = phone ? String(phone).trim() : '';

    if (cleanEmail === 'admin@spysalon.com' || cleanEmail.includes('admin')) {
      throw ApiError.badRequest('This email address is reserved for administrator access.');
    }

    // Check duplicate email
    if (cleanEmail) {
      const emailExists = await User.findOne({ email: cleanEmail });
      if (emailExists) {
        throw ApiError.badRequest('An account with this email address already exists.');
      }
    }

    // Check duplicate phone
    if (cleanPhone) {
      const phoneExists = await User.findOne({ phone: cleanPhone });
      if (phoneExists) {
        throw ApiError.badRequest('An account with this phone number already exists.');
      }
    }

    // Create User record in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail || `${cleanPhone.replace(/\D/g, '')}@spysalon.com`,
      phone: cleanPhone,
      password: password,
      role: 'customer',
      isVerified: true
    });

    const accessToken = this.generateAccessToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser);

    // Store Session
    await this.createSessionRecord(newUser, refreshToken, reqMeta);

    await ActivityLog.create({
      action: 'New Customer Registered',
      details: `Customer account registered for ${newUser.name} (${newUser.email}).`,
      user: newUser.name
    });

    newUser.password = undefined;

    return { user: newUser, token: accessToken, refreshToken };
  }

  // Request Password Reset OTP
  async requestPasswordReset(email) {
    if (!email || !email.includes('@')) {
      throw ApiError.badRequest('Please enter a valid email address.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw ApiError.badRequest('No account associated with this email address was found.');
    }

    // Generate 6-digit numeric OTP code
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any active OTP requests for this identifier first
    await Otp.deleteMany({ identifier: cleanEmail, purpose: 'reset-password' });

    // Save dynamic OTP to database
    await Otp.create({
      identifier: cleanEmail,
      hashedOtp,
      expiresAt,
      purpose: 'reset-password'
    });

    // Send OTP via Nodemailer
    try {
      await emailService.sendPasswordResetOtpEmail({
        email: cleanEmail,
        name: user.name,
        otp
      });
      console.log(`[authService] Password reset OTP sent to ${cleanEmail}: ${otp}`);
    } catch (err) {
      console.warn(`[authService] Nodemailer error sending OTP to ${cleanEmail}:`, err.message);
    }

    // Return success without OTP token in response
    return {
      success: true,
      message: `Password reset 6-digit OTP code has been dispatched. Please check your email inbox.`
    };
  }

  // Reset Password using Verified OTP
  async resetPasswordWithOtp(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      throw ApiError.badRequest('Please provide email address, 6-digit OTP code, and new password');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw ApiError.badRequest('Account not found.');
    }

    // Validate OTP against MongoDB record
    const hashedInputOtp = this.hashOtp(otp);
    const otpRecord = await Otp.findOne({
      identifier: cleanEmail,
      hashedOtp: hashedInputOtp,
      purpose: 'reset-password'
    });

    if (!otpRecord) {
      throw ApiError.badRequest('Invalid 6-digit OTP code. Please check your email inbox.');
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw ApiError.badRequest('OTP code has expired. Please request a new password reset.');
    }

    // Update password (triggers UserSchema pre-save hashing automatically)
    user.password = newPassword;
    await user.save();

    // Clean up OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    // Revoke all existing refresh sessions for security
    await RefreshToken.updateMany(
      { user: user._id, isRevoked: false },
      { $set: { isRevoked: true, revokedAt: new Date() } }
    );

    await ActivityLog.create({
      action: 'Password Reset Completed',
      details: `Password successfully updated for ${cleanEmail} via OTP verification. All other active sessions revoked.`,
      user: user.name,
      branchId: user.branchId || null
    });

    return {
      success: true,
      message: 'Your password has been successfully updated! You can now sign in with your new password.'
    };
  }

  // Refresh Session Token Handler (Enforces Token Rotation and security verification)
  async refreshToken(token, reqMeta = {}) {
    if (!token) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    try {
      // 1. Verify Signature
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      const tokenHash = this.hashToken(token);

      // 2. Find Refresh Token Record in MongoDB
      const tokenRecord = await RefreshToken.findOne({
        $or: [{ token }, { tokenHash }]
      });

      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
        throw ApiError.unauthorized('Invalid, expired, or revoked refresh token');
      }

      // 3. Find User
      const user = await User.findById(decoded.id);
      if (!user || user.status === 'Inactive') {
        throw ApiError.unauthorized('User account associated with this token is invalid or inactive');
      }

      // 4. Generate New Tokens (Rotate Refresh Token)
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // 5. Update old token record as replaced/revoked
      tokenRecord.isRevoked = true;
      tokenRecord.revokedAt = new Date();
      tokenRecord.replacedByToken = newRefreshToken;
      tokenRecord.lastActiveAt = new Date();
      await tokenRecord.save();

      // 6. Create new active refresh token record with metadata
      await this.createSessionRecord(user, newRefreshToken, reqMeta);

      user.password = undefined;

      return { token: newAccessToken, refreshToken: newRefreshToken, user };
    } catch (e) {
      if (e && e.statusCode) throw e;
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  // Send OTP for Login (Auto-registers new clients seamlessly if not found)
  async sendLoginOtp(identifier) {
    if (!identifier) {
      throw ApiError.badRequest('Please provide your email address or mobile number');
    }

    const input = String(identifier).trim().toLowerCase();
    
    // Find User in MongoDB
    let user = await User.findOne({
      $or: [
        { email: input },
        { phone: input },
        { phone: new RegExp(input.replace(/[^0-9]/g, '') + '$') }
      ]
    });

    // If user is not found, seamlessly auto-create Customer profile so OTP login auto-registers them!
    if (!user) {
      const isEmail = input.includes('@');
      const cleanPhone = isEmail ? '' : input.trim();
      const cleanEmail = isEmail ? input.trim() : `${input.replace(/\D/g, '')}@spysalon.com`;
      const displayName = isEmail ? input.split('@')[0] : `Client ${input.slice(-4)}`;

      user = await User.create({
        name: displayName,
        email: cleanEmail,
        phone: cleanPhone || input,
        password: crypto.randomBytes(8).toString('hex'),
        role: 'customer',
        isVerified: true
      });
      
      await ActivityLog.create({
        action: 'Auto Registered via OTP',
        details: `Auto-created customer profile for ${user.name} via OTP sign in.`,
        user: user.name
      });
    }

    // Generate 6-digit dynamic numeric OTP code
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any active login OTP requests for this identifier first
    await Otp.deleteMany({ identifier: user.email, purpose: 'login' });
    if (user.phone) {
      await Otp.deleteMany({ identifier: user.phone, purpose: 'login' });
    }

    // Save to database
    await Otp.create({
      identifier: user.email,
      hashedOtp,
      expiresAt,
      purpose: 'login'
    });

    // Send OTP via SMS & Email
    let smsResult = { sent: false };
    const targetPhone = user.phone || input;
    if (targetPhone && !targetPhone.includes('@')) {
      smsResult = await smsService.sendOtpSms(targetPhone, otp);
    }

    try {
      if (user.email && user.email.includes('@')) {
        await emailService.sendPasswordResetOtpEmail({
          email: user.email,
          name: user.name,
          otp
        });
        console.log(`[authService] Login OTP sent to ${user.email}: ${otp}`);
      }
    } catch (err) {
      console.warn(`[authService] Nodemailer error sending login OTP to ${user.email}:`, err.message);
    }

    const isRealSmsSent = smsResult.sent === true;
    const msg = isRealSmsSent
        ? `A 6-digit OTP code has been sent to your mobile number +91 ${targetPhone.slice(-4)}!`
        : `A 6-digit OTP code has been dispatched. Please check your inbox or server console.`;

    return {
      success: true,
      message: msg
    };
  }

  // Verify Login OTP
  async verifyLoginOtp(identifier, otp, reqMeta = {}) {
    if (!identifier || !otp) {
      throw ApiError.badRequest('Please provide email/phone and 6-digit OTP code');
    }

    const input = String(identifier).trim().toLowerCase();
    let user = await User.findOne({
      $or: [
        { email: input },
        { phone: input },
        { phone: new RegExp(input.replace(/[^0-9]/g, '') + '$') }
      ]
    });

    if (!user) {
      throw ApiError.badRequest('Account not found. Please request a new OTP code.');
    }

    // Validate OTP against MongoDB record
    const hashedInputOtp = this.hashOtp(otp);
    const otpRecord = await Otp.findOne({
      $or: [
        { identifier: user.email },
        { identifier: user.phone },
        { identifier: input }
      ],
      hashedOtp: hashedInputOtp,
      purpose: 'login'
    });

    if (!otpRecord) {
      throw ApiError.badRequest('Invalid 6-digit OTP code. Please check your inbox.');
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw ApiError.badRequest('OTP code has expired. Please request a new code.');
    }

    // Clean up OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Save Session Record
    await this.createSessionRecord(user, refreshToken, reqMeta);

    // Log Activity
    await ActivityLog.create({
      action: 'User Logged In via OTP',
      details: `${user.name} (${user.role}) logged in successfully via OTP verification.`,
      user: user.name,
      branchId: user.branchId || null
    });

    user.password = undefined;

    return { user, token: accessToken, refreshToken };
  }

  // Get Active User Sessions
  async getActiveSessions(userId, currentRefreshToken = null) {
    if (!userId) throw ApiError.unauthorized('User ID is required');

    const currentHash = currentRefreshToken ? this.hashToken(currentRefreshToken) : null;

    const sessions = await RefreshToken.find({
      user: userId,
      isRevoked: { $ne: true },
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActiveAt: -1 });

    return sessions.map(s => ({
      id: s._id.toString(),
      sessionId: s._id.toString(),
      deviceType: s.deviceType || 'Desktop',
      browser: s.browser || 'Browser',
      os: s.os || 'OS',
      ipAddress: s.ipAddress || s.createdByIp || '127.0.0.1',
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt || s.createdAt,
      isCurrent: (s.token === currentRefreshToken) || (currentHash && s.tokenHash === currentHash),
      status: 'Active'
    }));
  }

  // Revoke an individual session by ID
  async revokeSession(userId, sessionId) {
    if (!userId || !sessionId) {
      throw ApiError.badRequest('User ID and Session ID are required');
    }

    const session = await RefreshToken.findOne({ _id: sessionId, user: userId });
    if (!session) {
      throw ApiError.notFound('Session record not found or not owned by user');
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();

    return { success: true, message: 'Session revoked successfully' };
  }

  // Logout from all devices
  async logoutAll(userId, currentRefreshToken = null) {
    if (!userId) throw ApiError.unauthorized('User ID is required');

    const query = { user: userId, isRevoked: false };
    if (currentRefreshToken) {
      const currentHash = this.hashToken(currentRefreshToken);
      query.$and = [
        { token: { $ne: currentRefreshToken } },
        { tokenHash: { $ne: currentHash } }
      ];
    }

    await RefreshToken.updateMany(query, {
      $set: { isRevoked: true, revokedAt: new Date() }
    });

    return { success: true, message: 'Logged out from all other devices successfully' };
  }

  // Logout/Revocation Handler (Idempotent)
  async logout(token) {
    if (token) {
      const hash = this.hashToken(token);
      await RefreshToken.updateMany(
        { $or: [{ token }, { tokenHash: hash }] },
        { $set: { isRevoked: true, revokedAt: new Date() } }
      );
    }
    return { success: true };
  }
}

module.exports = new AuthService();
