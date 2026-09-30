import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import '../theme/app_colors.dart';
import '../widgets/spy_salon_bottom_navigation.dart';
import 'book_appointment_screen.dart';
import 'history_screen.dart';
import 'login_screen.dart';
import 'settings_screen.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({super.key});

  @override
  State<CustomerDashboardScreen> createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late TabController _tabController;
  StreamSubscription<RealtimeEvent>? _realtimeSubscription;

  bool _isLoading = true;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _landingSettings;
  List<dynamic> _services = [];
  List<dynamic> _specialists = [];
  List<dynamic> _appointments = [];

  String _searchQuery = '';
  String _selectedCategory = 'All';
  String? _preselectedService;

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

  int get _activeBookingsCount {
    return _appointments.where((a) {
      final s = (a['status'] ?? '').toString().toLowerCase();
      return s != 'completed' && s != 'cancelled' && s != 'staff_rejected';
    }).length;
  }

  List<dynamic> get _filteredServices {
    return _services.where((srv) {
      final title = (srv['name'] ?? srv['title'] ?? '').toString().toLowerCase();
      final category = (srv['category'] ?? '').toString().toLowerCase();
      final matchesSearch = _searchQuery.isEmpty ||
          title.contains(_searchQuery.toLowerCase()) ||
          category.contains(_searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (_selectedCategory == 'All') return true;

      final selCat = _selectedCategory.toLowerCase();
      if (selCat.contains('hair')) return category.contains('hair');
      if (selCat.contains('skin') || selCat.contains('facial')) {
        return category.contains('skin') || category.contains('facial');
      }
      if (selCat.contains('spa') || selCat.contains('wellness')) {
        return category.contains('spa') || category.contains('wellness');
      }
      if (selCat.contains('nail')) return category.contains('nail');
      if (selCat.contains('groom')) return category.contains('groom');
      if (selCat.contains('bridal') || selCat.contains('makeup')) {
        return category.contains('bridal') || category.contains('makeup');
      }
      return category.contains(selCat);
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 5, initialIndex: 0, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });

    _loadCachedLandingSettings();
    _loadCustomerData();

    RealtimeService().joinRoom('room:customer');

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
    _tabController.dispose();
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
    final appointmentsList = await ApiService.getCustomerAppointments(userParam: storedUser);
    final landingData = await ApiService.getLandingSettings();

    if (!mounted) return;

    setState(() {
      _user = storedUser;
      _services = servicesList;
      _specialists = specialistsList;
      _appointments = appointmentsList ?? [];
      if (landingData != null) {
        _landingSettings = landingData;
        _saveCachedLandingSettings(landingData);
      }
      _isLoading = false;
    });
  }

  /// Navigate directly to the booking tab (Index 2) with optional preselected service
  void _navigateToBooking({String? initialService}) {
    if (_user == null) {
      _openLoginOnly();
      return;
    }
    setState(() {
      if (initialService != null && initialService.isNotEmpty) {
        _preselectedService = initialService;
      }
      _tabController.index = 2;
    });
  }

  /// Opens login screen for authentication
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
                          style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 22),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Treatment Description',
                      style: TextStyle(color: themeColors.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      desc,
                      style: TextStyle(color: themeColors.textSecondary, fontSize: 13, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: themeColors.buttonTextPrimary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _navigateToBooking(initialService: title);
                        },
                        icon: const Icon(Icons.calendar_month_rounded, size: 18),
                        label: const Text('Book This Treatment Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
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

  // --- FLOATING BOTTOM NAVIGATION BAR ---
  Widget _buildCustomerBottomNav(AppColors themeColors) {
    final activeCount = _activeBookingsCount;

    final navItems = [
      const SpySalonNavItem(
        title: 'Home',
        icon: Icons.spa_rounded,
      ),
      const SpySalonNavItem(
        title: 'Services',
        icon: Icons.content_cut_rounded,
      ),
      const SpySalonNavItem(
        title: 'Book Now',
        icon: Icons.calendar_month_rounded,
      ),
      SpySalonNavItem(
        title: 'Bookings',
        icon: Icons.receipt_long_rounded,
        badge: activeCount > 0 ? '$activeCount' : '',
      ),
      const SpySalonNavItem(
        title: 'Settings',
        icon: Icons.settings_rounded,
      ),
    ];

    return SpySalonBottomNavigation(
      currentIndex: _tabController.index,
      onTap: (index) {
        setState(() {
          _tabController.index = index;
        });
      },
      items: navItems,
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    final String clientName = _user?['name'] ?? 'Guest Client';
    final String clientTier = _clientTierLabel;

    final sectionTitles = [
      'SPY Salon Studio',
      'Services & Treatments Menu',
      'Book Luxury Treatment',
      'My Bookings & History',
      'App Settings & Preferences',
    ];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_tabController.index != 0) {
          setState(() {
            _tabController.index = 0;
          });
        }
      },
      child: Scaffold(
        backgroundColor: themeColors.deepestBackground,
        appBar: AppBar(
          backgroundColor: cardBg,
          elevation: 0,
          automaticallyImplyLeading: false,
          leading: Padding(
            padding: const EdgeInsets.only(left: 14),
            child: Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 24,
                  height: 24,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                (_user != null ? sectionTitles[_tabController.index] : 'SPY SALON STUDIO').toUpperCase(),
                style: TextStyle(
                  color: themeColors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                clientName,
                style: TextStyle(color: primaryColor, fontSize: 11),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
          actions: [
            if (_user != null) ...[
              // VIP Members Badge
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(right: 12),
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
            ] else ...[
              // For Guest Users: Sign In Button
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
        body: _isLoading
            ? Center(child: CircularProgressIndicator(color: primaryColor))
            : AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (Widget child, Animation<double> animation) {
                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(begin: const Offset(0.03, 0), end: Offset.zero).animate(animation),
                      child: child,
                    ),
                  );
                },
                child: KeyedSubtree(
                  key: ValueKey<int>(_tabController.index),
                  child: _buildCustomerTabContent(_tabController.index, themeColors),
                ),
              ),
        bottomNavigationBar: _user != null ? _buildCustomerBottomNav(themeColors) : null,
      ),
    );
  }

  // --- TAB CONTENT DISPATCHER ---
  Widget _buildCustomerTabContent(int index, AppColors themeColors) {
    if (_user == null) {
      return _buildHomeTab(themeColors);
    }
    switch (index) {
      case 0:
        return _buildHomeTab(themeColors);
      case 1:
        return _buildServicesTab(themeColors);
      case 2:
        return _buildBookNowTab(themeColors);
      case 3:
        return _buildBookingsTab(themeColors);
      case 4:
        return _buildSettingsTab(themeColors);
      default:
        return _buildHomeTab(themeColors);
    }
  }

  // ==========================================
  // --- TAB 0: HOME LANDING & HIGHLIGHTS ---
  // ==========================================
  Widget _buildHomeTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;

    final String heroTitle = (_landingSettings?['heroTitle'] ?? 'Hair makes you beautiful.').toString();
    final String heroSubtitle = (_landingSettings?['heroSubtitle'] ?? '“Beauty is not created—it is unveiled from within.”').toString();

    // Featured preview services (top 3 for signed-in users, full list for guests)
    final featuredServices = _user == null ? _services : _services.take(3).toList();

    // Find next upcoming appointment if any
    dynamic nextAppointment;
    try {
      final upcoming = _appointments.where((a) {
        final st = (a['status'] ?? '').toString().toLowerCase();
        return st == 'confirmed' || st == 'pending' || st == 'staff_accepted';
      }).toList();
      if (upcoming.isNotEmpty) {
        nextAppointment = upcoming.first;
      }
    } catch (_) {}

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
                      onPressed: () => _navigateToBooking(),
                      icon: const Icon(Icons.calendar_month, size: 18),
                      label: const Text('Book Appointment Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. Upcoming Appointment Live Card (if exists)
            if (nextAppointment != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      primaryColor.withValues(alpha: 0.18),
                      themeColors.cardSurface,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: primaryColor.withValues(alpha: 0.5)),
                  boxShadow: [
                    BoxShadow(
                      color: primaryColor.withValues(alpha: 0.1),
                      blurRadius: 12,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: primaryColor.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(Icons.event_available_rounded, color: primaryColor, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'UPCOMING APPOINTMENT',
                                style: TextStyle(
                                  color: primaryColor,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.0,
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: themeColors.success.withValues(alpha: 0.18),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: themeColors.success.withValues(alpha: 0.4)),
                                ),
                                child: Text(
                                  (nextAppointment['status'] ?? 'Confirmed').toString().toUpperCase(),
                                  style: TextStyle(
                                    color: themeColors.success,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            (nextAppointment['service'] ?? 'Salon Service').toString(),
                            style: TextStyle(
                              color: themeColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${nextAppointment['appointmentDate'] ?? 'Date'} • ${nextAppointment['appointmentTime'] ?? 'Time'}',
                            style: TextStyle(color: themeColors.textSecondary, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(Icons.arrow_forward_ios_rounded, color: primaryColor, size: 16),
                      tooltip: 'View Bookings',
                      onPressed: () {
                        setState(() {
                          _tabController.index = 3;
                        });
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            if (_user != null) ...[
              // 3. Quick Action Navigation Pills
              Row(
                children: [
                  _buildQuickActionTile(
                    icon: Icons.content_cut_rounded,
                    label: 'Treatments',
                    onTap: () => setState(() => _tabController.index = 1),
                    themeColors: themeColors,
                  ),
                  const SizedBox(width: 10),
                  _buildQuickActionTile(
                    icon: Icons.calendar_month_rounded,
                    label: 'Book Now',
                    onTap: () => _navigateToBooking(),
                    themeColors: themeColors,
                  ),
                  const SizedBox(width: 10),
                  _buildQuickActionTile(
                    icon: Icons.receipt_long_rounded,
                    label: 'My Visits',
                    badge: _activeBookingsCount > 0 ? '$_activeBookingsCount' : null,
                    onTap: () => setState(() => _tabController.index = 3),
                    themeColors: themeColors,
                  ),
                  const SizedBox(width: 10),
                  _buildQuickActionTile(
                    icon: Icons.settings_rounded,
                    label: 'Settings',
                    onTap: () => setState(() => _tabController.index = 4),
                    themeColors: themeColors,
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],

            // 4. Luxury Experience Pillars
            Text(
              'The SPY Salon Standard',
              style: TextStyle(color: themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildPillarCard(
                    icon: Icons.verified_user_rounded,
                    title: 'Certified Stylists',
                    subtitle: 'Top-tier master stylists & estheticians.',
                    themeColors: themeColors,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildPillarCard(
                    icon: Icons.eco_rounded,
                    title: 'Organic Spa',
                    subtitle: 'Botanical, certified cruelty-free care.',
                    themeColors: themeColors,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildPillarCard(
                    icon: Icons.chair_rounded,
                    title: 'VIP Suites',
                    subtitle: 'Sanitized private luxury stations.',
                    themeColors: themeColors,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildPillarCard(
                    icon: Icons.flash_on_rounded,
                    title: 'Real-Time Slots',
                    subtitle: 'Instant confirmations & zero wait time.',
                    themeColors: themeColors,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 5. Featured Treatments Showcase
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _user == null ? 'Available Treatments Menu' : 'Popular Treatments',
                  style: TextStyle(color: themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                if (_user != null)
                  TextButton.icon(
                    onPressed: () => setState(() => _tabController.index = 1),
                    icon: Icon(Icons.arrow_forward_rounded, size: 14, color: primaryColor),
                    label: Text('View Full Menu', style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.bold)),
                  )
                else
                  Text(
                    '${_services.length} Treatments',
                    style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
              ],
            ),
            const SizedBox(height: 10),

            if (featuredServices.isNotEmpty)
              ...featuredServices.map((srv) => _buildServiceCardItem(srv, themeColors)),

            if (_user != null) ...[
              const SizedBox(height: 12),
              // 6. View All Services Callout Banner
              InkWell(
                onTap: () => setState(() => _tabController.index = 1),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: primaryColor.withValues(alpha: 0.35)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.auto_awesome, color: primaryColor, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Explore All ${_services.length} Treatments',
                              style: TextStyle(
                                color: themeColors.textPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              'Hair, Skin, Spa, Nail Care, Grooming & Bridal',
                              style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios_rounded, color: primaryColor, size: 14),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),

            // 7. Salon Studios & Operating Hours
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: themeColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.storefront_rounded, color: primaryColor, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'OUR SALON LOCATIONS',
                        style: TextStyle(
                          color: primaryColor,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildBranchRow(themeColors, 'Jubilee Hills', 'Road No. 36 • 09:00 AM - 09:00 PM'),
                  const SizedBox(height: 8),
                  _buildBranchRow(themeColors, 'Banjara Hills', 'Road No. 12 • 09:00 AM - 09:00 PM'),
                  const SizedBox(height: 8),
                  _buildBranchRow(themeColors, 'Gachibowli', 'Financial District • 09:00 AM - 09:00 PM'),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionTile({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required AppColors themeColors,
    String? badge,
  }) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: primaryColor.withValues(alpha: 0.2)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, color: primaryColor, size: 22),
                  const SizedBox(height: 6),
                  Text(
                    label,
                    style: TextStyle(
                      color: themeColors.textPrimary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
              if (badge != null && badge.isNotEmpty)
                Positioned(
                  top: -6,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      badge,
                      style: TextStyle(
                        color: themeColors.buttonTextPrimary,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPillarCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required AppColors themeColors,
  }) {
    final primaryColor = themeColors.primary;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: themeColors.cardSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: themeColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: primaryColor, size: 20),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(color: themeColors.textMuted, fontSize: 11, height: 1.3),
          ),
        ],
      ),
    );
  }

  Widget _buildBranchRow(AppColors themeColors, String name, String details) {
    return Row(
      children: [
        Icon(Icons.location_on_outlined, color: themeColors.primary, size: 14),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: TextStyle(color: themeColors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
              Text(details, style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // --- TAB 1: COMPLETE SERVICES & MENU ---
  // ==========================================
  Widget _buildServicesTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final categories = ['All', 'Hair', 'Skin & Facial', 'Spa & Wellness', 'Nail Care', 'Grooming', 'Bridal & Makeup'];
    final filtered = _filteredServices;

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: () => _loadCustomerData(quiet: true),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.all(16),
        children: [
          // Search Bar
          TextField(
            onChanged: (val) => setState(() => _searchQuery = val),
            style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Search treatments, spa, hair & styling...',
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
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(20),
                borderSide: BorderSide(color: themeColors.cardBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(20),
                borderSide: BorderSide(color: primaryColor, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Category Chips Horizontal Scroll
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: categories.map((cat) {
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(
                      cat,
                      style: TextStyle(
                        color: isSelected ? themeColors.buttonTextPrimary : themeColors.textPrimary,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: primaryColor,
                    backgroundColor: cardBg,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: isSelected ? primaryColor : themeColors.cardBorder),
                    ),
                    onSelected: (val) {
                      if (val) setState(() => _selectedCategory = cat);
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 14),

          // Count Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Available Treatments',
                style: TextStyle(color: themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              Text(
                '${filtered.length} Services',
                style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Services List
          if (filtered.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: themeColors.cardBorder),
              ),
              child: Column(
                children: [
                  Icon(Icons.spa_outlined, size: 48, color: themeColors.textMuted.withValues(alpha: 0.5)),
                  const SizedBox(height: 12),
                  Text(
                    'No Treatment Services Found',
                    style: TextStyle(color: themeColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Try adjusting your search keywords or switching category filters.',
                    style: TextStyle(color: themeColors.textMuted, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            ...filtered.map((srv) => _buildServiceCardItem(srv, themeColors)),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // Common Service Card Item
  Widget _buildServiceCardItem(dynamic srv, AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;

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
                srv: srv is Map<String, dynamic> ? srv : Map<String, dynamic>.from(srv),
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
                          onPressed: () => _navigateToBooking(initialService: title),
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
  }

  // ==========================================
  // --- TAB 2: BOOK NOW (CENTER HIGHLIGHT) ---
  // ==========================================
  Widget _buildBookNowTab(AppColors themeColors) {
    return BookAppointmentScreen(
      key: ValueKey('book_tab_${_preselectedService ?? "none"}'),
      user: _user,
      services: _services,
      specialists: _specialists,
      initialService: _preselectedService,
      isEmbedded: true,
      onBookingSuccess: () {
        _loadCustomerData(quiet: true);
        setState(() {
          _tabController.index = 3; // Seamlessly jump to Bookings
        });
      },
    );
  }

  // ==========================================
  // --- TAB 3: BOOKINGS & APPOINTMENTS ---
  // ==========================================
  Widget _buildBookingsTab(AppColors themeColors) {
    if (_user == null) {
      return Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: themeColors.primary.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: themeColors.primary.withValues(alpha: 0.4)),
                ),
                child: Icon(Icons.receipt_long_rounded, color: themeColors.primary, size: 36),
              ),
              const SizedBox(height: 18),
              Text(
                'Track Your Appointments',
                style: TextStyle(color: themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in to view your upcoming appointments, service status, visit history, and reschedule appointments anytime.',
                style: TextStyle(color: themeColors.textMuted, fontSize: 13, height: 1.4),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: themeColors.primary,
                  foregroundColor: themeColors.buttonTextPrimary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                onPressed: () => _openLoginOnly(),
                icon: const Icon(Icons.login_rounded, size: 18),
                label: const Text('Sign In to View Bookings', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      );
    }

    return HistoryScreen(
      key: ValueKey('bookings_tab_${_appointments.length}'),
      isEmbedded: true,
      onBookNew: () => _navigateToBooking(),
    );
  }

  // ==========================================
  // --- TAB 4: APP SETTINGS & PREFERENCES ---
  // ==========================================
  Widget _buildSettingsTab(AppColors themeColors) {
    return SettingsScreen(
      key: ValueKey('settings_tab_${_user?["id"] ?? _user?["email"] ?? "guest"}'),
      isFromDashboard: true,
      isEmbedded: true,
    );
  }

  // --- HELPER WIDGETS & LOGIC ---
  IconData _getCategoryIcon(String category) {
    final cat = category.toLowerCase();
    if (cat.contains('hair')) return Icons.content_cut;
    if (cat.contains('skin') || cat.contains('spa') || cat.contains('facial')) return Icons.auto_awesome;
    if (cat.contains('nail')) return Icons.brush;
    if (cat.contains('groom')) return Icons.face;
    if (cat.contains('bridal') || cat.contains('makeup')) return Icons.favorite;
    return Icons.spa_outlined;
  }

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
