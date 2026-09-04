import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const int port = 5000;
  
  // Workstation LAN IP discovered on local network
  static const String lanIp = '192.168.1.6';
  
  static String? _activeBaseUrl;

  /// Loads saved custom base URL from SharedPreferences
  static Future<void> loadSavedBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString('custom_base_url');
      if (saved != null && saved.trim().isNotEmpty) {
        _activeBaseUrl = saved.trim();
      }
    } catch (e) {
      debugPrint('[ApiConfig] Error loading saved base URL: $e');
    }
  }

  /// Sets and persists active base URL in SharedPreferences
  static Future<void> setActiveBaseUrl(String url) async {
    _activeBaseUrl = url.trim();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('custom_base_url', url.trim());
    } catch (e) {
      debugPrint('[ApiConfig] Error saving base URL: $e');
    }
  }

  /// Returns candidate URLs to probe automatically for connection
  static List<String> get candidateUrls {
    final list = <String>[];
    
    if (_activeBaseUrl != null && _activeBaseUrl!.trim().isNotEmpty) {
      list.add(_activeBaseUrl!.trim());
    }

    // Workstation LAN IP first so physical devices connect immediately
    list.add('http://$lanIp:$port');

    // Probe common local Wi-Fi subnet IPs
    for (int i = 2; i <= 15; i++) {
      list.add('http://192.168.1.$i:$port');
      list.add('http://192.168.0.$i:$port');
    }

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      list.add('http://10.0.2.2:$port');
    }
    
    list.add('http://localhost:$port');
    list.add('http://127.0.0.1:$port');
    
    // Deduplicate maintaining insertion order
    final unique = <String>[];
    for (final item in list) {
      if (!unique.contains(item)) {
        unique.add(item);
      }
    }
    return unique;
  }

  static String get baseUrl {
    if (_activeBaseUrl != null && _activeBaseUrl!.isNotEmpty) {
      return _activeBaseUrl!;
    }
    
    // Default fallback
    if (kIsWeb) return 'http://localhost:$port';
    if (defaultTargetPlatform == TargetPlatform.android) return 'http://$lanIp:$port';
    return 'http://localhost:$port';
  }

  // API Endpoints
  static String get healthUrl => '$baseUrl/health';
  static String get servicesUrl => '$baseUrl/api/v1/services';
  static String get specialistsUrl => '$baseUrl/api/v1/specialists';
  static String get offersUrl => '$baseUrl/api/v1/offers';
  static String get publicBookUrl => '$baseUrl/api/v1/appointments/public-book';
  
  // Auth Endpoints
  static String get loginUrl => '$baseUrl/api/v1/auth/login';
  static String get registerUrl => '$baseUrl/api/v1/auth/register';
  static String get meUrl => '$baseUrl/api/v1/auth/me';
}
