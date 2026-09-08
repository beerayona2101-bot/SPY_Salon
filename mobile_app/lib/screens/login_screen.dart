import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'admin_dashboard_screen.dart';
import 'customer_dashboard_screen.dart';
import 'employee_dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginScreen({super.key, required this.onLoginSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

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
    _regNameCtrl.dispose();
    _regEmailCtrl.dispose();
    _regPhoneCtrl.dispose();
    _regPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final identifier = _loginIdentifierCtrl.text.trim();

    if (identifier.isEmpty) {
      _showSnackBar('Please enter Email or Mobile');
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
        _showSnackBar(res['message'], isError: false);
        widget.onLoginSuccess();

        final user = res['user'] ?? await ApiService.getStoredUser();
        final role = (user?['role'] ?? 'customer').toString().toLowerCase();
        final isAdmin = role == 'admin' || role == 'manager';
        final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

        if (isAdmin && mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (ctx) => const AdminDashboardScreen()),
            (route) => false,
          );
        } else if (isStaff && mounted) {
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

        if (mounted) {
          final user = res['user'] ?? await ApiService.getStoredUser();
          final role = (user?['role'] ?? 'customer').toString().toLowerCase();
          final isAdmin = role == 'admin' || role == 'manager';
          final isStaff = role == 'employee' || role == 'stylist' || role == 'receptionist' || role == 'barber';

          if (isAdmin && mounted) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (ctx) => const AdminDashboardScreen()),
              (route) => false,
            );
          } else if (isStaff && mounted) {
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

          // Content
          SafeArea(
            child: Column(
              children: [
                // Top Header Row with Back button & Tagline
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      if (Navigator.canPop(context))
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new, color: goldColor, size: 20),
                          onPressed: () {
                            if (Navigator.canPop(context)) {
                              Navigator.pop(context);
                            }
                          },
                        ),
                      const Spacer(),
                      const Text(
                        'BEAUTY | STYLE | CONFIDENCE',
                        style: TextStyle(
                          color: Colors.white38,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.8,
                        ),
                      ),
                      const Spacer(),
                      const SizedBox(width: 40),
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                    child: Column(
                      children: [
                        // Circle Logo Badge with Gold Glow (matching SplashScreen)
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: goldColor, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: goldColor.withValues(alpha: 0.40),
                                blurRadius: 24,
                                spreadRadius: 3,
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
                                    fontSize: 32,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'SPY SALON',
                          style: TextStyle(
                            color: Color(0xFFF6F2EB),
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2.8,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'LUXURY BEAUTY STUDIO & BOTANICAL SPA',
                          style: TextStyle(
                            color: goldColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.4,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Luxury Tab Bar Container
                        Container(
                          height: 48,
                          decoration: BoxDecoration(
                            color: cardBg.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: goldColor.withValues(alpha: 0.35)),
                          ),
                          child: TabBar(
                            controller: _tabController,
                            indicator: BoxDecoration(
                              color: goldColor,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: goldColor.withValues(alpha: 0.4),
                                  blurRadius: 8,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            labelColor: darkBg,
                            unselectedLabelColor: Colors.white70,
                            labelStyle: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              letterSpacing: 1.0,
                            ),
                            unselectedLabelStyle: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                            tabs: const [
                              Tab(text: 'SIGN IN'),
                              Tab(text: 'CREATE ACCOUNT'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Glassmorphism Elevated Form Card
                        Container(
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            color: cardBg.withValues(alpha: 0.90),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: goldColor.withValues(alpha: 0.25)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.5),
                                blurRadius: 20,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: AnimatedBuilder(
                            animation: _tabController,
                            builder: (ctx, child) {
                              return _tabController.index == 0
                                  ? _buildSignInForm(goldColor, darkBg)
                                  : _buildRegisterForm(goldColor, darkBg);
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ],
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
        const Text(
          'Welcome Back',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFFF6F2EB),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Sign in to access your luxury appointments',
          style: TextStyle(fontSize: 12, color: Colors.white60),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _loginIdentifierCtrl,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            labelText: 'Email or Mobile *',
            labelStyle: const TextStyle(color: Colors.white70, fontSize: 13),
            hintText: 'Enter registered email or phone',
            hintStyle: const TextStyle(color: Colors.white30, fontSize: 12),
            prefixIcon: Icon(Icons.person_outline, color: goldColor, size: 20),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: goldColor.withValues(alpha: 0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: goldColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _loginPasswordCtrl,
          obscureText: _loginObscure,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            labelText: 'Password *',
            labelStyle: const TextStyle(color: Colors.white70, fontSize: 13),
            hintText: '••••••••',
            hintStyle: const TextStyle(color: Colors.white30, fontSize: 12),
            prefixIcon: Icon(Icons.lock_outline, color: goldColor, size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                _loginObscure ? Icons.visibility_off : Icons.visibility,
                color: Colors.white54,
                size: 20,
              ),
              onPressed: () => setState(() => _loginObscure = !_loginObscure),
            ),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: goldColor.withValues(alpha: 0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: goldColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          height: 48,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: goldColor,
              foregroundColor: darkBg,
              elevation: 6,
              shadowColor: goldColor.withValues(alpha: 0.4),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
            ),
            onPressed: _isSubmittingLogin ? null : _handleLogin,
            child: _isSubmittingLogin
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: darkBg),
                  )
                : const Text(
                    'SIGN IN',
                    style: TextStyle(
                      color: Color(0xFF13100E),
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      letterSpacing: 1.2,
                    ),
                  ),
          ),
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
          'Join SPY Salon',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFFF6F2EB),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Create an account to book treatments effortlessly',
          style: TextStyle(fontSize: 12, color: Colors.white60),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _regNameCtrl,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            labelText: 'Full Name *',
            labelStyle: const TextStyle(color: Colors.white70, fontSize: 12),
            prefixIcon: Icon(Icons.badge_outlined, color: goldColor, size: 18),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: goldColor.withValues(alpha: 0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: goldColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _regEmailCtrl,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            labelText: 'Email Address *',
            labelStyle: const TextStyle(color: Colors.white70, fontSize: 12),
            prefixIcon: Icon(Icons.email_outlined, color: goldColor, size: 18),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: goldColor.withValues(alpha: 0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: goldColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _regPhoneCtrl,
          keyboardType: TextInputType.phone,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            labelText: 'Mobile Phone *',
            labelStyle: const TextStyle(color: Colors.white70, fontSize: 12),
            prefixIcon: Icon(Icons.phone_outlined, color: goldColor, size: 18),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: goldColor.withValues(alpha: 0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: goldColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _regPasswordCtrl,
          obscureText: _regObscure,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            labelText: 'Password *',
            labelStyle: const TextStyle(color: Colors.white70, fontSize: 12),
            prefixIcon: Icon(Icons.lock_outline, color: goldColor, size: 18),
            suffixIcon: IconButton(
              icon: Icon(
                _regObscure ? Icons.visibility_off : Icons.visibility,
                color: Colors.white54,
                size: 18,
              ),
              onPressed: () => setState(() => _regObscure = !_regObscure),
            ),
            filled: true,
            fillColor: darkBg.withValues(alpha: 0.7),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: goldColor.withValues(alpha: 0.2)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: goldColor, width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 46,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: goldColor,
              foregroundColor: darkBg,
              elevation: 6,
              shadowColor: goldColor.withValues(alpha: 0.4),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(23),
              ),
            ),
            onPressed: _isSubmittingRegister ? null : _handleRegister,
            child: _isSubmittingRegister
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: darkBg),
                  )
                : const Text(
                    'CREATE ACCOUNT',
                    style: TextStyle(
                      color: Color(0xFF13100E),
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      letterSpacing: 1.2,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
