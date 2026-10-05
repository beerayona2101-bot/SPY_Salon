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

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _animController;
  late AnimationController _pulseController;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;
  late Animation<double> _glowAnim;

  String _statusMessage = 'Initializing luxury studio...';
  double _loadingProgress = 0.15;

  @override
  void initState() {
    super.initState();

    // Intro entrance animation
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeIn);
    _scaleAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutBack),
    );

    // Continuous subtle breathing glow for gold emblem
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);

    _glowAnim = Tween<double>(begin: 0.35, end: 0.85).animate(
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
    Widget destination = const CustomerDashboardScreen();

    try {
      // --- STAGE 1: LOCAL ENVIRONMENT & AUTH CREDENTIALS ---
      Map<String, dynamic>? user;
      bool hasSeenOnboarding = false;

      try {
        await ApiConfig.loadSavedBaseUrl().timeout(const Duration(milliseconds: 1000));
      } catch (_) {}

      try {
        user = await ApiService.getStoredUser().timeout(const Duration(milliseconds: 1000));
      } catch (_) {}

      try {
        final prefs = await SharedPreferences.getInstance().timeout(const Duration(milliseconds: 1000));
        hasSeenOnboarding = prefs.getBool('has_seen_onboarding') ?? false;
      } catch (_) {}

      if (mounted) {
        setState(() {
          _loadingProgress = 0.35;
          _statusMessage = 'Connecting to SPY Salon server...';
        });
      }

      await Future.delayed(const Duration(milliseconds: 600));

      // --- STAGE 2: BACKEND NETWORK DISCOVERY & REALTIME SYNC ---
      try {
        await ApiService.checkHealth().timeout(const Duration(milliseconds: 1500));
      } catch (e) {
        debugPrint('[SplashScreen] Backend health probe notice: $e');
      }

      RealtimeService().init().catchError((e) {
        debugPrint('[SplashScreen] Realtime background init notice: $e');
      });
      FcmService.syncTokenWithBackend().catchError((e) {
        debugPrint('[SplashScreen] FCM token sync background notice: $e');
      });

      if (mounted) {
        setState(() {
          _loadingProgress = 0.70;
          _statusMessage = 'Loading beauty services & stylists...';
        });
      }

      await Future.delayed(const Duration(milliseconds: 650));

      // --- STAGE 3: CACHE WARM-UP & DESTINATION RESOLUTION ---
      try {
        // Pre-fetch services so customer dashboard loads with 0ms lag
        await ApiService.getServices().timeout(const Duration(milliseconds: 1500));
      } catch (_) {}

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
          destination = const CustomerDashboardScreen();
        } else {
          destination = const OnboardingScreen();
        }
      }

      if (mounted) {
        setState(() {
          _loadingProgress = 1.0;
          _statusMessage = 'Welcome to SPY Salon ✨';
        });
      }

      // --- STAGE 4: LUXURY TIMING CONFIRMATION ---
      // Ensure splash & loading page remains comfortably visible for ~2.8 seconds total
      final elapsed = DateTime.now().difference(startTime).inMilliseconds;
      const targetSplashDuration = 2800;
      final remainingDelay = targetSplashDuration - elapsed;
      if (remainingDelay > 0) {
        await Future.delayed(Duration(milliseconds: remainingDelay));
      }
    } catch (e) {
      debugPrint('[SplashScreen] Notice during splash initialization: $e');
      destination = const CustomerDashboardScreen();
      final elapsed = DateTime.now().difference(startTime).inMilliseconds;
      const targetSplashDuration = 2800;
      final remainingDelay = targetSplashDuration - elapsed;
      if (remainingDelay > 0) {
        await Future.delayed(Duration(milliseconds: remainingDelay));
      }
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

          // Dark Overlay Vignette Gradient
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.95,
                  colors: [
                    bg.withValues(alpha: 0.80),
                    bg.withValues(alpha: 0.98),
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
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Circular Logo Emblem with Animated Gold Glow Pulse
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Container(
                            width: 125,
                            height: 125,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: primaryColor.withValues(alpha: _glowAnim.value),
                                width: 2.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: primaryColor.withValues(alpha: _glowAnim.value * 0.6),
                                  blurRadius: 36,
                                  spreadRadius: 6,
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
                                      fontSize: 52,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 28),

                      // Brand Titles
                      Text(
                        'SPY SALON',
                        style: TextStyle(
                          color: themeColors.textPrimary,
                          fontSize: 30,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 3.8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'LUXURY BEAUTY STUDIO & BOTANICAL SPA',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: primaryColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2.0,
                        ),
                      ),

                      const SizedBox(height: 52),

                      // Elegant Luxury Horizontal Progress Bar
                      Container(
                        width: 220,
                        height: 5,
                        decoration: BoxDecoration(
                          color: themeColors.cardBorder.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: AnimatedFractionallySizedBox(
                            duration: const Duration(milliseconds: 350),
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
                                borderRadius: BorderRadius.circular(3),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryColor.withValues(alpha: 0.55),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Loading Progress Percentage & Status Label
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.0,
                              color: primaryColor.withValues(alpha: 0.8),
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
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Bottom Luxury Brand Motto
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'BEAUTY  |  STYLE  |  CONFIDENCE',
                style: TextStyle(
                  color: themeColors.textMuted.withValues(alpha: 0.55),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2.2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
