import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isEditMode = false;
  Map<String, dynamic>? _user;

  // Editing Controllers
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _dobCtrl = TextEditingController();

  String _gender = 'Female';
  String _language = 'English';
  String _communication = 'WhatsApp';

  bool _emailAlerts = true;
  bool _smsAlerts = true;
  bool _whatsappAlerts = true;
  bool _promoOffers = true;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _dobCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProfileData({bool quiet = false}) async {
    if (!quiet) setState(() => _isLoading = true);
    final user = await ApiService.fetchCurrentUserProfile();
    if (!mounted) return;

    if (user != null) {
      setState(() {
        _user = user;
        _populateFields(user);
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  void _populateFields(Map<String, dynamic> user) {
    _nameCtrl.text = user['name'] ?? '';
    _phoneCtrl.text = user['phone'] ?? '';
    _emailCtrl.text = user['email'] ?? '';
    _dobCtrl.text = user['dob'] ?? '';

    final g = (user['gender'] ?? '').toString();
    if (['Female', 'Male', 'Non-Binary', 'Prefer Not to Say'].contains(g)) {
      _gender = g;
    }

    final lang = (user['preferredLanguage'] ?? '').toString();
    if (['English', 'Telugu', 'Hindi'].contains(lang)) {
      _language = lang;
    }

    final comm = (user['preferredCommunication'] ?? '').toString();
    if (['WhatsApp', 'SMS', 'Email'].contains(comm)) {
      _communication = comm;
    }

    final notif = user['notificationPreferences'];
    if (notif != null && notif is Map) {
      _emailAlerts = notif['emailAlerts'] ?? true;
      _smsAlerts = notif['smsAlerts'] ?? true;
      _whatsappAlerts = notif['whatsappAlerts'] ?? true;
      _promoOffers = notif['promoOffers'] ?? true;
    }
  }

  int _calculateCompleteness() {
    int score = 0;
    if (_nameCtrl.text.trim().isNotEmpty) score += 20;
    if (_emailCtrl.text.trim().isNotEmpty) score += 20;
    if (_phoneCtrl.text.trim().isNotEmpty) score += 20;
    if ((_user?['avatar'] ?? '').toString().isNotEmpty) score += 20;
    if (_dobCtrl.text.trim().isNotEmpty) score += 10;
    if (_gender.isNotEmpty) score += 10;
    return score > 100 ? 100 : score;
  }

  Future<void> _handleSaveProfile(AppColors colors) async {
    if (_nameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: colors.error, content: const Text('Please enter your full name')),
      );
      return;
    }

    setState(() => _isSaving = true);
    final payload = {
      'name': _nameCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'gender': _gender,
      'dob': _dobCtrl.text.trim(),
      'preferredLanguage': _language,
      'preferredCommunication': _communication,
      'notificationPreferences': {
        'emailAlerts': _emailAlerts,
        'smsAlerts': _smsAlerts,
        'whatsappAlerts': _whatsappAlerts,
        'promoOffers': _promoOffers,
      },
    };

    try {
      final res = await ApiService.updateCustomerProfile(payload);
      if (mounted) {
        setState(() => _isSaving = false);
        final isSuccess = res['success'] == true;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: isSuccess ? colors.success : colors.error,
            content: Text(res['message'] ?? (isSuccess ? 'Profile details updated successfully!' : 'Failed to update profile')),
          ),
        );
        if (isSuccess) {
          await _loadProfileData(quiet: true);
          setState(() {
            _isEditMode = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: colors.error, content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final completeness = _calculateCompleteness();

    return Scaffold(
      backgroundColor: colors.mainBackground,
      appBar: AppBar(
        backgroundColor: colors.cardSurface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: colors.primary, size: 20),
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
            const SizedBox(width: 10),
            Text(
              'My Profile',
              style: TextStyle(
                color: colors.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: TextButton.icon(
              style: TextButton.styleFrom(
                foregroundColor: colors.primary,
              ),
              onPressed: () {
                setState(() {
                  _isEditMode = !_isEditMode;
                });
              },
              icon: Icon(_isEditMode ? Icons.visibility_outlined : Icons.edit_outlined, size: 18),
              label: Text(
                _isEditMode ? 'View Profile' : 'Edit Profile',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: colors.primary))
          : RefreshIndicator(
              color: colors.primary,
              backgroundColor: colors.cardSurface,
              onRefresh: () => _loadProfileData(quiet: true),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // --- HEADER PROFILE CARD ---
                    _buildHeaderCard(colors),
                    const SizedBox(height: 16),

                    // --- COMPLETENESS CARD ---
                    _buildCompletenessCard(colors, completeness),
                    const SizedBox(height: 20),

                    // --- PROFILE CONTENT (VIEW MODE OR EDIT MODE) ---
                    _isEditMode ? _buildEditForm(colors) : _buildViewDetails(colors),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHeaderCard(AppColors colors) {
    final name = _user?['name'] ?? 'VIP Guest';
    final email = _user?['email'] ?? 'guest@spysalon.com';
    final phone = _user?['phone'] ?? '+91 98765 43210';
    final empCode = _user?['employeeId'] ?? _user?['id'] ?? 'CUST-84920';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.cardSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 34,
            backgroundColor: colors.primary.withValues(alpha: 0.2),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'S',
              style: TextStyle(
                color: colors.primary,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: colors.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: colors.primary.withValues(alpha: 0.5)),
                      ),
                      child: Text(
                        '👑 VIP Member',
                        style: TextStyle(
                          color: colors.primary,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  email,
                  style: TextStyle(color: colors.textMuted, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '$phone  •  ID: $empCode',
                  style: TextStyle(color: colors.textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletenessCard(AppColors colors, int score) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.cardSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.auto_awesome_rounded, color: colors.primary, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Profile Completeness',
                    style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ],
              ),
              Text(
                '$score%',
                style: TextStyle(color: colors.primary, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: score / 100.0,
              minHeight: 8,
              backgroundColor: colors.inputBackground,
              color: colors.primary,
            ),
          ),
          if (score < 100) ...[
            const SizedBox(height: 8),
            Text(
              'Complete missing details for 100% VIP guest status & seamless appointment updates.',
              style: TextStyle(color: colors.textMuted, fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }

  // READ-ONLY VIEW MODE
  Widget _buildViewDetails(AppColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(colors, 'PERSONAL DETAILS'),
        const SizedBox(height: 10),
        _buildInfoCard(colors, [
          _buildInfoTile(colors, Icons.person_outline, 'Full Name', _nameCtrl.text.isNotEmpty ? _nameCtrl.text : 'Not Specified'),
          _buildInfoTile(colors, Icons.phone_outlined, 'Mobile Phone', _phoneCtrl.text.isNotEmpty ? _phoneCtrl.text : 'Not Specified'),
          _buildInfoTile(colors, Icons.email_outlined, 'Email Address', _emailCtrl.text.isNotEmpty ? _emailCtrl.text : 'Not Specified'),
          _buildInfoTile(colors, Icons.wc_outlined, 'Gender', _gender),
        ]),
        const SizedBox(height: 20),

        _buildSectionTitle(colors, 'IMPORTANT DATES & MILESTONES'),
        const SizedBox(height: 10),
        _buildInfoCard(colors, [
          _buildInfoTile(colors, Icons.cake_outlined, 'Date of Birth', _dobCtrl.text.isNotEmpty ? _dobCtrl.text : 'Not Set'),
        ]),
        const SizedBox(height: 20),

        _buildSectionTitle(colors, 'COMMUNICATION & PREFERENCES'),
        const SizedBox(height: 10),
        _buildInfoCard(colors, [
          _buildInfoTile(colors, Icons.language_outlined, 'Preferred Language', _language),
          _buildInfoTile(colors, Icons.chat_bubble_outline, 'Preferred Channel', _communication),
        ]),
        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.primary,
              foregroundColor: colors.buttonTextPrimary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            onPressed: () {
              setState(() {
                _isEditMode = true;
              });
            },
            icon: Icon(Icons.edit, color: colors.buttonTextPrimary, size: 18),
            label: Text(
              'Edit Profile Information',
              style: TextStyle(
                color: colors.buttonTextPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  // EDITABLE FORM MODE
  Widget _buildEditForm(AppColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(colors, 'EDIT PERSONAL INFORMATION'),
        const SizedBox(height: 10),

        // Name
        TextField(
          controller: _nameCtrl,
          style: TextStyle(color: colors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Full Name *',
            labelStyle: TextStyle(color: colors.textMuted),
            prefixIcon: Icon(Icons.person_outline, color: colors.primary),
            filled: true,
            fillColor: colors.inputBackground,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
          ),
        ),
        const SizedBox(height: 12),

        // Phone
        TextField(
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          style: TextStyle(color: colors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Mobile Phone Number *',
            labelStyle: TextStyle(color: colors.textMuted),
            prefixIcon: Icon(Icons.phone_outlined, color: colors.primary),
            filled: true,
            fillColor: colors.inputBackground,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
          ),
        ),
        const SizedBox(height: 12),

        // Email
        TextField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          style: TextStyle(color: colors.textPrimary),
          decoration: InputDecoration(
            labelText: 'Email Address *',
            labelStyle: TextStyle(color: colors.textMuted),
            prefixIcon: Icon(Icons.email_outlined, color: colors.primary),
            filled: true,
            fillColor: colors.inputBackground,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
          ),
        ),
        const SizedBox(height: 12),

        // Gender Dropdown
        DropdownButtonFormField<String>(
          initialValue: _gender,
          dropdownColor: colors.cardSurface,
          style: TextStyle(color: colors.textPrimary, fontSize: 14),
          items: const [
            DropdownMenuItem(value: 'Female', child: Text('Female')),
            DropdownMenuItem(value: 'Male', child: Text('Male')),
            DropdownMenuItem(value: 'Non-Binary', child: Text('Non-Binary')),
            DropdownMenuItem(value: 'Prefer Not to Say', child: Text('Prefer Not to Say')),
          ],
          onChanged: (val) {
            if (val != null) setState(() => _gender = val);
          },
          decoration: InputDecoration(
            labelText: 'Gender',
            labelStyle: TextStyle(color: colors.textMuted),
            prefixIcon: Icon(Icons.wc_outlined, color: colors.primary),
            filled: true,
            fillColor: colors.inputBackground,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
          ),
        ),
        const SizedBox(height: 20),

        _buildSectionTitle(colors, 'IMPORTANT DATES & MILESTONES'),
        const SizedBox(height: 10),

        // DOB DatePicker
        InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime.tryParse(_dobCtrl.text) ?? DateTime(1995, 6, 15),
              firstDate: DateTime(1930),
              lastDate: DateTime.now(),
            );
            if (picked != null) {
              setState(() {
                _dobCtrl.text = picked.toString().split(' ')[0];
              });
            }
          },
          child: IgnorePointer(
            child: TextField(
              controller: _dobCtrl,
              style: TextStyle(color: colors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Date of Birth',
                hintText: 'YYYY-MM-DD',
                labelStyle: TextStyle(color: colors.textMuted),
                prefixIcon: Icon(Icons.cake_outlined, color: colors.primary),
                suffixIcon: Icon(Icons.calendar_today_outlined, color: colors.textMuted, size: 18),
                filled: true,
                fillColor: colors.inputBackground,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),

        _buildSectionTitle(colors, 'COMMUNICATION PREFERENCES'),
        const SizedBox(height: 10),

        // Language
        DropdownButtonFormField<String>(
          initialValue: _language,
          dropdownColor: colors.cardSurface,
          style: TextStyle(color: colors.textPrimary, fontSize: 14),
          items: const [
            DropdownMenuItem(value: 'English', child: Text('English')),
            DropdownMenuItem(value: 'Telugu', child: Text('Telugu')),
            DropdownMenuItem(value: 'Hindi', child: Text('Hindi')),
          ],
          onChanged: (val) {
            if (val != null) setState(() => _language = val);
          },
          decoration: InputDecoration(
            labelText: 'Preferred Language',
            labelStyle: TextStyle(color: colors.textMuted),
            prefixIcon: Icon(Icons.language_outlined, color: colors.primary),
            filled: true,
            fillColor: colors.inputBackground,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
          ),
        ),
        const SizedBox(height: 12),

        // Channel
        DropdownButtonFormField<String>(
          initialValue: _communication,
          dropdownColor: colors.cardSurface,
          style: TextStyle(color: colors.textPrimary, fontSize: 14),
          items: const [
            DropdownMenuItem(value: 'WhatsApp', child: Text('WhatsApp Instant Alert')),
            DropdownMenuItem(value: 'SMS', child: Text('SMS Message')),
            DropdownMenuItem(value: 'Email', child: Text('Email Notification')),
          ],
          onChanged: (val) {
            if (val != null) setState(() => _communication = val);
          },
          decoration: InputDecoration(
            labelText: 'Preferred Channel',
            labelStyle: TextStyle(color: colors.textMuted),
            prefixIcon: Icon(Icons.chat_bubble_outline, color: colors.primary),
            filled: true,
            fillColor: colors.inputBackground,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.cardBorder)),
          ),
        ),
        const SizedBox(height: 24),

        // Action buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(color: colors.cardBorder),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  setState(() {
                    _isEditMode = false;
                    if (_user != null) _populateFields(_user!);
                  });
                },
                child: Text('Cancel', style: TextStyle(color: colors.textMuted, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.primary,
                  foregroundColor: colors.buttonTextPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: _isSaving ? null : () => _handleSaveProfile(colors),
                child: _isSaving
                    ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5, color: colors.buttonTextPrimary))
                    : Text('Save Changes', style: TextStyle(color: colors.buttonTextPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildSectionTitle(AppColors colors, String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: TextStyle(
          color: colors.primary,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildInfoCard(AppColors colors, List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: colors.cardSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.cardBorder),
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildInfoTile(AppColors colors, IconData icon, String label, String value) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: colors.primary.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: colors.primary.withValues(alpha: 0.3)),
        ),
        child: Icon(icon, color: colors.primary, size: 18),
      ),
      title: Text(
        label,
        style: TextStyle(color: colors.textMuted, fontSize: 11, fontWeight: FontWeight.bold),
      ),
      subtitle: Text(
        value,
        style: TextStyle(color: colors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
      ),
    );
  }
}
