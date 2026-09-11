import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'fcm_service.dart';

class ApiService {
  /// Probes current base URL and candidate URLs in parallel to find a reachable backend instantly
  static Future<Map<String, dynamic>> checkHealth() async {
    await ApiConfig.loadSavedBaseUrl();

    final candidates = ApiConfig.candidateUrls;
    if (candidates.isEmpty) {
      return {'connected': false, 'error': 'No candidate URLs configured', 'url': ApiConfig.baseUrl};
    }

    final results = await Future.wait(
      candidates.map((url) => _probeUrl(url)),
    );

    for (final res in results) {
      if (res['connected'] == true) {
        final connectedUrl = res['url'] as String;
        await ApiConfig.setActiveBaseUrl(connectedUrl);
        return res;
      }
    }

    final primary = results.firstWhere(
      (r) => r['url'] == ApiConfig.baseUrl,
      orElse: () => results.first,
    );
    return primary;
  }

  static Future<Map<String, dynamic>> _probeUrl(String url) async {
    final probeEndpoints = [
      '$url/api/v1/health',
      '$url/health',
      '$url/api/health',
      '$url/api/v1/services',
    ];

    for (final endpoint in probeEndpoints) {
      try {
        final response = await http
            .get(Uri.parse(endpoint))
            .timeout(const Duration(milliseconds: 2500));

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

          if (isSpySalon) {
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
      'error': 'Unreachable',
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
        if (attempts <= maxRetries) {
          await Future.delayed(Duration(milliseconds: 500 * attempts));
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

  static Future<void> logout() async {
    await clearSession();
  }

  // --- PUBLIC METHODS WITH OFFLINE DEMO FALLBACKS ---

  static final List<Map<String, dynamic>> _fallbackServices = [
    {
      '_id': 'srv_1',
      'name': 'Hair Cut & Styling',
      'title': 'Hair Cut & Styling',
      'category': 'Hair Care',
      'price': 899,
      'duration': '45 min',
      'description': 'Precision haircut with luxury hair wash, scalp massage, and custom styling.',
      'rating': 4.9,
    },
    {
      '_id': 'srv_2',
      'name': 'Botanical Facial Spa',
      'title': 'Botanical Facial Spa',
      'category': 'Skin & Spa',
      'price': 1499,
      'duration': '60 min',
      'description': 'Organic herbal facial ritual with deep cleansing, botanical mask, and gold glow serum.',
      'rating': 4.8,
    },
    {
      '_id': 'srv_3',
      'name': 'Luxury Manicure & Pedicure',
      'title': 'Luxury Manicure & Pedicure',
      'category': 'Nail Care',
      'price': 1299,
      'duration': '50 min',
      'description': 'Spa manicure with cuticle care, exfoliating scrub, and gel polish finish.',
      'rating': 4.9,
    },
    {
      '_id': 'srv_4',
      'name': 'Beard Sculpting & Trim',
      'title': 'Beard Sculpting & Trim',
      'category': 'Grooming',
      'price': 599,
      'duration': '30 min',
      'description': 'Precision razor beard shaping with hot towel treatment and essential oils.',
      'rating': 4.7,
    },
    {
      '_id': 'srv_5',
      'name': 'Scalp Therapy & Spa Wash',
      'title': 'Scalp Therapy & Spa Wash',
      'category': 'Hair Care',
      'price': 999,
      'duration': '40 min',
      'description': 'Deep clarifying scalp detox treatment with aromatic steam conditioning.',
      'rating': 4.8,
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

  static final List<Map<String, dynamic>> _fallbackAttendanceLogs = [];

  static final List<Map<String, dynamic>> _fallbackLeaveLogs = [];

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
  static Future<bool> updateEmployeeAppointmentStatus(String id, Map<String, dynamic> body) async {
    try {
      final response = await _requestWithRetry(
        'PUT',
        '${ApiConfig.baseUrl}/api/v1/employee/appointments/$id/status',
        body: json.encode(body),
      );
      return response != null && response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Update employee appointment error: $e');
      return false;
    }
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

    final todayStr = DateTime.now().toString().split(' ')[0];
    final now = DateTime.now();
    final hourStr = now.hour > 12 ? (now.hour - 12).toString() : (now.hour == 0 ? '12' : now.hour.toString());
    final timeStr = "$hourStr:${now.minute.toString().padLeft(2, '0')} ${now.hour >= 12 ? 'PM' : 'AM'}";
    final existingIndex = _fallbackAttendanceLogs.indexWhere((l) => l['date'] == todayStr);
    if (existingIndex >= 0) {
      _fallbackAttendanceLogs[existingIndex]['attendanceState'] = 'CLOCKED_IN';
      _fallbackAttendanceLogs[existingIndex]['clockIn'] = timeStr;
    } else {
      _fallbackAttendanceLogs.insert(0, {
        '_id': 'att_${DateTime.now().millisecondsSinceEpoch}',
        'date': todayStr,
        'clockIn': timeStr,
        'clockOut': null,
        'attendanceState': 'CLOCKED_IN',
        'status': 'Present',
        'totalBreakDuration': 0,
        'effectiveWorkingDuration': 0,
      });
    }
    return {
      'success': true,
      'message': 'Successfully clocked in at $timeStr',
      'data': _fallbackAttendanceLogs.first
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

    final todayStr = DateTime.now().toString().split(' ')[0];
    final existing = _fallbackAttendanceLogs.firstWhere(
      (l) => l['date'] == todayStr,
      orElse: () => <String, dynamic>{},
    );
    if (existing.isNotEmpty) {
      existing['attendanceState'] = 'ON_BREAK';
    }
    return {
      'success': true,
      'message': 'Break started',
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

    final todayStr = DateTime.now().toString().split(' ')[0];
    final existing = _fallbackAttendanceLogs.firstWhere(
      (l) => l['date'] == todayStr,
      orElse: () => <String, dynamic>{},
    );
    if (existing.isNotEmpty) {
      existing['attendanceState'] = 'CLOCKED_IN';
    }
    return {
      'success': true,
      'message': 'Break ended',
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

    final todayStr = DateTime.now().toString().split(' ')[0];
    final now = DateTime.now();
    final hourStr = now.hour > 12 ? (now.hour - 12).toString() : (now.hour == 0 ? '12' : now.hour.toString());
    final timeStr = "$hourStr:${now.minute.toString().padLeft(2, '0')} ${now.hour >= 12 ? 'PM' : 'AM'}";
    final existing = _fallbackAttendanceLogs.firstWhere(
      (l) => l['date'] == todayStr,
      orElse: () => <String, dynamic>{},
    );
    if (existing.isNotEmpty) {
      existing['attendanceState'] = 'CLOCKED_OUT';
      existing['clockOut'] = timeStr;
    }
    return {
      'success': true,
      'message': 'Successfully clocked out at $timeStr',
    };
  }

  /// Fetch Staff Attendance Log
  static Future<List<dynamic>?> getEmployeeAttendance() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/employee/attendance');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Attendance fetch error: $e');
    }
    return _fallbackAttendanceLogs;
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

    final newLeave = {
      '_id': 'leave_${DateTime.now().millisecondsSinceEpoch}',
      'startDate': data['startDate'],
      'endDate': data['endDate'],
      'reason': data['reason'],
      'status': 'Pending',
      'createdAt': DateTime.now().toIso8601String(),
    };
    _fallbackLeaveLogs.insert(0, newLeave);
    return {
      'success': true,
      'message': 'Leave application submitted successfully',
      'data': newLeave,
    };
  }

  /// Fetch Staff Leaves List
  static Future<List<dynamic>?> getEmployeeLeaves() async {
    try {
      final response = await _requestWithRetry('GET', '${ApiConfig.baseUrl}/api/v1/employee/leaves/my');
      if (response != null && response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return List<dynamic>.from(data['data']);
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Leaves fetch error: $e');
    }
    return _fallbackLeaveLogs;
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

  /// Update Bank & UPI Account Details
  static Future<bool> updateEmployeeBankDetails(Map<String, dynamic> data) async {
    try {
      final response = await _requestWithRetry(
        'PUT',
        '${ApiConfig.baseUrl}/api/v1/employee/bank-details',
        body: json.encode(data),
      );
      return response != null && response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Update bank details error: $e');
      return false;
    }
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
        if (response.statusCode == 200 && result['user'] != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user_data', json.encode(result['user']));
        }
        return {'success': response.statusCode == 200, 'message': result['message'] ?? 'Profile updated', 'user': result['user']};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network error: Connection failed after retries.'};
  }

  /// Change Customer Password
  static Future<Map<String, dynamic>> changeCustomerPassword(String currentPassword, String newPassword) async {
    try {
      final response = await _requestWithRetry(
        'PUT',
        '${ApiConfig.baseUrl}/api/v1/user/profile/change-password',
        body: json.encode({
          'currentPassword': currentPassword,
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

  /// Upgrade VIP Membership Tier
  static Future<Map<String, dynamic>> upgradeCustomerMembership(String tier) async {
    try {
      final response = await _requestWithRetry(
        'POST',
        '${ApiConfig.baseUrl}/api/v1/membership/purchase',
        body: json.encode({'tier': tier}),
      );
      if (response != null) {
        final result = json.decode(response.body);
        return {'success': response.statusCode == 200 || response.statusCode == 201, 'message': result['message'] ?? 'Membership upgraded!'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Network error: Connection failed after retries.'};
  }
}
