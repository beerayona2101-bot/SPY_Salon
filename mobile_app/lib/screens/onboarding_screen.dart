import 'dart:async';
import 'package:flutter/material.dart';
import '../services/onboarding_service.dart';
import '../theme/app_colors.dart';
import '../utils/luxury_page_route.dart';
import 'customer_dashboard_screen.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  final bool isLoggedIn;
  final Widget? targetDashboard;

  const OnboardingScreen({
    super.key,
    this.isLoggedIn = false,
    this.targetDashboard,
  });

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _autoPlayTimer;
  bool _isNavigating = false;

  static const int _autoPlayDurationSeconds = 6;

  final List<Map<String, String>> _slides = [
    {
      'image': 'assets/images/onboarding_1.png',
      'tagline': 'SIGNATURE EXPERIENCE',
      'title': 'Discover Your Style',
      'description': 'Experience premium salon services designed around your personal style and beauty.',
    },
    {
      'image': 'assets/images/onboarding_2.png',
      'tagline': 'SEAMLESS SCHEDULING',
      'title': 'Book With Ease',
      'description': 'Choose your service, specialist, date and time — and book your salon appointment effortlessly.',
    },
    {
      'image': 'assets/images/onboarding_3.png',
      'tagline': 'EXCLUSIVITY & CARE',
      'title': 'Your Salon Experience',
      'description': 'Manage your appointments, stay connected with SPY Salon, and enjoy a seamless beauty experience.',
    },
  ];

  @override
  void initState() {
    super.initState();
    // For logged-in users, start the 6-second auto-advance timer
    if (widget.isLoggedIn) {
      _startAutoPlayTimer();
    }
  }

  @override
  void dispose() {
    _autoPlayTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  /// Starts or resets the 6-second timer for authenticated users
  void _startAutoPlayTimer() {
    _autoPlayTimer?.cancel();
    if (!widget.isLoggedIn || _isNavigating || !mounted) return;

    _autoPlayTimer = Timer(const Duration(seconds: _autoPlayDurationSeconds), () {
      if (!mounted || _isNavigating) return;

      if (_currentPage < _slides.length - 1) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 450),
          curve: Curves.easeInOutCubic,
        );
      } else {
        // Finished last slide for logged-in user -> Navigate to authenticated dashboard
        _finishOnboarding(toLogin: false);
      }
    });
  }

  /// Completes onboarding, sets persistent state, and navigates
  Future<void> _finishOnboarding({required bool toLogin}) async {
    if (_isNavigating || !mounted) return;
    _isNavigating = true;
    _autoPlayTimer?.cancel();

    // Persist onboarding completion
    await OnboardingService.setOnboardingCompleted();

    if (!mounted) return;

    if (toLogin) {
      Navigator.pushReplacement(
        context,
        LuxuryPageRoute(
          page: LoginScreen(
            onLoginSuccess: () {},
          ),
        ),
      );
    } else {
      final destination = widget.targetDashboard ?? const CustomerDashboardScreen();
      Navigator.pushReplacement(
        context,
        LuxuryPageRoute(page: destination),
      );
    }
  }

  void _onPageChanged(int index) {
    if (!mounted) return;
    setState(() {
      _currentPage = index;
    });

    // Reset 6-second timer if logged in and user swiped
    if (widget.isLoggedIn) {
      _startAutoPlayTimer();
    }
  }

  void _onNextPressed() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 380),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _finishOnboarding(toLogin: !widget.isLoggedIn);
    }
  }

  void _onSkipPressed() {
    _finishOnboarding(toLogin: !widget.isLoggedIn);
  }

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final bg = themeColors.deepestBackground;
    final cardBg = themeColors.cardSurface;
    final isLastPage = _currentPage == _slides.length - 1;

    return PopScope(
      canPop: _currentPage == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_currentPage > 0) {
          _pageController.previousPage(
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeInOutCubic,
          );
        }
      },
      child: Scaffold(
        backgroundColor: bg,
        body: Stack(
          children: [
            // Slide Carousel
            PageView.builder(
              controller: _pageController,
              onPageChanged: _onPageChanged,
              itemCount: _slides.length,
              itemBuilder: (ctx, index) {
                final slide = _slides[index];
                return Column(
                  children: [
                    // Top Cinematic Image Area with Vignette
                    Expanded(
                      flex: 54,
                      child: Stack(
                        children: [
                          Positioned.fill(
                            child: ClipRRect(
                              borderRadius: const BorderRadius.vertical(
                                bottom: Radius.circular(32),
                              ),
                              child: Image.asset(
                                slide['image']!,
                                fit: BoxFit.cover,
                                errorBuilder: (ctx, err, stack) => Container(
                                  color: cardBg,
                                  child: Center(
                                    child: Icon(
                                      Icons.spa_rounded,
                                      color: primaryColor,
                                      size: 56,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),

                          // Dark luxury overlay gradient
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: const BorderRadius.vertical(
                                  bottom: Radius.circular(32),
                                ),
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.black.withValues(alpha: 0.65),
                                    Colors.transparent,
                                    bg.withValues(alpha: 0.90),
                                    bg,
                                  ],
                                  stops: const [0.0, 0.40, 0.85, 1.0],
                                ),
                              ),
                            ),
                          ),

                          // Top Branding Bar & Skip Action
                          SafeArea(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
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
                                          border: Border.all(
                                            color: primaryColor.withValues(alpha: 0.8),
                                            width: 1.5,
                                          ),
                                          color: themeColors.cardSurface,
                                        ),
                                        child: ClipOval(
                                          child: Image.asset(
                                            'assets/images/logo.png',
                                            fit: BoxFit.cover,
                                            errorBuilder: (c, e, s) => Center(
                                              child: Text(
                                                'S',
                                                style: TextStyle(
                                                  color: primaryColor,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Text(
                                        'SPY SALON',
                                        style: TextStyle(
                                          color: themeColors.textPrimary,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 2.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                  // Skip Button
                                  TextButton(
                                    onPressed: _onSkipPressed,
                                    style: TextButton.styleFrom(
                                      foregroundColor: primaryColor,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                    ),
                                    child: Text(
                                      'Skip',
                                      style: TextStyle(
                                        color: primaryColor,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
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

                    // Bottom Content Area
                    Expanded(
                      flex: 46,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(28, 16, 28, 28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Tagline pill
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: primaryColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: primaryColor.withValues(alpha: 0.28),
                                  width: 1.0,
                                ),
                              ),
                              child: Text(
                                slide['tagline']!,
                                style: TextStyle(
                                  color: primaryColor,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.4,
                                ),
                              ),
                            ),

                            const SizedBox(height: 12),

                            // Slide Title
                            Text(
                              slide['title']!,
                              style: TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.bold,
                                color: themeColors.textPrimary,
                                letterSpacing: 0.3,
                                height: 1.2,
                              ),
                            ),

                            const SizedBox(height: 10),

                            // Slide Description
                            Text(
                              slide['description']!,
                              style: TextStyle(
                                fontSize: 14,
                                color: themeColors.textSecondary,
                                height: 1.45,
                                letterSpacing: 0.2,
                              ),
                            ),

                            const Spacer(),

                            // Controls Row: Indicators + Actions
                            if (!isLastPage) ...[
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  // Animated Page Indicators
                                  Row(
                                    children: List.generate(
                                      _slides.length,
                                      (dotIndex) => AnimatedContainer(
                                        duration: const Duration(milliseconds: 260),
                                        margin: const EdgeInsets.only(right: 6),
                                        width: _currentPage == dotIndex ? 24 : 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(4),
                                          color: _currentPage == dotIndex
                                              ? primaryColor
                                              : themeColors.cardBorder.withValues(alpha: 0.6),
                                          boxShadow: _currentPage == dotIndex
                                              ? [
                                                  BoxShadow(
                                                    color: primaryColor.withValues(alpha: 0.45),
                                                    blurRadius: 6,
                                                    spreadRadius: 1,
                                                  ),
                                                ]
                                              : [],
                                        ),
                                      ),
                                    ),
                                  ),

                                  // Next Button (Slide 1 & 2)
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: primaryColor,
                                      foregroundColor: themeColors.buttonTextPrimary,
                                      elevation: 4,
                                      shadowColor: primaryColor.withValues(alpha: 0.4),
                                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 13),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(28),
                                      ),
                                    ),
                                    onPressed: _onNextPressed,
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Next',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 0.8,
                                            color: themeColors.buttonTextPrimary,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Icon(
                                          Icons.arrow_forward_rounded,
                                          size: 17,
                                          color: themeColors.buttonTextPrimary,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ] else ...[
                              // Slide 3: Page Indicator + Prominent "Get Started" Button
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Center(
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: List.generate(
                                        _slides.length,
                                        (dotIndex) => AnimatedContainer(
                                          duration: const Duration(milliseconds: 260),
                                          margin: const EdgeInsets.symmetric(horizontal: 3),
                                          width: _currentPage == dotIndex ? 24 : 8,
                                          height: 8,
                                          decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(4),
                                            color: _currentPage == dotIndex
                                                ? primaryColor
                                                : themeColors.cardBorder.withValues(alpha: 0.6),
                                            boxShadow: _currentPage == dotIndex
                                                ? [
                                                    BoxShadow(
                                                      color: primaryColor.withValues(alpha: 0.45),
                                                      blurRadius: 6,
                                                      spreadRadius: 1,
                                                    ),
                                                  ]
                                                : [],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: primaryColor,
                                      foregroundColor: themeColors.buttonTextPrimary,
                                      elevation: 5,
                                      shadowColor: primaryColor.withValues(alpha: 0.45),
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(28),
                                      ),
                                    ),
                                    onPressed: _onNextPressed,
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Get Started',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 1.0,
                                            color: themeColors.buttonTextPrimary,
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
                            ],
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
      ),
    );
  }
}
