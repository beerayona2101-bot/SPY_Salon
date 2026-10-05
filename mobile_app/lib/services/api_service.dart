import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'fcm_service.dart';

class ApiService {
  /// Probes current base URL directly first; falls back to candidate URLs in parallel if primary fails
  static Future<Map<String, dynamic>> checkHealth() async {
    await ApiConfig.loadSavedBaseUrl();

    // Fast path: probe active baseUrl directly first
    final primaryRes = await _probeUrl(ApiConfig.baseUrl);
    if (primaryRes['connected'] == true) {
      return primaryRes;
    }

    // Fallback: probe remaining candidates and return immediately on first success
    final candidates = ApiConfig.candidateUrls.where((u) => u != ApiConfig.baseUrl).toList();
    if (candidates.isEmpty) return primaryRes;

    final completer = Completer<Map<String, dynamic>>();
    int pending = candidates.length;

    for (final url in candidates) {
      _probeUrl(url).then((res) {
        if (!completer.isCompleted && res['connected'] == true) {
          ApiConfig.setActiveBaseUrl(res['url'] as String);
          completer.complete(res);
        } else {
          pending--;
          if (pending == 0 && !completer.isCompleted) {
            completer.complete(primaryRes);
          }
        }
      }).catchError((_) {
        pending--;
        if (pending == 0 && !completer.isCompleted) {
          completer.complete(primaryRes);
        }
      });
    }

    return completer.future.timeout(
      const Duration(milliseconds: 2000),
      onTimeout: () => primaryRes,
    );
  }

  static Future<Map<String, dynamic>> _probeUrl(String url) async {
    final probeEndpoints = [
      '$url/api/v1/health',
      '$url/health',
    ];

    for (final endpoint in probeEndpoints) {
      try {
        final response = await http
            .get(Uri.parse(endpoint))
            .timeout(const Duration(milliseconds: 1500));

        if (response.statusCode == 200 || response.statusCode == 201) {
          Map<String, dynamic> data = {};
          bool isJson = false;
          try {
            data = json.decode(response.body);
            isJson = true;
          } catch (_) {}

          final serviceName = (data['service'] ?? '').toString();
          final isSpySalon = isJson && (
            serviceName.toLowerCase().contains('spy salon') ||
            data['status'] == 'UP' ||
            data['success'] == true ||
            (data['data'] != null && data['data'] is List)
          );

          if (isSpySalon || response.statusCode == 200) {
            return {
              'connected': true,
              'status': data['status'] ?? 'UP',
              'service': data['service'] ?? 'SPY Salon Enterprise REST API',
              'timestamp': data['timestamp'],
              'url': url,
            };
          }
        } else if (response.statusCode == 401 || response.statusCode == 403) {
          return {
            'connected': true,
            'status': 'UP',
            'service': 'SPY Salon Enterprise REST API',
            'url': url,
          };
        }
      } catch (_) {}
    }

    return {
      'connected': false,
      'status': 'DOWN',
      'url': url,
    };
  }

  /// Public connection test method for Backend Settings Screen
  static Future<Map<String, dynamic>> testConnection(String rawUrl) async {
    final normalized = ApiConfig.normalizeUrl(rawUrl);
    final displayApi = '$normalized/api/v1';
    final stopwatch = Stopwatch()..start();

    final probeEndpoints = [
      '$normalized/api/v1/health',
      '$normalized/health',
      '$normalized/api/health',
      '$normalized/api/v1/services',
    ];

    for (final endpoint in probeEndpoints) {
      try {
        final response = await http
            .get(Uri.parse(endpoint))
            .timeout(const Duration(seconds: 4));

        if (response.statusCode == 200 || response.statusCode == 201) {
          stopwatch.stop();
          Map<String, dynamic> data = {};
          bool isJson = false;
          try {
            data = json.decode(response.body);
            isJson = true;
          } catch (_) {}

          final serviceName = (data['service'] ?? '').toString();
          final isSpySalon = isJson && (
            serviceName.toLowerCase().contains('spy salon') ||
            data['status'] == 'UP' ||
            data['success'] == true ||
            (data['data'] != null && data['data'] is List)
          );

          if (isSpySalon) {
            return {
              'connected': true,
              'statusCode': response.statusCode,
              'status': data['status'] ?? 'UP',
              'service': data['service'] ?? 'SPY Salon Enterprise REST API',
              'latencyMs': stopwatch.elapsedMilliseconds,
              'normalizedUrl': normalized,
              'displayApiUrl': displayApi,
              'endpoint': endpoint,
              'message': 'Server is reachable and healthy.',
            };
          }
        } else if (response.statusCode == 401 || response.statusCode == 403) {
          stopwatch.stop();
          return {
            'connected': true,
            'statusCode': response.statusCode,
            'status': 'REACHABLE',
            'service': 'SPY Salon Enterprise REST API',
            'latencyMs': stopwatch.elapsedMilliseconds,
            'normalizedUrl': normalized,
            'displayApiUrl': displayApi,
            'endpoint': endpoint,
            'message': 'Server is reachable (HTTP ${response.statusCode}).',
          };
        }
      } catch (_) {}
    }

    stopwatch.stop();
    return {
      'connected': false,
      'statusCode': 404,
      'status': 'Unreachable',
      'latencyMs': stopwatch.elapsedMilliseconds,
      'normalizedUrl': normalized,
      'displayApiUrl': displayApi,
      'message': 'Unable to connect to SPY Salon backend endpoints.',
    };
  }

  /// Updates active backend URL and handles cross-backend session cleanup
  static Future<bool> updateBackendUrl(String newUrl) async {
    final oldHost = Uri.tryParse(ApiConfig.baseUrl)?.host;
    final normalized = ApiConfig.normalizeUrl(newUrl);
    final newHost = Uri.tryParse(normalized)?.host;

    await ApiConfig.setActiveBaseUrl(normalized);

    // If host changed, clear old auth session to prevent cross-backend token contamination
    if (oldHost != null && newHost != null && oldHost != newHost) {
      await clearSession();
    }
    return true;
  }

  static Future<Map<String, String>> _getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token') ?? prefs.getString('auth_token') ?? prefs.getString('token');
    final headers = {'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Executes HTTP request with automatic retries for network/socket errors,
  /// timeout handling, non-sensitive debug logging, and token refresh exchange for 401 status.
  static Future<http.Response?> _requestWithRetry(
    String method,
    String url, {
    Map<String, String>? headers,
    Object? body,
    Duration timeout = const Duration(seconds: 10),
    int maxRetries = 2,
  }) async {
    int attempts = 0;
    http.Response? response;

    while (attempts <= maxRetries) {
      attempts++;
      final currentHeaders = headers ?? await _getAuthHeaders();
      try {
        final uri = Uri.parse(url);
        debugPrint('[ApiService] $method ${uri.path} (Attempt $attempts/${maxRetries + 1})');
        final Future<http.Response> reqFuture;

        switch (method.toUpperCase()) {
          case 'GET':
            reqFuture = http.get(uri, headers: currentHeaders);
            break;
          case 'POST':
            reqFuture = http.post(uri, headers: currentHeaders, body: body);
            break;
          case 'PUT':
            reqFuture = http.put(uri, headers: currentHeaders, body: body);
            break;
          case 'PATCH':
            reqFuture = http.patch(uri, headers: currentHeaders, body: body);
            break;
          case 'DELETE':
            reqFuture = http.delete(uri, headers: currentHeaders, body: body);
            break;
          default:
            reqFuture = http.get(uri, headers: currentHeaders);
        }

        response = await reqFuture.timeout(timeout);
        debugPrint('[ApiService] $method ${uri.path} -> Status ${response.statusCode}');

        if (response.statusCode == 401 && attempts == 1) {
          debugPrint('[ApiService] 401 Unauthorized encountered. Attempting refresh token exchange...');
          final refreshed = await tryRefreshToken();
          if (refreshed) {
            headers = await _getAuthHeaders();
            continue;
          } else {
            await _handle401();
            return response;
          }
        }

        if ((response.statusCode == 502 || response.statusCode == 503 || response.statusCode == 504) && attempts <= maxRetries) {
          await Future.delayed(Duration(milliseconds: 500 * attempts));
          continue;
        }

        return response;
      } catch (e) {
        debugPrint('[ApiService] $method $url failed on attempt $attempts (${e.runtimeType})');
        if (attempts == 1) {
          try {
            final probe = await checkHealth();
            if (probe['connected'] == true && probe['url'] != null) {
              final newBase = probe['url'] as String;
              final oldUri = Uri.parse(url);
              url = '$newBase${oldUri.path}${oldUri.hasQuery ? '?${oldUri.query}' : ''}';
            }
          } catch (_) {}
        }
        if (attempts <= maxRetries) {
          await Future.delayed(Duration(milliseconds: 300 * attempts));
        }
      }
    }
    return response;
  }

  /// Refreshes JWT access token using stored refresh_token
  static Future<bool> tryRefreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storedRefreshToken = prefs.getString('refresh_token');
      if (storedRefreshToken == null || storedRefreshToken.isEmpty) {
        debugPrint('[ApiService] Token refresh skipped: No stored refresh token.');
        return false;
      }

      debugPrint('[ApiService] Exchanging refresh token at POST /api/v1/auth/refresh');
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refreshToken': storedRefreshToken}),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final payload = data['data'] ?? data;
        final newToken = payload['token'];
        final newRefreshToken = payload['refreshToken'] ?? storedRefreshToken;
        final user = payload['user'];

        if (newToken != null && newToken.toString().isNotEmpty) {
          await prefs.setString('jwt_token', newToken);
          await prefs.setString('auth_token', newToken);
          if (newRefreshToken != null) {
            await prefs.setString('refresh_token', newRefreshToken.toString());
          }
          if (user != null) {
            await prefs.setString('user_data', json.encode(user));
          }
          debugPrint('[ApiService] Token refresh successful!');
          return true;
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Token refresh error: $e');
    }
    return false;
  }

  /// Handles 401 Unauthorized responses by clearing stale session tokens
  static Future<void> _handle401() async {
    await clearSession();
  }

  /// Sign In user with email/phone & password
  static Future<Map<String, dynamic>> login(String loginInput, String password) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        ApiConfig.loginUrl,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'identifier': loginInput,
          'password': password,
        }),
      );

      if (response == null) {
        return {'success': false, 'message': 'Network error: Connection failed after retries.'};
      }

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final payload = data['data'] ?? data;
        final token = payload['token'];
        final refreshToken = payload['refreshToken'] ?? data['refreshToken'];
        final user = payload['user'];
        if (token != null && user != null) {
          await saveSession(token, user, refreshToken: refreshToken);
        }
        return {'success': true, 'message': data['message'] ?? 'Login successful', 'user': user};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Invalid credentials'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  /// Request 6-digit OTP for Login / Auto-Registration
  static Future<Map<String, dynamic>> sendOTP(String identifier) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/auth/send-otp',
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'identifier': identifier, 'email': identifier, 'phone': identifier}),
      );

      if (response == null) {
        return {'success': false, 'message': 'Network error: Connection failed after retries.'};
      }

      final data = json.decode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'message': data['message'] ?? '6-digit OTP code dispatched successfully!'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Failed to send OTP'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  /// Verify 6-digit OTP for Login / Auto-Registration
  static Future<Map<String, dynamic>> verifyOTP(String identifier, String otp) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/auth/verify-otp',
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'identifier': identifier, 'email': identifier, 'phone': identifier, 'otp': otp}),
      );

      if (response == null) {
        return {'success': false, 'message': 'Network error: Connection failed after retries.'};
      }

      final data = json.decode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        final payload = data['data'] ?? data;
        final token = payload['token'];
        final refreshToken = payload['refreshToken'] ?? data['refreshToken'];
        final user = payload['user'];
        if (token != null && user != null) {
          await saveSession(token, user, refreshToken: refreshToken);
        }
        return {'success': true, 'message': data['message'] ?? 'OTP Verified successfully!', 'user': user};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Invalid OTP code'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  /// Create Account / Register user
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    bool termsAccepted = true,
    bool privacyPolicyAccepted = true,
    String termsVersion = '1.0',
    String privacyPolicyVersion = '1.0',
  }) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        ApiConfig.registerUrl,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'email': email,
          'phone': phone,
          'password': password,
          'termsAccepted': termsAccepted,
          'privacyPolicyAccepted': privacyPolicyAccepted,
          'termsVersion': termsVersion,
          'privacyPolicyVersion': privacyPolicyVersion,
        }),
      );

      if (response == null) {
        return {'success': false, 'message': 'Network error: Connection failed after retries.'};
      }

      final data = json.decode(response.body);

      if ((response.statusCode == 200 || response.statusCode == 201) && data['success'] == true) {
        final payload = data['data'] ?? data;
        final token = payload['token'];
        final refreshToken = payload['refreshToken'] ?? data['refreshToken'];
        final user = payload['user'];
        if (token != null && user != null) {
          await saveSession(token, user, refreshToken: refreshToken);
        }
        return {'success': true, 'message': data['message'] ?? 'Account created successfully!', 'user': user};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  /// Register FCM Device Token with Backend API
  static Future<Map<String, dynamic>> registerFcmToken(
    String fcmToken, {
    String platform = 'android',
    String? userId,
    String? email,
    String role = 'customer',
    String deviceId = '',
  }) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/notifications/device-token',
        body: json.encode({
          'fcmToken': fcmToken,
          'platform': platform,
          'userId': userId,
          'email': email,
          'role': role,
          'deviceId': deviceId,
        }),
      );

      if (response != null && (response.statusCode == 200 || response.statusCode == 201)) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data};
      }
    } catch (e) {
      debugPrint('[ApiService] FCM token registration notice: $e');
    }
    return {'success': false};
  }

  /// Unregister FCM Device Token from Backend API on Logout
  static Future<Map<String, dynamic>> unregisterFcmToken(String fcmToken) async {
    try {
      final response = await _requestWithRetry(
        'DELETE',
        '${ApiConfig.baseUrl}/api/v1/notifications/device-token',
        body: json.encode({'fcmToken': fcmToken}),
      );

      if (response != null && response.statusCode == 200) {
        return {'success': true};
      }
    } catch (e) {
      debugPrint('[ApiService] FCM token unregistration notice: $e');
    }
    return {'success': false};
  }

  /// Save session data to SharedPreferences
  static Future<void> saveSession(String token, Map<String, dynamic> user, {String? refreshToken}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
    await prefs.setString('auth_token', token);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await prefs.setString('refresh_token', refreshToken);
    }
    await prefs.setString('user_data', json.encode(user));
    await FcmService.syncTokenWithBackend();
  }

  /// Get stored session user
  static Future<Map<String, dynamic>?> getStoredUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user_data');
      if (userStr != null) {
        return json.decode(userStr);
      }
    } catch (e) {
      debugPrint('[ApiService] Error reading stored user: $e');
    }
    return null;
  }

  /// Fetch current user profile live from backend (GET /api/v1/auth/me) and synchronize local cache
  static Future<Map<String, dynamic>?> fetchCurrentUserProfile() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/auth/me');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        final userObj = data['data']?['user'] ?? data['user'] ?? data['data'];
        if (userObj != null && userObj is Map<String, dynamic>) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user_data', json.encode(userObj));
          return userObj;
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Fetch current user profile error: $e');
    }
    return await getStoredUser();
  }

  /// Update current user profile at PUT /api/v1/auth/profile
  static Future<bool> updateProfile({
    String? name,
    String? phone,
    String? email,
    String? dob,
    String? gender,
  }) async {
    try {
      final bodyMap = <String, dynamic>{};
      if (name != null) bodyMap['name'] = name;
      if (phone != null) bodyMap['phone'] = phone;
      if (email != null) bodyMap['email'] = email;
      if (dob != null) bodyMap['dob'] = dob;
      if (gender != null) bodyMap['gender'] = gender;

      final response = await _requestWithRetry(
        'PUT',
        '${ApiConfig.baseUrl}/api/v1/auth/profile',
        body: json.encode(bodyMap),
      );

      if (response != null && (response.statusCode == 200 || response.statusCode == 201)) {
        final data = json.decode(response.body);
        final userObj = data['data']?['user'] ?? data['user'] ?? data['data'];
        if (userObj != null && userObj is Map<String, dynamic>) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user_data', json.encode(userObj));
        }
        return true;
      }
    } catch (e) {
      debugPrint('[ApiService] Update profile error: $e');
    }
    return true;
  }

  /// Get stored session token
  static Future<String?> getStoredToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token') ?? prefs.getString('jwt_token');
    } catch (e) {
      debugPrint('[ApiService] Error reading stored token: $e');
    }
    return null;
  }

  /// Clear session on Logout
  static Future<void> clearSession() async {
    await FcmService.unregisterTokenOnLogout();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('auth_token');
    await prefs.remove('token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_data');
  }

  /// Delete Customer Account (DELETE /api/v1/auth/account)
  static Future<Map<String, dynamic>> deleteAccount(String password) async {
    try {
      final response = await _requestWithRetry(
        'DELETE',
        '${ApiConfig.baseUrl}/api/v1/auth/account',
        body: json.encode({'password': password}),
      );

      if (response == null) {
        return {'success': false, 'message': 'Network error: Connection failed after retries.'};
      }

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        await clearSession();
        return {
          'success': true,
          'message': data['message'] ?? 'Your account has been deleted successfully.'
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Security verification failed. Unable to delete account.'
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  static Future<void> logout() async {
    await clearSession();
  }

  // --- PUBLIC METHODS WITH OFFLINE DEMO FALLBACKS ---

  static final List<Map<String, dynamic>> _fallbackServices = [
    {
      '_id': '6a952d5211dce64422655eaf',
      'name': 'hair spa',
      'title': 'Hair Spa',
      'category': 'Hair',
      'price': 2999,
      'discountPrice': 2699,
      'durationMinutes': 60,
      'duration': '60 min',
      'description': 'Luxury botanical hair spa ritual provided by SPY Salon certified master specialists.',
      'rating': 4.9,
      'image': 'https://res.cloudinary.com/cf1z70hh/image/upload/v1788262882/spy_salon/services/gp62ycbwh8vk4za2olal.webp',
      'isPopular': true,
      'isActive': true,
    },
    {
      '_id': '6a978f898394e3e3b333a364',
      'name': 'body spa',
      'title': 'Body Spa',
      'category': 'Body Spa',
      'price': 1999,
      'discountPrice': 2699,
      'durationMinutes': 60,
      'duration': '60 min',
      'description': 'Deep cellular relaxation and organic botanical aromatherapeutic hydro-massage.',
      'rating': 4.9,
      'image': 'https://res.cloudinary.com/cf1z70hh/image/upload/v1788328327/spy_salon/services/q5dbw0w8d6fihhxp90i7.webp',
      'isPopular': true,
      'isActive': true,
    },
    {
      '_id': '6a97e47c278ab4b18ef84d90',
      'name': 'hair cut',
      'title': 'Hair Cut',
      'category': 'Hair Care',
      'price': 250,
      'discountPrice': 300,
      'durationMinutes': 30,
      'duration': '30 min',
      'description': 'Precision haircut, cleansing prep, and executive master styling finish.',
      'rating': 4.9,
      'image': '',
      'isPopular': true,
      'isActive': true,
    },
    {
      '_id': '6a9528bc74678598a8353f47',
      'name': 'Beard Shaving',
      'title': 'Beard Shaving',
      'category': 'Barbering & Grooming',
      'price': 150,
      'discountPrice': 150,
      'durationMinutes': 30,
      'duration': '30 min',
      'description': 'Precision razor beard shaping with hot towel treatment and botanical oils.',
      'rating': 4.9,
      'image': '',
      'isPopular': true,
      'isActive': true,
    },
    {
      '_id': '6a97efbbf0faab9428d99c7b',
      'name': 'Hair Cut',
      'title': 'Hair Cut',
      'category': 'Hair Care',
      'price': 250,
      'durationMinutes': 30,
      'duration': '30 min',
      'description': 'Individual standalone salon service treatment.',
      'rating': 4.9,
      'image': '',
      'isPopular': false,
      'isActive': true,
    },
    {
      '_id': '6a9a572bf88df7c213178baa',
      'name': 'body shaving',
      'title': 'Body Shaving',
      'category': 'Hair',
      'price': 1234,
      'discountPrice': 1111,
      'durationMinutes': 60,
      'duration': '60 min',
      'description': 'Luxury full-body grooming and exfoliating treatment.',
      'rating': 4.9,
      'image': '',
      'isPopular': false,
      'isActive': true,
    },
  ];

  static final List<Map<String, dynamic>> _fallbackSpecialists = [
    {
      '_id': 'spec_1',
      'name': 'Alex Rivera',
      'role': 'Master Barber & Hair Stylist',
      'rating': 4.9,
      'experience': '8+ Yrs',
      'specialty': 'Hair Architecture',
    },
    {
      '_id': 'spec_2',
      'name': 'Elena Rostova',
      'role': 'Senior Botanical Spa Therapist',
      'rating': 4.9,
      'experience': '6+ Yrs',
      'specialty': 'Skin & Organic Facials',
    },
    {
      '_id': 'spec_3',
      'name': 'Sophia Chen',
      'role': 'Master Colorist',
      'rating': 4.8,
      'experience': '7+ Yrs',
      'specialty': 'Balayage & Glow Tints',
    },
    {
      '_id': 'spec_4',
      'name': 'Marcus Vance',
      'role': 'Grooming Specialist',
      'rating': 4.9,
      'experience': '10+ Yrs',
      'specialty': 'Beard Sculpting & Hot Towel',
    },
  ];

  static final List<Map<String, dynamic>> _fallbackOffers = [
    {
      '_id': 'off_1',
      'title': '20% OFF Luxury Hair Spa',
      'code': 'SPY20',
      'discountPercent': 20,
    },
    {
      '_id': 'off_2',
      'title': 'Complimentary Scalp Detox',
      'code': 'DETOXFREE',
      'discountPercent': 100,
    },
  ];

  static const List<dynamic> _fallbackMembershipPlans = [
    {
      'code': 'silver',
      'name': 'silver',
      'badge': 'Semi VIP Member',
      'tagline': 'Exclusive VIP Privileges & Monthly Perks',
      'monthlyPrice': 1499,
      'yearlyPrice': 14999,
      'discountPercentage': 15,
      'color': 0xFFC0C0C0,
      'benefits': [
        '10% Flat Discount on All Services',
        'Priority Booking',
        'Free Monthly Treatment',
      ],
    },
    {
      'code': 'gold-123',
      'name': 'gold',
      'badge': 'VIP Member',
      'tagline': 'Exclusive VIP Privileges & Monthly Perks',
      'monthlyPrice': 1499,
      'yearlyPrice': 14999,
      'discountPercentage': 15,
      'popular': true,
      'color': 0xFFD4AF37,
      'benefits': [
        '25% Flat Discount on All Services',
        'Priority Booking',
        'Free Monthly Treatment',
        'complete body spa',
      ],
    },
    {
      'code': '123098',
      'name': 'platinum',
      'badge': 'platinum Member',
      'tagline': 'Exclusive VIP Privileges & Monthly Perks',
      'monthlyPrice': 8499,
      'yearlyPrice': 100999,
      'discountPercentage': 15,
      'color': 0xFFE5B287,
      'benefits': [
        '15% Flat Discount on All Services',
        'Priority Booking',
        'Free Monthly Treatment.Head Wash',
      ],
    },
  ];

  static List<dynamic> get fallbackServices => _fallbackServices;
  static List<dynamic> get fallbackSpecialists => _fallbackSpecialists;
  static List<dynamic> get fallbackMembershipPlans => _fallbackMembershipPlans;

  /// Fetch all active services from `/api/v1/services`
  static Future<List<dynamic>> getServices() async {
    try {
      final response = await _requestWithRetry('GET', ApiConfig.servicesUrl);
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Services fetch notice: $e');
    }
    return _fallbackServices;
  }

  /// Fetch specialists from `/api/v1/specialists`
  static Future<List<dynamic>> getSpecialists() async {
    try {
      final response = await _requestWithRetry('GET', ApiConfig.specialistsUrl);
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Specialists fetch notice: $e');
    }
    return _fallbackSpecialists;
  }

  /// Fetch current offers from `/api/v1/offers`
  static Future<List<dynamic>> getOffers() async {
    try {
      final response = await _requestWithRetry('GET', ApiConfig.offersUrl);
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Offers fetch notice: $e');
    }
    return _fallbackOffers;
  }

  /// Fetch Landing Settings from `/api/v1/landing-settings`
  static Future<Map<String, dynamic>?> getLandingSettings() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/landing-settings');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is Map && data['success'] == true && data['data'] != null) {
          final settings = Map<String, dynamic>.from(data['data']);
          try {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('spy_cached_landing_settings', json.encode(settings));
          } catch (_) {}
          return settings;
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Landing settings fetch error: $e');
    }
    // Return cached settings if network request fails or returns null
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('spy_cached_landing_settings');
      if (cached != null && cached.isNotEmpty) {
        return Map<String, dynamic>.from(json.decode(cached));
      }
    } catch (_) {}
    return null;
  }

  /// Fetch VIP Membership Plans from `/api/v1/membership/plans`
  static Future<List<dynamic>> getMembershipPlans() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/membership/plans');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Membership plans fetch notice: $e');
    }
    return _fallbackMembershipPlans;
  }

  /// Book Salon Appointment (Public & Customer API)
  static Future<Map<String, dynamic>> bookAppointment({
    required String customerName,
    required String customerPhone,
    required String service,
    required String appointmentDate,
    required String appointmentTime,
    String? branch,
    String? specialistName,
    String? customerEmail,
    String? notes,
  }) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        ApiConfig.publicBookUrl,
        body: json.encode({
          'customerName': customerName,
          'customerPhone': customerPhone,
          'customerEmail': customerEmail ?? '',
          'service': service,
          'branch': (branch != null && branch.trim().isNotEmpty) ? branch.trim() : 'Jubilee Hills',
          'specialistName': (specialistName != null && specialistName.trim().isNotEmpty) ? specialistName.trim() : 'Any Available Specialist',
          'appointmentDate': appointmentDate,
          'appointmentTime': appointmentTime,
          'notes': notes ?? '',
        }),
      );

      if (response != null) {
        final data = json.decode(response.body);
        if (response.statusCode == 200 || response.statusCode == 201) {
          return {'success': true, 'data': data['data'] ?? data, 'message': data['message'] ?? 'Appointment booked successfully!'};
        } else {
          return {'success': false, 'message': data['message'] ?? 'Booking failed'};
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Book appointment error: $e');
    }
    return {
      'success': true,
      'message': 'Appointment confirmed in Demo Mode!',
      'data': {
        'bookingId': 'SPY-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        'customerName': customerName,
        'service': service,
        'appointmentDate': appointmentDate,
        'appointmentTime': appointmentTime,
        'status': 'Confirmed',
      }
    };
  }

  /// Fetch Booked / Unavailable Time Slots for a given Date & Specialist
  static Future<List<String>> getBookedSlots(String date, {String? specialist}) async {
    try {
      final specQuery = (specialist != null && specialist.isNotEmpty)
          ? '&specialist=${Uri.encodeComponent(specialist)}'
          : '';
      final url = '${ApiConfig.baseUrl}/api/v1/appointments/booked-slots?date=$date$specQuery';
      final response = await _requestWithRetry('GET', url);

      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['bookedSlots'] is List) {
          return List<String>.from(data['bookedSlots'].map((s) => s.toString()));
        }
      }
    } catch (e) {
      debugPrint('[ApiService] getBookedSlots error: $e');
    }
    return [];
  }

  // --- EMPLOYEE / STAFF REST API METHODS ---

  /// Fetch Assigned Appointments for Staff
  static Future<List<dynamic>?> getEmployeeAppointments() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/employee/appointments');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null && data['data'] is List) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Employee appointments error: $e');
    }
    return null;
  }

  /// Update Appointment Status (In Progress, Completed, Cancelled) & Notes
  static Future<Map<String, dynamic>> updateEmployeeAppointmentStatus(String id, Map<String, dynamic> body) async {
    try {
      final response = await _requestWithRetry(
        'PUT',
        '${ApiConfig.baseUrl}/api/v1/employee/appointments/$id/status',
        body: json.encode(body),
      );
      if (response != null) {
        Map<String, dynamic> data = {};
        try {
          data = json.decode(response.body);
        } catch (_) {}
        if (response.statusCode == 200 || response.statusCode == 201) {
          return {'success': true, 'data': data['data'] ?? data, 'message': data['message'] ?? 'Status updated successfully'};
        }
        return {'success': false, 'message': data['message'] ?? 'Failed to update status (${response.statusCode})'};
      }
    } catch (e) {
      debugPrint('[ApiService] Update employee appointment error: $e');
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network connection failed.'};
  }

  /// Customer Request Reschedule for Appointment (including Hold/No-Show)
  static Future<Map<String, dynamic>> requestCustomerReschedule(String id, Map<String, dynamic> body) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/user/appointments/$id/reschedule',
        body: json.encode(body),
      );
      if (response != null) {
        final result = json.decode(response.body);
        if (response.statusCode == 200 || response.statusCode == 201) {
          return {'success': true, 'data': result['data'] ?? result};
        }
        return {'success': false, 'message': result['message'] ?? 'Failed to submit reschedule request'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network connection failed.'};
  }

  /// Staff/Admin Respond & Confirm Reschedule Request
  static Future<Map<String, dynamic>> respondReschedule(
    String id,
    String action, {
    String? rejectionReason,
    String? newDate,
    String? newTime,
  }) async {
    try {
      final user = await getStoredUser();
      final role = (user?['role'] ?? '').toString().toLowerCase();
      final isStaff = role == 'employee' || role == 'stylist' || role == 'barber';

      final primaryEndpoint = isStaff
          ? '${ApiConfig.baseUrl}/api/v1/employee/appointments/$id/reschedule-respond'
          : '${ApiConfig.baseUrl}/api/v1/admin/appointments/$id/reschedule-respond';

      final payload = {
        'action': action,
        if (rejectionReason != null && rejectionReason.isNotEmpty) 'rejectionReason': rejectionReason,
        if (newDate != null && newDate.isNotEmpty) 'newDate': newDate,
        if (newTime != null && newTime.isNotEmpty) 'newTime': newTime,
      };

      var response = await _requestWithRetry(
        'PUT',
        primaryEndpoint,
        body: json.encode(payload),
      );

      // Fallback to alternate endpoint if unauthorized or endpoint differs
      if (response == null || response.statusCode == 403 || response.statusCode == 404) {
        final fallbackEndpoint = isStaff
            ? '${ApiConfig.baseUrl}/api/v1/admin/appointments/$id/reschedule-respond'
            : '${ApiConfig.baseUrl}/api/v1/employee/appointments/$id/reschedule-respond';

        response = await _requestWithRetry(
          'PUT',
          fallbackEndpoint,
          body: json.encode(payload),
        );
      }

      if (response != null) {
        final result = json.decode(response.body);
        if (response.statusCode == 200 || response.statusCode == 201) {
          return {'success': true, 'data': result['data'] ?? result};
        }
        return {'success': false, 'message': result['message'] ?? 'Failed to process reschedule approval'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'No response from server'};
  }

  /// Staff/Admin Direct Reschedule for Appointment (including missed / past date / No Show)
  static Future<Map<String, dynamic>> rescheduleEmployeeAppointment(
    String id,
    String newDate,
    String newTime, {
    String? reason,
  }) async {
    try {
      final user = await getStoredUser();
      final role = (user?['role'] ?? '').toString().toLowerCase();
      final isStaff = role == 'employee' || role == 'stylist' || role == 'barber';

      final primaryEndpoint = isStaff
          ? '${ApiConfig.baseUrl}/api/v1/employee/appointments/$id/reschedule'
          : '${ApiConfig.baseUrl}/api/v1/admin/appointments/$id/reschedule';

      final payload = {
        'newDate': newDate,
        'newTime': newTime,
        if (reason != null && reason.isNotEmpty) 'reason': reason,
      };

      var response = await _requestWithRetry(
        'PUT',
        primaryEndpoint,
        body: json.encode(payload),
      );

      if (response == null || response.statusCode == 403 || response.statusCode == 404) {
        final fallbackEndpoint = isStaff
            ? '${ApiConfig.baseUrl}/api/v1/admin/appointments/$id/reschedule'
            : '${ApiConfig.baseUrl}/api/v1/employee/appointments/$id/reschedule';

        response = await _requestWithRetry(
          'PUT',
          fallbackEndpoint,
          body: json.encode(payload),
        );
      }

      if (response != null) {
        final result = json.decode(response.body);
        if (response.statusCode == 200 || response.statusCode == 201) {
          return {'success': true, 'data': result['data'] ?? result};
        }
        return {'success': false, 'message': result['message'] ?? 'Failed to reschedule appointment'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'No response from server'};
  }

  /// Seat Direct Walk-In Client by Staff
  static Future<Map<String, dynamic>> createEmployeeWalkIn(Map<String, dynamic> data) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/employee/walk-in',
        body: json.encode(data),
      );

      if (response != null) {
        final result = json.decode(response.body);
        if (response.statusCode == 200 || response.statusCode == 201) {
          return {'success': true, 'data': result['data'] ?? result};
        }
        return {'success': false, 'message': result['message'] ?? 'Failed to seat walk-in client'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network error: Connection failed after retries.'};
  }

  /// Shift Clock In
  static Future<Map<String, dynamic>> clockInAttendance() async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/employee/clock-in',
      );

      if (response != null) {
        final data = json.decode(response.body);
        final isSuccess = response.statusCode == 200 || response.statusCode == 201;
        return {
          'success': isSuccess,
          'data': data['data'],
          'message': data['message'] ?? (isSuccess ? 'Successfully clocked in!' : 'Clock-in failed')
        };
      }
    } catch (e) {
      debugPrint('[ApiService] Clock-in error: $e');
    }

    return {
      'success': false,
      'message': 'Network error: Connection to server failed.',
    };
  }

  /// Start Duty Break
  static Future<Map<String, dynamic>> startBreakAttendance() async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/employee/start-break',
      );

      if (response != null) {
        final data = json.decode(response.body);
        final isSuccess = response.statusCode == 200 || response.statusCode == 201;
        return {
          'success': isSuccess,
          'data': data['data'],
          'message': data['message'] ?? (isSuccess ? 'Break started!' : 'Start break failed')
        };
      }
    } catch (e) {
      debugPrint('[ApiService] Start break error: $e');
    }

    return {
      'success': false,
      'message': 'Network error: Connection to server failed.',
    };
  }

  /// End Duty Break
  static Future<Map<String, dynamic>> endBreakAttendance() async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/employee/end-break',
      );

      if (response != null) {
        final data = json.decode(response.body);
        final isSuccess = response.statusCode == 200 || response.statusCode == 201;
        return {
          'success': isSuccess,
          'data': data['data'],
          'message': data['message'] ?? (isSuccess ? 'Break ended!' : 'End break failed')
        };
      }
    } catch (e) {
      debugPrint('[ApiService] End break error: $e');
    }

    return {
      'success': false,
      'message': 'Network error: Connection to server failed.',
    };
  }

  /// Shift Clock Out
  static Future<Map<String, dynamic>> clockOutAttendance() async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/employee/clock-out',
      );

      if (response != null) {
        final data = json.decode(response.body);
        final isSuccess = response.statusCode == 200 || response.statusCode == 201;
        return {
          'success': isSuccess,
          'data': data['data'],
          'message': data['message'] ?? (isSuccess ? 'Successfully clocked out!' : 'Clock-out failed')
        };
      }
    } catch (e) {
      debugPrint('[ApiService] Clock out error: $e');
    }

    return {
      'success': false,
      'message': 'Network error: Connection to server failed.',
    };
  }

  /// Fetch Today's Attendance Record for Logged-In Staff
  static Future<Map<String, dynamic>?> getTodayAttendance() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/employee/attendance/today');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is Map && data['data'] != null && data['data'] is Map) {
          return Map<String, dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Today attendance fetch error: $e');
    }
    return null;
  }

  /// Fetch Staff Attendance Log
  static Future<List<dynamic>?> getEmployeeAttendance() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/employee/attendance');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null && data['data'] is List) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Attendance fetch error: $e');
    }
    return null;
  }

  /// Submit Leave Request
  static Future<Map<String, dynamic>> submitLeaveRequest(Map<String, dynamic> data) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/employee/leaves',
        body: json.encode(data),
      );

      if (response != null) {
        final result = json.decode(response.body);
        final isSuccess = response.statusCode == 200 || response.statusCode == 201;
        return {
          'success': isSuccess,
          'data': result['data'],
          'message': result['message'] ?? (isSuccess ? 'Leave request submitted!' : 'Failed to submit leave request')
        };
      }
    } catch (e) {
      debugPrint('[ApiService] Submit leave error: $e');
    }

    return {
      'success': false,
      'message': 'Network error: Connection to server failed.',
    };
  }

  /// Fetch Staff Leaves List
  static Future<List<dynamic>?> getEmployeeLeaves() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/employee/leaves/my');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null && data['data'] is List) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Leaves fetch error: $e');
    }
    return null;
  }

  /// Fetch Staff Payrolls & Commission Slips
  static Future<List<dynamic>?> getEmployeePayrolls() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/employee/payrolls');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null && data['data'] is List) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Payrolls fetch error: $e');
    }
    return null;
  }



  /// Fetch Staff Client Directory
  static Future<List<dynamic>?> getEmployeeCustomers() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/employee/customers');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null && data['data'] is List) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Staff customers error: $e');
    }
    return null;
  }

  /// Add New Customer Profile by Staff
  static Future<Map<String, dynamic>> createEmployeeCustomer(Map<String, dynamic> data) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/employee/customers',
        body: json.encode(data),
      );
      if (response != null) {
        final result = json.decode(response.body);
        return {'success': response.statusCode == 200 || response.statusCode == 201, 'data': result['data'], 'message': result['message'] ?? ''};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network error: Connection failed after retries.'};
  }

  // --- CUSTOMER / CLIENT REST API METHODS ---

  /// Fetch Client's Appointments History
  static Future<List<dynamic>?> getCustomerAppointments({Map<String, dynamic>? userParam}) async {
    try {
      final user = userParam ?? await getStoredUser();
      final queryParams = <String, String>{};
      if (user != null) {
        if (user['name'] != null && user['name'].toString().trim().isNotEmpty) {
          queryParams['name'] = user['name'].toString().trim();
        }
        if (user['email'] != null && user['email'].toString().trim().isNotEmpty) {
          queryParams['email'] = user['email'].toString().trim();
        }
        if (user['phone'] != null && user['phone'].toString().trim().isNotEmpty) {
          queryParams['phone'] = user['phone'].toString().trim();
        }
        if (user['_id'] != null || user['id'] != null) {
          queryParams['userId'] = (user['_id'] ?? user['id']).toString();
        }
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/api/v1/user/appointments')
          .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

      final response = await _requestWithRetry('GET', uri.toString());

      if (response != null && response.statusCode == 200) {
        final bodyData = json.decode(response.body);
        if (bodyData is List) return bodyData;
        if (bodyData is Map && bodyData['data'] != null && bodyData['data'] is List) {
          return List<dynamic>.from(bodyData['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Customer appointments error: $e');
    }
    return null;
  }

  /// Cancel Customer Appointment
  static Future<bool> cancelCustomerAppointment(String id) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/user/appointments/$id/cancel',
        body: json.encode({'reason': 'Cancelled by customer via Mobile App'}),
      );
      return response != null && (response.statusCode == 200 || response.statusCode == 201);
    } catch (e) {
      debugPrint('[ApiService] Cancel appointment error: $e');
      return false;
    }
  }

  /// Reschedule Customer Appointment
  static Future<bool> rescheduleCustomerAppointment(String id, String date, String time) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/user/appointments/$id/reschedule',
        body: json.encode({
          'newDate': date,
          'newTime': time,
          'reason': 'Customer requested date/time change via Mobile App',
        }),
      );
      return response != null && (response.statusCode == 200 || response.statusCode == 201);
    } catch (e) {
      debugPrint('[ApiService] Reschedule appointment error: $e');
      return false;
    }
  }

  /// Update Customer Profile (Name, Phone, Email, Gender, Address)
  static Future<Map<String, dynamic>> updateCustomerProfile(Map<String, dynamic> data) async {
    try {
      final response = await _requestWithRetry(
        'PUT',
        '${ApiConfig.baseUrl}/api/v1/user/profile/details',
        body: json.encode(data),
      );
      if (response != null) {
        final result = json.decode(response.body);
        final userObj = result['data']?['user'] ?? result['user'] ?? result['data'];
        final isSuccess = (response.statusCode == 200 || response.statusCode == 201) &&
            (result['success'] == true || userObj != null);
        if (isSuccess && userObj != null && userObj is Map<String, dynamic>) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user_data', json.encode(userObj));
        }
        return {
          'success': isSuccess,
          'message': result['message'] ?? 'Profile updated',
          'user': userObj
        };
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network error: Connection failed after retries.'};
  }

  /// Change Customer Password
  static Future<Map<String, dynamic>> changeCustomerPassword(String newPassword) async {
    try {
      final response = await _requestWithRetry(
        'PUT',
        '${ApiConfig.baseUrl}/api/v1/user/profile/change-password',
        body: json.encode({
          'newPassword': newPassword,
        }),
      );
      if (response != null) {
        final result = json.decode(response.body);
        return {'success': response.statusCode == 200, 'message': result['message'] ?? 'Password changed successfully'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network error: Connection failed after retries.'};
  }

  /// Upgrade VIP Membership Tier / Purchase Plan
  static Future<Map<String, dynamic>> upgradeCustomerMembership(
    String tier, {
    String? billingCycle,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
  }) async {
    try {
      final user = await getStoredUser();
      final planCode = tier.toLowerCase()
          .replaceAll(' membership', '')
          .replaceAll(' vip', '')
          .replaceAll(' elite', '')
          .replaceAll('🥉', '')
          .replaceAll('🥈', '')
          .replaceAll('👑', '')
          .replaceAll('💎', '')
          .trim();
      final body = {
        'tier': tier,
        'planCode': planCode.isEmpty ? 'standard' : planCode,
        'billingCycle': billingCycle ?? 'monthly',
        'customerName': customerName ?? user?['name'] ?? 'Valued VIP Guest',
        'customerEmail': customerEmail ?? user?['email'] ?? 'guest@spysalon.com',
        'customerPhone': customerPhone ?? user?['phone'] ?? '+91 94906 44434',
      };
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/membership/purchase',
        body: json.encode(body),
      );
      if (response != null) {
        final result = json.decode(response.body);
        final bool isSuccess = response.statusCode == 200 || response.statusCode == 201;
        if (isSuccess) {
          // Immediately refresh user profile in local cache
          await fetchCurrentUserProfile();
        }
        return {
          'success': isSuccess,
          'message': result['message'] ?? 'Membership upgraded successfully!',
          'data': result['data'] ?? result,
        };
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network error: Connection failed after retries.'};
  }

  /// Fetch user membership details from backend
  static Future<Map<String, dynamic>?> getMyMembership() async {
    try {
      final user = await getStoredUser();
      final email = user?['email']?.toString().trim();
      final url = email != null && email.isNotEmpty
          ? '${ApiConfig.baseUrl}/api/v1/membership/my-membership?email=${Uri.encodeComponent(email)}'
          : '${ApiConfig.baseUrl}/api/v1/user/membership';

      final response = await _requestWithRetry('GET', url);
      if (response != null && (response.statusCode == 200 || response.statusCode == 201)) {
        final data = json.decode(response.body);
        final payload = data['data'] ?? data;
        if (payload != null && payload is Map<String, dynamic>) {
          return payload;
        }
      }
    } catch (e) {
      debugPrint('[ApiService] getMyMembership error: $e');
    }
    // Fallback to local stored user membership
    final user = await getStoredUser();
    if (user != null && user['membership'] is Map) {
      return {
        'hasActiveMembership': (user['membership']['status'] ?? '').toString().toLowerCase() == 'active',
        'membership': user['membership'],
      };
    }
    return null;
  }
}
