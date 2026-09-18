import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/theme_controller.dart';
import 'backend_settings_screen.dart';
import 'customer_dashboard_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'update_password_screen.dart';

/// Clean Luxury Custom Painter for Top-Right & Bottom-Left Gold Background Curves
class GoldAmbientBackgroundPainter extends CustomPainter {
  final bool isDark;
  GoldAmbientBackgroundPainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    if (!isDark) return;

    // Top Right Ambient Curves
    final paintTop = Paint()
      ..shader = LinearGradient(
        colors: [
          const Color(0xFFE0A96D).withAlpha(50),
          const Color(0xFF9E6B38).withAlpha(20),
          Colors.transparent,
        ],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height * 0.35))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;

    final pathTop = Path();
    pathTop.moveTo(size.width * 0.35, 0);
    pathTop.quadraticBezierTo(
      size.width * 0.92,
      size.height * 0.03,
      size.width,
      size.height * 0.11,
    );
    pathTop.moveTo(size.width * 0.55, 0);
    pathTop.quadraticBezierTo(
      size.width * 0.98,
      size.height * 0.07,
      size.width,
      size.height * 0.16,
    );
    canvas.drawPath(pathTop, paintTop);

    // Bottom Left Ambient Curves
    final paintBottom = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.transparent,
          const Color(0xFF9E6B38).withAlpha(25),
          const Color(0xFFE0A96D).withAlpha(55),
        ],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ).createShader(Rect.fromLTWH(0, size.height * 0.7, size.width, size.height * 0.3))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final pathBottom = Path();
    pathBottom.moveTo(0, size.height * 0.86);
    pathBottom.quadraticBezierTo(
      size.width * 0.35,
      size.height * 0.92,
      size.width * 0.65,
      size.height,
    );
    pathBottom.moveTo(0, size.height * 0.91);
    pathBottom.quadraticBezierTo(
      size.width * 0.25,
      size.height * 0.96,
      size.width * 0.45,
      size.height,
    );
    canvas.drawPath(pathBottom, paintBottom);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class SettingsScreen extends StatelessWidget {
  final bool isFromDashboard;

  const SettingsScreen({
    super.key,
    this.isFromDashboard = true,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final themeController = Provider.of<ThemeController>(context);
    final isDark = themeController.isDarkMode;

    final bgBackgroundColor = isDark ? const Color(0xFF0F0E0E) : colors.mainBackground;
    final primaryGold = isDark ? const Color(0xFFE0A96D) : colors.primary;

    return Scaffold(
      backgroundColor: bgBackgroundColor,
      body: Stack(
        children: [
          // Background ambient shapes
          Positioned.fill(
            child: CustomPaint(
              painter: GoldAmbientBackgroundPainter(isDark: isDark),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                // Top Custom App Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: primaryGold,
                          size: 20,
                        ),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFBF6F0),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: primaryGold.withAlpha(40),
                              blurRadius: 6,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 28,
                            height: 28,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Icon(
                              Icons.spa_rounded,
                              size: 20,
                              color: colors.primary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'App Settings',
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),

                // Main Scrollable Content
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // --- SECTION 1: ACCOUNT & PROFILE ---
                        _buildSectionHeader(context, 'ACCOUNT & PROFILE'),
                        const SizedBox(height: 12),
                        _buildSettingCard(
                          context,
                          icon: Icons.person_outline_rounded,
                          title: 'Profile',
                          subtitle: 'Personal information & preferences',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (ctx) => const ProfileScreen()),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                        _buildSettingCard(
                          context,
                          icon: Icons.access_time_rounded,
                          title: 'Appointment History',
                          subtitle: 'View past bookings, status & schedules',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (ctx) => const HistoryScreen()),
                            );
                          },
                        ),

                        const SizedBox(height: 24),

                        // --- SECTION 2: APPEARANCE & THEME ---
                        _buildSectionHeader(context, 'APPEARANCE & THEME'),
                        const SizedBox(height: 12),
                        _buildDarkThemeCard(context, themeController),

                        const SizedBox(height: 24),

                        // --- SECTION 3: UPDATE PASSWORD ---
                        _buildSectionHeader(context, 'UPDATE PASSWORD'),
                        const SizedBox(height: 12),
                        _buildSettingCard(
                          context,
                          icon: Icons.lock_outline_rounded,
                          title: 'Update Password',
                          subtitle: 'Change account password securely',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (ctx) => const UpdatePasswordScreen()),
                            );
                          },
                        ),

                        if (!isFromDashboard) ...[
                          const SizedBox(height: 24),

                          // --- SECTION 4: SYSTEM & SERVER CONFIGURATION ---
                          _buildSectionHeader(context, 'SYSTEM & API CONFIGURATION'),
                          const SizedBox(height: 12),
                          _buildSettingCard(
                            context,
                            icon: Icons.dns_outlined,
                            title: 'Backend Server & Network Settings',
                            subtitle: 'Configure API endpoints & port connections',
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (ctx) => const BackendSettingsScreen()),
                              );
                            },
                          ),

                          const SizedBox(height: 24),

                          // --- SECTION 5: NOTIFICATIONS & ALERTS ---
                          _buildSectionHeader(context, 'NOTIFICATIONS & ALERTS'),
                          const SizedBox(height: 12),
                          _buildSettingCard(
                            context,
                            icon: Icons.notifications_active_outlined,
                            title: 'Push Notifications',
                            subtitle: 'Realtime updates for bookings & offers',
                            trailing: Icon(Icons.check_circle_rounded, color: colors.success, size: 20),
                          ),

                          const SizedBox(height: 24),

                          // --- SECTION 6: ABOUT SPY SALON ---
                          _buildSectionHeader(context, 'ABOUT & INFORMATION'),
                          const SizedBox(height: 12),
                          _buildAboutCard(context),
                        ],

                        const SizedBox(height: 24),

                        // --- SECTION: ACCOUNT ACTIONS & SIGN OUT ---
                        _buildSectionHeader(context, 'ACCOUNT ACTIONS'),
                        const SizedBox(height: 12),
                        _buildSignOutCard(context),

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Clean section header with gold title and extending horizontal line divider
  Widget _buildSectionHeader(BuildContext context, String title) {
    final colors = AppColors.of(context);
    final themeController = Provider.of<ThemeController>(context, listen: false);
    final isDark = themeController.isDarkMode;
    final primaryGold = isDark ? const Color(0xFFE0A96D) : colors.primary;

    return Row(
      children: [
        Text(
          title,
          style: TextStyle(
            color: primaryGold,
            fontSize: 11,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.3,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            height: 1,
            color: isDark ? const Color(0xFF33271F) : colors.cardBorder,
          ),
        ),
      ],
    );
  }

  /// Individual clean luxury menu setting card
  Widget _buildSettingCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    VoidCallback? onTap,
    Widget? trailing,
  }) {
    final colors = AppColors.of(context);
    final themeController = Provider.of<ThemeController>(context, listen: false);
    final isDark = themeController.isDarkMode;

    final cardBg = isDark ? const Color(0xFF151210) : colors.cardSurface;
    final cardBorderColor = isDark ? const Color(0xFF2E241E) : colors.cardBorder;
    final iconBgColor = isDark ? const Color(0xFF261D17) : colors.primary.withAlpha(30);
    final iconBorderColor = isDark ? const Color(0xFF4A382C) : colors.primary.withAlpha(80);
    final primaryGold = isDark ? const Color(0xFFE0A96D) : colors.primary;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorderColor, width: 1),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withAlpha(60) : Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                // Icon Badge Container
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: iconBorderColor, width: 1),
                  ),
                  child: Icon(icon, color: primaryGold, size: 22),
                ),
                const SizedBox(width: 14),

                // Title and Subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: colors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),

                // Trailing Widget or Chevron
                trailing ??
                    Icon(
                      Icons.chevron_right_rounded,
                      color: isDark ? const Color(0xFF8B7D71) : colors.textMuted,
                      size: 20,
                    ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Dark theme toggle card matching screenshot pill badge and styled switch
  Widget _buildDarkThemeCard(BuildContext context, ThemeController themeController) {
    final colors = AppColors.of(context);
    final isDark = themeController.isDarkMode;

    final cardBg = isDark ? const Color(0xFF151210) : colors.cardSurface;
    final cardBorderColor = isDark ? const Color(0xFF382B21) : colors.cardBorder;
    final iconBgColor = isDark ? const Color(0xFF261D17) : colors.primary.withAlpha(30);
    final iconBorderColor = isDark ? const Color(0xFF4A382C) : colors.primary.withAlpha(80);
    final primaryGold = isDark ? const Color(0xFFE0A96D) : colors.primary;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorderColor, width: 1),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black.withAlpha(70) : Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            // Moon Icon Container
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: iconBorderColor, width: 1),
              ),
              child: Icon(
                isDark ? Icons.nightlight_round : Icons.wb_sunny_rounded,
                color: primaryGold,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),

            // Title and Subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Dark Mode',
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    isDark
                        ? 'Dark mode active throughout app'
                        : 'Light mode active throughout app',
                    style: TextStyle(
                      color: colors.textMuted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            // "ON >" Pill Tag Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF261C14) : colors.primary.withAlpha(20),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? const Color(0xFFE0A96D) : colors.primary,
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isDark ? 'ON' : 'OFF',
                    style: TextStyle(
                      color: isDark ? const Color(0xFFE0A96D) : colors.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 3),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: isDark ? const Color(0xFFE0A96D) : colors.primary,
                    size: 13,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),

            // Custom Switch Toggle
            Transform.scale(
              scale: 0.9,
              child: Switch(
                value: isDark,
                activeThumbColor: const Color(0xFFE0A96D),
                activeTrackColor: const Color(0xFF4A382A),
                inactiveThumbColor: colors.textMuted,
                inactiveTrackColor: colors.inputBackground,
                onChanged: (val) {
                  themeController.toggleTheme();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Red-glowing Sign Out Card matching screenshot design
  Widget _buildSignOutCard(BuildContext context) {
    final colors = AppColors.of(context);
    final themeController = Provider.of<ThemeController>(context, listen: false);
    final isDark = themeController.isDarkMode;

    final cardBg = isDark ? const Color(0xFF1A1012) : colors.cardSurface;
    final cardBorderColor = isDark ? const Color(0xFF6E2833) : colors.error.withAlpha(100);
    final iconBgColor = isDark ? const Color(0xFF331418) : colors.error.withAlpha(25);
    final iconBorderColor = isDark ? const Color(0xFF8B2B38) : colors.error.withAlpha(100);
    final redTextColor = isDark ? const Color(0xFFF87171) : colors.error;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE57373).withAlpha(isDark ? 30 : 15),
            blurRadius: 10,
            spreadRadius: 1,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (dialogCtx) => AlertDialog(
                backgroundColor: isDark ? const Color(0xFF1A1412) : colors.cardSurface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: isDark ? const Color(0xFFE0A96D) : colors.primary,
                    width: 0.8,
                  ),
                ),
                title: Row(
                  children: [
                    Icon(Icons.logout_rounded, color: colors.error, size: 22),
                    const SizedBox(width: 10),
                    Text(
                      'Sign Out',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                content: Text(
                  'Are you sure you want to sign out from SPY Salon?',
                  style: TextStyle(color: colors.textSecondary, fontSize: 14),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(dialogCtx, false),
                    child: Text('Cancel', style: TextStyle(color: colors.textMuted)),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colors.error,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => Navigator.pop(dialogCtx, true),
                    child: const Text('Sign Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            );

            if (confirm == true) {
              await ApiService.logout();
              if (context.mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(
                    builder: (ctx) => const CustomerDashboardScreen(),
                  ),
                  (route) => false,
                );
              }
            }
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                // Red Logout Icon Container
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: iconBorderColor, width: 1),
                  ),
                  child: Icon(Icons.logout_rounded, color: redTextColor, size: 22),
                ),
                const SizedBox(width: 14),

                // Title and Subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sign Out',
                        style: TextStyle(
                          color: redTextColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Sign out of your session on this device',
                        style: TextStyle(
                          color: colors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),

                // Red Chevron
                Icon(
                  Icons.chevron_right_rounded,
                  color: redTextColor,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Clean About SPY Salon card
  Widget _buildAboutCard(BuildContext context) {
    final colors = AppColors.of(context);
    final themeController = Provider.of<ThemeController>(context, listen: false);
    final isDark = themeController.isDarkMode;

    final cardBg = isDark ? const Color(0xFF151210) : colors.cardSurface;
    final cardBorderColor = isDark ? const Color(0xFF2E241E) : colors.cardBorder;
    final primaryGold = isDark ? const Color(0xFFE0A96D) : colors.primary;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorderColor, width: 1),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: primaryGold.withAlpha(30),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.star_rounded, color: primaryGold, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SPY Salon Mobile',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      'Version 1.0.0+1 • Jubilee Hills Studio',
                      style: TextStyle(color: colors.textMuted, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: isDark ? const Color(0xFF2E241E) : colors.divider),
          const SizedBox(height: 8),
          Text(
            'Luxury salon management & client booking portal for iOS and Android devices.',
            style: TextStyle(color: colors.textMuted, fontSize: 12, height: 1.4),
          ),
        ],
      ),
    );
  }
}
