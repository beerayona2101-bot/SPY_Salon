import 'package:flutter/material.dart';
import 'config/api_config.dart';
import 'screens/admin_dashboard_screen.dart';
import 'screens/customer_dashboard_screen.dart';
import 'screens/employee_dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const SpySalonApp());
}

class SpySalonApp extends StatelessWidget {
  const SpySalonApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Spy_Salon',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFFE0A96D),
        scaffoldBackgroundColor: const Color(0xFF13100E),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFE0A96D),
          secondary: Color(0xFFC8868F),
          surface: Color(0xFF191512),
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isCheckingBackend = true;
  bool _isBackendConnected = false;
  String _backendUrl = '';
  String _backendMessage = '';
  List<dynamic> _services = [];
  List<dynamic> _specialists = [];
  bool _isLoadingData = false;
  Map<String, dynamic>? _currentUser;

  @override
  void initState() {
    super.initState();
    _loadUserSession();
    _checkBackendAndLoadData();
  }

  Future<void> _loadUserSession() async {
    final user = await ApiService.getStoredUser();
    if (mounted) {
      setState(() {
        _currentUser = user;
      });
      if (user != null) {
        final role = (user['role'] ?? 'customer').toString().toLowerCase();
        final isAdmin = role == 'admin' || role == 'manager';
        final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';
        if (isAdmin) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (ctx) => const AdminDashboardScreen()),
                (route) => false,
              );
            }
          });
        } else if (isStaff) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (ctx) => const EmployeeDashboardScreen()),
                (route) => false,
              );
            }
          });
        }
      }
    }
  }

  void _navigateToUserDashboard() {
    if (_currentUser == null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => LoginScreen(onLoginSuccess: () async {
            await _loadUserSession();
            _navigateToUserDashboard();
          }),
        ),
      );
      return;
    }

    final role = (_currentUser!['role'] ?? 'customer').toString().toLowerCase();

    if (role == 'admin' || role == 'manager') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (ctx) => const AdminDashboardScreen()),
      );
    } else if (role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber') {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (ctx) => const EmployeeDashboardScreen()),
        (route) => false,
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (ctx) => const CustomerDashboardScreen()),
      );
    }
  }

  Future<void> _checkBackendAndLoadData() async {
    setState(() {
      _isCheckingBackend = true;
    });

    final health = await ApiService.checkHealth();

    if (mounted) {
      setState(() {
        _isCheckingBackend = false;
        _isBackendConnected = health['connected'] == true;
        _backendUrl = health['url'] ?? ApiConfig.baseUrl;
        _backendMessage = _isBackendConnected
            ? '${health['service']} (${health['status']})'
            : (health['error'] ?? 'Backend unreachable');
      });

      // Always load catalog data (uses live API if connected, fallback demo data if offline)
      _fetchBackendData();
    }
  }

  Future<void> _fetchBackendData() async {
    setState(() {
      _isLoadingData = true;
    });

    final servicesFuture = ApiService.getServices();
    final specialistsFuture = ApiService.getSpecialists();

    final results = await Future.wait([servicesFuture, specialistsFuture]);

    if (mounted) {
      setState(() {
        _services = results[0];
        _specialists = results[1];
        _isLoadingData = false;
      });
    }
  }

  void _showIpConfigDialog() {
    final controller = TextEditingController(text: ApiConfig.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF191512),
          title: const Text('Backend Server Settings', style: TextStyle(color: Color(0xFFE0A96D))),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Specify your backend server address:',
                style: TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'e.g. http://10.0.2.2:5000',
                  hintStyle: const TextStyle(color: Colors.white30),
                  filled: true,
                  fillColor: const Color(0xFF25201C),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFFE0A96D)),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Quick Presets:',
                style: TextStyle(color: Colors.white60, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  ActionChip(
                    backgroundColor: const Color(0xFF25201C),
                    label: const Text('Android Emulator', style: TextStyle(color: Color(0xFFE0A96D), fontSize: 11)),
                    onPressed: () {
                      controller.text = 'http://10.0.2.2:5000';
                    },
                  ),
                  ActionChip(
                    backgroundColor: const Color(0xFF25201C),
                    label: const Text('Localhost', style: TextStyle(color: Color(0xFFE0A96D), fontSize: 11)),
                    onPressed: () {
                      controller.text = 'http://localhost:5000';
                    },
                  ),
                  ActionChip(
                    backgroundColor: const Color(0xFF25201C),
                    label: const Text('LAN Wi-Fi (192.168.1.6)', style: TextStyle(color: Color(0xFFE0A96D), fontSize: 11)),
                    onPressed: () {
                      controller.text = 'http://192.168.1.6:5000';
                    },
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE0A96D),
              ),
              onPressed: () async {
                final targetUrl = controller.text.trim();
                if (targetUrl.isNotEmpty) {
                  await ApiConfig.setActiveBaseUrl(targetUrl);
                  if (ctx.mounted) Navigator.pop(ctx);
                  _checkBackendAndLoadData();
                }
              },
              child: const Text('Save & Connect', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
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

  void _showBookingModal() {
    if (_currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFC8868F),
          content: Text('Please sign in or create an account to book your appointment.'),
        ),
      );
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => LoginScreen(
            onLoginSuccess: () {
              _checkBackendAndLoadData();
              _showBookingModal();
            },
          ),
        ),
      );
      return;
    }

    final nameCtrl = TextEditingController(text: _currentUser?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: _currentUser?['phone'] ?? '');
    final notesCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0]);

    String selectedService = _services.isNotEmpty 
        ? (_services[0]['name'] ?? _services[0]['title'] ?? 'Hair Cut & Styling')
        : 'Hair Cut & Styling';
    String selectedBranch = 'Jubilee Hills';
    String selectedSpecialist = 'Any Available Specialist';
    String selectedTime = '11:30 AM';
    List<String> bookedSlots = [];
    bool isLoadingSlots = false;

    final timeOptions = ['09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'];
    final branchOptions = ['Jubilee Hills', 'Banjara Hills', 'Gachibowli'];

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
                          'Book Appointment',
                          style: TextStyle(
                            fontSize: 20,
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
                        final rawList = _services.isNotEmpty ? _services : [
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
                                  for (final spec in _specialists) {
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
                            customerEmail: _currentUser?['email'],
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

  Widget _buildMainAppDrawer(Color goldColor) {
    final user = _currentUser;

    bool isAdmin = false;
    bool isStaff = false;
    bool isCustomer = false;

    if (user != null) {
      final role = (user['role'] ?? 'customer').toString().toLowerCase();
      isAdmin = role == 'admin' || role == 'manager';
      isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';
      isCustomer = !isAdmin && !isStaff;
    }

    return Drawer(
      backgroundColor: const Color(0xFF13100E),
      child: Column(
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: Color(0xFF191512),
              border: Border(bottom: BorderSide(color: Color(0xFFE0A96D), width: 0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: goldColor, width: 1.5),
                        color: Colors.white,
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/logo.png',
                          fit: BoxFit.cover,
                          errorBuilder: (ctx, err, stack) => const Center(
                            child: Text('S', style: TextStyle(color: Color(0xFF2B0C15), fontWeight: FontWeight.bold, fontSize: 18)),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SPY SALON',
                            style: TextStyle(
                              color: Color(0xFFF6F2EB),
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.6,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Luxury Studio & Spa',
                            style: TextStyle(color: Color(0xFFE0A96D), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (user != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: goldColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: goldColor.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.person, color: Color(0xFFE0A96D), size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                (user['name'] ?? user['username'] ?? 'User').toString(),
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                (user['email'] ?? user['phone'] ?? '').toString(),
                                style: const TextStyle(color: Colors.white60, fontSize: 10),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ListTile(
                  leading: const Icon(Icons.home, color: Color(0xFFE0A96D)),
                  title: const Text('Home Page', style: TextStyle(color: Colors.white, fontSize: 14)),
                  onTap: () => Navigator.pop(context),
                ),
                ListTile(
                  leading: const Icon(Icons.calendar_month, color: Color(0xFFE0A96D)),
                  title: const Text('Book Appointment', style: TextStyle(color: Colors.white, fontSize: 14)),
                  onTap: () {
                    Navigator.pop(context);
                    _showBookingModal();
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.dry_cleaning_rounded, color: Color(0xFFE0A96D)),
                  title: const Text('Services Catalog', style: TextStyle(color: Colors.white, fontSize: 14)),
                  onTap: () => Navigator.pop(context),
                ),
                if (user != null) ...[
                  const Divider(color: Colors.white10),
                  const Padding(
                    padding: EdgeInsets.only(left: 16, top: 8, bottom: 4),
                    child: Text('MY DASHBOARD', style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  if (isAdmin)
                    ListTile(
                      leading: const Icon(Icons.admin_panel_settings, color: Color(0xFFE0A96D)),
                      title: const Text('Admin Dashboard', style: TextStyle(color: Colors.white, fontSize: 14)),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (ctx) => const AdminDashboardScreen()),
                        );
                      },
                    ),
                  if (isStaff)
                    ListTile(
                      leading: const Icon(Icons.badge, color: Color(0xFFE0A96D)),
                      title: const Text('Staff Dashboard', style: TextStyle(color: Colors.white, fontSize: 14)),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (ctx) => const EmployeeDashboardScreen()),
                        );
                      },
                    ),
                  if (isCustomer)
                    ListTile(
                      leading: const Icon(Icons.person_pin, color: Color(0xFFE0A96D)),
                      title: const Text('Customer Dashboard', style: TextStyle(color: Colors.white, fontSize: 14)),
                      onTap: () {
                        Navigator.pop(context);
                        _navigateToUserDashboard();
                      },
                    ),
                ],
                const Divider(color: Colors.white10),
                const Padding(
                  padding: EdgeInsets.only(left: 16, top: 8, bottom: 4),
                  child: Text('SETTINGS', style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
                ListTile(
                  leading: const Icon(Icons.settings, color: Color(0xFFE0A96D)),
                  title: const Text('Backend Server Settings', style: TextStyle(color: Colors.white, fontSize: 14)),
                  onTap: () {
                    Navigator.pop(context);
                    _showIpConfigDialog();
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.refresh, color: Color(0xFFE0A96D)),
                  title: const Text('Refresh Connection', style: TextStyle(color: Colors.white, fontSize: 14)),
                  onTap: () {
                    Navigator.pop(context);
                    _checkBackendAndLoadData();
                  },
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white10),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: user != null
                ? SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.redAccent),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () async {
                        Navigator.pop(context);
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (dialogCtx) => AlertDialog(
                            backgroundColor: const Color(0xFF191512),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: const BorderSide(color: Color(0xFFE0A96D), width: 0.8),
                            ),
                            title: const Row(
                              children: [
                                Icon(Icons.logout, color: Colors.redAccent, size: 22),
                                SizedBox(width: 10),
                                Text('Sign Out', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            content: const Text('Are you sure you want to sign out?', style: TextStyle(color: Colors.white70, fontSize: 14)),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(dialogCtx, false),
                                child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.redAccent,
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
                          if (mounted) setState(() => _currentUser = null);
                        }
                      },
                      icon: const Icon(Icons.logout, color: Colors.redAccent, size: 18),
                      label: const Text('Sign Out', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                    ),
                  )
                : SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: goldColor,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (ctx) => LoginScreen(
                              onLoginSuccess: () async {
                                await _loadUserSession();
                                _navigateToUserDashboard();
                              },
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.login, color: Color(0xFF13100E), size: 18),
                      label: const Text('Sign In', style: TextStyle(color: Color(0xFF13100E), fontWeight: FontWeight.bold)),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFE0A96D);

    return Scaffold(
      drawer: _buildMainAppDrawer(goldColor),
      appBar: AppBar(
        backgroundColor: const Color(0xFF191512),
        elevation: 0,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu, color: goldColor, size: 24),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
            tooltip: 'Open Navigation Menu',
          ),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: goldColor, width: 1.5),
                color: Colors.white,
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/images/logo.png',
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, stack) => const Center(
                    child: Text('S', style: TextStyle(color: Color(0xFF2B0C15), fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'SPY SALON',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 1.4,
                fontSize: 16,
                color: Color(0xFFF6F2EB),
              ),
            ),
          ],
        ),
        actions: [
          if (_currentUser != null) ...[
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: PopupMenuButton<String>(
                color: const Color(0xFF191512),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: goldColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: goldColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.account_circle, color: goldColor, size: 18),
                      const SizedBox(width: 4),
                      Text(
                        _currentUser!['name']?.split(' ')[0] ?? 'User',
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                onSelected: (value) async {
                  if (value == 'dashboard') {
                    _navigateToUserDashboard();
                  } else if (value == 'logout') {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (dialogCtx) => AlertDialog(
                        backgroundColor: const Color(0xFF191512),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: Color(0xFFE0A96D), width: 0.8),
                        ),
                        title: const Row(
                          children: [
                            Icon(Icons.logout, color: Colors.redAccent, size: 22),
                            SizedBox(width: 10),
                            Text('Sign Out', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        content: const Text('Are you sure you want to sign out?', style: TextStyle(color: Colors.white70, fontSize: 14)),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(dialogCtx, false),
                            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.redAccent,
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
                      if (mounted) setState(() => _currentUser = null);
                    }
                  }
                },
                itemBuilder: (ctx) {
                  final role = (_currentUser!['role'] ?? 'customer').toString().toLowerCase();
                  final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';
                  final isAdmin = role == 'admin' || role == 'manager';

                  String dashboardLabel = 'My Profile & Bookings';
                  IconData dashboardIcon = Icons.person_outline;
                  if (isAdmin) {
                    dashboardLabel = 'Admin Dashboard';
                    dashboardIcon = Icons.dashboard_customize_outlined;
                  } else if (isStaff) {
                    dashboardLabel = 'Staff Dashboard';
                    dashboardIcon = Icons.badge_outlined;
                  }

                  return [
                    PopupMenuItem(
                      enabled: false,
                      child: Text(
                        'Signed in as ${_currentUser!['email'] ?? _currentUser!['phone'] ?? ''}',
                        style: const TextStyle(color: Colors.white54, fontSize: 11),
                      ),
                    ),
                    PopupMenuItem(
                      value: 'dashboard',
                      child: Row(
                        children: [
                          Icon(dashboardIcon, color: goldColor, size: 18),
                          const SizedBox(width: 8),
                          Text(dashboardLabel, style: const TextStyle(color: goldColor)),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'logout',
                      child: Row(
                        children: [
                          Icon(Icons.logout, color: Colors.redAccent, size: 18),
                          SizedBox(width: 8),
                          Text('Sign Out', style: TextStyle(color: Colors.redAccent)),
                        ],
                      ),
                    ),
                  ];
                },
              ),
            ),
          ] else ...[
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: TextButton.icon(
                icon: const Icon(Icons.login, size: 16, color: goldColor),
                label: const Text('Sign In', style: TextStyle(color: goldColor, fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (ctx) => LoginScreen(
                        onLoginSuccess: () async {
                          await _loadUserSession();
                          _navigateToUserDashboard();
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Backend Connectivity Status Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: _isCheckingBackend
                  ? Colors.amber.withValues(alpha: 0.15)
                  : (_isBackendConnected
                      ? Colors.green.withValues(alpha: 0.15)
                      : Colors.red.withValues(alpha: 0.15)),
              child: Row(
                children: [
                  Icon(
                    _isCheckingBackend
                        ? Icons.sync
                        : (_isBackendConnected ? Icons.check_circle : Icons.cloud_off),
                    color: _isCheckingBackend
                        ? Colors.amber
                        : (_isBackendConnected ? Colors.greenAccent : Colors.redAccent),
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isCheckingBackend
                              ? 'Connecting to Backend API...'
                              : (_isBackendConnected ? 'Backend Connected' : 'Backend Disconnected'),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: _isCheckingBackend
                                ? Colors.amber
                                : (_isBackendConnected ? Colors.greenAccent : Colors.redAccent),
                          ),
                        ),
                        Text(
                          '$_backendUrl | $_backendMessage',
                          style: const TextStyle(fontSize: 11, color: Colors.white70),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: _showIpConfigDialog,
                    child: const Text('Edit', style: TextStyle(color: goldColor, fontSize: 12)),
                  )
                ],
              ),
            ),

            // Hero Banner Section with Official SPY Salon Logo
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  Container(
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: goldColor, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: goldColor.withValues(alpha: 0.4),
                          blurRadius: 24,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.cover,
                        errorBuilder: (ctx, err, stack) => const Icon(
                          Icons.content_cut_rounded,
                          size: 48,
                          color: goldColor,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Luxury Beauty Studio & Botanical Spa',
                    style: TextStyle(
                      color: goldColor,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.2,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Hairs make perfectly',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton.icon(
                        onPressed: _showBookingModal,
                        icon: const Icon(Icons.calendar_month, color: Color(0xFF13100E)),
                        label: const Text(
                          'Book Appointment',
                          style: TextStyle(
                            color: Color(0xFF13100E),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: goldColor,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                      ),
                      Builder(
                        builder: (ctx) {
                          String label = 'Sign In';
                          IconData icon = Icons.login;

                          if (_currentUser != null) {
                            final role = (_currentUser!['role'] ?? 'customer').toString().toLowerCase();
                            final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';
                            final isAdmin = role == 'admin' || role == 'manager';

                            if (isAdmin) {
                              label = 'Admin Dashboard';
                              icon = Icons.dashboard_outlined;
                            } else if (isStaff) {
                              label = 'Staff Dashboard';
                              icon = Icons.badge_outlined;
                            } else {
                              label = 'My Profile & Bookings';
                              icon = Icons.person_outline;
                            }
                          }

                          return OutlinedButton.icon(
                            onPressed: _navigateToUserDashboard,
                            icon: Icon(icon, color: goldColor, size: 18),
                            label: Text(
                              label,
                              style: const TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: goldColor),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),

            if (_specialists.isNotEmpty) ...[
              const Divider(color: Colors.white10),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Backend Specialists',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: goldColor,
                      ),
                    ),
                    Text(
                      '${_specialists.length} staff',
                      style: const TextStyle(color: Colors.white38, fontSize: 12),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 90,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _specialists.length,
                  itemBuilder: (ctx, i) {
                    final spec = _specialists[i];
                    final specName = spec['name'] ?? 'Stylist';
                    final role = spec['role'] ?? spec['title'] ?? 'Specialist';
                    return Container(
                      margin: const EdgeInsets.only(right: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF191512),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: goldColor.withValues(alpha: 0.3)),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(specName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(role, style: const TextStyle(color: goldColor, fontSize: 11)),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],

            const Divider(color: Colors.white10),

            // Services Section Loaded from Backend REST API or Offline Demo Fallback
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Text(
                        'Services Catalog',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: goldColor,
                        ),
                      ),
                      if (!_isBackendConnected) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.amber.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.amber, width: 0.8),
                          ),
                          child: const Text(
                            'OFFLINE DEMO',
                            style: TextStyle(color: Colors.amber, fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (_isLoadingData)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: goldColor),
                    )
                  else
                    Text(
                      '${_services.length} items',
                      style: const TextStyle(color: Colors.white38, fontSize: 12),
                    ),
                ],
              ),
            ),

            if (_services.isEmpty && !_isLoadingData)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF191512),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white10),
                ),
                child: Text(
                  _isBackendConnected 
                      ? 'No services returned from backend database yet.'
                      : 'Connect backend to fetch live services catalog.',
                  style: const TextStyle(color: Colors.white54, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _services.length,
                itemBuilder: (ctx, index) {
                  final service = _services[index];
                  final name = service['name'] ?? service['title'] ?? 'Service';
                  final rawPrice = service['price']?.toString() ?? '50+';
                  final price = (rawPrice.startsWith('₹') || rawPrice.startsWith('\$'))
                      ? rawPrice
                      : '₹$rawPrice';
                  final category = service['category'] ?? 'Beauty';

                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF191512),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: goldColor.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: goldColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.dry_cleaning_rounded, color: goldColor),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                category,
                                style: const TextStyle(color: Colors.white38, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          price,
                          style: const TextStyle(
                            color: goldColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
