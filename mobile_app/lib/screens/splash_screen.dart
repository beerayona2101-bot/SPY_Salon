import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/luxury_page_route.dart';
import 'admin_dashboard_screen.dart';
import 'employee_dashboard_screen.dart';
import '../main.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;
  String _statusMessage = 'Initializing SPY Salon...';

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
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

    setState(() => _statusMessage = 'Verifying Session...');
    final user = await ApiService.getStoredUser();

    setState(() => _statusMessage = 'Connecting to Server...');
    await ApiService.checkHealth();

    // Ensure splash displays for at least 2.2 seconds for a smooth luxury launch experience
    final elapsed = DateTime.now().difference(startTime).inMilliseconds;
    final remainingDelay = 2200 - elapsed;
    if (remainingDelay > 0) {
      await Future.delayed(Duration(milliseconds: remainingDelay));
    }

    if (!mounted) return;

    Widget targetScreen = const HomeScreen();

    if (user != null) {
      final role = (user['role'] ?? 'customer').toString().toLowerCase();
      final isAdmin = role == 'admin' || role == 'manager';
      final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

      if (isAdmin) {
        targetScreen = const AdminDashboardScreen();
      } else if (isStaff) {
        targetScreen = const EmployeeDashboardScreen();
      }
    }

    Navigator.pushReplacement(
      context,
      LuxuryPageRoute(page: targetScreen),
    );
  }

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFE0A96D);

    return Scaffold(
      backgroundColor: const Color(0xFF13100E),
      body: Stack(
        children: [
          // Background luxury radial gradient
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.8,
                  colors: [
                    goldColor.withValues(alpha: 0.12),
                    const Color(0xFF13100E),
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
                        border: Border.all(color: goldColor, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: goldColor.withValues(alpha: 0.4),
                            blurRadius: 30,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/logo.png',
                          fit: BoxFit.cover,
                          errorBuilder: (ctx, err, stack) => const Center(
                            child: Text(
                              'S',
                              style: TextStyle(
                                color: goldColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 48,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'SPY SALON',
                      style: TextStyle(
                        color: Color(0xFFF6F2EB),
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 3.0,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'LUXURY BEAUTY STUDIO & BOTANICAL SPA',
                      style: TextStyle(
                        color: goldColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 48),
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: goldColor,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _statusMessage,
                      style: const TextStyle(
                        color: Colors.white54,
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
                'SPY SALON v1.0.0 • Premium Edition',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.25),
                  fontSize: 11,
                  letterSpacing: 1.0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
