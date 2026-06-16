import 'package:flutter/material.dart';

import '../data/lawra_api.dart';

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
                          Text(_error!),
                          const SizedBox(height: 16),
                          FilledButton(onPressed: _refresh, child: const Text("Retry")),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                "Filters",
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 12),
                              Wrap(
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
                                      decoration: const InputDecoration(labelText: "Action"),
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
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_logs.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Text("No audit logs found."),
                        )
                      else ..._logs.map((log) {
                        final effect = log.afterStatePreview ?? log.beforeStatePreview ?? "-";
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "${log.action}  (${log.statusCode ?? "-"})",
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 6),
                                Text("Time: ${_formatTime(log.timestamp)}"),
                                Text("Actor: ${log.actorEmail ?? log.actorId ?? "-"}"),
                                Text("Resource: ${log.resourceType}:${log.resourceId ?? "-"}"),
                                Text("HTTP: ${log.httpMethod} ${log.path}"),
                                const SizedBox(height: 8),
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

