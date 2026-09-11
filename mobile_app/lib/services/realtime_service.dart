import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_config.dart';
import 'api_service.dart';

class RealtimeEvent {
  final String name;
  final dynamic data;
  final DateTime timestamp;

  RealtimeEvent({
    required this.name,
    this.data,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  @override
  String toString() => 'RealtimeEvent($name, data: $data)';
}

class RealtimeService with WidgetsBindingObserver {
  static final RealtimeService _instance = RealtimeService._internal();
  factory RealtimeService() => _instance;

  RealtimeService._internal();

  io.Socket? _socket;
  bool _isConnected = false;
  bool _isInitializing = false;
  String? _lastConnectedUrl;

  final StreamController<RealtimeEvent> _eventController = StreamController<RealtimeEvent>.broadcast();
  Stream<RealtimeEvent> get eventStream => _eventController.stream;

  bool get isConnected => _isConnected;
  String? get currentSocketId => _socket?.id;

  /// Known domain events to listen for from backend broadcast
  static const List<String> domainEvents = [
    // Service events
    'service:created',
    'service:updated',
    'service:deleted',
    
    // Appointment events
    'appointment:created',
    'appointment:new',
    'appointment:updated',
    'appointment:status_changed',
    'appointment:rescheduled',
    'appointment:cancelled',

    // Employee & Staff events
    'employee:created',
    'employee:updated',
    'employee:deleted',
    'attendance:clock_in',
    'attendance:clock_out',
    'leave:requested',
    'leave:status_updated',

    // Memberships & Offers & Settings
    'membership:created',
    'membership:updated',
    'membership:deleted',
    'offers_updated',
    'landing_settings_updated',
    'stats:updated',
  ];

  /// Initializes and connects Socket.IO client using active ApiConfig base URL
  Future<void> init() async {
    if (_isInitializing) return;
    _isInitializing = true;

    try {
      WidgetsBinding.instance.addObserver(this);
      await connect();
    } catch (e) {
      debugPrint('[RealtimeService] Initialization error: $e');
    } finally {
      _isInitializing = false;
    }
  }

  /// Connects or reconnects the Socket.IO connection
  Future<void> connect() async {
    final targetUrl = ApiConfig.baseUrl;

    // If socket is already connected to the same URL, do nothing
    if (_socket != null && _isConnected && _lastConnectedUrl == targetUrl) {
      return;
    }

    // Disconnect existing socket if host changed
    if (_socket != null) {
      _socket!.dispose();
      _socket = null;
    }

    _lastConnectedUrl = targetUrl;
    final token = await ApiService.getStoredToken();

    debugPrint('[RealtimeService] Connecting to Socket.IO at $targetUrl (Auth token present: ${token != null})');

    final options = io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .enableAutoConnect()
        .enableReconnection()
        .setReconnectionDelay(1000)
        .setReconnectionDelayMax(5000)
        .setReconnectionAttempts(999);

    if (token != null && token.isNotEmpty) {
      options.setExtraHeaders({'Authorization': 'Bearer $token'});
      options.setQuery({'token': token});
    }

    _socket = io.io(targetUrl, options.build());

    _setupListeners(token);
  }

  void _setupListeners(String? token) {
    if (_socket == null) return;

    _socket!.onConnect((_) {
      _isConnected = true;
      debugPrint('[RealtimeService] Connected to Socket.IO server: ${_socket?.id}');

      if (token != null && token.isNotEmpty) {
        _socket!.emit('authenticate', token);
      }

      // Notify app that connection was established / re-established
      _eventController.add(RealtimeEvent(name: 'socket:connected', data: {'socketId': _socket?.id}));
    });

    _socket!.onDisconnect((data) {
      _isConnected = false;
      debugPrint('[RealtimeService] Disconnected from Socket.IO server: $data');
      _eventController.add(RealtimeEvent(name: 'socket:disconnected', data: data));
    });

    _socket!.onConnectError((err) {
      _isConnected = false;
      debugPrint('[RealtimeService] Socket.IO connection error: $err');
    });

    _socket!.onError((err) {
      debugPrint('[RealtimeService] Socket.IO general error: $err');
    });

    // Attach listeners for domain events
    for (final eventName in domainEvents) {
      _socket!.off(eventName); // Prevent duplicate listeners
      _socket!.on(eventName, (data) {
        debugPrint('[RealtimeService] Received event: $eventName -> $data');
        _eventController.add(RealtimeEvent(name: eventName, data: data));
      });
    }
  }

  /// Manually join authorized Socket.IO room (e.g. room:customer, room:employee)
  void joinRoom(String roomName) {
    if (_socket != null && _isConnected) {
      _socket!.emit('join_room', roomName);
      debugPrint('[RealtimeService] Requested to join room: $roomName');
    }
  }

  /// Safe disconnect
  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _isConnected = false;
  }

  /// App Lifecycle handling: Reconnect/Resync when coming to foreground
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      debugPrint('[RealtimeService] App resumed to foreground. Checking realtime connection & triggering fallback sync...');
      connect();
      // Emit fallback sync event so active screens refresh their state silently
      _eventController.add(RealtimeEvent(name: 'app:fallback_sync'));
    }
  }

  /// Clean up resources
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    disconnect();
    _eventController.close();
  }
}
