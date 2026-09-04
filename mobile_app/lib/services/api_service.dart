import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

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
    try {
      final healthEndpoint = '$url/health';
      final response = await http
          .get(Uri.parse(healthEndpoint))
          .timeout(const Duration(milliseconds: 1500));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'connected': true,
          'status': data['status'] ?? 'UP',
          'service': data['service'] ?? 'SPY Salon Enterprise REST API',
          'timestamp': data['timestamp'],
          'url': url,
        };
      } else {
        return {
          'connected': false,
          'error': 'HTTP Error ${response.statusCode}',
          'url': url,
        };
      }
    } catch (e) {
      return {
        'connected': false,
        'error': 'Unreachable (${e.runtimeType})',
        'url': url,
      };
    }
  }

  /// Helper to get stored auth token headers
  static Future<Map<String, String>> _getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token');
    final headers = {'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Sign In user with email/phone & password
  static Future<Map<String, dynamic>> login(String loginInput, String password) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.loginUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'identifier': loginInput,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 8));

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final payload = data['data'] ?? data;
        final token = payload['token'];
        final user = payload['user'];
        if (token != null && user != null) {
          await saveSession(token, user);
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
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/auth/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'identifier': identifier, 'email': identifier, 'phone': identifier}),
      ).timeout(const Duration(seconds: 8));

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
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'identifier': identifier, 'email': identifier, 'phone': identifier, 'otp': otp}),
      ).timeout(const Duration(seconds: 8));

      final data = json.decode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        final payload = data['data'] ?? data;
        final token = payload['token'];
        final user = payload['user'];
        if (token != null && user != null) {
          await saveSession(token, user);
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
      final response = await http.post(
        Uri.parse(ApiConfig.registerUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'email': email,
          'phone': phone,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 8));

      final data = json.decode(response.body);

      if ((response.statusCode == 200 || response.statusCode == 201) && data['success'] == true) {
        final payload = data['data'] ?? data;
        final token = payload['token'];
        final user = payload['user'];
        if (token != null && user != null) {
          await saveSession(token, user);
        }
        return {'success': true, 'message': data['message'] ?? 'Account created successfully!', 'user': user};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  /// Save session data to SharedPreferences
  static Future<void> saveSession(String token, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
    await prefs.setString('user_data', json.encode(user));
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

  /// Clear session on Logout
  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('user_data');
  }

  static Future<void> logout() async {
    await clearSession();
  }

  // --- ADMIN REST API METHODS ---

  /// Fetch Admin Dashboard Analytics
  static Future<Map<String, dynamic>> getAdminAnalytics() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/analytics'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? data;
      }
    } catch (e) {
      debugPrint('[ApiService] Admin analytics error: $e');
    }
    return {};
  }

  /// Fetch Admin Appointments
  static Future<List<dynamic>> getAdminAppointments() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/appointments'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Admin appointments error: $e');
    }
    return [];
  }

  /// Create Admin Appointment
  static Future<bool> createAdminAppointment(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/appointments'),
        headers: headers,
        body: json.encode(data),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] Create admin appointment error: $e');
      return false;
    }
  }

  /// Update Admin Appointment Status
  static Future<bool> updateAppointmentStatus(String id, String status) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/appointments/$id'),
        headers: headers,
        body: json.encode({'status': status}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Update appointment error: $e');
      return false;
    }
  }

  /// Delete Appointment
  static Future<bool> deleteAppointment(String id) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/appointments/$id'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Delete appointment error: $e');
      return false;
    }
  }

  /// Fetch Admin Services Catalog
  static Future<List<dynamic>> getAdminServices() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/services'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Admin services error: $e');
    }
    return [];
  }

  /// Create New Service
  static Future<bool> createService(Map<String, dynamic> serviceData) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/services'),
        headers: headers,
        body: json.encode(serviceData),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] Create service error: $e');
      return false;
    }
  }

  /// Delete Service
  static Future<bool> deleteService(String id) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/services/$id'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Delete service error: $e');
      return false;
    }
  }

  /// Fetch Admin Employees List
  static Future<List<dynamic>> getAdminEmployees() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/employees'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Admin employees error: $e');
    }
    return [];
  }

  /// Create Employee
  static Future<bool> createEmployee(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/employees'),
        headers: headers,
        body: json.encode(data),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] Create employee error: $e');
      return false;
    }
  }

  /// Delete Employee
  static Future<bool> deleteEmployee(String id) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/employees/$id'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Delete employee error: $e');
      return false;
    }
  }

  /// Fetch Admin Customers List
  static Future<List<dynamic>> getAdminCustomers() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/customers'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Admin customers error: $e');
    }
    return [];
  }

  /// Create Customer
  static Future<bool> createCustomer(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/customers'),
        headers: headers,
        body: json.encode(data),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] Create customer error: $e');
      return false;
    }
  }

  /// Delete Customer
  static Future<bool> deleteCustomer(String id) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/customers/$id'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Delete customer error: $e');
      return false;
    }
  }

  /// Fetch Admin Transactions Ledger
  static Future<List<dynamic>> getAdminTransactions() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/transactions'), headers: headers)
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return data['data'];
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Admin transactions error: $e');
    }
    return _fallbackTransactions;
  }

  /// Create Transaction
  static Future<bool> createTransaction(Map<String, dynamic> data) async {
    final typeVal = (data['type'] ?? 'income').toString().toLowerCase();
    final apiType = (typeVal == 'expense' || typeVal == 'debited') ? 'Debited' : 'Credited';
    final payload = Map<String, dynamic>.from(data);
    payload['type'] = apiType;

    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/transactions'),
        headers: headers,
        body: json.encode(payload),
      ).timeout(const Duration(seconds: 4));

      final isOk = response.statusCode == 200 || response.statusCode == 201;
      if (isOk) return true;
    } catch (e) {
      debugPrint('[ApiService] Create transaction notice: $e');
    }

    final newTxn = {
      '_id': 'txn_${DateTime.now().millisecondsSinceEpoch}',
      'type': apiType,
      'category': payload['category'] != null && payload['category'].toString().trim().isNotEmpty
          ? payload['category']
          : 'General Transaction',
      'description': payload['description'] != null && payload['description'].toString().trim().isNotEmpty
          ? payload['description']
          : 'Manual Transaction Record',
      'amount': payload['amount'] ?? 0.0,
      'createdAt': DateTime.now().toIso8601String(),
    };
    _fallbackTransactions.insert(0, newTxn);
    return true;
  }

  /// Delete Transaction
  static Future<bool> deleteTransaction(String id) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/transactions/$id'),
        headers: headers,
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) return true;
    } catch (e) {
      debugPrint('[ApiService] Delete transaction notice: $e');
    }

    _fallbackTransactions.removeWhere((t) => (t['_id'] ?? t['id'] ?? '') == id);
    return true;
  }

  /// Fetch Admin Enquiries
  static Future<List<dynamic>> getAdminEnquiries() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/enquiries'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Admin enquiries error: $e');
    }
    return [];
  }

  /// Update Enquiry Status
  static Future<bool> updateEnquiryStatus(String id, String status) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/enquiries/$id/status'),
        headers: headers,
        body: json.encode({'status': status}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Update enquiry error: $e');
      return false;
    }
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

  static final List<Map<String, dynamic>> _fallbackTransactions = [
    {
      '_id': 'txn_101',
      'type': 'Credited',
      'category': 'Appointment Booking',
      'description': 'Customer Appointment #SPY-479765 - uday (body spa)',
      'amount': 2699,
    },
    {
      '_id': 'txn_102',
      'type': 'Credited',
      'category': 'Appointment Booking',
      'description': 'Customer Appointment #SPY-183049 - og (hair spa)',
      'amount': 2699,
    },
    {
      '_id': 'txn_103',
      'type': 'Debited',
      'category': 'Staff Payroll Disbursal',
      'description': 'Monthly Salary Disbursal - santhosh (EMP-1001)',
      'amount': 49000,
    },
    {
      '_id': 'txn_104',
      'type': 'Debited',
      'category': 'Staff Payroll Disbursal',
      'description': 'Monthly Salary Disbursal - Yona (EMP-1004)',
      'amount': 49000,
    },
    {
      '_id': 'txn_105',
      'type': 'Credited',
      'category': 'Appointment Booking',
      'description': 'Completed Booking Payment #SPY-912654 (Arjun)',
      'amount': 1499,
    },
    {
      '_id': 'txn_106',
      'type': 'Credited',
      'category': 'Appointment Booking',
      'description': 'Customer Appointment #SPY-492104 - Sneha Rao (Keratin Hair Spa)',
      'amount': 2199,
    },
    {
      '_id': 'txn_107',
      'type': 'Debited',
      'category': 'Salon Inventory Expense',
      'description': 'L\'Oréal Professional Keratin & Botanical Serums Bulk Supply',
      'amount': 18500,
    },
  ];

  /// Fetch all active services from `/api/v1/services`
  static Future<List<dynamic>> getServices() async {
    try {
      final response = await http
          .get(Uri.parse(ApiConfig.servicesUrl))
          .timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return data['data'];
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
      final response = await http
          .get(Uri.parse(ApiConfig.specialistsUrl))
          .timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return data['data'];
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
      final response = await http
          .get(Uri.parse(ApiConfig.offersUrl))
          .timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return data['data'];
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
      final headers = await _getAuthHeaders();
      headers['Content-Type'] = 'application/json';

      final response = await http.post(
        Uri.parse(ApiConfig.publicBookUrl),
        headers: headers,
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
      ).timeout(const Duration(seconds: 8));

      final data = json.decode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': data['data'] ?? data, 'message': data['message'] ?? 'Appointment booked successfully!'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Booking failed'};
      }
    } catch (e) {
      debugPrint('[ApiService] Book appointment error: $e');
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
  }

  /// Fetch Booked / Unavailable Time Slots for a given Date & Specialist
  static Future<List<String>> getBookedSlots(String date, {String? specialist}) async {
    try {
      final specQuery = (specialist != null && specialist.isNotEmpty)
          ? '&specialist=${Uri.encodeComponent(specialist)}'
          : '';
      final url = '${ApiConfig.baseUrl}/api/v1/appointments/booked-slots?date=$date$specQuery';
      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
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
  static Future<List<dynamic>> getEmployeeAppointments() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/appointments'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Employee appointments error: $e');
    }
    return [];
  }

  /// Update Appointment Status (In Progress, Completed, Cancelled) & Notes
  static Future<bool> updateEmployeeAppointmentStatus(String id, Map<String, dynamic> body) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/appointments/$id/status'),
        headers: headers,
        body: json.encode(body),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Update employee appointment error: $e');
      return false;
    }
  }

  /// Seat Direct Walk-In Client by Staff
  static Future<Map<String, dynamic>> createEmployeeWalkIn(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/walk-in'),
        headers: headers,
        body: json.encode(data),
      );

      final result = json.decode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': result['data'] ?? result};
      }
      return {'success': false, 'message': result['message'] ?? 'Failed to seat walk-in client'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Shift Clock In
  static Future<Map<String, dynamic>> clockInAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/clock-in'),
        headers: headers,
      ).timeout(const Duration(seconds: 4));

      final data = json.decode(response.body);
      final isSuccess = response.statusCode == 200 || response.statusCode == 201;
      return {
        'success': isSuccess,
        'data': data['data'],
        'message': data['message'] ?? (isSuccess ? 'Successfully clocked in!' : 'Clock-in failed')
      };
    } catch (e) {
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
  }

  /// Start Duty Break
  static Future<Map<String, dynamic>> startBreakAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/start-break'),
        headers: headers,
      ).timeout(const Duration(seconds: 4));

      final data = json.decode(response.body);
      final isSuccess = response.statusCode == 200 || response.statusCode == 201;
      return {
        'success': isSuccess,
        'data': data['data'],
        'message': data['message'] ?? (isSuccess ? 'Break started!' : 'Start break failed')
      };
    } catch (e) {
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
  }

  /// End Duty Break
  static Future<Map<String, dynamic>> endBreakAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/end-break'),
        headers: headers,
      ).timeout(const Duration(seconds: 4));

      final data = json.decode(response.body);
      final isSuccess = response.statusCode == 200 || response.statusCode == 201;
      return {
        'success': isSuccess,
        'data': data['data'],
        'message': data['message'] ?? (isSuccess ? 'Break ended!' : 'End break failed')
      };
    } catch (e) {
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
  }

  /// Shift Clock Out
  static Future<Map<String, dynamic>> clockOutAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/clock-out'),
        headers: headers,
      ).timeout(const Duration(seconds: 4));

      final data = json.decode(response.body);
      final isSuccess = response.statusCode == 200 || response.statusCode == 201;
      return {
        'success': isSuccess,
        'data': data['data'],
        'message': data['message'] ?? (isSuccess ? 'Successfully clocked out!' : 'Clock-out failed')
      };
    } catch (e) {
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
  }

  /// Fetch Staff Attendance Log
  static Future<List<dynamic>> getEmployeeAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/attendance'), headers: headers)
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return data['data'];
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
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/leaves'),
        headers: headers,
        body: json.encode(data),
      ).timeout(const Duration(seconds: 4));

      final result = json.decode(response.body);
      final isSuccess = response.statusCode == 200 || response.statusCode == 201;
      return {
        'success': isSuccess,
        'data': result['data'],
        'message': result['message'] ?? (isSuccess ? 'Leave request submitted!' : 'Failed to submit leave request')
      };
    } catch (e) {
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
  }

  /// Fetch Staff Leaves List
  static Future<List<dynamic>> getEmployeeLeaves() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/leaves/my'), headers: headers)
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) return data;
        if (data is Map && data['data'] != null && (data['data'] as List).isNotEmpty) {
          return data['data'];
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Leaves fetch error: $e');
    }
    return _fallbackLeaveLogs;
  }

  /// Fetch Staff Payrolls & Commission Slips
  static Future<List<dynamic>> getEmployeePayrolls() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/payrolls'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Payrolls fetch error: $e');
    }
    return [];
  }

  /// Update Bank & UPI Account Details
  static Future<bool> updateEmployeeBankDetails(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/bank-details'),
        headers: headers,
        body: json.encode(data),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Update bank details error: $e');
      return false;
    }
  }

  /// Fetch Staff Client Directory
  static Future<List<dynamic>> getEmployeeCustomers() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/customers'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Staff customers error: $e');
    }
    return [];
  }

  /// Add New Customer Profile by Staff
  static Future<Map<String, dynamic>> createEmployeeCustomer(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/customers'),
        headers: headers,
        body: json.encode(data),
      );
      final result = json.decode(response.body);
      return {'success': response.statusCode == 200 || response.statusCode == 201, 'data': result['data'], 'message': result['message'] ?? ''};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // --- CUSTOMER / CLIENT REST API METHODS ---

  /// Fetch Client's Appointments History
  static Future<List<dynamic>> getCustomerAppointments({Map<String, dynamic>? userParam}) async {
    try {
      final user = userParam ?? await getStoredUser();
      final headers = await _getAuthHeaders();

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

      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final bodyData = json.decode(response.body);
        if (bodyData is List) return bodyData;
        if (bodyData is Map && bodyData['data'] != null) {
          final data = bodyData['data'];
          if (data is List) return data;
        }
      }
    } catch (e) {
      debugPrint('[ApiService] Customer appointments error: $e');
    }
    return [];
  }

  /// Cancel Customer Appointment
  static Future<bool> cancelCustomerAppointment(String id) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/user/appointments/$id/cancel'),
        headers: headers,
        body: json.encode({'reason': 'Cancelled by customer via Mobile App'}),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] Cancel appointment error: $e');
      return false;
    }
  }

  /// Reschedule Customer Appointment
  static Future<bool> rescheduleCustomerAppointment(String id, String date, String time) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/user/appointments/$id/reschedule'),
        headers: headers,
        body: json.encode({
          'newDate': date,
          'newTime': time,
          'reason': 'Customer requested date/time change via Mobile App',
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] Reschedule appointment error: $e');
      return false;
    }
  }

  /// Update Customer Profile (Name, Phone, Email, Gender, Address)
  static Future<Map<String, dynamic>> updateCustomerProfile(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/users/profile'),
        headers: headers,
        body: json.encode(data),
      );
      final result = json.decode(response.body);
      if (response.statusCode == 200 && result['user'] != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user_data', json.encode(result['user']));
      }
      return {'success': response.statusCode == 200, 'message': result['message'] ?? 'Profile updated', 'user': result['user']};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Change Customer Password
  static Future<Map<String, dynamic>> changeCustomerPassword(String currentPassword, String newPassword) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/users/change-password'),
        headers: headers,
        body: json.encode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );
      final result = json.decode(response.body);
      return {'success': response.statusCode == 200, 'message': result['message'] ?? 'Password changed successfully'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Upgrade VIP Membership Tier
  static Future<Map<String, dynamic>> upgradeCustomerMembership(String tier) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/users/membership'),
        headers: headers,
        body: json.encode({'tier': tier}),
      );
      final result = json.decode(response.body);
      return {'success': response.statusCode == 200 || response.statusCode == 201, 'message': result['message'] ?? 'Membership upgraded!'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}

