import 'package:flutter/material.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginScreen({super.key, required this.onLoginSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Login Mode: 'password' or 'otp'
  String _loginMode = 'password';

  // Sign In Controllers
  final _loginIdentifierCtrl = TextEditingController();
  final _loginPasswordCtrl = TextEditingController();
  final _loginOtpCtrl = TextEditingController();
  bool _loginObscure = true;
  bool _isSubmittingLogin = false;
  bool _otpSent = false;
  bool _isSendingOtp = false;

  // Register Controllers
  final _regNameCtrl = TextEditingController();
  final _regEmailCtrl = TextEditingController();
  final _regPhoneCtrl = TextEditingController();
  final _regPasswordCtrl = TextEditingController();
  bool _regObscure = true;
  bool _isSubmittingRegister = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginIdentifierCtrl.dispose();
    _loginPasswordCtrl.dispose();
    _loginOtpCtrl.dispose();
    _regNameCtrl.dispose();
    _regEmailCtrl.dispose();
    _regPhoneCtrl.dispose();
    _regPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final identifier = _loginIdentifierCtrl.text.trim();

    if (identifier.isEmpty) {
      _showSnackBar('Please enter email address or phone number');
      return;
    }

    if (_loginMode == 'password') {
      final password = _loginPasswordCtrl.text.trim();
      if (password.isEmpty) {
        _showSnackBar('Please enter your password');
        return;
      }

      setState(() => _isSubmittingLogin = true);
      final res = await ApiService.login(identifier, password);

      if (mounted) {
        setState(() => _isSubmittingLogin = false);
        if (res['success'] == true) {
          _showSnackBar(res['message'], isError: false);
          widget.onLoginSuccess();
          Navigator.pop(context);
        } else {
          _showSnackBar(res['message']);
        }
      }
    } else {
      // OTP Verification Mode
      final otp = _loginOtpCtrl.text.trim();
      if (otp.isEmpty) {
        _showSnackBar('Please enter the 6-digit OTP code');
        return;
      }

      setState(() => _isSubmittingLogin = true);
      final res = await ApiService.verifyOTP(identifier, otp);

      if (mounted) {
        setState(() => _isSubmittingLogin = false);
        if (res['success'] == true) {
          _showSnackBar(res['message'], isError: false);
          widget.onLoginSuccess();
          Navigator.pop(context);
        } else {
          _showSnackBar(res['message']);
        }
      }
    }
  }

  Future<void> _handleSendOtp() async {
    final identifier = _loginIdentifierCtrl.text.trim();
    if (identifier.isEmpty) {
      _showSnackBar('Please enter your email or phone number first');
      return;
    }

    setState(() => _isSendingOtp = true);
    final res = await ApiService.sendOTP(identifier);

    if (mounted) {
      setState(() => _isSendingOtp = false);
      if (res['success'] == true) {
        setState(() => _otpSent = true);
        _showSnackBar(res['message'], isError: false);
      } else {
        _showSnackBar(res['message']);
      }
    }
  }

  Future<void> _handleRegister() async {
    final name = _regNameCtrl.text.trim();
    final email = _regEmailCtrl.text.trim();
    final phone = _regPhoneCtrl.text.trim();
    final password = _regPasswordCtrl.text.trim();

    if (name.isEmpty || email.isEmpty || phone.isEmpty || password.isEmpty) {
      _showSnackBar('Please fill in all registration fields');
      return;
    }

    setState(() => _isSubmittingRegister = true);

    final res = await ApiService.register(
      name: name,
      email: email,
      phone: phone,
      password: password,
    );

    if (mounted) {
      setState(() => _isSubmittingRegister = false);

      if (res['success'] == true) {
        _showSnackBar(res['message'], isError: false);
        widget.onLoginSuccess();
        Navigator.pop(context);
      } else {
        _showSnackBar(res['message']);
      }
    }
  }

  void _showSnackBar(String message, {bool isError = true}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isError ? Colors.red[900] : const Color(0xFF1B4D3E),
        content: Text(message, style: const TextStyle(color: Colors.white)),
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
              'SPY SALON ACCOUNT',
              style: TextStyle(
                color: Color(0xFFF6F2EB),
                fontSize: 15,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: goldColor,
          labelColor: goldColor,
          unselectedLabelColor: Colors.white54,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: const [
            Tab(text: 'SIGN IN'),
            Tab(text: 'CREATE ACCOUNT'),
          ],
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(24.0),
        child: SizedBox(
          height: 520,
          child: TabBarView(
            controller: _tabController,
            children: [
              // Tab 1: Sign In Form
              _buildSignInForm(goldColor, cardBg),
              // Tab 2: Create Account Form
              _buildRegisterForm(goldColor, cardBg),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSignInForm(Color goldColor, Color cardBg) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        const Text(
          'Welcome Back to SPY Salon',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        const SizedBox(height: 4),
        const Text(
          'Sign in with password or seamless 6-digit OTP',
          style: TextStyle(fontSize: 12, color: Colors.white54),
        ),
        const SizedBox(height: 16),
        // Mode Switcher Buttons (Password vs OTP)
        Row(
          children: [
            Expanded(
              child: ChoiceChip(
                label: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.lock_outline, size: 16),
                    SizedBox(width: 6),
                    Text('Password Login'),
                  ],
                ),
                selected: _loginMode == 'password',
                selectedColor: goldColor,
                labelStyle: TextStyle(
                  color: _loginMode == 'password' ? Colors.black : Colors.white70,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
                backgroundColor: cardBg,
                onSelected: (selected) {
                  if (selected) setState(() => _loginMode = 'password');
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ChoiceChip(
                label: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.vpn_key_outlined, size: 16),
                    SizedBox(width: 6),
                    Text('OTP Login'),
                  ],
                ),
                selected: _loginMode == 'otp',
                selectedColor: goldColor,
                labelStyle: TextStyle(
                  color: _loginMode == 'otp' ? Colors.black : Colors.white70,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
                backgroundColor: cardBg,
                onSelected: (selected) {
                  if (selected) setState(() => _loginMode = 'otp');
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _loginIdentifierCtrl,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Mobile Number / Email *',
            labelStyle: const TextStyle(color: Colors.white60),
            prefixIcon: Icon(Icons.person_outline, color: goldColor),
            filled: true,
            fillColor: cardBg,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (_loginMode == 'password') ...[
          TextField(
            controller: _loginPasswordCtrl,
            obscureText: _loginObscure,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Password',
              labelStyle: const TextStyle(color: Colors.white60),
              prefixIcon: Icon(Icons.lock_outline, color: goldColor),
              suffixIcon: IconButton(
                icon: Icon(
                  _loginObscure ? Icons.visibility_off : Icons.visibility,
                  color: Colors.white38,
                ),
                onPressed: () => setState(() => _loginObscure = !_loginObscure),
              ),
              filled: true,
              fillColor: cardBg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ] else ...[
          if (!_otpSent) ...[
            SizedBox(
              height: 46,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: goldColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isSendingOtp ? null : _handleSendOtp,
                icon: const Icon(Icons.key, color: Colors.black, size: 18),
                label: _isSendingOtp
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                    : const Text('Send 6-Digit OTP 🔑', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ),
          ] else ...[
            TextField(
              controller: _loginOtpCtrl,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white, letterSpacing: 3, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                labelText: 'Enter 6-Digit OTP',
                labelStyle: const TextStyle(color: Colors.white60, letterSpacing: 0),
                prefixIcon: Icon(Icons.mark_email_read_outlined, color: goldColor),
                filled: true,
                fillColor: cardBg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _isSendingOtp ? null : _handleSendOtp,
                child: Text('Resend OTP', style: TextStyle(color: goldColor, fontSize: 12)),
              ),
            ),
          ],
        ],
        const SizedBox(height: 20),
        if (_loginMode == 'password' || _otpSent) ...[
          SizedBox(
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: goldColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              onPressed: _isSubmittingLogin ? null : _handleLogin,
              child: _isSubmittingLogin
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                    )
                  : Text(
                      _loginMode == 'password' ? 'SIGN IN' : 'VERIFY & SIGN IN',
                      style: const TextStyle(
                        color: Color(0xFF13100E),
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        letterSpacing: 1.0,
                      ),
                    ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildRegisterForm(Color goldColor, Color cardBg) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        const Text(
          'Join SPY Salon',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        const SizedBox(height: 2),
        const Text(
          'Create an account to book treatments effortlessly',
          style: TextStyle(fontSize: 12, color: Colors.white54),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _regNameCtrl,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            labelText: 'Full Name',
            labelStyle: const TextStyle(color: Colors.white60, fontSize: 13),
            prefixIcon: Icon(Icons.badge_outlined, color: goldColor, size: 20),
            filled: true,
            fillColor: cardBg,
            isDense: true,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _regEmailCtrl,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            labelText: 'Email Address',
            labelStyle: const TextStyle(color: Colors.white60, fontSize: 13),
            prefixIcon: Icon(Icons.email_outlined, color: goldColor, size: 20),
            filled: true,
            fillColor: cardBg,
            isDense: true,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _regPhoneCtrl,
          keyboardType: TextInputType.phone,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            labelText: 'Mobile Phone',
            labelStyle: const TextStyle(color: Colors.white60, fontSize: 13),
            prefixIcon: Icon(Icons.phone_outlined, color: goldColor, size: 20),
            filled: true,
            fillColor: cardBg,
            isDense: true,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _regPasswordCtrl,
          obscureText: _regObscure,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            labelText: 'Password',
            labelStyle: const TextStyle(color: Colors.white60, fontSize: 13),
            prefixIcon: Icon(Icons.lock_outline, color: goldColor, size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                _regObscure ? Icons.visibility_off : Icons.visibility,
                color: Colors.white38,
                size: 18,
              ),
              onPressed: () => setState(() => _regObscure = !_regObscure),
            ),
            filled: true,
            fillColor: cardBg,
            isDense: true,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          height: 46,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: goldColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(23),
              ),
            ),
            onPressed: _isSubmittingRegister ? null : _handleRegister,
            child: _isSubmittingRegister
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                  )
                : const Text(
                    'CREATE ACCOUNT',
                    style: TextStyle(
                      color: Color(0xFF13100E),
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      letterSpacing: 1.0,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
