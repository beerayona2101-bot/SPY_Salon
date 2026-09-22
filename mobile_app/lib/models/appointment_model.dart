class AppointmentModel {
  final String id;
  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final String service;
  final String branch;
  final String specialistName;
  final String appointmentDate;
  final String appointmentTime;
  final String status;
  final String notes;

  AppointmentModel({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail = '',
    required this.service,
    this.branch = 'Jubilee Hills',
    this.specialistName = 'Any Specialist',
    required this.appointmentDate,
    required this.appointmentTime,
    this.status = 'Confirmed',
    this.notes = '',
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['_id'] ?? json['id'] ?? json['bookingId'] ?? '',
      customerName: json['customerName'] ?? json['clientName'] ?? '',
      customerPhone: json['customerPhone'] ?? json['phone'] ?? '',
      customerEmail: json['customerEmail'] ?? json['email'] ?? '',
      service: json['service'] ?? json['serviceName'] ?? '',
      branch: json['branch'] ?? 'Jubilee Hills',
      specialistName: json['specialistName'] ?? json['specialist'] ?? 'Any Specialist',
      appointmentDate: json['appointmentDate'] ?? json['date'] ?? '',
      appointmentTime: json['appointmentTime'] ?? json['time'] ?? '',
      status: json['status'] ?? 'Confirmed',
      notes: json['notes'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerEmail': customerEmail,
      'service': service,
      'branch': branch,
      'specialistName': specialistName,
      'appointmentDate': appointmentDate,
      'appointmentTime': appointmentTime,
      'status': status,
      'notes': notes,
    };
  }

  static bool hasAppointmentStarted(String? dateStr, String? timeStr) {
    if (dateStr == null || timeStr == null || dateStr.trim().isEmpty || timeStr.trim().isEmpty) {
      return true;
    }
    if (timeStr.toLowerCase().contains('walk-in') || timeStr.toLowerCase().contains('immediate')) {
      return true;
    }

    try {
      final cleanTime = timeStr.trim();
      final rawDateStr = dateStr.trim();
      final dateOnly = rawDateStr.split('T')[0];

      int year = 0, month = 0, day = 0;
      if (RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(dateOnly)) {
        final parts = dateOnly.split('-');
        year = int.parse(parts[0]);
        month = int.parse(parts[1]);
        day = int.parse(parts[2]);
      } else {
        final parsedDate = DateTime.tryParse(rawDateStr);
        if (parsedDate == null) return true;
        year = parsedDate.year;
        month = parsedDate.month;
        day = parsedDate.day;
      }

      int hour = 0;
      int minute = 0;

      final match12 = RegExp(r'^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)$', caseSensitive: false).firstMatch(cleanTime);
      if (match12 != null) {
        hour = int.parse(match12.group(1)!);
        minute = match12.group(2) != null ? int.parse(match12.group(2)!) : 0;
        final period = match12.group(3)!.toUpperCase();
        if (period == 'PM' && hour < 12) hour += 12;
        if (period == 'AM' && hour == 12) hour = 0;
      } else {
        final match24 = RegExp(r'^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$').firstMatch(cleanTime);
        if (match24 != null) {
          hour = int.parse(match24.group(1)!);
          minute = match24.group(2) != null ? int.parse(match24.group(2)!) : 0;
        } else {
          return true;
        }
      }

      final scheduledDateTime = DateTime(year, month, day, hour, minute);
      return DateTime.now().isAfter(scheduledDateTime) || DateTime.now().isAtSameMomentAs(scheduledDateTime);
    } catch (e) {
      return true;
    }
  }
}
