import 'package:flutter/material.dart';
import '../utils/currency_utils.dart';

/// Premium SPY Salon Payslip Document Widget
/// Renders an A4 portrait luxury salary statement optimized for display & printing.
class PayslipDocumentWidget extends StatelessWidget {
  final Map<String, dynamic> slip;
  final Map<String, dynamic>? user;
  final VoidCallback? onDownload;

  const PayslipDocumentWidget({
    super.key,
    required this.slip,
    this.user,
    this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    final String monthDisplay = slip['month'] ?? 'Current Month';
    final double baseSalary = (slip['baseSalary'] ?? 25000.0).toDouble();
    final double revenue = (slip['revenueHandled'] ?? 17500.0).toDouble();
    final double commRate = (slip['commissionRate'] ?? 20.0).toDouble();
    final double commAmount = (slip['commissionAmount'] ?? ((revenue * commRate) / 100.0)).toDouble();
    final double deductions = (slip['deductions'] ?? 0.0).toDouble();
    final double totalEarnings = baseSalary + commAmount;
    final double netPay = (slip['netPay'] ?? (totalEarnings - deductions)).toDouble();

    final String staffName = user?['name'] ?? 'Santhosh Kumar';
    final String staffRole = user?['role']?.toString().toUpperCase() ?? 'STAFF SPECIALIST';
    final String employeeId = user?['employeeId'] ?? user?['id'] ?? 'EMP-8042';
    final String department = user?['department'] ?? 'Salon Operations';
    final String disbursementId = slip['_id'] ?? slip['id'] ?? 'PAY-2026-09-001';
    final String paymentDate = DateTime.now().toString().split(' ')[0];

    // Approved SPY Salon Brand Colors for Printable Document
    const docBackground = Color(0xFFFFFFFF);
    const docDarkText = Color(0xFF0E0B09);
    const docSecondaryText = Color(0xFF665A55);
    const docGold = Color(0xFFE0A96D);
    const docRose = Color(0xFFC8868F);
    const docSurfaceSoft = Color(0xFFF5EFE8);
    const docBorder = Color(0xFFE4DAD1);

    return LayoutBuilder(
      builder: (ctx, constraints) {
        final double maxWidth = constraints.maxWidth;
        final bool isCompact = maxWidth < 540;

        return Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 840),
            margin: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: docBackground,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: docGold, width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: 24,
                  spreadRadius: 2,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: SingleChildScrollView(
              padding: EdgeInsets.all(isCompact ? 16.0 : 28.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // --- HEADER SECTION ---
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // SPY SALON BRANDING
                      Expanded(
                        child: Row(
                          children: [
                            Container(
                              width: isCompact ? 42 : 52,
                              height: isCompact ? 42 : 52,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: docGold, width: 1.5),
                              ),
                              child: ClipOval(
                                child: Image.asset(
                                  'assets/images/logo.png',
                                  fit: BoxFit.cover,
                                  errorBuilder: (c, e, s) => Center(
                                    child: Text(
                                      'S',
                                      style: TextStyle(
                                        color: docGold,
                                        fontWeight: FontWeight.bold,
                                        fontSize: isCompact ? 20 : 24,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'SPY SALON',
                                    style: TextStyle(
                                      color: docDarkText,
                                      fontSize: isCompact ? 18 : 22,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 2.4,
                                    ),
                                  ),
                                  Text(
                                    'LUXURY BEAUTY STUDIO & BOTANICAL SPA',
                                    style: TextStyle(
                                      color: docGold,
                                      fontSize: isCompact ? 8 : 10,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),

                      // PAYSLIP TITLE & STATEMENT
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'PAYSLIP',
                            style: TextStyle(
                              color: docDarkText,
                              fontSize: isCompact ? 18 : 24,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2.0,
                            ),
                          ),
                          Text(
                            'Official Salary Statement',
                            style: TextStyle(
                              color: docGold,
                              fontSize: isCompact ? 10 : 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // GOLD & ROSE DECORATIVE DIVIDER
                  Row(
                    children: [
                      Expanded(child: Container(height: 2, color: docGold)),
                      Container(width: 8, height: 2, color: docRose),
                      Container(width: 8, height: 2, color: docGold),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // --- EMPLOYEE INFORMATION SECTION ---
                  Container(
                    padding: EdgeInsets.all(isCompact ? 12 : 16),
                    decoration: BoxDecoration(
                      color: docSurfaceSoft,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: docBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'EMPLOYEE INFORMATION',
                          style: TextStyle(
                            color: docGold,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 12),
                        isCompact
                            ? Column(
                                children: [
                                  _buildInfoRow(docDarkText, docSecondaryText, 'Employee Name', staffName, 'Employee ID', employeeId),
                                  const SizedBox(height: 8),
                                  _buildInfoRow(docDarkText, docSecondaryText, 'Designation', staffRole, 'Department', department),
                                  const SizedBox(height: 8),
                                  _buildInfoRow(docDarkText, docSecondaryText, 'Pay Period', monthDisplay, 'Payment Date', paymentDate),
                                ],
                              )
                            : Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      children: [
                                        _buildInfoField(docDarkText, docSecondaryText, 'Employee Name', staffName),
                                        const SizedBox(height: 10),
                                        _buildInfoField(docDarkText, docSecondaryText, 'Designation', staffRole),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      children: [
                                        _buildInfoField(docDarkText, docSecondaryText, 'Employee ID', employeeId),
                                        const SizedBox(height: 10),
                                        _buildInfoField(docDarkText, docSecondaryText, 'Department', department),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      children: [
                                        _buildInfoField(docDarkText, docSecondaryText, 'Pay Period', monthDisplay),
                                        const SizedBox(height: 10),
                                        _buildInfoField(docDarkText, docSecondaryText, 'Payment Date', paymentDate),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // --- EARNINGS BREAKDOWN ---
                  _buildSectionHeader(docDarkText, docRose, 'EARNINGS'),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: docBorder),
                    ),
                    child: Column(
                      children: [
                        _buildTableHeader(docSurfaceSoft, docDarkText, 'Earnings Component', 'Amount'),
                        _buildTableRow(docDarkText, docSecondaryText, 'Basic Fixed Salary', CurrencyUtils.formatRupees(baseSalary)),
                        _buildTableRow(docDarkText, docSecondaryText, 'Service Revenue Handled', CurrencyUtils.formatRupees(revenue)),
                        _buildTableRow(docDarkText, docSecondaryText, 'Commission Earned (${commRate.toStringAsFixed(0)}%)', CurrencyUtils.formatRupees(commAmount), isHighlight: true),
                        _buildTableTotalRow(docSurfaceSoft, docDarkText, 'Total Earnings', CurrencyUtils.formatRupees(totalEarnings)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // --- DEDUCTIONS BREAKDOWN ---
                  _buildSectionHeader(docDarkText, docRose, 'DEDUCTIONS'),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: docBorder),
                    ),
                    child: Column(
                      children: [
                        _buildTableHeader(docSurfaceSoft, docDarkText, 'Deduction Component', 'Amount'),
                        _buildTableRow(docDarkText, docSecondaryText, 'Advance / Leave Deductions / Taxes', '-${CurrencyUtils.formatRupees(deductions)}'),
                        _buildTableTotalRow(docSurfaceSoft, docDarkText, 'Total Deductions', CurrencyUtils.formatRupees(deductions)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // --- NET SALARY HIGHLIGHTED BOX ---
                  Container(
                    padding: EdgeInsets.all(isCompact ? 14 : 20),
                    decoration: BoxDecoration(
                      color: docSurfaceSoft,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: docGold, width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: docGold.withValues(alpha: 0.12),
                          blurRadius: 12,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'NET SALARY PAYABLE',
                                    style: TextStyle(
                                      color: docGold,
                                      fontSize: isCompact ? 11 : 13,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0x262E7D32),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFF2E7D32)),
                                    ),
                                    child: const Text(
                                      'VERIFIED',
                                      style: TextStyle(
                                        color: Color(0xFF2E7D32),
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                CurrencyUtils.formatRupees(netPay),
                                style: TextStyle(
                                  color: docDarkText,
                                  fontSize: isCompact ? 22 : 28,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  // AMOUNT IN WORDS
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: docSurfaceSoft.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: docBorder.withValues(alpha: 0.6)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.style_outlined, color: docGold, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Amount in Words:  ${CurrencyUtils.amountInWords(netPay)}',
                            style: TextStyle(
                              color: docDarkText,
                              fontSize: isCompact ? 11 : 12,
                              fontWeight: FontWeight.w600,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // --- SIGNATURE & FOOTER ---
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Electronically generated statement note
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Disbursement Ref: $disbursementId',
                              style: const TextStyle(color: docSecondaryText, fontSize: 10, fontFamily: 'monospace'),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'This is a computer-generated salary slip and does not require a physical seal.',
                              style: TextStyle(color: docSecondaryText, fontSize: 9),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),

                      // Authorized Signature Line
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: isCompact ? 110 : 150,
                            height: 1,
                            color: docDarkText.withValues(alpha: 0.4),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Authorized Signature',
                            style: TextStyle(
                              color: docDarkText,
                              fontSize: isCompact ? 10 : 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Text(
                            'SPY Salon Finance Dept.',
                            style: TextStyle(color: docGold, fontSize: 9, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // FOOTER SPY SALON STAMP
                  Center(
                    child: Text(
                      'SPY SALON | LUXURY BEAUTY STUDIO | OFFICIAL PAYROLL STATEMENT',
                      style: TextStyle(
                        color: docSecondaryText.withValues(alpha: 0.7),
                        fontSize: 9,
                        letterSpacing: 1.0,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(Color darkText, Color roseAccent, String title) {
    return Row(
      children: [
        Container(width: 4, height: 14, color: roseAccent),
        const SizedBox(width: 6),
        Text(
          title,
          style: TextStyle(
            color: darkText,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(Color darkText, Color secondaryText, String l1, String v1, String l2, String v2) {
    return Row(
      children: [
        Expanded(child: _buildInfoField(darkText, secondaryText, l1, v1)),
        const SizedBox(width: 12),
        Expanded(child: _buildInfoField(darkText, secondaryText, l2, v2)),
      ],
    );
  }

  Widget _buildInfoField(Color darkText, Color secondaryText, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(color: secondaryText, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.8),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(color: darkText, fontSize: 13, fontWeight: FontWeight.bold),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildTableHeader(Color bg, Color darkText, String col1, String col2) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(9)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(col1, style: TextStyle(color: darkText, fontSize: 11, fontWeight: FontWeight.bold)),
          Text(col2, style: TextStyle(color: darkText, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildTableRow(Color darkText, Color secondaryText, String label, String amount, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: isHighlight ? darkText : secondaryText,
                fontSize: 12,
                fontWeight: isHighlight ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ),
          Text(
            amount,
            style: TextStyle(
              color: darkText,
              fontSize: 12,
              fontWeight: isHighlight ? FontWeight.bold : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableTotalRow(Color bg, Color darkText, String label, String amount) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bg.withValues(alpha: 0.6),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(9)),
        border: Border(top: BorderSide(color: darkText.withValues(alpha: 0.15))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: darkText, fontSize: 12, fontWeight: FontWeight.w900)),
          Text(amount, style: TextStyle(color: darkText, fontSize: 13, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}
