import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class AuthSession {
  const AuthSession({
    required this.token,
    required this.userId,
    required this.tenantId,
    required this.role,
  });

  final String token;
  final String userId;
  final String tenantId;
  final String role;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      token: json['token'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      tenantId: json['tenantId'] as String? ?? '',
      role: json['role'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'userId': userId,
      'tenantId': tenantId,
      'role': role,
    };
  }
}

class SessionStore {
  SessionStore._();

  static const String _authKey = 'lawra_auth';

  static Future<AuthSession?> readAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_authKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }

    try {
      return AuthSession.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveAuth(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_authKey, jsonEncode(session.toJson()));
  }

  static Future<void> clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_authKey);
  }
}
