class AttendanceBreak {
  final String? id;
  final String start;
  final String? end;
  final DateTime? startTimestamp;
  final DateTime? endTimestamp;
  final int duration;

  AttendanceBreak({
    this.id,
    required this.start,
    this.end,
    this.startTimestamp,
    this.endTimestamp,
    this.duration = 0,
  });

  factory AttendanceBreak.fromJson(Map<String, dynamic> json) {
    return AttendanceBreak(
      id: json['_id']?.toString(),
      start: json['start']?.toString() ?? '',
      end: json['end']?.toString(),
      startTimestamp: json['startTimestamp'] != null
          ? DateTime.tryParse(json['startTimestamp'].toString())
          : null,
      endTimestamp: json['endTimestamp'] != null
          ? DateTime.tryParse(json['endTimestamp'].toString())
          : null,
      duration: (json['duration'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) '_id': id,
        'start': start,
        if (end != null) 'end': end,
        if (startTimestamp != null) 'startTimestamp': startTimestamp!.toIso8601String(),
        if (endTimestamp != null) 'endTimestamp': endTimestamp!.toIso8601String(),
        'duration': duration,
      };
}

class AttendanceModel {
  final String? id;
  final String employeeId;
  final String employeeName;
  final String date;
  final String? clockIn;
  final String? clockOut;
  final DateTime? clockInTimestamp;
  final DateTime? clockOutTimestamp;
  final String status;
  final String attendanceState;
  final String attendanceType;
  final List<AttendanceBreak> breaks;
  final int totalBreakDuration;
  final int totalShiftDuration;
  final int effectiveWorkingDuration;
  final String? branchId;
  final bool isOnApprovedLeave;

  AttendanceModel({
    this.id,
    required this.employeeId,
    required this.employeeName,
    required this.date,
    this.clockIn,
    this.clockOut,
    this.clockInTimestamp,
    this.clockOutTimestamp,
    this.status = 'Present',
    this.attendanceState = 'NOT_CLOCKED_IN',
    this.attendanceType = 'NOT_FINALIZED',
    this.breaks = const [],
    this.totalBreakDuration = 0,
    this.totalShiftDuration = 0,
    this.effectiveWorkingDuration = 0,
    this.branchId,
    this.isOnApprovedLeave = false,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    var rawBreaks = json['breaks'];
    List<AttendanceBreak> parsedBreaks = [];
    if (rawBreaks is List) {
      for (var b in rawBreaks) {
        if (b is Map<String, dynamic>) {
          parsedBreaks.add(AttendanceBreak.fromJson(b));
        } else if (b is Map) {
          parsedBreaks.add(AttendanceBreak.fromJson(Map<String, dynamic>.from(b)));
        }
      }
    }

    return AttendanceModel(
      id: json['_id']?.toString(),
      employeeId: json['employeeId']?.toString() ?? '',
      employeeName: json['employeeName']?.toString() ?? 'Staff Member',
      date: json['date']?.toString() ?? '',
      clockIn: json['clockIn']?.toString(),
      clockOut: json['clockOut']?.toString(),
      clockInTimestamp: json['clockInTimestamp'] != null
          ? DateTime.tryParse(json['clockInTimestamp'].toString())
          : null,
      clockOutTimestamp: json['clockOutTimestamp'] != null
          ? DateTime.tryParse(json['clockOutTimestamp'].toString())
          : null,
      status: json['status']?.toString() ?? 'Present',
      attendanceState: json['attendanceState']?.toString() ?? 'NOT_CLOCKED_IN',
      attendanceType: json['attendanceType']?.toString() ?? 'NOT_FINALIZED',
      breaks: parsedBreaks,
      totalBreakDuration: (json['totalBreakDuration'] as num?)?.toInt() ?? 0,
      totalShiftDuration: (json['totalShiftDuration'] as num?)?.toInt() ?? 0,
      effectiveWorkingDuration: (json['effectiveWorkingDuration'] as num?)?.toInt() ?? 0,
      branchId: json['branchId']?.toString(),
      isOnApprovedLeave: json['isOnApprovedLeave'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) '_id': id,
        'employeeId': employeeId,
        'employeeName': employeeName,
        'date': date,
        if (clockIn != null) 'clockIn': clockIn,
        if (clockOut != null) 'clockOut': clockOut,
        if (clockInTimestamp != null) 'clockInTimestamp': clockInTimestamp!.toIso8601String(),
        if (clockOutTimestamp != null) 'clockOutTimestamp': clockOutTimestamp!.toIso8601String(),
        'status': status,
        'attendanceState': attendanceState,
        'attendanceType': attendanceType,
        'breaks': breaks.map((b) => b.toJson()).toList(),
        'totalBreakDuration': totalBreakDuration,
        'totalShiftDuration': totalShiftDuration,
        'effectiveWorkingDuration': effectiveWorkingDuration,
        if (branchId != null) 'branchId': branchId,
        'isOnApprovedLeave': isOnApprovedLeave,
      };
}
