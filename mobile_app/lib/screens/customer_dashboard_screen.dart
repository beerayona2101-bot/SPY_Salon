import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import '../theme/app_colors.dart';
import '../theme/theme_controller.dart';
import 'book_appointment_screen.dart';
import 'login_screen.dart';
import 'settings_screen.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({super.key});

  @override
  State<CustomerDashboardScreen> createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen>
    with WidgetsBindingObserver {
  StreamSubscription<RealtimeEvent>? _realtimeSubscription;

  bool _isLoading = true;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _landingSettings;
  List<dynamic> _services = [];
  List<dynamic> _specialists = [];

  String _selectedCategory = 'All';
  String _searchQuery = '';
  int _openFaqIndex = -1;

  String get _clientTierLabel {
    if (_user == null) return 'Guest Mode';
    if (_user!['membership'] is Map && _user!['membership']['tier'] != null) {
      final t = _user!['membership']['tier'].toString().trim();
      if (t.isNotEmpty) return t;
    }
    if (_user!['membershipTier'] != null && _user!['membershipTier'].toString().trim().isNotEmpty) {
      return _user!['membershipTier'].toString().trim();
    }
    if (_user!['tier'] != null && _user!['tier'].toString().trim().isNotEmpty) {
      return _user!['tier'].toString().trim();
    }
    return 'VIP Member';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadCachedLandingSettings();
    _loadCustomerData();

    _realtimeSubscription = RealtimeService().eventStream.listen((event) {
      if (!mounted) return;
      debugPrint('[CustomerDashboardScreen] Realtime event received: ${event.name}');
      if (event.name == 'landing_settings_updated') {
        if (event.data is Map) {
          final updatedSettings = Map<String, dynamic>.from(event.data as Map);
          setState(() {
            _landingSettings = updatedSettings;
          });
          _saveCachedLandingSettings(updatedSettings);
        } else {
          _loadCustomerData(quiet: true);
        }
      } else if (event.name.startsWith('appointment:') ||
          event.name.startsWith('service:') ||
          event.name.startsWith('membership:') ||
          event.name == 'offers_updated' ||
          event.name == 'app:fallback_sync') {
        _loadCustomerData(quiet: true);
      }
    });
  }

  Future<void> _loadCachedLandingSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString('spy_cached_landing_settings');
      if (cachedStr != null && cachedStr.isNotEmpty && mounted) {
        final decoded = json.decode(cachedStr);
        if (decoded is Map) {
          setState(() {
            _landingSettings = Map<String, dynamic>.from(decoded);
          });
        }
      }
    } catch (e) {
      debugPrint('[CustomerDashboard] Error reading cached landing settings: $e');
    }
  }

  Future<void> _saveCachedLandingSettings(Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('spy_cached_landing_settings', json.encode(data));
    } catch (e) {
      debugPrint('[CustomerDashboard] Error writing cached landing settings: $e');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _realtimeSubscription?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      debugPrint('[CustomerDashboardScreen] App resumed. Refreshing customer data...');
      _loadCustomerData(quiet: true);
    }
  }

  Future<void> _loadCustomerData({bool quiet = false}) async {
    if (!quiet) setState(() => _isLoading = true);
    final storedUser = await ApiService.fetchCurrentUserProfile();
    final servicesList = await ApiService.getServices();
    final specialistsList = await ApiService.getSpecialists();
    final landingData = await ApiService.getLandingSettings();

    if (!mounted) return;

    if (mounted) {
      setState(() {
        _user = storedUser;
        _services = servicesList;
        _specialists = specialistsList;
        if (landingData != null) {
          _landingSettings = landingData;
          _saveCachedLandingSettings(landingData);
        }
        _isLoading = false;
      });
    }
  }

  void _openBookAppointmentPage({String? initialService}) async {
    final booked = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (ctx) => BookAppointmentScreen(
          user: _user,
          services: _services,
          specialists: _specialists,
          initialService: initialService,
        ),
      ),
    );
    if (booked == true) {
      _loadCustomerData(quiet: true);
    }
  }

  /// Opens login screen for authentication only (without auto-launching booking screen)
  void _openLoginOnly() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => LoginScreen(
          onLoginSuccess: () {
            _loadCustomerData();
          },
        ),
      ),
    );
  }

  /// Triggers booking process. If user is guest (not logged in), prompt Login / Create Account first.
  void _triggerBooking({String? initialService}) {
    if (_user == null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => LoginScreen(
            onLoginSuccess: () {
              _loadCustomerData();
            },
          ),
        ),
      );
    } else {
      _openBookAppointmentPage(initialService: initialService);
    }
  }

  // --- MODAL: VIEW SERVICE DETAILS ---
  void _showServiceDetailModal(dynamic srv) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final title = (srv['name'] ?? srv['title'] ?? 'Luxury Service').toString();
    final price = srv['price'] != null ? '₹${srv['price']}' : '₹899';
    final duration = srv['duration'] ?? srv['durationMinutes']?.toString() ?? '60 min';
    final category = (srv['category'] ?? 'Beauty Ritual').toString();
    final desc = srv['description'] ?? srv['desc'] ?? 'Luxury botanical treatment provided by SPY Salon certified specialists.';
    final rating = (srv['rating'] ?? '4.9').toString();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 0, right: 0, top: 0, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Image Banner with Overlaid Category & Close Action
              Stack(
                children: [
                  _buildServiceImageBanner(
                    srv: srv is Map<String, dynamic> ? srv : Map<String, dynamic>.from(srv),
                    height: 180,
                    themeColors: themeColors,
                    borderRadiusTop: 24,
                    borderRadiusBottom: 16,
                  ),
                  Positioned(
                    top: 14,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: themeColors.goldPrimary.withValues(alpha: 0.5)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(_getCategoryIcon(category), size: 12, color: themeColors.goldPrimary),
                          const SizedBox(width: 4),
                          Text(
                            category.toUpperCase(),
                            style: TextStyle(
                              color: themeColors.goldPrimary,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                              shadows: [
                                Shadow(
                                  color: Colors.black.withValues(alpha: 0.8),
                                  blurRadius: 3,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 12,
                    child: CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.black.withValues(alpha: 0.6),
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.close, color: Colors.white, size: 18),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: themeColors.textPrimary),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 16),
                        const SizedBox(width: 4),
                        Text(rating, style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(width: 14),
                        Icon(Icons.access_time, color: primaryColor, size: 16),
                        const SizedBox(width: 4),
                        Text('$duration mins', style: TextStyle(color: themeColors.textSecondary, fontSize: 13)),
                        const Spacer(),
                        Text(
                          price,
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: primaryColor),
                        ),
                      ],
                    ),
              const SizedBox(height: 16),
              Divider(color: themeColors.cardBorder),
              const SizedBox(height: 10),
              Text('Description & Highlights', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: themeColors.textPrimary)),
              const SizedBox(height: 6),
              Text(
                desc,
                style: TextStyle(fontSize: 13, color: themeColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 16),
              Text('Treatment Procedure Highlights', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: themeColors.textPrimary)),
              const SizedBox(height: 8),
              _buildStepItem(themeColors, '01', 'Specialist Consultation', 'Tailored evaluation of hair/skin condition.'),
              _buildStepItem(themeColors, '02', 'Botanical Cleansing', 'Organic cleansing & pressure-point massage.'),
              _buildStepItem(themeColors, '03', 'Precision Therapy', 'Expert treatment application by senior stylists.'),
              _buildStepItem(themeColors, '04', 'Gloss Seal Finish', 'Protective sheen serum and blowout finish.'),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: themeColors.buttonTextPrimary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _triggerBooking(initialService: title);
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'BOOK THIS TREATMENT NOW',
                        style: TextStyle(
                          color: themeColors.buttonTextPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, size: 18, color: themeColors.buttonTextPrimary),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  ),
),
);
  }

  Widget _buildStepItem(AppColors themeColors, String stepNum, String title, String sub) {
    final primaryColor = themeColors.primary;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: primaryColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                stepNum,
                style: TextStyle(color: primaryColor, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: themeColors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
                Text(sub, style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    final String clientName = _user?['name'] ?? 'Guest Client';
    final String clientTier = _clientTierLabel;

    return Scaffold(
      backgroundColor: themeColors.deepestBackground,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0,
        automaticallyImplyLeading: false,
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
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SPY SALON STUDIO',
                    style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(clientName, style: TextStyle(color: primaryColor, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (_user != null) ...[
            // 1. VIP Members Badge (Positioned before Settings, display badge only)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: primaryColor.withValues(alpha: 0.5)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.workspace_premium_rounded, color: primaryColor, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        clientTier.toUpperCase(),
                        style: TextStyle(color: primaryColor, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // 2. Settings Icon Button (Replaces direct logout at position 2 far right)
            IconButton(
              icon: Icon(
                Icons.settings_outlined,
                color: primaryColor,
                size: 22,
              ),
              tooltip: 'Settings, Profile & Theme',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (c) => const SettingsScreen(isFromDashboard: true)),
              ),
            ),
          ] else ...[
            // For Guest Users: Clean Theme Toggle Icon + Sign In Button
            Consumer<ThemeController>(
              builder: (context, themeCtrl, _) {
                final isDark = themeCtrl.isDarkMode;
                return IconButton(
                  icon: Icon(
                    isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                    color: primaryColor,
                    size: 22,
                  ),
                  tooltip: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                  onPressed: () => themeCtrl.toggleTheme(),
                );
              },
            ),
            Padding(
              padding: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: themeColors.buttonTextPrimary,
                  elevation: 3,
                  shadowColor: primaryColor.withValues(alpha: 0.3),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                onPressed: () => _openLoginOnly(),
                icon: Icon(Icons.login_rounded, color: themeColors.buttonTextPrimary, size: 16),
                label: Text(
                  'Sign In',
                  style: TextStyle(
                    color: themeColors.buttonTextPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
      bottomNavigationBar: null,
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: primaryColor))
          : _buildHomeTab(themeColors),
    );
  }

  // --- TAB 0: HOME LANDING & HIGHLIGHTS ---
  Widget _buildHomeTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;

    final String stat1Val = (_landingSettings?['stat1Value'] ?? '25,000+').toString().trim();
    final String stat1Lbl = (_landingSettings?['stat1Label'] ?? 'Satisfied Clients').toString().trim();
    final String stat2Val = (_landingSettings?['stat2Value'] ?? '45+').toString().trim();
    final String stat2Lbl = (_landingSettings?['stat2Label'] ?? 'Master Stylists').toString().trim();
    final String stat3Val = (_landingSettings?['stat3Value'] ?? 'Jubilee Hills').toString().trim();
    final String stat3Lbl = (_landingSettings?['stat3Label'] ?? 'Luxury Studio').toString().trim();
    String stat4Val = (_landingSettings?['stat4Value'] ?? '4.9 ⭐').toString().trim();
    final String stat4Lbl = (_landingSettings?['stat4Label'] ?? 'Google Rating').toString().trim();

    if (stat4Lbl.toLowerCase().contains('rating') && !stat4Val.contains('⭐') && !stat4Val.contains('★')) {
      stat4Val = '$stat4Val ⭐';
    }

    final stats = [
      {'val': stat1Val.isNotEmpty ? stat1Val : '25,000+', 'label': stat1Lbl.isNotEmpty ? stat1Lbl : 'Satisfied Clients'},
      {'val': stat2Val.isNotEmpty ? stat2Val : '45+', 'label': stat2Lbl.isNotEmpty ? stat2Lbl : 'Master Stylists'},
      {'val': stat3Val.isNotEmpty ? stat3Val : 'Jubilee Hills', 'label': stat3Lbl.isNotEmpty ? stat3Lbl : 'Luxury Studio'},
      {'val': stat4Val.isNotEmpty ? stat4Val : '4.9 ⭐', 'label': stat4Lbl.isNotEmpty ? stat4Lbl : 'Google Rating'},
    ];

    final List<Map<String, String>> faqs = (_landingSettings != null &&
            _landingSettings!['faqItems'] is List &&
            (_landingSettings!['faqItems'] as List).isNotEmpty)
        ? (_landingSettings!['faqItems'] as List).map<Map<String, String>>((item) {
            return {
              'q': (item['question'] ?? item['q'] ?? 'FAQ Question').toString(),
              'a': (item['answer'] ?? item['a'] ?? 'FAQ Answer').toString(),
            };
          }).toList()
        : [
            {
              'q': 'Do I need to book an appointment in advance?',
              'a': 'Walk-in guests are always welcome, but booking online guarantees zero wait time and reserved slot lock.'
            },
            {
              'q': 'Are single-use disposable kits provided?',
              'a': 'Yes, 100%. Every guest receives vacuum-sealed disposable aprons, fresh single-use towels, and 3-stage UV sterilized stainless tools.'
            },
            {
              'q': 'Can I select a specific specialist or barber?',
              'a': 'Absolutely! You can choose your preferred master stylist during slot booking or select any available specialist.'
            },
          ];

    final String heroTitle = (_landingSettings?['heroTitle'] ?? 'Hair makes you beautiful.').toString();
    final String heroSubtitle = (_landingSettings?['heroSubtitle'] ?? '“Beauty is not created—it is unveiled from within.”').toString();

    // Dynamically extract categories from backend services list
    final Set<String> dynamicCategories = {'All', 'Hair Care', 'Skin & Spa', 'Nail Care', 'Grooming', 'Bridal'};
    for (final srv in _services) {
      final cat = (srv['category'] ?? '').toString().trim();
      if (cat.isNotEmpty) {
        dynamicCategories.add(cat);
      }
    }
    final categoriesList = dynamicCategories.toList();

    final filteredServices = _services.where((srv) {
      final title = (srv['name'] ?? srv['title'] ?? '').toString().toLowerCase();
      final cat = (srv['category'] ?? '').toString();
      final matchesSearch = _searchQuery.isEmpty || title.contains(_searchQuery.toLowerCase());
      final matchesCategory = _selectedCategory == 'All' || cat.toLowerCase().contains(_selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    }).toList();

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: () => _loadCustomerData(quiet: true),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 0. Live Top Announcement Banner (Synced from Web Settings)
            if (_landingSettings?['announcementActive'] == true &&
                (_landingSettings?['announcement'] ?? '').toString().trim().isNotEmpty) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: primaryColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: primaryColor.withValues(alpha: 0.35)),
                  boxShadow: [
                    BoxShadow(
                      color: primaryColor.withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: primaryColor.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.campaign_rounded, color: primaryColor, size: 16),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _landingSettings!['announcement'].toString(),
                        style: TextStyle(
                          color: themeColors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // 1. Hero Banner Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
                boxShadow: [
                  BoxShadow(
                    color: primaryColor.withValues(alpha: 0.15),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: themeColors.deepestBackground,
                          border: Border.all(color: primaryColor, width: 1.5),
                        ),
                        child: ClipOval(
                          child: Image.asset('assets/images/logo.png', fit: BoxFit.cover),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'SPY SALON',
                              style: TextStyle(
                                color: themeColors.textPrimary,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2.0,
                              ),
                            ),
                            Text(
                              'LUXURY BEAUTY STUDIO & BOTANICAL SPA',
                              style: TextStyle(
                                color: primaryColor,
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    heroTitle,
                    style: TextStyle(
                      color: themeColors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    heroSubtitle,
                    style: TextStyle(
                      color: primaryColor,
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: buttonTextColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      onPressed: () => _triggerBooking(),
                      icon: const Icon(Icons.calendar_month, size: 18),
                      label: const Text('Book Appointment Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. Stats Banner Grid
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 2.3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: stats.length,
              itemBuilder: (ctx, i) {
                final item = stats[i];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: primaryColor.withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        item['val']!,
                        style: TextStyle(color: primaryColor, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        item['label']!,
                        style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 24),

            // 3. COMPLETE SERVICES & TREATMENTS MENU (FETCHED LIVE FROM APPLICATION BACKEND)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Services & Treatments Menu',
                  style: TextStyle(color: themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  '${filteredServices.length} Available',
                  style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Search Bar & Filter Button for Services
            Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search treatments, spa & styling...',
                      hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
                      prefixIcon: Icon(Icons.search, color: primaryColor, size: 20),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: Icon(Icons.clear, color: themeColors.textMuted, size: 18),
                              onPressed: () => setState(() => _searchQuery = ''),
                            )
                          : null,
                      filled: true,
                      fillColor: cardBg,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: themeColors.cardBorder)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: primaryColor, width: 1.5)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                // Sleek Filter Button
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => _showFilterBottomSheet(context, categoriesList, themeColors),
                    child: Container(
                      height: 48,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: _selectedCategory != 'All'
                            ? primaryColor.withValues(alpha: 0.18)
                            : cardBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _selectedCategory != 'All'
                              ? primaryColor
                              : themeColors.cardBorder,
                          width: _selectedCategory != 'All' ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.tune_rounded,
                            size: 20,
                            color: _selectedCategory != 'All'
                                ? primaryColor
                                : themeColors.textPrimary,
                          ),
                          if (_selectedCategory != 'All') ...[
                            const SizedBox(width: 6),
                            Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: primaryColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            if (_selectedCategory != 'All') ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: primaryColor.withValues(alpha: 0.5)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Category: $_selectedCategory',
                          style: TextStyle(
                            color: primaryColor,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () => setState(() => _selectedCategory = 'All'),
                          child: Icon(Icons.close_rounded, size: 14, color: primaryColor),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => setState(() => _selectedCategory = 'All'),
                    child: Text(
                      'Clear Filter',
                      style: TextStyle(
                        color: themeColors.textMuted,
                        fontSize: 12,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 14),

            // Treatment Cards List
            filteredServices.isEmpty
                ? Container(
                    padding: const EdgeInsets.all(24),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(20), border: Border.all(color: themeColors.cardBorder)),
                    child: Column(
                      children: [
                        Icon(Icons.spa_outlined, size: 48, color: themeColors.textMuted.withValues(alpha: 0.5)),
                        const SizedBox(height: 10),
                        Text('No Treatment Services Found', style: TextStyle(color: themeColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Try clearing your search query or selecting another category.', style: TextStyle(color: themeColors.textMuted, fontSize: 12), textAlign: TextAlign.center),
                      ],
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredServices.length,
                    itemBuilder: (ctx, idx) {
                      final srv = filteredServices[idx];
                      final title = (srv['name'] ?? srv['title'] ?? 'Luxury Treatment').toString();
                      final price = srv['price'] != null ? '₹${srv['price']}' : '₹899';
                      final originalPrice = srv['originalPrice'] != null ? '₹${srv['originalPrice']}' : null;
                      final duration = srv['duration'] ?? srv['durationMinutes']?.toString() ?? '60';
                      final category = (srv['category'] ?? 'Beauty Ritual').toString();
                      final desc = srv['description'] ?? srv['desc'] ?? 'Luxury botanical treatment provided by SPY Salon certified specialists.';
                      final rating = (srv['rating'] ?? '4.9').toString();

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: primaryColor.withValues(alpha: 0.25)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.12),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 1. Service Image Banner with Overlaid Badges
                            Stack(
                              children: [
                                _buildServiceImageBanner(
                                  srv: srv,
                                  height: 150,
                                  themeColors: themeColors,
                                  borderRadiusTop: 20,
                                  borderRadiusBottom: 0,
                                ),
                                Positioned(
                                  top: 12,
                                  left: 12,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.75),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: themeColors.goldPrimary.withValues(alpha: 0.5)),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.3),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(_getCategoryIcon(category), size: 12, color: themeColors.goldPrimary),
                                        const SizedBox(width: 4),
                                        Text(
                                          category.toUpperCase(),
                                          style: TextStyle(
                                            color: themeColors.goldPrimary,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.5,
                                            shadows: [
                                              Shadow(
                                                color: Colors.black.withValues(alpha: 0.8),
                                                blurRadius: 3,
                                                offset: const Offset(0, 1),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: 12,
                                  right: 12,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.65),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.star, color: Colors.amber, size: 14),
                                        const SizedBox(width: 4),
                                        Text(
                                          rating,
                                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            // 2. Service Content Details
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    style: TextStyle(color: themeColors.textPrimary, fontSize: 17, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    desc,
                                    style: TextStyle(color: themeColors.textSecondary, fontSize: 12, height: 1.4),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 14),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                price,
                                                style: TextStyle(color: primaryColor, fontSize: 18, fontWeight: FontWeight.bold),
                                              ),
                                              if (originalPrice != null) ...[
                                                const SizedBox(width: 6),
                                                Text(
                                                  originalPrice,
                                                  style: TextStyle(
                                                    color: themeColors.textMuted,
                                                    fontSize: 12,
                                                    decoration: TextDecoration.lineThrough,
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                          Row(
                                            children: [
                                              Icon(Icons.access_time, size: 12, color: themeColors.textMuted),
                                              const SizedBox(width: 4),
                                              Text(
                                                'Duration: $duration',
                                                style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      Row(
                                        children: [
                                          OutlinedButton(
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: primaryColor,
                                              side: BorderSide(color: primaryColor.withValues(alpha: 0.5)),
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            ),
                                            onPressed: () => _showServiceDetailModal(srv),
                                            child: const Text('View Details', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                          ),
                                          const SizedBox(width: 8),
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: primaryColor,
                                              foregroundColor: buttonTextColor,
                                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                              elevation: 2,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            ),
                                            onPressed: () => _triggerBooking(initialService: title),
                                            child: const Text('Book Now', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
            const SizedBox(height: 24),

            // 4. Master Specialists Section
            Text('Meet Our Master Specialists', style: TextStyle(color: themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            SizedBox(
              height: 110,
              child: _specialists.isEmpty
                  ? Center(child: Text('Loading Specialists...', style: TextStyle(color: themeColors.textMuted, fontSize: 12)))
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      itemCount: _specialists.length,
                      itemBuilder: (ctx, idx) {
                        final spec = _specialists[idx];
                        final name = (spec['name'] ?? spec['username'] ?? 'Specialist').toString();
                        final role = (spec['specialties'] != null && (spec['specialties'] as List).isNotEmpty)
                            ? spec['specialties'][0].toString()
                            : 'Master Stylist';

                        return Container(
                          width: 140,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: cardBg,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: themeColors.cardBorder),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: primaryColor.withValues(alpha: 0.2),
                                child: Text(
                                  name.isNotEmpty ? name[0].toUpperCase() : 'S',
                                  style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                name,
                                style: TextStyle(color: themeColors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                role,
                                style: TextStyle(color: themeColors.textMuted, fontSize: 10),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 24),

            // 5. FAQs Section
            Text('Frequently Asked Questions', style: TextStyle(color: themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Column(
              children: faqs.asMap().entries.map((entry) {
                final idx = entry.key;
                final faq = entry.value;
                final isOpen = _openFaqIndex == idx;

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: themeColors.cardBorder),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        title: Text(faq['q']!, style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                        trailing: Icon(
                          isOpen ? Icons.expand_less : Icons.expand_more,
                          color: primaryColor,
                        ),
                        onTap: () {
                          setState(() {
                            _openFaqIndex = isOpen ? -1 : idx;
                          });
                        },
                      ),
                      if (isOpen)
                        Padding(
                          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 14),
                          child: Text(faq['a']!, style: TextStyle(color: themeColors.textSecondary, fontSize: 12, height: 1.4)),
                        ),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showFilterBottomSheet(BuildContext context, List<String> categoriesList, AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;
    String tempSelected = _selectedCategory;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.75,
              ),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: primaryColor.withValues(alpha: 0.3)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.4),
                    blurRadius: 20,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 12),
                  // Drag handle
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: themeColors.textMuted.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Header with Title & Reset
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.tune_rounded, color: primaryColor, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Filter Treatments',
                              style: TextStyle(
                                color: themeColors.textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        if (tempSelected != 'All')
                          TextButton(
                            onPressed: () {
                              setSheetState(() => tempSelected = 'All');
                            },
                            child: Text(
                              'Reset',
                              style: TextStyle(
                                color: primaryColor,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          )
                        else
                          IconButton(
                            icon: Icon(Icons.close, color: themeColors.textMuted, size: 20),
                            onPressed: () => Navigator.pop(sheetCtx),
                          ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Select a category to view specialized treatments',
                        style: TextStyle(
                          color: themeColors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Divider(color: themeColors.cardBorder, height: 1),

                  // Categories List
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      itemCount: categoriesList.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (ctx, idx) {
                        final cat = categoriesList[idx];
                        final isSelected = tempSelected == cat;
                        final count = cat == 'All'
                            ? _services.length
                            : _services.where((s) {
                                final c = (s['category'] ?? '').toString().toLowerCase();
                                return c.contains(cat.toLowerCase());
                              }).length;

                        return Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(14),
                            onTap: () {
                              setSheetState(() => tempSelected = cat);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? primaryColor.withValues(alpha: 0.12) : Colors.transparent,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isSelected ? primaryColor : themeColors.cardBorder.withValues(alpha: 0.5),
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Text(
                                    cat,
                                    style: TextStyle(
                                      color: isSelected ? primaryColor : themeColors.textPrimary,
                                      fontSize: 14,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    ),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isSelected ? primaryColor.withValues(alpha: 0.2) : themeColors.cardBorder.withValues(alpha: 0.3),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '$count',
                                      style: TextStyle(
                                        color: isSelected ? primaryColor : themeColors.textMuted,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Icon(
                                    isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                    size: 18,
                                    color: isSelected ? primaryColor : themeColors.textMuted,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Bottom Action Button
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                      16,
                      8,
                      16,
                      MediaQuery.of(context).padding.bottom + 16,
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: buttonTextColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                        ),
                        onPressed: () {
                          setState(() => _selectedCategory = tempSelected);
                          Navigator.pop(sheetCtx);
                        },
                        child: Text(
                          tempSelected == 'All' ? 'Show All Services' : 'Apply Filter ($tempSelected)',
                          style: TextStyle(
                            color: buttonTextColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  IconData _getCategoryIcon(String category) {
    final cat = category.toLowerCase();
    if (cat.contains('hair')) return Icons.content_cut;
    if (cat.contains('skin') || cat.contains('spa') || cat.contains('facial')) return Icons.auto_awesome;
    if (cat.contains('nail')) return Icons.brush;
    if (cat.contains('groom')) return Icons.face;
    if (cat.contains('bridal') || cat.contains('makeup')) return Icons.favorite;
    return Icons.spa_outlined;
  }

  /// Resolves image URL from backend service object (supporting relative paths, http URLs, Cloudinary, etc.)
  String? _resolveServiceImageUrl(Map<String, dynamic> srv) {
    final raw = srv['image'] ?? srv['imageUrl'] ?? srv['img'] ?? srv['thumbnail'] ?? srv['icon'] ?? srv['photoUrl'] ?? srv['picture'] ?? srv['bannerImage'];
    if (raw == null) return null;
    final str = raw.toString().trim();
    if (str.isEmpty) return null;

    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:image')) {
      return str;
    }

    final baseUrl = ApiConfig.baseUrl.endsWith('/')
        ? ApiConfig.baseUrl.substring(0, ApiConfig.baseUrl.length - 1)
        : ApiConfig.baseUrl;

    final cleanPath = str.startsWith('/') ? str : '/$str';
    return '$baseUrl$cleanPath';
  }

  /// Builds a clean, elegant service image banner widget with network fetching and luxury fallback
  Widget _buildServiceImageBanner({
    required Map<String, dynamic> srv,
    required double height,
    required AppColors themeColors,
    double borderRadiusTop = 16.0,
    double borderRadiusBottom = 0.0,
  }) {
    final primaryColor = themeColors.primary;
    final imageUrl = _resolveServiceImageUrl(srv);
    final category = (srv['category'] ?? '').toString();
    final catIcon = _getCategoryIcon(category);

    Widget imageContent;

    if (imageUrl != null && imageUrl.isNotEmpty) {
      imageContent = Image.network(
        imageUrl,
        width: double.infinity,
        height: height,
        fit: BoxFit.cover,
        loadingBuilder: (ctx, child, progress) {
          if (progress == null) return child;
          return Container(
            height: height,
            color: themeColors.inputBackground,
            child: Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: primaryColor,
                ),
              ),
            ),
          );
        },
        errorBuilder: (ctx, err, stack) {
          return _buildFallbackGradientBanner(height, themeColors, category, catIcon);
        },
      );
    } else {
      imageContent = _buildFallbackGradientBanner(height, themeColors, category, catIcon);
    }

    return ClipRRect(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(borderRadiusTop),
        bottom: Radius.circular(borderRadiusBottom),
      ),
      child: Stack(
        children: [
          SizedBox(
            width: double.infinity,
            height: height,
            child: imageContent,
          ),
          // Subtle Dark Gradient Overlay for optimal text & badge readability
          Container(
            height: height,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.35),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.4),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFallbackGradientBanner(double height, AppColors themeColors, String category, IconData catIcon) {
    final primaryColor = themeColors.primary;
    List<Color> gradientColors = [
      primaryColor.withValues(alpha: 0.4),
      themeColors.cardSurface,
    ];

    final catLower = category.toLowerCase();
    if (catLower.contains('hair')) {
      gradientColors = [const Color(0xFF2C1E18), const Color(0xFF6B4226), const Color(0xFF1E130E)];
    } else if (catLower.contains('skin') || catLower.contains('spa')) {
      gradientColors = [const Color(0xFF122822), const Color(0xFF265347), const Color(0xFF0C1915)];
    } else if (catLower.contains('nail')) {
      gradientColors = [const Color(0xFF2A1C2E), const Color(0xFF5C3366), const Color(0xFF190F1C)];
    } else if (catLower.contains('groom')) {
      gradientColors = [const Color(0xFF1A1A1A), const Color(0xFF3D332A), const Color(0xFF111111)];
    }

    return Container(
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(catIcon, size: 36, color: primaryColor.withValues(alpha: 0.8)),
            const SizedBox(height: 4),
            Text(
              'SPY SALON',
              style: TextStyle(
                color: primaryColor.withValues(alpha: 0.7),
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 2.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

