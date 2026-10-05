import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';
import '../services/fcm_service.dart';
import '../services/realtime_service.dart';
import '../theme/app_colors.dart';
import '../utils/luxury_page_route.dart';
import 'customer_dashboard_screen.dart';
import 'employee_dashboard_screen.dart';
import 'onboarding_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;
  final String _statusMessage = 'Loading...';

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );

    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeIn);
    _scaleAnim = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutBack),
    );

    _animController.forward();
    _initializeApp();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _initializeApp() async {
    final startTime = DateTime.now();
    Widget destination = const CustomerDashboardScreen();

    try {
      // 1. Fast parallel read of local configs & credentials with safe timeout
      Map<String, dynamic>? user;
      bool hasSeenOnboarding = false;

      try {
        await ApiConfig.loadSavedBaseUrl().timeout(const Duration(milliseconds: 1200));
      } catch (_) {}

      try {
        user = await ApiService.getStoredUser().timeout(const Duration(milliseconds: 1200));
      } catch (_) {}

      try {
        final prefs = await SharedPreferences.getInstance().timeout(const Duration(milliseconds: 1200));
        hasSeenOnboarding = prefs.getBool('has_seen_onboarding') ?? false;
      } catch (_) {}

      // 2. Fire and forget background network tasks (non-blocking for UI)
      ApiService.checkHealth().catchError((e) {
        debugPrint('[SplashScreen] Background health probe notice: $e');
        return <String, dynamic>{'status': 'offline'};
      });
      RealtimeService().init().catchError((e) {
        debugPrint('[SplashScreen] Realtime background init notice: $e');
      });
      FcmService.syncTokenWithBackend().catchError((e) {
        debugPrint('[SplashScreen] FCM token sync background notice: $e');
      });

      // 3. Crisp luxury splash timing (800ms total - fast and responsive)
      final elapsed = DateTime.now().difference(startTime).inMilliseconds;
      const targetSplashDuration = 800;
      final remainingDelay = targetSplashDuration - elapsed;
      if (remainingDelay > 0) {
        await Future.delayed(Duration(milliseconds: remainingDelay));
      }

      // 4. Resolve destination screen
      if (user != null) {
        final role = (user['role'] ?? 'customer').toString().toLowerCase();
        final isAdmin = role == 'admin' || role == 'manager';
        final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

        if (isAdmin) {
          await ApiService.clearSession().catchError((_) {});
          destination = const CustomerDashboardScreen();
        } else if (isStaff) {
          destination = const EmployeeDashboardScreen();
        } else {
          destination = const CustomerDashboardScreen();
        }
      } else {
        if (hasSeenOnboarding) {
          // Returning guest: skip onboarding tutorial and launch directly to Customer Dashboard!
          destination = const CustomerDashboardScreen();
        } else {
          // First-ever launch on brand new install: show onboarding once
          destination = const OnboardingScreen();
        }
      }
    } catch (e) {
      debugPrint('[SplashScreen] Notice during splash initialization: $e');
      destination = const CustomerDashboardScreen();
    } finally {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          LuxuryPageRoute(page: destination),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final bg = themeColors.deepestBackground;

    return Scaffold(
      backgroundColor: bg,
      body: Stack(
        children: [
          // Background luxury salon photo
          Positioned.fill(
            child: Image.asset(
              'assets/images/splash_bg.png',
              fit: BoxFit.cover,
              errorBuilder: (ctx, err, stack) => Container(color: bg),
            ),
          ),

          // Dark Overlay Gradient
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.95,
                  colors: [
                    bg.withValues(alpha: 0.75),
                    bg.withValues(alpha: 0.95),
                  ],
                ),
              ),
            ),
          ),

          Center(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: ScaleTransition(
                scale: _scaleAnim,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: primaryColor, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withValues(alpha: 0.45),
                            blurRadius: 32,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/logo.png',
                          fit: BoxFit.cover,
                          errorBuilder: (ctx, err, stack) => Center(
                            child: Text(
                              'S',
                              style: TextStyle(
                                color: primaryColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 48,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'SPY SALON',
                      style: TextStyle(
                        color: themeColors.textPrimary,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 3.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'LUXURY BEAUTY STUDIO & BOTANICAL SPA',
                      style: TextStyle(
                        color: primaryColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.6,
                      ),
                    ),
                    const SizedBox(height: 48),
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: primaryColor,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _statusMessage,
                      style: TextStyle(
                        color: themeColors.textMuted,
                        fontSize: 12,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'BEAUTY  |  STYLE  |  CONFIDENCE',
                style: TextStyle(
                  color: themeColors.textMuted.withValues(alpha: 0.5),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2.0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

