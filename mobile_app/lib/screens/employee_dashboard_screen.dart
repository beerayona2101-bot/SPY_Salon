import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import '../theme/app_colors.dart';
import 'customer_dashboard_screen.dart';
import 'login_screen.dart';
import 'settings_screen.dart';
import '../utils/payslip_pdf_generator.dart';
import '../widgets/payslip_document_widget.dart';

class EmployeeDashboardScreen extends StatefulWidget {
  const EmployeeDashboardScreen({super.key});

  @override
  State<EmployeeDashboardScreen> createState() => _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState extends State<EmployeeDashboardScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late TabController _tabController;
  StreamSubscription<RealtimeEvent>? _realtimeSubscription;

  bool _isLoading = true;
  Map<String, dynamic>? _user;
  List<dynamic> _appointments = [];
  List<dynamic> _attendance = [];
  List<dynamic> _leaves = [];
  List<dynamic> _payrolls = [];

  String _shiftStatus = 'NOT_CLOCKED_IN'; // NOT_CLOCKED_IN, CLOCKED_IN, ON_BREAK, CLOCKED_OUT, ON_LEAVE

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 6, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
    _loadStaffData();

    RealtimeService().joinRoom('room:employee');

    _realtimeSubscription = RealtimeService().eventStream.listen((event) {
      if (!mounted) return;
      debugPrint('[EmployeeDashboardScreen] Realtime event received: ${event.name}');
      if (event.name.startsWith('appointment:') ||
          event.name.startsWith('attendance:') ||
          event.name.startsWith('leave:') ||
          event.name == 'app:fallback_sync') {
        _loadStaffData(quiet: true);
      }
    });
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
      debugPrint('[EmployeeDashboardScreen] App resumed. Refreshing staff data...');
      _loadStaffData(quiet: true);
    }
  }

  /// Load authenticated staff member data from Backend REST API
  Future<void> _loadStaffData({bool quiet = false}) async {
    if (!quiet) setState(() => _isLoading = true);

    final storedUser = await ApiService.getStoredUser();

    if (!mounted) return;
    final themeColors = AppColors.of(context);

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
    final isAdmin = role == 'admin' || role == 'manager';
    final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

    if (isAdmin) {
      await ApiService.clearSession();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: themeColors.error,
          content: const Text('Admin access is not available in the mobile app. Please log in via the Web Admin Portal.'),
        ),
      );
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (ctx) => LoginScreen(onLoginSuccess: () {})),
        (route) => false,
      );
      return;
    }

    if (!isStaff) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: themeColors.error,
          content: const Text('Access Denied: Staff privileges required.'),
        ),
      );
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (ctx) => const CustomerDashboardScreen()),
        (route) => false,
      );
      return;
    }

    // Fetch 4 staff modules from real backend API endpoints
    final results = await Future.wait([
      ApiService.getEmployeeAppointments(),
      ApiService.getEmployeeAttendance(),
      ApiService.getEmployeeLeaves(),
      ApiService.getEmployeePayrolls(),
    ]);

    if (!mounted) return;

    final currentUserCheck = await ApiService.getStoredUser();
    if (!mounted) return;
    if (currentUserCheck == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: themeColors.error,
          content: const Text('Session expired or invalid. Please log in again.'),
        ),
      );
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

    final List<dynamic> attList = (results[1] != null) ? List<dynamic>.from(results[1] as List) : _attendance;
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
      _user = currentUserCheck;
      if (results[0] != null) _appointments = results[0] as List<dynamic>;
      if (results[1] != null) _attendance = attList;
      if (results[2] != null) _leaves = results[2] as List<dynamic>;
      if (results[3] != null) _payrolls = results[3] as List<dynamic>;
      _shiftStatus = currentShift;
      _isLoading = false;
    });
  }

  // --- MODAL: APPLY LEAVE REQUEST ---
  void _showLeaveModal() {
    final reasonCtrl = TextEditingController();
    DateTime startDate = DateTime.now();
    DateTime endDate = DateTime.now().add(const Duration(days: 1));
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final buttonTextColor = themeColors.buttonTextPrimary;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: themeColors.cardSurface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Submit Leave Request 📝', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: primaryColor)),
                  IconButton(icon: Icon(Icons.close, color: themeColors.textMuted), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(side: BorderSide(color: themeColors.cardBorder)),
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: ctx,
                          initialDate: startDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 90)),
                        );
                        if (picked != null) {
                          setModalState(() {
                            startDate = picked;
                            if (endDate.isBefore(startDate)) endDate = startDate;
                          });
                        }
                      },
                      icon: Icon(Icons.calendar_today, color: primaryColor, size: 16),
                      label: Text('From: ${startDate.toString().split(' ')[0]}', style: TextStyle(color: themeColors.textPrimary, fontSize: 12)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(side: BorderSide(color: themeColors.cardBorder)),
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: ctx,
                          initialDate: endDate,
                          firstDate: startDate,
                          lastDate: DateTime.now().add(const Duration(days: 90)),
                        );
                        if (picked != null) {
                          setModalState(() => endDate = picked);
                        }
                      },
                      icon: Icon(Icons.event, color: primaryColor, size: 16),
                      label: Text('To: ${endDate.toString().split(' ')[0]}', style: TextStyle(color: themeColors.textPrimary, fontSize: 12)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reasonCtrl,
                maxLines: 3,
                style: TextStyle(color: themeColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Reason for leave application...',
                  hintStyle: TextStyle(color: themeColors.textMuted),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor),
                  onPressed: () async {
                    if (reasonCtrl.text.trim().isEmpty) return;
                    final res = await ApiService.submitLeaveRequest({
                      'startDate': startDate.toString().split(' ')[0],
                      'endDate': endDate.toString().split(' ')[0],
                      'reason': reasonCtrl.text.trim(),
                    });
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      _loadStaffData();
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(
                          backgroundColor: res['success'] == true ? themeColors.success : themeColors.error,
                          content: Text(res['message'] ?? 'Leave application submitted.'),
                        ),
                      );
                    }
                  },
                  child: Text('Submit Application', style: TextStyle(color: buttonTextColor, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- MODAL: SEAT WALK-IN CLIENT ---
  void _showWalkInModal() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final serviceCtrl = TextEditingController(text: 'Hair Cut & Styling');
    final dateCtrl = TextEditingController(text: DateTime.now().toString().split(' ')[0]);
    final timeCtrl = TextEditingController(text: '11:30 AM');
    final notesCtrl = TextEditingController(text: 'Direct Walk-In Client');
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
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Seat Walk-In Client ✂️', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: primaryColor)),
                    IconButton(icon: Icon(Icons.close, color: themeColors.textMuted), onPressed: () => Navigator.pop(modalCtx)),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  style: TextStyle(color: themeColors.textPrimary),
                  decoration: InputDecoration(labelText: 'Customer Name *', labelStyle: TextStyle(color: themeColors.textMuted), prefixIcon: Icon(Icons.person_outline, color: primaryColor)),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  style: TextStyle(color: themeColors.textPrimary),
                  decoration: InputDecoration(labelText: 'Mobile Phone *', labelStyle: TextStyle(color: themeColors.textMuted), prefixIcon: Icon(Icons.phone_outlined, color: primaryColor)),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: serviceCtrl,
                  style: TextStyle(color: themeColors.textPrimary),
                  decoration: InputDecoration(labelText: 'Service Name *', labelStyle: TextStyle(color: themeColors.textMuted), prefixIcon: Icon(Icons.content_cut, color: primaryColor)),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: modalCtx,
                            initialDate: DateTime.tryParse(dateCtrl.text) ?? DateTime.now(),
                            firstDate: DateTime.now().subtract(const Duration(days: 1)),
                            lastDate: DateTime.now().add(const Duration(days: 180)),
                          );
                          if (picked != null) {
                            setModalState(() {
                              dateCtrl.text = picked.toString().split(' ')[0];
                            });
                          }
                        },
                        child: IgnorePointer(
                          child: TextField(
                            controller: dateCtrl,
                            style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: 'Appointment Date *',
                              labelStyle: TextStyle(color: themeColors.textMuted),
                              prefixIcon: Icon(Icons.calendar_today, color: primaryColor, size: 18),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: timeCtrl,
                        style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          labelText: 'Time Slot *',
                          labelStyle: TextStyle(color: themeColors.textMuted),
                          prefixIcon: Icon(Icons.access_time, color: primaryColor, size: 18),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: notesCtrl,
                  style: TextStyle(color: themeColors.textPrimary),
                  decoration: InputDecoration(labelText: 'Service Notes', labelStyle: TextStyle(color: themeColors.textMuted), prefixIcon: Icon(Icons.note_alt_outlined, color: primaryColor)),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor),
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty || serviceCtrl.text.trim().isEmpty) return;
                      final res = await ApiService.createEmployeeWalkIn({
                        'customerName': nameCtrl.text.trim(),
                        'customerPhone': phoneCtrl.text.trim(),
                        'service': serviceCtrl.text.trim(),
                        'appointmentDate': dateCtrl.text.trim(),
                        'appointmentTime': timeCtrl.text.trim(),
                        'notes': notesCtrl.text.trim(),
                      });
                      if (modalCtx.mounted) {
                        Navigator.pop(modalCtx);
                        if (res['success'] == true) {
                          _loadStaffData();
                        }
                      }
                    },
                    child: Text('Seat & Start Service', style: TextStyle(color: buttonTextColor, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStaffDrawer(AppColors themeColors, Color shiftColor, String shiftText) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final activeQueueCount = _appointments.where((a) => a['status'] != 'Completed' && a['status'] != 'Cancelled').length;

    // TARGET 6 STAFF DASHBOARD NAVIGATION ITEMS
    final navItems = [
      {'title': "Today's Service Queue", 'icon': Icons.content_cut, 'badge': activeQueueCount > 0 ? '$activeQueueCount' : ''},
      {'title': 'Check-In & Attendance', 'icon': Icons.access_time_filled_rounded, 'badge': ''},
      {'title': 'My Salary Slips & Payouts', 'icon': Icons.payments_outlined, 'badge': ''},
      {'title': 'Leave Requests', 'icon': Icons.event_note_rounded, 'badge': ''},
      {'title': 'My Shift & Breaktime', 'icon': Icons.free_breakfast_rounded, 'badge': ''},
      {'title': 'Commission & Performance', 'icon': Icons.trending_up_rounded, 'badge': ''},
    ];

    final staffName = _user?['name'] ?? 'Staff Member';
    final staffRole = _user?['role'] ?? 'Specialist';

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
                    staffName.isNotEmpty ? staffName[0].toUpperCase() : 'S',
                    style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        staffName,
                        style: TextStyle(color: themeColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
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
                              style: TextStyle(color: themeColors.textMuted, fontSize: 10),
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'STAFF NAVIGATION',
                style: TextStyle(color: themeColors.textMuted, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
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
                        fontSize: 13,
                      ),
                    ),
                    trailing: badge.isNotEmpty && badge != '0'
                        ? Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: isSelected ? primaryColor : themeColors.inputBackground,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              badge,
                              style: TextStyle(
                                color: isSelected ? themeColors.buttonTextPrimary : themeColors.textSecondary,
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
          Divider(color: themeColors.divider, height: 1),
          Padding(
            padding: const EdgeInsets.all(12),
            child: ListTile(
              dense: true,
              leading: Icon(Icons.logout, color: themeColors.error, size: 20),
              title: Text('Sign Out', style: TextStyle(color: themeColors.error, fontSize: 13, fontWeight: FontWeight.bold)),
              onTap: () async {
                final navigator = Navigator.of(context);
                navigator.pop();
                if (!mounted) return;
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (dialogCtx) => AlertDialog(
                    backgroundColor: themeColors.cardSurface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: primaryColor, width: 0.8),
                    ),
                    title: Row(
                      children: [
                        Icon(Icons.logout, color: themeColors.error, size: 22),
                        const SizedBox(width: 10),
                        Text('Sign Out', style: TextStyle(color: themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    content: Text('Are you sure you want to sign out from Staff Portal?', style: TextStyle(color: themeColors.textSecondary, fontSize: 14)),
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
                        onLoginSuccess: () async {
                          final user = await ApiService.getStoredUser();
                          final role = (user?['role'] ?? 'customer').toString().toLowerCase();
                          final isAdmin = role == 'admin' || role == 'manager';
                          final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

                          if (!ctx.mounted) return;

                          if (isAdmin) {
                            await ApiService.clearSession();
                            if (!ctx.mounted) return;
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(
                                backgroundColor: themeColors.error,
                                content: const Text('Admin access is not available in the mobile app. Please use the Web Admin Portal.'),
                              ),
                            );
                            return;
                          }

                          if (isStaff) {
                            Navigator.pushAndRemoveUntil(
                              ctx,
                              MaterialPageRoute(builder: (c) => const EmployeeDashboardScreen()),
                              (route) => false,
                            );
                          } else {
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

    Color shiftColor = themeColors.error;
    String shiftText = 'NOT CLOCKED IN 🔴';
    if (_shiftStatus == 'CLOCKED_IN') {
      shiftColor = themeColors.success;
      shiftText = 'CLOCKED IN 🟢';
    } else if (_shiftStatus == 'ON_BREAK') {
      shiftColor = themeColors.warning;
      shiftText = 'ON BREAK ☕';
    } else if (_shiftStatus == 'ON_LEAVE') {
      shiftColor = Colors.purple;
      shiftText = 'ON LEAVE 🟣';
    } else if (_shiftStatus == 'CLOCKED_OUT') {
      shiftColor = themeColors.textMuted;
      shiftText = 'CLOCKED OUT ⚪';
    }

    final sectionTitles = [
      "Today's Service Queue",
      'Check-In & Attendance',
      'My Salary Slips & Payouts',
      'Leave Requests',
      'My Shift & Breaktime',
      'Commission & Performance',
    ];

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: themeColors.deepestBackground,
        drawer: _buildStaffDrawer(themeColors, shiftColor, shiftText),
        appBar: AppBar(
          backgroundColor: cardBg,
          elevation: 0,
          leading: Builder(
            builder: (ctx) => IconButton(
              icon: Icon(Icons.menu, color: primaryColor, size: 24),
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
                      style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(_user?['name'] ?? 'Stylist Specialist', style: TextStyle(color: primaryColor, fontSize: 11)),
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
              icon: Icon(Icons.settings_outlined, color: primaryColor, size: 20),
              tooltip: 'App Settings & Theme',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (c) => const SettingsScreen()),
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
                  child: _buildStaffTabContent(_tabController.index, themeColors),
                ),
              ),
      ),
    );
  }

  Widget _buildStaffTabContent(int index, AppColors themeColors) {
    switch (index) {
      case 0:
        return _buildServiceQueueTab(themeColors);
      case 1:
        return _buildCheckInAttendanceTab(themeColors);
      case 2:
        return _buildSalarySlipsTab(themeColors);
      case 3:
        return _buildLeaveRequestsTab(themeColors);
      case 4:
        return _buildShiftBreaktimeTab(themeColors);
      case 5:
        return _buildCommissionPerformanceTab(themeColors);
      default:
        return _buildServiceQueueTab(themeColors);
    }
  }

  // --- MODULE 1: TODAY'S SERVICE QUEUE ---
  Widget _buildServiceQueueTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;
    final activeCount = _appointments.where((a) => a['status'] != 'Completed' && a['status'] != 'Cancelled').length;

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: _loadStaffData,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: cardBg,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text("Today's Service Queue", style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: primaryColor.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
                      child: Text('$activeCount Active', style: TextStyle(color: primaryColor, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                  onPressed: _showWalkInModal,
                  icon: Icon(Icons.add, color: buttonTextColor, size: 16),
                  label: Text('Walk-In Client', style: TextStyle(color: buttonTextColor, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          Expanded(
            child: _appointments.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 100),
                      Center(
                        child: Column(
                          children: [
                            Icon(Icons.content_cut, size: 48, color: themeColors.textMuted),
                            const SizedBox(height: 12),
                            Text('No Services Currently Assigned for Today\nPull down to refresh', textAlign: TextAlign.center, style: TextStyle(color: themeColors.textMuted, height: 1.5)),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(14),
                    itemCount: _appointments.length,
                    itemBuilder: (ctx, index) {
                      final appt = _appointments[index];
                      final id = appt['_id'] ?? appt['id'] ?? '';
                      final clientName = appt['customerName'] ?? appt['name'] ?? appt['clientName'] ?? 'Client';
                      final phone = appt['customerPhone'] ?? appt['phone'] ?? '';
                      final service = appt['service'] ?? appt['serviceName'] ?? 'Hair Styling';
                      final date = appt['appointmentDate'] ?? appt['date'] ?? appt['bookingDate'] ?? '';
                      final time = appt['appointmentTime'] ?? appt['time'] ?? appt['bookingTimeFormatted'] ?? '12:00 PM';
                      final status = (appt['status'] ?? 'pending').toString().toLowerCase();

                      Color statusColor = themeColors.warning;
                      Color statusBg = themeColors.warningSoft;
                      if (status == 'confirmed' || status == 'staff_accepted') {
                        statusColor = themeColors.success;
                        statusBg = themeColors.successSoft;
                      } else if (status == 'in progress') {
                        statusColor = themeColors.info;
                        statusBg = themeColors.infoSoft;
                      } else if (status == 'completed') {
                        statusColor = themeColors.success;
                        statusBg = themeColors.successSoft;
                      } else if (status == 'cancelled' || status == 'staff_rejected') {
                        statusColor = themeColors.error;
                        statusBg = themeColors.errorSoft;
                      }

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(service, style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15), overflow: TextOverflow.ellipsis),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(8), border: Border.all(color: statusColor)),
                                  child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Icon(Icons.person_outline, size: 14, color: primaryColor),
                                const SizedBox(width: 4),
                                Text(clientName, style: TextStyle(color: themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
                                const SizedBox(width: 10),
                                if (phone.isNotEmpty) ...[
                                  Icon(Icons.phone_outlined, size: 14, color: themeColors.textMuted),
                                  const SizedBox(width: 4),
                                  Text(phone, style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.access_time, size: 14, color: themeColors.textMuted),
                                const SizedBox(width: 4),
                                Text('$date at $time', style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
                              ],
                            ),
                            if (appt['notes'] != null && appt['notes'].toString().isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text('Notes: ${appt['notes']}', style: TextStyle(color: themeColors.textMuted, fontSize: 11, fontStyle: FontStyle.italic)),
                            ],
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                if (status == 'pending') ...[
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: themeColors.success, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                                    onPressed: () async {
                                      await ApiService.updateEmployeeAppointmentStatus(id, {'status': 'Staff_Accepted'});
                                      _loadStaffData();
                                    },
                                    child: const Text('Accept', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                  const SizedBox(width: 6),
                                  OutlinedButton(
                                    style: OutlinedButton.styleFrom(side: BorderSide(color: themeColors.error), padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                                    onPressed: () async {
                                      await ApiService.updateEmployeeAppointmentStatus(id, {'status': 'Staff_Rejected'});
                                      _loadStaffData();
                                    },
                                    child: Text('Decline', style: TextStyle(color: themeColors.error, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                                if (status == 'confirmed' || status == 'staff_accepted') ...[
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                                    onPressed: () async {
                                      await ApiService.updateEmployeeAppointmentStatus(id, {'status': 'In Progress'});
                                      _loadStaffData();
                                    },
                                    child: Text('Start Service ✂️', style: TextStyle(color: buttonTextColor, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                                if (status == 'in progress') ...[
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: themeColors.success, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                                    onPressed: () async {
                                      await ApiService.updateEmployeeAppointmentStatus(id, {'status': 'Completed', 'paymentStatus': 'Paid'});
                                      _loadStaffData();
                                    },
                                    child: const Text('Complete & Paid ✅', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  // --- MODULE 2: CHECK-IN & ATTENDANCE ---
  Widget _buildCheckInAttendanceTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    Color shiftColor = themeColors.error;
    String statusTitle = 'Not Checked In';
    if (_shiftStatus == 'CLOCKED_IN') {
      shiftColor = themeColors.success;
      statusTitle = 'Shift Clocked In & Active 🟢';
    } else if (_shiftStatus == 'ON_BREAK') {
      shiftColor = themeColors.warning;
      statusTitle = 'Currently On Duty Break ☕';
    } else if (_shiftStatus == 'ON_LEAVE') {
      shiftColor = Colors.purple;
      statusTitle = 'On Approved Leave Today 🟣';
    } else if (_shiftStatus == 'CLOCKED_OUT') {
      shiftColor = themeColors.textMuted;
      statusTitle = 'Shift Completed & Clocked Out ⚪';
    }

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: _loadStaffData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current Status Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: shiftColor.withValues(alpha: 0.5)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Today Shift Status', style: TextStyle(color: themeColors.textMuted, fontSize: 12)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: shiftColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: shiftColor)),
                        child: Text(_shiftStatus.replaceAll('_', ' '), style: TextStyle(color: shiftColor, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(statusTitle, style: TextStyle(color: themeColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  if (_shiftStatus == 'NOT_CLOCKED_IN') ...[
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: themeColors.success, foregroundColor: Colors.white),
                        onPressed: () async {
                          final res = await ApiService.clockInAttendance();
                          _loadStaffData();
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: res['success'] == true ? themeColors.success : themeColors.error, content: Text(res['message'] ?? 'Clocked in')));
                          }
                        },
                        icon: const Icon(Icons.login, size: 18),
                        label: const Text('Clock In Now', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ] else if (_shiftStatus == 'CLOCKED_IN') ...[
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: themeColors.warning, foregroundColor: Colors.black),
                            onPressed: () async {
                              final res = await ApiService.startBreakAttendance();
                              _loadStaffData();
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: themeColors.warning, content: Text(res['message'] ?? 'Break started')));
                              }
                            },
                            icon: const Icon(Icons.free_breakfast, size: 18),
                            label: const Text('Start Break', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: themeColors.error, foregroundColor: Colors.white),
                            onPressed: () async {
                              final res = await ApiService.clockOutAttendance();
                              _loadStaffData();
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: themeColors.error, content: Text(res['message'] ?? 'Clocked out')));
                              }
                            },
                            icon: const Icon(Icons.logout, size: 18),
                            label: const Text('Clock Out', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ] else if (_shiftStatus == 'ON_BREAK') ...[
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: themeColors.success, foregroundColor: Colors.white),
                        onPressed: () async {
                          final res = await ApiService.endBreakAttendance();
                          _loadStaffData();
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: themeColors.success, content: Text(res['message'] ?? 'Break ended')));
                          }
                        },
                        icon: const Icon(Icons.play_arrow, size: 18),
                        label: const Text('End Break & Resume Work', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ] else ...[
                    Text('Shift Completed for Today', style: TextStyle(color: themeColors.textMuted, fontSize: 13)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('Recent Attendance Logs', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 10),
            _attendance.isEmpty
                ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('No attendance history found.', style: TextStyle(color: themeColors.textMuted))))
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _attendance.length,
                    itemBuilder: (ctx, i) {
                      final log = _attendance[i];
                      final date = log['date'] ?? '';
                      final clockIn = log['clockIn'] ?? '—';
                      final clockOut = log['clockOut'] ?? '—';
                      final status = log['status'] ?? 'Present';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: themeColors.cardBorder)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(date, style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 2),
                                Text('In: $clockIn  •  Out: $clockOut', style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: themeColors.successSoft, borderRadius: BorderRadius.circular(8)),
                              child: Text(status.toUpperCase(), style: TextStyle(color: themeColors.success, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }

  // --- MODULE 3: MY SALARY SLIPS & PAYOUTS ---
  Widget _buildSalarySlipsTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    if (_payrolls.isEmpty) {
      return RefreshIndicator(
        color: primaryColor,
        backgroundColor: cardBg,
        onRefresh: _loadStaffData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const SizedBox(height: 80),
              Center(
                child: Column(
                  children: [
                    Icon(Icons.payments_outlined, size: 48, color: themeColors.textMuted),
                    const SizedBox(height: 12),
                    Text('No Salary Slips or Payout Records Available', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 6),
                    Text('Salary records generated by backend payroll will appear here.', textAlign: TextAlign.center, style: TextStyle(color: themeColors.textMuted, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    final latestPayroll = _payrolls.first;
    final latestMonth = latestPayroll['month'] ?? 'Current Period';
    final latestNet = latestPayroll['netPay'] != null ? '₹${latestPayroll['netPay']}' : '₹0';
    final baseSal = latestPayroll['baseSalary'] != null ? '₹${latestPayroll['baseSalary']}' : '—';
    final commAmt = latestPayroll['commissionAmount'] != null ? '₹${latestPayroll['commissionAmount']}' : '—';

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: _loadStaffData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Salary Overview Box
            Container(
              padding: const EdgeInsets.all(18),
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
                      Text('Staff Earnings & Payroll Summary', style: TextStyle(color: themeColors.textMuted, fontSize: 12)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: themeColors.successSoft, borderRadius: BorderRadius.circular(8)),
                        child: Text(latestMonth, style: TextStyle(color: themeColors.success, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(latestNet, style: TextStyle(color: themeColors.success, fontSize: 26, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Base Salary', style: TextStyle(color: themeColors.textMuted, fontSize: 11)), Text(baseSal, style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold))])),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Commissions', style: TextStyle(color: themeColors.textMuted, fontSize: 11)), Text(commAmt, style: TextStyle(color: themeColors.success, fontWeight: FontWeight.bold))])),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Payslips History', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                Text('${_payrolls.length} Slips Available', style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
              ],
            ),
            const SizedBox(height: 10),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _payrolls.length,
              itemBuilder: (ctx, i) {
                final p = _payrolls[i];
                final month = p['month'] ?? 'Current Month';
                final net = p['netPay'] != null ? '₹${p['netPay']}' : '₹0';

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: themeColors.cardBorder),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: primaryColor.withValues(alpha: 0.15), shape: BoxShape.circle),
                      child: Icon(Icons.receipt_long, color: primaryColor, size: 20),
                    ),
                    title: Text(month, style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text('Net Disbursed: $net', style: TextStyle(color: themeColors.success, fontWeight: FontWeight.w600, fontSize: 12)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: Icon(Icons.download_rounded, color: primaryColor, size: 20),
                          tooltip: 'Download PDF',
                          onPressed: () => _downloadPayslip(themeColors, Map<String, dynamic>.from(p as Map)),
                        ),
                        Icon(Icons.chevron_right, color: themeColors.textMuted, size: 20),
                      ],
                    ),
                    onTap: () => _showSalarySlipModal(themeColors, Map<String, dynamic>.from(p as Map)),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // --- MODULE 4: LEAVE REQUESTS ---
  Widget _buildLeaveRequestsTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: _loadStaffData,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: cardBg,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Leave Applications', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                  onPressed: _showLeaveModal,
                  icon: Icon(Icons.add, color: buttonTextColor, size: 16),
                  label: Text('Apply Leave', style: TextStyle(color: buttonTextColor, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          Expanded(
            child: _leaves.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 100),
                      Center(
                        child: Column(
                          children: [
                            Icon(Icons.event_note_outlined, size: 48, color: themeColors.textMuted),
                            const SizedBox(height: 12),
                            Text('No Leave Requests Submitted Yet', style: TextStyle(color: themeColors.textMuted)),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor),
                              onPressed: _showLeaveModal,
                              icon: Icon(Icons.add, color: buttonTextColor),
                              label: Text('Apply Leave', style: TextStyle(color: buttonTextColor, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(14),
                    itemCount: _leaves.length,
                    itemBuilder: (ctx, i) {
                      final l = _leaves[i];
                      final start = l['startDate'] ?? '';
                      final end = l['endDate'] ?? '';
                      final reason = l['reason'] ?? 'Personal Leave';
                      final status = (l['status'] ?? 'Pending').toString();

                      Color statusColor = themeColors.warning;
                      Color statusBg = themeColors.warningSoft;
                      if (status == 'Approved') {
                        statusColor = themeColors.success;
                        statusBg = themeColors.successSoft;
                      } else if (status == 'Rejected') {
                        statusColor = themeColors.error;
                        statusBg = themeColors.errorSoft;
                      }

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
                                  Text('$start to $end', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                                  const SizedBox(height: 2),
                                  Text('Reason: $reason', style: TextStyle(color: themeColors.textMuted, fontSize: 11)),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(8), border: Border.all(color: statusColor)),
                              child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  // --- MODULE 5: MY SHIFT & BREAKTIME ---
  Widget _buildShiftBreaktimeTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    final shiftStart = _user?['shiftStart'] ?? _user?['shift_start'] ?? _user?['workingHours']?['start'];
    final shiftEnd = _user?['shiftEnd'] ?? _user?['shift_end'] ?? _user?['workingHours']?['end'];
    final shiftName = _user?['shift'] ?? _user?['shiftName'] ?? _user?['assignedShift'];

    final breakStart = _user?['breakStart'] ?? _user?['break_start'] ?? _user?['breakTime']?['start'];
    final breakEnd = _user?['breakEnd'] ?? _user?['break_end'] ?? _user?['breakTime']?['end'];

    final hasShift = (shiftStart != null && shiftEnd != null) || shiftName != null;
    final hasBreak = (breakStart != null && breakEnd != null);

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: _loadStaffData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Assigned Shift & Duty Schedule', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: hasShift ? primaryColor.withValues(alpha: 0.3) : themeColors.cardBorder),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: hasShift ? primaryColor.withValues(alpha: 0.15) : themeColors.inputBackground, shape: BoxShape.circle),
                    child: Icon(Icons.access_time_filled, color: hasShift ? primaryColor : themeColors.textMuted, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Working Shift Hours', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 2),
                        Text(
                          hasShift ? (shiftName ?? '$shiftStart – $shiftEnd') : 'No shift assigned',
                          style: TextStyle(color: hasShift ? primaryColor : themeColors.textMuted, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          hasShift ? 'Assigned Duty Schedule' : 'Working shift hours will appear once configured by management.',
                          style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: hasBreak ? Colors.purple.withValues(alpha: 0.3) : themeColors.cardBorder),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: hasBreak ? Colors.purple.withValues(alpha: 0.15) : themeColors.inputBackground, shape: BoxShape.circle),
                    child: Icon(Icons.free_breakfast, color: hasBreak ? Colors.purpleAccent : themeColors.textMuted, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Breaktime Schedule', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 2),
                        Text(
                          hasBreak ? '$breakStart – $breakEnd' : 'No break schedule available',
                          style: TextStyle(color: hasBreak ? Colors.purpleAccent : themeColors.textMuted, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          hasBreak ? 'Duty Break Window' : 'Duty break windows will be displayed when assigned.',
                          style: TextStyle(color: themeColors.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- MODULE 6: COMMISSION & PERFORMANCE ---
  Widget _buildCommissionPerformanceTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final completedCount = _appointments.where((a) => a['status'] == 'Completed').length;

    double totalCommission = 0.0;
    for (final p in _payrolls) {
      if (p['commissionAmount'] != null) {
        totalCommission += (p['commissionAmount'] as num).toDouble();
      } else if (p['incentives'] != null) {
        totalCommission += (p['incentives'] as num).toDouble();
      }
    }
    final commissionDisplay = totalCommission > 0 ? '₹${totalCommission.toStringAsFixed(0)}' : (_payrolls.isNotEmpty ? '₹0' : 'No Data');

    final rawRating = _user?['rating'] ?? _user?['clientRating'] ?? _user?['avgRating'];
    final ratingDisplay = rawRating != null ? '$rawRating ⭐' : 'No Data';

    final rawEfficiency = _user?['efficiency'] ?? _user?['efficiencyRating'] ?? _user?['performanceScore'];
    final efficiencyDisplay = rawEfficiency != null ? '$rawEfficiency%' : 'No Data';

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: _loadStaffData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Stylist Performance Metrics', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.4,
              children: [
                _buildMetricCard(themeColors, 'Services Completed', '$completedCount', Icons.check_circle_outline, themeColors.success),
                _buildMetricCard(themeColors, 'Earned Commission', commissionDisplay, Icons.monetization_on_outlined, primaryColor),
                _buildMetricCard(themeColors, 'Client Rating', ratingDisplay, Icons.star_outline, Colors.amber),
                _buildMetricCard(themeColors, 'Efficiency Rating', efficiencyDisplay, Icons.speed_outlined, themeColors.info),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: themeColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Performance Summary & Analytics', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  Text('Performance metrics are calculated directly from your verified completed service appointments and backend payroll disbursal records.', style: TextStyle(color: themeColors.textMuted, fontSize: 12, height: 1.4)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(AppColors themeColors, String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: themeColors.cardSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: TextStyle(color: themeColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
              Icon(icon, color: color, size: 18),
            ],
          ),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(color: themeColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  /// Real PDF File Download & Local Storage for Staff Payslip
  Future<void> _downloadPayslip(AppColors themeColors, Map<String, dynamic> slip) async {
    final buttonTextColor = themeColors.buttonTextPrimary;
    final messenger = ScaffoldMessenger.of(context);

    // Initial downloading feedback
    messenger.showSnackBar(
      SnackBar(
        backgroundColor: themeColors.cardSurface,
        duration: const Duration(seconds: 2),
        content: Row(
          children: [
            SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: themeColors.primary)),
            const SizedBox(width: 12),
            Text('Generating payslip PDF...', style: TextStyle(color: themeColors.textPrimary, fontSize: 13)),
          ],
        ),
      ),
    );

    try {
      final File savedFile = await PayslipPdfGenerator.generateAndSavePdf(slip: slip, user: _user);

      if (!mounted) return;
      messenger.hideCurrentSnackBar();

      // Show confirmed success SnackBar with "OPEN PDF" action
      messenger.showSnackBar(
        SnackBar(
          backgroundColor: themeColors.success,
          duration: const Duration(seconds: 6),
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Icon(Icons.file_download_done_rounded, color: buttonTextColor, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('Payslip downloaded successfully', style: TextStyle(color: buttonTextColor, fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Text('Saved: ${savedFile.path}', style: TextStyle(color: buttonTextColor.withValues(alpha: 0.85), fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
          ),
          action: SnackBarAction(
            label: 'OPEN PDF',
            textColor: buttonTextColor,
            onPressed: () async {
              final opened = await PayslipPdfGenerator.openPdfFile(savedFile.path);
              if (!opened && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: themeColors.warning,
                    content: const Text('Payslip downloaded, but it could not be opened automatically.'),
                  ),
                );
              }
            },
          ),
        ),
      );
    } catch (e, stackTrace) {
      debugPrint('[EmployeeDashboardScreen] Download payslip PDF error: $e\n$stackTrace');
      if (!mounted) return;
      messenger.hideCurrentSnackBar();

      final String userErrorMsg;
      if (e.toString().contains('PDF_GENERATION_FAILED')) {
        userErrorMsg = 'Unable to generate payslip PDF.';
      } else if (e.toString().contains('PDF_STORAGE_FAILED')) {
        userErrorMsg = 'Unable to save the payslip. Please try again.';
      } else {
        userErrorMsg = 'Unable to save the payslip. Please try again.';
      }

      messenger.showSnackBar(
        SnackBar(
          backgroundColor: themeColors.error,
          content: Text(userErrorMsg),
        ),
      );
    }
  }

  /// Modal to View Premium Payslip Document
  void _showSalarySlipModal(AppColors themeColors, Map<String, dynamic> slip) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 880, maxHeight: 820),
          decoration: BoxDecoration(
            color: themeColors.cardSurface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: themeColors.cardBorder),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: themeColors.inputBackground,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
                  border: Border(bottom: BorderSide(color: themeColors.cardBorder)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.receipt_long, color: themeColors.primary, size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'OFFICIAL SALARY STATEMENT',
                          style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.0),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: themeColors.primary,
                            foregroundColor: themeColors.buttonTextPrimary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          ),
                          onPressed: () {
                            Navigator.pop(ctx);
                            _downloadPayslip(themeColors, slip);
                          },
                          icon: Icon(Icons.download_rounded, size: 16, color: themeColors.buttonTextPrimary),
                          label: Text('Download', style: TextStyle(color: themeColors.buttonTextPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: Icon(Icons.close, color: themeColors.textMuted, size: 22),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(12),
                  child: PayslipDocumentWidget(
                    slip: slip,
                    user: _user,
                    onDownload: () => _downloadPayslip(themeColors, slip),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
