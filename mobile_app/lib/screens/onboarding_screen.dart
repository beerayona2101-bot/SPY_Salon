import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../utils/luxury_page_route.dart';
import 'customer_dashboard_screen.dart';
import 'employee_dashboard_screen.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  final Widget? targetDashboard;

  const OnboardingScreen({super.key, this.targetDashboard});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _autoPlayTimer;
  bool _isNavigating = false;

  final List<Map<String, String>> _onboardingData = [
    {
      'image': 'assets/images/onboarding_1.png',
      'tagline': 'HAIR & STYLING EXPERTISE',
      'title': 'Discover Salon Services',
      'description': 'Explore our signature luxury hair styling, facial care, and bridal pampering packages tailored just for you.',
    },
    {
      'image': 'assets/images/onboarding_2.png',
      'tagline': 'CERTIFIED PROFESSIONALS',
      'title': 'Choose Your Specialist',
      'description': 'Book appointments directly with certified senior stylists, master barbers, and aesthetic beauty experts.',
    },
    {
      'image': 'assets/images/onboarding_3.png',
      'tagline': 'VIP BOTANICAL SPA',
      'title': 'Sit Back & Relax',
      'description': 'Enjoy seamless instant booking, live appointment status tracking, and an uncompromised luxury salon experience.',
    },
  ];

  @override
  void initState() {
    super.initState();
    if (widget.targetDashboard != null) {
      _startAutoPlay();
    }
  }

  void _startAutoPlay() {
    _autoPlayTimer = Timer.periodic(const Duration(milliseconds: 1000), (timer) {
      if (!mounted || _isNavigating) return;

      if (_currentPage < _onboardingData.length - 1) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 380),
          curve: Curves.easeInOutCubic,
        );
      } else {
        _autoPlayTimer?.cancel();
        _completeAutoPlay();
      }
    });
  }

  void _completeAutoPlay() {
    if (_isNavigating || !mounted) return;
    _isNavigating = true;
    _autoPlayTimer?.cancel();

    if (widget.targetDashboard != null) {
      Navigator.pushReplacement(
        context,
        LuxuryPageRoute(page: widget.targetDashboard!),
      );
    }
  }

  @override
  void dispose() {
    _autoPlayTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _navigateToLoginOrDashboard() {
    if (_isNavigating || !mounted) return;
    _autoPlayTimer?.cancel();

    if (widget.targetDashboard != null) {
      _completeAutoPlay();
      return;
    }

    final themeColors = AppColors.of(context);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => LoginScreen(
          onLoginSuccess: () async {
            final user = await ApiService.getStoredUser();
            final role = (user?['role'] ?? 'customer').toString().toLowerCase();
            final isAdmin = role == 'admin' || role == 'manager';
            final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

            if (!mounted) return;

            if (isAdmin) {
              await ApiService.clearSession();
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: themeColors.error,
                  content: const Text('Admin access is not available in the mobile app. Please use the Web Admin Portal.'),
                ),
              );
              return;
            }

            if (isStaff) {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (c) => const EmployeeDashboardScreen()),
                (route) => false,
              );
            } else {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (c) => const CustomerDashboardScreen()),
                (route) => false,
              );
            }
          },
        ),
      ),
    );
  }

  void _onNextPressed() {
    if (_currentPage < _onboardingData.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 380),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _navigateToLoginOrDashboard();
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final bg = themeColors.deepestBackground;
    final cardBg = themeColors.cardSurface;

    final isLastPage = _currentPage == _onboardingData.length - 1;

    return Scaffold(
      backgroundColor: bg,
      body: Stack(
        children: [
          // Onboarding PageView
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            itemCount: _onboardingData.length,
            itemBuilder: (ctx, index) {
              final data = _onboardingData[index];
              return Column(
                children: [
                  // Top Cinematic Image Area with Gradient Overlay
                  Expanded(
                    flex: 55,
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: const BorderRadius.vertical(
                              bottom: Radius.circular(36),
                            ),
                            child: Image.asset(
                              data['image']!,
                              fit: BoxFit.cover,
                              errorBuilder: (ctx, err, stack) => Container(
                                color: cardBg,
                                child: Center(
                                  child: Icon(Icons.spa, color: primaryColor, size: 64),
                                ),
                              ),
                            ),
                          ),
                        ),
                        // Dark Overlay Gradient
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: const BorderRadius.vertical(
                                bottom: Radius.circular(36),
                              ),
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.black.withValues(alpha: 0.6),
                                  Colors.transparent,
                                  bg.withValues(alpha: 0.95),
                                  bg,
                                ],
                                stops: const [0.0, 0.45, 0.88, 1.0],
                              ),
                            ),
                          ),
                        ),
                        // Top Bar (Logo + Skip Button)
                        SafeArea(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 32,
                                      height: 32,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(color: primaryColor, width: 1.5),
                                        color: themeColors.cardSurface,
                                      ),
                                      child: ClipOval(
                                        child: Image.asset(
                                          'assets/images/logo.png',
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'SPY SALON',
                                      style: TextStyle(
                                        color: themeColors.textPrimary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.5,
                                      ),
                                    ),
                                  ],
                                ),
                                TextButton(
                                  onPressed: _navigateToLoginOrDashboard,
                                  child: Text(
                                    'Skip',
                                    style: TextStyle(
                                      color: primaryColor,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Bottom Content Details Area
                  Expanded(
                    flex: 45,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: primaryColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: primaryColor.withValues(alpha: 0.3)),
                            ),
                            child: Text(
                              data['tagline']!,
                              style: TextStyle(
                                color: primaryColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            data['title']!,
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: themeColors.textPrimary,
                              letterSpacing: 0.3,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            data['description']!,
                            style: TextStyle(
                              fontSize: 14,
                              color: themeColors.textSecondary,
                              height: 1.5,
                            ),
                          ),
                          const Spacer(),

                          // Bottom Controls (Page Indicator + Navigation Pill Button)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // 3-Step Dot Indicator
                              Row(
                                children: List.generate(
                                  _onboardingData.length,
                                  (dotIndex) => AnimatedContainer(
                                    duration: const Duration(milliseconds: 300),
                                    margin: const EdgeInsets.only(right: 8),
                                    width: _currentPage == dotIndex ? 24 : 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(4),
                                      color: _currentPage == dotIndex
                                          ? primaryColor
                                          : themeColors.cardBorder,
                                      boxShadow: _currentPage == dotIndex
                                          ? [
                                              BoxShadow(
                                                color: primaryColor.withValues(alpha: 0.5),
                                                blurRadius: 8,
                                                spreadRadius: 1,
                                              )
                                            ]
                                          : [],
                                    ),
                                  ),
                                ),
                              ),

                              // Primary Action Pill Button (NEXT / GET STARTED)
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryColor,
                                  foregroundColor: themeColors.buttonTextPrimary,
                                  elevation: 6,
                                  shadowColor: primaryColor.withValues(alpha: 0.5),
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(28),
                                  ),
                                ),
                                onPressed: _onNextPressed,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      isLastPage ? 'GET STARTED' : 'NEXT',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Icon(
                                      Icons.arrow_forward_rounded,
                                      size: 18,
                                      color: themeColors.buttonTextPrimary,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

