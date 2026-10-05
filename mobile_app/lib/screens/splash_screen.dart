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

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _animController;
  late AnimationController _pulseController;
  late Animation<double> _logoFadeAnim;
  late Animation<double> _logoScaleAnim;
  late Animation<double> _textFadeAnim;
  late Animation<Offset> _textSlideAnim;
  late Animation<double> _glowAnim;

  String _statusMessage = 'Initializing luxury studio...';
  double _loadingProgress = 0.20;

  @override
  void initState() {
    super.initState();

    // Intro entrance animation (~1000ms total)
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    // 1. Logo fades in and scales smoothly
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

    // 2. Brand texts fade and slide up subtly
    _textFadeAnim = CurvedAnimation(
      parent: _animController,
      curve: const Interval(0.30, 0.90, curve: Curves.easeIn),
    );

    _textSlideAnim = Tween<Offset>(
      begin: const Offset(0.0, 0.18),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.30, 0.90, curve: Curves.easeOutCubic),
      ),
    );

    // 3. Continuous subtle breathing glow for the gold emblem
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _glowAnim = Tween<double>(begin: 0.40, end: 0.90).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _animController.forward();
    _initializeApp();
  }

  @override
  void dispose() {
    _animController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _initializeApp() async {
    final startTime = DateTime.now();
    bool isLoggedIn = false;
    Widget? targetDashboard;

    try {
      // Stage 1: Local environment & credentials check
      try {
        await ApiConfig.loadSavedBaseUrl().timeout(const Duration(milliseconds: 800));
      } catch (_) {}

      String? token;
      Map<String, dynamic>? user;

      try {
        token = await ApiService.getStoredToken().timeout(const Duration(milliseconds: 800));
        user = await ApiService.getStoredUser().timeout(const Duration(milliseconds: 800));
      } catch (e) {
        debugPrint('[SplashScreen] Auth read notice: $e');
      }

      if (mounted) {
        setState(() {
          _loadingProgress = 0.50;
          _statusMessage = 'Connecting to SPY Salon server...';
        });
      }

      await Future.delayed(const Duration(milliseconds: 450));

      // Stage 2: Background network discovery & realtime sync
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

      if (mounted) {
        setState(() {
          _loadingProgress = 0.85;
          _statusMessage = 'Loading beauty services & stylists...';
        });
      }

      await Future.delayed(const Duration(milliseconds: 450));

      // Stage 3: Resolve role-based navigation destination
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

      if (mounted) {
        setState(() {
          _loadingProgress = 1.0;
          _statusMessage = 'Welcome to SPY Salon ✨';
        });
      }

      // Stage 4: Maintain smooth presentation duration (~2.2 seconds total)
      final elapsed = DateTime.now().difference(startTime).inMilliseconds;
      const targetSplashDuration = 2200;
      final remainingDelay = targetSplashDuration - elapsed;
      if (remainingDelay > 0) {
        await Future.delayed(Duration(milliseconds: remainingDelay));
      }
    } catch (e) {
      debugPrint('[SplashScreen] Notice during splash initialization: $e');
      isLoggedIn = false;
      targetDashboard = null;
      final elapsed = DateTime.now().difference(startTime).inMilliseconds;
      const targetSplashDuration = 2000;
      final remainingDelay = targetSplashDuration - elapsed;
      if (remainingDelay > 0) {
        await Future.delayed(Duration(milliseconds: remainingDelay));
      }
    } finally {
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

          // Central Luxury Branding & Loading Experience
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo with Fade & Scale Animation + Gold Glow Pulse
                  FadeTransition(
                    opacity: _logoFadeAnim,
                    child: ScaleTransition(
                      scale: _logoScaleAnim,
                      child: AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: primaryColor.withValues(alpha: _glowAnim.value),
                                width: 2.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: primaryColor.withValues(alpha: _glowAnim.value * 0.5),
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
                          );
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 26),

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

                  const SizedBox(height: 48),

                  // Elegant Luxury Horizontal Loading Progress Bar
                  FadeTransition(
                    opacity: _textFadeAnim,
                    child: Container(
                      width: 220,
                      height: 4,
                      decoration: BoxDecoration(
                        color: themeColors.cardBorder.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: AnimatedFractionallySizedBox(
                          duration: const Duration(milliseconds: 320),
                          curve: Curves.easeOutCubic,
                          widthFactor: _loadingProgress.clamp(0.05, 1.0),
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  primaryColor.withValues(alpha: 0.7),
                                  primaryColor,
                                ],
                              ),
                              borderRadius: BorderRadius.circular(2),
                              boxShadow: [
                                BoxShadow(
                                  color: primaryColor.withValues(alpha: 0.5),
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Loading Progress Spinner & Dynamic Status Message
                  FadeTransition(
                    opacity: _textFadeAnim,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 13,
                          height: 13,
                          child: CircularProgressIndicator(
                            strokeWidth: 1.8,
                            color: primaryColor.withValues(alpha: 0.85),
                          ),
                        ),
                        const SizedBox(width: 8),
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 250),
                          child: Text(
                            _statusMessage,
                            key: ValueKey<String>(_statusMessage),
                            style: TextStyle(
                              color: themeColors.textMuted,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ],
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
