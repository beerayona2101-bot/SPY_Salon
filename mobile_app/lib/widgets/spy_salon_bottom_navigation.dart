import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class SpySalonNavItem {
  final String title;
  final IconData icon;
  final String badge;

  const SpySalonNavItem({
    required this.title,
    required this.icon,
    this.badge = '',
  });
}

/// SPY Salon Floating Bottom Navigation Bar Widget
/// Features a luxury rounded floating container with a smooth 250ms 
/// elevated selected tab indicator and full Dark/Light theme adaptability.
class SpySalonBottomNavigation extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<SpySalonNavItem> items;

  const SpySalonBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;
    final borderColor = themeColors.cardBorder;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 12, top: 4),
        child: Container(
          height: 68,
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: borderColor.withValues(alpha: isDark ? 0.6 : 0.8),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.12),
                blurRadius: 18,
                spreadRadius: 1,
                offset: const Offset(0, 6),
              ),
              BoxShadow(
                color: primaryColor.withValues(alpha: isDark ? 0.08 : 0.05),
                blurRadius: 12,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(items.length, (index) {
              final item = items[index];
              final isSelected = currentIndex == index;
              final isCenterItem = index == 2;
              final badge = item.badge;

              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(index),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    curve: Curves.easeOutCubic,
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Animated Elevated Icon Container
                        AnimatedTransform(
                          transform: Matrix4.translationValues(
                            0,
                            isSelected ? -6 : 0,
                            0,
                          ),
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOutCubic,
                          child: Stack(
                            clipBehavior: Clip.none,
                            alignment: Alignment.center,
                            children: [
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 250),
                                curve: Curves.easeOutCubic,
                                width: isSelected ? 42 : 36,
                                height: isSelected ? 42 : 36,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? primaryColor
                                      : (isCenterItem
                                          ? primaryColor.withValues(alpha: 0.12)
                                          : Colors.transparent),
                                  shape: BoxShape.circle,
                                  border: isSelected
                                      ? Border.all(
                                          color: isDark
                                              ? Colors.white.withValues(alpha: 0.3)
                                              : primaryColor.withValues(alpha: 0.4),
                                          width: 2,
                                        )
                                      : (isCenterItem
                                          ? Border.all(
                                              color: primaryColor.withValues(alpha: 0.3),
                                              width: 1,
                                            )
                                          : null),
                                  boxShadow: isSelected
                                      ? [
                                          BoxShadow(
                                            color: primaryColor.withValues(alpha: 0.45),
                                            blurRadius: 10,
                                            spreadRadius: 1,
                                            offset: const Offset(0, 3),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Icon(
                                  item.icon,
                                  color: isSelected
                                      ? themeColors.buttonTextPrimary
                                      : (isCenterItem
                                          ? primaryColor
                                          : themeColors.textMuted),
                                  size: isSelected ? 22 : (isCenterItem ? 20 : 19),
                                ),
                              ),

                              // Real-Time Notification / Queue Badge
                              if (badge.isNotEmpty && badge != '0')
                                Positioned(
                                  top: -3,
                                  right: -3,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 4,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? themeColors.error
                                          : primaryColor,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: cardBg,
                                        width: 1.5,
                                      ),
                                    ),
                                    constraints: const BoxConstraints(
                                      minWidth: 16,
                                      minHeight: 16,
                                    ),
                                    child: Text(
                                      badge,
                                      style: TextStyle(
                                        color: isSelected
                                            ? Colors.white
                                            : themeColors.buttonTextPrimary,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 2),

                        // Title Label
                        AnimatedDefaultTextStyle(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOutCubic,
                          style: TextStyle(
                            color: isSelected
                                ? primaryColor
                                : (isCenterItem
                                    ? primaryColor
                                    : themeColors.textMuted),
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            fontSize: isSelected ? 10.5 : 9.5,
                            letterSpacing: -0.2,
                          ),
                          child: Text(
                            item.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

/// Helper extension widget for animated matrix transformations
class AnimatedTransform extends StatelessWidget {
  final Matrix4 transform;
  final Duration duration;
  final Curve curve;
  final Widget child;

  const AnimatedTransform({
    super.key,
    required this.transform,
    required this.duration,
    this.curve = Curves.linear,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<Matrix4>(
      tween: Matrix4Tween(begin: transform, end: transform),
      duration: duration,
      curve: curve,
      builder: (context, value, child) {
        return Transform(
          transform: value,
          alignment: Alignment.center,
          child: child,
        );
      },
      child: child,
    );
  }
}
