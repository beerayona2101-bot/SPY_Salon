class SpecialistModel {
  final String id;
  final String name;
  final String role;
  final double rating;
  final String experience;
  final String specialty;

  SpecialistModel({
    required this.id,
    required this.name,
    required this.role,
    required this.rating,
    required this.experience,
    required this.specialty,
  });

  factory SpecialistModel.fromJson(Map<String, dynamic> json) {
    return SpecialistModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? 'Specialist',
      rating: (json['rating'] != null) ? (json['rating'] as num).toDouble() : 4.9,
      experience: json['experience'] ?? '5+ Yrs',
      specialty: json['specialty'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'role': role,
      'rating': rating,
      'experience': experience,
      'specialty': specialty,
    };
  }
}
