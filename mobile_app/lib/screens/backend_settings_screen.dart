import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';

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
          backgroundColor: const Color(0xFF191512),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE0A96D), width: 1.5),
          ),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 24),
              SizedBox(width: 10),
              Text(
                'Unreachable Server',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: Text(
            'The connection test to "$normalized" failed (${testRes['message']}).\n\nDo you still want to save this backend URL?',
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE0A96D),
                foregroundColor: const Color(0xFF13100E),
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
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF191512),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE0A96D), width: 1),
        ),
        title: const Text(
          'Reset Backend Configuration?',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'This will restore the default configuration (${ApiConfig.defaultBaseUrl}).',
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFC8868F),
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
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isError ? Colors.red[900] : const Color(0xFF1B4D3E),
        content: Text(message, style: const TextStyle(color: Colors.white)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFE0A96D);
    const darkBg = Color(0xFF13100E);
    const cardBg = Color(0xFF191512);

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
          icon: const Icon(Icons.arrow_back_ios_new, color: goldColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Backend Settings',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
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
            icon: const Icon(Icons.restart_alt_rounded, color: Colors.white60),
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
                        const Icon(Icons.dns_outlined, color: goldColor, size: 20),
                        const SizedBox(width: 8),
                        const Text(
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
                            style: const TextStyle(color: goldColor, fontSize: 9, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      ApiConfig.displayApiUrl,
                      style: const TextStyle(
                        color: Colors.white,
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
                  border: Border.all(color: goldColor.withValues(alpha: 0.2)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 16,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Server Backend URL',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Enter domain, IP, or full endpoint (e.g. https://hairsalon.speshway.site)',
                      style: TextStyle(color: Colors.white54, fontSize: 11),
                    ),
                    const SizedBox(height: 14),

                    TextField(
                      controller: _urlController,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                      onChanged: (_) {
                        setState(() {
                          _testResult = null;
                        });
                      },
                      decoration: InputDecoration(
                        labelText: 'Backend Address *',
                        labelStyle: const TextStyle(color: Colors.white70, fontSize: 13),
                        prefixIcon: const Icon(Icons.link_rounded, color: goldColor, size: 20),
                        suffixIcon: _urlController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.cancel, color: Colors.white38, size: 18),
                                onPressed: () {
                                  _urlController.clear();
                                  setState(() => _testResult = null);
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: darkBg,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: goldColor.withValues(alpha: 0.25)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: goldColor, width: 1.5),
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Live Normalization Preview
                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: Text(
                        'Will connect to: $currentNormalized/api/v1',
                        style: const TextStyle(
                          color: Colors.white38,
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
                          color: Colors.amber.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.shield_outlined, color: Colors.amber, size: 18),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'HTTP is unencrypted. HTTPS is strongly recommended for production servers.',
                                style: TextStyle(color: Colors.amber, fontSize: 11),
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
                          side: const BorderSide(color: goldColor, width: 1.2),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(22),
                          ),
                        ),
                        onPressed: _isTesting ? null : () => _handleTestConnection(silent: false),
                        icon: _isTesting
                            ? const SizedBox(
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
                        ? const Color(0xFF1B4D3E).withValues(alpha: 0.4)
                        : Colors.red[900]!.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _testResult!['connected'] == true
                          ? const Color(0xFF2ECC71)
                          : Colors.redAccent,
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
                                ? const Color(0xFF2ECC71)
                                : Colors.redAccent,
                            size: 22,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _testResult!['connected'] == true ? '✓ Backend Connected' : '✕ Connection Failed',
                            style: TextStyle(
                              color: _testResult!['connected'] == true
                                  ? const Color(0xFF2ECC71)
                                  : Colors.redAccent,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const Spacer(),
                          if (_testResult!['latencyMs'] != null)
                            Text(
                              '${_testResult!['latencyMs']} ms',
                              style: const TextStyle(color: Colors.white70, fontSize: 11, fontFamily: 'monospace'),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _testResult!['message'] ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                      if (_testResult!['service'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Service: ${_testResult!['service']}',
                          style: const TextStyle(color: Colors.white54, fontSize: 11),
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
                    foregroundColor: darkBg,
                    elevation: 4,
                    shadowColor: goldColor.withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                  onPressed: _isSaving ? null : _handleSave,
                  icon: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: darkBg),
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
                  icon: const Icon(Icons.settings_backup_restore_rounded, color: Colors.white54, size: 16),
                  label: const Text(
                    'Reset to Default Configuration',
                    style: TextStyle(color: Colors.white54, fontSize: 12),
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
