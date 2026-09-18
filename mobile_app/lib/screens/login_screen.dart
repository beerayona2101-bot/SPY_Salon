import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import '../theme/app_colors.dart';
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
    final themeColors = AppColors.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isError ? themeColors.error : themeColors.success,
        content: Text(message, style: const TextStyle(color: Colors.white)),
      ),
    );
  }

  void _showForgotPasswordDialog() {
    final emailCtrl = TextEditingController(text: _loginIdentifierCtrl.text.trim());
    bool isSending = false;
    final themeColors = AppColors.of(context);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            final primaryColor = themeColors.primary;
            final cardBg = themeColors.cardSurface;
            final bg = themeColors.deepestBackground;

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom,
              ),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                  border: Border(top: BorderSide(color: primaryColor, width: 1.5)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Reset Password',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: themeColors.textPrimary,
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.close, color: themeColors.textMuted),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Enter your registered email address below to receive password reset instructions.',
                      style: TextStyle(fontSize: 12, color: themeColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      style: TextStyle(color: themeColors.textPrimary, fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        labelText: 'Email Address *',
                        labelStyle: TextStyle(color: themeColors.textMuted, fontSize: 13),
                        prefixIcon: Icon(Icons.email_outlined, color: primaryColor, size: 20),
                        filled: true,
                        fillColor: bg,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: themeColors.cardBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: primaryColor, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: themeColors.buttonTextPrimary,
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
                            ? SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: themeColors.buttonTextPrimary,
                                ),
                              )
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
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final bg = themeColors.deepestBackground;
    final cardBg = themeColors.cardSurface;

    return Scaffold(
      backgroundColor: bg,
      body: Stack(
        children: [
          // Background luxury salon photo (matching SplashScreen)
          Positioned.fill(
            child: Image.asset(
              'assets/images/splash_bg.png',
              fit: BoxFit.cover,
              errorBuilder: (ctx, err, stack) => Container(color: bg),
            ),
          ),

          // Overlay Gradient (matching SplashScreen)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.95,
                  colors: [
                    bg.withValues(alpha: 0.80),
                    bg.withValues(alpha: 0.96),
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
                            // Top Header Bar: Back button
                            Padding(
                              padding: EdgeInsets.only(
                                top: (screenHeight * 0.012).clamp(6.0, 16.0),
                                bottom: 4.0,
                              ),
                              child: Row(
                                children: [
                                  if (Navigator.canPop(context))
                                    IconButton(
                                      constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                                      icon: Icon(Icons.arrow_back_ios_new, color: primaryColor, size: 20),
                                      onPressed: () {
                                        if (Navigator.canPop(context)) {
                                          Navigator.pop(context);
                                        }
                                      },
                                    )
                                  else
                                    const SizedBox(width: 48),
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
                                color: themeColors.cardSurface,
                                border: Border.all(color: primaryColor.withValues(alpha: 0.5), width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryColor.withValues(alpha: 0.45),
                                    blurRadius: 28,
                                    spreadRadius: 4,
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: Image.asset(
                                  'assets/images/logo.png',
                                  fit: BoxFit.cover,
                                  errorBuilder: (ctx, err, stack) => Center(
                                    child: Text(
                                      'S',
                                      style: TextStyle(
                                        color: primaryColor,
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
                              style: TextStyle(
                                color: themeColors.textPrimary,
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
                              style: TextStyle(
                                color: themeColors.textSecondary,
                                fontSize: 12,
                                height: 1.4,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 22),

                            // Main Rounded Login Card
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
                              decoration: BoxDecoration(
                                color: cardBg.withValues(alpha: 0.92),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: themeColors.cardBorder),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.25),
                                    blurRadius: 24,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: _isRegisterMode
                                  ? _buildRegisterForm(themeColors)
                                  : _buildSignInForm(themeColors),
                            ),

                            // Flexible bottom spacer
                            const Spacer(flex: 2),

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

  Widget _buildSignInForm(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final buttonTextColor = themeColors.buttonTextPrimary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        // EMAIL ADDRESS *
        Text(
          'EMAIL ADDRESS *',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: themeColors.textPrimary,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _loginIdentifierCtrl,
          keyboardType: TextInputType.emailAddress,
          style: TextStyle(color: themeColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: 'Enter registered email address',
            hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 13),
            prefixIcon: Icon(Icons.email_outlined, color: primaryColor, size: 20),
            filled: true,
            fillColor: themeColors.inputBackground,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: themeColors.cardBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: primaryColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 18),

        // PASSWORD * + Forgot password?
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'PASSWORD *',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: themeColors.textPrimary,
                letterSpacing: 1.0,
              ),
            ),
            GestureDetector(
              onTap: _showForgotPasswordDialog,
              child: Text(
                'Forgot password?',
                style: TextStyle(
                  color: primaryColor,
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
          style: TextStyle(color: themeColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 13),
            prefixIcon: Icon(Icons.lock_outline, color: primaryColor, size: 20),
            suffixIcon: IconButton(
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              icon: Icon(
                _loginObscure ? Icons.visibility_off : Icons.visibility,
                color: themeColors.textMuted,
                size: 20,
              ),
              onPressed: () => setState(() => _loginObscure = !_loginObscure),
            ),
            filled: true,
            fillColor: themeColors.inputBackground,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: themeColors.cardBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: primaryColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // SIGN IN  → Button
        SizedBox(
          height: 50,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: buttonTextColor,
              elevation: 6,
              shadowColor: primaryColor.withValues(alpha: 0.45),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
            ),
            onPressed: _isSubmittingLogin ? null : _handleLogin,
            child: _isSubmittingLogin
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: buttonTextColor),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'SIGN IN',
                        style: TextStyle(
                          color: buttonTextColor,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_rounded,
                        size: 18,
                        color: buttonTextColor,
                      ),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 20),

        // Divider
        Divider(color: themeColors.divider, height: 1),
        const SizedBox(height: 16),

        // New client? Create Account →
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'New client?  ',
              style: TextStyle(
                color: themeColors.textSecondary,
                fontSize: 13,
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _isRegisterMode = true),
              child: Text(
                'Create Account →',
                style: TextStyle(
                  color: primaryColor,
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

  Widget _buildRegisterForm(AppColors themeColors) {
    final primaryColor = themeColors.primary;
    final buttonTextColor = themeColors.buttonTextPrimary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'FULL NAME *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: themeColors.textPrimary, letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regNameCtrl,
          style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: 'Enter your full name',
            hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
            prefixIcon: Icon(Icons.badge_outlined, color: primaryColor, size: 18),
            filled: true,
            fillColor: themeColors.inputBackground,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: primaryColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'EMAIL ADDRESS *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: themeColors.textPrimary, letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regEmailCtrl,
          keyboardType: TextInputType.emailAddress,
          style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: 'Enter email address',
            hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
            prefixIcon: Icon(Icons.email_outlined, color: primaryColor, size: 18),
            filled: true,
            fillColor: themeColors.inputBackground,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: primaryColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'MOBILE PHONE *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: themeColors.textPrimary, letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regPhoneCtrl,
          keyboardType: TextInputType.phone,
          style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: 'Enter 10-digit mobile number',
            hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
            prefixIcon: Icon(Icons.phone_outlined, color: primaryColor, size: 18),
            filled: true,
            fillColor: themeColors.inputBackground,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: primaryColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'PASSWORD *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: themeColors.textPrimary, letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regPasswordCtrl,
          obscureText: _regObscure,
          style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
            prefixIcon: Icon(Icons.lock_outline, color: primaryColor, size: 18),
            suffixIcon: IconButton(
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              icon: Icon(_regObscure ? Icons.visibility_off : Icons.visibility, color: themeColors.textMuted, size: 18),
              onPressed: () => setState(() => _regObscure = !_regObscure),
            ),
            filled: true,
            fillColor: themeColors.inputBackground,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: primaryColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'CONFIRM PASSWORD *',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: themeColors.textPrimary, letterSpacing: 1.0),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _regConfirmPasswordCtrl,
          obscureText: _regConfirmObscure,
          style: TextStyle(color: themeColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: TextStyle(color: themeColors.textMuted, fontSize: 12),
            prefixIcon: Icon(Icons.lock_reset_outlined, color: primaryColor, size: 18),
            suffixIcon: IconButton(
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
              icon: Icon(_regConfirmObscure ? Icons.visibility_off : Icons.visibility, color: themeColors.textMuted, size: 18),
              onPressed: () => setState(() => _regConfirmObscure = !_regConfirmObscure),
            ),
            filled: true,
            fillColor: themeColors.inputBackground,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: themeColors.cardBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: primaryColor, width: 1.5)),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          height: 50,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: buttonTextColor,
              elevation: 6,
              shadowColor: primaryColor.withValues(alpha: 0.45),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
            ),
            onPressed: _isSubmittingRegister ? null : _handleRegister,
            child: _isSubmittingRegister
                ? SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: buttonTextColor))
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('CREATE ACCOUNT', style: TextStyle(color: buttonTextColor, fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 1.2)),
                      const SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, size: 18, color: buttonTextColor),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 18),
        Divider(color: themeColors.divider, height: 1),
        const SizedBox(height: 14),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Already have an account?  ', style: TextStyle(color: themeColors.textSecondary, fontSize: 13)),
            GestureDetector(
              onTap: () => setState(() => _isRegisterMode = false),
              child: Text('Sign In →', style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ],
        ),
      ],
    );
  }
}

