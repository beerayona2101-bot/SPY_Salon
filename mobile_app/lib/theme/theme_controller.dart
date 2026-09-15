import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// State Manager & Controller for Dark/Light Theme Switching & Persistence
class ThemeController extends ChangeNotifier {
  static const String _storageKey = 'spy_theme_mode';

  ThemeMode _themeMode = ThemeMode.dark;

  ThemeController([ThemeMode? initialMode]) {
    if (initialMode != null) {
      _themeMode = initialMode;
    } else {
      _loadStoredTheme();
    }
  }

  ThemeMode get themeMode => _themeMode;

  bool get isDarkMode => _themeMode == ThemeMode.dark;

  Future<void> _loadStoredTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storedMode = prefs.getString(_storageKey);
      if (storedMode == 'light') {
        _themeMode = ThemeMode.light;
      } else {
        _themeMode = ThemeMode.dark;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('[ThemeController] Error loading stored theme: $e');
    }
  }

  /// Initialize and return a loaded ThemeController instance
  static Future<ThemeController> loadInitial() async {
    ThemeMode initialMode = ThemeMode.dark;
    try {
      final prefs = await SharedPreferences.getInstance();
      final storedMode = prefs.getString(_storageKey);
      if (storedMode == 'light') {
        initialMode = ThemeMode.light;
      } else {
        initialMode = ThemeMode.dark;
      }
    } catch (e) {
      debugPrint('[ThemeController] Error reading initial theme: $e');
    }
    return ThemeController(initialMode);
  }

  /// Toggle between Dark Mode and Light Mode
  Future<void> toggleTheme() async {
    if (_themeMode == ThemeMode.dark) {
      await setThemeMode(ThemeMode.light);
    } else {
      await setThemeMode(ThemeMode.dark);
    }
  }

  /// Set explicit ThemeMode (Dark or Light)
  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;

    _themeMode = mode;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, mode == ThemeMode.light ? 'light' : 'dark');
    } catch (e) {
      debugPrint('[ThemeController] Error saving theme preference: $e');
    }
  }
}
