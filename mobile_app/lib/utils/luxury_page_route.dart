import 'package:flutter/material.dart';

/// Premium, elegant screen transition for SPY Salon.
/// Combines a subtle Fade, 15-20px horizontal Slide, and 0.98 -> 1.0 Scale
/// with an easeOutCubic curve and 280ms duration.
class LuxuryPageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  LuxuryPageRoute({required this.page, super.settings})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionDuration: const Duration(milliseconds: 280),
          reverseTransitionDuration: const Duration(milliseconds: 240),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final fadeAnimation = CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
            );
            final slideAnimation = Tween<Offset>(
              begin: const Offset(0.04, 0.0),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
            ));
            final scaleAnimation = Tween<double>(
              begin: 0.98,
              end: 1.0,
            ).animate(CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
            ));

            return FadeTransition(
              opacity: fadeAnimation,
              child: SlideTransition(
                position: slideAnimation,
                child: ScaleTransition(
                  scale: scaleAnimation,
                  child: child,
                ),
              ),
            );
          },
        );
}
