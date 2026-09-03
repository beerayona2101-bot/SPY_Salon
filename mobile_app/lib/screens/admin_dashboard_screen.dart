import 'package:flutter/material.dart';
import '../services/api_service.dart';

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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _loadAllAdminData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAllAdminData() async {
    setState(() => _isLoading = true);

    final results = await Future.wait([
      ApiService.getAdminAnalytics(),
      ApiService.getAdminAppointments(),
      ApiService.getAdminServices(),
      ApiService.getAdminEmployees(),
      ApiService.getAdminCustomers(),
      ApiService.getAdminTransactions(),
      ApiService.getAdminEnquiries(),
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
                        decoration: const InputDecoration(labelText: 'Price (\$) *', prefixIcon: Icon(Icons.attach_money, color: Color(0xFFE0A96D))),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: discountCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Discount Price (\$)', prefixIcon: Icon(Icons.local_offer_outlined, color: Color(0xFFE0A96D))),
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
                        decoration: const InputDecoration(labelText: 'Base Fixed Salary (₹ / \$) *', hintText: '25000', prefixIcon: Icon(Icons.payments_outlined, color: Color(0xFFE0A96D))),
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
    String type = 'income';

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
                      label: const Text('Income'),
                      selected: type == 'income',
                      selectedColor: Colors.greenAccent,
                      onSelected: (val) => setModalState(() => type = 'income'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ChoiceChip(
                      label: const Text('Expense'),
                      selected: type == 'expense',
                      selectedColor: Colors.redAccent,
                      onSelected: (val) => setModalState(() => type = 'expense'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Amount (\$)', prefixIcon: Icon(Icons.attach_money, color: Color(0xFFE0A96D))),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: catCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Category (e.g. Sales, Supplies)', prefixIcon: Icon(Icons.category, color: Color(0xFFE0A96D))),
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
                    if (amountCtrl.text.trim().isEmpty) return;
                    await ApiService.createTransaction({
                      'type': type,
                      'category': catCtrl.text.trim(),
                      'amount': double.tryParse(amountCtrl.text.trim()) ?? 0.0,
                      'description': descCtrl.text.trim(),
                    });
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
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

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFE0A96D);
    const cardBg = Color(0xFF191512);

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
                width: 26,
                height: 26,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'ADMIN DASHBOARD',
              style: TextStyle(
                color: Color(0xFFF6F2EB),
                fontSize: 15,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
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
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: goldColor,
          labelColor: goldColor,
          unselectedLabelColor: Colors.white54,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'OVERVIEW'),
            Tab(text: 'APPOINTMENTS'),
            Tab(text: 'SERVICES'),
            Tab(text: 'STAFF & CLIENTS'),
            Tab(text: 'FINANCE'),
            Tab(text: 'LEADS'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: goldColor))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(goldColor, cardBg),
                _buildAppointmentsTab(goldColor, cardBg),
                _buildServicesTab(goldColor, cardBg),
                _buildStaffAndClientsTab(goldColor, cardBg),
                _buildFinanceTab(goldColor, cardBg),
                _buildEnquiriesTab(goldColor, cardBg),
              ],
            ),
    );
  }

  // --- TAB 1: OVERVIEW & ANALYTICS ---
  Widget _buildOverviewTab(Color goldColor, Color cardBg) {
    final revenue = _analytics['totalRevenue'] ?? _analytics['revenue'] ?? 12500;
    final totalAppts = _appointments.isNotEmpty ? _appointments.length : (_analytics['totalAppointments'] ?? 48);
    final totalServices = _services.isNotEmpty ? _services.length : (_analytics['totalServices'] ?? 12);
    final totalClients = _customers.isNotEmpty ? _customers.length : (_analytics['totalCustomers'] ?? 35);
    final totalLeads = _enquiries.length;

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
              _buildStatCard('Total Revenue', '\$$revenue', Icons.monetization_on_outlined, Colors.greenAccent, cardBg),
              _buildStatCard('Bookings', '$totalAppts', Icons.calendar_month_outlined, goldColor, cardBg),
              _buildStatCard('Active Services', '$totalServices', Icons.dry_cleaning_rounded, Colors.purpleAccent, cardBg),
              _buildStatCard('Registered Clients', '$totalClients', Icons.people_outline, Colors.blueAccent, cardBg),
              _buildStatCard('New Leads', '$totalLeads', Icons.mark_email_unread_outlined, Colors.amberAccent, cardBg),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Admin Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
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
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(side: BorderSide(color: goldColor)),
                onPressed: _showAddTransactionModal,
                icon: Icon(Icons.receipt_long, color: goldColor),
                label: const Text('Log Transaction', style: TextStyle(color: Colors.white)),
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
                    final price = item['price'] != null ? '\$${item['price']}' : '\$50';
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
                Text('Financial Ledger Summary', style: TextStyle(color: Colors.white60, fontSize: 13)),
                SizedBox(height: 6),
                Text('\$14,280.00', style: TextStyle(color: Colors.greenAccent, fontSize: 28, fontWeight: FontWeight.bold)),
                SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Income', style: TextStyle(color: Colors.white38, fontSize: 11)), Text('\$18,500.00', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))])),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Expenses', style: TextStyle(color: Colors.white38, fontSize: 11)), Text('\$4,220.00', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))])),
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
                    final isIncome = (tx['type'] ?? 'income') == 'income';
                    final amount = tx['amount'] != null ? '\$${tx['amount']}' : '\$100';
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

  // --- TAB 6: ENQUIRIES / LEAD DESK ---
  Widget _buildEnquiriesTab(Color goldColor, Color cardBg) {
    if (_enquiries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.mark_email_read_outlined, size: 48, color: Colors.white24),
            const SizedBox(height: 12),
            const Text('No Customer Enquiries Found', style: TextStyle(color: Colors.white54)),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: goldColor),
              onPressed: _loadAllAdminData,
              child: const Text('Refresh', style: TextStyle(color: Colors.black)),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _enquiries.length,
      itemBuilder: (ctx, index) {
        final enq = _enquiries[index];
        final id = enq['_id'] ?? enq['id'] ?? '';
        final name = enq['name'] ?? 'Inquirer';
        final email = enq['email'] ?? '';
        final phone = enq['phone'] ?? '';
        final message = enq['message'] ?? enq['subject'] ?? 'Service Enquiry';
        final status = (enq['status'] ?? 'pending').toString().toLowerCase();

        Color statusColor = Colors.amber;
        if (status == 'contacted' || status == 'resolved') statusColor = Colors.greenAccent;

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
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12), border: Border.all(color: statusColor)),
                    child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(message, style: const TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 6),
              Row(
                children: [
                  if (phone.isNotEmpty) Text('📞 $phone   ', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                  if (email.isNotEmpty) Text('✉️ $email', style: const TextStyle(color: Colors.white38, fontSize: 12)),
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
                          Text('Mark Status', style: TextStyle(color: goldColor, fontSize: 12, fontWeight: FontWeight.bold)),
                          Icon(Icons.arrow_drop_down, color: goldColor, size: 18),
                        ],
                      ),
                    ),
                    onSelected: (newStatus) async {
                      final success = await ApiService.updateEnquiryStatus(id, newStatus);
                      if (success) _loadAllAdminData();
                    },
                    itemBuilder: (ctx) => const [
                      PopupMenuItem(value: 'contacted', child: Text('Mark Contacted', style: TextStyle(color: Colors.greenAccent))),
                      PopupMenuItem(value: 'resolved', child: Text('Mark Resolved', style: TextStyle(color: Colors.blueAccent))),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
