import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:spy_salon_mobile/screens/onboarding_screen.dart';
import 'package:spy_salon_mobile/services/onboarding_service.dart';
import 'package:spy_salon_mobile/theme/app_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('OnboardingService Tests', () {
    test('Initial onboarding completed state is false', () async {
      final isCompleted = await OnboardingService.isOnboardingCompleted();
      expect(isCompleted, false);
    });

    test('setOnboardingCompleted persists true', () async {
      await OnboardingService.setOnboardingCompleted();
      final isCompleted = await OnboardingService.isOnboardingCompleted();
      expect(isCompleted, true);
    });

    test('resetOnboarding resets status', () async {
      await OnboardingService.setOnboardingCompleted();
      await OnboardingService.resetOnboarding();
      final isCompleted = await OnboardingService.isOnboardingCompleted();
      expect(isCompleted, false);
    });
  });

  group('OnboardingScreen Widget Tests', () {
    testWidgets('Renders Slide 1 content and Next button for Logged-Out user', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const OnboardingScreen(isLoggedIn: false),
        ),
      );
      await tester.pump();

      expect(find.text('Discover Your Style'), findsOneWidget);
      expect(find.text('Experience premium salon services designed around your personal style and beauty.'), findsOneWidget);
      expect(find.text('Skip'), findsOneWidget);
      expect(find.text('Next'), findsOneWidget);

      // Verify no auto-advance when waiting (logged-out manual requirement)
      await tester.pump(const Duration(seconds: 10));
      expect(find.text('Discover Your Style'), findsOneWidget);

      // Tap Next to advance to Slide 2
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      expect(find.text('Book With Ease'), findsOneWidget);
      expect(find.text('Choose your service, specialist, date and time — and book your salon appointment effortlessly.'), findsOneWidget);

      // Tap Next to advance to Slide 3
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();

      expect(find.text('Your Salon Experience'), findsOneWidget);
      expect(find.text('Get Started'), findsOneWidget);
    });

    testWidgets('Logged-in user auto-advances through slides every 6 seconds', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const OnboardingScreen(
            isLoggedIn: true,
            targetDashboard: Scaffold(
              body: Center(child: Text('Customer Dashboard Target')),
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Discover Your Style'), findsOneWidget);

      // Advance 6 seconds -> Slide 2
      await tester.pump(const Duration(seconds: 6));
      await tester.pumpAndSettle();
      expect(find.text('Book With Ease'), findsOneWidget);

      // Advance 6 seconds -> Slide 3
      await tester.pump(const Duration(seconds: 6));
      await tester.pumpAndSettle();
      expect(find.text('Your Salon Experience'), findsOneWidget);

      // Advance 6 seconds -> Auto completes to dashboard
      await tester.pump(const Duration(seconds: 6));
      await tester.pumpAndSettle();
      expect(find.text('Customer Dashboard Target'), findsOneWidget);
    });

    testWidgets('Skip button for logged-in user navigates directly to target dashboard', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const OnboardingScreen(
            isLoggedIn: true,
            targetDashboard: Scaffold(
              body: Center(child: Text('Skipped to Dashboard')),
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Skip'), findsOneWidget);
      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();

      expect(find.text('Skipped to Dashboard'), findsOneWidget);
    });
  });
}
