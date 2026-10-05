import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:spy_salon_mobile/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App renders splash screen cleanly on launch', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({'has_seen_onboarding': true});

    await tester.pumpWidget(const SpySalonApp());
    await tester.pump();

    expect(find.text('SPY SALON'), findsOneWidget);
    expect(find.text('LUXURY BEAUTY STUDIO & BOTANICAL SPA'), findsOneWidget);
  });
}
