import 'package:flutter/material.dart';
import '../main.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class EmployeeDashboardScreen extends StatefulWidget {
  const EmployeeDashboardScreen({super.key});

  @override
  State<EmployeeDashboardScreen> createState() => _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState extends State<EmployeeDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  bool _isLoading = true;
  Map<String, dynamic>? _user;
  List<dynamic> _appointments = [];
  List<dynamic> _attendance = [];
  List<dynamic> _leaves = [];
  List<dynamic> _payrolls = [];
  List<dynamic> _customers = [];

  String _shiftStatus = 'NOT_CLOCKED_IN'; // NOT_CLOCKED_IN, CLOCKED_IN, ON_BREAK, CLOCKED_OUT

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
    _loadStaffData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadStaffData() async {
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
                  MaterialPageRoute(builder: (ctx) => const EmployeeDashboardScreen()),
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

    final role = (storedUser['role'] ?? 'customer').toString().toLowerCase();
    final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber' || role == 'admin' || role == 'manager';

    if (!isStaff) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFC8868F),
          content: Text('Access Denied: Staff privileges required.'),
        ),
      );
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (ctx) => const HomeScreen()),
        (route) => false,
      );
      return;
    }
    
    final results = await Future.wait([
      ApiService.getEmployeeAppointments(),
      ApiService.getEmployeeAttendance(),
      ApiService.getEmployeeLeaves(),
      ApiService.getEmployeePayrolls(),
      ApiService.getEmployeeCustomers(),
    ]);

    if (mounted) {
      final attList = results[1];
      String currentShift = 'NOT_CLOCKED_IN';
      if (attList.isNotEmpty) {
        final todayRec = attList.first;
        if (todayRec['attendanceState'] != null) {
          currentShift = todayRec['attendanceState'];
        } else if (todayRec['clockOut'] != null) {
          currentShift = 'CLOCKED_OUT';
        } else if (todayRec['clockIn'] != null) {
          currentShift = 'CLOCKED_IN';
        }
      }

      setState(() {
        _user = storedUser;
        _appointments = results[0];
        _attendance = attList;
        _leaves = results[2];
        _payrolls = results[3];
        _customers = results[4];
        _shiftStatus = currentShift;
        _isLoading = false;
      });
    }
  }

  // --- MODAL: SEAT WALK-IN CLIENT ---
  void _showWalkInModal() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final serviceCtrl = TextEditingController(text: 'Hair Cut & Styling');
    final notesCtrl = TextEditingController(text: 'Direct Walk-In Client');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Seat Walk-In Client ✂️', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
                IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: nameCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Customer Name *', prefixIcon: Icon(Icons.person_outline, color: Color(0xFFE0A96D))),
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
              controller: serviceCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Service *', prefixIcon: Icon(Icons.content_cut, color: Color(0xFFE0A96D))),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: notesCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Notes', prefixIcon: Icon(Icons.notes, color: Color(0xFFE0A96D))),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE0A96D)),
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) return;
                  final res = await ApiService.createEmployeeWalkIn({
                    'customerName': nameCtrl.text.trim(),
                    'customerPhone': phoneCtrl.text.trim(),
                    'service': serviceCtrl.text.trim(),
                    'notes': notesCtrl.text.trim(),
                  });
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    if (res['success'] == true) {
                      _loadStaffData();
                    }
                  }
                },
                child: const Text('Confirm Walk-In Seating', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- MODAL: SUBMIT LEAVE REQUEST ---
  void _showLeaveModal() {
    final startCtrl = TextEditingController(text: DateTime.now().toString().split(' ')[0]);
    final endCtrl = TextEditingController(text: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0]);
    final reasonCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Apply for Leave 🗓️', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
                IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: ctx,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now().subtract(const Duration(days: 1)),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        startCtrl.text = picked.toString().split(' ')[0];
                      }
                    },
                    child: IgnorePointer(
                      child: TextField(
                        controller: startCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Start Date', prefixIcon: Icon(Icons.calendar_month, color: Color(0xFFE0A96D))),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: ctx,
                        initialDate: DateTime.now().add(const Duration(days: 1)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        endCtrl.text = picked.toString().split(' ')[0];
                      }
                    },
                    child: IgnorePointer(
                      child: TextField(
                        controller: endCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'End Date', prefixIcon: Icon(Icons.event, color: Color(0xFFE0A96D))),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: reasonCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Reason for Leave *', prefixIcon: Icon(Icons.notes, color: Color(0xFFE0A96D))),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE0A96D)),
                onPressed: () async {
                  final reason = reasonCtrl.text.trim();
                  if (reason.isEmpty) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text('Please enter a reason for leave application'), backgroundColor: Colors.amber),
                    );
                    return;
                  }
                  final res = await ApiService.submitLeaveRequest({
                    'startDate': startCtrl.text.trim(),
                    'endDate': endCtrl.text.trim(),
                    'reason': reason,
                    'employeeName': _user?['name'] ?? 'Staff Member',
                  });
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(
                        content: Text(res['message'] ?? (res['success'] == true ? 'Leave request submitted!' : 'Submission failed')),
                        backgroundColor: res['success'] == true ? Colors.green : Colors.redAccent,
                      ),
                    );
                    if (res['success'] == true) {
                      Navigator.pop(ctx);
                      _loadStaffData();
                    }
                  }
                },
                child: const Text('Submit Application', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- MODAL: ADD CUSTOMER BY STAFF ---
  void _showAddCustomerModal() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Register Client Profile 👤', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
                IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: nameCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(labelText: 'Customer Full Name *', prefixIcon: Icon(Icons.person_outline, color: Color(0xFFE0A96D))),
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
              decoration: const InputDecoration(labelText: 'Email Address', prefixIcon: Icon(Icons.email_outlined, color: Color(0xFFE0A96D))),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE0A96D)),
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) return;
                  final res = await ApiService.createEmployeeCustomer({
                    'name': nameCtrl.text.trim(),
                    'phone': phoneCtrl.text.trim(),
                    'email': emailCtrl.text.trim(),
                  });
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    if (res['success'] == true) {
                      _loadStaffData();
                    }
                  }
                },
                child: const Text('Save Client Profile', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStaffDrawer(Color goldColor, Color cardBg, Color shiftColor, String shiftText) {
    final navItems = [
      {'title': 'My Appointment Queue', 'icon': Icons.calendar_month_outlined, 'badge': '${_appointments.length}'},
      {'title': 'Timecard & Attendance', 'icon': Icons.access_time_outlined, 'badge': ''},
      {'title': 'Leave Applications', 'icon': Icons.event_busy_outlined, 'badge': '${_leaves.length}'},
      {'title': 'Payroll & Earnings', 'icon': Icons.payments_outlined, 'badge': ''},
      {'title': 'Bank & Payout Setup', 'icon': Icons.account_balance_outlined, 'badge': ''},
      {'title': 'My Clients Directory', 'icon': Icons.people_outline, 'badge': '${_customers.length}'},
    ];

    final staffName = _user?['name'] ?? 'Staff Member';
    final staffRole = _user?['role'] ?? 'Specialist';

    return Drawer(
      backgroundColor: const Color(0xFF13100E),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(top: 50, left: 20, right: 20, bottom: 20),
            decoration: const BoxDecoration(
              color: Color(0xFF191512),
              border: Border(bottom: BorderSide(color: Color(0xFF25201C))),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: goldColor.withValues(alpha: 0.2),
                  child: Text(
                    staffName.isNotEmpty ? staffName[0].toUpperCase() : 'S',
                    style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        staffName,
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: shiftColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: shiftColor.withValues(alpha: 0.5)),
                            ),
                            child: Text(
                              shiftText,
                              style: TextStyle(color: shiftColor, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              staffRole.toString().toUpperCase(),
                              style: const TextStyle(color: Colors.white38, fontSize: 10),
                              overflow: TextOverflow.ellipsis,
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
          const SizedBox(height: 10),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'STAFF NAVIGATION',
                style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              itemCount: navItems.length,
              itemBuilder: (ctx, index) {
                final item = navItems[index];
                final isSelected = _tabController.index == index;
                final String badge = item['badge'] as String;

                return Container(
                  margin: const EdgeInsets.only(bottom: 4),
                  decoration: BoxDecoration(
                    color: isSelected ? goldColor.withValues(alpha: 0.15) : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    border: isSelected ? Border.all(color: goldColor.withValues(alpha: 0.4)) : null,
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                    leading: Icon(
                      item['icon'] as IconData,
                      color: isSelected ? goldColor : Colors.white60,
                      size: 22,
                    ),
                    title: Text(
                      item['title'] as String,
                      style: TextStyle(
                        color: isSelected ? goldColor : Colors.white70,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 14,
                      ),
                    ),
                    trailing: badge.isNotEmpty && badge != '0'
                        ? Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: isSelected ? goldColor : const Color(0xFF25201C),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              badge,
                              style: TextStyle(
                                color: isSelected ? Colors.black : Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          )
                        : null,
                    onTap: () {
                      setState(() {
                        _tabController.index = index;
                      });
                      Navigator.pop(ctx);
                    },
                  ),
                );
              },
            ),
          ),
          const Divider(color: Colors.white10, height: 1),
          Padding(
            padding: const EdgeInsets.all(12),
            child: ListTile(
              dense: true,
              leading: const Icon(Icons.logout, color: Colors.redAccent, size: 20),
              title: const Text('Sign Out', style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold)),
              onTap: () async {
                Navigator.pop(context);
                if (!mounted) return;
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
                    content: const Text('Are you sure you want to sign out from Staff Portal?', style: TextStyle(color: Colors.white70, fontSize: 14)),
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
                  if (mounted) {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (ctx) => const HomeScreen()),
                      (route) => false,
                    );
                  }
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFE0A96D);
    const cardBg = Color(0xFF191512);

    Color shiftColor = Colors.grey;
    String shiftText = 'NOT CLOCKED IN ⚪';

    if (_shiftStatus == 'CLOCKED_IN') {
      shiftColor = Colors.greenAccent;
      shiftText = 'CLOCKED IN 🟢';
    } else if (_shiftStatus == 'ON_BREAK') {
      shiftColor = Colors.amber;
      shiftText = 'ON BREAK ☕';
    } else if (_shiftStatus == 'CLOCKED_OUT') {
      shiftColor = Colors.blueAccent;
      shiftText = 'CLOCKED OUT ⚪';
    }

    final sectionTitles = [
      'My Appointment Queue',
      'Timecard & Attendance',
      'Leave Applications',
      'Payroll & Earnings',
      'Bank & Payout Setup',
      'My Clients Directory'
    ];

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: const Color(0xFF13100E),
        drawer: _buildStaffDrawer(goldColor, cardBg, shiftColor, shiftText),
        appBar: AppBar(
          backgroundColor: cardBg,
          elevation: 0,
          leading: Builder(
            builder: (ctx) => IconButton(
              icon: const Icon(Icons.menu, color: goldColor, size: 24),
              onPressed: () => Scaffold.of(ctx).openDrawer(),
              tooltip: 'Open Side Menu',
            ),
          ),
          title: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 22,
                  height: 22,
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
                      style: const TextStyle(color: Color(0xFFF6F2EB), fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(_user?['name'] ?? 'Stylist', style: const TextStyle(color: goldColor, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              margin: const EdgeInsets.only(right: 4),
              decoration: BoxDecoration(color: shiftColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: shiftColor)),
              child: Text(shiftText, style: TextStyle(color: shiftColor, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white70, size: 20),
              onPressed: _loadStaffData,
              tooltip: 'Refresh Data',
            ),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: goldColor))
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
                  key: ValueKey<int>(_tabController.index),
                  child: _buildStaffTabContent(_tabController.index, goldColor, cardBg),
                ),
              ),
      ),
    );
  }

  Widget _buildStaffTabContent(int index, Color goldColor, Color cardBg) {
    switch (index) {
      case 0:
        return _buildQueueTab(goldColor, cardBg);
      case 1:
        return _buildTimecardTab(goldColor, cardBg);
      case 2:
        return _buildLeavesTab(goldColor, cardBg);
      case 3:
        return _buildPayrollTab(goldColor, cardBg);
      case 4:
        return _buildBankSetupTab(goldColor, cardBg);
      case 5:
        return _buildClientsTab(goldColor, cardBg);
      default:
        return _buildQueueTab(goldColor, cardBg);
    }
  }

  // --- TAB 1: MY APPOINTMENTS QUEUE & WALK-IN DESK ---
  Widget _buildQueueTab(Color goldColor, Color cardBg) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: cardBg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_appointments.length} Assigned Clients', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                onPressed: _showWalkInModal,
                icon: const Icon(Icons.add, color: Colors.black, size: 18),
                label: const Text('Seat Walk-In Client', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _appointments.isEmpty
              ? const Center(child: Text('No Assigned Appointments in Queue', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _appointments.length,
                  itemBuilder: (ctx, index) {
                    final appt = _appointments[index];
                    final id = appt['_id'] ?? appt['id'] ?? '';
                    final clientName = appt['customerName'] ?? appt['name'] ?? 'Client';
                    final phone = appt['customerPhone'] ?? appt['phone'] ?? '';
                    final service = appt['service'] ?? 'Hair Styling';
                    final time = appt['appointmentTime'] ?? appt['time'] ?? '12:00 PM';
                    final status = (appt['status'] ?? 'pending').toString().toLowerCase();

                    Color statusColor = Colors.amber;
                    if (status == 'confirmed') statusColor = Colors.greenAccent;
                    if (status == 'in progress') statusColor = Colors.purpleAccent;
                    if (status == 'completed') statusColor = Colors.blueAccent;
                    if (status == 'cancelled') statusColor = Colors.redAccent;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(14), border: Border.all(color: statusColor.withValues(alpha: 0.3))),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(child: Text(clientName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12), border: Border.all(color: statusColor)),
                                child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text('Service: $service', style: TextStyle(color: goldColor, fontSize: 13)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.schedule, size: 14, color: Colors.white38),
                              const SizedBox(width: 4),
                              Text('Slot: $time', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                              const Spacer(),
                              if (phone.isNotEmpty) Text(phone, style: const TextStyle(color: Colors.white38, fontSize: 12)),
                            ],
                          ),
                          const Divider(color: Colors.white10, height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              _buildStatusUpdatePopupMenu(appt, id, goldColor),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  bool _hasAppointmentStarted(String? dateStr, String? timeStr) {
    if (dateStr == null || timeStr == null || dateStr.isEmpty || timeStr.isEmpty) return true;
    try {
      final now = DateTime.now();
      final dateParts = dateStr.trim().split('T')[0].split('-');
      if (dateParts.length < 3) return true;
      final year = int.parse(dateParts[0]);
      final month = int.parse(dateParts[1]);
      final day = int.parse(dateParts[2]);

      final timeParts = timeStr.trim().split(RegExp(r'\s+'));
      if (timeParts.length < 2) return true;
      final clockParts = timeParts[0].split(':');
      int hour = int.parse(clockParts[0]);
      final minute = int.parse(clockParts[1]);
      final isPm = timeParts[1].toUpperCase() == 'PM';
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour == 12) hour = 0;

      final scheduledDateTime = DateTime(year, month, day, hour, minute);
      return now.isAfter(scheduledDateTime) || now.isAtSameMomentAs(scheduledDateTime);
    } catch (e) {
      return true;
    }
  }

  Widget _buildStatusUpdatePopupMenu(Map<String, dynamic> app, String id, Color goldColor) {
    final appDate = app['appointmentDate']?.toString();
    final appTime = app['appointmentTime']?.toString();
    final hasStarted = _hasAppointmentStarted(appDate, appTime);

    return PopupMenuButton<String>(
      color: const Color(0xFF25201C),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: goldColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
        child: Row(
          children: [
            Text('Update Status', style: TextStyle(color: goldColor, fontSize: 12, fontWeight: FontWeight.bold)),
            Icon(Icons.arrow_drop_down, color: goldColor, size: 18),
          ],
        ),
      ),
      onSelected: (newStatus) async {
        if (newStatus == 'Completed' && !_hasAppointmentStarted(appDate, appTime)) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFC8868F),
              content: Text('Cannot mark appointment as Completed before scheduled time ($appDate $appTime).'),
            ),
          );
          return;
        }
        Map<String, dynamic> body = {'status': newStatus};
        if (newStatus == 'Staff_Rejected') {
          body['rejectionReason'] = 'Specialist unavailable';
        }
        final success = await ApiService.updateEmployeeAppointmentStatus(id, body);
        if (success) _loadStaffData();
      },
      itemBuilder: (ctx) => [
        const PopupMenuItem(value: 'In Progress', child: Text('In Progress ✂️', style: TextStyle(color: Colors.purpleAccent))),
        if (hasStarted)
          const PopupMenuItem(value: 'Completed', child: Text('Complete ✅', style: TextStyle(color: Colors.greenAccent))),
        const PopupMenuItem(value: 'Staff_Rejected', child: Text('Reject & Reassign ❌', style: TextStyle(color: Colors.orangeAccent))),
        const PopupMenuItem(value: 'Cancelled', child: Text('Cancel Appointment 🚫', style: TextStyle(color: Colors.redAccent))),
      ],
    );
  }

  // --- TAB 2: TIMECARD & SHIFT CLOCKING ---
  Widget _buildTimecardTab(Color goldColor, Color cardBg) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF25201C), Color(0xFF191512)]),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: goldColor.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Shift Timecard Control', style: TextStyle(color: Colors.white60, fontSize: 13)),
                const SizedBox(height: 6),
                Text('Status: $_shiftStatus', style: TextStyle(color: goldColor, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.greenAccent),
                      onPressed: () async {
                        final res = await ApiService.clockInAttendance();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? (res['success'] == true ? 'Clocked in successfully!' : 'Clock-in failed')),
                              backgroundColor: res['success'] == true ? Colors.green : Colors.redAccent,
                            ),
                          );
                        }
                        if (res['success'] == true) _loadStaffData();
                      },
                      icon: const Icon(Icons.login, color: Colors.black),
                      label: const Text('Clock In', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                    ),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.amber)),
                      onPressed: () async {
                        final res = await ApiService.startBreakAttendance();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? (res['success'] == true ? 'Break started!' : 'Start break failed')),
                              backgroundColor: res['success'] == true ? Colors.amber[800] : Colors.redAccent,
                            ),
                          );
                        }
                        if (res['success'] == true) _loadStaffData();
                      },
                      icon: const Icon(Icons.coffee, color: Colors.amber),
                      label: const Text('Start Break', style: TextStyle(color: Colors.amber)),
                    ),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.greenAccent)),
                      onPressed: () async {
                        final res = await ApiService.endBreakAttendance();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? (res['success'] == true ? 'Break ended!' : 'End break failed')),
                              backgroundColor: res['success'] == true ? Colors.green : Colors.redAccent,
                            ),
                          );
                        }
                        if (res['success'] == true) _loadStaffData();
                      },
                      icon: const Icon(Icons.coffee, color: Colors.greenAccent),
                      label: const Text('End Break', style: TextStyle(color: Colors.greenAccent)),
                    ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                      onPressed: () async {
                        final res = await ApiService.clockOutAttendance();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? (res['success'] == true ? 'Clocked out successfully!' : 'Clock-out failed')),
                              backgroundColor: res['success'] == true ? Colors.green : Colors.redAccent,
                            ),
                          );
                        }
                        if (res['success'] == true) _loadStaffData();
                      },
                      icon: const Icon(Icons.logout, color: Colors.white),
                      label: const Text('Clock Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Attendance Log', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _attendance.isEmpty
              ? Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12)), child: const Text('No attendance logs found.', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _attendance.length,
                  itemBuilder: (ctx, i) {
                    final att = _attendance[i];
                    final date = att['date'] ?? 'Today';
                    final clockIn = att['clockIn'] ?? '--';
                    final clockOut = att['clockOut'] ?? '--';
                    final state = (att['attendanceState'] ?? 'CLOCKED_IN').toString();

                    Color stateColor = Colors.greenAccent;
                    if (state == 'ON_BREAK') stateColor = Colors.amber;
                    if (state == 'CLOCKED_OUT') stateColor = Colors.blueAccent;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(10), border: Border.all(color: stateColor.withValues(alpha: 0.3))),
                      child: Row(
                        children: [
                          Icon(Icons.schedule, color: goldColor, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Date: $date', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                Text('In: $clockIn | Out: $clockOut', style: const TextStyle(color: Colors.white54, fontSize: 11)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: stateColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: stateColor)),
                            child: Text(state.replaceAll('_', ' '), style: TextStyle(color: stateColor, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  // --- TAB 3: LEAVE APPLICATIONS ---
  Widget _buildLeavesTab(Color goldColor, Color cardBg) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: cardBg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_leaves.length} Leave Applications', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                onPressed: _showLeaveModal,
                icon: const Icon(Icons.add, color: Colors.black, size: 18),
                label: const Text('Apply Leave', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _leaves.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.event_note_outlined, size: 48, color: Colors.white24),
                      const SizedBox(height: 12),
                      const Text('No Leave Requests Submitted', style: TextStyle(color: Colors.white54)),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                        onPressed: _showLeaveModal,
                        icon: const Icon(Icons.add, color: Colors.black),
                        label: const Text('Apply Leave', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _leaves.length,
                  itemBuilder: (ctx, i) {
                    final l = _leaves[i];
                    final start = l['startDate'] ?? '';
                    final end = l['endDate'] ?? '';
                    final reason = l['reason'] ?? 'Personal Leave';
                    final status = (l['status'] ?? 'Pending').toString();

                    Color statusColor = Colors.amber;
                    if (status == 'Approved') statusColor = Colors.greenAccent;
                    if (status == 'Rejected') statusColor = Colors.redAccent;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: statusColor.withValues(alpha: 0.3))),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Dates: $start to $end', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                const SizedBox(height: 2),
                                Text('Reason: $reason', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12), border: Border.all(color: statusColor)),
                            child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // --- TAB 4: PAYROLL & COMMISSIONS ---
  Widget _buildPayrollTab(Color goldColor, Color cardBg) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF25201C), Color(0xFF191512)]),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: goldColor.withValues(alpha: 0.3)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Staff Salary & Commission Earnings', style: TextStyle(color: Colors.white60, fontSize: 13)),
                SizedBox(height: 6),
                Text('₹28,500.00', style: TextStyle(color: Colors.greenAccent, fontSize: 28, fontWeight: FontWeight.bold)),
                SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Base Salary', style: TextStyle(color: Colors.white38, fontSize: 11)), Text('₹25,000.00', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))])),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Commissions (20%)', style: TextStyle(color: Colors.white38, fontSize: 11)), Text('₹3,500.00', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold))])),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Payslips History', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _payrolls.isEmpty
              ? Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12)), child: const Text('No payslips generated yet.', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _payrolls.length,
                  itemBuilder: (ctx, i) {
                    final p = _payrolls[i];
                    final month = p['month'] ?? 'Current Month';
                    final net = p['netPay'] != null ? '₹${p['netPay']}' : '₹28,500';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(10)),
                      child: Row(
                        children: [
                          Icon(Icons.receipt_long, color: goldColor, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Month: $month', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                Text('Payout: $net', style: const TextStyle(color: Colors.greenAccent, fontSize: 12)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  // --- TAB 5: BANK & UPI SETUP ---
  Widget _buildBankSetupTab(Color goldColor, Color cardBg) {
    final accNameCtrl = TextEditingController(text: _user?['name'] ?? '');
    final bankNameCtrl = TextEditingController();
    final accNumCtrl = TextEditingController();
    final ifscCtrl = TextEditingController();
    final upiCtrl = TextEditingController();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Commission Payout Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          const Text('Enter your bank account & UPI ID for direct salary and commission payouts.', style: TextStyle(color: Colors.white54, fontSize: 12)),
          const SizedBox(height: 16),
          TextField(
            controller: accNameCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Account Holder Name', prefixIcon: Icon(Icons.person_outline, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: bankNameCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Bank Name (e.g. HDFC, ICICI, SBI)', prefixIcon: Icon(Icons.account_balance, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: accNumCtrl,
            keyboardType: TextInputType.number,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(labelText: 'Account Number', prefixIcon: Icon(Icons.credit_card, color: Color(0xFFE0A96D))),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: ifscCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'IFSC Code', prefixIcon: Icon(Icons.qr_code, color: Color(0xFFE0A96D))),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: upiCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'UPI ID (e.g. name@upi)', prefixIcon: Icon(Icons.payment, color: Color(0xFFE0A96D))),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: goldColor),
              onPressed: () async {
                final success = await ApiService.updateEmployeeBankDetails({
                  'accountName': accNameCtrl.text.trim(),
                  'bankName': bankNameCtrl.text.trim(),
                  'accountNumber': accNumCtrl.text.trim(),
                  'ifscCode': ifscCtrl.text.trim(),
                  'upiId': upiCtrl.text.trim(),
                });
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: success ? const Color(0xFF1B4D3E) : Colors.red[900],
                      content: Text(success ? 'Bank & UPI Payout details saved successfully!' : 'Failed to update details.'),
                    ),
                  );
                }
              },
              child: const Text('Save Bank & UPI Details', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  // --- TAB 6: CLIENT DIRECTORY ---
  Widget _buildClientsTab(Color goldColor, Color cardBg) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: cardBg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_customers.length} Registered Clients', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                onPressed: _showAddCustomerModal,
                icon: const Icon(Icons.person_add_alt, color: Colors.black, size: 18),
                label: const Text('Add Client', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _customers.isEmpty
              ? const Center(child: Text('No Client Profiles Found', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _customers.length,
                  itemBuilder: (ctx, i) {
                    final cust = _customers[i];
                    final name = cust['name'] ?? 'Client';
                    final phone = cust['phone'] ?? '';
                    final email = cust['email'] ?? '';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
                      child: ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: goldColor.withValues(alpha: 0.2),
                          child: Text(name[0], style: TextStyle(color: goldColor, fontWeight: FontWeight.bold)),
                        ),
                        title: Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        subtitle: Text('$phone   $email', style: const TextStyle(color: Colors.white54, fontSize: 11)),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
