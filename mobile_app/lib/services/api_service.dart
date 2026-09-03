import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  /// Probes current base URL and candidate URLs to find a reachable backend
  static Future<Map<String, dynamic>> checkHealth() async {
    // 1. Try active base URL first
    final primaryResult = await _probeUrl(ApiConfig.baseUrl);
    if (primaryResult['connected'] == true) {
      return primaryResult;
    }

    // 2. If active URL failed, probe candidate URLs
    for (final candidate in ApiConfig.candidateUrls) {
      if (candidate == ApiConfig.baseUrl) continue;
      
      final candidateResult = await _probeUrl(candidate);
      if (candidateResult['connected'] == true) {
        ApiConfig.setActiveBaseUrl(candidate);
        return candidateResult;
      }
    }

    return primaryResult;
  }

  static Future<Map<String, dynamic>> _probeUrl(String url) async {
    try {
      final healthEndpoint = '$url/health';
      final response = await http
          .get(Uri.parse(healthEndpoint))
          .timeout(const Duration(seconds: 3));

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
        'error': e.toString(),
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
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Admin transactions error: $e');
    }
    return [];
  }

  /// Create Transaction
  static Future<bool> createTransaction(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/transactions'),
        headers: headers,
        body: json.encode(data),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('[ApiService] Create transaction error: $e');
      return false;
    }
  }

  /// Delete Transaction
  static Future<bool> deleteTransaction(String id) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/admin/transactions/$id'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Delete transaction error: $e');
      return false;
    }
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

  // --- PUBLIC METHODS ---

  /// Fetch all active services from `/api/v1/services`
  static Future<List<dynamic>> getServices() async {
    try {
      final response = await http
          .get(Uri.parse(ApiConfig.servicesUrl))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
      return [];
    } catch (e) {
      debugPrint('[ApiService] Error fetching services: $e');
      return [];
    }
  }

  /// Fetch specialists from `/api/v1/specialists`
  static Future<List<dynamic>> getSpecialists() async {
    try {
      final response = await http
          .get(Uri.parse(ApiConfig.specialistsUrl))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
      return [];
    } catch (e) {
      debugPrint('[ApiService] Error fetching specialists: $e');
      return [];
    }
  }

  /// Fetch current offers from `/api/v1/offers`
  static Future<List<dynamic>> getOffers() async {
    try {
      final response = await http
          .get(Uri.parse(ApiConfig.offersUrl))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
      return [];
    } catch (e) {
      debugPrint('[ApiService] Error fetching offers: $e');
      return [];
    }
  }

  /// Submit appointment booking to `/api/v1/appointments/public-book`
  static Future<Map<String, dynamic>> bookAppointment({
    required String customerName,
    required String customerPhone,
    required String service,
    required String appointmentDate,
    required String appointmentTime,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.publicBookUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'customerName': customerName,
          'customerPhone': customerPhone,
          'service': service,
          'appointmentDate': appointmentDate,
          'appointmentTime': appointmentTime,
        }),
      );

      final data = json.decode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Booking failed'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
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
      );
      final data = json.decode(response.body);
      return {'success': response.statusCode == 200, 'data': data['data'], 'message': data['message'] ?? ''};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Start Duty Break
  static Future<Map<String, dynamic>> startBreakAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/start-break'),
        headers: headers,
      );
      final data = json.decode(response.body);
      return {'success': response.statusCode == 200, 'data': data['data'], 'message': data['message'] ?? ''};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// End Duty Break
  static Future<Map<String, dynamic>> endBreakAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/end-break'),
        headers: headers,
      );
      final data = json.decode(response.body);
      return {'success': response.statusCode == 200, 'data': data['data'], 'message': data['message'] ?? ''};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Shift Clock Out
  static Future<Map<String, dynamic>> clockOutAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/clock-out'),
        headers: headers,
      );
      final data = json.decode(response.body);
      return {'success': response.statusCode == 200, 'data': data['data'], 'message': data['message'] ?? ''};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Fetch Staff Attendance Log
  static Future<List<dynamic>> getEmployeeAttendance() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/attendance'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Attendance fetch error: $e');
    }
    return [];
  }

  /// Submit Leave Request
  static Future<Map<String, dynamic>> submitLeaveRequest(Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/leaves'),
        headers: headers,
        body: json.encode(data),
      );
      final result = json.decode(response.body);
      return {'success': response.statusCode == 200 || response.statusCode == 201, 'data': result['data'], 'message': result['message'] ?? ''};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  /// Fetch Staff Leaves List
  static Future<List<dynamic>> getEmployeeLeaves() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/employee/leaves/my'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
      }
    } catch (e) {
      debugPrint('[ApiService] Leaves fetch error: $e');
    }
    return [];
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
  static Future<List<dynamic>> getCustomerAppointments() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http
          .get(Uri.parse('${ApiConfig.baseUrl}/api/v1/appointments/my-appointments'), headers: headers)
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) return data;
        if (data is Map && data['data'] != null) return data['data'];
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
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/appointments/$id/cancel'),
        headers: headers,
        body: json.encode({'status': 'Cancelled'}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('[ApiService] Cancel appointment error: $e');
      return false;
    }
  }

  /// Reschedule Customer Appointment
  static Future<bool> rescheduleCustomerAppointment(String id, String date, String time) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/appointments/$id/reschedule'),
        headers: headers,
        body: json.encode({
          'appointmentDate': date,
          'appointmentTime': time,
          'status': 'Rescheduled',
        }),
      );
      return response.statusCode == 200;
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

