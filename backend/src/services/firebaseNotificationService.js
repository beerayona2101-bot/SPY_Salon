/**
 * SPY Salon Firebase Cloud Messaging (FCM) Notification Service
 * Dedicated strictly to mobile push notification delivery via Firebase Admin SDK.
 * Does NOT replace or alter existing DB/Socket.IO notifications.
 */

const admin = require('firebase-admin');
const DeviceToken = require('../models/DeviceToken');

let firebaseApp = null;
let isFirebaseInitialized = false;

/**
 * Safely initialize Firebase Admin SDK using Environment Variables or Service Account
 */
const initFirebase = () => {
  if (isFirebaseInitialized) return firebaseApp;

  try {
    const getCert = (account) => {
      if (admin.credential && typeof admin.credential.cert === 'function') {
        return admin.credential.cert(account);
      }
      if (typeof admin.cert === 'function') {
        return admin.cert(account);
      }
      return null;
    };

    // 1. Check for Service Account File Path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      firebaseApp = admin.initializeApp({
        credential: getCert(serviceAccount)
      });
      isFirebaseInitialized = true;
      console.log('[FCM Service] Initialized successfully via Service Account JSON.');
      return firebaseApp;
    }

    // 2. Check for Environment Variables (Project ID, Client Email, Private Key)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Unescape line breaks, strip CRLF carriage returns, and strip surrounding quotes in private key
      if (typeof privateKey === 'string') {
        privateKey = privateKey.trim();
        if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
          privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        privateKey = privateKey.replace(/\r/g, '').replace(/\\n/g, '\n').trim();
      }

      firebaseApp = admin.initializeApp({
        credential: getCert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      isFirebaseInitialized = true;
      console.log('[FCM Service] Initialized successfully via Environment Variables.');
      return firebaseApp;
    }

    console.warn('[FCM Service] Notice: Firebase credentials not set in environment (FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY). Push notifications will run in mock mode.');
  } catch (err) {
    console.error('[FCM Service] Error initializing Firebase Admin SDK:', err.message);
  }

  return null;
};

// Auto-run initialization check on module load
initFirebase();

/**
 * Handle invalid or expired FCM registration tokens
 */
const handleInvalidToken = async (fcmToken) => {
  try {
    if (!fcmToken) return;
    await DeviceToken.updateMany({ fcmToken }, { isActive: false });
    console.log(`[FCM Service] Deactivated invalid token: ${fcmToken.substring(0, 15)}...`);
  } catch (err) {
    console.error('[FCM Service] Error deactivating invalid token:', err.message);
  }
};

/**
 * Send push notification to a single FCM registration token
 */
const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (!token) return { success: false, error: 'No token provided' };

  if (!isFirebaseInitialized) {
    initFirebase();
    if (!isFirebaseInitialized) {
      console.log(`[FCM Service Mock] Would send push to token ${token.substring(0, 12)}... | Title: "${title}"`);
      return { success: true, mock: true };
    }
  }

  try {
    const stringData = {};
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        stringData[key] = String(data[key]);
      }
    }

    const message = {
      token,
      notification: {
        title: title || 'SPY Salon Update',
        body: body || ''
      },
      data: stringData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'spy_salon_notifications',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            contentAvailable: true
          }
        }
      }
    };

    const getMessagingInstance = () => {
      if (admin.messaging && typeof admin.messaging === 'function') {
        return admin.messaging();
      }
      const { getMessaging } = require('firebase-admin/messaging');
      return getMessaging(firebaseApp);
    };

    const response = await getMessagingInstance().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('[FCM Service] Error sending FCM message:', error.code || error.message);

    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/invalid-argument' ||
      error.message?.includes('not registered') ||
      error.message?.includes('invalid')
    ) {
      await handleInvalidToken(token);
    }

    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to a specific User (by userId or email)
 */
const sendPushNotificationToUser = async ({ userId, email, title, body, data = {} }) => {
  try {
    const queryOr = [];
    if (userId) queryOr.push({ userId: String(userId) });
    if (email) queryOr.push({ email: String(email).toLowerCase().trim() });

    if (queryOr.length === 0) return { success: false, reason: 'No userId or email provided' };

    const activeTokens = await DeviceToken.find({
      $or: queryOr,
      isActive: true
    }).lean();

    if (!activeTokens || activeTokens.length === 0) {
      return { success: true, sentCount: 0, reason: 'No active device tokens found' };
    }

    const promises = activeTokens.map(dt =>
      sendPushNotification({ token: dt.fcmToken, title, body, data })
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    return { success: true, sentCount: successCount, totalDevices: activeTokens.length };
  } catch (err) {
    console.error('[FCM Service] Error sending push to user:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send push notification to multiple users
 */
const sendPushNotificationToUsers = async ({ userIds = [], emails = [], title, body, data = {} }) => {
  try {
    const queryOr = [];
    userIds.forEach(id => queryOr.push({ userId: String(id) }));
    emails.forEach(e => queryOr.push({ email: String(e).toLowerCase().trim() }));

    if (queryOr.length === 0) return { success: false, reason: 'No users specified' };

    const activeTokens = await DeviceToken.find({
      $or: queryOr,
      isActive: true
    }).lean();

    if (!activeTokens || activeTokens.length === 0) {
      return { success: true, sentCount: 0 };
    }

    const promises = activeTokens.map(dt =>
      sendPushNotification({ token: dt.fcmToken, title, body, data })
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    return { success: true, sentCount: successCount, totalDevices: activeTokens.length };
  } catch (err) {
    console.error('[FCM Service] Error sending push to multiple users:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send push notification to all active devices of a given role (e.g., 'admin', 'employee', 'customer')
 */
const sendPushNotificationToRole = async ({ role, title, body, data = {} }) => {
  try {
    const roleQuery = role === 'admin'
      ? { role: { $in: ['admin', 'manager'] }, isActive: true }
      : { role, isActive: true };

    const activeTokens = await DeviceToken.find(roleQuery).lean();

    if (!activeTokens || activeTokens.length === 0) {
      return { success: true, sentCount: 0 };
    }

    const promises = activeTokens.map(dt =>
      sendPushNotification({ token: dt.fcmToken, title, body, data })
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    return { success: true, sentCount: successCount, totalDevices: activeTokens.length };
  } catch (err) {
    console.error('[FCM Service] Error sending push to role:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  initFirebase,
  sendPushNotification,
  sendPushNotificationToUser,
  sendPushNotificationToUsers,
  sendPushNotificationToRole
};
