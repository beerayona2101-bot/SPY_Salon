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
import 'terms_and_conditions_screen.dart';
import 'privacy_policy_screen.dart';

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

class SettingsScreen extends StatefulWidget {
  final bool isFromDashboard;
  final bool isEmbedded;
  final Map<String, dynamic>? initialUser;
  final VoidCallback? onExploreVip;

  const SettingsScreen({
    super.key,
    this.isFromDashboard = true,
    this.isEmbedded = false,
    this.initialUser,
    this.onExploreVip,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isCustomer = false;
  bool _isLoadingUser = true;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _membershipData;

  @override
  void initState() {
    super.initState();
    _user = widget.initialUser;
    _checkUserRole();
  }

  @override
  void didUpdateWidget(covariant SettingsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialUser != oldWidget.initialUser) {
      setState(() {
        _user = widget.initialUser;
      });
      _checkUserRole();
    }
  }

  Future<void> _checkUserRole() async {
    final user = widget.initialUser ?? await ApiService.fetchCurrentUserProfile();
    Map<String, dynamic>? membership;
    try {
      final membRes = await ApiService.getMyMembership();
      if (membRes != null && membRes['membership'] != null) {
        membership = membRes['membership'] is Map<String, dynamic>
            ? membRes['membership'] as Map<String, dynamic>
            : Map<String, dynamic>.from(membRes['membership']);
      }
    } catch (_) {}

    if (membership == null && user?['membership'] is Map) {
      membership = Map<String, dynamic>.from(user!['membership']);
    }

    if (mounted) {
      setState(() {
        _user = user;
        _membershipData = membership;
        final role = user?['role']?.toString().toLowerCase();
        _isCustomer = (role == 'customer' || (user != null && role == null));
        _isLoadingUser = false;
      });
    }
  }

  bool get _hasActiveVip {
    if (_membershipData != null) {
      final status = (_membershipData!['status'] ?? '').toString().toLowerCase();
      if (status == 'active' || status == 'paid') return true;
    }
    if (_user != null) {
      if (_user!['membership'] is Map) {
        final st = (_user!['membership']['status'] ?? '').toString().toLowerCase();
        if (st == 'active' || st == 'paid') return true;
      }
      final tier = (_user!['membershipTier'] ?? _user!['tier'] ?? '').toString().toLowerCase();
      if (tier.contains('vip') || tier.contains('gold') || tier.contains('premium') || tier.contains('standard')) {
        return true;
      }
    }
    return false;
  }

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
                if (!widget.isEmbedded)
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

                        // VIP Membership Card
                        _buildVipMembershipCard(context, colors),
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

                        // --- SECTION 3: UPDATE PASSWORD & SECURITY ---
                        _buildSectionHeader(context, 'SECURITY & ACCOUNT MANAGEMENT'),
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

                        // Delete Account (Only for Customer accounts)
                        if (!_isLoadingUser && _isCustomer) ...[
                          const SizedBox(height: 12),
                          _buildDeleteAccountCard(context),
                        ],

                        if (!widget.isFromDashboard) ...[
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

                          // --- SECTION 6: LEGAL & POLICIES ---
                          _buildSectionHeader(context, 'LEGAL & POLICIES'),
                          const SizedBox(height: 12),
                          _buildSettingCard(
                            context,
                            icon: Icons.gavel_outlined,
                            title: 'Terms & Conditions',
                            subtitle: 'Service agreement, booking & refund rules',
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (ctx) => const TermsAndConditionsScreen()),
                              );
                            },
                          ),
                          const SizedBox(height: 12),
                          _buildSettingCard(
                            context,
                            icon: Icons.shield_outlined,
                            title: 'Privacy Policy',
                            subtitle: 'Data collection, usage & user rights',
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (ctx) => const PrivacyPolicyScreen()),
                              );
                            },
                          ),

                          const SizedBox(height: 24),

                          // --- SECTION 7: ABOUT SPY SALON ---
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

  /// Clean Luxury VIP Membership Card
  Widget _buildVipMembershipCard(BuildContext context, AppColors colors) {
    final themeController = Provider.of<ThemeController>(context, listen: false);
    final isDark = themeController.isDarkMode;
    final primaryGold = isDark ? const Color(0xFFE0A96D) : colors.primary;

    final hasVip = _hasActiveVip;

    if (hasVip) {
      final tierName = _membershipData?['planName'] ??
          _membershipData?['tier'] ??
          _user?['membership']?['tier'] ??
          _user?['membershipTier'] ??
          'VIP Member';
      final billingCycle = (_membershipData?['billingCycle'] ?? 'monthly').toString();
      final discount = _membershipData?['discountPercentage'] ??
          _membershipData?['discountPercent'] ??
          _user?['membership']?['discountPercent'] ??
          15;
      final membershipId = _membershipData?['membershipId'] ??
          _user?['membership']?['membershipId'] ??
          'MEMB-${_user?['id']?.toString().substring(0, 5) ?? '84920'}';

      String expiryFormatted = '30 Days from Activation';
      try {
        final expRaw = _membershipData?['expiryDate'] ?? _user?['membership']?['expiryDate'];
        if (expRaw != null) {
          final dt = DateTime.parse(expRaw.toString());
          final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          expiryFormatted = '${dt.day} ${months[dt.month - 1]} ${dt.year}';
        }
      } catch (_) {}

      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: isDark
                ? [
                    const Color(0xFF2B2017),
                    const Color(0xFF16120F),
                    const Color(0xFF0F0E0E),
                  ]
                : [
                    primaryGold.withValues(alpha: 0.18),
                    colors.cardSurface,
                  ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: primaryGold.withValues(alpha: 0.6),
            width: 1.4,
          ),
          boxShadow: [
            BoxShadow(
              color: primaryGold.withValues(alpha: 0.15),
              blurRadius: 16,
              spreadRadius: 1,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Badge & Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: primaryGold.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.workspace_premium_rounded, color: primaryGold, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tierName.toString().toUpperCase(),
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${billingCycle.toUpperCase()} PLAN • $membershipId',
                            style: TextStyle(
                              color: primaryGold,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.greenAccent.withValues(alpha: 0.6)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle_rounded, color: Colors.greenAccent, size: 12),
                        SizedBox(width: 4),
                        Text(
                          'ACTIVE',
                          style: TextStyle(
                            color: Colors.greenAccent,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Divider(color: primaryGold.withValues(alpha: 0.25), height: 1),
              const SizedBox(height: 14),

              // Benefits list
              Row(
                children: [
                  Icon(Icons.percent_rounded, color: primaryGold, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'Flat $discount% OFF on all salon treatments',
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.bolt_rounded, color: primaryGold, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'Priority booking queue & VIP specialist assignment',
                    style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.event_available_rounded, color: primaryGold, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'Valid until: $expiryFormatted',
                    style: TextStyle(
                      color: colors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Upgrade or view more perks button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: primaryGold,
                    side: BorderSide(color: primaryGold.withValues(alpha: 0.5)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onPressed: () {
                    if (widget.onExploreVip != null) {
                      widget.onExploreVip!();
                    } else {
                      _showVipDetailsModal(context, colors, tierName.toString(), discount.toString(), expiryFormatted);
                    }
                  },
                  icon: const Icon(Icons.star_rounded, size: 16),
                  label: const Text(
                    'View All VIP Perks & Upgrades',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    } else {
      // Classic / Non-VIP user: show invitation card to get VIP
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: isDark ? const Color(0xFF16120F) : colors.cardSurface,
          border: Border.all(color: primaryGold.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: primaryGold.withValues(alpha: 0.15),
                ),
                child: Icon(Icons.workspace_premium_outlined, color: primaryGold, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Executive VIP Membership',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Get up to 15% discount & monthly complimentary spa rituals.',
                      style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryGold,
                  foregroundColor: colors.buttonTextPrimary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                ),
                onPressed: () {
                  if (widget.onExploreVip != null) {
                    widget.onExploreVip!();
                  } else {
                    Navigator.pop(context);
                  }
                },
                child: const Text(
                  'Explore',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  void _showVipDetailsModal(
    BuildContext context,
    AppColors colors,
    String tierName,
    String discount,
    String expiryFormatted,
  ) {
    final themeController = Provider.of<ThemeController>(context, listen: false);
    final isDark = themeController.isDarkMode;
    final primaryGold = isDark ? const Color(0xFFE0A96D) : colors.primary;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: colors.cardSurface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(color: primaryGold.withValues(alpha: 0.3)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: primaryGold.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.workspace_premium_rounded, color: primaryGold, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tierName.toUpperCase(),
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Active VIP Member Privileges',
                        style: TextStyle(color: primaryGold, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _buildPerkRow(Icons.check_circle_rounded, 'Flat $discount% discount on all Hair, Skin, & Nails services', primaryGold, colors),
              const SizedBox(height: 10),
              _buildPerkRow(Icons.check_circle_rounded, 'Priority queue & fast-track salon chair access', primaryGold, colors),
              const SizedBox(height: 10),
              _buildPerkRow(Icons.check_circle_rounded, 'Special Birthday reward voucher & gifts', primaryGold, colors),
              const SizedBox(height: 10),
              _buildPerkRow(Icons.check_circle_rounded, 'Dedicated VIP specialist consultation', primaryGold, colors),
              const SizedBox(height: 10),
              _buildPerkRow(Icons.calendar_today_rounded, 'Renewal date: $expiryFormatted', primaryGold, colors),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryGold,
                    foregroundColor: colors.buttonTextPrimary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    if (widget.onExploreVip != null) {
                      widget.onExploreVip!();
                    }
                  },
                  child: const Text('Explore Other VIP Plans / Upgrade', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPerkRow(IconData icon, String text, Color goldColor, AppColors colors) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: goldColor, size: 16),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: TextStyle(color: colors.textPrimary, fontSize: 13, height: 1.3),
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

  /// Destructive Delete Account Card for Customer Settings
  Widget _buildDeleteAccountCard(BuildContext context) {
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
            color: const Color(0xFFE57373).withAlpha(isDark ? 25 : 10),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _showDeleteAccountDialog(context),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: iconBorderColor, width: 1),
                  ),
                  child: Icon(Icons.delete_forever_rounded, color: redTextColor, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Delete Account',
                        style: TextStyle(
                          color: redTextColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Permanently remove your SPY Salon account',
                        style: TextStyle(
                          color: colors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
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

  /// Show Delete Account Dialog with Password Confirmation and Security Verification
  void _showDeleteAccountDialog(BuildContext parentContext) {
    final colors = AppColors.of(parentContext);
    final themeController = Provider.of<ThemeController>(parentContext, listen: false);
    final isDark = themeController.isDarkMode;
    final passwordController = TextEditingController();
    bool isObscure = true;
    bool isDeleting = false;
    String? errorMessage;

    showDialog(
      context: parentContext,
      barrierDismissible: !isDeleting,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              backgroundColor: isDark ? const Color(0xFF1A1412) : colors.cardSurface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: colors.error.withAlpha(120),
                  width: 1,
                ),
              ),
              title: Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: colors.error, size: 24),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Delete your account?',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Are you sure you want to delete your SPY Salon account?\n\n'
                      'This action will permanently delete your account and associated personal information. '
                      'You will be logged out after the account is deleted.',
                      style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Security Verification',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: passwordController,
                      obscureText: isObscure,
                      enabled: !isDeleting,
                      style: TextStyle(color: colors.textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Enter password to confirm',
                        hintStyle: TextStyle(color: colors.textMuted, fontSize: 13),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF261D17) : colors.inputBackground,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: colors.cardBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: colors.error),
                        ),
                        suffixIcon: IconButton(
                          icon: Icon(
                            isObscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: colors.textMuted,
                            size: 18,
                          ),
                          onPressed: () {
                            setModalState(() {
                              isObscure = !isObscure;
                            });
                          },
                        ),
                      ),
                    ),
                    if (errorMessage != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: colors.error.withAlpha(25),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: colors.error.withAlpha(80)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline_rounded, color: colors.error, size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                errorMessage!,
                                style: TextStyle(color: colors.error, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isDeleting ? null : () => Navigator.pop(dialogCtx),
                  child: Text(
                    'Cancel',
                    style: TextStyle(color: colors.textMuted),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colors.error,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: isDeleting
                      ? null
                      : () async {
                          final pass = passwordController.text.trim();
                          if (pass.isEmpty) {
                            setModalState(() {
                              errorMessage = 'Please enter your password to confirm account deletion.';
                            });
                            return;
                          }

                          setModalState(() {
                            isDeleting = true;
                            errorMessage = null;
                          });

                          final result = await ApiService.deleteAccount(pass);

                          if (!dialogCtx.mounted) return;

                          if (result['success'] == true) {
                            Navigator.pop(dialogCtx);
                            if (parentContext.mounted) {
                              ScaffoldMessenger.of(parentContext).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    result['message'] ?? 'Your account has been deleted successfully.',
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                  backgroundColor: Colors.green[700],
                                ),
                              );
                              Navigator.pushAndRemoveUntil(
                                parentContext,
                                MaterialPageRoute(
                                  builder: (ctx) => const CustomerDashboardScreen(),
                                ),
                                (route) => false,
                              );
                            }
                          } else {
                            setModalState(() {
                              isDeleting = false;
                              errorMessage = result['message'] ?? 'Failed to delete account. Please check your password.';
                            });
                          }
                        },
                  child: isDeleting
                      ? const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            ),
                            SizedBox(width: 8),
                            Text('Deleting account...', style: TextStyle(color: Colors.white, fontSize: 13)),
                          ],
                        )
                      : const Text(
                          'Delete Account',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                ),
              ],
            );
          },
        );
      },
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

