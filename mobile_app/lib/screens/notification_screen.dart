import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  bool _hasError = false;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });
    try {
      final results = await Future.wait([
        ApiService.getNotifications(),
        ApiService.getUnreadNotificationCount(),
      ]);
      final notifResult = results[0] as Map<String, dynamic>;
      final unread = results[1] as int;
      if (!mounted) return;
      setState(() {
        _notifications = (notifResult['data'] as List?) ?? [];
        _unreadCount = unread;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('[NotificationScreen] Load error: $e');
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  Future<void> _markAllRead() async {
    try {
      final success = await ApiService.markAllNotificationsRead();
      if (success && mounted) {
        await _loadNotifications();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('All notifications marked as read.'),
            backgroundColor: AppColors.of(context).success,
          ),
        );
      }
    } catch (e) {
      debugPrint('[NotificationScreen] markAllRead error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Could not mark all as read. Please try again.'),
            backgroundColor: AppColors.of(context).error,
          ),
        );
      }
    }
  }

  Future<void> _onTapNotification(dynamic notification) async {
    final id = (notification['_id'] ?? notification['id'] ?? '').toString();
    if (id.isNotEmpty && notification['isRead'] != true) {
      try {
        await ApiService.markNotificationRead(id);
      } catch (e) {
        debugPrint('[NotificationScreen] markRead error: $e');
      }
    }
    if (!mounted) return;
    // Update local state immediately so the tile reflects read status
    setState(() {
      for (final n in _notifications) {
        if ((n['_id'] ?? n['id'] ?? '').toString() == id) {
          n['isRead'] = true;
        }
      }
      if (_unreadCount > 0) _unreadCount--;
    });
  }

  Future<void> _deleteNotification(dynamic notification) async {
    final id = (notification['_id'] ?? notification['id'] ?? '').toString();
    if (id.isEmpty) return;
    try {
      final success = await ApiService.deleteNotification(id);
      if (success && mounted) {
        setState(() {
          _notifications.removeWhere(
            (n) => (n['_id'] ?? n['id'] ?? '').toString() == id,
          );
          if (notification['isRead'] != true && _unreadCount > 0) {
            _unreadCount--;
          }
        });
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Could not delete notification.'),
            backgroundColor: AppColors.of(context).error,
          ),
        );
      }
    } catch (e) {
      debugPrint('[NotificationScreen] delete error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Error deleting notification.'),
            backgroundColor: AppColors.of(context).error,
          ),
        );
      }
    }
  }

  IconData _iconForType(String type) {
    switch (type.toLowerCase()) {
      case 'appointment':
      case 'booking':
      case 'reminder':
        return Icons.calendar_today;
      case 'leave':
        return Icons.beach_access;
      case 'attendance':
        return Icons.access_time;
      case 'employee':
        return Icons.person;
      case 'review':
        return Icons.star;
      case 'payment':
        return Icons.payment;
      default:
        return Icons.info_outline;
    }
  }

  String _relativeTime(String? createdAt) {
    if (createdAt == null || createdAt.isEmpty) return '';
    try {
      final dt = DateTime.parse(createdAt).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return '< 1m ago';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays == 1) return 'Yesterday';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      // Format as date string
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeColors = AppColors.of(context);
    final primaryColor = themeColors.primary;
    final cardBg = themeColors.cardSurface;

    return Scaffold(
      backgroundColor: themeColors.deepestBackground,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: primaryColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'NOTIFICATIONS',
              style: TextStyle(
                color: themeColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.0,
              ),
            ),
            if (_unreadCount > 0)
              Text(
                '$_unreadCount unread',
                style: TextStyle(color: primaryColor, fontSize: 11),
              ),
          ],
        ),
        actions: [
          if (_notifications.isNotEmpty)
            TextButton(
              onPressed: _unreadCount > 0 ? _markAllRead : null,
              child: Text(
                'Mark All Read',
                style: TextStyle(
                  color: _unreadCount > 0 ? primaryColor : themeColors.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: primaryColor))
          : _hasError
              ? _buildErrorState(themeColors, primaryColor)
              : _notifications.isEmpty
                  ? _buildEmptyState(themeColors, primaryColor)
                  : RefreshIndicator(
                      color: primaryColor,
                      backgroundColor: cardBg,
                      onRefresh: _loadNotifications,
                      child: ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(
                          parent: BouncingScrollPhysics(),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) => Divider(
                          height: 1,
                          color: themeColors.cardBorder.withValues(alpha: 0.4),
                          indent: 72,
                        ),
                        itemBuilder: (context, index) {
                          final notif = _notifications[index];
                          return _buildNotificationTile(notif, themeColors, primaryColor);
                        },
                      ),
                    ),
    );
  }

  Widget _buildNotificationTile(
    dynamic notif,
    AppColors themeColors,
    Color primaryColor,
  ) {
    final isUnread = notif['isRead'] != true;
    final title = (notif['title'] ?? 'Notification').toString();
    final message = (notif['message'] ?? notif['body'] ?? '').toString();
    final type = (notif['type'] ?? 'system').toString();
    final createdAt = notif['createdAt']?.toString();
    final timeLabel = _relativeTime(createdAt);
    final id = (notif['_id'] ?? notif['id'] ?? '').toString();

    return InkWell(
      onTap: () => _onTapNotification(notif),
      child: Container(
        color: isUnread
            ? primaryColor.withValues(alpha: 0.06)
            : themeColors.cardSurface,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: primaryColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
                border: Border.all(
                  color: primaryColor.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              child: Icon(
                _iconForType(type),
                color: primaryColor,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            // Text content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            color: themeColors.textPrimary,
                            fontSize: 14,
                            fontWeight: isUnread ? FontWeight.bold : FontWeight.w500,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isUnread)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 4, left: 6),
                          decoration: BoxDecoration(
                            color: primaryColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  if (message.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      message,
                      style: TextStyle(
                        color: themeColors.textSecondary,
                        fontSize: 12,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (timeLabel.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      timeLabel,
                      style: TextStyle(
                        color: themeColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            // Delete button
            if (id.isNotEmpty)
              IconButton(
                padding: const EdgeInsets.only(left: 4),
                constraints: const BoxConstraints(),
                icon: Icon(
                  Icons.delete_outline_rounded,
                  color: themeColors.textMuted,
                  size: 18,
                ),
                onPressed: () => _deleteNotification(notif),
                tooltip: 'Delete notification',
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(AppColors themeColors, Color primaryColor) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.notifications_none_outlined,
            size: 72,
            color: themeColors.textMuted,
          ),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(
              color: themeColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You\'re all caught up!\nNotifications will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: themeColors.textMuted,
              fontSize: 13,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(AppColors themeColors, Color primaryColor) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.cloud_off_outlined,
            size: 64,
            color: themeColors.textMuted,
          ),
          const SizedBox(height: 16),
          Text(
            'Could not load notifications',
            style: TextStyle(
              color: themeColors.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Check your connection and try again.',
            style: TextStyle(color: themeColors.textMuted, fontSize: 13),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: themeColors.buttonTextPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: _loadNotifications,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Retry', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
