import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const SpySalonApp());
}

class SpySalonApp extends StatelessWidget {
  const SpySalonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Spy_Salon',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFE0A96D),
        scaffoldBackgroundColor: const Color(0xFF13100E),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFE0A96D),
          secondary: Color(0xFFC8868F),
          surface: Color(0xFF191512),
        ),
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}
