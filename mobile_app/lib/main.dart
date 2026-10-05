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

  // Initialize FCM asynchronously in background so splash renders instantly
  FcmService.initialize().catchError((e) {
    debugPrint('[Main] FCM background init notice: $e');
  });

  final themeController = await ThemeController.loadInitial();

  runApp(
    ChangeNotifierProvider<ThemeController>.value(
      value: themeController,
      child: const SpySalonApp(),
    ),
  );
}

class SpySalonApp extends StatelessWidget {
  final ThemeController? themeController;
  const SpySalonApp({super.key, this.themeController});

  @override
  Widget build(BuildContext context) {
    return Builder(
      builder: (ctx) {
        ThemeController? controller;
        try {
          controller = Provider.of<ThemeController>(ctx, listen: true);
        } catch (_) {
          controller = themeController;
        }

        if (controller != null) {
          return _buildMaterialApp(controller.themeMode);
        }

        return ChangeNotifierProvider<ThemeController>(
          create: (_) => ThemeController(ThemeMode.dark),
          child: Consumer<ThemeController>(
            builder: (c, tc, _) => _buildMaterialApp(tc.themeMode),
          ),
        );
      },
    );
  }

  Widget _buildMaterialApp(ThemeMode mode) {
    return MaterialApp(
      navigatorKey: appNavigatorKey,
      title: 'Spy_Salon',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: mode,
      home: const SplashScreen(),
    );
  }
}
