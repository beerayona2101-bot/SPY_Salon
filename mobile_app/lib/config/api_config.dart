import 'package:flutter/foundation.dart';

class ApiConfig {
  static const int port = 5000;
  
  // Workstation LAN IP discovered on local network
  static const String lanIp = '192.168.1.3';
  
  static String? _activeBaseUrl;

  /// Returns candidate URLs to probe automatically for connection
  static List<String> get candidateUrls {
    final list = <String>[];
    
    // Always prioritize LAN IP first so physical phones on Wi-Fi connect instantly
    list.add('http://$lanIp:$port');
    
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      list.add('http://10.0.2.2:$port');
    }
    
    list.add('http://localhost:$port');
    list.add('http://127.0.0.1:$port');
    
    return list;
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

  static void setActiveBaseUrl(String url) {
    _activeBaseUrl = url;
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
