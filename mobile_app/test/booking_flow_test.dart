import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:spy_salon_mobile/screens/book_appointment_screen.dart';
import 'package:spy_salon_mobile/theme/theme_controller.dart';
import 'package:spy_salon_mobile/theme/app_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({
      'jwt_token': 'mock_jwt_token',
      'user_data': '{"_id":"6ac411112222333344445555","name":"Test Customer","email":"test@spysalon.com","phone":"+919876543210","role":"customer"}'
    });
  });

  Widget createBookingWidget({
    Map<String, dynamic>? user,
    String? initialService,
    bool isEmbedded = false,
    VoidCallback? onBookingSuccess,
  }) {
    return ChangeNotifierProvider<ThemeController>(
      create: (_) => ThemeController(),
      child: MaterialApp(
        theme: AppTheme.darkTheme,
        home: Scaffold(
          body: BookAppointmentScreen(
            user: user ?? {
              '_id': '6ac411112222333344445555',
              'name': 'Test Customer',
              'email': 'test@spysalon.com',
              'phone': '+919876543210'
            },
            services: const [
              {'_id': 'srv_1', 'name': 'Hair Cut & Styling', 'price': 250, 'durationMinutes': 30},
              {'_id': 'srv_2', 'name': 'Hair Spa', 'price': 2699, 'durationMinutes': 60}
            ],
            specialists: const [
              {'_id': 'spec_1', 'name': 'Alex Rivera'},
              {'_id': 'spec_2', 'name': 'Elena Rostova'}
            ],
            initialService: initialService ?? 'Hair Cut & Styling',
            isEmbedded: isEmbedded,
            onBookingSuccess: onBookingSuccess,
          ),
        ),
      ),
    );
  }

  group('BookAppointmentScreen UI & Flow Tests', () {
    testWidgets('Renders all booking sections, pre-populates customer info, and displays Confirm Booking button', (tester) async {
      await tester.pumpWidget(createBookingWidget());
      await tester.pumpAndSettle();

      expect(find.text('Book Appointment'), findsOneWidget);
      expect(find.text('PERSONAL DETAILS'), findsOneWidget);
      expect(find.text('SERVICE & LOCATION'), findsOneWidget);
      expect(find.text('DATE & TIME SELECTION'), findsOneWidget);
      expect(find.text('ADDITIONAL NOTES'), findsOneWidget);
      expect(find.text('Confirm Booking'), findsOneWidget);

      // Verify pre-populated customer details
      expect(find.text('Test Customer'), findsOneWidget);
      expect(find.text('+919876543210'), findsOneWidget);
    });

    testWidgets('Slot selection updates selected slot visually', (tester) async {
      await tester.pumpWidget(createBookingWidget());
      await tester.pumpAndSettle();

      // Find 02:30 PM slot
      final slot230 = find.text('02:30 PM');
      expect(slot230, findsOneWidget);

      await tester.ensureVisible(slot230);
      await tester.tap(slot230);
      await tester.pumpAndSettle();

      // Confirm Booking button remains visible and enabled
      final confirmBtn = find.widgetWithText(ElevatedButton, 'Confirm Booking');
      expect(confirmBtn, findsOneWidget);
      await tester.ensureVisible(confirmBtn);
      final elevatedBtn = tester.widget<ElevatedButton>(confirmBtn);
      expect(elevatedBtn.onPressed, isNotNull);
    });

    testWidgets('Validates missing required fields gracefully', (tester) async {
      await tester.pumpWidget(createBookingWidget(user: {'name': '', 'phone': ''}));
      await tester.pumpAndSettle();

      // Clear the text fields explicitly
      final nameField = find.widgetWithText(TextField, 'Your Full Name *');
      expect(nameField, findsOneWidget);
      await tester.enterText(nameField, '');

      final phoneField = find.widgetWithText(TextField, 'Phone Number *');
      expect(phoneField, findsOneWidget);
      await tester.enterText(phoneField, '');

      final confirmBtn = find.widgetWithText(ElevatedButton, 'Confirm Booking');
      await tester.ensureVisible(confirmBtn);
      await tester.tap(confirmBtn);
      await tester.pumpAndSettle();

      expect(find.text('Please enter name, phone, and appointment date'), findsOneWidget);
    });
  });
}
