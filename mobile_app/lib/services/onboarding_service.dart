import 'package:shared_preferences/shared_preferences.dart';

/// Service for managing Onboarding persistence and state across app sessions
class OnboardingService {
  static const String _keyOnboardingCompleted = 'onboarding_completed';
  static const String _keyLegacySeen = 'has_seen_onboarding';

  /// Check if user has completed onboarding previously
  static Future<bool> isOnboardingCompleted() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_keyOnboardingCompleted) ?? prefs.getBool(_keyLegacySeen) ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Mark onboarding as completed (survives app restarts and device reboots)
  static Future<void> setOnboardingCompleted() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyOnboardingCompleted, true);
      await prefs.setBool(_keyLegacySeen, true);
    } catch (_) {}
  }

  /// Reset onboarding state (useful for testing or full account reset)
  static Future<void> resetOnboarding() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyOnboardingCompleted);
      await prefs.remove(_keyLegacySeen);
    } catch (_) {}
  }
}
