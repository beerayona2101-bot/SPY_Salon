import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import '../theme/app_colors.dart';
import 'login_screen.dart';
import 'settings_screen.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({super.key});

  @override
  State<CustomerDashboardScreen> createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late TabController _tabController;
  StreamSubscription<RealtimeEvent>? _realtimeSubscription;

  bool _isLoading = true;
  Map<String, dynamic>? _user;
  List<dynamic> _appointments = [];

  // Profile Update Form State & Controllers (Matching Web Profile Process)
  final _profileNameCtrl = TextEditingController();
  final _profilePhoneCtrl = TextEditingController();
  final _profileEmailCtrl = TextEditingController();
  final _profileDobCtrl = TextEditingController();
  final _profileAnniversaryCtrl = TextEditingController();
  final _profileAddressCtrl = TextEditingController();
  final _profileEmergencyCtrl = TextEditingController();

  String _profileGender = 'Female';
  String _profileLanguage = 'English';
  String _profileCommunication = 'WhatsApp';

  bool _emailAlerts = true;
  bool _smsAlerts = true;
  bool _whatsappAlerts = true;
  bool _promoOffers = true;

  bool _isSavingProfile = false;
  bool _profileInitialized = false;

  void _syncProfileControllers(Map<String, dynamic> user) {
    _profileNameCtrl.text = user['name'] ?? '';
    _profilePhoneCtrl.text = user['phone'] ?? '';
    _profileEmailCtrl.text = user['email'] ?? '';
    _profileDobCtrl.text = user['dob'] ?? '';
    _profileAnniversaryCtrl.text = user['anniversary'] ?? '';
    _profileAddressCtrl.text = user['address'] ?? '';
    _profileEmergencyCtrl.text = user['emergencyContact'] ?? '';

    final g = (user['gender'] ?? '').toString();
    if (['Female', 'Male', 'Non-Binary', 'Prefer Not to Say'].contains(g)) {
      _profileGender = g;
    }

    final lang = (user['preferredLanguage'] ?? '').toString();
    if (['English', 'Telugu', 'Hindi'].contains(lang)) {
      _profileLanguage = lang;
    }

    final comm = (user['preferredCommunication'] ?? '').toString();
    if (['WhatsApp', 'SMS', 'Email'].contains(comm)) {
      _profileCommunication = comm;
    }

    final notif = user['notificationPreferences'];
    if (notif != null && notif is Map) {
      _emailAlerts = notif['emailAlerts'] ?? true;
      _smsAlerts = notif['smsAlerts'] ?? true;
      _whatsappAlerts = notif['whatsappAlerts'] ?? true;
      _promoOffers = notif['promoOffers'] ?? true;
    }
  }

  int _calculateProfileCompleteness() {
    int score = 0;
    if (_profileNameCtrl.text.trim().isNotEmpty) score += 15;
    if (_profileEmailCtrl.text.trim().isNotEmpty) score += 15;
    if (_profilePhoneCtrl.text.trim().isNotEmpty) score += 15;
    if ((_user?['avatar'] ?? '').toString().isNotEmpty) score += 20;
    if (_profileDobCtrl.text.trim().isNotEmpty) score += 10;
    if (_profileGender.isNotEmpty) score += 5;
    if (_profileAddressCtrl.text.trim().isNotEmpty) score += 10;
    if (_profileEmergencyCtrl.text.trim().isNotEmpty) score += 5;
    if (_profileAnniversaryCtrl.text.trim().isNotEmpty) score += 5;
    return score > 100 ? 100 : score;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
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
    _tabController.dispose();
    _profileNameCtrl.dispose();
    _profilePhoneCtrl.dispose();
    _profileEmailCtrl.dispose();
    _profileDobCtrl.dispose();
    _profileAnniversaryCtrl.dispose();
    _profileAddressCtrl.dispose();
    _profileEmergencyCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      debugPrint('[CustomerDashboardScreen] App resumed from background/idle. Refreshing customer data...');
      _loadCustomerData(quiet: true);
    }
  }

  Future<void> _loadCustomerData({bool quiet = false}) async {
    if (!quiet) setState(() => _isLoading = true);
    final storedUser = await ApiService.getStoredUser();

    if (!mounted) return;

    if (storedUser == null) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (ctx) => LoginScreen(
            onLoginSuccess: () {
              if (mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (ctx) => const CustomerDashboardScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ),
        (route) => false,
      );
      return;
    }

    final appointmentsList = await ApiService.getCustomerAppointments(userParam: storedUser);

    if (mounted) {
      setState(() {
        _user = storedUser;
        if (appointmentsList != null) _appointments = appointmentsList;
        _isLoading = false;
        if (!_profileInitialized) {
          _syncProfileControllers(storedUser);
          _profileInitialized = true;
        }
      });
    }
  }

  // --- MODAL: RESCHEDULE APPOINTMENT ---
  void _showRescheduleModal(String appointmentId) {
    final dateCtrl = TextEditingController(text: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0]);
    String selectedTime = '11:30 AM';
    final timeOptions = ['09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final buttonTextColor = themeColors.buttonTextPrimary;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: themeColors.cardSurface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Reschedule Appointment 🗓️', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: primaryColor)),
                  IconButton(icon: Icon(Icons.close, color: themeColors.textMuted), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: dateCtrl,
                style: TextStyle(color: themeColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'New Date (YYYY-MM-DD)',
                  labelStyle: TextStyle(color: themeColors.textMuted),
                  prefixIcon: Icon(Icons.calendar_month, color: primaryColor),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: primaryColor, width: 1.5)),
                ),
              ),
              const SizedBox(height: 12),
              Text('Select Time Slot', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: timeOptions.map((t) {
                  final isSelected = t == selectedTime;
                  return ChoiceChip(
                    label: Text(t, style: TextStyle(color: isSelected ? buttonTextColor : themeColors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold)),
                    selected: isSelected,
                    selectedColor: primaryColor,
                    backgroundColor: themeColors.inputBackground,
                    onSelected: (val) => setModalState(() => selectedTime = t),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor),
                  onPressed: () async {
                    final success = await ApiService.rescheduleCustomerAppointment(appointmentId, dateCtrl.text.trim(), selectedTime);
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      if (success) _loadCustomerData();
                    }
                  },
                  child: Text('Confirm Reschedule Slot', style: TextStyle(color: buttonTextColor, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
  void _showBookAppointmentModal() async {
    final nameCtrl = TextEditingController(text: _user?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: _user?['phone'] ?? '');
    final notesCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0]);

    List<dynamic> fetchedServices = await ApiService.getServices();
    List<dynamic> fetchedSpecialists = await ApiService.getSpecialists();

    String selectedService = fetchedServices.isNotEmpty 
        ? (fetchedServices[0]['name'] ?? fetchedServices[0]['title'] ?? 'Hair Cut & Styling')
        : 'Hair Cut & Styling';
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

  Future<void> _confirmSignOut() async {
    final navigator = Navigator.of(context);
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
      navigator.pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (ctx) => LoginScreen(
            onLoginSuccess: () {
              if (ctx.mounted) {
                Navigator.pushAndRemoveUntil(
                  ctx,
                  MaterialPageRoute(builder: (c) => const CustomerDashboardScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ),
        (route) => false,
      );
    }
  }

  Widget _buildCustomerDrawer(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final navItems = [
      {'title': 'My Bookings & History', 'icon': Icons.calendar_month_outlined, 'tabIndex': 0},
      {'title': 'VIP Membership & Offers', 'icon': Icons.card_membership_outlined, 'tabIndex': 1},
      {'title': 'My Profile Details', 'icon': Icons.person_outline, 'tabIndex': 2},
    ];

    final clientName = _user?['name'] ?? 'VIP Client';
    final clientEmail = _user?['email'] ?? '';
    final clientTier = _user?['membership']?['tier'] ?? 'Gold VIP';

    return Drawer(
      backgroundColor: themeColors.deepestBackground,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(top: 50, left: 20, right: 20, bottom: 20),
            decoration: BoxDecoration(
              color: cardBg,
              border: Border(bottom: BorderSide(color: themeColors.cardBorder)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: primaryColor.withValues(alpha: 0.2),
                  child: Text(
                    clientName.isNotEmpty ? clientName[0].toUpperCase() : 'C',
                    style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        clientName,
                        style: TextStyle(color: themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (clientEmail.isNotEmpty)
                        Text(
                          clientEmail,
                          style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                        ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: primaryColor.withValues(alpha: 0.5)),
                        ),
                        child: Text(
                          clientTier.toUpperCase(),
                          style: TextStyle(color: primaryColor, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'CLIENT NAVIGATION',
                style: TextStyle(color: themeColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              children: [
                ...navItems.map((item) {
                  final index = item['tabIndex'] as int;
                  final isSelected = _tabController.index == index;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 4),
                    decoration: BoxDecoration(
                      color: isSelected ? primaryColor.withValues(alpha: 0.15) : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                      border: isSelected ? Border.all(color: primaryColor.withValues(alpha: 0.4)) : null,
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                      leading: Icon(
                        item['icon'] as IconData,
                        color: isSelected ? primaryColor : themeColors.textMuted,
                        size: 22,
                      ),
                      title: Text(
                        item['title'] as String,
                        style: TextStyle(
                          color: isSelected ? primaryColor : themeColors.textSecondary,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          fontSize: 14,
                        ),
                      ),
                      onTap: () {
                        setState(() {
                          _tabController.index = index;
                        });
                        Navigator.pop(context);
                      },
                    ),
                  );
                }),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Divider(color: themeColors.divider),
                ),
                Container(
                  margin: const EdgeInsets.only(bottom: 4),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: primaryColor.withValues(alpha: 0.3)),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                    leading: Icon(Icons.add_circle_outline, color: primaryColor, size: 22),
                    title: Text(
                      'Book New Appointment',
                      style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      _showBookAppointmentModal();
                    },
                  ),
                ),
              ],
            ),
          ),
          Divider(color: themeColors.divider, height: 1),
          Container(
            padding: const EdgeInsets.all(12),
            child: ListTile(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              tileColor: themeColors.error.withValues(alpha: 0.1),
              leading: Icon(Icons.logout, color: themeColors.error, size: 22),
              title: Text(
                'Sign Out',
                style: TextStyle(color: themeColors.error, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              onTap: () {
                Navigator.pop(context);
                _confirmSignOut();
              },
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

    final String clientName = _user?['name'] ?? 'VIP Client';
    final String clientEmail = _user?['email'] ?? '';
    final String clientTier = _user?['membership']?['tier'] ?? 'Gold VIP';

    final sectionTitles = [
      'My Bookings & History',
      'VIP Membership & Offers',
      'My Profile Details',
    ];

    return Scaffold(
      backgroundColor: themeColors.deepestBackground,
      drawer: _buildCustomerDrawer(themeColors),
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0,
        leading: Builder(
          builder: (drawerCtx) => IconButton(
            icon: Icon(Icons.menu, color: primaryColor, size: 24),
            tooltip: 'Open Menu',
            onPressed: () => Scaffold.of(drawerCtx).openDrawer(),
          ),
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
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sectionTitles[_tabController.index].toUpperCase(),
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
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            margin: const EdgeInsets.only(right: 4),
            decoration: BoxDecoration(color: primaryColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: primaryColor)),
            child: Text(clientTier.toUpperCase(), style: TextStyle(color: primaryColor, fontSize: 10, fontWeight: FontWeight.bold)),
          ),
          IconButton(
            icon: Icon(Icons.settings_outlined, color: primaryColor, size: 20),
            tooltip: 'App Settings & Theme',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (ctx) => const SettingsScreen()),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: primaryColor))
          : AnimatedSwitcher(
              duration: const Duration(milliseconds: 280),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              transitionBuilder: (Widget child, Animation<double> animation) {
                final fadeAnimation = CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                );
                final slideAnimation = Tween<Offset>(
                  begin: const Offset(0.04, 0.0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                ));
                final scaleAnimation = Tween<double>(
                  begin: 0.98,
                  end: 1.0,
                ).animate(CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                ));

                return FadeTransition(
                  opacity: fadeAnimation,
                  child: SlideTransition(
                    position: slideAnimation,
                    child: ScaleTransition(
                      scale: scaleAnimation,
                      child: child,
                    ),
                  ),
                );
              },
              child: KeyedSubtree(
                key: ValueKey(_tabController.index),
                child: IndexedStack(
                  index: _tabController.index,
                  children: [
                    _buildBookingsTab(themeColors),
                    _buildVipTab(themeColors),
                    _buildProfileTab(themeColors, clientName, clientEmail),
                  ],
                ),
              ),
            ),
    );
  }

  // --- TAB 1: MY BOOKINGS & APPOINTMENT HISTORY ---
  Widget _buildBookingsTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: cardBg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_appointments.length} Total Appointments', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor),
                onPressed: _showBookAppointmentModal,
                icon: Icon(Icons.add, color: buttonTextColor, size: 16),
                label: Text('Book New Appointment', style: TextStyle(color: buttonTextColor, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _appointments.isEmpty
              ? Center(child: Text('No Salon Appointments Found', style: TextStyle(color: themeColors.textMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _appointments.length,
                  itemBuilder: (ctx, index) {
                    final appt = _appointments[index];
                    final id = appt['_id'] ?? appt['id'] ?? '';
                    final bookingId = appt['bookingId'] ?? 'SPY-${1000 + index}';
                    final service = appt['service'] ?? 'Salon Ritual';
                    final specialist = appt['specialistName'] ?? appt['staffPreference'] ?? 'Master Stylist';
                    final date = appt['appointmentDate'] ?? appt['date'] ?? 'Today';
                    final time = appt['appointmentTime'] ?? appt['time'] ?? '10:30 AM';
                    final price = appt['price'] ?? appt['grandTotal'] ?? 1499;
                    final status = (appt['status'] ?? 'pending').toString().toLowerCase();

                    Color statusColor = themeColors.warning;
                    Color statusBg = themeColors.warningSoft;

                    if (status == 'confirmed') {
                      statusColor = themeColors.success;
                      statusBg = themeColors.successSoft;
                    } else if (status == 'in progress') {
                      statusColor = themeColors.info;
                      statusBg = themeColors.infoSoft;
                    } else if (status == 'completed') {
                      statusColor = themeColors.success;
                      statusBg = themeColors.successSoft;
                    } else if (status == 'cancelled') {
                      statusColor = themeColors.error;
                      statusBg = themeColors.errorSoft;
                    } else if (status == 'rescheduled') {
                      statusColor = themeColors.warning;
                      statusBg = themeColors.warningSoft;
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(14), border: Border.all(color: statusColor.withValues(alpha: 0.3))),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Booking #$bookingId', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: themeColors.textMuted)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: statusColor)),
                                child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(service, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: themeColors.textPrimary)),
                          const SizedBox(height: 4),
                          Text('Specialist: $specialist', style: TextStyle(color: primaryColor, fontSize: 12)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.schedule, size: 14, color: themeColors.textMuted),
                              const SizedBox(width: 4),
                              Text('$date at $time', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                              const Spacer(),
                              Text('₹$price', style: TextStyle(color: themeColors.success, fontWeight: FontWeight.bold, fontSize: 15)),
                            ],
                          ),
                          if (status != 'completed' && status != 'cancelled') ...[
                            Divider(color: themeColors.divider, height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(side: BorderSide(color: primaryColor)),
                                  onPressed: () => _showRescheduleModal(id),
                                  icon: Icon(Icons.event_repeat, size: 14, color: primaryColor),
                                  label: Text('Reschedule', style: TextStyle(color: primaryColor, fontSize: 11)),
                                ),
                                const SizedBox(width: 8),
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(side: BorderSide(color: themeColors.error)),
                                  onPressed: () async {
                                    final success = await ApiService.cancelCustomerAppointment(id);
                                    if (success) _loadCustomerData();
                                  },
                                  icon: Icon(Icons.cancel_outlined, size: 14, color: themeColors.error),
                                  label: Text('Cancel', style: TextStyle(color: themeColors.error, fontSize: 11)),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // --- TAB 2: VIP MEMBERSHIP PORTAL ---
  Widget _buildVipTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
              boxShadow: [
                BoxShadow(color: primaryColor.withValues(alpha: 0.1), blurRadius: 16, spreadRadius: 2),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('SPY SALON VIP CLUB', style: TextStyle(color: themeColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                    Icon(Icons.workspace_premium, color: primaryColor, size: 28),
                  ],
                ),
                const SizedBox(height: 12),
                Text(_user?['membership']?['tier'] ?? 'Gold VIP Tier', style: TextStyle(color: primaryColor, fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Flat 20% Discount Activated on All Treatments', style: TextStyle(color: themeColors.success, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Divider(color: themeColors.divider),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Status: ACTIVE', style: TextStyle(color: themeColors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
                    Text('Priority Lock: ENABLED', style: TextStyle(color: themeColors.textSecondary, fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text('VIP Perks & Benefits', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _buildPerkItem(themeColors, Icons.percent, '20% Off Every Booking', 'Automatic discount applied at checkout on all hair, skin, & spa rituals.'),
          _buildPerkItem(themeColors, Icons.event_available, 'Zero Wait Time Lock', 'Priority time slot reservation with direct master stylist assignment.'),
          _buildPerkItem(themeColors, Icons.local_cafe, 'Complimentary Consultation', 'Free 24K gold skin analysis & scalp therapy assessment.'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor),
              onPressed: () async {
                final res = await ApiService.upgradeCustomerMembership('Platinum VIP');
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: themeColors.success, content: Text(res['message'] ?? 'Membership upgraded!')),
                  );
                  _loadCustomerData();
                }
              },
              child: Text('Upgrade to Royal Platinum VIP', style: TextStyle(color: buttonTextColor, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerkItem(AppColors themeColors, IconData icon, String title, String desc) {
    final primaryColor = themeColors.primary;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: themeColors.cardSurface, borderRadius: BorderRadius.circular(12), border: Border.all(color: themeColors.cardBorder)),
      child: Row(
        children: [
          CircleAvatar(backgroundColor: primaryColor.withValues(alpha: 0.15), child: Icon(icon, color: primaryColor, size: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                Text(desc, style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- TAB 3: PROFILE DETAILS EDITOR (MATCHING WEB FULL PROFILE PROCESS) ---
  Widget _buildProfileTab(AppColors themeColors, String clientName, String clientEmail) {
    final primaryColor = themeColors.primary;
    final buttonTextColor = themeColors.buttonTextPrimary;
    final cardBg = themeColors.cardSurface;

    final completeness = _calculateProfileCompleteness();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Profile Completeness Progress Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: primaryColor.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.auto_awesome_rounded, color: primaryColor, size: 20),
                        const SizedBox(width: 8),
                        Text('Profile Completeness', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    Text('$completeness%', style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: completeness / 100.0,
                    minHeight: 8,
                    backgroundColor: themeColors.inputBackground,
                    color: primaryColor,
                  ),
                ),
                if (completeness < 100) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Complete missing fields to get 100% profile status for VIP benefits & notifications.',
                    style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text('Edit Personal Info & Preferences', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: themeColors.textPrimary)),
          const SizedBox(height: 4),
          Text('Update your profile information, saved location, and notification preferences.', style: TextStyle(color: themeColors.textMuted, fontSize: 12)),
          const SizedBox(height: 16),

          // SECTION 1: PERSONAL INFORMATION
          _buildFormSectionTitle(themeColors, 'PERSONAL INFORMATION'),
          const SizedBox(height: 10),

          // Full Name
          TextField(
            controller: _profileNameCtrl,
            style: TextStyle(color: themeColors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Full Name *',
              labelStyle: TextStyle(color: themeColors.textMuted),
              prefixIcon: Icon(Icons.person_outline, color: primaryColor),
              filled: true,
              fillColor: themeColors.inputBackground,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            ),
          ),
          const SizedBox(height: 12),

          // Mobile Phone
          TextField(
            controller: _profilePhoneCtrl,
            keyboardType: TextInputType.phone,
            style: TextStyle(color: themeColors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Mobile Phone Number *',
              labelStyle: TextStyle(color: themeColors.textMuted),
              prefixIcon: Icon(Icons.phone_outlined, color: primaryColor),
              filled: true,
              fillColor: themeColors.inputBackground,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            ),
          ),
          const SizedBox(height: 12),

          // Email Address
          TextField(
            controller: _profileEmailCtrl,
            keyboardType: TextInputType.emailAddress,
            style: TextStyle(color: themeColors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Email Address *',
              labelStyle: TextStyle(color: themeColors.textMuted),
              prefixIcon: Icon(Icons.email_outlined, color: primaryColor),
              filled: true,
              fillColor: themeColors.inputBackground,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            ),
          ),
          const SizedBox(height: 12),

          // Gender Dropdown
          DropdownButtonFormField<String>(
            initialValue: _profileGender,
            dropdownColor: themeColors.cardSurface,
            style: TextStyle(color: themeColors.textPrimary, fontSize: 14),
            items: const [
              DropdownMenuItem(value: 'Female', child: Text('Female')),
              DropdownMenuItem(value: 'Male', child: Text('Male')),
              DropdownMenuItem(value: 'Non-Binary', child: Text('Non-Binary')),
              DropdownMenuItem(value: 'Prefer Not to Say', child: Text('Prefer Not to Say')),
            ],
            onChanged: (val) {
              if (val != null) setState(() => _profileGender = val);
            },
            decoration: InputDecoration(
              labelText: 'Gender',
              labelStyle: TextStyle(color: themeColors.textMuted),
              prefixIcon: Icon(Icons.wc_outlined, color: primaryColor),
              filled: true,
              fillColor: themeColors.inputBackground,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            ),
          ),
          const SizedBox(height: 20),

          // SECTION 2: IMPORTANT DATES
          _buildFormSectionTitle(themeColors, 'IMPORTANT DATES & MILESTONES'),
          const SizedBox(height: 10),

          // Date of Birth DatePicker
          InkWell(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.tryParse(_profileDobCtrl.text) ?? DateTime(1995, 6, 15),
                firstDate: DateTime(1930),
                lastDate: DateTime.now(),
              );
              if (picked != null) {
                setState(() {
                  _profileDobCtrl.text = picked.toString().split(' ')[0];
                });
              }
            },
            child: IgnorePointer(
              child: TextField(
                controller: _profileDobCtrl,
                style: TextStyle(color: themeColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Date of Birth',
                  hintText: 'YYYY-MM-DD',
                  labelStyle: TextStyle(color: themeColors.textMuted),
                  prefixIcon: Icon(Icons.cake_outlined, color: primaryColor),
                  suffixIcon: Icon(Icons.calendar_today_outlined, color: themeColors.textMuted, size: 18),
                  filled: true,
                  fillColor: themeColors.inputBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Anniversary DatePicker
          InkWell(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.tryParse(_profileAnniversaryCtrl.text) ?? DateTime.now(),
                firstDate: DateTime(1970),
                lastDate: DateTime.now(),
              );
              if (picked != null) {
                setState(() {
                  _profileAnniversaryCtrl.text = picked.toString().split(' ')[0];
                });
              }
            },
            child: IgnorePointer(
              child: TextField(
                controller: _profileAnniversaryCtrl,
                style: TextStyle(color: themeColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Anniversary Date (Optional)',
                  hintText: 'YYYY-MM-DD',
                  labelStyle: TextStyle(color: themeColors.textMuted),
                  prefixIcon: Icon(Icons.favorite_outline, color: primaryColor),
                  suffixIcon: Icon(Icons.calendar_today_outlined, color: themeColors.textMuted, size: 18),
                  filled: true,
                  fillColor: themeColors.inputBackground,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // SECTION 3: LOCATION & EMERGENCY CONTACT
          _buildFormSectionTitle(themeColors, 'LOCATION & EMERGENCY CONTACT'),
          const SizedBox(height: 10),

          // Saved Address
          TextField(
            controller: _profileAddressCtrl,
            maxLines: 2,
            style: TextStyle(color: themeColors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Saved Address / Studio Delivery Location',
              labelStyle: TextStyle(color: themeColors.textMuted),
              prefixIcon: Icon(Icons.location_on_outlined, color: primaryColor),
              filled: true,
              fillColor: themeColors.inputBackground,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            ),
          ),
          const SizedBox(height: 12),

          // Emergency Contact
          TextField(
            controller: _profileEmergencyCtrl,
            keyboardType: TextInputType.phone,
            style: TextStyle(color: themeColors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Emergency Contact Phone',
              labelStyle: TextStyle(color: themeColors.textMuted),
              prefixIcon: Icon(Icons.contact_phone_outlined, color: primaryColor),
              filled: true,
              fillColor: themeColors.inputBackground,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            ),
          ),
          const SizedBox(height: 20),

          // SECTION 4: PREFERENCES & COMMUNICATION
          _buildFormSectionTitle(themeColors, 'COMMUNICATION PREFERENCES'),
          const SizedBox(height: 10),

          // Preferred Language
          DropdownButtonFormField<String>(
            initialValue: _profileLanguage,
            dropdownColor: themeColors.cardSurface,
            style: TextStyle(color: themeColors.textPrimary, fontSize: 14),
            items: const [
              DropdownMenuItem(value: 'English', child: Text('English')),
              DropdownMenuItem(value: 'Telugu', child: Text('Telugu')),
              DropdownMenuItem(value: 'Hindi', child: Text('Hindi')),
            ],
            onChanged: (val) {
              if (val != null) setState(() => _profileLanguage = val);
            },
            decoration: InputDecoration(
              labelText: 'Preferred Language',
              labelStyle: TextStyle(color: themeColors.textMuted),
              prefixIcon: Icon(Icons.language_outlined, color: primaryColor),
              filled: true,
              fillColor: themeColors.inputBackground,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            ),
          ),
          const SizedBox(height: 12),

          // Preferred Communication Channel
          DropdownButtonFormField<String>(
            initialValue: _profileCommunication,
            dropdownColor: themeColors.cardSurface,
            style: TextStyle(color: themeColors.textPrimary, fontSize: 14),
            items: const [
              DropdownMenuItem(value: 'WhatsApp', child: Text('WhatsApp Instant Alert')),
              DropdownMenuItem(value: 'SMS', child: Text('SMS Message')),
              DropdownMenuItem(value: 'Email', child: Text('Email Notification')),
            ],
            onChanged: (val) {
              if (val != null) setState(() => _profileCommunication = val);
            },
            decoration: InputDecoration(
              labelText: 'Preferred Channel',
              labelStyle: TextStyle(color: themeColors.textMuted),
              prefixIcon: Icon(Icons.chat_bubble_outline, color: primaryColor),
              filled: true,
              fillColor: themeColors.inputBackground,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            ),
          ),
          const SizedBox(height: 20),

          // SECTION 5: NOTIFICATION ALERTS TOGGLES
          _buildFormSectionTitle(themeColors, 'NOTIFICATION ALERTS'),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: themeColors.cardBorder),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  title: Text('WhatsApp Instant Alerts', style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                  subtitle: Text('Receive booking confirmations via WhatsApp', style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
                  value: _whatsappAlerts,
                  activeThumbColor: primaryColor,
                  onChanged: (val) => setState(() => _whatsappAlerts = val),
                ),
                Divider(color: themeColors.divider, height: 1),
                SwitchListTile(
                  title: Text('SMS Notifications', style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                  subtitle: Text('Receive SMS updates for appointment status', style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
                  value: _smsAlerts,
                  activeThumbColor: primaryColor,
                  onChanged: (val) => setState(() => _smsAlerts = val),
                ),
                Divider(color: themeColors.divider, height: 1),
                SwitchListTile(
                  title: Text('Email Receipts & Statements', style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                  subtitle: Text('Receive official receipts and membership statements', style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
                  value: _emailAlerts,
                  activeThumbColor: primaryColor,
                  onChanged: (val) => setState(() => _emailAlerts = val),
                ),
                Divider(color: themeColors.divider, height: 1),
                SwitchListTile(
                  title: Text('Promotional Offers & Special Deals', style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                  subtitle: Text('Exclusive seasonal studio discounts and package deals', style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
                  value: _promoOffers,
                  activeThumbColor: primaryColor,
                  onChanged: (val) => setState(() => _promoOffers = val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Save Profile Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: buttonTextColor,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: _isSavingProfile ? null : () => _handleSaveProfileDetails(themeColors),
              child: _isSavingProfile
                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5, color: buttonTextColor))
                  : Text('Save Profile Details & Preferences', style: TextStyle(color: buttonTextColor, fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildFormSectionTitle(AppColors themeColors, String title) {
    return Text(
      title,
      style: TextStyle(
        color: themeColors.primary,
        fontSize: 11,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    );
  }

  Future<void> _handleSaveProfileDetails(AppColors themeColors) async {
    setState(() => _isSavingProfile = true);
    final payload = {
      'name': _profileNameCtrl.text.trim(),
      'phone': _profilePhoneCtrl.text.trim(),
      'email': _profileEmailCtrl.text.trim(),
      'gender': _profileGender,
      'dob': _profileDobCtrl.text.trim(),
      'anniversary': _profileAnniversaryCtrl.text.trim(),
      'address': _profileAddressCtrl.text.trim(),
      'emergencyContact': _profileEmergencyCtrl.text.trim(),
      'preferredLanguage': _profileLanguage,
      'preferredCommunication': _profileCommunication,
      'notificationPreferences': {
        'emailAlerts': _emailAlerts,
        'smsAlerts': _smsAlerts,
        'whatsappAlerts': _whatsappAlerts,
        'promoOffers': _promoOffers,
      },
    };

    final res = await ApiService.updateCustomerProfile(payload);
    if (mounted) {
      setState(() => _isSavingProfile = false);
      final isSuccess = res['success'] == true;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: isSuccess ? themeColors.success : themeColors.error,
          content: Text(res['message'] ?? (isSuccess ? 'Profile details updated successfully!' : 'Failed to update profile')),
        ),
      );
      if (isSuccess && res['user'] != null) {
        setState(() {
          _user = res['user'];
          _syncProfileControllers(_user!);
        });
      }
    }
  }


}

