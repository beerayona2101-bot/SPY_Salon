import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  bool _isLoading = true;
  List<dynamic> _appointments = [];
  Map<String, dynamic>? _user;
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    _loadHistoryData();
  }

  Future<void> _loadHistoryData({bool quiet = false}) async {
    if (!quiet) {
      setState(() => _isLoading = true);
    }

    try {
      final user = await ApiService.getStoredUser();
      final data = await ApiService.getCustomerAppointments(userParam: user);
      if (mounted) {
        setState(() {
          _user = user;
          _appointments = data ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<dynamic> get _filteredAppointments {
    if (_selectedFilter == 'All') return _appointments;
    return _appointments.where((a) {
      final status = (a['status'] ?? '').toString().toLowerCase();
      final filter = _selectedFilter.toLowerCase();
      if (filter == 'confirmed') {
        return status == 'confirmed' || status == 'pending' || status == 'staff_accepted';
      }
      return status == filter;
    }).toList();
  }

  Color _getStatusColor(String status, AppColors colors) {
    switch (status.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'confirmed':
      case 'staff_accepted':
        return colors.primary;
      case 'pending':
        return Colors.amber;
      case 'cancelled':
      case 'staff_rejected':
        return colors.error;
      default:
        return colors.textMuted;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Icons.check_circle_rounded;
      case 'confirmed':
      case 'staff_accepted':
        return Icons.event_available_rounded;
      case 'pending':
        return Icons.hourglass_top_rounded;
      case 'cancelled':
      case 'staff_rejected':
        return Icons.cancel_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }

  Future<void> _cancelAppointment(String appointmentId) async {
    final colors = AppColors.of(context);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: colors.cardSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: colors.primary, width: 0.8),
        ),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: colors.error, size: 22),
            const SizedBox(width: 8),
            Text(
              'Cancel Booking',
              style: TextStyle(color: colors.textPrimary, fontSize: 17, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Text(
          'Are you sure you want to cancel this appointment?',
          style: TextStyle(color: colors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx, false),
            child: Text('Keep Booking', style: TextStyle(color: colors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(dialogCtx, true),
            child: const Text('Cancel Appointment', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await ApiService.cancelCustomerAppointment(appointmentId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: success ? colors.primary : colors.error,
            content: Text(
              success ? 'Appointment cancelled successfully' : 'Failed to cancel appointment. Please try again.',
            ),
          ),
        );
        if (success) _loadHistoryData(quiet: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final primary = colors.primary;

    return Scaffold(
      backgroundColor: colors.mainBackground,
      appBar: AppBar(
        backgroundColor: colors.cardSurface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: primary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: primary.withValues(alpha: 0.3)),
              ),
              child: Icon(Icons.history_rounded, color: primary, size: 18),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Appointment History',
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  _user != null ? (_user!['name'] ?? 'My Bookings') : 'Guest Bookings',
                  style: TextStyle(color: colors.textMuted, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Filter Tabs Ribbon
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: colors.cardSurface,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: ['All', 'Confirmed', 'Completed', 'Cancelled'].map((filter) {
                  final isSelected = _selectedFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        filter,
                        style: TextStyle(
                          color: isSelected ? colors.buttonTextPrimary : colors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: primary,
                      backgroundColor: colors.mainBackground,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: BorderSide(
                          color: isSelected ? primary : colors.cardBorder,
                        ),
                      ),
                      onSelected: (val) => setState(() => _selectedFilter = filter),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          Divider(height: 1, color: colors.cardBorder),

          // Main Appointments List
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator(color: primary))
                : RefreshIndicator(
                    color: primary,
                    backgroundColor: colors.cardSurface,
                    onRefresh: () => _loadHistoryData(quiet: true),
                    child: _filteredAppointments.isEmpty
                        ? _buildEmptyState(colors)
                        : ListView.builder(
                            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredAppointments.length,
                            itemBuilder: (ctx, idx) {
                              final app = _filteredAppointments[idx];
                              return _buildAppointmentCard(app, colors);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(AppColors colors) {
    final primary = colors.primary;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(color: primary.withValues(alpha: 0.3)),
              ),
              child: Icon(Icons.event_note_rounded, color: primary, size: 34),
            ),
            const SizedBox(height: 16),
            Text(
              'No Appointment Records',
              style: TextStyle(
                color: colors.textPrimary,
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _selectedFilter == 'All'
                  ? 'You have not placed any salon bookings yet.\nBook your luxury treatment today!'
                  : 'No $_selectedFilter appointments found in your history.',
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.textMuted, fontSize: 13, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(Map<String, dynamic> app, AppColors colors) {
    final primary = colors.primary;
    final status = (app['status'] ?? 'Confirmed').toString();
    final statusColor = _getStatusColor(status, colors);
    final bookingId = (app['bookingId'] ?? app['_id'] ?? 'SPY-000').toString();
    final service = (app['service'] ?? 'Salon Service').toString();
    final specialist = (app['specialistName'] ?? 'Senior Specialist').toString();
    final branch = (app['branch'] ?? 'Jubilee Hills Studio').toString();
    final date = (app['appointmentDate'] ?? 'Today').toString();
    final time = (app['appointmentTime'] ?? 'Selected Slot').toString();
    final notes = (app['notes'] ?? '').toString();
    final price = app['price'] != null ? '₹${app['price']}' : (app['totalAmount'] != null ? '₹${app['totalAmount']}' : '');

    final isUpcoming = ['confirmed', 'pending', 'staff_accepted'].contains(status.toLowerCase());

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: colors.cardSurface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: Booking ID & Status Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: colors.inputBackground.withValues(alpha: 0.5),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
              border: Border(bottom: BorderSide(color: colors.cardBorder)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      'ID: ',
                      style: TextStyle(color: colors.textMuted, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      bookingId,
                      style: TextStyle(color: primary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_getStatusIcon(status), size: 12, color: statusColor),
                      const SizedBox(width: 5),
                      Text(
                        status.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Main Details Body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Service Title & Price
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        service,
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (price.isNotEmpty)
                      Text(
                        price,
                        style: TextStyle(
                          color: primary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                // Date & Time Detail Row
                Row(
                  children: [
                    Icon(Icons.calendar_today_rounded, color: primary, size: 14),
                    const SizedBox(width: 8),
                    Text(
                      '$date at $time',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 6),

                // Specialist Detail Row
                Row(
                  children: [
                    Icon(Icons.person_outline_rounded, color: colors.textMuted, size: 14),
                    const SizedBox(width: 8),
                    Text(
                      'Specialist: $specialist',
                      style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 6),

                // Branch Location Row
                Row(
                  children: [
                    Icon(Icons.location_on_outlined, color: colors.textMuted, size: 14),
                    const SizedBox(width: 8),
                    Text(
                      branch,
                      style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),

                if (notes.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: colors.mainBackground,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.notes_rounded, color: colors.textMuted, size: 13),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            notes,
                            style: TextStyle(color: colors.textMuted, fontSize: 11, fontStyle: FontStyle.italic),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Action Button for Upcoming Bookings (Cancel)
                if (isUpcoming) ...[
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: colors.error.withValues(alpha: 0.5)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        ),
                        onPressed: () => _cancelAppointment((app['_id'] ?? app['bookingId']).toString()),
                        icon: Icon(Icons.cancel_outlined, color: colors.error, size: 14),
                        label: Text(
                          'Cancel Booking',
                          style: TextStyle(color: colors.error, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
