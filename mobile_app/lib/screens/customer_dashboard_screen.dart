import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({super.key});

  @override
  State<CustomerDashboardScreen> createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  bool _isLoading = true;
  Map<String, dynamic>? _user;
  List<dynamic> _appointments = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadCustomerData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomerData() async {
    setState(() => _isLoading = true);
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
        _appointments = appointmentsList;
        _isLoading = false;
      });
    }
  }

  // --- MODAL: RESCHEDULE APPOINTMENT ---
  void _showRescheduleModal(String appointmentId) {
    final dateCtrl = TextEditingController(text: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0]);
    String selectedTime = '11:30 AM';
    final timeOptions = ['09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
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
                  const Text('Reschedule Appointment ≡ƒùô∩╕Å', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
                  IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: dateCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'New Date (YYYY-MM-DD)', prefixIcon: Icon(Icons.calendar_month, color: Color(0xFFE0A96D))),
              ),
              const SizedBox(height: 12),
              const Text('Select Time Slot', style: TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: timeOptions.map((t) {
                  final isSelected = t == selectedTime;
                  return ChoiceChip(
                    label: Text(t, style: TextStyle(color: isSelected ? Colors.black : Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    selected: isSelected,
                    selectedColor: const Color(0xFFE0A96D),
                    backgroundColor: const Color(0xFF25201C),
                    onSelected: (val) => setModalState(() => selectedTime = t),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE0A96D)),
                  onPressed: () async {
                    final success = await ApiService.rescheduleCustomerAppointment(appointmentId, dateCtrl.text.trim(), selectedTime);
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      if (success) _loadCustomerData();
                    }
                  },
                  child: const Text('Confirm Reschedule Slot', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
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

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
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
                        const Text(
                          'Book New Appointment',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFE0A96D),
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white54),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: nameCtrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Your Full Name *',
                        labelStyle: TextStyle(color: Colors.white60),
                        prefixIcon: Icon(Icons.person_outline, color: Color(0xFFE0A96D)),
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Colors.white24),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Phone Number *',
                        labelStyle: TextStyle(color: Colors.white60),
                        prefixIcon: Icon(Icons.phone_outlined, color: Color(0xFFE0A96D)),
                        enabledBorder: UnderlineInputBorder(
                          borderSide: BorderSide(color: Colors.white24),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('Select Service *', style: TextStyle(color: Colors.white70, fontSize: 12)),
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
                          dropdownColor: const Color(0xFF25201C),
                          style: const TextStyle(color: Colors.white),
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
                            fillColor: const Color(0xFF25201C),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide.none,
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
                              const Text('Select Branch *', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                initialValue: selectedBranch,
                                dropdownColor: const Color(0xFF25201C),
                                style: const TextStyle(color: Colors.white, fontSize: 13),
                                items: branchOptions.map<DropdownMenuItem<String>>((b) {
                                  return DropdownMenuItem<String>(value: b, child: Text(b));
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) setModalState(() => selectedBranch = val);
                                },
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: const Color(0xFF25201C),
                                  isDense: true,
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
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
                              const Text('Specialist', style: TextStyle(color: Colors.white70, fontSize: 12)),
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
                                    dropdownColor: const Color(0xFF25201C),
                                    style: const TextStyle(color: Colors.white, fontSize: 13),
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
                                      fillColor: const Color(0xFF25201C),
                                      isDense: true,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
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
                              const Text('Date *', style: TextStyle(color: Colors.white70, fontSize: 12)),
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
                                    style: const TextStyle(color: Colors.white, fontSize: 13),
                                    decoration: InputDecoration(
                                      filled: true,
                                      fillColor: const Color(0xFF25201C),
                                      isDense: true,
                                      prefixIcon: const Icon(Icons.calendar_month, color: Color(0xFFE0A96D), size: 18),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
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
                        const Text('Select Time Slot *', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        if (isLoadingSlots) ...[
                          const SizedBox(width: 8),
                          const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFFE0A96D))),
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
                                  ? Colors.white30
                                  : (isSelected ? Colors.black : Colors.white),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              decoration: isUnavailable ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: const Color(0xFFE0A96D),
                          backgroundColor: isUnavailable
                              ? Colors.white.withValues(alpha: 0.05)
                              : const Color(0xFF25201C),
                          onSelected: isUnavailable
                              ? null
                              : (val) => setModalState(() => selectedTime = t),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesCtrl,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: const InputDecoration(
                        labelText: 'Notes / Special Instructions (Optional)',
                        labelStyle: TextStyle(color: Colors.white54, fontSize: 12),
                        prefixIcon: Icon(Icons.notes, color: Color(0xFFE0A96D), size: 18),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE0A96D),
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
                                const SnackBar(backgroundColor: Colors.amber, content: Text('Please select a future time slot for your appointment.')),
                              );
                            }
                            return;
                          }

                          if (bookedSlots.contains(selectedTime)) {
                            if (modalCtx.mounted) {
                              ScaffoldMessenger.of(modalCtx).showSnackBar(
                                const SnackBar(backgroundColor: Colors.redAccent, content: Text('This time slot is already booked. Please select another slot.')),
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
                                backgroundColor: res['success'] == true ? Colors.green[800] : Colors.red[800],
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
                        child: const Text(
                          'Confirm Booking',
                          style: TextStyle(
                            color: Color(0xFF13100E),
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

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFE0A96D);
    const cardBg = Color(0xFF191512);

    final String clientName = _user?['name'] ?? 'VIP Client';
    final String clientEmail = _user?['email'] ?? '';
    final String clientTier = _user?['membership']?['tier'] ?? 'Gold VIP';

    return Scaffold(
      backgroundColor: const Color(0xFF13100E),
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: goldColor, size: 20),
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
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('CLIENT DESK', style: TextStyle(color: Color(0xFFF6F2EB), fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.1)),
                  Text(clientName, style: const TextStyle(color: goldColor, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(color: goldColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: goldColor)),
            child: Text(clientTier.toUpperCase(), style: const TextStyle(color: goldColor, fontSize: 10, fontWeight: FontWeight.bold)),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70, size: 20),
            onPressed: _loadCustomerData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: goldColor,
          labelColor: goldColor,
          unselectedLabelColor: Colors.white54,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          tabs: const [
            Tab(text: 'MY BOOKINGS'),
            Tab(text: 'VIP MEMBERSHIP'),
            Tab(text: 'MY PROFILE'),
            Tab(text: 'SECURITY'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: goldColor))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildBookingsTab(goldColor, cardBg),
                _buildVipTab(goldColor, cardBg),
                _buildProfileTab(goldColor, cardBg, clientName, clientEmail),
                _buildSecurityTab(goldColor, cardBg),
              ],
            ),
    );
  }

  // --- TAB 1: MY BOOKINGS & APPOINTMENT HISTORY ---
  Widget _buildBookingsTab(Color goldColor, Color cardBg) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: cardBg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_appointments.length} Total Appointments', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                onPressed: _showBookAppointmentModal,
                icon: const Icon(Icons.add, color: Colors.black, size: 16),
                label: const Text('Book New Appointment', style: TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _appointments.isEmpty
              ? const Center(child: Text('No Salon Appointments Found', style: TextStyle(color: Colors.white54)))
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

                    Color statusColor = Colors.amber;
                    if (status == 'confirmed') statusColor = Colors.greenAccent;
                    if (status == 'in progress') statusColor = Colors.purpleAccent;
                    if (status == 'completed') statusColor = Colors.blueAccent;
                    if (status == 'cancelled') statusColor = Colors.redAccent;
                    if (status == 'rescheduled') statusColor = Colors.orangeAccent;

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
                              Text('Booking #$bookingId', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white54)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12), border: Border.all(color: statusColor)),
                                child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(service, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                          const SizedBox(height: 4),
                          Text('Specialist: $specialist', style: TextStyle(color: goldColor, fontSize: 12)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.schedule, size: 14, color: Colors.white38),
                              const SizedBox(width: 4),
                              Text('$date at $time', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                              const Spacer(),
                              Text('Γé╣$price', style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 15)),
                            ],
                          ),
                          if (status != 'completed' && status != 'cancelled') ...[
                            const Divider(color: Colors.white10, height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(side: BorderSide(color: goldColor)),
                                  onPressed: () => _showRescheduleModal(id),
                                  icon: Icon(Icons.event_repeat, size: 14, color: goldColor),
                                  label: Text('Reschedule', style: TextStyle(color: goldColor, fontSize: 11)),
                                ),
                                const SizedBox(width: 8),
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.redAccent)),
                                  onPressed: () async {
                                    final success = await ApiService.cancelCustomerAppointment(id);
                                    if (success) _loadCustomerData();
                                  },
                                  icon: const Icon(Icons.cancel_outlined, size: 14, color: Colors.redAccent),
                                  label: const Text('Cancel', style: TextStyle(color: Colors.redAccent, fontSize: 11)),
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
  Widget _buildVipTab(Color goldColor, Color cardBg) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF3E2D1E), Color(0xFF191512)]),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: goldColor.withValues(alpha: 0.4)),
              boxShadow: [
                BoxShadow(color: goldColor.withValues(alpha: 0.1), blurRadius: 16, spreadRadius: 2),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('SPY SALON VIP CLUB', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                    Icon(Icons.workspace_premium, color: goldColor, size: 28),
                  ],
                ),
                const SizedBox(height: 12),
                Text(_user?['membership']?['tier'] ?? 'Gold VIP Tier', style: TextStyle(color: goldColor, fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Flat 20% Discount Activated on All Treatments', style: TextStyle(color: Colors.greenAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                const Divider(color: Colors.white10),
                const SizedBox(height: 10),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Status: ACTIVE', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    Text('Priority Lock: ENABLED', style: TextStyle(color: Colors.white70, fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text('VIP Perks & Benefits', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _buildPerkItem(goldColor, cardBg, Icons.percent, '20% Off Every Booking', 'Automatic discount applied at checkout on all hair, skin, & spa rituals.'),
          _buildPerkItem(goldColor, cardBg, Icons.event_available, 'Zero Wait Time Lock', 'Priority time slot reservation with direct master stylist assignment.'),
          _buildPerkItem(goldColor, cardBg, Icons.local_cafe, 'Complimentary Consultation', 'Free 24K gold skin analysis & scalp therapy assessment.'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: goldColor),
              onPressed: () async {
                final res = await ApiService.upgradeCustomerMembership('Platinum VIP');
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: const Color(0xFF1B4D3E), content: Text(res['message'] ?? 'Membership upgraded!')),
                  );
                  _loadCustomerData();
                }
              },
              child: const Text('Upgrade to Royal Platinum VIP', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerkItem(Color goldColor, Color cardBg, IconData icon, String title, String desc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
      child: Row(
        children: [
          CircleAvatar(backgroundColor: goldColor.withValues(alpha: 0.15), child: Icon(icon, color: goldColor, size: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                Text(desc, style: const TextStyle(color: Colors.white54, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- TAB 3: PROFILE DETAILS EDITOR ---
  Widget _buildProfileTab(Color goldColor, Color cardBg, String clientName, String clientEmail) {
    final nameCtrl = TextEditingController(text: clientName);
    final phoneCtrl = TextEditingController(text: _user?['phone'] ?? '');
    final emailCtrl = TextEditingController(text: clientEmail);
    final addressCtrl = TextEditingController(text: _user?['address'] ?? 'Jubilee Hills, Hyderabad');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Personal Profile Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          const Text('Update your personal info for appointment notifications and receipts.', style: TextStyle(color: Colors.white54, fontSize: 12)),
          const SizedBox(height: 16),
          TextField(
            controller: nameCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Full Name *', prefixIcon: Icon(Icons.person_outline, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Mobile Phone *', prefixIcon: Icon(Icons.phone_outlined, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Email Address *', prefixIcon: Icon(Icons.email_outlined, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: addressCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Home / Preferred Studio Location', prefixIcon: Icon(Icons.location_on_outlined, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: goldColor),
              onPressed: () async {
                final res = await ApiService.updateCustomerProfile({
                  'name': nameCtrl.text.trim(),
                  'phone': phoneCtrl.text.trim(),
                  'email': emailCtrl.text.trim(),
                  'address': addressCtrl.text.trim(),
                });
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: res['success'] == true ? const Color(0xFF1B4D3E) : Colors.red[900], content: Text(res['message'] ?? 'Profile updated')),
                  );
                  _loadCustomerData();
                }
              },
              child: const Text('Save Profile Details', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  // --- TAB 4: SECURITY & CHANGE PASSWORD ---
  Widget _buildSecurityTab(Color goldColor, Color cardBg) {
    final currentPassCtrl = TextEditingController();
    final newPassCtrl = TextEditingController();
    final confirmPassCtrl = TextEditingController();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Security & Password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          const Text('Update your account password securely.', style: TextStyle(color: Colors.white54, fontSize: 12)),
          const SizedBox(height: 16),
          TextField(
            controller: currentPassCtrl,
            obscureText: true,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Current Password *', prefixIcon: Icon(Icons.lock_outline, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: newPassCtrl,
            obscureText: true,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'New Password *', prefixIcon: Icon(Icons.lock_reset, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: confirmPassCtrl,
            obscureText: true,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Confirm New Password *', prefixIcon: Icon(Icons.lock, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: goldColor),
              onPressed: () async {
                if (newPassCtrl.text != confirmPassCtrl.text) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(backgroundColor: Colors.redAccent, content: Text('New passwords do not match!')),
                  );
                  return;
                }
                final res = await ApiService.changeCustomerPassword(currentPassCtrl.text, newPassCtrl.text);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: res['success'] == true ? const Color(0xFF1B4D3E) : Colors.red[900], content: Text(res['message'] ?? 'Password changed')),
                  );
                }
              },
              child: const Text('Update Password', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
