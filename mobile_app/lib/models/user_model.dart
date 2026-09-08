class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String avatar;
  final String gender;
  final String address;
  final String status;
  final Map<String, dynamic>? membership;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.avatar = '',
    this.gender = '',
    this.address = '',
    this.status = 'Active',
    this.membership,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'customer',
      avatar: json['avatar'] ?? '',
      gender: json['gender'] ?? '',
      address: json['address'] ?? '',
      status: json['status'] ?? 'Active',
      membership: json['membership'] is Map<String, dynamic> ? json['membership'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role,
      'avatar': avatar,
      'gender': gender,
      'address': address,
      'status': status,
      if (membership != null) 'membership': membership,
    };
  }
}
