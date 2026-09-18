import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/theme_controller.dart';
import 'settings_screen.dart'; // For GoldAmbientBackgroundPainter

class BookAppointmentScreen extends StatefulWidget {
  final Map<String, dynamic>? user;
  final List<dynamic>? services;
  final List<dynamic>? specialists;
  final String? initialService;

  const BookAppointmentScreen({
    super.key,
    this.user,
    this.services,
    this.specialists,
    this.initialService,
  });

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _notesCtrl;
  late TextEditingController _dateCtrl;

  List<dynamic> _fetchedServices = [];
  List<dynamic> _fetchedSpecialists = [];
  bool _isLoadingData = true;

  late String _selectedService;
  String _selectedBranch = 'Jubilee Hills';
  String _selectedSpecialist = 'Any Available Specialist';
  String _selectedTime = '11:30 AM';
  List<String> _bookedSlots = [];
  bool _isLoadingSlots = false;
  bool _isSubmitting = false;

  final List<String> _timeOptions = [
    '09:30 AM',
    '10:30 AM',
    '11:30 AM',
    '01:00 PM',
    '02:30 PM',
    '04:00 PM',
    '05:30 PM',
    '07:00 PM'
  ];

  final List<String> _branchOptions = [
    'Jubilee Hills',
    'Banjara Hills',
    'Gachibowli'
  ];

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.user?['name'] ?? '');
    _phoneCtrl = TextEditingController(text: widget.user?['phone'] ?? '');
    _notesCtrl = TextEditingController();
    _dateCtrl = TextEditingController(
      text: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0],
    );

    _selectedService = widget.initialService ?? 'Hair Cut & Styling';
    _initData();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _notesCtrl.dispose();
    _dateCtrl.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    setState(() => _isLoadingData = true);

    if (widget.services != null && widget.services!.isNotEmpty) {
      _fetchedServices = widget.services!;
    } else {
      _fetchedServices = await ApiService.getServices();
    }

    if (widget.specialists != null && widget.specialists!.isNotEmpty) {
      _fetchedSpecialists = widget.specialists!;
    } else {
      _fetchedSpecialists = await ApiService.getSpecialists();
    }

    if (widget.initialService != null && widget.initialService!.isNotEmpty) {
      _selectedService = widget.initialService!;
    } else if (_fetchedServices.isNotEmpty) {
      _selectedService = _fetchedServices[0]['name'] ?? _fetchedServices[0]['title'] ?? 'Hair Cut & Styling';
    }

    if (mounted) {
      setState(() => _isLoadingData = false);
      _refreshBookedSlots();
    }
  }

  bool _isSlotInPast(String dateStr, String timeStr) {
    try {
      final now = DateTime.now();
      final dateParts = dateStr.trim().split('-');
      if (dateParts.length < 3) return false;
      final selectedDate = DateTime(
        int.parse(dateParts[0]),
        int.parse(dateParts[1]),
        int.parse(dateParts[2]),
      );
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

  Future<void> _refreshBookedSlots() async {
    if (!mounted) return;
    setState(() => _isLoadingSlots = true);
    final slots = await ApiService.getBookedSlots(
      _dateCtrl.text.trim(),
      specialist: _selectedSpecialist,
    );
    if (!mounted) return;
    setState(() {
      _bookedSlots = slots;
      _isLoadingSlots = false;

      final isCurrentPast = _isSlotInPast(_dateCtrl.text.trim(), _selectedTime);
      final isCurrentBooked = _bookedSlots.contains(_selectedTime);
      if (isCurrentPast || isCurrentBooked) {
        for (final opt in _timeOptions) {
          if (!_bookedSlots.contains(opt) && !_isSlotInPast(_dateCtrl.text.trim(), opt)) {
            _selectedTime = opt;
            break;
          }
        }
      }
    });
  }

  Future<void> _submitBooking() async {
    final name = _nameCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    final dateStr = _dateCtrl.text.trim();
    final themeColors = AppColors.of(context);

    if (name.isEmpty || phone.isEmpty || dateStr.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter name, phone, and appointment date')),
      );
      return;
    }

    if (_isSlotInPast(dateStr, _selectedTime)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: themeColors.warning,
          content: const Text('Please select a future time slot for your appointment.'),
        ),
      );
      return;
    }

    if (_bookedSlots.contains(_selectedTime)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: themeColors.error,
          content: const Text('This time slot is already booked. Please select another slot.'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final res = await ApiService.bookAppointment(
      customerName: name,
      customerPhone: phone,
      customerEmail: widget.user?['email'],
      service: _selectedService,
      branch: _selectedBranch,
      specialistName: _selectedSpecialist,
      appointmentDate: dateStr,
      appointmentTime: _selectedTime,
      notes: _notesCtrl.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    final messenger = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);

    messenger.showSnackBar(
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
      nav.pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final themeController = Provider.of<ThemeController>(context);
    final isDark = themeController.isDarkMode;

    final bgBackgroundColor = isDark ? const Color(0xFF0F0E0E) : themeColors.mainBackground;
    final primaryGold = isDark ? const Color(0xFFE0A96D) : themeColors.primary;
    final cardBg = isDark ? const Color(0xFF151210) : themeColors.cardSurface;
    final cardBorderColor = isDark ? const Color(0xFF2E241E) : themeColors.cardBorder;

    return Scaffold(
      backgroundColor: bgBackgroundColor,
      body: Stack(
        children: [
          Positioned.fill(
            child: CustomPaint(
              painter: GoldAmbientBackgroundPainter(isDark: isDark),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                // Clean Custom Header
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
                              color: themeColors.primary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Book Appointment',
                        style: TextStyle(
                          color: themeColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),

                // Form Scrollable Body
                Expanded(
                  child: _isLoadingData
                      ? Center(child: CircularProgressIndicator(color: primaryGold))
                      : SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Personal Info Container
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: cardBg,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: cardBorderColor),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'PERSONAL DETAILS',
                                      style: TextStyle(
                                        color: primaryGold,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    TextField(
                                      controller: _nameCtrl,
                                      style: TextStyle(color: themeColors.textPrimary),
                                      decoration: InputDecoration(
                                        labelText: 'Your Full Name *',
                                        labelStyle: TextStyle(color: themeColors.textMuted),
                                        prefixIcon: Icon(Icons.person_outline_rounded, color: primaryGold),
                                        enabledBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: cardBorderColor),
                                        ),
                                        focusedBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: primaryGold),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    TextField(
                                      controller: _phoneCtrl,
                                      keyboardType: TextInputType.phone,
                                      style: TextStyle(color: themeColors.textPrimary),
                                      decoration: InputDecoration(
                                        labelText: 'Phone Number *',
                                        labelStyle: TextStyle(color: themeColors.textMuted),
                                        prefixIcon: Icon(Icons.phone_outlined, color: primaryGold),
                                        enabledBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: cardBorderColor),
                                        ),
                                        focusedBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: primaryGold),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Service & Location Container
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: cardBg,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: cardBorderColor),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'SERVICE & LOCATION',
                                      style: TextStyle(
                                        color: primaryGold,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text('Select Service *', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                                    const SizedBox(height: 6),
                                    Builder(
                                      builder: (ctx) {
                                        final rawList = _fetchedServices.isNotEmpty
                                            ? _fetchedServices
                                            : [
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
                                          uniqueTitles.addAll([
                                            'Hair Cut & Styling',
                                            'Beard Shaving',
                                            'Botanical Facial Spa',
                                            'Luxury Manicure'
                                          ]);
                                        }

                                        final validTitles = uniqueTitles.toList();
                                        if (!validTitles.contains(_selectedService)) {
                                          _selectedService = validTitles.first;
                                        }

                                        return DropdownButtonFormField<String>(
                                          initialValue: _selectedService,
                                          dropdownColor: isDark ? const Color(0xFF1E1916) : themeColors.cardSurface,
                                          style: TextStyle(color: themeColors.textPrimary),
                                          items: validTitles.map<DropdownMenuItem<String>>((title) {
                                            return DropdownMenuItem<String>(
                                              value: title,
                                              child: Text(title),
                                            );
                                          }).toList(),
                                          onChanged: (val) {
                                            if (val != null) {
                                              setState(() => _selectedService = val);
                                            }
                                          },
                                          decoration: InputDecoration(
                                            filled: true,
                                            fillColor: isDark ? const Color(0xFF1E1814) : themeColors.inputBackground,
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(10),
                                              borderSide: BorderSide(color: cardBorderColor),
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
                                                initialValue: _selectedBranch,
                                                dropdownColor: isDark ? const Color(0xFF1E1916) : themeColors.cardSurface,
                                                style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                                                items: _branchOptions.map<DropdownMenuItem<String>>((b) {
                                                  return DropdownMenuItem<String>(value: b, child: Text(b));
                                                }).toList(),
                                                onChanged: (val) {
                                                  if (val != null) setState(() => _selectedBranch = val);
                                                },
                                                decoration: InputDecoration(
                                                  filled: true,
                                                  fillColor: isDark ? const Color(0xFF1E1814) : themeColors.inputBackground,
                                                  isDense: true,
                                                  border: OutlineInputBorder(
                                                    borderRadius: BorderRadius.circular(10),
                                                    borderSide: BorderSide(color: cardBorderColor),
                                                  ),
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
                                                  for (final spec in _fetchedSpecialists) {
                                                    final name = (spec['name'] ?? spec['username'] ?? '').toString().trim();
                                                    if (name.isNotEmpty && !specNames.contains(name)) {
                                                      specNames.add(name);
                                                    }
                                                  }
                                                  if (!specNames.contains(_selectedSpecialist)) {
                                                    _selectedSpecialist = specNames.first;
                                                  }

                                                  return DropdownButtonFormField<String>(
                                                    initialValue: _selectedSpecialist,
                                                    dropdownColor: isDark ? const Color(0xFF1E1916) : themeColors.cardSurface,
                                                    style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                                                    items: specNames.map<DropdownMenuItem<String>>((sp) {
                                                      return DropdownMenuItem<String>(
                                                        value: sp,
                                                        child: Text(sp, overflow: TextOverflow.ellipsis),
                                                      );
                                                    }).toList(),
                                                    onChanged: (val) {
                                                      if (val != null) {
                                                        setState(() => _selectedSpecialist = val);
                                                        _refreshBookedSlots();
                                                      }
                                                    },
                                                    decoration: InputDecoration(
                                                      filled: true,
                                                      fillColor: isDark ? const Color(0xFF1E1814) : themeColors.inputBackground,
                                                      isDense: true,
                                                      border: OutlineInputBorder(
                                                        borderRadius: BorderRadius.circular(10),
                                                        borderSide: BorderSide(color: cardBorderColor),
                                                      ),
                                                    ),
                                                  );
                                                },
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Date & Time Slot Container
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: cardBg,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: cardBorderColor),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'DATE & TIME SELECTION',
                                      style: TextStyle(
                                        color: primaryGold,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text('Appointment Date *', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                                    const SizedBox(height: 6),
                                    InkWell(
                                      onTap: () async {
                                        final picked = await showDatePicker(
                                          context: context,
                                          initialDate: DateTime.now(),
                                          firstDate: DateTime.now(),
                                          lastDate: DateTime.now().add(const Duration(days: 180)),
                                        );
                                        if (picked != null) {
                                          setState(() {
                                            _dateCtrl.text = picked.toString().split(' ')[0];
                                          });
                                          _refreshBookedSlots();
                                        }
                                      },
                                      child: IgnorePointer(
                                        child: TextField(
                                          controller: _dateCtrl,
                                          style: TextStyle(color: themeColors.textPrimary, fontSize: 14),
                                          decoration: InputDecoration(
                                            filled: true,
                                            fillColor: isDark ? const Color(0xFF1E1814) : themeColors.inputBackground,
                                            isDense: true,
                                            prefixIcon: Icon(Icons.calendar_month_rounded, color: primaryGold, size: 20),
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(10),
                                              borderSide: BorderSide(color: cardBorderColor),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Text('Select Time Slot *', style: TextStyle(color: themeColors.textSecondary, fontSize: 12)),
                                        if (_isLoadingSlots) ...[
                                          const SizedBox(width: 8),
                                          SizedBox(
                                            width: 12,
                                            height: 12,
                                            child: CircularProgressIndicator(strokeWidth: 1.5, color: primaryGold),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: _timeOptions.map((t) {
                                        final isPast = _isSlotInPast(_dateCtrl.text.trim(), t);
                                        final isBooked = _bookedSlots.contains(t);
                                        final isUnavailable = isPast || isBooked;
                                        final isSelected = t == _selectedTime && !isUnavailable;

                                        String labelText = t;
                                        if (isBooked) labelText = '$t (Booked)';
                                        if (isPast) labelText = '$t (Past)';

                                        return ChoiceChip(
                                          label: Text(
                                            labelText,
                                            style: TextStyle(
                                              color: isUnavailable
                                                  ? themeColors.textMuted
                                                  : (isSelected ? themeColors.buttonTextPrimary : themeColors.textPrimary),
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              decoration: isUnavailable ? TextDecoration.lineThrough : null,
                                            ),
                                          ),
                                          selected: isSelected,
                                          selectedColor: primaryGold,
                                          backgroundColor: isUnavailable
                                              ? (isDark ? const Color(0xFF1A1614) : themeColors.inputBackground.withAlpha(50))
                                              : (isDark ? const Color(0xFF241D18) : themeColors.inputBackground),
                                          onSelected: isUnavailable
                                              ? null
                                              : (val) => setState(() => _selectedTime = t),
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Notes & Instructions Container
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: cardBg,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: cardBorderColor),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'ADDITIONAL NOTES',
                                      style: TextStyle(
                                        color: primaryGold,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    TextField(
                                      controller: _notesCtrl,
                                      style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                                      decoration: InputDecoration(
                                        labelText: 'Notes / Special Instructions (Optional)',
                                        labelStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
                                        prefixIcon: Icon(Icons.notes_rounded, color: primaryGold, size: 20),
                                        enabledBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: cardBorderColor),
                                        ),
                                        focusedBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: primaryGold),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 24),

                              // Confirm Booking Button
                              SizedBox(
                                width: double.infinity,
                                height: 52,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: primaryGold,
                                    foregroundColor: themeColors.buttonTextPrimary,
                                    elevation: 4,
                                    shadowColor: primaryGold.withAlpha(80),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  onPressed: _isSubmitting ? null : _submitBooking,
                                  child: _isSubmitting
                                      ? SizedBox(
                                          width: 22,
                                          height: 22,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: themeColors.buttonTextPrimary,
                                          ),
                                        )
                                      : Text(
                                          'Confirm Booking',
                                          style: TextStyle(
                                            color: themeColors.buttonTextPrimary,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                ),
                              ),

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
}
