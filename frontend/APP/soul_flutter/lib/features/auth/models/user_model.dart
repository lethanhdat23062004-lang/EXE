import 'dart:convert';

/// User model - mirrors TypeScript User interface in store/index.ts
class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final String status;
  final String? phone;
  final String? gender;
  final String? dateOfBirth;
  final String? avatarUrl;
  final String? bio;
  final bool isPremium;

  const UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.status,
    this.phone,
    this.gender,
    this.dateOfBirth,
    this.avatarUrl,
    this.bio,
    this.isPremium = false,
  });

  /// Get the last part of the full name (Vietnamese convention: last word = first name)
  String get firstName {
    final parts = fullName.trim().split(' ');
    return parts.isNotEmpty ? parts.last : 'bạn';
  }

  bool get isAdmin => role == 'admin';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
      status: json['status']?.toString() ?? 'active',
      phone: json['phone']?.toString(),
      gender: json['gender']?.toString(),
      dateOfBirth: json['dateOfBirth']?.toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      bio: json['bio']?.toString(),
      isPremium: json['isPremium'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'fullName': fullName,
      'email': email,
      'role': role,
      'status': status,
      if (phone != null) 'phone': phone,
      if (gender != null) 'gender': gender,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (bio != null) 'bio': bio,
      'isPremium': isPremium,
    };
  }

  String toJsonString() => jsonEncode(toJson());

  UserModel copyWith({
    String? fullName,
    String? phone,
    String? gender,
    String? dateOfBirth,
    String? avatarUrl,
    String? bio,
    bool? isPremium,
  }) {
    return UserModel(
      id: id,
      fullName: fullName ?? this.fullName,
      email: email,
      role: role,
      status: status,
      phone: phone ?? this.phone,
      gender: gender ?? this.gender,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      isPremium: isPremium ?? this.isPremium,
    );
  }
}
