import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';

class BackendSettingsScreen extends StatefulWidget {
  const BackendSettingsScreen({super.key});

  @override
  State<BackendSettingsScreen> createState() => _BackendSettingsScreenState();
}

class _BackendSettingsScreenState extends State<BackendSettingsScreen> {
  late TextEditingController _urlController;
  bool _isTesting = false;
  bool _isSaving = false;
  Map<String, dynamic>? _testResult;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: ApiConfig.baseUrl);
    _runInitialTest();
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _runInitialTest() async {
    _handleTestConnection(silent: true);
  }

  Future<void> _handleTestConnection({bool silent = false}) async {
    final rawInput = _urlController.text.trim();
    if (rawInput.isEmpty) {
      if (!silent) _showSnackBar('Please enter a backend URL');
      return;
    }

    if (!ApiConfig.isValidUrl(rawInput)) {
      if (!silent) _showSnackBar('Invalid URL format. Please enter a valid http:// or https:// URL.');
      return;
    }

    setState(() {
      _isTesting = true;
      _testResult = null;
    });

    final res = await ApiService.testConnection(rawInput);

    if (mounted) {
      setState(() {
        _isTesting = false;
        _testResult = res;
      });

      if (!silent) {
        if (res['connected'] == true) {
          _showSnackBar('✓ Connection successful! (${res['latencyMs']} ms)', isError: false);
        } else {
          _showSnackBar('✕ Connection failed: ${res['message']}');
        }
      }
    }
  }

  Future<void> _handleSave() async {
    final colors = AppColors.of(context);
    final rawInput = _urlController.text.trim();

    if (rawInput.isEmpty) {
      _showSnackBar('Please enter a backend URL');
      return;
    }

    if (!ApiConfig.isValidUrl(rawInput)) {
      _showSnackBar('Invalid URL. Please enter a valid HTTP or HTTPS server address.');
      return;
    }

    final normalized = ApiConfig.normalizeUrl(rawInput);

    setState(() => _isSaving = true);

    // Test connection if not done yet
    Map<String, dynamic> testRes = _testResult ?? await ApiService.testConnection(normalized);

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (testRes['connected'] == true) {
      await ApiService.updateBackendUrl(normalized);
      if (mounted) {
        _showSnackBar('Backend URL saved successfully!', isError: false);
        Navigator.pop(context, true);
      }
    } else {
      // Prompt user option to override if connection failed
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: colors.cardSurface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: colors.primary, width: 1.5),
          ),
          title: Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: colors.warning, size: 24),
              const SizedBox(width: 10),
              Text(
                'Unreachable Server',
                style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: Text(
            'The connection test to "$normalized" failed (${testRes['message']}).\n\nDo you still want to save this backend URL?',
            style: TextStyle(color: colors.textSecondary, fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text('CANCEL', style: TextStyle(color: colors.textMuted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: colors.primary,
                foregroundColor: colors.buttonTextPrimary,
              ),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('SAVE ANYWAY', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );

      if (confirm == true && mounted) {
        await ApiService.updateBackendUrl(normalized);
        if (mounted) {
          _showSnackBar('Backend URL saved.', isError: false);
          Navigator.pop(context, true);
        }
      }
    }
  }

  Future<void> _handleReset() async {
    final colors = AppColors.of(context);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.cardSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: colors.primary, width: 1),
        ),
        title: Text(
          'Reset Backend Configuration?',
          style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'This will restore the default configuration (${ApiConfig.defaultBaseUrl}).',
          style: TextStyle(color: colors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('CANCEL', style: TextStyle(color: colors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.roseSecondary,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('RESET', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await ApiConfig.resetToDefault();
      _urlController.text = ApiConfig.baseUrl;
      _handleTestConnection(silent: false);
      _showSnackBar('Reset backend configuration to default', isError: false);
    }
  }

  void _showSnackBar(String message, {bool isError = true}) {
    if (!mounted) return;
    final colors = AppColors.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isError ? colors.error : colors.success,
        content: Text(message, style: TextStyle(color: colors.buttonTextPrimary)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final goldColor = colors.primary;
    final darkBg = colors.background;
    final cardBg = colors.cardSurface;

    final currentNormalized = ApiConfig.normalizeUrl(_urlController.text);
    final isHttpOnly = currentNormalized.startsWith('http://') &&
        !currentNormalized.contains('localhost') &&
        !currentNormalized.contains('127.0.0.1') &&
        !currentNormalized.contains('192.168.') &&
        !currentNormalized.contains('10.0.');

    return Scaffold(
      backgroundColor: darkBg,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: goldColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Backend Settings',
              style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              'REST API & Realtime Server Configuration',
              style: TextStyle(color: goldColor, fontSize: 10, letterSpacing: 0.8),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Reset to Default',
            icon: Icon(Icons.restart_alt_rounded, color: colors.textMuted),
            onPressed: _handleReset,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Current Config Summary Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: goldColor.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.dns_outlined, color: goldColor, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Active Backend Endpoint',
                          style: TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: goldColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            ApiConfig.baseUrl == ApiConfig.defaultBaseUrl ? 'SYSTEM DEFAULT' : 'CUSTOM',
                            style: TextStyle(color: goldColor, fontSize: 9, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      ApiConfig.displayApiUrl,
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Server URL Form Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colors.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 16,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Server Backend URL',
                      style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Enter domain, IP, or full endpoint (e.g. https://hairsalon.speshway.site)',
                      style: TextStyle(color: colors.textSecondary, fontSize: 11),
                    ),
                    const SizedBox(height: 14),

                    TextField(
                      controller: _urlController,
                      style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                      onChanged: (_) {
                        setState(() {
                          _testResult = null;
                        });
                      },
                      decoration: InputDecoration(
                        labelText: 'Backend Address *',
                        labelStyle: TextStyle(color: colors.textSecondary, fontSize: 13),
                        prefixIcon: Icon(Icons.link_rounded, color: goldColor, size: 20),
                        suffixIcon: _urlController.text.isNotEmpty
                            ? IconButton(
                                icon: Icon(Icons.cancel, color: colors.textMuted, size: 18),
                                onPressed: () {
                                  _urlController.clear();
                                  setState(() => _testResult = null);
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: colors.inputBackground,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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

                    const SizedBox(height: 8),

                    // Live Normalization Preview
                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: Text(
                        'Will connect to: $currentNormalized/api/v1',
                        style: TextStyle(
                          color: colors.textMuted,
                          fontSize: 11,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ),

                    if (isHttpOnly) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: colors.warning.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: colors.warning.withValues(alpha: 0.4)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.shield_outlined, color: colors.warning, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'HTTP is unencrypted. HTTPS is strongly recommended for production servers.',
                                style: TextStyle(color: colors.warning, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),

                    // Test Connection Button
                    SizedBox(
                      height: 44,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: goldColor,
                          side: BorderSide(color: goldColor, width: 1.2),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(22),
                          ),
                        ),
                        onPressed: _isTesting ? null : () => _handleTestConnection(silent: false),
                        icon: _isTesting
                            ? SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: goldColor),
                              )
                            : const Icon(Icons.network_check_rounded, size: 18),
                        label: Text(
                          _isTesting ? 'TESTING CONNECTION...' : 'TEST CONNECTION',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Connection Result Card
              if (_testResult != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _testResult!['connected'] == true
                        ? colors.success.withValues(alpha: 0.15)
                        : colors.error.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _testResult!['connected'] == true
                          ? colors.success
                          : colors.error,
                      width: 1.2,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            _testResult!['connected'] == true
                                ? Icons.check_circle_rounded
                                : Icons.error_rounded,
                            color: _testResult!['connected'] == true
                                ? colors.success
                                : colors.error,
                            size: 22,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _testResult!['connected'] == true ? '✓ Backend Connected' : '✕ Connection Failed',
                            style: TextStyle(
                              color: _testResult!['connected'] == true
                                  ? colors.success
                                  : colors.error,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const Spacer(),
                          if (_testResult!['latencyMs'] != null)
                            Text(
                              '${_testResult!['latencyMs']} ms',
                              style: TextStyle(color: colors.textSecondary, fontSize: 11, fontFamily: 'monospace'),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _testResult!['message'] ?? '',
                        style: TextStyle(color: colors.textPrimary, fontSize: 12),
                      ),
                      if (_testResult!['service'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Service: ${_testResult!['service']}',
                          style: TextStyle(color: colors.textMuted, fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Action Buttons
              SizedBox(
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: goldColor,
                    foregroundColor: colors.buttonTextPrimary,
                    elevation: 4,
                    shadowColor: goldColor.withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                  onPressed: _isSaving ? null : _handleSave,
                  icon: _isSaving
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: colors.buttonTextPrimary),
                        )
                      : const Icon(Icons.save_rounded, size: 20),
                  label: const Text(
                    'SAVE BACKEND URL',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              Center(
                child: TextButton.icon(
                  onPressed: _handleReset,
                  icon: Icon(Icons.settings_backup_restore_rounded, color: colors.textMuted, size: 16),
                  label: Text(
                    'Reset to Default Configuration',
                    style: TextStyle(color: colors.textMuted, fontSize: 12),
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
