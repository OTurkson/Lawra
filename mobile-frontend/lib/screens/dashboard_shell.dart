import 'package:flutter/material.dart';

import '../data/lawra_api.dart';
import '../data/session_store.dart';

class DashboardShell extends StatefulWidget {
  const DashboardShell({
    super.key,
    required this.session,
    required this.onSignedOut,
  });

  final AuthSession session;
  final VoidCallback onSignedOut;

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  final LawraApi _api = LawraApi();
  int _index = 0;
  bool _isLoadingUser = true;
  UserProfile? _currentUser;
  String? _loadError;
  final List<_Notice> _notices = [];

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    try {
      final user = await _api.fetchUserById(widget.session.userId);
      if (!mounted) {
        return;
      }
      setState(() {
        _currentUser = user;
        _isLoadingUser = false;
        _loadError = null;
      });
    } on LawraApiException catch (error) {
      if (error.statusCode == 401) {
        await _signOut();
        return;
      }
      if (!mounted) {
        return;
      }
      setState(() {
        _loadError = error.message;
        _isLoadingUser = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _loadError = error.toString();
        _isLoadingUser = false;
      });
    }
  }

  Future<void> _signOut() async {
    await SessionStore.clearAuth();
    if (!mounted) {
      return;
    }
    widget.onSignedOut();
  }

  void _addNotice(String message, {String type = 'info'}) {
    if (!mounted) {
      return;
    }
    setState(() {
      _notices.insert(
        0,
        _Notice(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          message: message,
          type: type,
          timestamp: DateTime.now(),
        ),
      );
    });
  }

  String _titleForIndex(int index) {
    switch (index) {
      case 0:
        return 'Borrower';
      case 1:
        return 'Lender';
      case 2:
        return 'Loans';
      case 3:
        return 'Virtual Banks';
      default:
        return 'Lawra';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingUser) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_loadError != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Unable to load your profile',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  _loadError!,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _loadCurrentUser,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final pages = <Widget>[
      BorrowerTab(api: _api, session: widget.session, currentUser: _currentUser, addNotice: _addNotice),
      LenderTab(api: _api, session: widget.session, currentUser: _currentUser, addNotice: _addNotice),
      LoansTab(api: _api, currentUser: _currentUser, addNotice: _addNotice),
      BanksTab(api: _api, session: widget.session, currentUser: _currentUser, addNotice: _addNotice),
    ];

    return Scaffold(
      drawer: _AppDrawer(
        currentUser: _currentUser,
        session: widget.session,
        notices: _notices,
        onOpenSettings: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => SettingsScreen(api: _api, currentUser: _currentUser, session: widget.session, addNotice: _addNotice),
            ),
          );
        },
        onOpenNotifications: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => NotificationsScreen(notices: _notices),
            ),
          );
        },
        onOpenAbout: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const AboutScreen()),
          );
        },
        onLogout: _signOut,
      ),
      appBar: AppBar(
        title: Text(_titleForIndex(_index)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => NotificationsScreen(notices: _notices)),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _signOut,
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (value) => setState(() => _index = value),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.handshake_outlined), label: 'Borrower'),
          BottomNavigationBarItem(icon: Icon(Icons.currency_exchange), label: 'Lender'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Loans'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance), label: 'Banks'),
        ],
      ),
    );
  }
}

class BorrowerTab extends StatefulWidget {
  const BorrowerTab({
    super.key,
    required this.api,
    required this.session,
    required this.currentUser,
    required this.addNotice,
  });

  final LawraApi api;
  final AuthSession session;
  final UserProfile? currentUser;
  final ValueChanged<String> addNotice;

  @override
  State<BorrowerTab> createState() => _BorrowerTabState();
}

class _BorrowerTabState extends State<BorrowerTab> {
  bool _isLoading = true;
  String? _error;
  List<LoanPackage> _packages = [];
  List<LoanSummary> _loans = [];
  String? _selectedPackageId;
  String _principal = '';
  LoanPeriod _period = LoanPeriod.threeMonths;
  bool _isSubmitting = false;

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
      final results = await Future.wait([
        widget.api.fetchLoanPackages(),
        widget.api.fetchBorrowerLoans(widget.session.userId),
      ]);
      if (!mounted) {
        return;
      }
      setState(() {
        _packages = results[0] as List<LoanPackage>;
        _loans = results[1] as List<LoanSummary>;
        _isLoading = false;
      });
    } on LawraApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _submitLoan() async {
    final packageId = int.tryParse(_selectedPackageId ?? '');
    final amount = num.tryParse(_principal);
    final selectedPackage = _packages.where((item) => item.id == packageId).cast<LoanPackage?>().firstWhere(
      (item) => item != null,
      orElse: () => null,
    );

    if (packageId == null || amount == null || amount <= 0) {
      _showMessage('Select a package and enter a valid amount.');
      return;
    }

    if (selectedPackage != null && amount > selectedPackage.balance) {
      _showMessage('Requested amount exceeds the package balance.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final selected = _packages.firstWhere((item) => item.id == packageId);
      await widget.api.createLoan(
        loanPackageId: packageId,
        borrowerId: widget.session.userId,
        principalAmount: amount,
        interestRate: selected.interestRate,
        period: _period,
      );
      widget.addNotice('Loan request submitted for Gh¢ ${amount.toStringAsFixed(2)}', type: 'loan');
      if (!mounted) {
        return;
      }
      setState(() {
        _selectedPackageId = null;
        _principal = '';
      });
      await _refresh();
      _showMessage('Loan request submitted.');
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorState(message: _error!, onRetry: _refresh);
    }

    final currentUser = widget.currentUser;
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SummaryCard(
            title: currentUser?.fullName ?? 'Borrower',
            subtitle: currentUser?.email ?? widget.session.role,
            amount: currentUser?.balance,
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Request a loan',
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: _selectedPackageId,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Loan package'),
                  items: _packages
                      .map(
                        (item) => DropdownMenuItem(
                          value: item.id.toString(),
                          child: Text('#${item.id} - ${item.virtualBank?.name ?? 'Loan Package'}'),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedPackageId = value;
                    });
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Principal amount'),
                  keyboardType: TextInputType.number,
                  onChanged: (value) => _principal = value,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<LoanPeriod>(
                  value: _period,
                  decoration: const InputDecoration(labelText: 'Period'),
                  items: LoanPeriod.values
                      .map((item) => DropdownMenuItem(value: item, child: Text(item.label)))
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _period = value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _isSubmitting ? null : _submitLoan,
                    child: Text(_isSubmitting ? 'Submitting...' : 'Request Loan'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'My loan applications',
            child: _loans.isEmpty
                ? const Text('No loan applications yet.')
                : Column(
                    children: _loans.map((loan) => _LoanTile(loan: loan)).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

class LenderTab extends StatefulWidget {
  const LenderTab({
    super.key,
    required this.api,
    required this.session,
    required this.currentUser,
    required this.addNotice,
  });

  final LawraApi api;
  final AuthSession session;
  final UserProfile? currentUser;
  final ValueChanged<String> addNotice;

  @override
  State<LenderTab> createState() => _LenderTabState();
}

class _LenderTabState extends State<LenderTab> {
  bool _isLoading = true;
  String? _error;
  List<VirtualBank> _banks = [];
  List<LoanPackage> _packages = [];
  String? _selectedBankId;
  String _balance = '';
  String _interestRate = '';
  bool _isSaving = false;

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
      final results = await Future.wait([
        widget.api.fetchVirtualBanks(),
        widget.api.fetchLoanPackages(),
      ]);
      if (!mounted) {
        return;
      }
      setState(() {
        _banks = results[0] as List<VirtualBank>;
        _packages = results[1] as List<LoanPackage>;
        _isLoading = false;
      });
    } on LawraApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  List<VirtualBank> get _ownedBanks {
    final userId = widget.session.userId;
    final isAdmin = widget.currentUser?.role.toUpperCase() == 'ADMIN' || widget.currentUser?.role.toUpperCase() == 'PAYMASTER';
    return _banks.where((bank) => isAdmin || bank.createdById == userId).toList();
  }

  Future<void> _createPackage() async {
    final bankId = int.tryParse(_selectedBankId ?? '');
    final balance = num.tryParse(_balance);
    final interestRate = num.tryParse(_interestRate);

    if (bankId == null || balance == null || interestRate == null) {
      _showMessage('Select a bank and fill out balance and interest.');
      return;
    }

    setState(() => _isSaving = true);
    try {
      await widget.api.createLoanPackage(
        virtualBankId: bankId,
        balance: balance,
        interestRate: interestRate,
      );
      widget.addNotice('Loan package created for bank #$bankId', type: 'package');
      if (!mounted) {
        return;
      }
      setState(() {
        _selectedBankId = null;
        _balance = '';
        _interestRate = '';
      });
      await _refresh();
      _showMessage('Loan package created.');
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorState(message: _error!, onRetry: _refresh);
    }

    final ownedBanks = _ownedBanks;
    final ownedPackages = _packages.where((item) => item.virtualBank?.createdById == widget.session.userId).toList();

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionCard(
            title: 'Create loan package',
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: _selectedBankId,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Virtual bank'),
                  items: ownedBanks
                      .map(
                        (bank) => DropdownMenuItem(
                          value: bank.id.toString(),
                          child: Text('${bank.name} (#${bank.id})'),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => _selectedBankId = value),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Balance'),
                  keyboardType: TextInputType.number,
                  onChanged: (value) => _balance = value,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Interest rate'),
                  keyboardType: TextInputType.number,
                  onChanged: (value) => _interestRate = value,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _isSaving ? null : _createPackage,
                    child: Text(_isSaving ? 'Saving...' : 'Create package'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'My loan packages',
            child: ownedPackages.isEmpty
                ? const Text('No loan packages yet.')
                : Column(
                    children: ownedPackages.map((item) => _PackageTile(package: item)).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

class LoansTab extends StatefulWidget {
  const LoansTab({super.key, required this.api, required this.currentUser, required this.addNotice});

  final LawraApi api;
  final UserProfile? currentUser;
  final ValueChanged<String> addNotice;

  @override
  State<LoansTab> createState() => _LoansTabState();
}

class _LoansTabState extends State<LoansTab> {
  bool _isLoading = true;
  String? _error;
  String? _statusFilter;
  List<LoanSummary> _loans = [];

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
      final data = await widget.api.fetchLoans(status: _statusFilter);
      if (!mounted) {
        return;
      }
      setState(() {
        _loans = data;
        _isLoading = false;
      });
    } on LawraApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _updateStatus(LoanSummary loan, String status) async {
    try {
      await widget.api.updateLoanStatus(loan.id, status);
      widget.addNotice('Loan #${loan.id} updated to $status', type: 'loan');
      await _refresh();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  bool get _isAdmin {
    final role = widget.currentUser?.role.toUpperCase();
    return role == 'ADMIN' || role == 'PAYMASTER';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorState(message: _error!, onRetry: _refresh);
    }

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionCard(
            title: 'Filter loans',
            child: DropdownButtonFormField<String>(
              value: _statusFilter,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem<String>(value: null, child: Text('All')),
                DropdownMenuItem<String>(value: 'PENDING', child: Text('Pending')),
                DropdownMenuItem<String>(value: 'APPROVED', child: Text('Approved')),
                DropdownMenuItem<String>(value: 'REJECTED', child: Text('Rejected')),
                DropdownMenuItem<String>(value: 'COMPLETED', child: Text('Completed')),
                DropdownMenuItem<String>(value: 'DEFAULTED', child: Text('Defaulted')),
              ],
              onChanged: (value) async {
                setState(() => _statusFilter = value);
                await _refresh();
              },
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Loan list',
            child: _loans.isEmpty
                ? const Text('No loans found.')
                : Column(
                    children: _loans.map(
                      (loan) {
                        final canAct = _isAdmin && loan.status == 'PENDING';
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Loan #${loan.id}', style: Theme.of(context).textTheme.titleMedium),
                                  const SizedBox(height: 4),
                                  Text('Borrower: ${loan.borrowerName ?? loan.borrowerId ?? '-'}'),
                                  Text('Amount: ${_money(loan.amount)}'),
                                  Text('Interest: ${loan.interest ?? '-'}'),
                                  Text('Tenure: ${loan.tenure ?? '-'}'),
                                  Text('Bank: ${loan.bank ?? loan.virtualBank ?? '-'}'),
                                  const SizedBox(height: 8),
                                  _StatusChip(status: loan.status),
                                  if (canAct) ...[
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 8,
                                      children: [
                                        OutlinedButton(
                                          onPressed: () => _updateStatus(loan, 'APPROVED'),
                                          child: const Text('Approve'),
                                        ),
                                        OutlinedButton(
                                          onPressed: () => _updateStatus(loan, 'REJECTED'),
                                          child: const Text('Reject'),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

class BanksTab extends StatefulWidget {
  const BanksTab({
    super.key,
    required this.api,
    required this.session,
    required this.currentUser,
    required this.addNotice,
  });

  final LawraApi api;
  final AuthSession session;
  final UserProfile? currentUser;
  final ValueChanged<String> addNotice;

  @override
  State<BanksTab> createState() => _BanksTabState();
}

class _BanksTabState extends State<BanksTab> {
  bool _isLoading = true;
  String? _error;
  List<VirtualBank> _banks = [];
  String _name = '';
  String _balance = '';
  bool _isCreating = false;

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
      final data = await widget.api.fetchVirtualBanks();
      if (!mounted) {
        return;
      }
      setState(() {
        _banks = data;
        _isLoading = false;
      });
    } on LawraApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _createBank() async {
    if (_name.trim().isEmpty) {
      _showMessage('Enter a bank name.');
      return;
    }

    setState(() => _isCreating = true);
    try {
      await widget.api.createVirtualBank(
        name: _name.trim(),
        balance: _balance.trim().isEmpty ? null : num.tryParse(_balance),
      );
      widget.addNotice('Virtual bank created: ${_name.trim()}', type: 'bank');
      if (!mounted) {
        return;
      }
      setState(() {
        _name = '';
        _balance = '';
      });
      await _refresh();
      _showMessage('Virtual bank created.');
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() => _isCreating = false);
      }
    }
  }

  Future<void> _openBankActions(VirtualBank bank) async {
    final renameController = TextEditingController(text: bank.name);
    final topUpController = TextEditingController();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Bank #${bank.id}', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                TextField(
                  controller: renameController,
                  decoration: const InputDecoration(labelText: 'Rename bank'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: topUpController,
                  decoration: const InputDecoration(labelText: 'Top-up amount'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton(
                      onPressed: () async {
                        final name = renameController.text.trim();
                        if (name.isEmpty) {
                          _showMessage('Enter a bank name.');
                          return;
                        }
                        Navigator.of(context).pop();
                        try {
                          await widget.api.updateVirtualBank(bank.id, name: name);
                          widget.addNotice('Renamed bank to $name', type: 'bank');
                          await _refresh();
                        } on LawraApiException catch (error) {
                          _showMessage(error.message);
                        }
                      },
                      child: const Text('Rename'),
                    ),
                    FilledButton.tonal(
                      onPressed: () async {
                        final amount = num.tryParse(topUpController.text);
                        if (amount == null || amount <= 0) {
                          _showMessage('Enter a valid top-up amount.');
                          return;
                        }
                        Navigator.of(context).pop();
                        try {
                          await widget.api.topUpVirtualBank(bank.id, amount);
                          widget.addNotice('Topped up ${bank.name} with Gh¢ ${amount.toStringAsFixed(2)}', type: 'bank');
                          await _refresh();
                        } on LawraApiException catch (error) {
                          _showMessage(error.message);
                        }
                      },
                      child: const Text('Top up'),
                    ),
                    OutlinedButton(
                      onPressed: () async {
                        Navigator.of(context).pop();
                        try {
                          await widget.api.deleteVirtualBank(bank.id);
                          widget.addNotice('Deleted bank ${bank.name}', type: 'bank');
                          await _refresh();
                        } on LawraApiException catch (error) {
                          _showMessage(error.message);
                        }
                      },
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorState(message: _error!, onRetry: _refresh);
    }

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionCard(
            title: 'Create virtual bank',
            child: Column(
              children: [
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Bank name'),
                  onChanged: (value) => _name = value,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Opening balance'),
                  keyboardType: TextInputType.number,
                  onChanged: (value) => _balance = value,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _isCreating ? null : _createBank,
                    child: Text(_isCreating ? 'Creating...' : 'Create bank'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Virtual banks',
            child: _banks.isEmpty
                ? const Text('No virtual banks found.')
                : Column(
                    children: _banks
                        .map(
                          (bank) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(bank.name),
                            subtitle: Text('Balance: ${_money(bank.balance)}'),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => _openBankActions(bank),
                          ),
                        )
                        .toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.api,
    required this.currentUser,
    required this.session,
    required this.addNotice,
  });

  final LawraApi api;
  final UserProfile? currentUser;
  final AuthSession session;
  final ValueChanged<String> addNotice;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tenantNameController = TextEditingController();
  final _tenantIdController = TextEditingController();
  final _tenantRenameController = TextEditingController();
  final _provisionEmailController = TextEditingController();
  final _provisionNameController = TextEditingController();
  final _provisionPhoneController = TextEditingController();
  final _profileNameController = TextEditingController();
  final _profilePhoneController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isSavingProfile = false;
  bool _isLoadingAdminData = false;
  bool _isTenantAdmin = false;
  List<Tenant> _tenants = [];
  Tenant? _selectedTenant;

  @override
  void initState() {
    super.initState();
    _profileNameController.text = widget.currentUser?.fullName ?? '';
    _profilePhoneController.text = widget.currentUser?.phoneNumber ?? '';
    final role = widget.currentUser?.role.toUpperCase();
    _isTenantAdmin = role == 'ADMIN' || role == 'PAYMASTER';
    if (_isTenantAdmin) {
      _loadAdminData();
    }
  }

  Future<void> _loadAdminData() async {
    setState(() => _isLoadingAdminData = true);
    try {
      final tenants = await widget.api.fetchTenants();
      if (!mounted) {
        return;
      }
      setState(() {
        _tenants = tenants;
        _selectedTenant = tenants.isNotEmpty ? tenants.first : null;
        _tenantIdController.text = _selectedTenant?.id ?? '';
        _tenantNameController.text = _selectedTenant?.name ?? '';
        _tenantRenameController.text = _selectedTenant?.name ?? '';
        _isLoadingAdminData = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() => _isLoadingAdminData = false);
    }
  }

  Future<void> _saveProfile() async {
    if (_newPasswordController.text.isNotEmpty && _newPasswordController.text != _confirmPasswordController.text) {
      _showMessage('Passwords do not match.');
      return;
    }

    setState(() => _isSavingProfile = true);
    try {
      await widget.api.updateUser(
        widget.session.userId,
        fullName: _profileNameController.text.trim(),
        phoneNumber: _profilePhoneController.text.trim(),
        password: _newPasswordController.text.isEmpty ? null : _newPasswordController.text,
      );
      widget.addNotice('Profile updated', type: 'profile');
      _showMessage('Profile updated.');
      _newPasswordController.clear();
      _confirmPasswordController.clear();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    } finally {
      if (mounted) {
        setState(() => _isSavingProfile = false);
      }
    }
  }

  Future<void> _createTenant() async {
    if (_tenantNameController.text.trim().isEmpty) {
      _showMessage('Enter a tenant name.');
      return;
    }
    try {
      await widget.api.createTenant(_tenantNameController.text.trim());
      widget.addNotice('Tenant created: ${_tenantNameController.text.trim()}', type: 'tenant');
      _showMessage('Tenant created.');
      await _loadAdminData();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  Future<void> _updateTenant() async {
    final tenantId = _tenantIdController.text.trim();
    if (tenantId.isEmpty || _tenantRenameController.text.trim().isEmpty) {
      _showMessage('Choose a tenant and enter a new name.');
      return;
    }
    try {
      await widget.api.updateTenant(tenantId, _tenantRenameController.text.trim());
      widget.addNotice('Tenant updated: ${_tenantRenameController.text.trim()}', type: 'tenant');
      _showMessage('Tenant updated.');
      await _loadAdminData();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  Future<void> _deleteTenant() async {
    final tenantId = _tenantIdController.text.trim();
    if (tenantId.isEmpty) {
      _showMessage('Choose a tenant to delete.');
      return;
    }
    try {
      await widget.api.deleteTenant(tenantId);
      widget.addNotice('Tenant deleted', type: 'tenant');
      _showMessage('Tenant deleted.');
      await _loadAdminData();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  Future<void> _provisionUser() async {
    if (_provisionEmailController.text.trim().isEmpty || _provisionNameController.text.trim().isEmpty || _provisionPhoneController.text.trim().isEmpty) {
      _showMessage('Complete the provisioning fields.');
      return;
    }
    try {
      await widget.api.provisionUser(
        email: _provisionEmailController.text.trim(),
        fullName: _provisionNameController.text.trim(),
        phoneNumber: _provisionPhoneController.text.trim(),
      );
      widget.addNotice('User provisioned: ${_provisionEmailController.text.trim()}', type: 'user');
      _showMessage('User provisioned.');
      _provisionEmailController.clear();
      _provisionNameController.clear();
      _provisionPhoneController.clear();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: _isLoadingAdminData && _isTenantAdmin
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _SectionCard(
                  title: 'Edit profile',
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _profileNameController,
                          decoration: const InputDecoration(labelText: 'Full name'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _profilePhoneController,
                          decoration: const InputDecoration(labelText: 'Phone number'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _newPasswordController,
                          decoration: const InputDecoration(labelText: 'New password'),
                          obscureText: true,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _confirmPasswordController,
                          decoration: const InputDecoration(labelText: 'Confirm password'),
                          obscureText: true,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: _isSavingProfile ? null : _saveProfile,
                            child: Text(_isSavingProfile ? 'Saving...' : 'Save profile'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_isTenantAdmin) ...[
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Tenant management',
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          value: _tenantIdController.text.isEmpty ? null : _tenantIdController.text,
                          decoration: const InputDecoration(labelText: 'Tenant'),
                          isExpanded: true,
                          items: _tenants
                              .map(
                                (tenant) => DropdownMenuItem(
                                  value: tenant.id,
                                  child: Text('${tenant.name} (${tenant.id})'),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value == null) {
                              return;
                            }
                            final tenant = _tenants.where((item) => item.id == value).cast<Tenant?>().firstWhere((item) => item != null, orElse: () => null);
                            setState(() {
                              _selectedTenant = tenant;
                              _tenantIdController.text = tenant?.id ?? value;
                              _tenantRenameController.text = tenant?.name ?? '';
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _tenantNameController,
                          decoration: const InputDecoration(labelText: 'New tenant name'),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: FilledButton(
                                onPressed: _createTenant,
                                child: const Text('Create'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: FilledButton.tonal(
                                onPressed: _updateTenant,
                                child: const Text('Update'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _deleteTenant,
                                child: const Text('Delete'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Provision user',
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _provisionEmailController,
                          decoration: const InputDecoration(labelText: 'Email'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _provisionNameController,
                          decoration: const InputDecoration(labelText: 'Full name'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _provisionPhoneController,
                          decoration: const InputDecoration(labelText: 'Phone number'),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: _provisionUser,
                            child: const Text('Provision user'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
    );
  }
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key, required this.notices});

  final List<_Notice> notices;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: notices.isEmpty
          ? const Center(child: Text('No recent activity.'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemBuilder: (context, index) {
                final item = notices[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.notifications_active_outlined),
                    title: Text(item.message),
                    subtitle: Text(_timeLabel(item.timestamp)),
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemCount: notices.length,
            ),
    );
  }
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _SectionCard(
            title: 'About us',
            child: Text(
              'Lawra is an online platform that lets employees access loan services within an organisation.',
            ),
          ),
          SizedBox(height: 16),
          _SectionCard(
            title: 'Terms and conditions',
            child: Text(
              'This mobile app mirrors the web experience and keeps the core borrower, lender, bank, and settings flows aligned.',
            ),
          ),
          SizedBox(height: 16),
          _SectionCard(
            title: 'Website',
            child: Text('www.lawra.com'),
          ),
        ],
      ),
    );
  }
}

class _AppDrawer extends StatelessWidget {
  const _AppDrawer({
    required this.currentUser,
    required this.session,
    required this.notices,
    required this.onOpenSettings,
    required this.onOpenNotifications,
    required this.onOpenAbout,
    required this.onLogout,
  });

  final UserProfile? currentUser;
  final AuthSession session;
  final List<_Notice> notices;
  final VoidCallback onOpenSettings;
  final VoidCallback onOpenNotifications;
  final VoidCallback onOpenAbout;
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF1DBA53), Color(0xFF21B2DB)]),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white.withOpacity(0.3),
                  child: const Icon(Icons.person, color: Colors.white),
                ),
                const SizedBox(height: 12),
                Text(currentUser?.fullName ?? 'Current user', style: const TextStyle(color: Colors.white, fontSize: 18)),
                Text(currentUser?.email ?? session.role, style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          ListTile(leading: const Icon(Icons.settings), title: const Text('Settings'), onTap: onOpenSettings),
          ListTile(
            leading: const Icon(Icons.notifications_none),
            title: const Text('Notifications'),
            trailing: notices.isEmpty ? null : CircleAvatar(radius: 10, child: Text('${notices.length}', style: const TextStyle(fontSize: 11))),
            onTap: onOpenNotifications,
          ),
          ListTile(leading: const Icon(Icons.info_outline), title: const Text('About'), onTap: onOpenAbout),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Logout'),
            onTap: () async {
              Navigator.of(context).pop();
              await onLogout();
            },
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.title, required this.subtitle, this.amount});

  final String title;
  final String subtitle;
  final num? amount;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(colors: [Color(0xFF1DBA53), Color(0xFF21B2DB)]),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 16),
          Text('Balance: ${_money(amount)}', style: const TextStyle(color: Colors.white, fontSize: 18)),
        ],
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
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _LoanTile extends StatelessWidget {
  const _LoanTile({required this.loan});

  final LoanSummary loan;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text('Loan #${loan.id}'),
        subtitle: Text('${loan.virtualBank ?? loan.bank ?? '-'}\n${loan.tenure ?? '-'}'),
        isThreeLine: true,
        trailing: _StatusChip(status: loan.status),
      ),
    );
  }
}

class _PackageTile extends StatelessWidget {
  const _PackageTile({required this.package});

  final LoanPackage package;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text('Package #${package.id}'),
        subtitle: Text('${package.virtualBank?.name ?? '-'}\nInterest: ${package.interestRate}%'),
        isThreeLine: true,
        trailing: Text(_money(package.balance)),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status.toUpperCase()) {
      'APPROVED' => Colors.green,
      'REJECTED' => Colors.red,
      'COMPLETED' => Colors.blue,
      'DEFAULTED' => Colors.orange,
      _ => Colors.grey,
    };

    return Chip(
      label: Text(status),
      side: BorderSide(color: color.withOpacity(0.3)),
      labelStyle: TextStyle(color: color),
      backgroundColor: color.withOpacity(0.08),
    );
  }
}

class _Notice {
  _Notice({required this.id, required this.message, required this.type, required this.timestamp});

  final String id;
  final String message;
  final String type;
  final DateTime timestamp;
}

String _money(num? amount) {
  final value = amount ?? 0;
  return 'Gh¢ ${value.toStringAsFixed(2)}';
}

String _timeLabel(DateTime timestamp) {
  final local = timestamp.toLocal();
  return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
}
