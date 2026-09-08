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
}
