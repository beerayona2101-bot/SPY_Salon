import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'customer_dashboard_screen.dart';
import 'employee_dashboard_screen.dart';
import 'login_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  bool _isLoading = true;
  Map<String, dynamic> _analytics = {};
  List<dynamic> _appointments = [];
  List<dynamic> _services = [];
  List<dynamic> _employees = [];
  List<dynamic> _customers = [];
  List<dynamic> _transactions = [];
  List<dynamic> _enquiries = [];
  List<dynamic> _leaves = [];
  List<dynamic> _attendanceReport = [];

  String _leaveFilter = 'All';
  String _leaveSearchQuery = '';
  String _attendanceSearchQuery = '';
  String _enquiryFilter = 'All';
  String _enquirySearchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 8, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
    _loadAllAdminData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAllAdminData() async {
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
                  MaterialPageRoute(builder: (ctx) => const AdminDashboardScreen()),
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

    if (!isAdmin) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFC8868F),
          content: Text('Access Denied: Admin privileges required.'),
        ),
      );
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (ctx) => const CustomerDashboardScreen()),
        (route) => false,
      );
      return;
    }

    final results = await Future.wait([
      ApiService.getAdminAnalytics(),
      ApiService.getAdminAppointments(),
      ApiService.getAdminServices(),
      ApiService.getAdminEmployees(),
      ApiService.getAdminCustomers(),
      ApiService.getAdminTransactions(),
      ApiService.getAdminEnquiries(),
      ApiService.getAdminLeaves(),
      ApiService.getAdminAttendanceReport(),
    ]);

    if (mounted) {
      setState(() {
        _analytics = results[0] as Map<String, dynamic>;
        _appointments = results[1] as List<dynamic>;
        _services = results[2] as List<dynamic>;
        _employees = results[3] as List<dynamic>;
        _customers = results[4] as List<dynamic>;
        _transactions = results[5] as List<dynamic>;
        _enquiries = results[6] as List<dynamic>;
        _leaves = results[7] as List<dynamic>;
        _attendanceReport = results[8] as List<dynamic>;
        _isLoading = false;
      });
    }
  }

  // --- MODAL: CREATE APPOINTMENT (MATCHING WEB APP) ---
  void _showAddAppointmentModal() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: DateTime.now().toString().split(' ')[0]);
    final timeCtrl = TextEditingController(text: '12:00 PM');
    
    String selectedService = _services.isNotEmpty ? (_services[0]['name'] ?? 'Hair Cut') : 'Hair Styling';
    String selectedSpecialist = _employees.isNotEmpty ? (_employees[0]['name'] ?? 'Staff Stylist') : 'Senior Stylist';
    String selectedStatus = 'confirmed';
    String selectedPaymentStatus = 'Pending';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Book Walk-In Appointment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
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
                  decoration: const InputDecoration(labelText: 'Phone Number *', prefixIcon: Icon(Icons.phone_outlined, color: Color(0xFFE0A96D))),
                ),
                const SizedBox(height: 12),
                const Text('Select Service *', style: TextStyle(color: Colors.white70, fontSize: 12)),
                StatefulBuilder(
                  builder: (ctx, setLocalState) {
                    final Set<String> uniqueServices = {};
                    for (final s in _services) {
                      final name = (s['name'] ?? s['title'] ?? '').toString().trim();
                      if (name.isNotEmpty) uniqueServices.add(name);
                    }
                    if (uniqueServices.isEmpty) uniqueServices.add('Hair Cut & Styling');
                    final serviceList = uniqueServices.toList();
                    if (!serviceList.contains(selectedService)) {
                      selectedService = serviceList.first;
                    }

                    return DropdownButtonFormField<String>(
                      initialValue: selectedService,
                      dropdownColor: const Color(0xFF25201C),
                      style: const TextStyle(color: Colors.white),
                      items: serviceList.map<DropdownMenuItem<String>>((title) {
                        return DropdownMenuItem(value: title, child: Text(title));
                      }).toList(),
                      onChanged: (val) { if (val != null) setModalState(() => selectedService = val); },
                    );
                  },
                ),
                const SizedBox(height: 12),
                const Text('Assigned Specialist / Stylist', style: TextStyle(color: Colors.white70, fontSize: 12)),
                StatefulBuilder(
                  builder: (ctx, setLocalState) {
                    final Set<String> uniqueEmp = {};
                    for (final e in _employees) {
                      final name = (e['name'] ?? '').toString().trim();
                      if (name.isNotEmpty) uniqueEmp.add(name);
                    }
                    if (uniqueEmp.isEmpty) uniqueEmp.add('Staff Stylist');
                    final empList = uniqueEmp.toList();
                    if (!empList.contains(selectedSpecialist)) {
                      selectedSpecialist = empList.first;
                    }

                    return DropdownButtonFormField<String>(
                      initialValue: selectedSpecialist,
                      dropdownColor: const Color(0xFF25201C),
                      style: const TextStyle(color: Colors.white),
                      items: empList.map<DropdownMenuItem<String>>((title) {
                        return DropdownMenuItem(value: title, child: Text(title));
                      }).toList(),
                      onChanged: (val) { if (val != null) setModalState(() => selectedSpecialist = val); },
                    );
                  },
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: dateCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Date (YYYY-MM-DD)', prefixIcon: Icon(Icons.calendar_today, color: Color(0xFFE0A96D))),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: timeCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Time Slot', prefixIcon: Icon(Icons.access_time, color: Color(0xFFE0A96D))),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Booking Status', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          DropdownButtonFormField<String>(
                            initialValue: selectedStatus,
                            dropdownColor: const Color(0xFF25201C),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            items: const [
                              DropdownMenuItem(value: 'confirmed', child: Text('Confirmed')),
                              DropdownMenuItem(value: 'pending', child: Text('Pending')),
                            ],
                            onChanged: (val) { if (val != null) setModalState(() => selectedStatus = val); },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Payment Status', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          DropdownButtonFormField<String>(
                            initialValue: selectedPaymentStatus,
                            dropdownColor: const Color(0xFF25201C),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            items: const [
                              DropdownMenuItem(value: 'Pending', child: Text('Pending')),
                              DropdownMenuItem(value: 'Paid', child: Text('Paid')),
                            ],
                            onChanged: (val) { if (val != null) setModalState(() => selectedPaymentStatus = val); },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE0A96D)),
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) return;
                      await ApiService.createAdminAppointment({
                        'customerName': nameCtrl.text.trim(),
                        'customerPhone': phoneCtrl.text.trim(),
                        'service': selectedService,
                        'specialistName': selectedSpecialist,
                        'appointmentDate': dateCtrl.text.trim(),
                        'appointmentTime': timeCtrl.text.trim(),
                        'status': selectedStatus,
                        'paymentStatus': selectedPaymentStatus,
                      });
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        _loadAllAdminData();
                      }
                    },
                    child: const Text('Confirm Booking', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- MODAL: CREATE SERVICE (MATCHING WEB APP) ---
  void _showAddServiceModal() {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final discountCtrl = TextEditingController();
    final categoryCtrl = TextEditingController(text: 'Hair');
    final durationCtrl = TextEditingController(text: '60');
    final descCtrl = TextEditingController();
    String selectedGender = 'all';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Add New Service', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
                    IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Service Name *', prefixIcon: Icon(Icons.content_cut, color: Color(0xFFE0A96D))),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: priceCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Price (₹) *', prefixIcon: Icon(Icons.currency_rupee, color: Color(0xFFE0A96D))),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: discountCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Discount Price (₹)', prefixIcon: Icon(Icons.local_offer_outlined, color: Color(0xFFE0A96D))),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: durationCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Duration (Mins) *', prefixIcon: Icon(Icons.timer_outlined, color: Color(0xFFE0A96D))),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Target Gender *', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          DropdownButtonFormField<String>(
                            initialValue: selectedGender,
                            dropdownColor: const Color(0xFF25201C),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            items: const [
                              DropdownMenuItem(value: 'all', child: Text('Unisex / All')),
                              DropdownMenuItem(value: 'women', child: Text('Women Only')),
                              DropdownMenuItem(value: 'men', child: Text('Men Only')),
                              DropdownMenuItem(value: 'kids', child: Text('Kids')),
                            ],
                            onChanged: (val) { if (val != null) setModalState(() => selectedGender = val); },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: categoryCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Category (Hair, Skin, Spa, Nails, Grooming)', prefixIcon: Icon(Icons.category_outlined, color: Color(0xFFE0A96D))),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Service Description & Details', prefixIcon: Icon(Icons.notes, color: Color(0xFFE0A96D))),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE0A96D)),
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty || priceCtrl.text.trim().isEmpty) return;
                      await ApiService.createService({
                        'name': nameCtrl.text.trim(),
                        'price': double.tryParse(priceCtrl.text.trim()) ?? 50.0,
                        'discountPrice': double.tryParse(discountCtrl.text.trim()),
                        'durationMinutes': int.tryParse(durationCtrl.text.trim()) ?? 60,
                        'category': categoryCtrl.text.trim(),
                        'gender': selectedGender,
                        'description': descCtrl.text.trim(),
                      });
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        _loadAllAdminData();
                      }
                    },
                    child: const Text('Save Service', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- MODAL: ONBOARD STAFF MEMBER (EXACT MATCH TO WEB APP FORM) ---
  void _showAddEmployeeModal() {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    final skillsCtrl = TextEditingController();
    final salaryCtrl = TextEditingController(text: '25000');
    final commissionCtrl = TextEditingController(text: '20');
    
    String selectedRole = 'Senior Hair Stylist';
    bool obscurePassword = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Onboard Staff Member', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
                    IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Employee Full Name *', hintText: 'e.g. Ananya Sharma', prefixIcon: Icon(Icons.badge_outlined, color: Color(0xFFE0A96D))),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Email Address *', hintText: 'ananya@spysalon.com', prefixIcon: Icon(Icons.email_outlined, color: Color(0xFFE0A96D))),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: phoneCtrl,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Phone Number *', hintText: '+91 98765 43210', prefixIcon: Icon(Icons.phone_outlined, color: Color(0xFFE0A96D))),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: passwordCtrl,
                  obscureText: obscurePassword,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Login Password *',
                    hintText: 'Set login password (e.g. Ananya@123)',
                    prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFFE0A96D)),
                    suffixIcon: IconButton(
                      icon: Icon(obscurePassword ? Icons.visibility_off : Icons.visibility, color: Colors.white38, size: 18),
                      onPressed: () => setModalState(() => obscurePassword = !obscurePassword),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Staff Role / Position *', style: TextStyle(color: Colors.white70, fontSize: 12)),
                DropdownButtonFormField<String>(
                  initialValue: selectedRole,
                  dropdownColor: const Color(0xFF25201C),
                  style: const TextStyle(color: Colors.white),
                  items: const [
                    DropdownMenuItem(value: 'Senior Hair Stylist', child: Text('Senior Hair Stylist')),
                    DropdownMenuItem(value: 'Hairdresser', child: Text('Hairdresser')),
                    DropdownMenuItem(value: 'Beautician & Skin Expert', child: Text('Beautician & Skin Expert')),
                    DropdownMenuItem(value: 'Therapist', child: Text('Spa Therapist')),
                    DropdownMenuItem(value: 'Receptionist', child: Text('Receptionist')),
                    DropdownMenuItem(value: 'Manager', child: Text('Branch Manager')),
                  ],
                  onChanged: (val) { if (val != null) setModalState(() => selectedRole = val); },
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: skillsCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Specialist Skills (Comma Separated) *',
                    hintText: 'e.g. Senior Hair Stylist, Keratin Expert, Hydra Facial',
                    prefixIcon: Icon(Icons.star_outline, color: Color(0xFFE0A96D)),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: salaryCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Base Fixed Salary (₹) *', hintText: '25000', prefixIcon: Icon(Icons.payments_outlined, color: Color(0xFFE0A96D))),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: commissionCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Commission Rate (%) *', hintText: '20', prefixIcon: Icon(Icons.percent, color: Color(0xFFE0A96D))),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC8868F),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty || emailCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) return;
                      final skillsList = skillsCtrl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
                      
                      await ApiService.createEmployee({
                        'name': nameCtrl.text.trim(),
                        'email': emailCtrl.text.trim(),
                        'phone': phoneCtrl.text.trim(),
                        'password': passwordCtrl.text.trim().isNotEmpty ? passwordCtrl.text.trim() : 'Pass@123',
                        'role': selectedRole,
                        'specialties': skillsList.isNotEmpty ? skillsList : [selectedRole],
                        'baseSalary': double.tryParse(salaryCtrl.text.trim()) ?? 25000,
                        'commissionPercentage': double.tryParse(commissionCtrl.text.trim()) ?? 20,
                      });
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        _loadAllAdminData();
                      }
                    },
                    icon: const Icon(Icons.email, color: Colors.white),
                    label: const Text('Save & Dispatch Credentials to Email 📧', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- MODAL: CREATE CUSTOMER (MATCHING WEB APP) ---
  void _showAddCustomerModal() {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    String gender = 'Female';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Register New Customer', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
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
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Email Address *', prefixIcon: Icon(Icons.email_outlined, color: Color(0xFFE0A96D))),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: phoneCtrl,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Mobile Phone *', prefixIcon: Icon(Icons.phone_outlined, color: Color(0xFFE0A96D))),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Gender', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          DropdownButtonFormField<String>(
                            initialValue: gender,
                            dropdownColor: const Color(0xFF25201C),
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            items: const [
                              DropdownMenuItem(value: 'Female', child: Text('Female')),
                              DropdownMenuItem(value: 'Male', child: Text('Male')),
                              DropdownMenuItem(value: 'Other', child: Text('Other')),
                            ],
                            onChanged: (val) { if (val != null) setModalState(() => gender = val); },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: addressCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Address / Location', prefixIcon: Icon(Icons.location_on_outlined, color: Color(0xFFE0A96D))),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE0A96D)),
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty) return;
                      await ApiService.createCustomer({
                        'name': nameCtrl.text.trim(),
                        'email': emailCtrl.text.trim(),
                        'phone': phoneCtrl.text.trim(),
                        'gender': gender,
                        'address': addressCtrl.text.trim(),
                      });
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        _loadAllAdminData();
                      }
                    },
                    child: const Text('Register Customer', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- MODAL: RECORD TRANSACTION ---
  void _showAddTransactionModal() {
    final amountCtrl = TextEditingController();
    final catCtrl = TextEditingController(text: 'General');
    final descCtrl = TextEditingController();
    String type = 'Credited';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF191512),
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
                  const Text('Log Financial Transaction', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFE0A96D))),
                  IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Text('Income (Credited)'),
                      selected: type == 'Credited',
                      selectedColor: Colors.greenAccent,
                      labelStyle: TextStyle(color: type == 'Credited' ? Colors.black : Colors.white, fontWeight: FontWeight.bold),
                      onSelected: (val) => setModalState(() => type = 'Credited'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ChoiceChip(
                      label: const Text('Expense (Debited)'),
                      selected: type == 'Debited',
                      selectedColor: Colors.redAccent,
                      labelStyle: TextStyle(color: type == 'Debited' ? Colors.white : Colors.white, fontWeight: FontWeight.bold),
                      onSelected: (val) => setModalState(() => type = 'Debited'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Amount (₹) *', prefixIcon: Icon(Icons.currency_rupee, color: Color(0xFFE0A96D))),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: catCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Category (e.g. Sales, Supplies) *', prefixIcon: Icon(Icons.category, color: Color(0xFFE0A96D))),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: descCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Description', prefixIcon: Icon(Icons.notes, color: Color(0xFFE0A96D))),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE0A96D)),
                  onPressed: () async {
                    final rawAmt = amountCtrl.text.trim();
                    if (rawAmt.isEmpty) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        const SnackBar(content: Text('Please enter transaction amount'), backgroundColor: Colors.amber),
                      );
                      return;
                    }
                    final amt = double.tryParse(rawAmt);
                    if (amt == null || amt <= 0) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        const SnackBar(content: Text('Please enter a valid positive amount'), backgroundColor: Colors.amber),
                      );
                      return;
                    }

                    final success = await ApiService.createTransaction({
                      'type': type,
                      'category': catCtrl.text.trim().isNotEmpty ? catCtrl.text.trim() : 'General',
                      'amount': amt,
                      'description': descCtrl.text.trim(),
                    });

                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(
                          content: Text(success ? 'Transaction logged successfully!' : 'Failed to log transaction'),
                          backgroundColor: success ? Colors.green : Colors.redAccent,
                        ),
                      );
                      _loadAllAdminData();
                    }
                  },
                  child: const Text('Record Entry', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAdminDrawer(Color goldColor, Color cardBg) {
    final navItems = [
      {'title': 'Overview & Analytics', 'icon': Icons.dashboard_outlined, 'badge': ''},
      {'title': 'Appointments Manager', 'icon': Icons.calendar_month_outlined, 'badge': ''},
      {'title': 'Services Catalog', 'icon': Icons.content_cut, 'badge': ''},
      {'title': 'Staff & Clients Desk', 'icon': Icons.people_outline, 'badge': ''},
      {'title': 'Leave Management', 'icon': Icons.event_busy_outlined, 'badge': ''},
      {'title': 'Attendance', 'icon': Icons.access_time_filled_outlined, 'badge': ''},
      {'title': 'Finance Ledger', 'icon': Icons.account_balance_wallet_outlined, 'badge': ''},
      {'title': 'Enquiries Desk', 'icon': Icons.mark_email_unread_outlined, 'badge': ''},
    ];

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
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.asset(
                    'assets/images/logo.png',
                    width: 42,
                    height: 42,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Spy_Salon',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                      ),
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: goldColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: goldColor.withValues(alpha: 0.5)),
                        ),
                        child: Text(
                          'ADMIN PORTAL',
                          style: TextStyle(color: goldColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                        ),
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
                'ADMIN NAVIGATION',
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
            child: Column(
              children: [
                ListTile(
                  dense: true,
                  leading: const Icon(Icons.logout, color: Colors.redAccent, size: 20),
                  title: const Text('Sign Out', style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold)),
                  onTap: () async {
                    final navigator = Navigator.of(context);
                    navigator.pop();
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
                        content: const Text('Are you sure you want to sign out from Admin Portal?', style: TextStyle(color: Colors.white70, fontSize: 14)),
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
                                  Navigator.pushAndRemoveUntil(
                                    ctx,
                                    MaterialPageRoute(builder: (c) => const AdminDashboardScreen()),
                                    (route) => false,
                                  );
                                } else if (isStaff) {
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
                    }
                  ),
                ],
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

    final sectionTitles = [
      'Performance Overview',
      'Appointments Manager',
      'Services Catalog',
      'Staff & Clients',
      'Leave Management',
      'Attendance',
      'Finance Ledger',
      'Enquiries Desk'
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF13100E),
      drawer: _buildAdminDrawer(goldColor, cardBg),
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
                width: 24,
                height: 24,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                sectionTitles[_tabController.index].toUpperCase(),
                style: const TextStyle(
                  color: Color(0xFFF6F2EB),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.1,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadAllAdminData,
            tooltip: 'Refresh Admin Data',
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
                child: _buildAdminTabContent(_tabController.index, goldColor, cardBg),
              ),
            ),
    );
  }

  Widget _buildAdminTabContent(int index, Color goldColor, Color cardBg) {
    switch (index) {
      case 0:
        return _buildOverviewTab(goldColor, cardBg);
      case 1:
        return _buildAppointmentsTab(goldColor, cardBg);
      case 2:
        return _buildServicesTab(goldColor, cardBg);
      case 3:
        return _buildStaffAndClientsTab(goldColor, cardBg);
      case 4:
        return _buildLeavesTab(goldColor, cardBg);
      case 5:
        return _buildAttendanceTab(goldColor, cardBg);
      case 6:
        return _buildFinanceTab(goldColor, cardBg);
      case 7:
        return _buildEnquiriesTab(goldColor, cardBg);
      default:
        return _buildOverviewTab(goldColor, cardBg);
    }
  }

  // --- TAB 1: OVERVIEW & ANALYTICS ---
  Widget _buildOverviewTab(Color goldColor, Color cardBg) {
    final revenue = _analytics['totalRevenue'] ?? _analytics['revenue'] ?? 12500;
    final totalAppts = _appointments.isNotEmpty ? _appointments.length : (_analytics['totalAppointments'] ?? 48);
    final totalServices = _services.isNotEmpty ? _services.length : (_analytics['totalServices'] ?? 12);
    final totalClients = _customers.isNotEmpty ? _customers.length : (_analytics['totalCustomers'] ?? 35);
    final totalEnquiries = _enquiries.length;
    final pendingLeavesCount = _leaves.where((l) => (l['status'] ?? '').toString().toLowerCase() == 'pending').length;
    final presentStaffCount = _attendanceReport.where((a) => (a['lastStatus'] ?? '').toString().contains('Present') || (a['lastStatus'] ?? '').toString().contains('On Break') || (a['lastStatus'] ?? '').toString().contains('Completed')).length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Performance Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _buildStatCard('Total Revenue', '₹$revenue', Icons.monetization_on_outlined, Colors.greenAccent, cardBg),
              _buildStatCard('Bookings', '$totalAppts', Icons.calendar_month_outlined, goldColor, cardBg),
              _buildStatCard('Staff Present Today', '$presentStaffCount / ${_attendanceReport.length}', Icons.access_time_filled_outlined, Colors.tealAccent, cardBg),
              _buildStatCard('Pending Leaves', '$pendingLeavesCount Requests', Icons.event_busy_outlined, Colors.orangeAccent, cardBg),
              _buildStatCard('Active Services', '$totalServices', Icons.dry_cleaning_rounded, Colors.purpleAccent, cardBg),
              _buildStatCard('Registered Clients', '$totalClients', Icons.people_outline, Colors.blueAccent, cardBg),
              _buildStatCard('Enquiries', '$totalEnquiries', Icons.mark_email_unread_outlined, Colors.amberAccent, cardBg),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Admin Quick Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                onPressed: _showAddAppointmentModal,
                icon: const Icon(Icons.add, color: Colors.black),
                label: const Text('Book Appointment', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(side: BorderSide(color: goldColor)),
                onPressed: () {
                  setState(() => _tabController.index = 4);
                },
                icon: const Icon(Icons.event_busy_outlined, color: Colors.orangeAccent),
                label: Text('Leave Desk ($pendingLeavesCount Pending)', style: const TextStyle(color: Colors.white)),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(side: BorderSide(color: goldColor)),
                onPressed: () {
                  setState(() => _tabController.index = 5);
                },
                icon: const Icon(Icons.access_time_filled_outlined, color: Colors.tealAccent),
                label: const Text('Attendance Roster', style: TextStyle(color: Colors.white)),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(side: BorderSide(color: goldColor)),
                onPressed: _showAddServiceModal,
                icon: Icon(Icons.content_cut, color: goldColor),
                label: const Text('Add Service', style: TextStyle(color: Colors.white)),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(side: BorderSide(color: goldColor)),
                onPressed: _showAddEmployeeModal,
                icon: Icon(Icons.badge_outlined, color: goldColor),
                label: const Text('Add Staff', style: TextStyle(color: Colors.white)),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(side: BorderSide(color: goldColor)),
                onPressed: _showAddCustomerModal,
                icon: Icon(Icons.person_add_alt, color: goldColor),
                label: const Text('Add Customer', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, Color cardBg) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
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
              Icon(icon, color: color, size: 22),
              Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
          const SizedBox(height: 10),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.white60)),
        ],
      ),
    );
  }

  // --- TAB 2: APPOINTMENTS MANAGER ---
  Widget _buildAppointmentsTab(Color goldColor, Color cardBg) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: cardBg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_appointments.length} Bookings', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                onPressed: _showAddAppointmentModal,
                icon: const Icon(Icons.add, color: Colors.black, size: 18),
                label: const Text('Book Appointment', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _appointments.isEmpty
              ? const Center(child: Text('No Appointments Found', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _appointments.length,
                  itemBuilder: (ctx, index) {
                    final appt = _appointments[index];
                    final id = appt['_id'] ?? appt['id'] ?? '';
                    final clientName = appt['customerName'] ?? appt['name'] ?? 'Client';
                    final phone = appt['customerPhone'] ?? appt['phone'] ?? '';
                    final service = appt['service'] ?? 'Hair Styling';
                    final date = appt['appointmentDate'] ?? appt['date'] ?? 'Today';
                    final time = appt['appointmentTime'] ?? appt['time'] ?? '11:00 AM';
                    final status = (appt['status'] ?? 'pending').toString().toLowerCase();

                    Color statusColor = Colors.amber;
                    if (status == 'confirmed') statusColor = Colors.greenAccent;
                    if (status == 'completed') statusColor = Colors.blueAccent;
                    if (status == 'cancelled') statusColor = Colors.redAccent;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
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
                              Text('$date at $time', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                              const Spacer(),
                              if (phone.isNotEmpty) Text(phone, style: const TextStyle(color: Colors.white38, fontSize: 12)),
                            ],
                          ),
                          const Divider(color: Colors.white10, height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              PopupMenuButton<String>(
                                color: const Color(0xFF25201C),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(color: goldColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                                  child: Row(
                                    children: [
                                      Text('Change Status', style: TextStyle(color: goldColor, fontSize: 12, fontWeight: FontWeight.bold)),
                                      Icon(Icons.arrow_drop_down, color: goldColor, size: 18),
                                    ],
                                  ),
                                ),
                                onSelected: (newStatus) async {
                                  final success = await ApiService.updateAppointmentStatus(id, newStatus);
                                  if (success) _loadAllAdminData();
                                },
                                itemBuilder: (ctx) => const [
                                  PopupMenuItem(value: 'confirmed', child: Text('Confirm', style: TextStyle(color: Colors.greenAccent))),
                                  PopupMenuItem(value: 'completed', child: Text('Complete', style: TextStyle(color: Colors.blueAccent))),
                                  PopupMenuItem(value: 'cancelled', child: Text('Cancel', style: TextStyle(color: Colors.redAccent))),
                                ],
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                onPressed: () async {
                                  final success = await ApiService.deleteAppointment(id);
                                  if (success) _loadAllAdminData();
                                },
                              ),
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

  // --- TAB 3: SERVICES CATALOG ---
  Widget _buildServicesTab(Color goldColor, Color cardBg) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          color: cardBg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_services.length} Services', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                onPressed: _showAddServiceModal,
                icon: const Icon(Icons.add, color: Colors.black, size: 18),
                label: const Text('Add Service', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _services.isEmpty
              ? const Center(child: Text('No Services in Catalog', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _services.length,
                  itemBuilder: (ctx, index) {
                    final item = _services[index];
                    final id = item['_id'] ?? item['id'] ?? '';
                    final name = item['name'] ?? item['title'] ?? 'Service';
                    final price = item['price'] != null ? '₹${item['price']}' : '₹50';
                    final category = item['category'] ?? 'Beauty';
                    final duration = item['durationMinutes'] != null ? '${item['durationMinutes']} mins' : (item['duration'] ?? '60 mins');

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: goldColor.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: goldColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                            child: Icon(Icons.content_cut, color: goldColor),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15)),
                                const SizedBox(height: 2),
                                Text('$category • $duration', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                              ],
                            ),
                          ),
                          Text(price, style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                            onPressed: () async {
                              final success = await ApiService.deleteService(id);
                              if (success) _loadAllAdminData();
                            },
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

  // --- TAB 4: STAFF & CLIENTS ---
  Widget _buildStaffAndClientsTab(Color goldColor, Color cardBg) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: cardBg,
            child: const TabBar(
              indicatorColor: Color(0xFFE0A96D),
              labelColor: Color(0xFFE0A96D),
              unselectedLabelColor: Colors.white54,
              tabs: [
                Tab(text: 'EMPLOYEES'),
                Tab(text: 'CUSTOMERS'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                // Employees Sub-Tab
                Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${_employees.length} Staff Members', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                            onPressed: _showAddEmployeeModal,
                            icon: const Icon(Icons.add, color: Colors.black, size: 18),
                            label: const Text('Onboard Staff', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: _employees.isEmpty
                          ? const Center(child: Text('No employees found', style: TextStyle(color: Colors.white54)))
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _employees.length,
                              itemBuilder: (ctx, i) {
                                final emp = _employees[i];
                                final id = emp['_id'] ?? emp['id'] ?? '';
                                final specialties = emp['specialties'] is List 
                                    ? (emp['specialties'] as List).join(', ') 
                                    : (emp['role'] ?? 'Specialist');
                                final salary = emp['baseSalary'] != null ? 'Base: ₹${emp['baseSalary']}' : '';
                                final comm = emp['commissionPercentage'] != null ? 'Comm: ${emp['commissionPercentage']}%' : '';

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
                                  child: ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    leading: CircleAvatar(
                                      backgroundColor: goldColor.withValues(alpha: 0.2),
                                      child: Text((emp['name'] ?? 'E')[0], style: TextStyle(color: goldColor, fontWeight: FontWeight.bold)),
                                    ),
                                    title: Text(emp['name'] ?? 'Staff Member', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(specialties, style: const TextStyle(color: Color(0xFFE0A96D), fontSize: 12)),
                                        Text('${emp['email'] ?? ''} • ${emp['phone'] ?? ''}', style: const TextStyle(color: Colors.white38, fontSize: 11)),
                                        if (salary.isNotEmpty) Text('$salary | $comm', style: const TextStyle(color: Colors.greenAccent, fontSize: 11)),
                                      ],
                                    ),
                                    trailing: IconButton(
                                      icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                      onPressed: () async {
                                        final success = await ApiService.deleteEmployee(id);
                                        if (success) _loadAllAdminData();
                                      },
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
                // Customers Sub-Tab
                Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${_customers.length} Customers', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                            onPressed: _showAddCustomerModal,
                            icon: const Icon(Icons.add, color: Colors.black, size: 18),
                            label: const Text('Add Customer', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: _customers.isEmpty
                          ? const Center(child: Text('No registered customers found', style: TextStyle(color: Colors.white54)))
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _customers.length,
                              itemBuilder: (ctx, i) {
                                final cust = _customers[i];
                                final id = cust['_id'] ?? cust['id'] ?? '';
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
                                  child: ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    leading: CircleAvatar(
                                      backgroundColor: Colors.blueAccent.withValues(alpha: 0.2),
                                      child: Text((cust['name'] ?? 'C')[0], style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold)),
                                    ),
                                    title: Text(cust['name'] ?? 'Customer', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                    subtitle: Text('${cust['email'] ?? ''} • ${cust['phone'] ?? ''}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                    trailing: IconButton(
                                      icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                      onPressed: () async {
                                        final success = await ApiService.deleteCustomer(id);
                                        if (success) _loadAllAdminData();
                                      },
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- TAB 5: FINANCE LEDGER ---
  Widget _buildFinanceTab(Color goldColor, Color cardBg) {
    double totalIncome = 0;
    double totalExpenses = 0;

    for (final tx in _transactions) {
      final typeStr = (tx['type'] ?? 'income').toString().toLowerCase();
      final amt = double.tryParse((tx['amount'] ?? 0).toString()) ?? 0.0;
      if (typeStr == 'income' || typeStr == 'credited') {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
      }
    }

    if (_transactions.isEmpty) {
      totalIncome = 18500;
      totalExpenses = 4220;
    }

    final netBalance = totalIncome - totalExpenses;

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
                const Text('Financial Ledger Summary', style: TextStyle(color: Colors.white60, fontSize: 13)),
                const SizedBox(height: 6),
                Text('₹${netBalance.toStringAsFixed(2)}', style: TextStyle(color: netBalance >= 0 ? Colors.greenAccent : Colors.redAccent, fontSize: 28, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Income', style: TextStyle(color: Colors.white38, fontSize: 11)), Text('₹${totalIncome.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))])),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('Expenses', style: TextStyle(color: Colors.white38, fontSize: 11)), Text('₹${totalExpenses.toStringAsFixed(2)}', style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))])),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Ledger Transactions', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                onPressed: _showAddTransactionModal,
                icon: const Icon(Icons.add, color: Colors.black, size: 18),
                label: const Text('Log Transaction', style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _transactions.isEmpty
              ? Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(12)), child: const Text('No transactions recorded yet.', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _transactions.length,
                  itemBuilder: (ctx, i) {
                    final tx = _transactions[i];
                    final id = tx['_id'] ?? tx['id'] ?? '';
                    final typeStr = (tx['type'] ?? 'income').toString().toLowerCase();
                    final isIncome = typeStr == 'income' || typeStr == 'credited';
                    final amountVal = tx['amount'] != null ? tx['amount'].toString() : '0';
                    final amount = '₹$amountVal';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(10)),
                      child: Row(
                        children: [
                          Icon(isIncome ? Icons.arrow_downward : Icons.arrow_upward, color: isIncome ? Colors.greenAccent : Colors.redAccent, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(tx['category'] ?? 'General Transaction', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                Text(tx['description'] ?? 'Ledger Record', style: const TextStyle(color: Colors.white38, fontSize: 11)),
                              ],
                            ),
                          ),
                          Text(isIncome ? '+$amount' : '-$amount', style: TextStyle(color: isIncome ? Colors.greenAccent : Colors.redAccent, fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                            onPressed: () async {
                              final success = await ApiService.deleteTransaction(id);
                              if (success) _loadAllAdminData();
                            },
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

  // --- TAB 6: ENQUIRIES DESK ---
  Widget _buildEnquiriesTab(Color goldColor, Color cardBg) {
    final totalCount = _enquiries.length;
    final newCount = _enquiries.where((e) {
      final s = (e['status'] ?? '').toString().toLowerCase();
      return s == 'new' || s == 'pending' || s.isEmpty;
    }).length;
    final contactedCount = _enquiries.where((e) {
      final s = (e['status'] ?? '').toString().toLowerCase();
      return s == 'contacted' || s == 'in progress';
    }).length;
    final resolvedCount = _enquiries.where((e) {
      final s = (e['status'] ?? '').toString().toLowerCase();
      return s == 'resolved' || s == 'closed';
    }).length;

    final filteredEnquiries = _enquiries.where((enq) {
      final status = (enq['status'] ?? 'New').toString();
      final statusLower = status.toLowerCase();

      if (_enquiryFilter == 'New' && (statusLower != 'new' && statusLower != 'pending')) return false;
      if (_enquiryFilter == 'Contacted' && (statusLower != 'contacted' && statusLower != 'in progress')) return false;
      if (_enquiryFilter == 'Resolved' && (statusLower != 'resolved' && statusLower != 'closed')) return false;

      if (_enquirySearchQuery.trim().isNotEmpty) {
        final query = _enquirySearchQuery.trim().toLowerCase();
        final name = (enq['name'] ?? '').toString().toLowerCase();
        final email = (enq['email'] ?? '').toString().toLowerCase();
        final phone = (enq['phone'] ?? '').toString().toLowerCase();
        final enquiryId = (enq['enquiryId'] ?? enq['_id'] ?? '').toString().toLowerCase();
        final message = (enq['message'] ?? enq['subject'] ?? '').toString().toLowerCase();

        return name.contains(query) || email.contains(query) || phone.contains(query) || enquiryId.contains(query) || message.contains(query);
      }
      return true;
    }).toList();

    return Column(
      children: [
        // Metric Summary Strip
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          color: cardBg,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildMiniStatBadge('Total Enquiries', '$totalCount', Colors.white70),
                  _buildMiniStatBadge('New', '$newCount', Colors.amber),
                  _buildMiniStatBadge('Contacted', '$contactedCount', Colors.lightBlueAccent),
                  _buildMiniStatBadge('Resolved', '$resolvedCount', Colors.greenAccent),
                ],
              ),
              const SizedBox(height: 12),
              // Search Input
              TextField(
                onChanged: (val) => setState(() => _enquirySearchQuery = val),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Search by client name, email, phone, or ID...',
                  hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                  prefixIcon: const Icon(Icons.search, color: Colors.white38, size: 18),
                  filled: true,
                  fillColor: const Color(0xFF13100E),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 10),
              // Filter Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['All', 'New', 'Contacted', 'Resolved'].map((tab) {
                    final isSelected = _enquiryFilter == tab;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        selected: isSelected,
                        label: Text(tab, style: TextStyle(color: isSelected ? Colors.black : Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                        backgroundColor: const Color(0xFF13100E),
                        selectedColor: goldColor,
                        onSelected: (sel) {
                          if (sel) setState(() => _enquiryFilter = tab);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),

        // List Area
        Expanded(
          child: filteredEnquiries.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.mark_email_read_outlined, size: 48, color: Colors.white24),
                      const SizedBox(height: 12),
                      Text(
                        _enquiries.isEmpty
                            ? 'No Customer Enquiries Found'
                            : 'No enquiries matching query',
                        style: const TextStyle(color: Colors.white54),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                        onPressed: _loadAllAdminData,
                        child: const Text('Refresh Enquiries', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredEnquiries.length,
                  itemBuilder: (ctx, index) {
                    final enq = filteredEnquiries[index];
                    final id = (enq['_id'] ?? enq['id'] ?? '').toString();
                    final enquiryId = (enq['enquiryId'] ?? '').toString();
                    final name = (enq['name'] ?? 'Inquirer').toString();
                    final email = (enq['email'] ?? '').toString();
                    final phone = (enq['phone'] ?? '').toString();
                    final message = (enq['message'] ?? enq['subject'] ?? 'Service Enquiry').toString();
                    final rawStatus = (enq['status'] ?? 'New').toString();
                    final statusLower = rawStatus.toLowerCase();
                    final adminNotes = (enq['adminNotes'] ?? '').toString();
                    final createdAt = (enq['createdAt'] ?? enq['date'] ?? '').toString();

                    Color statusColor = Colors.amber;
                    String displayStatus = 'NEW';

                    if (statusLower == 'contacted') {
                      statusColor = Colors.lightBlueAccent;
                      displayStatus = 'CONTACTED';
                    } else if (statusLower == 'in progress') {
                      statusColor = Colors.purpleAccent;
                      displayStatus = 'IN PROGRESS';
                    } else if (statusLower == 'resolved') {
                      statusColor = Colors.greenAccent;
                      displayStatus = 'RESOLVED';
                    } else if (statusLower == 'closed') {
                      statusColor = Colors.white54;
                      displayStatus = 'CLOSED';
                    } else {
                      statusColor = Colors.amber;
                      displayStatus = rawStatus.toUpperCase();
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: statusColor.withValues(alpha: 0.35)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                                    if (enquiryId.isNotEmpty)
                                      Text('ID: $enquiryId', style: const TextStyle(color: Colors.white38, fontSize: 11)),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: statusColor),
                                ),
                                child: Text(displayStatus, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF13100E),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              message,
                              style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.3),
                            ),
                          ),
                          if (adminNotes.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text('Memo: $adminNotes', style: const TextStyle(color: Colors.amber, fontSize: 11, fontStyle: FontStyle.italic)),
                          ],
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 12,
                            runSpacing: 4,
                            children: [
                              if (phone.isNotEmpty) Text('📞 $phone', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                              if (email.isNotEmpty) Text('✉️ $email', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                            ],
                          ),
                          if (createdAt.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text('Received: ${createdAt.length > 10 ? createdAt.substring(0, 10) : createdAt}', style: const TextStyle(color: Colors.white38, fontSize: 10)),
                          ],
                          const Divider(color: Colors.white10, height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                tooltip: 'Delete Enquiry',
                                onPressed: () async {
                                  final confirm = await showDialog<bool>(
                                    context: context,
                                    builder: (dialogCtx) => AlertDialog(
                                      backgroundColor: const Color(0xFF191512),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE0A96D))),
                                      title: const Text('Delete Enquiry', style: TextStyle(color: Colors.white)),
                                      content: const Text('Are you sure you want to delete this enquiry record?', style: TextStyle(color: Colors.white70)),
                                      actions: [
                                        TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Cancel', style: TextStyle(color: Colors.white54))),
                                        ElevatedButton(
                                          style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                                          onPressed: () => Navigator.pop(dialogCtx, true),
                                          child: const Text('Delete', style: TextStyle(color: Colors.white)),
                                        ),
                                      ],
                                    ),
                                  );
                                  if (confirm == true && id.isNotEmpty) {
                                    final success = await ApiService.deleteEnquiry(id);
                                    if (success) _loadAllAdminData();
                                  }
                                },
                              ),
                              PopupMenuButton<String>(
                                color: const Color(0xFF25201C),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(color: goldColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: goldColor.withValues(alpha: 0.5))),
                                  child: Row(
                                    children: [
                                      Text('Update Status', style: TextStyle(color: goldColor, fontSize: 12, fontWeight: FontWeight.bold)),
                                      Icon(Icons.arrow_drop_down, color: goldColor, size: 18),
                                    ],
                                  ),
                                ),
                                onSelected: (newStatus) async {
                                  if (id.isNotEmpty) {
                                    final success = await ApiService.updateEnquiryStatus(id, newStatus);
                                    if (success) _loadAllAdminData();
                                  }
                                },
                                itemBuilder: (ctx) => const [
                                  PopupMenuItem(value: 'New', child: Text('Mark New', style: TextStyle(color: Colors.amber))),
                                  PopupMenuItem(value: 'Contacted', child: Text('Mark Contacted', style: TextStyle(color: Colors.lightBlueAccent))),
                                  PopupMenuItem(value: 'In Progress', child: Text('Mark In Progress', style: TextStyle(color: Colors.purpleAccent))),
                                  PopupMenuItem(value: 'Resolved', child: Text('Mark Resolved', style: TextStyle(color: Colors.greenAccent))),
                                  PopupMenuItem(value: 'Closed', child: Text('Mark Closed', style: TextStyle(color: Colors.white54))),
                                ],
                              ),
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

  // --- TAB 5: LEAVE MANAGEMENT ---
  Widget _buildLeavesTab(Color goldColor, Color cardBg) {
    final pendingCount = _leaves.where((l) => (l['status'] ?? '').toString().toLowerCase() == 'pending').length;
    final approvedCount = _leaves.where((l) => (l['status'] ?? '').toString().toLowerCase() == 'approved').length;
    final rejectedCount = _leaves.where((l) => (l['status'] ?? '').toString().toLowerCase() == 'rejected').length;

    final filteredLeaves = _leaves.where((leave) {
      final status = (leave['status'] ?? 'pending').toString().toLowerCase();
      if (_leaveFilter == 'Pending' && status != 'pending') return false;
      if (_leaveFilter == 'Approved' && status != 'approved') return false;
      if (_leaveFilter == 'Rejected' && status != 'rejected') return false;

      if (_leaveSearchQuery.trim().isNotEmpty) {
        final query = _leaveSearchQuery.trim().toLowerCase();
        final name = (leave['employeeName'] ?? '').toString().toLowerCase();
        final reason = (leave['reason'] ?? '').toString().toLowerCase();
        return name.contains(query) || reason.contains(query);
      }
      return true;
    }).toList();

    return Column(
      children: [
        // Metric Summary Strip
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          color: cardBg,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildMiniStatBadge('Total Applications', '${_leaves.length}', Colors.white70),
                  _buildMiniStatBadge('Pending', '$pendingCount', Colors.amber),
                  _buildMiniStatBadge('Approved', '$approvedCount', Colors.greenAccent),
                  _buildMiniStatBadge('Rejected', '$rejectedCount', Colors.redAccent),
                ],
              ),
              const SizedBox(height: 12),
              // Search Input
              TextField(
                onChanged: (val) => setState(() => _leaveSearchQuery = val),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Search by staff name or leave reason...',
                  hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFFE0A96D), size: 18),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                  filled: true,
                  fillColor: const Color(0xFF25201C),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 10),
              // Filter Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['All', 'Pending', 'Approved', 'Rejected'].map((filter) {
                    final isSelected = _leaveFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        selected: isSelected,
                        label: Text(filter, style: TextStyle(color: isSelected ? Colors.black : Colors.white70, fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                        selectedColor: goldColor,
                        backgroundColor: const Color(0xFF25201C),
                        onSelected: (bool selected) {
                          setState(() => _leaveFilter = filter);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),

        // Leave Requests List
        Expanded(
          child: filteredLeaves.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.event_available_outlined, size: 48, color: Colors.white24),
                      const SizedBox(height: 12),
                      Text(
                        _leaveSearchQuery.isNotEmpty || _leaveFilter != 'All'
                            ? 'No matching leave requests found'
                            : 'No Leave Applications Found',
                        style: const TextStyle(color: Colors.white54),
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                        onPressed: _loadAllAdminData,
                        icon: const Icon(Icons.refresh, color: Colors.black, size: 18),
                        label: const Text('Refresh Leave Logs', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredLeaves.length,
                  itemBuilder: (ctx, index) {
                    final leave = filteredLeaves[index];
                    final id = (leave['_id'] ?? leave['id'] ?? '').toString();
                    final empName = (leave['employeeName'] ?? 'Staff Member').toString();
                    final startDate = (leave['startDate'] ?? '').toString();
                    final endDate = (leave['endDate'] ?? '').toString();
                    final reason = (leave['reason'] ?? 'Personal leave').toString();
                    final status = (leave['status'] ?? 'pending').toString();
                    final statusLower = status.toLowerCase();
                    final rejectionReason = (leave['rejectionReason'] ?? '').toString();
                    final actionBy = (leave['actionByAdminName'] ?? '').toString();

                    Color statusColor = Colors.amber;
                    if (statusLower == 'approved') statusColor = Colors.greenAccent;
                    if (statusLower == 'rejected') statusColor = Colors.redAccent;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: statusColor.withValues(alpha: 0.35)),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 6, offset: const Offset(0, 3)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: goldColor.withValues(alpha: 0.2),
                                child: Text(
                                  empName.isNotEmpty ? empName[0].toUpperCase() : 'S',
                                  style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      empName,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '📅 $startDate to $endDate',
                                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: statusColor),
                                ),
                                child: Text(
                                  status.toUpperCase(),
                                  style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF25201C),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.notes, size: 16, color: Color(0xFFE0A96D)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    reason,
                                    style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.3),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (statusLower == 'rejected' && rejectionReason.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text('Rejection Reason: $rejectionReason', style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontStyle: FontStyle.italic)),
                          ],
                          if (actionBy.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text('Processed by: $actionBy', style: const TextStyle(color: Colors.white38, fontSize: 11)),
                          ],

                          // Action Buttons for Pending Requests
                          if (statusLower == 'pending') ...[
                            const Divider(color: Colors.white10, height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Colors.redAccent),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  onPressed: () => _showRejectLeaveModal(id, empName),
                                  icon: const Icon(Icons.close, color: Colors.redAccent, size: 16),
                                  label: const Text('Reject', style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 12),
                                ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  onPressed: () async {
                                    final success = await ApiService.approveAdminLeave(id);
                                    if (ctx.mounted) {
                                      ScaffoldMessenger.of(ctx).showSnackBar(
                                        SnackBar(
                                          content: Text(success ? 'Leave request approved for $empName!' : 'Failed to approve leave'),
                                          backgroundColor: success ? Colors.green : Colors.redAccent,
                                        ),
                                      );
                                      if (success) _loadAllAdminData();
                                    }
                                  },
                                  icon: const Icon(Icons.check, color: Colors.white, size: 16),
                                  label: const Text('Approve Leave', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
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

  void _showRejectLeaveModal(String leaveId, String empName) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: const Color(0xFF191512),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Colors.redAccent, width: 0.8)),
        title: Text('Reject Leave for $empName', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Optionally provide a reason for rejecting this leave request:', style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(
                hintText: 'e.g. High booking load on selected dates',
                hintStyle: TextStyle(color: Colors.white38, fontSize: 12),
                fillColor: Color(0xFF25201C),
                filled: true,
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () async {
              Navigator.pop(dialogCtx);
              final success = await ApiService.rejectAdminLeave(leaveId, reasonCtrl.text.trim());
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Leave request rejected for $empName' : 'Failed to reject leave'),
                    backgroundColor: success ? Colors.orange : Colors.redAccent,
                  ),
                );
                if (success) _loadAllAdminData();
              }
            },
            child: const Text('Reject Leave', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // --- TAB 6: ATTENDANCE TRACKING ---
  Widget _buildAttendanceTab(Color goldColor, Color cardBg) {
    final totalStaff = _attendanceReport.length;
    final presentCount = _attendanceReport.where((a) => (a['lastStatus'] ?? '').toString().contains('Present') || (a['lastStatus'] ?? '').toString().contains('On Break') || (a['lastStatus'] ?? '').toString().contains('Completed')).length;
    final leaveCount = _attendanceReport.where((a) => (a['leaveDays'] ?? 0) > 0 || (a['lastStatus'] ?? '').toString().contains('Leave')).length;
    final absentCount = totalStaff - presentCount - leaveCount;

    final filteredReport = _attendanceReport.where((emp) {
      if (_attendanceSearchQuery.trim().isNotEmpty) {
        final query = _attendanceSearchQuery.trim().toLowerCase();
        final name = (emp['name'] ?? '').toString().toLowerCase();
        final code = (emp['empCode'] ?? '').toString().toLowerCase();
        return name.contains(query) || code.contains(query);
      }
      return true;
    }).toList();

    return Column(
      children: [
        // Metric Summary Header
        Container(
          padding: const EdgeInsets.all(16),
          color: cardBg,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildMiniStatBadge('Total Staff', '$totalStaff', Colors.white70),
                  _buildMiniStatBadge('Present Today', '$presentCount', Colors.greenAccent),
                  _buildMiniStatBadge('On Leave', '$leaveCount', Colors.amber),
                  _buildMiniStatBadge('Not Checked In', '${absentCount < 0 ? 0 : absentCount}', Colors.redAccent),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                onChanged: (val) => setState(() => _attendanceSearchQuery = val),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Search staff by name or emp code (e.g. EMP-1001)...',
                  hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFFE0A96D), size: 18),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                  filled: true,
                  fillColor: const Color(0xFF25201C),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
            ],
          ),
        ),

        // Staff Attendance List
        Expanded(
          child: filteredReport.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.access_time, size: 48, color: Colors.white24),
                      const SizedBox(height: 12),
                      Text(
                        _attendanceSearchQuery.isNotEmpty ? 'No staff matching query' : 'No Staff Attendance Records Found',
                        style: const TextStyle(color: Colors.white54),
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: goldColor),
                        onPressed: _loadAllAdminData,
                        icon: const Icon(Icons.refresh, color: Colors.black, size: 18),
                        label: const Text('Refresh Attendance Roster', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredReport.length,
                  itemBuilder: (ctx, index) {
                    final emp = filteredReport[index];
                    final name = (emp['name'] ?? 'Staff Member').toString();
                    final empCode = (emp['empCode'] ?? 'EMP-1000').toString();
                    final attendancePct = (emp['attendancePercentage'] ?? '0.0%').toString();
                    final workedDays = emp['workedDays'] ?? 0;
                    final salonDays = emp['salonOpenedDays'] ?? 26;
                    final fullDays = emp['fullDays'] ?? 0;
                    final halfDays = emp['halfDays'] ?? 0;
                    final leaveDays = emp['leaveDays'] ?? 0;
                    final absentDays = emp['absentDays'] ?? 0;
                    final workingHours = (emp['workingHours'] ?? '0h 0m').toString();
                    final breakHours = (emp['breakHours'] ?? '0h 0m').toString();
                    final lastStatus = (emp['lastStatus'] ?? 'Not Checked In').toString();

                    Color statusColor = Colors.white38;
                    if (lastStatus.contains('Present') || lastStatus.contains('Completed')) statusColor = Colors.greenAccent;
                    if (lastStatus.contains('On Break')) statusColor = Colors.amber;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: goldColor.withValues(alpha: 0.25)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header Row: Avatar, Name & Live Status Badge
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 22,
                                backgroundColor: goldColor.withValues(alpha: 0.2),
                                child: Text(
                                  name.isNotEmpty ? name[0].toUpperCase() : 'E',
                                  style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(color: const Color(0xFF25201C), borderRadius: BorderRadius.circular(4)),
                                          child: Text(empCode, style: const TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          lastStatus,
                                          style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              // Monthly Pct Badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: goldColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: goldColor.withValues(alpha: 0.4)),
                                ),
                                child: Column(
                                  children: [
                                    Text(attendancePct, style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 14)),
                                    const Text('Rate', style: TextStyle(color: Colors.white38, fontSize: 9)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const Divider(color: Colors.white10, height: 20),

                          // Monthly Metrics Grid
                          Row(
                            children: [
                              _buildMetricTile('Worked Days', '$workedDays / $salonDays', Icons.calendar_today, Colors.blueAccent),
                              _buildMetricTile('Working Hrs', workingHours, Icons.timer_outlined, Colors.greenAccent),
                              _buildMetricTile('Break Hrs', breakHours, Icons.coffee_outlined, Colors.amber),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Full Days: $fullDays', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                              Text('Half Days: $halfDays', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                              Text('Leaves: $leaveDays', style: const TextStyle(color: Colors.amber, fontSize: 11)),
                              Text('Absent: $absentDays', style: const TextStyle(color: Colors.redAccent, fontSize: 11)),
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

  Widget _buildMiniStatBadge(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.white54)),
      ],
    );
  }

  Widget _buildMetricTile(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: const Color(0xFF25201C),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 12, color: color),
                const SizedBox(width: 4),
                Expanded(child: Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10), overflow: TextOverflow.ellipsis)),
              ],
            ),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

