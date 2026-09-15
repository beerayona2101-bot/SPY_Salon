import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/fcm_service.dart';
import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';
import 'theme/theme_controller.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  FcmService.setNavigatorKey(appNavigatorKey);
  await FcmService.initialize();

  final themeController = await ThemeController.loadInitial();

  runApp(
    ChangeNotifierProvider<ThemeController>.value(
      value: themeController,
      child: const SpySalonApp(),
    ),
  );
}

class SpySalonApp extends StatelessWidget {
  const SpySalonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeController>(
      builder: (context, themeController, child) {
        return MaterialApp(
          navigatorKey: appNavigatorKey,
          title: 'Spy_Salon',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeController.themeMode,
          home: const SplashScreen(),
        );
      },
    );
  }
}
