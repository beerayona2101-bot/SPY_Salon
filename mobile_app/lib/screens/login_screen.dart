import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import 'backend_settings_screen.dart';
import 'customer_dashboard_screen.dart';
import 'employee_dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginScreen({super.key, required this.onLoginSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isRegisterMode = false;

  // Sign In Controllers
  final _loginIdentifierCtrl = TextEditingController();
  final _loginPasswordCtrl = TextEditingController();
  bool _loginObscure = true;
  bool _isSubmittingLogin = false;

  // Register Controllers
  final _regNameCtrl = TextEditingController();
  final _regEmailCtrl = TextEditingController();
  final _regPhoneCtrl = TextEditingController();
  final _regPasswordCtrl = TextEditingController();
  final _regConfirmPasswordCtrl = TextEditingController();
  bool _regObscure = true;
  bool _regConfirmObscure = true;
  bool _isSubmittingRegister = false;

  @override
  void dispose() {
    _loginIdentifierCtrl.dispose();
    _loginPasswordCtrl.dispose();
    _regNameCtrl.dispose();
    _regEmailCtrl.dispose();
    _regPhoneCtrl.dispose();
    _regPasswordCtrl.dispose();
    _regConfirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final identifier = _loginIdentifierCtrl.text.trim();

    if (identifier.isEmpty) {
      _showSnackBar('Please enter your Email Address');
      return;
    }

    // Require valid email format (or employee code starting with emp)
    final isEmpCode = identifier.toLowerCase().startsWith('emp');
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!isEmpCode && !emailRegex.hasMatch(identifier)) {
      _showSnackBar('Please enter a valid email address');
      return;
    }

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
        final user = res['user'] ?? await ApiService.getStoredUser();
        final role = (user?['role'] ?? 'customer').toString().toLowerCase();
        final isAdmin = role == 'admin' || role == 'manager';
        final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

        if (isAdmin) {
          await ApiService.clearSession();
          if (mounted) {
            _showSnackBar('Admin access is not available in the mobile app. Please log in via the Web Admin Portal.');
          }
          return;
        }

        _showSnackBar(res['message'], isError: false);
        widget.onLoginSuccess();
        RealtimeService().connect();

        if (isStaff && mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (ctx) => const EmployeeDashboardScreen()),
            (route) => false,
          );
        } else if (mounted) {
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          } else {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (ctx) => const CustomerDashboardScreen()),
              (route) => false,
            );
          }
        }
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
    final confirmPassword = _regConfirmPasswordCtrl.text.trim();

    if (name.isEmpty || email.isEmpty || phone.isEmpty || password.isEmpty || confirmPassword.isEmpty) {
      _showSnackBar('Please fill in all registration fields');
      return;
    }

    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(email)) {
      _showSnackBar('Please enter a valid email address');
      return;
    }

    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    if (cleanPhone.length < 10) {
      _showSnackBar('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    if (password.length < 6) {
      _showSnackBar('Password must be at least 6 characters long');
      return;
    }

    if (password != confirmPassword) {
      _showSnackBar('Passwords do not match');
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
        final user = res['user'] ?? await ApiService.getStoredUser();
        final role = (user?['role'] ?? 'customer').toString().toLowerCase();
        final isAdmin = role == 'admin' || role == 'manager';
        final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

        if (isAdmin) {
          await ApiService.clearSession();
          if (mounted) {
            _showSnackBar('Admin access is not available in the mobile app. Please log in via the Web Admin Portal.');
          }
          return;
        }

        _showSnackBar(res['message'], isError: false);
        widget.onLoginSuccess();
        RealtimeService().connect();

        if (isStaff && mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (ctx) => const EmployeeDashboardScreen()),
            (route) => false,
          );
        } else if (mounted) {
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          } else {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (ctx) => const CustomerDashboardScreen()),
              (route) => false,
            );
          }
        }
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

  Future<void> _openBackendSettings() async {
    final updated = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (ctx) => const BackendSettingsScreen()),
    );
    if (updated == true && mounted) {
      setState(() {});
    }
  }

  void _showForgotPasswordDialog() {
    final emailCtrl = TextEditingController(text: _loginIdentifierCtrl.text.trim());
    bool isSending = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            const goldColor = Color(0xFFE0A96D);
            const darkBg = Color(0xFF13100E);
            const cardBg = Color(0xFF191512);

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom,
              ),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: const BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  border: Border(top: BorderSide(color: goldColor, width: 1.5)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Reset Password',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFF6F2EB),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white54),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Enter your registered email address below to receive password reset instructions.',
                      style: TextStyle(fontSize: 12, color: Colors.white60),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        labelText: 'Email Address *',
                        labelStyle: const TextStyle(color: Colors.white70, fontSize: 13),
                        prefixIcon: const Icon(Icons.email_outlined, color: goldColor, size: 20),
                        filled: true,
                        fillColor: darkBg.withValues(alpha: 0.7),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: goldColor.withValues(alpha: 0.2)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: goldColor, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: goldColor,
                          foregroundColor: darkBg,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        ),
                        onPressed: isSending
                            ? null
                            : () async {
                                final email = emailCtrl.text.trim();
                                if (email.isEmpty || !email.contains('@')) {
                                  _showSnackBar('Please enter a valid email address');
                                  return;
                                }
                                setModalState(() => isSending = true);
                                final res = await ApiService.sendOTP(email);
                                setModalState(() => isSending = false);
                                if (!modalCtx.mounted) return;
                                Navigator.pop(modalCtx);
                                _showSnackBar(res['message'] ?? 'Password reset OTP sent to your email.', isError: res['success'] != true);
                              },
                        child: isSending
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: darkBg))
                            : const Text('SEND RESET CODE', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.0)),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFE0A96D);
    const darkBg = Color(0xFF13100E);
    const cardBg = Color(0xFF191512);

    return Scaffold(
      backgroundColor: darkBg,
      body: Stack(
        children: [
          // Background luxury salon photo (matching SplashScreen)
          Positioned.fill(
            child: Image.asset(
              'assets/images/splash_bg.png',
              fit: BoxFit.cover,
              errorBuilder: (ctx, err, stack) => Container(color: darkBg),
            ),
          ),

          // Dark Overlay Gradient (matching SplashScreen)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.95,
                  colors: [
                    darkBg.withValues(alpha: 0.80),
                    darkBg.withValues(alpha: 0.96),
                  ],
                ),
              ),
            ),
          ),

          // Content wrapped with SafeArea & LayoutBuilder for responsive mobile layout
          SafeArea(
            child: LayoutBuilder(
              builder: (ctx, constraints) {
                final screenHeight = constraints.maxHeight;

                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: screenHeight,
                    ),
                    child: IntrinsicHeight(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0),
                        child: Column(
                          children: [
                            // Top Header Bar: Back button & Settings icon
                            Padding(
                              padding: EdgeInsets.only(
                                top: (screenHeight * 0.012).clamp(6.0, 16.0),
                                bottom: 4.0,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  if (Navigator.canPop(context))
                                    IconButton(
                                      constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                                      icon: const Icon(Icons.arrow_back_ios_new, color: goldColor, size: 20),
                                      onPressed: () {
                                        if (Navigator.canPop(context)) {
                                          Navigator.pop(context);
                                        }
                                      },
                                    )
                                  else
                                    const SizedBox(width: 48),
                                  IconButton(
                                    constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                                    tooltip: 'Backend Settings',
                                    icon: const Icon(Icons.settings_outlined, color: goldColor, size: 22),
                                    onPressed: _openBackendSettings,
                                  ),
                                ],
                              ),
                            ),

                            // Flexible top spacer to center logo & card comfortably
                            const Spacer(flex: 1),

                            // Glowing SPY Salon Logo Badge (Matching Web Reference)
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                                border: Border.all(color: goldColor.withValues(alpha: 0.5), width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: goldColor.withValues(alpha: 0.45),
                                    blurRadius: 28,
                                    spreadRadius: 4,
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: Image.asset(
                                  'assets/images/logo.png',
                                  fit: BoxFit.cover,
                                  errorBuilder: (ctx, err, stack) => const Center(
                                    child: Text(
                                      'S',
                                      style: TextStyle(
                                        color: goldColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 36,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Page Title
                            Text(
                              _isRegisterMode ? 'Join SPY Salon' : 'Sign In to SPY Salon',
                              style: const TextStyle(
                                color: Color(0xFFF6F2EB),
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 6),

                            // Subtitle
                            Text(
                              _isRegisterMode
                                  ? 'Create an account to book treatments effortlessly'
                                  : 'Enter your credentials below to access your account',
                              style: const TextStyle(
                                color: Colors.white60,
                                fontSize: 12,
                                height: 1.4,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 22),

                            // Main Rounded Glassmorphism Login Card (Matching Web Reference)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
                              decoration: BoxDecoration(
                                color: cardBg.withValues(alpha: 0.92),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: goldColor.withValues(alpha: 0.3)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.55),
                                    blurRadius: 24,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: _isRegisterMode
                                  ? _buildRegisterForm(goldColor, darkBg)
                                  : _buildSignInForm(goldColor, darkBg),
                            ),

                            // Flexible bottom spacer
                            const Spacer(flex: 2),

                            const SizedBox(height: 8),
                            TextButton.icon(
                              onPressed: _openBackendSettings,
                              icon: const Icon(Icons.tune_rounded, color: Colors.white30, size: 15),
                              label: const Text(
                                'Backend Settings',
                                style: TextStyle(
                                  color: Colors.white30,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignInForm(Color goldColor, Color darkBg) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        // EMAIL ADDRESS *
        const Text(
          'EMAIL ADDRESS *',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Color(0xFFF6F2EB),
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _loginIdentifierCtrl,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: 'Enter registered email address',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
            prefixIcon: Icon(Icons.email_outlined, color: goldColor, size: 20),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: goldColor.withValues(alpha: 0.25)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: goldColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 18),

        // PASSWORD * + Forgot password?
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'PASSWORD *',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFFF6F2EB),
                letterSpacing: 1.0,
              ),
            ),
            GestureDetector(
              onTap: _showForgotPasswordDialog,
              child: Text(
                'Forgot password?',
                style: TextStyle(
                  color: goldColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _loginPasswordCtrl,
          obscureText: _loginObscure,
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
            prefixIcon: Icon(Icons.lock_outline, color: goldColor, size: 20),
            suffixIcon: IconButton(
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              icon: Icon(
                _loginObscure ? Icons.visibility_off : Icons.visibility,
                color: Colors.white54,
                size: 20,
              ),
              onPressed: () => setState(() => _loginObscure = !_loginObscure),
            ),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: goldColor.withValues(alpha: 0.25)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: goldColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // SIGN IN  → Button
        SizedBox(
          height: 50,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: goldColor,
              foregroundColor: darkBg,
              elevation: 6,
              shadowColor: goldColor.withValues(alpha: 0.45),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
            ),
            onPressed: _isSubmittingLogin ? null : _handleLogin,
            child: _isSubmittingLogin
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: darkBg),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'SIGN IN',
                        style: TextStyle(
                          color: Color(0xFF13100E),
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          letterSpacing: 1.2,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 18,
                        color: Color(0xFF13100E),
                      ),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 20),

        // Divider
        const Divider(color: Colors.white12, height: 1),
        const SizedBox(height: 16),

        // New client? Create Account →
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'New client?  ',
              style: TextStyle(
                color: Colors.white60,
                fontSize: 13,
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _isRegisterMode = true),
              child: Text(
                'Create Account →',
                style: TextStyle(
                  color: goldColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRegisterForm(Color goldColor, Color darkBg) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'FULL NAME *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFF6F2EB), letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regNameCtrl,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: 'Enter your full name',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
            prefixIcon: Icon(Icons.badge_outlined, color: goldColor, size: 18),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor.withValues(alpha: 0.25))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'EMAIL ADDRESS *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFF6F2EB), letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regEmailCtrl,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: 'Enter email address',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
            prefixIcon: Icon(Icons.email_outlined, color: goldColor, size: 18),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor.withValues(alpha: 0.25))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'MOBILE PHONE *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFF6F2EB), letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regPhoneCtrl,
          keyboardType: TextInputType.phone,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: 'Enter 10-digit mobile number',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
            prefixIcon: Icon(Icons.phone_outlined, color: goldColor, size: 18),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor.withValues(alpha: 0.25))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'PASSWORD *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFF6F2EB), letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regPasswordCtrl,
          obscureText: _regObscure,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
            prefixIcon: Icon(Icons.lock_outline, color: goldColor, size: 18),
            suffixIcon: IconButton(
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              icon: Icon(_regObscure ? Icons.visibility_off : Icons.visibility, color: Colors.white54, size: 18),
              onPressed: () => setState(() => _regObscure = !_regObscure),
            ),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor.withValues(alpha: 0.25))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'CONFIRM PASSWORD *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFF6F2EB), letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regConfirmPasswordCtrl,
          obscureText: _regConfirmObscure,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
            prefixIcon: Icon(Icons.lock_reset_outlined, color: goldColor, size: 18),
            suffixIcon: IconButton(
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              icon: Icon(_regConfirmObscure ? Icons.visibility_off : Icons.visibility, color: Colors.white54, size: 18),
              onPressed: () => setState(() => _regConfirmObscure = !_regConfirmObscure),
            ),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor.withValues(alpha: 0.25))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: goldColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          height: 50,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: goldColor,
              foregroundColor: darkBg,
              elevation: 6,
              shadowColor: goldColor.withValues(alpha: 0.45),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
            ),
            onPressed: _isSubmittingRegister ? null : _handleRegister,
            child: _isSubmittingRegister
                ? SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: darkBg))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('CREATE ACCOUNT', style: TextStyle(color: Color(0xFF13100E), fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 1.2)),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, size: 18, color: Color(0xFF13100E)),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 18),
        const Divider(color: Colors.white12, height: 1),
        const SizedBox(height: 14),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Already have an account?  ', style: TextStyle(color: Colors.white60, fontSize: 13)),
            GestureDetector(
              onTap: () => setState(() => _isRegisterMode = false),
              child: Text('Sign In →', style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ],
        ),
      ],
    );
  }
}
