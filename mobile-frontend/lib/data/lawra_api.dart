import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'session_store.dart';

String _defaultBaseUrl() {
  return defaultTargetPlatform == TargetPlatform.android
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080';

  // const override = String.fromEnvironment('BASE_URL');
  // if (override.isNotEmpty) return override;
  // return 'http://localhost:8080';
}

class LawraApiException implements Exception {
  LawraApiException(this.message, this.statusCode, this.body);

  final String message;
  final int statusCode;
  final Object? body;

  @override
  String toString() => 'LawraApiException($statusCode): $message';
}

class Tenant {
  Tenant({required this.id, required this.name});

  final String id;
  final String name;

  factory Tenant.fromJson(Map<String, dynamic> json) {
    return Tenant(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}

class UserProfile {
  UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.phoneNumber,
    this.balance,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final String? phoneNumber;
  final num? balance;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString(),
      balance: json['balance'] as num?,
    );
  }
}

class VirtualBank {
  VirtualBank({
    required this.id,
    required this.name,
    this.balance,
    this.createdById,
    this.createdBy,
    this.tenant,
  });

  final int id;
  final String name;
  final num? balance;
  final String? createdById;
  final String? createdBy;
  final String? tenant;

  factory VirtualBank.fromJson(Map<String, dynamic> json) {
    return VirtualBank(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      name: json['name']?.toString() ?? '',
      balance: json['balance'] as num?,
      createdById: json['createdById']?.toString(),
      createdBy: json['createdBy']?.toString(),
      tenant: json['tenant']?.toString(),
    );
  }
}

class LoanPackage {
  LoanPackage(
      {required this.id,
      required this.name,
      required this.balance,
      required this.interestRate,
      this.virtualBank});

  final int id;
  final String name;
  final num balance;
  final num interestRate;
  final VirtualBank? virtualBank;

  factory LoanPackage.fromJson(Map<String, dynamic> json) {
    return LoanPackage(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      name: json['name']?.toString() ?? '',
      balance: (json['balance'] as num?) ?? 0,
      interestRate: (json['interestRate'] as num?) ?? 0,
      virtualBank: json['virtualBank'] is Map<String, dynamic>
          ? VirtualBank.fromJson(json['virtualBank'] as Map<String, dynamic>)
          : null,
    );
  }
}

enum LoanPeriod { threeMonths, sixMonths, oneYear }

extension LoanPeriodValue on LoanPeriod {
  String get apiValue {
    switch (this) {
      case LoanPeriod.threeMonths:
        return 'THREE_MONTHS';
      case LoanPeriod.sixMonths:
        return 'SIX_MONTHS';
      case LoanPeriod.oneYear:
        return 'ONE_YEAR';
    }
  }

  String get label {
    switch (this) {
      case LoanPeriod.threeMonths:
        return '3 Months';
      case LoanPeriod.sixMonths:
        return '6 Months';
      case LoanPeriod.oneYear:
        return '1 Year';
    }
  }
}

class LoanSummary {
  LoanSummary({
    required this.id,
    required this.status,
    this.borrowerId,
    this.borrowerName,
    this.amount,
    this.interest,
    this.virtualBank,
    this.tenure,
    this.repaymentAmount,
    this.installment,
    this.bank,
    this.dueDate,
    this.accountName,
    this.accountNumber,
  });

  final int id;
  final String status;
  final String? borrowerId;
  final String? borrowerName;
  final num? amount;
  final String? interest;
  final String? virtualBank;
  final String? tenure;
  final num? repaymentAmount;
  final num? installment;
  final String? bank;
  final String? dueDate;
  final String? accountName;
  final String? accountNumber;

  factory LoanSummary.fromJson(Map<String, dynamic> json) {
    return LoanSummary(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      status: json['status']?.toString() ?? 'PENDING',
      borrowerId: json['borrowerId']?.toString(),
      borrowerName: json['borrowerName']?.toString(),
      amount: json['amount'] as num?,
      interest: json['interest']?.toString(),
      virtualBank: json['virtualBank']?.toString(),
      tenure: json['tenure']?.toString(),
      repaymentAmount: json['repaymentAmount'] as num?,
      installment: json['installment'] as num?,
      bank: json['bank']?.toString(),
      dueDate: json['dueDate']?.toString(),
      accountName: json['accountName']?.toString(),
      accountNumber: json['accountNumber']?.toString(),
    );
  }
}

class AuditLogSummary {
  AuditLogSummary({
    required this.id,
    required this.timestamp,
    this.actorId,
    this.actorEmail,
    this.actorRole,
    required this.action,
    required this.resourceType,
    this.resourceId,
    required this.httpMethod,
    required this.path,
    this.statusCode,
    this.ipAddress,
    this.userAgent,
    this.beforeStatePreview,
    this.afterStatePreview,
  });

  final int id;
  final String timestamp;

  final String? actorId;
  final String? actorEmail;
  final String? actorRole;

  final String action;
  final String resourceType;
  final String? resourceId;

  final String httpMethod;
  final String path;
  final int? statusCode;

  final String? ipAddress;
  final String? userAgent;

  final String? beforeStatePreview;
  final String? afterStatePreview;

  factory AuditLogSummary.fromJson(Map<String, dynamic> json) {
    return AuditLogSummary(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      timestamp: json['timestamp']?.toString() ?? '',
      actorId: json['actorId']?.toString(),
      actorEmail: json['actorEmail']?.toString(),
      actorRole: json['actorRole']?.toString(),
      action: json['action']?.toString() ?? '',
      resourceType: json['resourceType']?.toString() ?? '',
      resourceId: json['resourceId']?.toString(),
      httpMethod: json['httpMethod']?.toString() ?? '',
      path: json['path']?.toString() ?? '',
      statusCode: (json['statusCode'] as num?)?.toInt(),
      ipAddress: json['ipAddress']?.toString(),
      userAgent: json['userAgent']?.toString(),
      beforeStatePreview: json['beforeStatePreview']?.toString(),
      afterStatePreview: json['afterStatePreview']?.toString(),
    );
  }
}

class LawraApi {
  LawraApi({String? baseUrl})
      : baseUrl = baseUrl ??
            const String.fromEnvironment('LAWRA_API_BASE_URL',
                defaultValue: '') {
    _resolvedBaseUrl =
        this.baseUrl.isNotEmpty ? this.baseUrl : _defaultBaseUrl();
  }

  final String baseUrl;
  late final String _resolvedBaseUrl;

  Uri _uri(String path) {
    if (path.startsWith('http')) {
      return Uri.parse(path);
    }
    return Uri.parse('$_resolvedBaseUrl$path');
  }

  Future<Map<String, String>> _headers({bool publicRoute = false}) async {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (!publicRoute) {
      final session = await SessionStore.readAuth();
      if (session != null && session.token.isNotEmpty) {
        headers['Authorization'] = 'Bearer ${session.token}';
      }
    }
    return headers;
  }

  Future<dynamic> _send(String path,
      {String method = 'GET', Object? body, bool publicRoute = false}) async {
    final response = await http.Request(method, _uri(path))
      ..headers.addAll(await _headers(publicRoute: publicRoute))
      ..body = body == null ? '' : jsonEncode(body);

    final streamed = await response.send();

    final rawBody = await streamed.stream.bytesToString();

    final isJson =
        streamed.headers['content-type']?.contains('application/json') ?? false;

    final decodedBody = rawBody.isEmpty
        ? null
        : isJson
            ? jsonDecode(rawBody)
            : rawBody;

    if (streamed.statusCode < 200 || streamed.statusCode >= 300) {
      if (streamed.statusCode == 401 && !publicRoute) {
        await SessionStore.clearAuth();
      }

      final message = decodedBody is Map<String, dynamic>
          ? (decodedBody['message'] ??
              decodedBody['error'] ??
              streamed.reasonPhrase ??
              'Request failed')
          : (rawBody.isNotEmpty
              ? rawBody
              : (streamed.reasonPhrase ?? 'Request failed'));

      throw LawraApiException(
          message.toString(), streamed.statusCode, decodedBody);
    }

    return decodedBody;
  }

  Future<AuthSession> login(
      {required String email,
      required String password,
      required String tenantId}) async {
    final data = await _send(
      '/auth/login',
      method: 'POST',
      body: {'email': email, 'password': password, 'tenantId': tenantId},
      publicRoute: true,
    ) as Map<String, dynamic>;

    return AuthSession.fromJson(data);
  }

  Future<void> requestPasswordReset(
      {required String email, required String tenantId}) async {
    await _send(
      '/auth/request-password-reset',
      method: 'POST',
      body: {'email': email, 'tenantId': tenantId},
      publicRoute: true,
    );
  }

  Future<void> resetPassword(
      {required String token, required String newPassword}) async {
    await _send(
      '/auth/reset-password',
      method: 'POST',
      body: {'token': token, 'newPassword': newPassword},
      publicRoute: true,
    );
  }

  Future<List<Tenant>> fetchTenants() async {
    final data = await _send('/tenants') as List<dynamic>;
    return data.cast<Map<String, dynamic>>().map(Tenant.fromJson).toList();
  }

  Future<Tenant> fetchTenantById(String id) async {
    final data = await _send('/tenants/$id') as Map<String, dynamic>;
    return Tenant.fromJson(data);
  }

  Future<Tenant> createTenant(String name) async {
    final data = await _send('/tenants', method: 'POST', body: {'name': name})
        as Map<String, dynamic>;
    return Tenant.fromJson(data);
  }

  Future<Tenant> updateTenant(String id, String name) async {
    final data =
        await _send('/tenants/$id', method: 'PUT', body: {'name': name})
            as Map<String, dynamic>;
    return Tenant.fromJson(data);
  }

  Future<void> deleteTenant(String id) async {
    await _send('/tenants/$id', method: 'DELETE');
  }

  Future<UserProfile> fetchUserById(String id) async {
    final data = await _send('/users/$id') as Map<String, dynamic>;
    return UserProfile.fromJson(data);
  }

  Future<List<UserProfile>> fetchUsers() async {
    final data = await _send('/users') as List<dynamic>;
    return data.cast<Map<String, dynamic>>().map(UserProfile.fromJson).toList();
  }

  Future<UserProfile> createUser({
    required String email,
    required String fullName,
    required String phoneNumber,
    required String password,
    required String tenantId,
    String? role,
  }) async {
    final data = await _send(
      '/users',
      method: 'POST',
      body: {
        'email': email,
        'fullName': fullName,
        'phoneNumber': phoneNumber,
        'password': password,
        'tenantId': tenantId,
        if (role != null) 'role': role,
      },
      publicRoute: true,
    ) as Map<String, dynamic>;

    return UserProfile.fromJson(data);
  }

  Future<UserProfile> provisionUser(
      {required String email,
      required String fullName,
      required String phoneNumber}) async {
    final data = await _send(
      '/users/provision',
      method: 'POST',
      body: {'email': email, 'fullName': fullName, 'phoneNumber': phoneNumber},
    ) as Map<String, dynamic>;
    return UserProfile.fromJson(data);
  }

  Future<UserProfile> updateUser(String id,
      {String? email,
      String? fullName,
      String? phoneNumber,
      String? password}) async {
    final data = await _send(
      '/users/$id',
      method: 'PUT',
      body: {
        if (email != null) 'email': email,
        if (fullName != null) 'fullName': fullName,
        if (phoneNumber != null) 'phoneNumber': phoneNumber,
        if (password != null) 'password': password,
      },
    ) as Map<String, dynamic>;
    return UserProfile.fromJson(data);
  }

  Future<UserProfile> topUpCurrentUserBalance(num amount) async {
    final data = await _send('/users/me/balance/top-up',
        method: 'POST', body: {'amount': amount}) as Map<String, dynamic>;
    return UserProfile.fromJson(data);
  }

  Future<void> deleteUser(String id) async {
    await _send('/users/$id', method: 'DELETE');
  }

  Future<List<VirtualBank>> fetchVirtualBanks() async {
    final data = await _send('/banks') as List<dynamic>;
    return data.cast<Map<String, dynamic>>().map(VirtualBank.fromJson).toList();
  }

  Future<VirtualBank> createVirtualBank(
      {required String name, num? balance}) async {
    final data = await _send('/banks',
        method: 'POST',
        body: {'name': name, 'balance': balance}) as Map<String, dynamic>;
    return VirtualBank.fromJson(data);
  }

  Future<VirtualBank> updateVirtualBank(int id, {required String name}) async {
    final data = await _send('/banks/$id', method: 'PUT', body: {'name': name})
        as Map<String, dynamic>;
    return VirtualBank.fromJson(data);
  }

  Future<VirtualBank> topUpVirtualBank(int id, num amount) async {
    final data = await _send('/banks/$id/top-up',
        method: 'PATCH', body: {'amount': amount}) as Map<String, dynamic>;
    return VirtualBank.fromJson(data);
  }

  Future<void> deleteVirtualBank(int id) async {
    await _send('/banks/$id', method: 'DELETE');
  }

  Future<List<LoanPackage>> fetchLoanPackages() async {
    final data = await _send('/loan-packages') as List<dynamic>;
    return data.cast<Map<String, dynamic>>().map(LoanPackage.fromJson).toList();
  }

  Future<LoanPackage> fetchLoanPackageById(int id) async {
    final data = await _send('/loan-packages/$id') as Map<String, dynamic>;
    return LoanPackage.fromJson(data);
  }

  Future<LoanPackage> createLoanPackage(
      {required String name,
      required int virtualBankId,
      required num balance,
      required num interestRate}) async {
    final data = await _send(
      '/loan-packages',
      method: 'POST',
      body: {
        'name': name,
        'balance': balance,
        'interestRate': interestRate,
        'virtualBank': {'id': virtualBankId},
      },
    ) as Map<String, dynamic>;
    return LoanPackage.fromJson(data);
  }

  Future<LoanPackage> updateLoanPackage(int id,
      {required String name,
      required int virtualBankId,
      required num balance,
      required num interestRate}) async {
    final data = await _send(
      '/loan-packages/$id',
      method: 'PUT',
      body: {
        'name': name,
        'balance': balance,
        'interestRate': interestRate,
        'virtualBank': {'id': virtualBankId},
      },
    ) as Map<String, dynamic>;
    return LoanPackage.fromJson(data);
  }

  Future<void> deleteLoanPackage(int id) async {
    await _send('/loan-packages/$id', method: 'DELETE');
  }

  Future<void> createLoan({
    required int loanPackageId,
    required String borrowerId,
    required num principalAmount,
    required num interestRate,
    required LoanPeriod period,
  }) async {
    await _send(
      '/loans',
      method: 'POST',
      body: {
        'loanPackageId': loanPackageId,
        'borrowerId': borrowerId,
        'principalAmount': principalAmount,
        'interestRate': interestRate,
        'period': period.apiValue,
      },
    );
  }

  Future<List<LoanSummary>> fetchBorrowerLoans(String borrowerId) async {
    final data = await _send('/users/$borrowerId/loans') as List<dynamic>;
    return data.cast<Map<String, dynamic>>().map(LoanSummary.fromJson).toList();
  }

  Future<List<LoanSummary>> fetchLoans({String? status}) async {
    final path = status == null ? '/loans' : '/loans?status=$status';
    final data = await _send(path) as List<dynamic>;
    return data.cast<Map<String, dynamic>>().map(LoanSummary.fromJson).toList();
  }

  Future<LoanSummary> updateLoanStatus(int id, String loanStatus) async {
    final data = await _send('/loans/$id',
        method: 'PUT',
        body: {'loanStatus': loanStatus}) as Map<String, dynamic>;
    return LoanSummary.fromJson(data);
  }

  Future<List<AuditLogSummary>> fetchAuditLogs({
    int page = 0,
    int size = 50,
    DateTime? from,
    DateTime? to,
    String? actorEmail,
    String? action,
    String? resourceType,
    String? resourceId,
  }) async {
    final query = <String, String>{};
    query['page'] = page.toString();
    query['size'] = size.toString();
    if (from != null) query['from'] = from.toUtc().toIso8601String();
    if (to != null) query['to'] = to.toUtc().toIso8601String();
    if (actorEmail != null && actorEmail.isNotEmpty)
      query['actorEmail'] = actorEmail;
    if (action != null && action.isNotEmpty) query['action'] = action;
    if (resourceType != null && resourceType.isNotEmpty)
      query['resourceType'] = resourceType;
    if (resourceId != null && resourceId.isNotEmpty)
      query['resourceId'] = resourceId;

    final path = '/audit-logs?${Uri(queryParameters: query).query}';
    final data = await _send(path) as Map<String, dynamic>;

    final content = (data['content'] as List<dynamic>? ?? []);
    return content
        .cast<Map<String, dynamic>>()
        .map(AuditLogSummary.fromJson)
        .toList();
  }
}
