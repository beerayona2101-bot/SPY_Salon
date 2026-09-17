import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import '../theme/app_colors.dart';
import '../theme/theme_controller.dart';
import 'history_screen.dart';
import 'login_screen.dart';
import 'profile_screen.dart';
import 'update_password_screen.dart';

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
    _loadCustomerData();

    _realtimeSubscription = RealtimeService().eventStream.listen((event) {
      if (!mounted) return;
      debugPrint('[CustomerDashboardScreen] Realtime event received: ${event.name}');
      if (event.name.startsWith('appointment:') ||
          event.name.startsWith('service:') ||
          event.name.startsWith('membership:') ||
          event.name == 'offers_updated' ||
          event.name == 'app:fallback_sync') {
        _loadCustomerData(quiet: true);
      }
    });
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
        if (landingData != null) _landingSettings = landingData;
        _isLoading = false;
      });
    }
  }

  /// Triggers booking process. If user is guest (not logged in), prompt Login / Create Account first.
  void _triggerBooking({String? initialService}) {
    if (_user == null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => LoginScreen(
            onLoginSuccess: () async {
              await _loadCustomerData();
              if (mounted) {
                _showBookAppointmentModal(initialService: initialService);
              }
            },
          ),
        ),
      );
    } else {
      _showBookAppointmentModal(initialService: initialService);
    }
  }

  bool _isSlotInPast(String dateStr, String timeStr) {
    try {
      final now = DateTime.now();
      final dateParts = dateStr.trim().split('-');
      if (dateParts.length < 3) return false;
      final selectedDate = DateTime(int.parse(dateParts[0]), int.parse(dateParts[1]), int.parse(dateParts[2]));
      final todayDate = DateTime(now.year, now.month, now.day);

      if (selectedDate.isBefore(todayDate)) return true;
      if (selectedDate.isAfter(todayDate)) return false;

      final parts = timeStr.trim().split(RegExp(r'\s+'));
      if (parts.length < 2) return false;
      final timeParts = parts[0].split(':');
      int hour = int.parse(timeParts[0]);
      final minute = int.parse(timeParts[1]);
      final isPm = parts[1].toUpperCase() == 'PM';
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour == 12) hour = 0;

      final slotTime = DateTime(now.year, now.month, now.day, hour, minute);
      return slotTime.isBefore(now);
    } catch (e) {
      return false;
    }
  }

  // --- MODAL: BOOK NEW APPOINTMENT ---
  void _showBookAppointmentModal({String? initialService}) async {
    final nameCtrl = TextEditingController(text: _user?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: _user?['phone'] ?? '');
    final notesCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0]);

    List<dynamic> fetchedServices = _services.isNotEmpty ? _services : await ApiService.getServices();
    List<dynamic> fetchedSpecialists = _specialists.isNotEmpty ? _specialists : await ApiService.getSpecialists();

    String selectedService = initialService ?? (fetchedServices.isNotEmpty
        ? (fetchedServices[0]['name'] ?? fetchedServices[0]['title'] ?? 'Hair Cut & Styling')
        : 'Hair Cut & Styling');
    String selectedBranch = 'Jubilee Hills';
    String selectedSpecialist = 'Any Available Specialist';
    String selectedTime = '11:30 AM';
    List<String> bookedSlots = [];
    bool isLoadingSlots = false;

    final timeOptions = ['09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'];
    final branchOptions = ['Jubilee Hills', 'Banjara Hills', 'Gachibowli'];

    if (!mounted) return;
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final buttonTextColor = themeColors.buttonTextPrimary;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: themeColors.cardSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (modalCtx) {
        return StatefulBuilder(
          builder: (dialogCtx, setModalState) {
            Future<void> refreshBookedSlots() async {
              setModalState(() => isLoadingSlots = true);
              final slots = await ApiService.getBookedSlots(dateCtrl.text.trim(), specialist: selectedSpecialist);
              setModalState(() {
                bookedSlots = slots;
                isLoadingSlots = false;

                final isCurrentPast = _isSlotInPast(dateCtrl.text.trim(), selectedTime);
                final isCurrentBooked = bookedSlots.contains(selectedTime);
                if (isCurrentPast || isCurrentBooked) {
                  for (final opt in timeOptions) {
                    if (!bookedSlots.contains(opt) && !_isSlotInPast(dateCtrl.text.trim(), opt)) {
                      selectedTime = opt;
                      break;
                    }
                  }
                }
              });
            }

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 32,
                            height: 32,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Book New Appointment',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: Icon(Icons.close, color: themeColors.textMuted),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: nameCtrl,
                      style: TextStyle(color: themeColors.textPrimary),
                      decoration: InputDecoration(
                        labelText: 'Your Full Name *',
                        labelStyle: TextStyle(color: themeColors.textMuted),
                        prefixIcon: Icon(Icons.person_outline, color: primaryColor),
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: themeColors.cardBorder),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      style: TextStyle(color: themeColors.textPrimary),
                      decoration: InputDecoration(
                        labelText: 'Phone Number *',
                        labelStyle: TextStyle(color: themeColors.textMuted),
                        prefixIcon: Icon(Icons.phone_outlined, color: primaryColor),
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: themeColors.cardBorder),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Select Service *', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                    const SizedBox(height: 6),
                    Builder(
                      builder: (ctx) {
                        final rawList = fetchedServices.isNotEmpty ? fetchedServices : [
                          {'name': 'Hair Cut & Styling'},
                          {'name': 'Beard Shaving'},
                          {'name': 'Botanical Facial Spa'},
                          {'name': 'Luxury Manicure'},
                        ];

                        final Set<String> uniqueTitles = {};
                        for (final s in rawList) {
                          final t = (s['name'] ?? s['title'] ?? '').toString().trim();
                          if (t.isNotEmpty) uniqueTitles.add(t);
                        }
                        if (uniqueTitles.isEmpty) {
                          uniqueTitles.addAll(['Hair Cut & Styling', 'Beard Shaving', 'Botanical Facial Spa', 'Luxury Manicure']);
                        }

                        final validTitles = uniqueTitles.toList();
                        if (!validTitles.contains(selectedService)) {
                          selectedService = validTitles.first;
                        }

                        return DropdownButtonFormField<String>(
                          initialValue: selectedService,
                          dropdownColor: themeColors.cardSurface,
                          style: TextStyle(color: themeColors.textPrimary),
                          items: validTitles.map<DropdownMenuItem<String>>((title) {
                            return DropdownMenuItem<String>(
                              value: title,
                              child: Text(title),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setModalState(() => selectedService = val);
                            }
                          },
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: themeColors.inputBackground,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: themeColors.cardBorder),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Select Branch *', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                initialValue: selectedBranch,
                                dropdownColor: themeColors.cardSurface,
                                style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                                items: branchOptions.map<DropdownMenuItem<String>>((b) {
                                  return DropdownMenuItem<String>(value: b, child: Text(b));
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) setModalState(() => selectedBranch = val);
                                },
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: themeColors.inputBackground,
                                  isDense: true,
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: themeColors.cardBorder)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Specialist', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                              const SizedBox(height: 6),
                              Builder(
                                builder: (ctx) {
                                  final specNames = <String>['Any Available Specialist'];
                                  for (final spec in fetchedSpecialists) {
                                    final name = (spec['name'] ?? spec['username'] ?? '').toString().trim();
                                    if (name.isNotEmpty && !specNames.contains(name)) {
                                      specNames.add(name);
                                    }
                                  }
                                  if (!specNames.contains(selectedSpecialist)) {
                                    selectedSpecialist = specNames.first;
                                  }

                                  return DropdownButtonFormField<String>(
                                    initialValue: selectedSpecialist,
                                    dropdownColor: themeColors.cardSurface,
                                    style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                                    items: specNames.map<DropdownMenuItem<String>>((sp) {
                                      return DropdownMenuItem<String>(value: sp, child: Text(sp, overflow: TextOverflow.ellipsis));
                                    }).toList(),
                                    onChanged: (val) {
                                      if (val != null) {
                                        setModalState(() => selectedSpecialist = val);
                                        refreshBookedSlots();
                                      }
                                    },
                                    decoration: InputDecoration(
                                      filled: true,
                                      fillColor: themeColors.inputBackground,
                                      isDense: true,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: themeColors.cardBorder)),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Date *', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                              const SizedBox(height: 6),
                              InkWell(
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: modalCtx,
                                    initialDate: DateTime.now(),
                                    firstDate: DateTime.now(),
                                    lastDate: DateTime.now().add(const Duration(days: 180)),
                                  );
                                  if (picked != null) {
                                    setModalState(() {
                                      dateCtrl.text = picked.toString().split(' ')[0];
                                    });
                                    refreshBookedSlots();
                                  }
                                },
                                child: IgnorePointer(
                                  child: TextField(
                                    controller: dateCtrl,
                                    style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                                    decoration: InputDecoration(
                                      filled: true,
                                      fillColor: themeColors.inputBackground,
                                      isDense: true,
                                      prefixIcon: Icon(Icons.calendar_month, color: primaryColor, size: 18),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: themeColors.cardBorder)),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Text('Select Time Slot *', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                        if (isLoadingSlots) ...[
                          const SizedBox(width: 8),
                          SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 1.5, color: primaryColor)),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: timeOptions.map((t) {
                        final isPast = _isSlotInPast(dateCtrl.text.trim(), t);
                        final isBooked = bookedSlots.contains(t);
                        final isUnavailable = isPast || isBooked;
                        final isSelected = t == selectedTime && !isUnavailable;

                        String labelText = t;
                        if (isBooked) labelText = '$t (Booked)';
                        if (isPast) labelText = '$t (Past)';

                        return ChoiceChip(
                          label: Text(
                            labelText,
                            style: TextStyle(
                              color: isUnavailable
                                  ? themeColors.textMuted
                                  : (isSelected ? buttonTextColor : themeColors.textPrimary),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              decoration: isUnavailable ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: primaryColor,
                          backgroundColor: isUnavailable
                              ? themeColors.inputBackground.withValues(alpha: 0.3)
                              : themeColors.inputBackground,
                          onSelected: isUnavailable
                              ? null
                              : (val) => setModalState(() => selectedTime = t),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesCtrl,
                      style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                      decoration: InputDecoration(
                        labelText: 'Notes / Special Instructions (Optional)',
                        labelStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
                        prefixIcon: Icon(Icons.notes, color: primaryColor, size: 18),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: themeColors.cardBorder)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: buttonTextColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                        ),
                        onPressed: () async {
                          final name = nameCtrl.text.trim();
                          final phone = phoneCtrl.text.trim();
                          final dateStr = dateCtrl.text.trim();

                          if (name.isEmpty || phone.isEmpty || dateStr.isEmpty) {
                            if (modalCtx.mounted) {
                              ScaffoldMessenger.of(modalCtx).showSnackBar(
                                const SnackBar(content: Text('Please enter name, phone, and appointment date')),
                              );
                            }
                            return;
                          }

                          if (_isSlotInPast(dateStr, selectedTime)) {
                            if (modalCtx.mounted) {
                              ScaffoldMessenger.of(modalCtx).showSnackBar(
                                SnackBar(backgroundColor: themeColors.warning, content: const Text('Please select a future time slot for your appointment.')),
                              );
                            }
                            return;
                          }

                          if (bookedSlots.contains(selectedTime)) {
                            if (modalCtx.mounted) {
                              ScaffoldMessenger.of(modalCtx).showSnackBar(
                                SnackBar(backgroundColor: themeColors.error, content: const Text('This time slot is already booked. Please select another slot.')),
                              );
                            }
                            return;
                          }

                          final res = await ApiService.bookAppointment(
                            customerName: name,
                            customerPhone: phone,
                            customerEmail: _user?['email'],
                            service: selectedService,
                            branch: selectedBranch,
                            specialistName: selectedSpecialist,
                            appointmentDate: dateStr,
                            appointmentTime: selectedTime,
                            notes: notesCtrl.text.trim(),
                          );

                          if (modalCtx.mounted) {
                            Navigator.pop(modalCtx);
                            ScaffoldMessenger.of(modalCtx).showSnackBar(
                              SnackBar(
                                backgroundColor: res['success'] == true ? themeColors.success : themeColors.error,
                                content: Text(
                                  res['success'] == true
                                      ? 'Appointment booked successfully!'
                                      : 'Booking Failed: ${res['message']}',
                                ),
                              ),
                            );
                            if (res['success'] == true) {
                              _loadCustomerData();
                            }
                          }
                        },
                        child: Text(
                          'Confirm Booking',
                          style: TextStyle(
                            color: buttonTextColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
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

  Future<void> _confirmSignOut() async {
    final themeColors = AppColors.of(context);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: themeColors.cardSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: themeColors.primary, width: 0.8),
        ),
        title: Row(
          children: [
            Icon(Icons.logout, color: themeColors.error, size: 22),
            const SizedBox(width: 10),
            Text('Sign Out', style: TextStyle(color: themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text('Are you sure you want to sign out from Client Desk?', style: TextStyle(color: themeColors.textSecondary, fontSize: 14)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx, false),
            child: Text('Cancel', style: TextStyle(color: themeColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: themeColors.error,
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
      if (!mounted) return;
      setState(() {
        _user = null;
      });
      await _loadCustomerData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: themeColors.primary,
            content: const Text('Signed out successfully. Welcome to SPY Salon Home.'),
          ),
        );
      }
    }
  }

  // --- MODAL: SETTINGS & QUICK ACTIONS (Profile, Theme, Update Password) ---
  void _showSettingsModal() {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Consumer<ThemeController>(
          builder: (modalCtx, themeCtrl, _) {
            final isDark = themeCtrl.isDarkMode;

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Header Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: primaryColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
                            ),
                            child: Icon(Icons.settings_outlined, color: primaryColor, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Settings & Quick Menu',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: themeColors.textPrimary,
                                ),
                              ),
                              Text(
                                'Profile, appearance & security',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: themeColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: Icon(Icons.close, color: themeColors.textMuted, size: 20),
                        onPressed: () => Navigator.pop(modalCtx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Divider(color: themeColors.cardBorder, height: 1),
                  const SizedBox(height: 16),

                  // Option 1: Profile
                  Container(
                    decoration: BoxDecoration(
                      color: themeColors.inputBackground.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: themeColors.cardBorder),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
                        ),
                        child: Icon(Icons.person_outline, color: primaryColor, size: 20),
                      ),
                      title: Text(
                        'Profile',
                        style: TextStyle(
                          color: themeColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      subtitle: Text(
                        _user != null
                            ? 'Personal info, contact & preferences'
                            : 'Sign in to view & edit profile',
                        style: TextStyle(color: themeColors.textMuted, fontSize: 12),
                      ),
                      trailing: Icon(Icons.chevron_right_rounded, color: themeColors.textMuted),
                      onTap: () {
                        Navigator.pop(modalCtx);
                        if (_user != null) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (c) => const ProfileScreen()),
                          );
                        } else {
                          _triggerBooking();
                        }
                      },
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Option: Appointment History
                  Container(
                    decoration: BoxDecoration(
                      color: themeColors.inputBackground.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: themeColors.cardBorder),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
                        ),
                        child: Icon(Icons.history_rounded, color: primaryColor, size: 20),
                      ),
                      title: Text(
                        'Appointment History',
                        style: TextStyle(
                          color: themeColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      subtitle: Text(
                        'View past bookings, status & schedules',
                        style: TextStyle(color: themeColors.textMuted, fontSize: 12),
                      ),
                      trailing: Icon(Icons.chevron_right_rounded, color: themeColors.textMuted),
                      onTap: () {
                        Navigator.pop(modalCtx);
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (c) => const HistoryScreen()),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Option 2: Theme Toggle
                  Container(
                    decoration: BoxDecoration(
                      color: themeColors.inputBackground.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: themeColors.cardBorder),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
                        ),
                        child: Icon(
                          isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                          color: primaryColor,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        'Theme',
                        style: TextStyle(
                          color: themeColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      subtitle: Text(
                        isDark ? 'Dark Mode Active' : 'Light Mode Active',
                        style: TextStyle(color: themeColors.textMuted, fontSize: 12),
                      ),
                      trailing: Switch(
                        value: isDark,
                        activeThumbColor: primaryColor,
                        activeTrackColor: primaryColor.withValues(alpha: 0.35),
                        inactiveThumbColor: themeColors.textMuted,
                        inactiveTrackColor: themeColors.inputBackground,
                        onChanged: (val) {
                          themeCtrl.toggleTheme();
                        },
                      ),
                      onTap: () {
                        themeCtrl.toggleTheme();
                      },
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Option 3: Update Password
                  Container(
                    decoration: BoxDecoration(
                      color: themeColors.inputBackground.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: themeColors.cardBorder),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
                        ),
                        child: Icon(Icons.lock_reset_outlined, color: primaryColor, size: 20),
                      ),
                      title: Text(
                        'Update Password',
                        style: TextStyle(
                          color: themeColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      subtitle: Text(
                        _user != null
                            ? 'Change account password securely'
                            : 'Sign in to update password',
                        style: TextStyle(color: themeColors.textMuted, fontSize: 12),
                      ),
                      trailing: Icon(Icons.chevron_right_rounded, color: themeColors.textMuted),
                      onTap: () {
                        Navigator.pop(modalCtx);
                        if (_user != null) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (c) => const UpdatePasswordScreen()),
                          );
                        } else {
                          _triggerBooking();
                        }
                      },
                    ),
                  ),


                  // Option 4: Sign Out (for logged in users)
                  if (_user != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.25)),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        leading: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: Colors.redAccent.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
                        ),
                        title: const Text(
                          'Sign Out',
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        subtitle: Text(
                          'Sign out of your account cleanly',
                          style: TextStyle(color: themeColors.textMuted, fontSize: 12),
                        ),
                        trailing: Icon(Icons.chevron_right_rounded, color: themeColors.textMuted),
                        onTap: () {
                          Navigator.pop(modalCtx);
                          _confirmSignOut();
                        },
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
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
              onPressed: () => _showSettingsModal(),
            ),
          ] else ...[
            // For Guest Users: Settings Icon + Sign In Button
            IconButton(
              icon: Icon(
                Icons.settings_outlined,
                color: primaryColor,
                size: 22,
              ),
              tooltip: 'Settings & Theme',
              onPressed: () => _showSettingsModal(),
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
                onPressed: () => _triggerBooking(),
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

    final stats = [
      {'val': '25,000+', 'label': 'Satisfied Clients'},
      {'val': '45+', 'label': 'Master Stylists'},
      {'val': 'Jubilee Hills', 'label': 'Flagship Studio'},
      {'val': '4.9 ⭐', 'label': 'Google Rating'},
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

    final String heroTitle = (_landingSettings?['heroTitle'] ?? 'Hairs make perfectly').toString();
    final String heroSubtitle = (_landingSettings?['heroSubtitle'] ?? 'Style come from the hair style').toString();

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

            // Search Bar for Services
            TextField(
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
            const SizedBox(height: 12),

            // Category Filter Pills Row
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: categoriesList.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      avatar: cat != 'All'
                          ? Icon(_getCategoryIcon(cat), size: 14, color: isSelected ? buttonTextColor : primaryColor)
                          : null,
                      label: Text(cat, style: TextStyle(color: isSelected ? buttonTextColor : themeColors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold)),
                      selected: isSelected,
                      selectedColor: primaryColor,
                      backgroundColor: cardBg,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: isSelected ? primaryColor : themeColors.cardBorder),
                      ),
                      onSelected: (val) => setState(() => _selectedCategory = cat),
                    ),
                  );
                }).toList(),
              ),
            ),
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

