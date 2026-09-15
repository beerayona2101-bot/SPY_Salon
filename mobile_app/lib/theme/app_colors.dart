import 'package:flutter/material.dart';

/// Centralized semantic color tokens for SPY Salon Mobile App
class AppColors extends ThemeExtension<AppColors> {
  // Static Constants - Dark Theme Tokens
  static const darkBackground = Color(0xFF0E0B09);
  static const darkSurface = Color(0xFF13100E);
  static const darkSurfaceElevated = Color(0xFF1A1512);
  static const primaryGold = Color(0xFFE0A96D);
  static const darkTextPrimary = Color(0xFFF8F3EC);
  static const darkTextSecondary = Color(0xFFC9BFB3);
  static const darkTextMuted = Color(0xFF91867B);
  static const darkBorder = Color(0xFF332A24);

  // Static Constants - Light Theme Tokens
  static const lightBackground = Color(0xFFFAF7F2);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightSurfaceElevated = Color(0xFFF5EFE8);
  static const lightPrimary = Color(0xFF4D1526);
  static const lightTextPrimary = Color(0xFF241A18);
  static const lightTextSecondary = Color(0xFF665A55);
  static const lightTextMuted = Color(0xFF8B7D75);
  static const lightBorder = Color(0xFFE4DAD1);

  // Instance Properties (Theme-Aware Tokens)
  final Color deepestBackground;
  final Color mainBackground;
  final Color cardSurface;
  final Color cardSurfaceElevated;
  final Color cardBorder;
  final Color inputBackground;
  final Color primary;
  final Color goldPrimary;
  final Color roseSecondary;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color divider;
  final Color success;
  final Color error;
  final Color warning;
  final Color info;
  final Color successSoft;
  final Color errorSoft;
  final Color warningSoft;
  final Color infoSoft;

  const AppColors({
    required this.deepestBackground,
    required this.mainBackground,
    required this.cardSurface,
    required this.cardSurfaceElevated,
    required this.cardBorder,
    required this.inputBackground,
    required this.primary,
    required this.goldPrimary,
    required this.roseSecondary,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.divider,
    required this.success,
    required this.error,
    required this.warning,
    required this.info,
    required this.successSoft,
    required this.errorSoft,
    required this.warningSoft,
    required this.infoSoft,
  });

  // Dark Theme Palette Definition
  static const dark = AppColors(
    deepestBackground: darkBackground,
    mainBackground: darkBackground,
    cardSurface: darkSurface,
    cardSurfaceElevated: darkSurfaceElevated,
    cardBorder: darkBorder,
    inputBackground: darkSurfaceElevated,
    primary: primaryGold,
    goldPrimary: primaryGold,
    roseSecondary: Color(0xFFC8868F),
    textPrimary: darkTextPrimary,
    textSecondary: darkTextSecondary,
    textMuted: darkTextMuted,
    divider: darkBorder,
    success: Color(0xFF4E9F54),
    error: Color(0xFFE57373),
    warning: Color(0xFFF59E0B),
    info: Color(0xFF38BDF8),
    successSoft: Color(0x264E9F54),
    errorSoft: Color(0x26E57373),
    warningSoft: Color(0x26F59E0B),
    infoSoft: Color(0x2638BDF8),
  );

  // Light Theme Palette Definition
  static const light = AppColors(
    deepestBackground: Color(0xFFF5EFE8),
    mainBackground: lightBackground,
    cardSurface: lightSurface,
    cardSurfaceElevated: lightSurfaceElevated,
    cardBorder: lightBorder,
    inputBackground: lightSurfaceElevated,
    primary: lightPrimary,
    goldPrimary: primaryGold,
    roseSecondary: Color(0xFF8C334A),
    textPrimary: lightTextPrimary,
    textSecondary: lightTextSecondary,
    textMuted: lightTextMuted,
    divider: lightBorder,
    success: Color(0xFF2E7D32),
    error: Color(0xFFD32F2F),
    warning: Color(0xFFD97706),
    info: Color(0xFF0284C7),
    successSoft: Color(0x1F2E7D32),
    errorSoft: Color(0x1FD32F2F),
    warningSoft: Color(0x1FD97706),
    infoSoft: Color(0x1F0284C7),
  );

  /// Convenient context accessor
  static AppColors of(BuildContext context) {
    return Theme.of(context).extension<AppColors>() ??
        (Theme.of(context).brightness == Brightness.light ? light : dark);
  }

  /// Contrast text color for filled primary buttons
  Color get buttonTextPrimary => primary == primaryGold ? darkBackground : lightBackground;

  /// Semantic getters matching prompt requirements
  Color get background => mainBackground;
  Color get surface => cardSurface;
  Color get elevatedSurface => cardSurfaceElevated;
  Color get border => cardBorder;

  @override
  AppColors copyWith({
    Color? deepestBackground,
    Color? mainBackground,
    Color? cardSurface,
    Color? cardSurfaceElevated,
    Color? cardBorder,
    Color? inputBackground,
    Color? primary,
    Color? goldPrimary,
    Color? roseSecondary,
    Color? textPrimary,
    Color? textSecondary,
    Color? textMuted,
    Color? divider,
    Color? success,
    Color? error,
    Color? warning,
    Color? info,
    Color? successSoft,
    Color? errorSoft,
    Color? warningSoft,
    Color? infoSoft,
  }) {
    return AppColors(
      deepestBackground: deepestBackground ?? this.deepestBackground,
      mainBackground: mainBackground ?? this.mainBackground,
      cardSurface: cardSurface ?? this.cardSurface,
      cardSurfaceElevated: cardSurfaceElevated ?? this.cardSurfaceElevated,
      cardBorder: cardBorder ?? this.cardBorder,
      inputBackground: inputBackground ?? this.inputBackground,
      primary: primary ?? this.primary,
      goldPrimary: goldPrimary ?? this.goldPrimary,
      roseSecondary: roseSecondary ?? this.roseSecondary,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textMuted: textMuted ?? this.textMuted,
      divider: divider ?? this.divider,
      success: success ?? this.success,
      error: error ?? this.error,
      warning: warning ?? this.warning,
      info: info ?? this.info,
      successSoft: successSoft ?? this.successSoft,
      errorSoft: errorSoft ?? this.errorSoft,
      warningSoft: warningSoft ?? this.warningSoft,
      infoSoft: infoSoft ?? this.infoSoft,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      deepestBackground: Color.lerp(deepestBackground, other.deepestBackground, t)!,
      mainBackground: Color.lerp(mainBackground, other.mainBackground, t)!,
      cardSurface: Color.lerp(cardSurface, other.cardSurface, t)!,
      cardSurfaceElevated: Color.lerp(cardSurfaceElevated, other.cardSurfaceElevated, t)!,
      cardBorder: Color.lerp(cardBorder, other.cardBorder, t)!,
      inputBackground: Color.lerp(inputBackground, other.inputBackground, t)!,
      primary: Color.lerp(primary, other.primary, t)!,
      goldPrimary: Color.lerp(goldPrimary, other.goldPrimary, t)!,
      roseSecondary: Color.lerp(roseSecondary, other.roseSecondary, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      divider: Color.lerp(divider, other.divider, t)!,
      success: Color.lerp(success, other.success, t)!,
      error: Color.lerp(error, other.error, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      info: Color.lerp(info, other.info, t)!,
      successSoft: Color.lerp(successSoft, other.successSoft, t)!,
      errorSoft: Color.lerp(errorSoft, other.errorSoft, t)!,
      warningSoft: Color.lerp(warningSoft, other.warningSoft, t)!,
      infoSoft: Color.lerp(infoSoft, other.infoSoft, t)!,
    );
  }
}

