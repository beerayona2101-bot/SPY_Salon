import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const int port = 5000;
  
  // Workstation LAN IP discovered on local network
  static const String lanIp = '192.168.1.6';
  
  static String? _activeBaseUrl;

  /// Default fallback URL based on platform
  static String get defaultBaseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:$port';
    }
    return 'http://$lanIp:$port';
  }

  /// Normalizes user-provided or env URL (strips trailing slashes & redundant /api/v1 suffixes)
  static String normalizeUrl(String input) {
    String trimmed = input.trim();
    if (trimmed.isEmpty) return defaultBaseUrl;

    // Ensure URL has http:// or https:// scheme
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      if (trimmed.contains('localhost') || trimmed.contains('127.0.0.1') || trimmed.startsWith('192.168.') || trimmed.startsWith('10.')) {
        trimmed = 'http://$trimmed';
      } else {
        trimmed = 'https://$trimmed';
      }
    }

    // Strip trailing slashes
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }

    // Strip trailing /api/v1 or /api to prevent duplication (/api/v1/api/v1)
    if (trimmed.toLowerCase().endsWith('/api/v1')) {
      trimmed = trimmed.substring(0, trimmed.length - 7);
    } else if (trimmed.toLowerCase().endsWith('/api')) {
      trimmed = trimmed.substring(0, trimmed.length - 4);
    }

    // Strip trailing slashes again after stripping route suffixes
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }

    return trimmed;
  }

  /// Validates HTTP or HTTPS URL format
  static bool isValidUrl(String input) {
    try {
      final normalized = normalizeUrl(input);
      final uri = Uri.parse(normalized);
      return (uri.scheme == 'http' || uri.scheme == 'https') && uri.hasAuthority && uri.host.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Loads saved custom base URL from SharedPreferences
  static Future<void> loadSavedBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString('custom_base_url');
      if (saved != null && saved.trim().isNotEmpty) {
        _activeBaseUrl = normalizeUrl(saved);
      }
    } catch (e) {
      debugPrint('[ApiConfig] Error loading saved base URL: $e');
    }
  }

  /// Sets and persists active base URL in SharedPreferences
  static Future<void> setActiveBaseUrl(String url) async {
    final normalized = normalizeUrl(url);
    _activeBaseUrl = normalized;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('custom_base_url', normalized);
    } catch (e) {
      debugPrint('[ApiConfig] Error saving base URL: $e');
    }
  }

  /// Resets configuration to system default
  static Future<void> resetToDefault() async {
    _activeBaseUrl = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('custom_base_url');
    } catch (e) {
      debugPrint('[ApiConfig] Error resetting base URL: $e');
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

  /// Origin Base URL without trailing slash or /api/v1 (e.g. https://domain.com)
  static String get baseUrl {
    if (_activeBaseUrl != null && _activeBaseUrl!.isNotEmpty) {
      return _activeBaseUrl!;
    }
    return defaultBaseUrl;
  }

  /// Full display API base endpoint (e.g. https://domain.com/api/v1)
  static String get displayApiUrl => '$baseUrl/api/v1';

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
