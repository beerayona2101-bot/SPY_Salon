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
import '../widgets/spy_salon_bottom_navigation.dart';

class EmployeeDashboardScreen extends StatefulWidget {
  const EmployeeDashboardScreen({super.key});

  @override
  State<EmployeeDashboardScreen> createState() => _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState extends State<EmployeeDashboardScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late TabController _tabController;
  StreamSubscription<RealtimeEvent>? _realtimeSubscription;
  Timer? _debounceTimer;

  bool _isLoading = true;
  Map<String, dynamic>? _user;
  List<dynamic> _appointments = [];
  List<dynamic> _attendance = [];
  List<dynamic> _leaves = [];
  List<dynamic> _payrolls = [];

  String _shiftStatus = 'NOT_CLOCKED_IN'; // NOT_CLOCKED_IN, CLOCKED_IN, ON_BREAK, CLOCKED_OUT, ON_LEAVE
  bool _isAttendanceProcessing = false;
  String _queueDateFilter = 'All'; // 'All', 'Today', 'Upcoming', 'Previous'

  static const List<String> _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  static const List<String> _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  String _normalizeDateString(dynamic rawDate) {
    if (rawDate == null) return '';
    final s = rawDate.toString().trim();
    if (s.isEmpty) return '';
    if (s.contains('T')) {
      final iso = s.split('T')[0];
      if (iso.contains('-')) return iso;
    }
    if (s.contains(' ')) {
      final p = s.split(' ')[0];
      if (p.contains('-')) return p;
    }
    if (s.contains('/')) {
      final parts = s.split('/');
      if (parts.length == 3) {
        if (parts[0].length == 4) {
          return '${parts[0]}-${parts[1].padLeft(2, '0')}-${parts[2].padLeft(2, '0')}';
        } else if (parts[2].length == 4) {
          return '${parts[2]}-${parts[1].padLeft(2, '0')}-${parts[0].padLeft(2, '0')}';
        }
      }
    }
    if (s.contains('-')) {
      final parts = s.split('-');
      if (parts.length == 3 && parts[0].length == 4) {
        return '${parts[0]}-${parts[1].padLeft(2, '0')}-${parts[2].padLeft(2, '0')}';
      }
    }
    return s;
  }

  int _parseTimeToMinutes(String timeStr) {
    if (timeStr.isEmpty) return 720;
    try {
      final cleaned = timeStr.trim().toUpperCase();
      final isPM = cleaned.contains('PM');
      final isAM = cleaned.contains('AM');
      final numPart = cleaned.replaceAll(RegExp(r'[^0-9:]'), '');
      final parts = numPart.split(':');
      int h = int.parse(parts[0]);
      int m = parts.length > 1 ? int.parse(parts[1]) : 0;
      if (isPM && h < 12) h += 12;
      if (isAM && h == 12) h = 0;
      return h * 60 + m;
    } catch (_) {
      return 720;
    }
  }

  String _formatDateTitle(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(date.year, date.month, date.day);
    final diff = target.difference(today).inDays;
    final weekday = _weekdays[date.weekday - 1];
    final month = _months[date.month - 1];

    if (diff == 0) {
      return 'Today • $weekday, ${date.day} $month ${date.year}';
    } else if (diff == 1) {
      return 'Tomorrow • $weekday, ${date.day} $month ${date.year}';
    } else if (diff == -1) {
      return 'Yesterday • $weekday, ${date.day} $month ${date.year}';
    } else {
      return '$weekday, ${date.day} $month ${date.year}';
    }
  }

  Map<String, dynamic> _getDateCategory(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(date.year, date.month, date.day);
    final diff = target.difference(today).inDays;

    if (diff == 0) {
      return {'category': 'Today', 'label': 'TODAY', 'color': Colors.green};
    } else if (diff == 1) {
      return {'category': 'Upcoming', 'label': 'TOMORROW', 'color': Colors.teal};
    } else if (diff > 1) {
      return {'category': 'Upcoming', 'label': 'UPCOMING', 'color': Colors.blue};
    } else if (diff == -1) {
      return {'category': 'Previous', 'label': 'YESTERDAY', 'color': Colors.orange};
    } else {
      return {'category': 'Previous', 'label': 'PAST DATE', 'color': Colors.deepOrangeAccent};
    }
  }

  bool _isActiveQueueAppointment(dynamic raw) {
    if (raw is! Map) return false;
    final status = (raw['status'] ?? '').toString().trim().toLowerCase();
    return status != 'completed' &&
           status != 'cancelled' &&
           status != 'staff_rejected' &&
           status != 'no show' &&
           status != 'no_show' &&
           status != 'noshow';
  }

  Map<String, List<Map<String, dynamic>>> _getGroupedAppointments({bool activeOnly = true}) {
    final Map<String, List<Map<String, dynamic>>> groups = {};

    for (final raw in _appointments) {
      if (raw is! Map) continue;
      if (activeOnly && !_isActiveQueueAppointment(raw)) continue;
      final appt = Map<String, dynamic>.from(raw);
      final id = (appt['_id'] ?? appt['id'] ?? appt['bookingId'] ?? '').toString().trim();
      final service = (appt['service'] ?? appt['serviceName'] ?? '').toString().trim();
      final client = (appt['customerName'] ?? appt['name'] ?? appt['clientName'] ?? '').toString().trim();
      
      // If appointment is completely empty/corrupt, skip it
      if (id.isEmpty && service.isEmpty && client.isEmpty) continue;

      final rawDate = appt['appointmentDate'] ?? appt['date'] ?? appt['bookingDate'];
      String dateKey = _normalizeDateString(rawDate);
      if (dateKey.isEmpty) {
        final now = DateTime.now();
        dateKey = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
      }
      groups.putIfAbsent(dateKey, () => []).add(appt);
    }

    for (final key in groups.keys) {
      groups[key]!.sort((a, b) {
        final tA = _parseTimeToMinutes((a['appointmentTime'] ?? a['time'] ?? '').toString());
        final tB = _parseTimeToMinutes((b['appointmentTime'] ?? b['time'] ?? '').toString());
        return tA.compareTo(tB);
      });
    }

    return groups;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 5, initialIndex: 2, vsync: this);
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
        _debounceTimer?.cancel();
        _debounceTimer = Timer(const Duration(milliseconds: 350), () {
          if (mounted) _loadStaffData(quiet: true);
        });
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _debounceTimer?.cancel();
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
    // Only show full-screen spinner on cold start when there is no data yet
    if (!quiet && _appointments.isEmpty && _attendance.isEmpty) {
      setState(() => _isLoading = true);
    }

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

    // Fetch 5 staff modules from real backend API endpoints
    final results = await Future.wait([
      ApiService.getEmployeeAppointments(),
      ApiService.getEmployeeAttendance(),
      ApiService.getEmployeeLeaves(),
      ApiService.getEmployeePayrolls(),
      ApiService.getTodayAttendance(),
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
    final Map<String, dynamic>? todayRec = results[4] as Map<String, dynamic>?;

    String currentShift = 'NOT_CLOCKED_IN';
    if (todayRec != null) {
      if (todayRec['isOnApprovedLeave'] == true || todayRec['attendanceState'] == 'ON_LEAVE') {
        currentShift = 'ON_LEAVE';
      } else if (todayRec['attendanceState'] != null && todayRec['attendanceState'].toString().isNotEmpty) {
        currentShift = todayRec['attendanceState'].toString();
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
                      child: InkWell(
                        onTap: () async {
                          final picked = await showTimePicker(
                            context: modalCtx,
                            initialTime: const TimeOfDay(hour: 11, minute: 30),
                          );
                          if (picked != null) {
                            final hour = picked.hourOfPeriod == 0 ? 12 : picked.hourOfPeriod;
                            final period = picked.period == DayPeriod.am ? 'AM' : 'PM';
                            final formatted = '${hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')} $period';
                            setModalState(() {
                              timeCtrl.text = formatted;
                            });
                          }
                        },
                        child: IgnorePointer(
                          child: TextField(
                            controller: timeCtrl,
                            style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: 'Time Slot *',
                              labelStyle: TextStyle(color: themeColors.textMuted),
                              prefixIcon: Icon(Icons.access_time, color: primaryColor, size: 18),
                              suffixIcon: const Icon(Icons.arrow_drop_down, size: 20),
                            ),
                          ),
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
                      final apptDate = dateCtrl.text.trim();
                      final apptTime = timeCtrl.text.trim();
                      final res = await ApiService.createEmployeeWalkIn({
                        'customerName': nameCtrl.text.trim(),
                        'customerPhone': phoneCtrl.text.trim(),
                        'service': serviceCtrl.text.trim(),
                        'appointmentDate': apptDate,
                        'appointmentTime': apptTime,
                        'notes': notesCtrl.text.trim(),
                      });
                      if (modalCtx.mounted) {
                        Navigator.pop(modalCtx);
                        if (!mounted) return;
                        if (res['success'] == true) {
                          final Map<String, dynamic> newAppt = (res['data'] is Map)
                              ? Map<String, dynamic>.from(res['data'])
                              : <String, dynamic>{
                                  '_id': 'walkin_${DateTime.now().millisecondsSinceEpoch}',
                                  'customerName': nameCtrl.text.trim(),
                                  'customerPhone': phoneCtrl.text.trim(),
                                  'service': serviceCtrl.text.trim(),
                                  'appointmentDate': apptDate,
                                  'appointmentTime': apptTime,
                                  'notes': notesCtrl.text.trim(),
                                  'status': 'In Progress',
                                  'isWalkIn': true,
                                };
                          newAppt['appointmentDate'] = apptDate;
                          newAppt['appointmentTime'] = apptTime;
                          newAppt['status'] = newAppt['status'] ?? 'In Progress';
                          newAppt['isWalkIn'] = true;

                          setState(() {
                            _appointments.insert(0, newAppt);
                            // Auto-adjust date filter so newly added line is immediately visible under its date section
                            final targetDate = DateTime.tryParse(apptDate);
                            if (targetDate != null) {
                              final now = DateTime.now();
                              final today = DateTime(now.year, now.month, now.day);
                              final diff = DateTime(targetDate.year, targetDate.month, targetDate.day).difference(today).inDays;
                              if (_queueDateFilter == 'Today' && diff != 0) {
                                _queueDateFilter = 'All';
                              } else if (_queueDateFilter == 'Upcoming' && diff <= 0) {
                                _queueDateFilter = 'All';
                              } else if (_queueDateFilter == 'Previous' && diff >= 0) {
                                _queueDateFilter = 'All';
                              }
                            }
                          });

                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Walk-In client seated for $apptDate at $apptTime! ✂️'),
                              backgroundColor: themeColors.success,
                            ),
                          );
                          _loadStaffData(quiet: true);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? 'Failed to seat walk-in client'),
                              backgroundColor: themeColors.error,
                            ),
                          );
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

  Widget _buildStaffBottomNav(AppColors themeColors) {
    final activeQueueCount = _appointments.where((a) => _isActiveQueueAppointment(a)).length;

    final navItems = [
      const SpySalonNavItem(
        title: 'Attendance', 
        icon: Icons.access_time_filled_rounded,
      ),
      const SpySalonNavItem(
        title: 'Leaves', 
        icon: Icons.event_note_rounded,
      ),
      SpySalonNavItem(
        title: 'Queue', 
        icon: Icons.content_cut, 
        badge: activeQueueCount > 0 ? '$activeQueueCount' : '',
      ),
      const SpySalonNavItem(
        title: 'Commission', 
        icon: Icons.trending_up_rounded,
      ),
      const SpySalonNavItem(
        title: 'Salary Slips', 
        icon: Icons.payments_outlined,
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
      'Check-In & Attendance',
      'Leave Requests',
      "Today's Service Queue",
      'Commission & Performance',
      'My Salary Slips & Payouts',
    ];

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: themeColors.deepestBackground,
        appBar: AppBar(
          backgroundColor: cardBg,
          elevation: 0,
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
                sectionTitles[_tabController.index].toUpperCase(),
                style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                overflow: TextOverflow.ellipsis,
              ),
              Text(_user?['name'] ?? 'Stylist Specialist', style: TextStyle(color: primaryColor, fontSize: 11)),
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
        bottomNavigationBar: _buildStaffBottomNav(themeColors),
      ),
    );
  }

  Widget _buildStaffTabContent(int index, AppColors themeColors) {
    switch (index) {
      case 0:
        return _buildCheckInAttendanceTab(themeColors);
      case 1:
        return _buildLeaveRequestsTab(themeColors);
      case 2:
        return _buildServiceQueueTab(themeColors);
      case 3:
        return _buildCommissionPerformanceTab(themeColors);
      case 4:
        return _buildSalarySlipsTab(themeColors);
      default:
        return _buildServiceQueueTab(themeColors);
    }
  }

  // --- FILTER CHIPS FOR SERVICE QUEUE ---
  Widget _buildFilterChip(String filterKey, String label, AppColors themeColors) {
    final isSelected = _queueDateFilter == filterKey;
    final primaryColor = themeColors.primary;
    final buttonTextColor = themeColors.buttonTextPrimary;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () {
          setState(() {
            _queueDateFilter = filterKey;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: isSelected ? primaryColor : themeColors.cardSurface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? primaryColor : themeColors.cardBorder.withValues(alpha: 0.4),
              width: 1.2,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: primaryColor.withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    )
                  ]
                : [],
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? buttonTextColor : themeColors.textSecondary,
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  // --- SECTION HEADER FOR EACH DATE GROUP ---
  Widget _buildDateHeader(String dateKey, List<Map<String, dynamic>> appts, AppColors themeColors) {
    final parsed = DateTime.tryParse(dateKey) ?? DateTime.now();
    final dateTitle = _formatDateTitle(parsed);
    final categoryInfo = _getDateCategory(parsed);
    final Color badgeColor = categoryInfo['color'] as Color;
    final String badgeText = categoryInfo['label'] as String;

    return Container(
      margin: const EdgeInsets.only(top: 14, bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: themeColors.cardSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(color: badgeColor, width: 4),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    color: badgeColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                dateTitle,
                style: TextStyle(
                  color: themeColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: themeColors.deepestBackground,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '${appts.length} ${appts.length == 1 ? 'service' : 'services'}',
              style: TextStyle(
                color: themeColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- APPOINTMENT CARD (DATE & TIME ALIGNED) ---
  Widget _buildAppointmentCard(Map<String, dynamic> appt, AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;

    final id = (appt['_id'] ?? appt['id'] ?? appt['bookingId'] ?? '').toString().trim();
    String clientName = (appt['customerName'] ?? appt['name'] ?? appt['clientName'] ?? appt['user']?['name'] ?? '').toString().trim();
    if (clientName.isEmpty) clientName = 'Valued Client';

    final phone = (appt['customerPhone'] ?? appt['phone'] ?? appt['user']?['phone'] ?? '').toString().trim();
    
    String service = (appt['service'] ?? appt['serviceName'] ?? appt['treatment'] ?? '').toString().trim();
    if (service.isEmpty) service = 'Salon Service';

    final rawDate = appt['appointmentDate'] ?? appt['date'] ?? appt['bookingDate'] ?? '';
    String date = _normalizeDateString(rawDate);
    if (date.isEmpty) {
      final now = DateTime.now();
      date = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    }

    String time = (appt['appointmentTime'] ?? appt['time'] ?? appt['bookingTimeFormatted'] ?? '').toString().trim();
    if (time.isEmpty) time = '12:00 PM';
    final status = (appt['status'] ?? 'pending').toString().toLowerCase();
    final rescheduleData = appt['rescheduleData'] is Map ? (appt['rescheduleData'] as Map) : null;
    final requestedDate = (rescheduleData?['requestedDate'] ?? appt['rescheduleDate'] ?? '').toString().trim();
    final requestedTime = (rescheduleData?['requestedTime'] ?? appt['rescheduleTime'] ?? '').toString().trim();
    final rescheduleReason = (rescheduleData?['reason'] ?? appt['rescheduleReason'] ?? '').toString().trim();
    final isRescheduleRequested = status == 'reschedule requested' || status == 'reschedule_requested' || (appt['rescheduleRequested'] == true);
    final isWalkIn = (appt['isWalkIn'] == true) || (appt['notes'] != null && appt['notes'].toString().toLowerCase().contains('walk-in'));

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
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        service,
                        style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isWalkIn) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: primaryColor.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          'WALK-IN',
                          style: TextStyle(color: primaryColor, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: statusColor),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.person_outline, size: 14, color: primaryColor),
              const SizedBox(width: 4),
              Text(
                clientName,
                style: TextStyle(color: themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
              ),
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
              Icon(Icons.access_time, size: 14, color: primaryColor),
              const SizedBox(width: 4),
              Text(
                time,
                style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 8),
              Icon(Icons.calendar_today, size: 12, color: themeColors.textMuted),
              const SizedBox(width: 4),
              Text(
                date,
                style: TextStyle(color: themeColors.textMuted, fontSize: 11),
              ),
            ],
          ),
          if (isRescheduleRequested && (requestedDate.isNotEmpty || requestedTime.isNotEmpty)) ...[
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: themeColors.warning.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: themeColors.warning.withValues(alpha: 0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.edit_calendar, size: 14, color: themeColors.warning),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Requested Slot: $requestedDate at $requestedTime',
                          style: TextStyle(
                            color: themeColors.warning,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (rescheduleReason.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      'Reason: $rescheduleReason',
                      style: TextStyle(
                        color: themeColors.textMuted,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
          if (appt['notes'] != null && appt['notes'].toString().isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'Notes: ${appt['notes']}',
              style: TextStyle(color: themeColors.textMuted, fontSize: 11, fontStyle: FontStyle.italic),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (isRescheduleRequested) ...[
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: themeColors.warning,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    elevation: 2,
                  ),
                  icon: const Icon(Icons.check_circle_outline, size: 14),
                  label: const Text('Confirm Reschedule 🗓️', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  onPressed: () async {
                    DateTime initDate = DateTime.now();
                    if (requestedDate.isNotEmpty) {
                      try {
                        final parsed = DateTime.parse(requestedDate);
                        if (parsed.isAfter(DateTime.now().subtract(const Duration(days: 1)))) {
                          initDate = parsed;
                        }
                      } catch (_) {}
                    }
                    DateTime selectedDate = initDate;
                    TimeOfDay selectedTime = const TimeOfDay(hour: 11, minute: 30);
                    if (requestedTime.isNotEmpty) {
                      try {
                        final parts = requestedTime.split(' ');
                        final hm = parts[0].split(':');
                        int h = int.parse(hm[0]);
                        int m = int.parse(hm[1]);
                        if (parts.length > 1 && parts[1].toUpperCase() == 'PM' && h < 12) h += 12;
                        if (parts.length > 1 && parts[1].toUpperCase() == 'AM' && h == 12) h = 0;
                        selectedTime = TimeOfDay(hour: h, minute: m);
                      } catch (_) {}
                    }

                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => StatefulBuilder(
                        builder: (ctx, setDialogState) => AlertDialog(
                          backgroundColor: themeColors.cardSurface,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          title: Text('Confirm Reschedule', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold)),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Confirm slot for $clientName ($service):', style: TextStyle(color: themeColors.textSecondary, fontSize: 13)),
                              const SizedBox(height: 14),
                              ListTile(
                                tileColor: themeColors.inputBackground,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                leading: Icon(Icons.calendar_today, color: themeColors.primary, size: 18),
                                title: Text(
                                  'Date: ${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}',
                                  style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                                trailing: const Icon(Icons.arrow_drop_down, size: 20),
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: ctx,
                                    initialDate: selectedDate,
                                    firstDate: DateTime.now(),
                                    lastDate: DateTime.now().add(const Duration(days: 90)),
                                  );
                                  if (picked != null) {
                                    setDialogState(() => selectedDate = picked);
                                  }
                                },
                              ),
                              const SizedBox(height: 10),
                              ListTile(
                                tileColor: themeColors.inputBackground,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                leading: Icon(Icons.access_time, color: themeColors.primary, size: 18),
                                title: Text(
                                  'Time: ${selectedTime.format(ctx)}',
                                  style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                                trailing: const Icon(Icons.arrow_drop_down, size: 20),
                                onTap: () async {
                                  final picked = await showTimePicker(
                                    context: ctx,
                                    initialTime: selectedTime,
                                  );
                                  if (picked != null) {
                                    setDialogState(() => selectedTime = picked);
                                  }
                                },
                              ),
                            ],
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: Text('Cancel', style: TextStyle(color: themeColors.textMuted)),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: themeColors.warning, foregroundColor: Colors.black),
                              onPressed: () => Navigator.pop(ctx, true),
                              child: const Text('Approve Slot'),
                            ),
                          ],
                        ),
                      ),
                    );

                    if (confirm == true) {
                      final dateStr = '${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}';
                      final hour = selectedTime.hourOfPeriod == 0 ? 12 : selectedTime.hourOfPeriod;
                      final period = selectedTime.period == DayPeriod.am ? 'AM' : 'PM';
                      final timeStr = '${hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')} $period';

                      // In-place local update so UI updates with 0ms reload and moves to the correct date section
                      setState(() {
                        final idx = _appointments.indexWhere((a) => (a['_id'] ?? a['id'] ?? a['bookingId']).toString() == id);
                        if (idx != -1) {
                          final updated = Map<String, dynamic>.from(_appointments[idx]);
                          updated['status'] = 'Confirmed';
                          updated['appointmentDate'] = dateStr;
                          updated['appointmentTime'] = timeStr;
                          updated['rescheduleRequested'] = false;
                          updated['rescheduleData'] = null;
                          _appointments[idx] = updated;

                          // Ensure target date is visible if user had filtered
                          final now = DateTime.now();
                          final today = DateTime(now.year, now.month, now.day);
                          final diff = selectedDate.difference(today).inDays;
                          if (_queueDateFilter == 'Today' && diff != 0) {
                            _queueDateFilter = 'All';
                          } else if (_queueDateFilter == 'Previous' && diff >= 0) {
                            _queueDateFilter = 'All';
                          } else if (_queueDateFilter == 'Upcoming' && diff <= 0) {
                            _queueDateFilter = 'All';
                          }
                        }
                      });

                      final res = await ApiService.respondReschedule(id, 'Approve', newDate: dateStr, newTime: timeStr);
                      if (mounted) {
                        if (res['success'] == true) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Reschedule approved for $dateStr at $timeStr! ✅'),
                              backgroundColor: themeColors.success,
                            ),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? 'Failed to approve reschedule'),
                              backgroundColor: themeColors.error,
                            ),
                          );
                        }
                        _loadStaffData(quiet: true);
                      }
                    }
                  },
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: themeColors.error),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  ),
                  icon: Icon(Icons.close, size: 14, color: themeColors.error),
                  label: Text('Decline', style: TextStyle(color: themeColors.error, fontSize: 11, fontWeight: FontWeight.bold)),
                  onPressed: () async {
                    final reasonController = TextEditingController();
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: themeColors.cardSurface,
                        title: Text('Decline Reschedule', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold)),
                        content: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Keep appointment at original slot ($date at $time) and decline reschedule request?', style: TextStyle(color: themeColors.textSecondary, fontSize: 13)),
                            const SizedBox(height: 12),
                            TextField(
                              controller: reasonController,
                              style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: 'Reason for declining (optional)',
                                hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
                                filled: true,
                                fillColor: themeColors.deepestBackground,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ],
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, false),
                            child: Text('Cancel', style: TextStyle(color: themeColors.textMuted)),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: themeColors.error, foregroundColor: Colors.white),
                            onPressed: () => Navigator.pop(ctx, true),
                            child: const Text('Decline'),
                          ),
                        ],
                      ),
                    );

                    if (confirm == true) {
                      final res = await ApiService.respondReschedule(id, 'Reject', rejectionReason: reasonController.text.trim());
                      if (mounted) {
                        if (res['success'] == true) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Text('Reschedule request declined. Original slot retained.'),
                              backgroundColor: themeColors.warning,
                            ),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(res['message'] ?? 'Failed to decline reschedule'),
                              backgroundColor: themeColors.error,
                            ),
                          );
                        }
                        _loadStaffData(quiet: true);
                      }
                    }
                  },
                ),
              ],
              if (status == 'pending') ...[
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: themeColors.success, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                  onPressed: () async {
                    setState(() {
                      final idx = _appointments.indexWhere((a) => (a['_id'] ?? a['id'] ?? a['bookingId']).toString() == id);
                      if (idx != -1) {
                        final updated = Map<String, dynamic>.from(_appointments[idx]);
                        updated['status'] = 'Staff_Accepted';
                        _appointments[idx] = updated;
                      }
                    });
                    final res = await ApiService.updateEmployeeAppointmentStatus(id, {'status': 'Staff_Accepted'});
                    if (mounted) {
                      if (res['success'] == true) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: const Text('Appointment accepted! ✅'), backgroundColor: themeColors.success),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res['message'] ?? 'Failed to accept appointment'), backgroundColor: themeColors.error),
                        );
                      }
                    }
                    _loadStaffData(quiet: true);
                  },
                  child: const Text('Accept', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 6),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(side: BorderSide(color: themeColors.error), padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                  onPressed: () async {
                    setState(() {
                      final idx = _appointments.indexWhere((a) => (a['_id'] ?? a['id'] ?? a['bookingId']).toString() == id);
                      if (idx != -1) {
                        final updated = Map<String, dynamic>.from(_appointments[idx]);
                        updated['status'] = 'Staff_Rejected';
                        _appointments[idx] = updated;
                      }
                    });
                    final res = await ApiService.updateEmployeeAppointmentStatus(id, {'status': 'Staff_Rejected'});
                    if (mounted) {
                      if (res['success'] == true) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: const Text('Appointment declined & reassigned.'), backgroundColor: themeColors.warning),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res['message'] ?? 'Failed to decline appointment'), backgroundColor: themeColors.error),
                        );
                      }
                    }
                    _loadStaffData(quiet: true);
                  },
                  child: Text('Decline', style: TextStyle(color: themeColors.error, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
              if (status == 'confirmed' || status == 'staff_accepted') ...[
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: buttonTextColor, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                  onPressed: () async {
                    setState(() {
                      final idx = _appointments.indexWhere((a) => (a['_id'] ?? a['id'] ?? a['bookingId']).toString() == id);
                      if (idx != -1) {
                        final updated = Map<String, dynamic>.from(_appointments[idx]);
                        updated['status'] = 'In Progress';
                        _appointments[idx] = updated;
                      }
                    });
                    final res = await ApiService.updateEmployeeAppointmentStatus(id, {'status': 'In Progress'});
                    if (mounted) {
                      if (res['success'] == true) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: const Text('Service started! ✂️'), backgroundColor: themeColors.success),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res['message'] ?? 'Failed to start service'), backgroundColor: themeColors.error),
                        );
                      }
                    }
                    _loadStaffData(quiet: true);
                  },
                  child: Text('Start Service ✂️', style: TextStyle(color: buttonTextColor, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
              if (status == 'in progress') ...[
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: themeColors.success, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                  onPressed: () async {
                    setState(() {
                      final idx = _appointments.indexWhere((a) => (a['_id'] ?? a['id'] ?? a['bookingId']).toString() == id);
                      if (idx != -1) {
                        final updated = Map<String, dynamic>.from(_appointments[idx]);
                        updated['status'] = 'Completed';
                        updated['paymentStatus'] = 'Paid';
                        _appointments[idx] = updated;
                      }
                    });
                    final res = await ApiService.updateEmployeeAppointmentStatus(id, {'status': 'Completed', 'paymentStatus': 'Paid'});
                    if (mounted) {
                      if (res['success'] == true) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: const Text('Service marked Completed & Paid! ✅'), backgroundColor: themeColors.success),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res['message'] ?? 'Failed to complete service'), backgroundColor: themeColors.error),
                        );
                      }
                    }
                    _loadStaffData(quiet: true);
                  },
                  child: const Text('Complete & Paid ✅', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
              if (status == 'no show' || status == 'no_show' || status == 'noshow' || status == 'cancelled') ...[
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: themeColors.warning,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    elevation: 2,
                  ),
                  icon: const Icon(Icons.edit_calendar, size: 14),
                  label: const Text('Reschedule 🗓️', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  onPressed: () => _showEmployeeDirectRescheduleModal(appt, themeColors),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // --- MODULE 1: SERVICE BOARD & QUEUE (DATE-WISE ALIGNED) ---
  Widget _buildServiceQueueTab(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final buttonTextColor = themeColors.buttonTextPrimary;
    final activeCount = _appointments.where((a) => _isActiveQueueAppointment(a)).length;

    // Date grouping & filtering (active queue only)
    final grouped = _getGroupedAppointments(activeOnly: true);

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    // Calculate active queue counts for chips (exclude Completed, Cancelled, Rejected, No Show)
    int countToday = 0;
    int countUpcoming = 0;
    int countPrevious = 0;

    for (final raw in _appointments) {
      if (raw is! Map) continue;
      final status = raw['status']?.toString();
      if (status == 'Completed' || status == 'Cancelled' || status == 'Staff_Rejected' || status == 'No Show') {
        continue;
      }
      final rawDate = raw['appointmentDate'] ?? raw['date'] ?? raw['bookingDate'];
      final norm = _normalizeDateString(rawDate);
      final dt = DateTime.tryParse(norm) ?? today;
      final diff = DateTime(dt.year, dt.month, dt.day).difference(today).inDays;
      if (diff == 0) {
        countToday++;
      } else if (diff > 0) {
        countUpcoming++;
      } else {
        countPrevious++;
      }
    }

    // Sort date keys: Today (priority 0) -> Upcoming ascending (priority 1) -> Previous descending (priority 2)
    final sortedKeys = grouped.keys.toList()
      ..sort((keyA, keyB) {
        final dateA = DateTime.tryParse(keyA) ?? today;
        final dateB = DateTime.tryParse(keyB) ?? today;
        final targetA = DateTime(dateA.year, dateA.month, dateA.day);
        final targetB = DateTime(dateB.year, dateB.month, dateB.day);
        final diffA = targetA.difference(today).inDays;
        final diffB = targetB.difference(today).inDays;

        int priority(int diff) {
          if (diff == 0) return 0;
          if (diff > 0) return 1;
          return 2;
        }

        final pA = priority(diffA);
        final pB = priority(diffB);

        if (pA != pB) return pA.compareTo(pB);

        if (pA == 0) {
          return 0;
        } else if (pA == 1) {
          return targetA.compareTo(targetB); // Upcoming: earliest first
        } else {
          return targetB.compareTo(targetA); // Past: most recent first (yesterday before last week)
        }
      });

    // Filter date groups based on _queueDateFilter
    final List<MapEntry<String, List<Map<String, dynamic>>>> filteredGroups = [];
    for (final key in sortedKeys) {
      final date = DateTime.tryParse(key) ?? today;
      final target = DateTime(date.year, date.month, date.day);
      final diff = target.difference(today).inDays;

      if (_queueDateFilter == 'Today' && diff != 0) continue;
      if (_queueDateFilter == 'Upcoming' && diff <= 0) continue;
      if (_queueDateFilter == 'Previous' && diff >= 0) continue;

      filteredGroups.add(MapEntry(key, grouped[key]!));
    }

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: cardBg,
      onRefresh: _loadStaffData,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: cardBg,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Service Queue',
                          style: TextStyle(
                            color: themeColors.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: primaryColor.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '$activeCount Active',
                            style: TextStyle(
                              color: primaryColor,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: buttonTextColor,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: _showWalkInModal,
                      icon: Icon(Icons.person_add_alt_1, color: buttonTextColor, size: 16),
                      label: Text(
                        'Walk-In Client',
                        style: TextStyle(color: buttonTextColor, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', activeCount > 0 ? 'All Dates ($activeCount)' : 'All Dates', themeColors),
                      _buildFilterChip('Today', countToday > 0 ? 'Today ($countToday)' : 'Today', themeColors),
                      _buildFilterChip('Upcoming', countUpcoming > 0 ? 'Upcoming ($countUpcoming)' : 'Upcoming', themeColors),
                      _buildFilterChip('Previous', countPrevious > 0 ? 'Previous ($countPrevious)' : 'Previous', themeColors),
                    ],
                  ),
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
                            Text(
                              'No Services Currently Assigned\nPull down to refresh or seat a walk-in client',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: themeColors.textMuted, height: 1.5),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                : filteredGroups.isEmpty
                    ? ListView(
                        children: [
                          const SizedBox(height: 80),
                          Center(
                            child: Column(
                              children: [
                                Icon(Icons.event_busy, size: 44, color: themeColors.textMuted),
                                const SizedBox(height: 10),
                                Text(
                                  'No appointments under "$_queueDateFilter"',
                                  style: TextStyle(
                                    color: themeColors.textSecondary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                TextButton.icon(
                                  onPressed: () => setState(() => _queueDateFilter = 'All'),
                                  icon: Icon(Icons.calendar_today, size: 16, color: primaryColor),
                                  label: Text(
                                    'View All Active ($activeCount)',
                                    style: TextStyle(
                                      color: primaryColor,
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        children: [
                          for (final group in filteredGroups) ...[
                            _buildDateHeader(group.key, group.value, themeColors),
                            for (final appt in group.value)
                              _buildAppointmentCard(appt, themeColors),
                          ],
                          const SizedBox(height: 24),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  // --- MODAL: DIRECT RESCHEDULE BY STAFF ---
  void _showEmployeeDirectRescheduleModal(Map<String, dynamic> appt, AppColors themeColors) {
    final id = (appt['_id'] ?? appt['id'] ?? '').toString();
    final clientName = (appt['customerName'] ?? appt['name'] ?? 'Client').toString();
    final service = (appt['service'] ?? appt['serviceName'] ?? 'Service').toString();

    DateTime selectedDate = DateTime.now();
    TimeOfDay selectedTime = const TimeOfDay(hour: 11, minute: 30);
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: themeColors.cardSurface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Icon(Icons.edit_calendar, color: themeColors.warning, size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Reschedule Appointment', style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$service for $clientName', style: TextStyle(color: themeColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 14),
                ListTile(
                  tileColor: themeColors.inputBackground,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  leading: Icon(Icons.calendar_today, color: themeColors.primary, size: 18),
                  title: Text(
                    'Date: ${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}',
                    style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  trailing: const Icon(Icons.arrow_drop_down, size: 20),
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: ctx,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 90)),
                    );
                    if (picked != null) {
                      setDialogState(() => selectedDate = picked);
                    }
                  },
                ),
                const SizedBox(height: 10),
                ListTile(
                  tileColor: themeColors.inputBackground,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  leading: Icon(Icons.access_time, color: themeColors.primary, size: 18),
                  title: Text(
                    'Time: ${selectedTime.format(ctx)}',
                    style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  trailing: const Icon(Icons.arrow_drop_down, size: 20),
                  onTap: () async {
                    final picked = await showTimePicker(
                      context: ctx,
                      initialTime: selectedTime,
                    );
                    if (picked != null) {
                      setDialogState(() => selectedTime = picked);
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: reasonController,
                  style: TextStyle(color: themeColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Reason / note (e.g. Missed slot reschedule)',
                    hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
                    filled: true,
                    fillColor: themeColors.inputBackground,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Cancel', style: TextStyle(color: themeColors.textMuted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: themeColors.warning, foregroundColor: Colors.black),
              onPressed: () async {
                final dateStr = '${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}';
                final hour = selectedTime.hourOfPeriod == 0 ? 12 : selectedTime.hourOfPeriod;
                final period = selectedTime.period == DayPeriod.am ? 'AM' : 'PM';
                final timeStr = '${hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')} $period';
                Navigator.pop(ctx);

                final res = await ApiService.rescheduleEmployeeAppointment(
                  id,
                  dateStr,
                  timeStr,
                  reason: reasonController.text.trim(),
                );

                // In-place local update so UI reflects change instantly without page reload
                setState(() {
                  final idx = _appointments.indexWhere((a) => (a['_id'] ?? a['id'] ?? a['bookingId']).toString() == id);
                  if (idx != -1) {
                    final updated = Map<String, dynamic>.from(_appointments[idx]);
                    updated['status'] = 'Confirmed';
                    updated['appointmentDate'] = dateStr;
                    updated['appointmentTime'] = timeStr;
                    updated['rescheduleRequested'] = false;
                    updated['rescheduleData'] = null;
                    _appointments[idx] = updated;
                  }
                });

                if (mounted) {
                  if (res['success'] == true) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Appointment rescheduled to $dateStr at $timeStr! ✅'),
                        backgroundColor: themeColors.success,
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(res['message'] ?? 'Failed to reschedule appointment'),
                        backgroundColor: themeColors.error,
                      ),
                    );
                  }
                  _loadStaffData(quiet: true);
                }
              },
              child: const Text('Confirm Reschedule'),
            ),
          ],
        ),
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
                        onPressed: _isAttendanceProcessing ? null : () async {
                          setState(() => _isAttendanceProcessing = true);
                          try {
                            final res = await ApiService.clockInAttendance();
                            await _loadStaffData(quiet: true);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  backgroundColor: res['success'] == true ? themeColors.success : themeColors.error,
                                  content: Text(res['message'] ?? (res['success'] == true ? 'Clocked in successfully!' : 'Clock-in failed')),
                                ),
                              );
                            }
                          } finally {
                            if (mounted) setState(() => _isAttendanceProcessing = false);
                          }
                        },
                        icon: _isAttendanceProcessing
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.login, size: 18),
                        label: const Text('Clock In Now', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ] else if (_shiftStatus == 'CLOCKED_IN') ...[
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: themeColors.warning, foregroundColor: Colors.black),
                            onPressed: _isAttendanceProcessing ? null : () async {
                              setState(() => _isAttendanceProcessing = true);
                              try {
                                final res = await ApiService.startBreakAttendance();
                                await _loadStaffData(quiet: true);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: res['success'] == true ? themeColors.warning : themeColors.error,
                                      content: Text(res['message'] ?? (res['success'] == true ? 'Break started!' : 'Start break failed')),
                                    ),
                                  );
                                }
                              } finally {
                                if (mounted) setState(() => _isAttendanceProcessing = false);
                              }
                            },
                            icon: _isAttendanceProcessing
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                                : const Icon(Icons.free_breakfast, size: 18),
                            label: const Text('Start Break', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: themeColors.error, foregroundColor: Colors.white),
                            onPressed: _isAttendanceProcessing ? null : () async {
                              setState(() => _isAttendanceProcessing = true);
                              try {
                                final res = await ApiService.clockOutAttendance();
                                await _loadStaffData(quiet: true);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: res['success'] == true ? themeColors.error : themeColors.error,
                                      content: Text(res['message'] ?? (res['success'] == true ? 'Clocked out successfully!' : 'Clock-out failed')),
                                    ),
                                  );
                                }
                              } finally {
                                if (mounted) setState(() => _isAttendanceProcessing = false);
                              }
                            },
                            icon: _isAttendanceProcessing
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Icon(Icons.logout, size: 18),
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
                        onPressed: _isAttendanceProcessing ? null : () async {
                          setState(() => _isAttendanceProcessing = true);
                          try {
                            final res = await ApiService.endBreakAttendance();
                            await _loadStaffData(quiet: true);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  backgroundColor: res['success'] == true ? themeColors.success : themeColors.error,
                                  content: Text(res['message'] ?? (res['success'] == true ? 'Break ended! Resumed work.' : 'End break failed')),
                                ),
                              );
                            }
                          } finally {
                            if (mounted) setState(() => _isAttendanceProcessing = false);
                          }
                        },
                        icon: _isAttendanceProcessing
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.play_arrow, size: 18),
                        label: const Text('End Break & Resume Work', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ] else if (_shiftStatus == 'ON_LEAVE') ...[
                    Text('On Approved Leave Today 🟣', style: TextStyle(color: Colors.purple.shade300, fontSize: 13, fontWeight: FontWeight.bold)),
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
                      final status = (log['attendanceType'] == 'FULL_DAY' || log['status'] == 'Present')
                          ? 'FULL DAY'
                          : (log['attendanceType'] == 'HALF_DAY' || log['status'] == 'Half Day')
                              ? 'HALF DAY'
                              : (log['status'] ?? 'PRESENT').toString().toUpperCase();
                      final totalBreaks = (log['totalBreakDuration'] as num?)?.toInt() ?? 0;
                      final effectiveWork = (log['effectiveWorkingDuration'] as num?)?.toInt() ?? 0;
                      final breaksList = log['breaks'] is List ? (log['breaks'] as List) : [];

                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: themeColors.cardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(date, style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: (status == 'FULL DAY' || status == 'PRESENT') ? themeColors.successSoft : themeColors.warningSoft,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    status,
                                    style: TextStyle(
                                      color: (status == 'FULL DAY' || status == 'PRESENT') ? themeColors.success : themeColors.warning,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Icon(Icons.login, size: 13, color: themeColors.success),
                                const SizedBox(width: 4),
                                Text('In: $clockIn', style: TextStyle(color: themeColors.textPrimary, fontSize: 11, fontWeight: FontWeight.w600)),
                                const SizedBox(width: 14),
                                Icon(Icons.logout, size: 13, color: themeColors.error),
                                const SizedBox(width: 4),
                                Text('Out: $clockOut', style: TextStyle(color: themeColors.textPrimary, fontSize: 11, fontWeight: FontWeight.w600)),
                              ],
                            ),
                            if (breaksList.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: themeColors.cardSurfaceElevated,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    ...breaksList.asMap().entries.map((entry) {
                                      final bIdx = entry.key + 1;
                                      final b = entry.value;
                                      final bStart = b['start'] ?? '';
                                      final bEnd = b['end'] ?? 'In Progress';
                                      final bDur = b['duration'] != null ? ' (${b['duration']}m)' : '';
                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 2),
                                        child: Row(
                                          children: [
                                            Icon(Icons.free_breakfast, size: 11, color: themeColors.warning),
                                            const SizedBox(width: 4),
                                            Text(
                                              'Break $bIdx: $bStart → $bEnd$bDur',
                                              style: TextStyle(color: themeColors.textMuted, fontSize: 10, fontFamily: 'monospace'),
                                            ),
                                          ],
                                        ),
                                      );
                                    }),
                                    if (totalBreaks > 0)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          'Total Breaks: ${totalBreaks}m  •  Effective: ${effectiveWork}m (${(effectiveWork / 60).toStringAsFixed(1)}h)',
                                          style: TextStyle(color: themeColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
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
