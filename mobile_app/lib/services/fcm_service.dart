import 'dart:async';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
    debugPrint('[FCM Service] Handling background message: ${message.messageId}');
  } catch (e) {
    debugPrint('[FCM Service] Background handler notice: $e');
  }
}

class FcmService {
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  static String? _currentToken;
  static bool _initialized = false;
  static GlobalKey<NavigatorState>? _navigatorKey;

  static void setNavigatorKey(GlobalKey<NavigatorState> key) {
    _navigatorKey = key;
  }

  /// Initialize Firebase Core, FCM, Notification Permissions & Local Notification Channels
  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      // 1. Initialize Firebase Core
      await Firebase.initializeApp();
      debugPrint('[FCM Service] Firebase Core initialized successfully.');

      // 2. Set Background Message Handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 3. Initialize Local Notifications for Foreground Alerts
      await _initLocalNotifications();

      // 4. Request Permissions (Android 13+ & iOS)
      await requestPermission();

      // 5. Setup Foreground & Background Click Listeners
      _setupListeners();

      // 6. Fetch Token & Register to Backend if Session Exists
      await syncTokenWithBackend();

      _initialized = true;
    } catch (e) {
      debugPrint('[FCM Service] Notice during FCM initialization: $e');
    }
  }

  /// Request Notification Permissions safely
  static Future<void> requestPermission() async {
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );
      debugPrint('[FCM Service] Notification permission status: ${settings.authorizationStatus}');
    } catch (e) {
      debugPrint('[FCM Service] Notification permission request notice: $e');
    }
  }

  /// Initialize Local Notifications Plugin for Foreground Alerts
  static Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const darwinSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (response.payload != null && response.payload!.isNotEmpty) {
          try {
            // Parse payload string or navigate
            handleNotificationNavigation({'type': response.payload});
          } catch (e) {
            debugPrint('[FCM Service] Error handling notification tap payload: $e');
          }
        }
      },
    );

    // Create high-priority Android Notification Channel
    const androidChannel = AndroidNotificationChannel(
      'spy_salon_notifications',
      'SPY Salon Push Notifications',
      description: 'Important notifications for appointments, bookings, and salon updates.',
      importance: Importance.high,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
  }

  /// Register listeners for Foreground, Background Tap, and Token Refresh events
  static void _setupListeners() {
    // A. Foreground Message Listener
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM Service] Foreground FCM message received: ${message.notification?.title}');

      final notification = message.notification;

      if (notification != null) {
        _showForegroundLocalNotification(
          id: message.hashCode,
          title: notification.title ?? 'SPY Salon Alert',
          body: notification.body ?? '',
          payload: message.data['type'] ?? 'general',
        );
      }
    });

    // B. Background App Open Listener (Tapped notification when app was in background)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[FCM Service] App opened from background push notification: ${message.data}');
      handleNotificationNavigation(message.data);
    });

    // C. Initial Message Listener (Tapped notification when app was completely terminated)
    FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        debugPrint('[FCM Service] App launched from terminated state via notification: ${message.data}');
        Future.delayed(const Duration(milliseconds: 1200), () {
          handleNotificationNavigation(message.data);
        });
      }
    });

    // D. Token Refresh Listener
    FirebaseMessaging.instance.onTokenRefresh.listen((String newToken) async {
      debugPrint('[FCM Service] FCM token refreshed: ${newToken.substring(0, 15)}...');
      _currentToken = newToken;
      await syncTokenWithBackend();
    });
  }

  /// Display Foreground Local Notification Banner
  static Future<void> _showForegroundLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'spy_salon_notifications',
      'SPY Salon Push Notifications',
      channelDescription: 'Important notifications for appointments, bookings, and salon updates.',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const darwinDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: darwinDetails,
    );

    await _localNotifications.show(id, title, body, notificationDetails, payload: payload);
  }

  /// Get current FCM Token safely
  static Future<String?> getToken() async {
    try {
      if (_currentToken != null) return _currentToken;
      _currentToken = await FirebaseMessaging.instance.getToken();
      return _currentToken;
    } catch (e) {
      debugPrint('[FCM Service] Error fetching FCM token: $e');
      return null;
    }
  }

  /// Sync device token to backend API
  static Future<void> syncTokenWithBackend() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) return;

      final platformName = Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'web');
      final user = await ApiService.getStoredUser();

      final res = await ApiService.registerFcmToken(
        token,
        platform: platformName,
        userId: user != null ? (user['_id'] ?? user['id']) : null,
        email: user != null ? user['email'] : null,
        role: user != null ? (user['role'] ?? 'customer') : 'customer',
      );

      if (res['success'] == true) {
        debugPrint('[FCM Service] Device token registered cleanly with backend.');
      }
    } catch (e) {
      debugPrint('[FCM Service] Sync token with backend warning: $e');
    }
  }

  /// Deactivate FCM token on Logout
  static Future<void> unregisterTokenOnLogout() async {
    try {
      if (_currentToken != null) {
        await ApiService.unregisterFcmToken(_currentToken!);
      }
    } catch (e) {
      debugPrint('[FCM Service] Unregister token warning: $e');
    }
  }

  /// Handle Notification Click Navigation to targeted screens/tabs
  static void handleNotificationNavigation(Map<String, dynamic> data) {
    try {
      final type = (data['type'] ?? data['screen'] ?? '').toString().toLowerCase();
      debugPrint('[FCM Service] Navigating based on notification payload type: "$type"');

      final context = _navigatorKey?.currentContext;
      if (context == null) return;

      // Routing logic based on payload data type
      switch (type) {
        case 'appointment':
        case 'booking':
        case 'reminder':
          // Existing screens handle detailed view or dashboard tab switching
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['title'] != null ? '${data['title']}: ${data['body'] ?? ''}' : 'Opening Appointment Details...'),
              backgroundColor: const Color(0xFFE0A96D),
              duration: const Duration(seconds: 4),
            ),
          );
          break;
        case 'leave':
        case 'attendance':
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['title'] != null ? '${data['title']}: ${data['body'] ?? ''}' : 'Opening Staff Management...'),
              backgroundColor: const Color(0xFFC8868F),
              duration: const Duration(seconds: 4),
            ),
          );
          break;
        default:
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['title'] != null ? '${data['title']}: ${data['body'] ?? ''}' : 'Notification received'),
              backgroundColor: const Color(0xFF191512),
              duration: const Duration(seconds: 3),
            ),
          );
          break;
      }
    } catch (e) {
      debugPrint('[FCM Service] Error during notification navigation: $e');
    }
  }
}
