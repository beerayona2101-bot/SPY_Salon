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
      title: 'SPY Salon',
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
      Navigator.push(
        context,
        MaterialPageRoute(builder: (ctx) => const EmployeeDashboardScreen()),
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

      if (_isBackendConnected) {
        _fetchBackendData();
      }
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
      builder: (ctx) => AlertDialog(
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
                hintText: 'e.g. http://192.168.1.3:5000',
                hintStyle: const TextStyle(color: Colors.white30),
                filled: true,
                fillColor: const Color(0xFF25201C),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFE0A96D)),
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Candidate Addresses:\n• Physical Phone: http://192.168.1.3:5000\n• Android Emulator: http://10.0.2.2:5000\n• Web / Localhost: http://localhost:5000',
              style: TextStyle(color: Colors.white38, fontSize: 11),
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
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                ApiConfig.setActiveBaseUrl(controller.text.trim());
                Navigator.pop(ctx);
                _checkBackendAndLoadData();
              }
            },
            child: const Text('Save & Reconnect', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
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
    String selectedService = _services.isNotEmpty 
        ? (_services[0]['name'] ?? _services[0]['title'] ?? 'Hair Styling & Cut')
        : 'Hair Cut & Styling';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (modalCtx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
          ),
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
                  labelText: 'Your Full Name',
                  labelStyle: TextStyle(color: Colors.white60),
                  prefixIcon: Icon(Icons.person_outline, color: Color(0xFFE0A96D)),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  labelStyle: TextStyle(color: Colors.white60),
                  prefixIcon: Icon(Icons.phone_outlined, color: Color(0xFFE0A96D)),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Select Service:', style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 8),
              StatefulBuilder(
                builder: (ctx, setModalState) {
                  final rawList = _services.isNotEmpty ? _services : [
                    {'name': 'Hair Cut & Styling'},
                    {'name': 'Botanical Facial Spa'},
                    {'name': 'Luxury Manicure'},
                  ];
                  
                  final Set<String> uniqueTitles = {};
                  for (final s in rawList) {
                    final t = (s['name'] ?? s['title'] ?? '').toString().trim();
                    if (t.isNotEmpty) uniqueTitles.add(t);
                  }
                  if (uniqueTitles.isEmpty) {
                    uniqueTitles.addAll(['Hair Cut & Styling', 'Botanical Facial Spa', 'Luxury Manicure']);
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
                        setModalState(() {
                          selectedService = val;
                        });
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

                    if (name.isEmpty || phone.isEmpty) {
                      if (modalCtx.mounted) {
                        ScaffoldMessenger.of(modalCtx).showSnackBar(
                          const SnackBar(content: Text('Please enter name and phone number')),
                        );
                      }
                      return;
                    }

                    final res = await ApiService.bookAppointment(
                      customerName: name,
                      customerPhone: phone,
                      service: selectedService,
                      appointmentDate: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0],
                      appointmentTime: '11:00 AM',
                    );

                    if (modalCtx.mounted) {
                      Navigator.pop(modalCtx);
                      ScaffoldMessenger.of(modalCtx).showSnackBar(
                        SnackBar(
                          backgroundColor: res['success'] ? Colors.green[800] : Colors.red[800],
                          content: Text(
                            res['success']
                                ? 'Appointment booked successfully via Backend API!'
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
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFE0A96D);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF191512),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
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
            const SizedBox(width: 10),
            const Text(
              'SPY SALON',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 1.8,
                fontSize: 17,
                color: Color(0xFFF6F2EB),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.admin_panel_settings_outlined, color: goldColor, size: 22),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (ctx) => const AdminDashboardScreen()),
              );
            },
            tooltip: 'Admin Dashboard',
          ),
          if (_currentUser != null) ...[
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: PopupMenuButton<String>(
                color: const Color(0xFF191512),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: goldColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: goldColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
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
                    await ApiService.logout();
                    setState(() => _currentUser = null);
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
            TextButton.icon(
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
          ],
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: goldColor, size: 20),
            onPressed: _showIpConfigDialog,
            tooltip: 'Configure Backend URL',
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70, size: 20),
            onPressed: _checkBackendAndLoadData,
            tooltip: 'Refresh Connection',
          ),
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

            // Services Section Loaded from Backend REST API
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Backend Services Catalog',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: goldColor,
                    ),
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
                  final price = service['price'] != null ? '\$${service['price']}' : '\$50+';
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
