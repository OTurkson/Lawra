import 'package:flutter/material.dart';

import '../data/lawra_api.dart';
import '../theme/lawra_theme.dart';

const List<String> actionOptions = [
  "USER_CREATE",
  "USER_PROVISION",
  "USER_INVITE",
  "USER_UPDATE",
  "USER_BALANCE_TOP_UP",
  "USER_DELETE",
  "TENANT_CREATE",
  "TENANT_UPDATE",
  "TENANT_DELETE",
  "VIRTUAL_BANK_CREATE",
  "VIRTUAL_BANK_UPDATE",
  "VIRTUAL_BANK_TOP_UP",
  "VIRTUAL_BANK_DELETE",
  "LOAN_PACKAGE_CREATE",
  "LOAN_PACKAGE_UPDATE",
  "LOAN_PACKAGE_DELETE",
  "LOAN_CREATE",
  "LOAN_STATUS_UPDATE",
  "AUTH_LOGIN",
  "PASSWORD_RESET_REQUEST",
  "PASSWORD_RESET_COMPLETE",
];

class AuditLogsScreen extends StatefulWidget {
  const AuditLogsScreen({super.key});

  @override
  State<AuditLogsScreen> createState() => _AuditLogsScreenState();
}

class _AuditLogsScreenState extends State<AuditLogsScreen> {
  final LawraApi _api = LawraApi();

  bool _isLoading = true;
  String? _error;
  List<AuditLogSummary> _logs = [];

  DateTimeRange? _range;
  String? _action;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      DateTime? from = _range?.start;
      DateTime? to = _range?.end;

      final data = await _api.fetchAuditLogs(
        page: 0,
        size: 100,
        from: from,
        to: to,
        action: _action,
      );

      if (!mounted) return;
      setState(() {
        _logs = data;
        _isLoading = false;
      });
    } on LawraApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _pickRange() async {
    final now = DateTime.now();
    final first = DateTime(now.year - 1, 1, 1);
    final initialStart = _range?.start ?? first;
    final initialEnd = _range?.end ?? now;

    final picked = await showDateRangePicker(
      context: context,
      firstDate: first,
      lastDate: now,
      initialDateRange: DateTimeRange(start: initialStart, end: initialEnd),
    );

    if (picked == null) return;

    setState(() {
      _range = picked;
    });

    await _refresh();
  }

  String _formatTime(String timestamp) {
    try {
      final dt = DateTime.parse(timestamp).toLocal();
      return "${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')} "
          "${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}";
    } catch (_) {
      return timestamp;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Audit Logs"),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [LawraColors.green, LawraColors.cyan],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error_outline,
                              size: 48, color: LawraColors.destructive),
                          const SizedBox(height: 16),
                          Text(_error!),
                          const SizedBox(height: 16),
                          ElevatedButton(
                              onPressed: _refresh, child: const Text("Retry")),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _SectionCard(
                        title: 'Filters',
                        child: Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            OutlinedButton.icon(
                              onPressed: _pickRange,
                              icon: const Icon(Icons.date_range),
                              label: Text(
                                _range == null
                                    ? "Pick date range"
                                    : "${_range!.start.year}-${_range!.start.month.toString().padLeft(2, '0')}..${_range!.end.year}-${_range!.end.month.toString().padLeft(2, '0')}",
                              ),
                            ),
                            SizedBox(
                              width: 260,
                              child: DropdownButtonFormField<String>(
                                initialValue: _action,
                                decoration:
                                    const InputDecoration(labelText: "Action"),
                                isExpanded: true,
                                items: [
                                  const DropdownMenuItem<String>(
                                    value: null,
                                    child: Text("All"),
                                  ),
                                  ...actionOptions.map(
                                    (a) => DropdownMenuItem<String>(
                                      value: a,
                                      child: Text(a),
                                    ),
                                  ),
                                ],
                                onChanged: (value) async {
                                  setState(() => _action = value);
                                  await _refresh();
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_logs.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Text("No audit logs found.",
                              style: TextStyle(color: LawraColors.textMuted)),
                        )
                      else ..._logs.map((log) {
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      log.action,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: LawraColors.cyan.withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        "${log.statusCode ?? "-"}",
                                        style: const TextStyle(
                                            color: LawraColors.cyan,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                _InfoRow(
                                    "Time", _formatTime(log.timestamp)),
                                _InfoRow("Actor",
                                    log.actorEmail ?? log.actorId ?? "-"),
                                _InfoRow("Resource",
                                    "${log.resourceType}:${log.resourceId ?? "-"}"),
                                _InfoRow(
                                    "HTTP", "${log.httpMethod} ${log.path}"),
                              ],
                            ),
                          ),
                        );
                      }),
                      const SizedBox(height: 24),
                    ],
                  ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 4,
                  height: 20,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [LawraColors.green, LawraColors.cyan],
                    ),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Text(title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: LawraColors.textDark,
                    )),
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(label,
                style: const TextStyle(color: LawraColors.textMuted)),
          ),
          Text(value,
              style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

