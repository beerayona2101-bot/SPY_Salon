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
  List<dynamic> _vipPlans = [];
  String _vipBillingCycle = 'monthly';

  String _searchQuery = '';
  String _selectedCategory = 'All';
  String? _preselectedService;

  bool get _isLoggedIn {
    if (_user == null) return false;
    final role = (_user!['role'] ?? '').toString().toLowerCase().trim();
    if (role == 'guest' || _user!['isGuest'] == true) return false;
    final email = (_user!['email'] ?? '').toString().trim();
    final token = (_user!['token'] ?? _user!['jwt_token'] ?? '').toString().trim();
    return email.isNotEmpty || token.isNotEmpty || _user!['_id'] != null || _user!['id'] != null;
  }

  String get _clientTierLabel {
    if (!_isLoggedIn) return 'Guest Mode';
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

    // Pre-populate with fallback and local cache for 0ms instant render
    _services = ApiService.fallbackServices;
    _specialists = ApiService.fallbackSpecialists;
    _vipPlans = ApiService.fallbackMembershipPlans;
    _isLoading = false;

    _loadCachedUserData();
    _loadCachedLandingSettings();
    _loadCustomerData(quiet: true);

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

  Future<void> _loadCachedUserData() async {
    try {
      final cachedUser = await ApiService.getStoredUser();
      if (cachedUser != null && mounted) {
        setState(() {
          _user = cachedUser;
        });
      }
    } catch (_) {}
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
    if (!quiet && _services.isEmpty) {
      setState(() => _isLoading = true);
    }

    try {
      // Execute all core endpoint requests concurrently in parallel
      final futures = await Future.wait([
        ApiService.fetchCurrentUserProfile(),
        ApiService.getServices(),
        ApiService.getSpecialists(),
        ApiService.getLandingSettings(),
        ApiService.getMembershipPlans(),
      ]);

      final storedUser = futures[0] as Map<String, dynamic>?;
      final servicesList = futures[1] as List<dynamic>? ?? _services;
      final specialistsList = futures[2] as List<dynamic>? ?? _specialists;
      final landingData = futures[3] as Map<String, dynamic>?;
      final membershipPlans = futures[4] as List<dynamic>? ?? _vipPlans;

      final appointmentsList = await ApiService.getCustomerAppointments(
        userParam: storedUser ?? _user,
      );

      if (!mounted) return;

      setState(() {
        if (storedUser != null) _user = storedUser;
        if (servicesList.isNotEmpty) _services = servicesList;
        if (specialistsList.isNotEmpty) _specialists = specialistsList;
        if (membershipPlans.isNotEmpty) _vipPlans = membershipPlans;
        _appointments = appointmentsList ?? [];
        if (landingData != null) {
          _landingSettings = landingData;
          _saveCachedLandingSettings(landingData);
        }
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('[CustomerDashboard] Error loading customer data: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
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

  /// Prompts unauthenticated or guest customers to sign in
  void _showSignInRequiredPrompt({String? message}) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    showModalBottomSheet(
      context: context,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: themeColors.cardBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: primaryColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
                border: Border.all(color: primaryColor.withValues(alpha: 0.35)),
              ),
              child: Icon(Icons.workspace_premium_rounded, color: primaryColor, size: 38),
            ),
            const SizedBox(height: 18),
            Text(
              'Sign In Required',
              style: TextStyle(
                color: themeColors.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message ?? 'Please sign in to your SPY Salon account to access VIP Membership packages and exclusive tier privileges.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: themeColors.textSecondary,
                fontSize: 13,
                height: 1.4,
              ),
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
                  elevation: 2,
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  _openLoginOnly();
                },
                icon: const Icon(Icons.login_rounded, size: 18),
                label: const Text(
                  'Sign In to Continue',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 42,
              child: TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(
                  'Maybe Later',
                  style: TextStyle(
                    color: themeColors.textMuted,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Guards VIP Membership interactions behind user login
  void _handleVipPlanTap(dynamic plan, AppColors themeColors) {
    if (!_isLoggedIn) {
      _showSignInRequiredPrompt(
        message: 'Please sign in to your SPY Salon account to view VIP membership details and activate executive privileges.',
      );
      return;
    }
    _showVipPackageModal(plan, themeColors);
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

    final keyBenefits = _getServiceKeyBenefits(srv);

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
                    const SizedBox(height: 18),

                    // Key Treatment Benefits Section
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: primaryColor.withValues(alpha: 0.18),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.workspace_premium_rounded, color: primaryColor, size: 16),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Key Treatment Benefits',
                          style: TextStyle(
                            color: themeColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: themeColors.inputBackground,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: primaryColor.withValues(alpha: 0.2)),
                      ),
                      child: Column(
                        children: keyBenefits.map((b) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                margin: const EdgeInsets.only(top: 2),
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: Colors.green.withValues(alpha: 0.18),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.check_rounded, color: Colors.greenAccent, size: 12),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  b,
                                  style: TextStyle(
                                    color: themeColors.textPrimary,
                                    fontSize: 12,
                                    height: 1.35,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )).toList(),
                      ),
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

  /// Curates and returns Key Benefits for every service based on custom fields or tailored category/name logic
  List<String> _getServiceKeyBenefits(dynamic srv) {
    if (srv is Map) {
      if (srv['benefits'] is List && (srv['benefits'] as List).isNotEmpty) {
        return (srv['benefits'] as List).map((e) => e.toString().trim()).where((s) => s.isNotEmpty).toList();
      }
      if (srv['keyBenefits'] is List && (srv['keyBenefits'] as List).isNotEmpty) {
        return (srv['keyBenefits'] as List).map((e) => e.toString().trim()).where((s) => s.isNotEmpty).toList();
      }
      if (srv['benefits'] is String && (srv['benefits'] as String).trim().isNotEmpty) {
        final parts = (srv['benefits'] as String).split(RegExp(r'[,;\n•]')).map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
        if (parts.isNotEmpty) return parts;
      }
    }

    final title = (srv['name'] ?? srv['title'] ?? '').toString().toLowerCase();
    final category = (srv['category'] ?? '').toString().toLowerCase();

    // 1. Hair Coloring & Highlights
    if (title.contains('color') || title.contains('balayage') || title.contains('highlight') || title.contains('dye')) {
      return [
        '100% Ammonia-Free & Cuticle-Safe Pigments',
        'Rich, Multi-Dimensional Tone & Radiant Mirror Shine',
        'pH-Balancing Acidic Seal to Lock Color & Prevent Fading',
        'Nourishing Keratin Shield Protects Strands Against Dryness',
      ];
    }

    // 2. Hair Spa, Keratin & Smoothening
    if ((title.contains('spa') && (title.contains('hair') || category.contains('hair'))) ||
        title.contains('keratin') || title.contains('botox') || title.contains('smoothen')) {
      return [
        'Deep Root-to-Tip Cuticle Reconstruction & Damage Repair',
        'Eliminates Frizz & Locks in Long-Lasting Silky Softness',
        'Infuses Intense Botanical Moisture & Essential Amino Acids',
        'Thermal Protective Sheen Seal for Humidity Resistance',
      ];
    }

    // 3. Hair Cuts & Styling
    if (title.contains('cut') || title.contains('trim') || title.contains('style') || category.contains('hair')) {
      return [
        'Tailored Sculpting Matched to Facial Structure & Head Shape',
        'Removes Split Ends & Encourages Healthy, Strong Hair Growth',
        'Adds Natural Volume, Weightless Bounce & Flowing Texture',
        'Includes Purifying Scalp Wash & Signature Blowout Finish',
      ];
    }

    // 4. Skin Care, Facials & Glow
    if (title.contains('facial') || title.contains('glow') || title.contains('bleach') || category.contains('skin')) {
      return [
        'Deep Ultrasonic Pore Cleansing & Gentle Micro-Exfoliation',
        'Promotes Cellular Collagen Renewal, Firmness & Elasticity',
        'Instant Radiant Glass-Skin Brightness & Intense Hydration',
        'Broad-Spectrum Antioxidant Barrier Against Pollution & UV',
      ];
    }

    // 5. Body Spa, Massage & Aromatherapy
    if (title.contains('massage') || title.contains('spa') || title.contains('aroma') || category.contains('spa')) {
      return [
        'Deep Tissue Stress Relief & Relaxes Tight Muscle Knots',
        'Stimulates Lymphatic Drainage & Boosts Blood Circulation',
        'Infused with Pure Organic Essential Aromatherapy Oils',
        'Restores Mental Serenity & Physical Rejuvenation',
      ];
    }

    // 6. Beard Sculpting & Men's Grooming
    if (title.contains('beard') || title.contains('shav') || title.contains('groom') || category.contains('groom')) {
      return [
        'Straight-Razor Contour Sculpting for Clean, Sharp Lines',
        'Hot Charcoal Towel Steam Softens Bristles & Prevents Bumps',
        'Nourishing Organic Beard Oil Enhances Texture & Sheen',
        'Cooling Botanical Aftershave Soothes & Hydrates Skin',
      ];
    }

    // 7. Nail Care, Manicure & Pedicure
    if (title.contains('nail') || title.contains('manicure') || title.contains('pedicure') || category.contains('nail')) {
      return [
        'Precision Cuticle Grooming, Buffing & Surface Smoothing',
        'Exfoliating Sea Salt Scrub with Relaxing Moisture Massage',
        'High-Gloss Chip-Resistant Finish with Long-Lasting Wear',
        'Vitamin E & Keratin Infusion Strengthens Fragile Nail Beds',
      ];
    }

    // 8. Bridal & Makeup
    if (title.contains('bridal') || title.contains('makeup') || category.contains('bridal')) {
      return [
        'Sweat-Resistant, High-Definition Flawless Camera Finish',
        'Custom Tone Matching with Premium Hypoallergenic Cosmetics',
        'Long-Lasting 16+ Hour Wear Without Creasing or Caking',
        'Complete Skin Primer Hydration & Setting Veil Lock',
      ];
    }

    // Default Universal Luxury Salon Benefits
    return [
      '100% Dermatologically Tested Organic Botanical Formulations',
      'Personalized Assessment & Application by Certified Specialists',
      'Deep Cellular Moisture Infusion & Tissue Revitalization',
      'Guaranteed Luxury Salon Quality & Post-Care Maintenance Tips',
    ];
  }

  // Helper for VIP plan color accents
  Color _getPlanColor(dynamic plan, AppColors themeColors) {
    if (plan['color'] is int) return Color(plan['color']);
    final code = (plan['code'] ?? '').toString().toLowerCase();
    if (code.contains('gold')) return themeColors.goldPrimary;
    if (code.contains('platinum')) return const Color(0xFFE5B287);
    if (code.contains('premium')) return const Color(0xFFC0C0C0);
    if (code.contains('standard')) return const Color(0xFFCD7F32);
    return themeColors.primary;
  }

  // --- MODAL: VIP PACKAGE DETAILS & UPGRADE ---
  void _showVipPackageModal(dynamic plan, AppColors themeColors) {
    final cardBg = themeColors.cardSurface;
    final planName = (plan['name'] ?? 'VIP Membership').toString();
    final badge = (plan['badge'] ?? '👑 VIP Member').toString();
    final tagline = (plan['tagline'] ?? 'Exclusive privileges & luxury perks').toString();
    final num monthlyPrice = plan['monthlyPrice'] ?? 1499;
    final num yearlyPrice = plan['yearlyPrice'] ?? (monthlyPrice * 10);
    final discount = plan['discountPercentage'] ?? 15;
    final List<dynamic> benefits = plan['benefits'] is List
        ? (plan['benefits'] as List)
        : (plan['benefits'] is String
            ? (plan['benefits'] as String).split(',').map((b) => b.trim()).toList()
            : []);
    final color = _getPlanColor(plan, themeColors);

    String selectedCycle = _vipBillingCycle;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) {
          final isMonthly = selectedCycle == 'monthly';
          final currentPrice = isMonthly ? monthlyPrice : yearlyPrice;
          final currentPriceStr = '₹$currentPrice';

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 16,
              bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Center drag pill
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: themeColors.cardBorder,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),

                  // Header with badge and close icon
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: color.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          badge,
                          style: TextStyle(
                            color: color,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      CircleAvatar(
                        radius: 15,
                        backgroundColor: themeColors.inputBackground,
                        child: IconButton(
                          padding: EdgeInsets.zero,
                          icon: Icon(Icons.close, color: themeColors.textSecondary, size: 16),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Plan Title & Tagline
                  Text(
                    planName,
                    style: TextStyle(
                      color: themeColors.textPrimary,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    tagline,
                    style: TextStyle(
                      color: themeColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Discount Highlight Banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          color.withValues(alpha: 0.22),
                          color.withValues(alpha: 0.08),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: color.withValues(alpha: 0.45)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.stars_rounded, color: color, size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            '$discount% Flat Discount on all salon services!',
                            style: TextStyle(
                              color: themeColors.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Billing Cycle Selector Tabs
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => selectedCycle = 'monthly'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: isMonthly ? color.withValues(alpha: 0.15) : themeColors.inputBackground,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isMonthly ? color : themeColors.cardBorder,
                                width: isMonthly ? 1.5 : 1,
                              ),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  'Monthly',
                                  style: TextStyle(
                                    color: isMonthly ? color : themeColors.textSecondary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '₹$monthlyPrice / mo',
                                  style: TextStyle(
                                    color: themeColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => selectedCycle = 'yearly'),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: !isMonthly ? color.withValues(alpha: 0.15) : themeColors.inputBackground,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: !isMonthly ? color : themeColors.cardBorder,
                                    width: !isMonthly ? 1.5 : 1,
                                  ),
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      'Yearly (2 Mos Free)',
                                      style: TextStyle(
                                        color: !isMonthly ? color : themeColors.textSecondary,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '₹$yearlyPrice / yr',
                                      style: TextStyle(
                                        color: themeColors.textPrimary,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                top: -6,
                                right: 8,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: color,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'BEST VALUE',
                                    style: TextStyle(
                                      color: themeColors.buttonTextPrimary,
                                      fontSize: 8,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Benefits Title
                  Text(
                    'Exclusive Tier Privileges',
                    style: TextStyle(
                      color: themeColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),

                  ...benefits.map((b) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.check_circle_rounded, color: color, size: 16),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                b.toString(),
                                style: TextStyle(
                                  color: themeColors.textPrimary,
                                  fontSize: 12,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )),

                  const SizedBox(height: 22),

                  // Confirm Upgrade CTA Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: color,
                        foregroundColor: themeColors.buttonTextPrimary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: isSubmitting
                          ? null
                          : () async {
                              if (!_isLoggedIn) {
                                Navigator.pop(modalCtx);
                                _showSignInRequiredPrompt(
                                  message: 'Please sign in to your SPY Salon account to confirm VIP Membership purchase.',
                                );
                                return;
                              }
                              setModalState(() => isSubmitting = true);
                              final res = await ApiService.upgradeCustomerMembership(
                                planName,
                                billingCycle: selectedCycle,
                              );
                              if (modalCtx.mounted) {
                                Navigator.pop(modalCtx);
                              }
                              if (!mounted) return;
                              if (res['success'] == true) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    backgroundColor: themeColors.cardSurface,
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      side: BorderSide(color: color),
                                    ),
                                    content: Row(
                                      children: [
                                        Icon(Icons.workspace_premium, color: color),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            '🎉 Welcome to $planName ($selectedCycle)! Enjoy your VIP perks.',
                                            style: TextStyle(
                                              color: themeColors.textPrimary,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                                await _loadCustomerData(quiet: true);
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    backgroundColor: themeColors.cardSurface,
                                    content: Text(
                                      res['message'] ?? 'Could not complete membership request.',
                                      style: TextStyle(color: themeColors.error),
                                    ),
                                  ),
                                );
                              }
                            },
                      child: isSubmitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              'Confirm VIP Upgrade • $currentPriceStr',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
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
          leading: _tabController.index != 0
              ? IconButton(
                  icon: Icon(Icons.arrow_back_ios_new_rounded, color: primaryColor, size: 20),
                  onPressed: () => setState(() => _tabController.index = 0),
                )
              : Padding(
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
          title: Text(
            sectionTitles[_tabController.index].toUpperCase(),
            style: TextStyle(
              color: themeColors.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          actions: [
            if (!_isLoggedIn) ...[
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

    // Featured preview services (matches Web logic: popular treatments first, taking 4)
    final popular = _services.where((s) => s['isPopular'] == true).toList();
    final featuredServices = (popular.isNotEmpty ? popular : _services).take(4).toList();

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

            // 1. Luxury Welcome Card (Only displayed when customer is logged in)
            if (_isLoggedIn) ...[
              _buildWelcomeCard(themeColors),
              const SizedBox(height: 18),
            ],

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



            // 5. Featured Treatments Carousel (Horizontal Scroll for 3 to 4 services)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: primaryColor.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.auto_awesome, color: primaryColor, size: 16),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Featured Treatments',
                          style: TextStyle(
                            color: themeColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Curated luxury salon rituals',
                          style: TextStyle(
                            color: themeColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: () => setState(() => _tabController.index = 1),
                  icon: Icon(Icons.arrow_forward_rounded, size: 14, color: primaryColor),
                  label: Text('View All', style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Horizontal Scrollable Featured Services Carousel (3 to 4 services + View All card)
            if (featuredServices.isNotEmpty)
              SizedBox(
                height: 255,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  clipBehavior: Clip.none,
                  itemCount: featuredServices.length + 1,
                  separatorBuilder: (ctx, i) => const SizedBox(width: 14),
                  itemBuilder: (ctx, i) {
                    if (i < featuredServices.length) {
                      return _buildFeaturedHorizontalServiceCard(featuredServices[i], themeColors);
                    } else {
                      return _buildViewAllServicesEndCard(themeColors);
                    }
                  },
                ),
              ),

            const SizedBox(height: 16),

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
                  gradient: LinearGradient(
                    colors: [
                      primaryColor.withValues(alpha: 0.12),
                      cardBg,
                    ],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: primaryColor.withValues(alpha: 0.18),
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
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: primaryColor,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.arrow_forward_rounded, color: themeColors.buttonTextPrimary, size: 14),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            // 7. VIP Membership Packages Section (Matches Web /services VIP Section)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: themeColors.goldPrimary.withValues(alpha: 0.18),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.workspace_premium_rounded, color: themeColors.goldPrimary, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Executive VIP Packages',
                              style: TextStyle(
                                color: themeColors.textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: themeColors.goldPrimary.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: themeColors.goldPrimary.withValues(alpha: 0.4)),
                              ),
                              child: Text(
                                '👑 VIP PLANS',
                                style: TextStyle(
                                  color: themeColors.goldPrimary,
                                  fontSize: 8,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          'Flat service discounts & complimentary spa rituals across all outlets',
                          style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Monthly / Yearly Plans Toggle (Matches Web frontend/app/services/page.tsx lines 336-354)
            Center(
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: themeColors.cardSurface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: primaryColor.withValues(alpha: 0.25)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    GestureDetector(
                      onTap: () => setState(() => _vipBillingCycle = 'monthly'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: _vipBillingCycle == 'monthly' ? primaryColor : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Monthly Plans',
                          style: TextStyle(
                            color: _vipBillingCycle == 'monthly' ? themeColors.buttonTextPrimary : themeColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    GestureDetector(
                      onTap: () => setState(() => _vipBillingCycle = 'yearly'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: _vipBillingCycle == 'yearly' ? primaryColor : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Yearly Plans',
                              style: TextStyle(
                                color: _vipBillingCycle == 'yearly' ? themeColors.buttonTextPrimary : themeColors.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.green.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Save 17%',
                                style: TextStyle(
                                  color: Colors.greenAccent,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            if (_vipPlans.isNotEmpty)
              SizedBox(
                height: 405,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  clipBehavior: Clip.none,
                  itemCount: _vipPlans.length,
                  separatorBuilder: (ctx, i) => const SizedBox(width: 14),
                  itemBuilder: (ctx, i) {
                    return _buildVipPackageCard(_vipPlans[i], themeColors);
                  },
                ),
              ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // --- LUXURY WELCOME BANNER CARD (Home Page Header for Authenticated Customers) ---
  Widget _buildWelcomeCard(AppColors themeColors) {
    if (!_isLoggedIn) return const SizedBox.shrink();

    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    String displayName = 'Valued Guest';
    if (_isLoggedIn && _user != null) {
      final nameStr = (_user!['name'] ?? '').toString().trim();
      if (nameStr.isNotEmpty) {
        displayName = nameStr.split(' ').first;
        if (displayName.isNotEmpty) {
          displayName = displayName[0].toUpperCase() + displayName.substring(1);
        }
      }
    }
    final String initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'V';
    final avatarUrl = _user?['avatar'] ?? _user?['photoUrl'];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: primaryColor.withValues(alpha: 0.35),
          width: 1,
        ),
        gradient: LinearGradient(
          colors: [
            primaryColor.withValues(alpha: 0.14),
            cardBg,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.22),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: primaryColor.withValues(alpha: 0.08),
            blurRadius: 18,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Left: Glowing Star / Sparkle Icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: primaryColor.withValues(alpha: 0.15),
              boxShadow: [
                BoxShadow(
                  color: primaryColor.withValues(alpha: 0.28),
                  blurRadius: 14,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: Center(
              child: Icon(Icons.auto_awesome, color: primaryColor, size: 22),
            ),
          ),
          const SizedBox(width: 14),

          // Center: Greeting, Name, and Ritual prompt
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _isLoggedIn ? 'Welcome back,' : 'Welcome to SPY Salon,',
                  style: TextStyle(
                    color: primaryColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  displayName,
                  style: TextStyle(
                    color: themeColors.textPrimary,
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  'Ready for your next salon ritual?',
                  style: TextStyle(
                    color: themeColors.textSecondary,
                    fontSize: 12,
                    letterSpacing: 0.1,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // Right: Circular Avatar with glowing gold border and letter initial
          GestureDetector(
            onTap: () {
              if (_isLoggedIn) {
                setState(() => _tabController.index = 4);
              } else {
                _openLoginOnly();
              }
            },
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: primaryColor.withValues(alpha: 0.7),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: primaryColor.withValues(alpha: 0.22),
                    blurRadius: 12,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: ClipOval(
                child: avatarUrl != null && avatarUrl.toString().trim().isNotEmpty
                    ? Image.network(
                        avatarUrl.toString().trim(),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildAvatarInitial(initial, primaryColor),
                      )
                    : _buildAvatarInitial(initial, primaryColor),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarInitial(String initial, Color primaryColor) {
    return Container(
      color: Colors.black.withValues(alpha: 0.45),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          color: primaryColor,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  // Featured Service Card for Horizontal Carousel
  Widget _buildFeaturedHorizontalServiceCard(dynamic srv, AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final title = (srv['name'] ?? srv['title'] ?? 'Luxury Treatment').toString();

    final numPrice = srv['price'] != null ? num.tryParse(srv['price'].toString()) : null;
    final numDiscount = srv['discountPrice'] != null ? num.tryParse(srv['discountPrice'].toString()) : null;
    final numOriginal = srv['originalPrice'] != null ? num.tryParse(srv['originalPrice'].toString()) : null;

    String price;
    String? originalPrice;

    if (numDiscount != null && numPrice != null && numDiscount < numPrice && numDiscount > 0) {
      price = '₹${numDiscount.toInt()}';
      originalPrice = '₹${numPrice.toInt()}';
    } else if (numOriginal != null && numPrice != null && numOriginal > numPrice) {
      price = '₹${numPrice.toInt()}';
      originalPrice = '₹${numOriginal.toInt()}';
    } else if (numPrice != null) {
      price = '₹${numPrice.toInt()}';
    } else {
      price = '₹899';
    }

    final duration = (srv['duration'] ?? srv['durationMinutes']?.toString() ?? '60').toString();
    final category = (srv['category'] ?? 'Beauty Ritual').toString();
    final rating = (srv['rating'] ?? '4.9').toString();

    return Container(
      width: 235,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: primaryColor.withValues(alpha: 0.28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _showServiceDetailModal(srv),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Banner with Category & Rating Badges
              Stack(
                children: [
                  _buildServiceImageBanner(
                    srv: srv is Map<String, dynamic> ? srv : Map<String, dynamic>.from(srv),
                    height: 120,
                    themeColors: themeColors,
                    borderRadiusTop: 20,
                    borderRadiusBottom: 0,
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: themeColors.goldPrimary.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(_getCategoryIcon(category), size: 10, color: themeColors.goldPrimary),
                          const SizedBox(width: 4),
                          Text(
                            '${category.toUpperCase()} RITUAL',
                            style: TextStyle(
                              color: themeColors.goldPrimary,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 12),
                          const SizedBox(width: 3),
                          Text(
                            rating,
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              // Service details
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: themeColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.access_time_rounded, size: 12, color: themeColors.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          'Duration: $duration mins',
                          style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Row(
                          children: [
                            Text(
                              price,
                              style: TextStyle(
                                color: primaryColor,
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (originalPrice != null) ...[
                              const SizedBox(width: 5),
                              Text(
                                originalPrice,
                                style: TextStyle(
                                  color: themeColors.textMuted,
                                  fontSize: 11,
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            ],
                          ],
                        ),
                        SizedBox(
                          height: 28,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryColor,
                              foregroundColor: themeColors.buttonTextPrimary,
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 0,
                            ),
                            onPressed: () => _navigateToBooking(initialService: title),
                            child: const Text('Book', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
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

  // View All Services End Card in Carousel
  Widget _buildViewAllServicesEndCard(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    return Container(
      width: 150,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: primaryColor.withValues(alpha: 0.35)),
        gradient: LinearGradient(
          colors: [
            primaryColor.withValues(alpha: 0.08),
            cardBg,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => setState(() => _tabController.index = 1),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
                  ),
                  child: Icon(Icons.arrow_forward_rounded, color: primaryColor, size: 22),
                ),
                const SizedBox(height: 12),
                Text(
                  'View All\nTreatments',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: themeColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${_services.length}+ Services',
                  style: TextStyle(
                    color: primaryColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // VIP Package Card for Horizontal Carousel (Matches Web frontend/app/services/page.tsx lines 358-425)
  Widget _buildVipPackageCard(dynamic plan, AppColors themeColors) {
    final planName = (plan['name'] ?? 'VIP Plan').toString();
    final badge = (plan['badge'] ?? '👑 VIP Member').toString();
    final tagline = (plan['tagline'] ?? 'Essential VIP privileges & special perks.').toString();
    final monthlyPrice = plan['monthlyPrice'] is num
        ? (plan['monthlyPrice'] as num).toInt()
        : (int.tryParse(plan['monthlyPrice']?.toString() ?? '1499') ?? 1499);
    final yearlyPrice = plan['yearlyPrice'] is num
        ? (plan['yearlyPrice'] as num).toInt()
        : (int.tryParse(plan['yearlyPrice']?.toString() ?? '14999') ?? (monthlyPrice * 10));
    final discount = plan['discountPercentage'] ?? 15;
    final isGold = (plan['code'] ?? '').toString().toLowerCase().contains('gold') ||
        planName.toLowerCase().contains('gold') ||
        plan['popular'] == true;

    final isYearly = _vipBillingCycle == 'yearly';
    final activePrice = isYearly ? yearlyPrice : monthlyPrice;

    final List<dynamic> benefits = plan['benefits'] is List
        ? (plan['benefits'] as List)
        : (plan['benefits'] is String
            ? (plan['benefits'] as String).split(',').map((b) => b.trim()).toList()
            : []);
    final color = _getPlanColor(plan, themeColors);

    final currentTier = _clientTierLabel.toLowerCase();
    final isCurrentPlan = currentTier.contains(planName.toLowerCase()) ||
        currentTier.contains((plan['code'] ?? '').toString().toLowerCase());

    return Container(
      width: 285,
      decoration: BoxDecoration(
        color: themeColors.cardSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isGold ? color : color.withValues(alpha: 0.35),
          width: isGold ? 2.0 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: isGold ? color.withValues(alpha: 0.18) : Colors.black.withValues(alpha: 0.1),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: () => _handleVipPlanTap(plan, themeColors),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Badge & Most Popular Tag
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: color.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.workspace_premium, size: 13, color: color),
                          const SizedBox(width: 4),
                          Text(
                            badge,
                            style: TextStyle(
                              color: color,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isGold)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: color,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'MOST POPULAR VIP',
                          style: TextStyle(
                            color: themeColors.buttonTextPrimary,
                            fontSize: 8,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),

                // Plan Name & Tagline
                Text(
                  planName,
                  style: TextStyle(
                    color: themeColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  tagline,
                  style: TextStyle(
                    color: themeColors.textSecondary,
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),

                // Dynamic Price based on Monthly/Yearly toggle
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '₹$activePrice',
                      style: TextStyle(
                        color: color,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      isYearly ? ' / year' : ' / month',
                      style: TextStyle(
                        color: themeColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),

                // Green discount text matching web
                Text(
                  '$discount% Flat Discount On All Services',
                  style: const TextStyle(
                    color: Colors.greenAccent,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),

                Divider(color: themeColors.cardBorder, height: 1),
                const SizedBox(height: 10),

                // Benefits Checklist (take up to 3)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: benefits.take(3).map((b) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.check_circle_rounded, color: color, size: 14),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                b.toString(),
                                style: TextStyle(
                                  color: themeColors.textPrimary,
                                  fontSize: 11,
                                  height: 1.25,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 8),

                // Dual Action Buttons (Matches Web "View Details" & "Buy {name}")
                Row(
                  children: [
                    Expanded(
                      flex: 4,
                      child: SizedBox(
                        height: 36,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: themeColors.cardBorder),
                            backgroundColor: themeColors.inputBackground,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: EdgeInsets.zero,
                          ),
                          onPressed: () => _handleVipPlanTap(plan, themeColors),
                          child: Text(
                            'View Details',
                            style: TextStyle(
                              color: themeColors.textPrimary,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 6,
                      child: SizedBox(
                        height: 36,
                        child: isCurrentPlan
                            ? OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(color: color),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  padding: EdgeInsets.zero,
                                ),
                                onPressed: () => _handleVipPlanTap(plan, themeColors),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.check, color: color, size: 14),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Active Plan',
                                      style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              )
                            : ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: color,
                                  foregroundColor: themeColors.buttonTextPrimary,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 0,
                                  padding: EdgeInsets.zero,
                                ),
                                onPressed: () => _handleVipPlanTap(plan, themeColors),
                                child: Text(
                                  'Buy ($discount% Off)',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Filter Button on the Search side
  Widget _buildCategoryFilterButton(List<String> categories, AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final isFiltered = _selectedCategory != 'All';

    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: isFiltered ? primaryColor.withValues(alpha: 0.15) : cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isFiltered ? primaryColor : themeColors.cardBorder,
          width: isFiltered ? 1.5 : 1.0,
        ),
      ),
      child: PopupMenuButton<String>(
        tooltip: 'Filter by category',
        color: cardBg,
        elevation: 6,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: primaryColor.withValues(alpha: 0.3)),
        ),
        position: PopupMenuPosition.under,
        onSelected: (cat) {
          setState(() => _selectedCategory = cat);
        },
        itemBuilder: (ctx) => categories.map((cat) {
          final isSelected = _selectedCategory == cat;
          return PopupMenuItem<String>(
            value: cat,
            child: Row(
              children: [
                Icon(
                  _getCategoryIcon(cat),
                  size: 16,
                  color: isSelected ? primaryColor : themeColors.textSecondary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    cat == 'All' ? '✨ All Treatments' : cat,
                    style: TextStyle(
                      color: isSelected ? primaryColor : themeColors.textPrimary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      fontSize: 13,
                    ),
                  ),
                ),
                if (isSelected)
                  Icon(Icons.check_rounded, color: primaryColor, size: 18),
              ],
            ),
          );
        }).toList(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.tune_rounded,
                color: isFiltered ? primaryColor : themeColors.textPrimary,
                size: 20,
              ),
              if (isFiltered) ...[
                const SizedBox(width: 6),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 80),
                  child: Text(
                    _selectedCategory,
                    style: TextStyle(
                      color: primaryColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // --- TAB 1: COMPLETE SERVICES & MENU ---
  // ==========================================
  Widget _buildServicesTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final Set<String> catSet = {'All', 'Hair', 'Skin & Facial', 'Spa & Wellness', 'Nail Care', 'Grooming', 'Bridal & Makeup'};
    for (final s in _services) {
      final c = s['category']?.toString();
      if (c != null && c.trim().isNotEmpty) {
        catSet.add(c.trim());
      }
    }
    final categories = catSet.toList();
    final filtered = _filteredServices;

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: () => _loadCustomerData(quiet: true),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.all(16),
        children: [
          // Search & Filter Row Side-by-Side
          Row(
            children: [
              // Search Input
              Expanded(
                child: TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search treatments, spa, hair...',
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
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: themeColors.cardBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: primaryColor, width: 1.5),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),

              // Filter Button on the side of Search
              _buildCategoryFilterButton(categories, themeColors),
            ],
          ),
          const SizedBox(height: 12),

          // Active filter indicator tag if filtered
          if (_selectedCategory != 'All') ...[
            Row(
              children: [
                Text(
                  'Filtered by: ',
                  style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: primaryColor.withValues(alpha: 0.35)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_getCategoryIcon(_selectedCategory), size: 12, color: primaryColor),
                      const SizedBox(width: 4),
                      Text(
                        _selectedCategory,
                        style: TextStyle(color: primaryColor, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => setState(() => _selectedCategory = 'All'),
                        child: Icon(Icons.close_rounded, size: 14, color: primaryColor),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
          ],

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
    final membershipTier = _user?['membership'] is Map ? _user!['membership']['tier'] : _user?['membershipTier'];
    final membershipStatus = _user?['membership'] is Map ? _user!['membership']['status'] : null;
    return SettingsScreen(
      key: ValueKey('settings_tab_${_user?["id"] ?? _user?["email"] ?? "guest"}_${membershipTier}_$membershipStatus'),
      isFromDashboard: true,
      isEmbedded: true,
      initialUser: _user,
      onExploreVip: () => setState(() => _tabController.index = 0),
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
