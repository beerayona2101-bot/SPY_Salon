import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'currency_utils.dart';

/// Generator for Official Printable SPY Salon Payslip PDF Document
class PayslipPdfGenerator {
  /// Generate official SPY Salon Payslip PDF bytes
  static Future<Uint8List> generatePdfBytes({
    required Map<String, dynamic> slip,
    Map<String, dynamic>? user,
  }) async {
    final pdf = pw.Document();

    pw.Font? ttfFont;
    pw.Font? ttfBold;
    pw.Font? ttfItalic;
    try {
      ttfFont = await PdfGoogleFonts.robotoRegular();
      ttfBold = await PdfGoogleFonts.robotoBold();
      ttfItalic = await PdfGoogleFonts.robotoItalic();
    } catch (e) {
      debugPrint('[PayslipPdfGenerator] Could not load Google Fonts for PDF: $e');
    }

    final pw.ThemeData? docTheme = ttfFont != null && ttfBold != null
        ? pw.ThemeData.withFont(
            base: ttfFont,
            bold: ttfBold,
            italic: ttfItalic ?? ttfFont,
          )
        : null;

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

    // Approved SPY Salon Brand Colors
    const goldColor = PdfColor.fromInt(0xFFE0A96D);
    const darkText = PdfColor.fromInt(0xFF0E0B09);
    const secondaryText = PdfColor.fromInt(0xFF665A55);
    const surfaceSoft = PdfColor.fromInt(0xFFF5EFE8);
    const borderAccent = PdfColor.fromInt(0xFFE4DAD1);

    // Load logo if available
    pw.MemoryImage? logoImage;
    try {
      final logoBytes = await rootBundle.load('assets/images/logo.png');
      logoImage = pw.MemoryImage(logoBytes.buffer.asUint8List());
    } catch (_) {}

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        theme: docTheme,
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(24),
            decoration: pw.BoxDecoration(
              color: PdfColors.white,
              borderRadius: pw.BorderRadius.circular(12),
              border: pw.Border.all(color: goldColor, width: 1.5),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                // HEADER
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Row(
                      children: [
                        if (logoImage != null)
                          pw.Container(
                            width: 44,
                            height: 44,
                            decoration: pw.BoxDecoration(
                              shape: pw.BoxShape.circle,
                              border: pw.Border.all(color: goldColor, width: 1.5),
                            ),
                            child: pw.ClipOval(child: pw.Image(logoImage, fit: pw.BoxFit.cover)),
                          )
                        else
                          pw.Container(
                            width: 44,
                            height: 44,
                            decoration: pw.BoxDecoration(
                              shape: pw.BoxShape.circle,
                              color: surfaceSoft,
                              border: pw.Border.all(color: goldColor, width: 1.5),
                            ),
                            child: pw.Center(
                              child: pw.Text('S', style: const pw.TextStyle(color: goldColor, fontSize: 22, fontWeight: pw.FontWeight.bold)),
                            ),
                          ),
                        pw.SizedBox(width: 12),
                        pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('SPY SALON', style: const pw.TextStyle(color: darkText, fontSize: 20, fontWeight: pw.FontWeight.bold)),
                            pw.Text('LUXURY BEAUTY STUDIO & BOTANICAL SPA', style: const pw.TextStyle(color: goldColor, fontSize: 9, fontWeight: pw.FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text('PAYSLIP', style: const pw.TextStyle(color: darkText, fontSize: 22, fontWeight: pw.FontWeight.bold)),
                        pw.Text('Official Salary Statement', style: const pw.TextStyle(color: goldColor, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 12),

                // DIVIDER
                pw.Container(height: 2, color: goldColor),
                pw.SizedBox(height: 16),

                // EMPLOYEE INFORMATION
                pw.Container(
                  padding: const pw.EdgeInsets.all(14),
                  decoration: pw.BoxDecoration(
                    color: surfaceSoft,
                    borderRadius: pw.BorderRadius.circular(8),
                    border: pw.Border.all(color: borderAccent),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('EMPLOYEE INFORMATION', style: const pw.TextStyle(color: goldColor, fontSize: 10, fontWeight: pw.FontWeight.bold)),
                      pw.SizedBox(height: 8),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          _pdfInfoField('Employee Name', staffName, secondaryText, darkText),
                          _pdfInfoField('Employee ID', employeeId, secondaryText, darkText),
                          _pdfInfoField('Pay Period', monthDisplay, secondaryText, darkText),
                        ],
                      ),
                      pw.SizedBox(height: 8),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          _pdfInfoField('Designation', staffRole, secondaryText, darkText),
                          _pdfInfoField('Department', department, secondaryText, darkText),
                          _pdfInfoField('Payment Date', paymentDate, secondaryText, darkText),
                        ],
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 16),

                // EARNINGS
                pw.Text('EARNINGS BREAKDOWN', style: const pw.TextStyle(color: darkText, fontSize: 11, fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 6),
                pw.Table(
                  border: pw.TableBorder.all(color: borderAccent, width: 0.8),
                  children: [
                    _pdfTableHeader('Earnings Component', 'Amount', surfaceSoft, darkText),
                    _pdfTableRow('Basic Fixed Salary', CurrencyUtils.formatRupees(baseSalary), secondaryText, darkText),
                    _pdfTableRow('Service Revenue Handled', CurrencyUtils.formatRupees(revenue), secondaryText, darkText),
                    _pdfTableRow('Commission Earned (${commRate.toStringAsFixed(0)}%)', CurrencyUtils.formatRupees(commAmount), secondaryText, darkText),
                    _pdfTableTotalRow('Total Earnings', CurrencyUtils.formatRupees(totalEarnings), surfaceSoft, darkText),
                  ],
                ),
                pw.SizedBox(height: 14),

                // DEDUCTIONS
                pw.Text('DEDUCTIONS BREAKDOWN', style: const pw.TextStyle(color: darkText, fontSize: 11, fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 6),
                pw.Table(
                  border: pw.TableBorder.all(color: borderAccent, width: 0.8),
                  children: [
                    _pdfTableHeader('Deduction Component', 'Amount', surfaceSoft, darkText),
                    _pdfTableRow('Advance / Leave Deductions / Taxes', deductions > 0 ? '-${CurrencyUtils.formatRupees(deductions)}' : CurrencyUtils.formatRupees(0.0), secondaryText, darkText),
                    _pdfTableTotalRow('Total Deductions', CurrencyUtils.formatRupees(deductions), surfaceSoft, darkText),
                  ],
                ),
                pw.SizedBox(height: 18),

                // NET SALARY BOX
                pw.Container(
                  padding: const pw.EdgeInsets.all(16),
                  decoration: pw.BoxDecoration(
                    color: surfaceSoft,
                    borderRadius: pw.BorderRadius.circular(10),
                    border: pw.Border.all(color: goldColor, width: 1.5),
                  ),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text('NET SALARY PAYABLE', style: const pw.TextStyle(color: goldColor, fontSize: 11, fontWeight: pw.FontWeight.bold)),
                          pw.SizedBox(height: 4),
                          pw.Text(CurrencyUtils.formatRupees(netPay), style: const pw.TextStyle(color: darkText, fontSize: 24, fontWeight: pw.FontWeight.bold)),
                        ],
                      ),
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: pw.BoxDecoration(
                          color: const PdfColor.fromInt(0x262E7D32),
                          borderRadius: pw.BorderRadius.circular(6),
                          border: pw.Border.all(color: const PdfColor.fromInt(0xFF2E7D32)),
                        ),
                        child: pw.Text('VERIFIED & DISBURSED', style: const pw.TextStyle(color: PdfColor.fromInt(0xFF2E7D32), fontSize: 9, fontWeight: pw.FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 10),

                // AMOUNT IN WORDS
                pw.Container(
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    borderRadius: pw.BorderRadius.circular(6),
                    border: pw.Border.all(color: borderAccent),
                  ),
                  child: pw.Text(
                    'Amount in Words:  ${CurrencyUtils.amountInWords(netPay)}',
                    style: const pw.TextStyle(color: darkText, fontSize: 10, fontWeight: pw.FontWeight.bold, fontStyle: pw.FontStyle.italic),
                  ),
                ),

                pw.Spacer(),

                // SIGNATURE & FOOTER
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: pw.CrossAxisAlignment.end,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text('Disbursement Ref: $disbursementId', style: const pw.TextStyle(color: secondaryText, fontSize: 9)),
                        pw.SizedBox(height: 2),
                        pw.Text('This is a computer-generated salary slip and does not require a physical seal.', style: const pw.TextStyle(color: secondaryText, fontSize: 8)),
                      ],
                    ),
                    pw.Column(
                      children: [
                        pw.Container(width: 120, height: 1, color: darkText),
                        pw.SizedBox(height: 4),
                        pw.Text('Authorized Signature', style: const pw.TextStyle(color: darkText, fontSize: 10, fontWeight: pw.FontWeight.bold)),
                        pw.Text('SPY Salon Finance Dept.', style: const pw.TextStyle(color: goldColor, fontSize: 8)),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 12),
                pw.Center(
                  child: pw.Text('SPY SALON | LUXURY BEAUTY STUDIO | OFFICIAL PAYROLL STATEMENT', style: const pw.TextStyle(color: secondaryText, fontSize: 8, fontWeight: pw.FontWeight.bold)),
                ),
              ],
            ),
          );
        },
      ),
    );

    return pdf.save();
  }

  /// Generate & save PDF directly to user-accessible device storage with unique filename and validation
  static Future<File> generateAndSavePdf({
    required Map<String, dynamic> slip,
    Map<String, dynamic>? user,
  }) async {
    final Uint8List pdfBytes;
    try {
      pdfBytes = await generatePdfBytes(slip: slip, user: user);
    } catch (e, stack) {
      debugPrint('[PayslipPdfGenerator] Error generating PDF bytes: $e\n$stack');
      throw Exception('PDF_GENERATION_FAILED');
    }

    if (pdfBytes.isEmpty) {
      debugPrint('[PayslipPdfGenerator] Generated PDF bytes are empty!');
      throw Exception('PDF_GENERATION_FAILED');
    }

    final String staffName = (user?['name'] ?? 'Staff').toString().replaceAll(RegExp(r'[^\w\-]'), '_');
    final String monthDisplay = (slip['month'] ?? 'Current_Month').toString().replaceAll(RegExp(r'[^\w\-]'), '_');
    final String timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final String fileName = 'SPY_Salon_Payslip_${staffName}_${monthDisplay}_$timestamp.pdf';

    Directory? targetDir;
    try {
      if (Platform.isAndroid) {
        targetDir = Directory('/storage/emulated/0/Download');
        if (!targetDir.existsSync()) {
          try {
            targetDir.createSync(recursive: true);
          } catch (_) {}
        }
        if (!targetDir.existsSync()) {
          targetDir = await getExternalStorageDirectory();
        }
      } else {
        targetDir = await getApplicationDocumentsDirectory();
      }
    } catch (e) {
      debugPrint('[PayslipPdfGenerator] Target directory resolution notice: $e');
    }

    targetDir ??= await getApplicationDocumentsDirectory();

    File targetFile = File('${targetDir.path}/$fileName');
    try {
      await targetFile.writeAsBytes(pdfBytes, flush: true);
    } catch (e) {
      debugPrint('[PayslipPdfGenerator] Primary write error at ${targetFile.path}, trying application documents fallback: $e');
      final fallbackDir = await getApplicationDocumentsDirectory();
      targetFile = File('${fallbackDir.path}/$fileName');
      await targetFile.writeAsBytes(pdfBytes, flush: true);
    }

    if (!targetFile.existsSync() || targetFile.lengthSync() == 0) {
      debugPrint('[PayslipPdfGenerator] File verification failed! Path: ${targetFile.path}');
      throw Exception('PDF_STORAGE_FAILED');
    }

    debugPrint('[PayslipPdfGenerator] PDF Successfully Saved & Verified! Path: ${targetFile.path}, Size: ${targetFile.lengthSync()} bytes');
    return targetFile;
  }

  /// Backward compatible helper
  static Future<File?> downloadAndSharePdf({
    required Map<String, dynamic> slip,
    Map<String, dynamic>? user,
  }) async {
    return await generateAndSavePdf(slip: slip, user: user);
  }

  /// Open PDF file using default Android / system PDF reader
  static Future<bool> openPdfFile(String filePath) async {
    try {
      final result = await OpenFilex.open(filePath);
      debugPrint('[PayslipPdfGenerator] OpenFilex result: ${result.type} - ${result.message}');
      return result.type == ResultType.done;
    } catch (e) {
      debugPrint('[PayslipPdfGenerator] Error opening PDF file: $e');
      return false;
    }
  }

  static pw.Widget _pdfInfoField(String label, String value, PdfColor labelColor, PdfColor valueColor) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(label.toUpperCase(), style: pw.TextStyle(color: labelColor, fontSize: 8, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 2),
        pw.Text(value, style: pw.TextStyle(color: valueColor, fontSize: 11, fontWeight: pw.FontWeight.bold)),
      ],
    );
  }

  static pw.TableRow _pdfTableHeader(String col1, String col2, PdfColor bg, PdfColor text) {
    return pw.TableRow(
      decoration: pw.BoxDecoration(color: bg),
      children: [
        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(col1, style: pw.TextStyle(color: text, fontSize: 10, fontWeight: pw.FontWeight.bold))),
        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(col2, style: pw.TextStyle(color: text, fontSize: 10, fontWeight: pw.FontWeight.bold), textAlign: pw.TextAlign.right)),
      ],
    );
  }

  static pw.TableRow _pdfTableRow(String col1, String col2, PdfColor secondary, PdfColor dark) {
    return pw.TableRow(
      children: [
        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(col1, style: pw.TextStyle(color: secondary, fontSize: 10))),
        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(col2, style: pw.TextStyle(color: dark, fontSize: 10, fontWeight: pw.FontWeight.bold), textAlign: pw.TextAlign.right)),
      ],
    );
  }

  static pw.TableRow _pdfTableTotalRow(String col1, String col2, PdfColor bg, PdfColor text) {
    return pw.TableRow(
      decoration: pw.BoxDecoration(color: bg),
      children: [
        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(col1, style: pw.TextStyle(color: text, fontSize: 10, fontWeight: pw.FontWeight.bold))),
        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(col2, style: pw.TextStyle(color: text, fontSize: 11, fontWeight: pw.FontWeight.bold), textAlign: pw.TextAlign.right)),
      ],
    );
  }
}
