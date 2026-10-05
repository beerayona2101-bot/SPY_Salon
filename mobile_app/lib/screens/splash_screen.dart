import 'dart:async';
import 'package:flutter/material.dart';
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
  late Animation<double> _logoFadeAnim;
  late Animation<double> _logoScaleAnim;
  late Animation<double> _textFadeAnim;
  late Animation<Offset> _textSlideAnim;

  @override
  void initState() {
    super.initState();

    // Intro entrance animation (~1200ms total)
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    // 1. Logo fades in and scales smoothly (0ms - 800ms)
    _logoFadeAnim = CurvedAnimation(
      parent: _animController,
      curve: const Interval(0.0, 0.65, curve: Curves.easeOut),
    );

    _logoScaleAnim = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.0, 0.70, curve: Curves.easeOutBack),
      ),
    );

    // 2. Brand texts fade and slide up subtly (400ms - 1000ms)
    _textFadeAnim = CurvedAnimation(
      parent: _animController,
      curve: const Interval(0.35, 0.90, curve: Curves.easeIn),
    );

    _textSlideAnim = Tween<Offset>(
      begin: const Offset(0.0, 0.20),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.35, 0.90, curve: Curves.easeOutCubic),
      ),
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
    bool isLoggedIn = false;
    Widget? targetDashboard;

    try {
      // Step 1: Base URL configuration
      try {
        await ApiConfig.loadSavedBaseUrl().timeout(const Duration(milliseconds: 800));
      } catch (_) {}

      // Step 2: Read stored authentication state and user details
      String? token;
      Map<String, dynamic>? user;

      try {
        token = await ApiService.getStoredToken().timeout(const Duration(milliseconds: 800));
        user = await ApiService.getStoredUser().timeout(const Duration(milliseconds: 800));
      } catch (e) {
        debugPrint('[SplashScreen] Auth read warning: $e');
      }

      // Step 3: Background non-blocking network probe and sync
      ApiService.checkHealth().timeout(const Duration(milliseconds: 1200)).catchError((e) {
        debugPrint('[SplashScreen] Backend health probe notice: $e');
        return <String, dynamic>{'connected': false};
      });

      RealtimeService().init().catchError((e) {
        debugPrint('[SplashScreen] Realtime background init notice: $e');
      });

      FcmService.syncTokenWithBackend().catchError((e) {
        debugPrint('[SplashScreen] FCM token sync notice: $e');
      });

      // Step 4: Resolve authenticated state and destination role
      if (token != null && token.isNotEmpty && user != null) {
        final role = (user['role'] ?? 'customer').toString().toLowerCase();
        final isAdmin = role == 'admin' || role == 'manager';
        final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

        if (isAdmin) {
          await ApiService.clearSession().catchError((_) {});
          isLoggedIn = false;
          targetDashboard = null;
        } else if (isStaff) {
          isLoggedIn = true;
          targetDashboard = const EmployeeDashboardScreen();
        } else {
          isLoggedIn = true;
          targetDashboard = const CustomerDashboardScreen();
        }
      } else {
        isLoggedIn = false;
        targetDashboard = null;
      }
    } catch (e) {
      debugPrint('[SplashScreen] Initialization notice: $e');
      isLoggedIn = false;
      targetDashboard = null;
    } finally {
      // Step 5: Enforce splash duration ~1.8s (1.5–2.0s maximum)
      final elapsed = DateTime.now().difference(startTime).inMilliseconds;
      const targetSplashDuration = 1800;
      final remainingDelay = targetSplashDuration - elapsed;
      if (remainingDelay > 0) {
        await Future.delayed(Duration(milliseconds: remainingDelay));
      }

      if (mounted) {
        Navigator.pushReplacement(
          context,
          LuxuryPageRoute(
            page: OnboardingScreen(
              isLoggedIn: isLoggedIn,
              targetDashboard: targetDashboard,
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final roseGold = themeColors.roseSecondary;
    final bg = themeColors.deepestBackground;

    return Scaffold(
      backgroundColor: bg,
      body: Stack(
        children: [
          // Background luxury salon texture/photo
          Positioned.fill(
            child: Image.asset(
              'assets/images/splash_bg.png',
              fit: BoxFit.cover,
              errorBuilder: (ctx, err, stack) => Container(color: bg),
            ),
          ),

          // Luxury Dark Vignette Gradient
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.90,
                  colors: [
                    bg.withValues(alpha: 0.82),
                    bg.withValues(alpha: 0.98),
                  ],
                ),
              ),
            ),
          ),

          // Central Luxury Branding
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo with Fade & Scale Animation
                  FadeTransition(
                    opacity: _logoFadeAnim,
                    child: ScaleTransition(
                      scale: _logoScaleAnim,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: primaryColor.withValues(alpha: 0.75),
                            width: 2.0,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: primaryColor.withValues(alpha: 0.35),
                              blurRadius: 30,
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
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Brand Text with Fade & Slide Up Animation
                  FadeTransition(
                    opacity: _textFadeAnim,
                    child: SlideTransition(
                      position: _textSlideAnim,
                      child: Column(
                        children: [
                          Text(
                            'SPY SALON',
                            style: TextStyle(
                              color: themeColors.textPrimary,
                              fontSize: 28,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 4.0,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'JUBILEE HILLS STUDIO',
                            style: TextStyle(
                              color: roseGold,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 2.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Subtle Luxury Motto
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: FadeTransition(
              opacity: _textFadeAnim,
              child: Center(
                child: Text(
                  'BEAUTY  •  STYLE  •  CONFIDENCE',
                  style: TextStyle(
                    color: themeColors.textMuted.withValues(alpha: 0.60),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 2.2,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
