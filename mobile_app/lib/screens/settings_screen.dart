import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/theme_controller.dart';
import 'backend_settings_screen.dart';
import 'customer_dashboard_screen.dart';
import 'profile_screen.dart';
import 'update_password_screen.dart';

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

    return Scaffold(
      backgroundColor: colors.mainBackground,
      appBar: AppBar(
        backgroundColor: colors.cardSurface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: colors.primary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.asset(
                'assets/images/logo.png',
                width: 24,
                height: 24,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'App Settings',
              style: TextStyle(
                color: colors.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- SECTION 1: ACCOUNT & PROFILE ---
            _buildSectionHeader(context, 'ACCOUNT & PROFILE'),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: colors.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.cardBorder),
              ),
              child: Column(
                children: [
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    leading: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: colors.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: colors.primary.withValues(alpha: 0.4)),
                      ),
                      child: Icon(Icons.person_outline, color: colors.primary, size: 20),
                    ),
                    title: Text(
                      'Profile',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Text(
                      'Personal information & preferences',
                      style: TextStyle(color: colors.textMuted, fontSize: 12),
                    ),
                    trailing: Icon(Icons.chevron_right_rounded, color: colors.textMuted),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (ctx) => const ProfileScreen()),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // --- SECTION 2: APPEARANCE & THEME ---
            _buildSectionHeader(context, 'APPEARANCE & THEME'),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: colors.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.cardBorder),
              ),
              child: Column(
                children: [
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    leading: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: colors.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: colors.primary.withValues(alpha: 0.4)),
                      ),
                      child: Icon(
                        isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                        color: colors.primary,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      'Dark Mode',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Text(
                      isDark
                          ? 'Dark mode active throughout app'
                          : 'Light mode active throughout app',
                      style: TextStyle(color: colors.textMuted, fontSize: 12),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isDark
                                ? colors.primary.withValues(alpha: 0.2)
                                : colors.cardBorder,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isDark
                                  ? colors.primary.withValues(alpha: 0.5)
                                  : colors.cardBorder,
                            ),
                          ),
                          child: Text(
                            isDark ? 'ON 🌙' : 'OFF ☀️',
                            style: TextStyle(
                              color: isDark ? colors.primary : colors.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Switch(
                          value: isDark,
                          activeThumbColor: colors.primary,
                          activeTrackColor: colors.primary.withValues(alpha: 0.35),
                          inactiveThumbColor: colors.textMuted,
                          inactiveTrackColor: colors.inputBackground,
                          onChanged: (val) {
                            themeController.toggleTheme();
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // --- SECTION 3: UPDATE PASSWORD ---
            _buildSectionHeader(context, 'UPDATE PASSWORD'),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: colors.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.cardBorder),
              ),
              child: Column(
                children: [
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    leading: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: colors.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: colors.primary.withValues(alpha: 0.4)),
                      ),
                      child: Icon(Icons.lock_reset_outlined, color: colors.primary, size: 20),
                    ),
                    title: Text(
                      'Update Password',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Text(
                      'Change account password securely',
                      style: TextStyle(color: colors.textMuted, fontSize: 12),
                    ),
                    trailing: Icon(Icons.chevron_right_rounded, color: colors.textMuted),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (ctx) => const UpdatePasswordScreen()),
                      );
                    },
                  ),
                ],
              ),
            ),

            if (!isFromDashboard) ...[
              const SizedBox(height: 24),

              // --- SECTION 4: SYSTEM & SERVER CONFIGURATION ---
              _buildSectionHeader(context, 'SYSTEM & API CONFIGURATION'),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: colors.cardSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: colors.cardBorder),
                ),
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: colors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: colors.primary.withValues(alpha: 0.4)),
                        ),
                        child: Icon(Icons.dns_outlined, color: colors.primary, size: 20),
                      ),
                      title: Text(
                        'Backend Server & Network Settings',
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        'Configure API endpoints & port connections',
                        style: TextStyle(color: colors.textMuted, fontSize: 12),
                      ),
                      trailing: Icon(Icons.chevron_right_rounded, color: colors.textMuted),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (ctx) => const BackendSettingsScreen()),
                        );
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // --- SECTION 5: NOTIFICATIONS & ALERTS ---
              _buildSectionHeader(context, 'NOTIFICATIONS & ALERTS'),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: colors.cardSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: colors.cardBorder),
                ),
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: colors.roseSecondary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: colors.roseSecondary.withValues(alpha: 0.4)),
                        ),
                        child: Icon(Icons.notifications_active_outlined, color: colors.roseSecondary, size: 20),
                      ),
                      title: Text(
                        'Push Notifications',
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        'Realtime updates for bookings & offers',
                        style: TextStyle(color: colors.textMuted, fontSize: 12),
                      ),
                      trailing: Icon(Icons.check_circle, color: colors.success, size: 20),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // --- SECTION 6: ABOUT SPY SALON ---
              _buildSectionHeader(context, 'ABOUT & INFORMATION'),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colors.cardSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: colors.cardBorder),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: colors.primary.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.star_rounded, color: colors.primary, size: 22),
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
                    Divider(color: colors.divider),
                    const SizedBox(height: 8),
                    Text(
                      'Luxury salon management & client booking portal for iOS and Android devices.',
                      style: TextStyle(color: colors.textMuted, fontSize: 12, height: 1.4),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // --- SECTION: ACCOUNT ACTIONS & SIGN OUT ---
            _buildSectionHeader(context, 'ACCOUNT ACTIONS'),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: colors.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.error.withValues(alpha: 0.3)),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                leading: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: colors.error.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: colors.error.withValues(alpha: 0.4)),
                  ),
                  child: Icon(Icons.logout_rounded, color: colors.error, size: 20),
                ),
                title: Text(
                  'Sign Out',
                  style: TextStyle(
                    color: colors.error,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                subtitle: Text(
                  'Sign out of your session on this device',
                  style: TextStyle(color: colors.textMuted, fontSize: 12),
                ),
                trailing: Icon(Icons.arrow_forward_ios_rounded, color: colors.error, size: 16),
                onTap: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (dialogCtx) => AlertDialog(
                      backgroundColor: colors.cardSurface,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: colors.primary, width: 0.8),
                      ),
                      title: Row(
                        children: [
                          Icon(Icons.logout_rounded, color: colors.error, size: 22),
                          const SizedBox(width: 10),
                          Text(
                            'Sign Out',
                            style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
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
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    final colors = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: TextStyle(
          color: colors.primary,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}
