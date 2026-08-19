import 'package:flutter/material.dart';

import '../data/lawra_api.dart';
import '../data/session_store.dart';
import '../theme/lawra_theme.dart';
import '../widgets/amount_input_formatter.dart';
import 'auth/auth_screen.dart';
import 'audit_logs_screen.dart';
import 'logout_screen.dart';

typedef NoticeCallback = void Function(String message, {String type});

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
  bool _isConnectionError = false;
  final List<_Notice> _notices = [];
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    if (mounted) {
      setState(() {
        _isLoadingUser = true;
        _loadError = null;
        _isConnectionError = false;
      });
    }

    try {
      final user = await _api.fetchUserById(widget.session.userId);
      if (!mounted) return;
      setState(() {
        _currentUser = user;
        _isLoadingUser = false;
        _loadError = null;
        _isConnectionError = false;
      });
    } on LawraApiException catch (error) {
      if (error.statusCode == 401) {
        await _signOut();
        return;
      }
      if (!mounted) return;
      setState(() {
        _loadError = error.message;
        _isLoadingUser = false;
        _isConnectionError = error.isConnectionError;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadError = 'Something went wrong while loading your profile. Please try again.';
        _isLoadingUser = false;
        _isConnectionError = false;
      });
    }
  }

  Future<void> _signOut() async {
    await SessionStore.clearAuth();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AuthScreen()),
      (_) => false,
    );
  }

  void _addNotice(String message, {String type = 'info'}) {
    if (!mounted) return;
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

  @override
  Widget build(BuildContext context) {
    if (_isLoadingUser) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_loadError != null) {
      final title = _isConnectionError
          ? 'We can’t reach Lawra right now'
          : 'Unable to load your profile';
      final icon = _isConnectionError
          ? Icons.cloud_off_outlined
          : Icons.error_outline;
      final helper = _isConnectionError
          ? 'Your session is still saved. The service may be restarting — try again in a moment.'
          : null;
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 48, color: LawraColors.destructive),
                const SizedBox(height: 16),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  _loadError!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: LawraColors.textMuted),
                ),
                if (helper != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    helper,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: LawraColors.textMuted),
                  ),
                ],
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadCurrentUser,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final role = _normalizedRole(_currentUser?.role);
    final canBorrow = role == 'BORROWER' || role == 'PAYMASTER';
    final canManageLending =
        role == 'ADMIN' || role == 'PAYMASTER' || role == 'BORROWER';
    final tabs = <_DashboardTab>[
      if (canBorrow)
        _DashboardTab(
          title: 'My borrowing',
          item: const BottomNavigationBarItem(
              icon: Icon(Icons.handshake_outlined), label: 'Borrow'),
          child: BorrowerTab(
              api: _api,
              session: widget.session,
              currentUser: _currentUser,
              onCurrentUserUpdated: _setCurrentUser,
              addNotice: _addNotice),
        ),
      if (canManageLending)
        _DashboardTab(
          title: 'Lending packages',
          item: const BottomNavigationBarItem(
              icon: Icon(Icons.currency_exchange), label: 'Lending'),
          child: LenderTab(
              api: _api,
              session: widget.session,
              currentUser: _currentUser,
              addNotice: _addNotice),
        ),
      _DashboardTab(
        title: 'Loans',
        item: const BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long), label: 'Loans'),
        child: LoansTab(
            api: _api,
            currentUser: _currentUser,
            onCurrentUserUpdated: _setCurrentUser,
            addNotice: _addNotice),
      ),
      _DashboardTab(
        title: 'Accounts',
        item: const BottomNavigationBarItem(
            icon: Icon(Icons.account_balance), label: 'Accounts'),
        child: BanksTab(
            api: _api,
            session: widget.session,
            currentUser: _currentUser,
            addNotice: _addNotice),
      ),
    ];
    final activeIndex = _index.clamp(0, tabs.length - 1);

    return Scaffold(
      key: _scaffoldKey,
      drawer: _AppDrawer(
        currentUser: _currentUser,
        session: widget.session,
        notices: _notices,
        onOpenSettings: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => SettingsScreen(
                  api: _api,
                  currentUser: _currentUser,
                  session: widget.session,
                  addNotice: _addNotice),
            ),
          );
        },
        onOpenNotifications: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => _NotificationsScreen(notices: _notices),
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
      body: Column(
        children: [
          _GradientHeader(
            title: tabs[activeIndex].title,
            currentUser: _currentUser,
            onMenuTap: () => _scaffoldKey.currentState?.openDrawer(),
            onNotificationTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => _NotificationsScreen(notices: _notices)),
              );
            },
          ),
          Expanded(
            child: IndexedStack(index: activeIndex, children: tabs.map((tab) => tab.child).toList()),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: activeIndex,
        onTap: (value) => setState(() => _index = value),
        items: tabs.map((tab) => tab.item).toList(),
      ),
    );
  }

  void _setCurrentUser(UserProfile user) {
    if (!mounted) return;
    setState(() => _currentUser = user);
  }
}

class _DashboardTab {
  const _DashboardTab({
    required this.title,
    required this.item,
    required this.child,
  });

  final String title;
  final BottomNavigationBarItem item;
  final Widget child;
}

class _GradientHeader extends StatelessWidget {
  const _GradientHeader({
    required this.title,
    this.currentUser,
    required this.onMenuTap,
    required this.onNotificationTap,
  });

  final String title;
  final UserProfile? currentUser;
  final VoidCallback onMenuTap;
  final VoidCallback onNotificationTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [LawraColors.green, LawraColors.cyan],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 8, 24),
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.menu, color: Colors.white),
                    onPressed: onMenuTap,
                  ),
                  const Spacer(),
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  Stack(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.notifications_none, color: Colors.white),
                        onPressed: onNotificationTap,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const SizedBox(width: 16),
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: Colors.white.withOpacity(0.3),
                    child: const Icon(Icons.person, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        currentUser?.fullName ?? 'User',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        currentUser?.email ?? '',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================
// BORROWER TAB
// ============================================================

class BorrowerTab extends StatefulWidget {
  const BorrowerTab({
    super.key,
    required this.api,
    required this.session,
    required this.currentUser,
    required this.onCurrentUserUpdated,
    required this.addNotice,
  });

  final LawraApi api;
  final AuthSession session;
  final UserProfile? currentUser;
  final ValueChanged<UserProfile> onCurrentUserUpdated;
  final NoticeCallback addNotice;

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
      if (!mounted) return;
      setState(() {
        _packages = results[0] as List<LoanPackage>;
        _loans = results[1] as List<LoanSummary>;
        _isLoading = false;
      });
    } on LawraApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _submitLoan() async {
    final packageId = int.tryParse(_selectedPackageId ?? '');
    final amount = num.tryParse(_principal);
    final selectedPackage = _packages
        .where((item) => item.id == packageId)
        .cast<LoanPackage?>()
        .firstWhere(
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
      widget.addNotice(
          'Loan request submitted for Gh¢ ${amount.toStringAsFixed(2)}',
          type: 'loan');
      if (!mounted) return;
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
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _openDepositDialog() async {
    final depositController = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Deposit balance'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Add money to your account balance.'),
            const SizedBox(height: 12),
            TextField(
              controller: depositController,
              decoration: const InputDecoration(labelText: 'Amount (Gh¢)'),
              keyboardType: TextInputType.number,
              inputFormatters: [AmountInputFormatter()],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Deposit'),
          ),
        ],
      ),
    );

    if (result != true) return;

    final raw = parseAmount(depositController.text);
    final amount = num.tryParse(raw ?? '');
    if (amount == null || amount <= 0) {
      _showMessage('Enter a valid deposit amount.');
      return;
    }

    try {
      final updatedUser = await widget.api.topUpCurrentUserBalance(amount);
      widget.onCurrentUserUpdated(updatedUser);
      _showMessage('Deposit successful.');
      await _refresh();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    } catch (error) {
      _showMessage(error.toString());
    }
  }

  Future<void> _openRepaymentDialog(LoanSummary loan) async {
    final controller = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Repay loan #${loan.id}'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          inputFormatters: [AmountInputFormatter()],
          decoration: InputDecoration(
            labelText: 'Amount (Gh¢)',
            helperText: 'Outstanding: ${_money(loan.outstandingAmount)}',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Pay')),
        ],
      ),
    );
    if (result != true) return;
    final amount = num.tryParse(parseAmount(controller.text) ?? '');
    if (amount == null || amount <= 0) {
      _showMessage('Enter a valid repayment amount.');
      return;
    }
    try {
      final updatedLoan = await widget.api.repayLoan(loan.id, amount);
      if (!mounted) return;
      setState(() {
        _loans = _loans
            .map((item) => item.id == updatedLoan.id ? updatedLoan : item)
            .toList();
      });
      widget.addNotice('Repayment of ${_money(amount)} submitted', type: 'repayment');
      _showMessage('Repayment successful.');
      final currentUser = widget.currentUser;
      if (currentUser != null) {
        widget.onCurrentUserUpdated(currentUser.withBalance(
            ((currentUser.balance ?? 0) - amount).clamp(0, double.infinity)));
        try {
          widget.onCurrentUserUpdated(
              await widget.api.fetchUserById(currentUser.id));
        } on Object {
          // The repayment succeeded; this secondary refresh can be retried.
        }
      }
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
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
            title: 'Account Balance',
            amount: currentUser?.balance,
            onTap: () => _openDepositDialog(),
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
                          child: Text(
                            // enter amounts in 2 decimal places and showing commas for clarity and visibility
                              '${item.name.isNotEmpty ? item.name : 'Package #${item.id}'} - Gh¢ ${item.balance.toStringAsFixed(2)}'),
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
                  decoration:
                      const InputDecoration(labelText: 'Principal amount'),
                  keyboardType: TextInputType.number,
                  inputFormatters: [AmountInputFormatter()],
                  onChanged: (value) => _principal = parseAmount(value) ?? value,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<LoanPeriod>(
                  value: _period,
                  decoration: const InputDecoration(labelText: 'Period'),
                  items: LoanPeriod.values
                      .map((item) => DropdownMenuItem(
                          value: item, child: Text(item.label)))
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
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitLoan,
                    child:
                        Text(_isSubmitting ? 'Submitting...' : 'Request Loan'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'My Loan Applications',
            child: _loans.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('No loan applications yet.',
                        style: TextStyle(color: LawraColors.textMuted)),
                  )
                : Column(
                    children:
                        _loans.map((loan) => _LoanTile(
                              loan: loan,
                              onRepay: loan.status == 'APPROVED' &&
                                      (loan.outstandingAmount ?? 0) > 0
                                  ? () => _openRepaymentDialog(loan)
                                  : null,
                            )).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// LENDER TAB
// ============================================================

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
  final NoticeCallback addNotice;

  @override
  State<LenderTab> createState() => _LenderTabState();
}

class _LenderTabState extends State<LenderTab> {
  bool _isLoading = true;
  String? _error;
  List<VirtualBank> _banks = [];
  List<LoanPackage> _packages = [];
  String? _selectedBankId;
  String _name = '';
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
      if (!mounted) return;
      setState(() {
        _banks = results[0] as List<VirtualBank>;
        _packages = results[1] as List<LoanPackage>;
        _isLoading = false;
      });
    } on LawraApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  bool get _isAdmin {
    final role = _normalizedRole(widget.currentUser?.role);
    return role == 'ADMIN';
  }

  bool get _canViewAllPackages {
    final role = _normalizedRole(widget.currentUser?.role);
    return role == 'ADMIN' || role == 'PAYMASTER';
  }

  List<VirtualBank> get _manageableBanks {
    final userId = widget.session.userId;
    return _isAdmin
        ? _banks
        : _banks.where((bank) => bank.createdById == userId).toList();
  }

  bool _canManagePackage(LoanPackage package) {
    return _isAdmin ||
        package.virtualBank?.createdById == widget.session.userId;
  }

  Future<void> _openPackageActions(LoanPackage package) async {
    if (!_canManagePackage(package)) {
      await showModalBottomSheet<void>(
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (context) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Loan package #${package.id}',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  _InfoRow('Package name', package.name),
                  _InfoRow('Virtual bank', package.virtualBank?.name ?? '-'),
                  _InfoRow('Balance', _money(package.balance)),
                  _InfoRow('Interest rate', '${package.interestRate}%'),
                  const SizedBox(height: 16),
                  const Text(
                    'You can view this package, but only its owner or an admin can update or delete it.',
                    style: TextStyle(color: LawraColors.textMuted, fontSize: 13),
                  ),
                ],
              ),
            ),
          );
        },
      );
      return;
    }

    final nameController = TextEditingController(text: package.name);
    final topUpController = TextEditingController();
    final interestController =
        TextEditingController(text: package.interestRate.toString());
    String selectedBankId = package.virtualBank?.id.toString() ?? '';

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Loan package #${package.id}',
                            style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 16),
                        TextField(
                          controller: nameController,
                          decoration:
                              const InputDecoration(labelText: 'Package name'),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: selectedBankId.isEmpty ? null : selectedBankId,
                          isExpanded: true,
                          decoration:
                              const InputDecoration(labelText: 'Virtual bank'),
                          items: _manageableBanks
                              .map(
                                (bank) => DropdownMenuItem(
                                  value: bank.id.toString(),
                                  child: Text('${bank.name} (#${bank.id})'),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            setSheetState(() {
                              selectedBankId = value ?? '';
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: topUpController,
                          decoration:
                              const InputDecoration(labelText: 'Top-up amount'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: interestController,
                          decoration:
                              const InputDecoration(labelText: 'Interest rate'),
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () async {
                                  final bankId = int.tryParse(selectedBankId);
                                  final topUpAmount =
                                      num.tryParse(topUpController.text);
                                  final interestRate =
                                      num.tryParse(interestController.text);
                                  final name = nameController.text.trim();

                                  if (name.isEmpty ||
                                      bankId == null ||
                                      topUpAmount == null ||
                                      topUpAmount <= 0 ||
                                      interestRate == null) {
                                    _showMessage(
                                        'Fill out the package name, bank, top-up amount, and interest rate.');
                                    return;
                                  }

                                  final currentBalance = package.balance;

                                  Navigator.of(context).pop();
                                  try {
                                    await widget.api.updateLoanPackage(
                                      package.id,
                                      name: name,
                                      virtualBankId: bankId,
                                      balance: currentBalance + topUpAmount,
                                      interestRate: interestRate,
                                    );
                                    widget.addNotice(
                                        'Loan package updated: $name',
                                        type: 'package');
                                    await _refresh();
                                    _showMessage('Loan package updated.');
                                  } on LawraApiException catch (error) {
                                    _showMessage(error.message);
                                  } catch (error) {
                                    _showMessage(error.toString());
                                  }
                                },
                                child: const Text('Update'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () async {
                                  Navigator.of(context).pop();
                                  try {
                                    await widget.api
                                        .deleteLoanPackage(package.id);
                                    widget.addNotice(
                                        'Deleted loan package #${package.id}',
                                        type: 'package');
                                    await _refresh();
                                    _showMessage('Loan package deleted.');
                                  } on LawraApiException catch (error) {
                                    _showMessage(error.message);
                                  } catch (error) {
                                    _showMessage(error.toString());
                                  }
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: LawraColors.destructive,
                                  side: const BorderSide(color: LawraColors.destructive),
                                ),
                                child: const Text('Delete'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _createPackage() async {
    final bankId = int.tryParse(_selectedBankId ?? '');
    final balance = num.tryParse(_balance);
    final interestRate = num.tryParse(_interestRate);

    if (_name.trim().isEmpty ||
        bankId == null ||
        balance == null ||
        interestRate == null) {
      _showMessage(
          'Enter a package name and fill out bank, balance, and interest.');
      return;
    }

    setState(() => _isSaving = true);
    try {
      await widget.api.createLoanPackage(
        name: _name.trim(),
        virtualBankId: bankId,
        balance: balance,
        interestRate: interestRate,
      );
      widget.addNotice('Loan package created for bank #$bankId',
          type: 'package');
      if (!mounted) return;
      setState(() {
        _selectedBankId = null;
        _name = '';
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
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorState(message: _error!, onRetry: _refresh);
    }

    final ownedBanks = _manageableBanks;
    final ownedPackages = _canViewAllPackages
        ? _packages
        : _packages
            .where((item) =>
                item.virtualBank?.createdById == widget.session.userId)
            .toList();

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionCard(
            title: 'Create loan package',
            child: Column(
              children: [
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Package name'),
                  onChanged: (value) => _name = value,
                ),
                const SizedBox(height: 12),
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
                  inputFormatters: [AmountInputFormatter()],
                  onChanged: (value) => _balance = parseAmount(value) ?? value,
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
                  child: ElevatedButton(
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
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('No loan packages yet.',
                        style: TextStyle(color: LawraColors.textMuted)),
                  )
                : Column(
                    children: ownedPackages
                        .map((item) => _PackageTile(
                            package: item,
                            onTap: () => _openPackageActions(item)))
                        .toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// LOANS TAB
// ============================================================

class LoansTab extends StatefulWidget {
  const LoansTab(
      {super.key,
      required this.api,
      required this.currentUser,
      required this.onCurrentUserUpdated,
      required this.addNotice});

  final LawraApi api;
  final UserProfile? currentUser;
  final ValueChanged<UserProfile> onCurrentUserUpdated;
  final NoticeCallback addNotice;

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
      final userId = widget.currentUser?.id;
      if (userId == null) {
        throw StateError('User not loaded yet.');
      }
      final data = _isManagement
          ? await widget.api.fetchLoans(status: _statusFilter)
          : await widget.api.fetchBorrowerLoans(userId);
      if (!mounted) return;
      setState(() {
        _loans = data;
        _isLoading = false;
      });
    } on LawraApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
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

  Future<void> _openRepaymentDialog(LoanSummary loan) async {
    final controller = TextEditingController();
    final paysOwnLoan = loan.borrowerId == widget.currentUser?.id;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(paysOwnLoan
            ? 'Repay loan #${loan.id}'
            : 'Pay for ${loan.borrowerName ?? 'employee'}'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          inputFormatters: [AmountInputFormatter()],
          decoration: InputDecoration(
            labelText: 'Amount (Gh¢)',
            helperText: paysOwnLoan
                ? 'Outstanding: ${_money(loan.outstandingAmount)}'
                : 'Your wallet will be debited. Outstanding: ${_money(loan.outstandingAmount)}',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(paysOwnLoan ? 'Pay' : 'Pay on behalf')),
        ],
      ),
    );
    if (confirmed != true) return;

    final amount = num.tryParse(parseAmount(controller.text) ?? '');
    if (amount == null || amount <= 0) {
      _showMessage('Enter a valid repayment amount.');
      return;
    }
    if (amount > (loan.outstandingAmount ?? 0)) {
      _showMessage('The payment cannot exceed the outstanding balance.');
      return;
    }
    if (!paysOwnLoan) {
      if (!mounted) return;
      final shouldPayOnBehalf = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Confirm payment on behalf'),
          content: Text(
            '${_money(amount)} will be debited from your account and applied '
            'to ${loan.borrowerName ?? 'this employee'}\'s loan #${loan.id}.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Confirm payment'),
            ),
          ],
        ),
      );
      if (shouldPayOnBehalf != true) return;
    }
    try {
      final updatedLoan = await widget.api.repayLoan(loan.id, amount);
      if (!mounted) return;
      setState(() {
        _loans = _loans
            .map((item) => item.id == updatedLoan.id ? updatedLoan : item)
            .toList();
      });
      widget.addNotice('Repayment of ${_money(amount)} submitted', type: 'repayment');
      _showMessage('Repayment successful.');
      final currentUser = widget.currentUser;
      if (currentUser != null) {
        widget.onCurrentUserUpdated(currentUser.withBalance(
            ((currentUser.balance ?? 0) - amount).clamp(0, double.infinity)));
        try {
          widget.onCurrentUserUpdated(
              await widget.api.fetchUserById(currentUser.id));
        } on Object {
          // The repayment succeeded; this secondary refresh can be retried.
        }
      }
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  Future<void> _openRepaymentHistory(LoanSummary loan) async {
    try {
      final repayments = await widget.api.fetchRepayments(loan.id);
      if (!mounted) return;
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (context) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              height: MediaQuery.of(context).size.height * 0.55,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Payment history · Loan #${loan.id}',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  const Text('Payments are final and show who funded them.',
                      style: TextStyle(color: LawraColors.textMuted)),
                  const SizedBox(height: 12),
                  Expanded(
                    child: repayments.isEmpty
                        ? const Center(child: Text('No payments recorded.'))
                        : ListView.separated(
                            itemCount: repayments.length,
                            separatorBuilder: (_, __) => const Divider(),
                            itemBuilder: (context, index) {
                              final repayment = repayments[index];
                              return ListTile(
                                title: Text(repayment.paidByName ?? '-'),
                                subtitle: Text(
                                    '${repayment.paidByRole ?? '-'} · ${repayment.paidAt ?? '-'}'),
                                trailing: Text(_money(repayment.amount),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600)),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  bool get _isManagement {
    final role = _normalizedRole(widget.currentUser?.role);
    return role == 'ADMIN' || role == 'PAYMASTER';
  }

  List<LoanSummary> get _outstandingRepayments => _loans
      .where((loan) => loan.status == 'APPROVED' && (loan.outstandingAmount ?? 0) > 0)
      .toList();

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
          if (_isManagement)
            _SectionCard(
            title: 'Filter loans',
            child: DropdownButtonFormField<String>(
              value: _statusFilter,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem<String>(value: null, child: Text('All')),
                DropdownMenuItem<String>(
                    value: 'PENDING', child: Text('Pending')),
                DropdownMenuItem<String>(
                    value: 'APPROVED', child: Text('Approved')),
                DropdownMenuItem<String>(
                    value: 'REJECTED', child: Text('Rejected')),
                DropdownMenuItem<String>(
                    value: 'COMPLETED', child: Text('Completed')),
                DropdownMenuItem<String>(
                    value: 'DEFAULTED', child: Text('Defaulted')),
              ],
              onChanged: (value) async {
                setState(() => _statusFilter = value);
                await _refresh();
              },
            ),
          ),
          if (_isManagement) const SizedBox(height: 16),
          _SectionCard(
            title: 'Loan list',
            child: _loans.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('No loans found.',
                        style: TextStyle(color: LawraColors.textMuted)),
                  )
                : Column(
                    children: _loans.map(
                      (loan) {
                        final canAct =
                            _isManagement &&
                            loan.status == 'PENDING' &&
                            loan.borrowerId != widget.currentUser?.id;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Loan #${loan.id}',
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleMedium),
                                      _StatusChip(status: loan.status),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  _InfoRow('Borrower',
                                      loan.borrowerName ?? loan.borrowerId ?? '-'),
                                  _InfoRow('Amount', _money(loan.amount)),
                                  _InfoRow('Interest', loan.interest ?? '-'),
                                  _InfoRow('Tenure', loan.tenure ?? '-'),
                                  _InfoRow('Bank',
                                      loan.bank ?? loan.virtualBank ?? '-'),
                                  if (loan.status == 'APPROVED')
                                    _InfoRow('Payment status',
                                        (loan.repaymentStatus ?? 'PENDING')
                                            .replaceAll('_', ' ')),
                                  if (canAct) ...[
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: () =>
                                                _updateStatus(loan, 'APPROVED'),
                                            child: const Text('Approve'),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: () =>
                                                _updateStatus(loan, 'REJECTED'),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor:
                                                  LawraColors.destructive,
                                            ),
                                            child: const Text('Reject'),
                                          ),
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
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Outstanding Repayments',
            child: _outstandingRepayments.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('No outstanding repayments found.',
                        style: TextStyle(color: LawraColors.textMuted)),
                  )
                : Column(
                    children: _outstandingRepayments.map((loan) {
                      final isOwnLoan = loan.borrowerId == widget.currentUser?.id;
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_isManagement)
                                _InfoRow('Borrower', loan.borrowerName ?? '-'),
                              _InfoRow('Loan', '#${loan.id}'),
                              _InfoRow('Total repayment', _money(loan.repaymentAmount)),
                              _InfoRow('Paid', _money(loan.totalPaid)),
                              _InfoRow('Outstanding', _money(loan.outstandingAmount)),
                              _InfoRow('Payment status',
                                  (loan.repaymentStatus ?? 'PENDING').replaceAll('_', ' ')),
                              _InfoRow('Due date', loan.dueDate ?? '-'),
                              if (isOwnLoan || _isManagement) ...[
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: () =>
                                            _openRepaymentDialog(loan),
                                        child: Text(isOwnLoan
                                            ? 'Make repayment'
                                            : 'Pay on behalf'),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () =>
                                            _openRepaymentHistory(loan),
                                        child: const Text('History'),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// BANKS TAB
// ============================================================

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
  final NoticeCallback addNotice;

  @override
  State<BanksTab> createState() => _BanksTabState();
}

class _BanksTabState extends State<BanksTab> {
  bool _isLoading = true;
  String? _error;
  List<VirtualBank> _banks = [];
  bool _showBalances = false;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  @override
  void didUpdateWidget(covariant BanksTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentUser?.balance != widget.currentUser?.balance) {
      _refresh(showLoading: false);
    }
  }

  Future<void> _refresh({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final data = await widget.api.fetchVirtualBanks();
      if (!mounted) return;
      setState(() {
        _banks = data;
        _isLoading = false;
        _error = null;
      });
    } on LawraApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  bool get _canViewAllBanks {
    final role = _normalizedRole(widget.currentUser?.role);
    return role == 'ADMIN' || role == 'PAYMASTER';
  }

  List<VirtualBank> get _visibleBanks {
    final userId = widget.session.userId;
    return _canViewAllBanks
        ? _banks
        : _banks.where((bank) => bank.createdById == userId).toList();
  }

  bool _canManageBank(VirtualBank bank) {
    return _canViewAllBanks || bank.createdById == widget.session.userId;
  }

  bool get _shouldShowBalances => !_canViewAllBanks || _showBalances;

  Future<void> _openBankActions(VirtualBank bank) async {
    if (!_canManageBank(bank)) {
      await showModalBottomSheet<void>(
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (context) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Bank #${bank.id}',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  _InfoRow('Name', bank.name),
                  _InfoRow('Balance', _shouldShowBalances ? _money(bank.balance) : '••••••'),
                  _InfoRow('Created by', bank.createdBy ?? '-'),
                  const SizedBox(height: 16),
                  const Text(
                    'You can view this bank, but only its owner or an admin can rename, top up, or delete it.',
                    style: TextStyle(color: LawraColors.textMuted, fontSize: 13),
                  ),
                ],
              ),
            ),
          );
        },
      );
      return;
    }

    final renameController = TextEditingController(text: bank.name);
    final topUpController = TextEditingController();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Bank #${bank.id}',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                TextField(
                  controller: renameController,
                  readOnly: true,
                  decoration: const InputDecoration(
                    labelText: 'Account name',
                    helperText: 'Account names are managed from your profile.',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: topUpController,
                  decoration: InputDecoration(
                    labelText: 'Add funds',
                    helperText: bank.createdById == widget.session.userId
                        ? 'Adds to your wallet.'
                        : 'This amount is debited from your wallet.',
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: null,
                        child: const Text('Profile managed'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: LawraColors.cyan,
                        ),
                        onPressed: () async {
                          final amount = num.tryParse(topUpController.text);
                          if (amount == null || amount <= 0) {
                            _showMessage('Enter a valid top-up amount.');
                            return;
                          }
                          Navigator.of(context).pop();
                          try {
                            await widget.api.topUpVirtualBank(bank.id, amount);
                            widget.addNotice(
                                'Topped up ${bank.name} with Gh¢ ${amount.toStringAsFixed(2)}',
                                type: 'bank');
                            await _refresh();
                          } on LawraApiException catch (error) {
                            _showMessage(error.message);
                          }
                        },
                        child: const Text('Top up'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: null,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: LawraColors.destructive,
                          side: const BorderSide(color: LawraColors.destructive),
                        ),
                        child: const Text('Account protected'),
                      ),
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
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorState(message: _error!, onRetry: _refresh);
    }

    final visibleBanks = _visibleBanks;

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionCard(
            title: 'Virtual banks',
            action: _canViewAllBanks
                ? IconButton(
                    tooltip: _showBalances ? 'Hide balances' : 'Show balances',
                    onPressed: () => setState(() => _showBalances = !_showBalances),
                    icon: Icon(
                      _showBalances ? Icons.visibility_off : Icons.visibility,
                    ),
                  )
                : null,
            child: visibleBanks.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('No virtual banks found.',
                        style: TextStyle(color: LawraColors.textMuted)),
                  )
                : Column(
                    children: visibleBanks
                        .map(
                          (bank) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(bank.name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600)),
                            subtitle: Text('Balance: ${_shouldShowBalances ? _money(bank.balance) : '••••••'}',
                                style: const TextStyle(
                                    color: LawraColors.textMuted)),
                            trailing: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: LawraColors.green.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.chevron_right,
                                  color: LawraColors.green),
                            ),
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

// ============================================================
// SETTINGS SCREEN
// ============================================================

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
  final NoticeCallback addNotice;

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
  bool _isSavingManagedUser = false;
  bool _isDeletingManagedUser = false;
  bool _isLoadingAdminData = false;
  bool _isTenantAdmin = false;
  List<Tenant> _tenants = [];
  Tenant? _selectedTenant;
  List<UserProfile> _users = [];
  UserProfile? _selectedManagedUser;
  final _managedUserEmailController = TextEditingController();
  final _managedUserNameController = TextEditingController();
  final _managedUserPhoneController = TextEditingController();
  final _managedUserPasswordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _profileNameController.text = widget.currentUser?.fullName ?? '';
    _profilePhoneController.text = widget.currentUser?.phoneNumber ?? '';
    final role = _normalizedRole(widget.currentUser?.role);
    _isTenantAdmin = role == 'ADMIN' || role == 'PAYMASTER';
    if (_isTenantAdmin) {
      _loadAdminData();
    }
  }

  Future<void> _loadAdminData() async {
    setState(() => _isLoadingAdminData = true);
    try {
      final tenantsFuture = widget.api.fetchTenants();
      final usersFuture = widget.api.fetchUsers();
      final tenants = await tenantsFuture;
      final users = await usersFuture;
      if (!mounted) return;
      Tenant? selectedTenant;
      for (final tenant in tenants) {
        if (tenant.id == _selectedTenant?.id) {
          selectedTenant = tenant;
          break;
        }
      }
      selectedTenant ??= tenants.isNotEmpty ? tenants.first : null;
      setState(() {
        _tenants = tenants;
        _users = users;
        _selectedTenant = selectedTenant;
        _tenantIdController.text = _selectedTenant?.id ?? '';
        _tenantRenameController.text = _selectedTenant?.name ?? '';
        _isLoadingAdminData = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoadingAdminData = false);
    }
  }

  Future<void> _saveProfile() async {
    if (_newPasswordController.text.isNotEmpty &&
        _newPasswordController.text != _confirmPasswordController.text) {
      _showMessage('Passwords do not match.');
      return;
    }

    setState(() => _isSavingProfile = true);
    try {
      await widget.api.updateUser(
        widget.session.userId,
        fullName: _profileNameController.text.trim(),
        phoneNumber: _profilePhoneController.text.trim(),
        password: _newPasswordController.text.isEmpty
            ? null
            : _newPasswordController.text,
      );
      widget.addNotice('Profile updated', type: 'profile');
      _showMessage('Profile updated.');
      _newPasswordController.clear();
      _confirmPasswordController.clear();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    } finally {
      if (mounted) setState(() => _isSavingProfile = false);
    }
  }

  Future<void> _createTenant() async {
    if (_tenantNameController.text.trim().isEmpty) {
      _showMessage('Enter a tenant name.');
      return;
    }
    try {
      final tenant =
          await widget.api.createTenant(_tenantNameController.text.trim());
      widget.addNotice('Tenant created: ${_tenantNameController.text.trim()}',
          type: 'tenant');
      _showMessage('Tenant created.');
      if (mounted) {
        setState(() {
          _selectedTenant = tenant;
          _tenantNameController.clear();
          _tenantIdController.text = tenant.id;
          _tenantRenameController.text = tenant.name;
        });
      }
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
      await widget.api
          .updateTenant(tenantId, _tenantRenameController.text.trim());
      widget.addNotice('Tenant updated: ${_tenantRenameController.text.trim()}',
          type: 'tenant');
      _showMessage('Tenant updated.');
      await _loadAdminData();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  Future<void> _provisionUser() async {
    if (_provisionEmailController.text.trim().isEmpty ||
        _provisionNameController.text.trim().isEmpty ||
        _provisionPhoneController.text.trim().isEmpty) {
      _showMessage('Complete the provisioning fields.');
      return;
    }
    try {
      await widget.api.provisionUser(
        email: _provisionEmailController.text.trim(),
        fullName: _provisionNameController.text.trim(),
        phoneNumber: _provisionPhoneController.text.trim(),
      );
      widget.addNotice(
          'User provisioned: ${_provisionEmailController.text.trim()}',
          type: 'user');
      _showMessage('User provisioned.');
      _provisionEmailController.clear();
      _provisionNameController.clear();
      _provisionPhoneController.clear();
      await _loadAdminData();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    }
  }

  void _selectManagedUser(String? userId) {
    UserProfile? selectedUser;
    for (final user in _users) {
      if (user.id == userId) {
        selectedUser = user;
        break;
      }
    }
    setState(() {
      _selectedManagedUser = selectedUser;
      _managedUserEmailController.text = selectedUser?.email ?? '';
      _managedUserNameController.text = selectedUser?.fullName ?? '';
      _managedUserPhoneController.text = selectedUser?.phoneNumber ?? '';
      _managedUserPasswordController.clear();
    });
  }

  Future<void> _updateManagedUser() async {
    final selectedUser = _selectedManagedUser;
    if (selectedUser == null) {
      _showMessage('Choose an employee to update.');
      return;
    }
    final email = _managedUserEmailController.text.trim();
    final fullName = _managedUserNameController.text.trim();
    final phoneNumber = _managedUserPhoneController.text.trim();
    final password = _managedUserPasswordController.text;
    if (email.isEmpty || fullName.isEmpty || phoneNumber.isEmpty) {
      _showMessage('Email, name, and phone number are required.');
      return;
    }
    if (email == selectedUser.email &&
        fullName == selectedUser.fullName &&
        phoneNumber == (selectedUser.phoneNumber ?? '') &&
        password.isEmpty) {
      _showMessage('No changes detected.');
      return;
    }

    setState(() => _isSavingManagedUser = true);
    try {
      await widget.api.updateUser(
        selectedUser.id,
        email: email,
        fullName: fullName,
        phoneNumber: phoneNumber,
        password: password.isEmpty ? null : password,
      );
      widget.addNotice('User updated: $email', type: 'user');
      _showMessage('User updated.');
      await _loadAdminData();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    } finally {
      if (mounted) setState(() => _isSavingManagedUser = false);
    }
  }

  Future<void> _deleteManagedUser() async {
    final selectedUser = _selectedManagedUser;
    if (selectedUser == null) {
      _showMessage('Choose an employee to delete.');
      return;
    }
    setState(() => _isDeletingManagedUser = true);
    try {
      await widget.api.deleteUser(selectedUser.id);
      widget.addNotice('User deleted: ${selectedUser.email}', type: 'user');
      _showMessage('User deleted.');
      _selectManagedUser(null);
      await _loadAdminData();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
    } finally {
      if (mounted) setState(() => _isDeletingManagedUser = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    _tenantNameController.dispose();
    _tenantIdController.dispose();
    _tenantRenameController.dispose();
    _provisionEmailController.dispose();
    _provisionNameController.dispose();
    _provisionPhoneController.dispose();
    _profileNameController.dispose();
    _profilePhoneController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _managedUserEmailController.dispose();
    _managedUserNameController.dispose();
    _managedUserPhoneController.dispose();
    _managedUserPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
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
      body: _isLoadingAdminData && _isTenantAdmin
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _SectionCard(
                  title: 'Edit Profile',
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _profileNameController,
                          decoration:
                              const InputDecoration(labelText: 'Full name'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _profilePhoneController,
                          decoration:
                              const InputDecoration(labelText: 'Phone number'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _newPasswordController,
                          decoration:
                              const InputDecoration(labelText: 'New password'),
                          obscureText: true,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _confirmPasswordController,
                          decoration: const InputDecoration(
                              labelText: 'Confirm password'),
                          obscureText: true,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isSavingProfile ? null : _saveProfile,
                            child: Text(_isSavingProfile
                                ? 'Saving...'
                                : 'Save profile'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_isTenantAdmin) ...[
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Tenant Management',
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          value: _selectedTenant?.id,
                          decoration:
                              const InputDecoration(labelText: 'Tenant'),
                          isExpanded: true,
                          dropdownColor: LawraColors.white,
                          borderRadius: BorderRadius.circular(16),
                          items: _tenants
                              .map(
                                (tenant) => DropdownMenuItem(
                                  value: tenant.id,
                                  child: Text(
                                    tenant.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              )
                              .toList(),
                          selectedItemBuilder: (context) => _tenants
                              .map(
                                (tenant) => Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    tenant.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value == null) return;
                            final tenant = _tenants
                                .where((item) => item.id == value)
                                .cast<Tenant?>()
                                .firstWhere((item) => item != null,
                                    orElse: () => null);
                            setState(() {
                              _selectedTenant = tenant;
                              _tenantIdController.text = tenant?.id ?? value;
                              _tenantRenameController.text = tenant?.name ?? '';
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _tenantRenameController,
                          decoration: const InputDecoration(
                              labelText: 'Selected tenant name'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _tenantNameController,
                          decoration: const InputDecoration(
                              labelText: 'New tenant name'),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: _createTenant,
                                child: const Text('Create'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: LawraColors.cyan,
                                ),
                                onPressed: _updateTenant,
                                child: const Text('Update'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'User Provisioning',
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _provisionEmailController,
                          decoration: const InputDecoration(labelText: 'Email'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _provisionNameController,
                          decoration:
                              const InputDecoration(labelText: 'Full name'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _provisionPhoneController,
                          decoration:
                              const InputDecoration(labelText: 'Phone number'),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _provisionUser,
                            child: const Text('Provision user'),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'User Management',
                    child: Column(
                      children: [
                        DropdownButtonFormField<String>(
                          value: _selectedManagedUser?.id,
                          decoration: const InputDecoration(
                              labelText: 'Select an employee'),
                          isExpanded: true,
                          dropdownColor: LawraColors.white,
                          borderRadius: BorderRadius.circular(16),
                          items: _users
                              .map(
                                (user) => DropdownMenuItem(
                                  value: user.id,
                                  child: Text(
                                    '${user.fullName} · ${user.email}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              )
                              .toList(),
                          selectedItemBuilder: (context) => _users
                              .map(
                                (user) => Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    '${user.fullName} · ${user.email}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              )
                              .toList(),
                          onChanged: _selectManagedUser,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _managedUserEmailController,
                          enabled: _selectedManagedUser != null,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: 'Email'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _managedUserNameController,
                          enabled: _selectedManagedUser != null,
                          decoration: const InputDecoration(labelText: 'Full name'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _managedUserPhoneController,
                          enabled: _selectedManagedUser != null,
                          decoration:
                              const InputDecoration(labelText: 'Phone number'),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _managedUserPasswordController,
                          enabled: _selectedManagedUser != null,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'New password (optional)',
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: LawraColors.cyan,
                                ),
                                onPressed: _selectedManagedUser == null ||
                                        _isSavingManagedUser
                                    ? null
                                    : _updateManagedUser,
                                child: Text(_isSavingManagedUser
                                    ? 'Updating...'
                                    : 'Update'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: LawraColors.destructive,
                                ),
                                onPressed: _selectedManagedUser == null ||
                                        _isDeletingManagedUser
                                    ? null
                                    : _deleteManagedUser,
                                child: Text(_isDeletingManagedUser
                                    ? 'Deleting...'
                                    : 'Delete user'),
                              ),
                            ),
                          ],
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

// ============================================================
// NOTIFICATIONS SCREEN
// ============================================================

class _NotificationsScreen extends StatelessWidget {
  const _NotificationsScreen({required this.notices});

  final List<_Notice> notices;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
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
      body: notices.isEmpty
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_none,
                      size: 64, color: LawraColors.textMuted),
                  SizedBox(height: 16),
                  Text('No recent activity.',
                      style: TextStyle(color: LawraColors.textMuted)),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemBuilder: (context, index) {
                final item = notices[index];
                return Card(
                  child: ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: LawraColors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.notifications_active_outlined,
                          color: LawraColors.green),
                    ),
                    title: Text(item.message),
                    subtitle: Text(_timeLabel(item.timestamp),
                        style: const TextStyle(color: LawraColors.textMuted)),
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemCount: notices.length,
            ),
    );
  }
}

// ============================================================
// ABOUT SCREEN
// ============================================================

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('About'),
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionCard(
            title: 'About us',
            child: Text(
              'Lawra is an online platform that lets employees access loan services within an organisation.',
              style: TextStyle(color: LawraColors.textMuted, height: 1.5),
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Terms and conditions',
            child: Text(
              'This mobile app mirrors the web experience and keeps the core borrower, lender, bank, and settings flows aligned.',
              style: TextStyle(color: LawraColors.textMuted, height: 1.5),
            ),
          ),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Website',
            child: Text(
              'www.lawra.com',
              style: TextStyle(
                color: LawraColors.cyan,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// APP DRAWER
// ============================================================

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
    final normalizedRole = _normalizedRole(currentUser?.role);
    final isAdmin = normalizedRole == 'ADMIN' || normalizedRole == 'PAYMASTER';

    return Drawer(
      child: Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [LawraColors.green, LawraColors.cyan],
                ),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: Colors.white.withOpacity(0.3),
                        child: const Icon(Icons.person, color: Colors.white, size: 36),
                      ),
                      const SizedBox(height: 12),
                      Text(currentUser?.fullName ?? 'Current user',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w600)),
                      Text(currentUser?.email ?? 'no email',
                          style: const TextStyle(color: Colors.white70)),
                      Text(session.role.substring(5),
                          style: const TextStyle(color: Colors.white70)),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _DrawerTile(
                  icon: Icons.settings,
                  title: 'Settings',
                  onTap: onOpenSettings,
                ),
                if (isAdmin)
                  _DrawerTile(
                    icon: Icons.receipt_long,
                    title: 'Audit Logs',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) => const AuditLogsScreen()));
                    },
                  ),
                _DrawerTile(
                  icon: Icons.notifications_none,
                  title: 'Notifications',
                  trailing: notices.isEmpty
                      ? null
                      : CircleAvatar(
                          radius: 12,
                          backgroundColor: LawraColors.green,
                          child: Text('${notices.length}',
                              style: const TextStyle(
                                  fontSize: 11, color: Colors.white)),
                        ),
                  onTap: onOpenNotifications,
                ),
                _DrawerTile(
                  icon: Icons.info_outline,
                  title: 'About',
                  onTap: onOpenAbout,
                ),
                const Divider(),
                _DrawerTile(
                  icon: Icons.logout,
                  title: 'Logout',
                  onTap: () async {
                    Navigator.of(context).pop();
                    final confirmed = await showLogoutConfirmation(
                      context,
                      session: session,
                      currentUser: currentUser,
                    );
                    if (confirmed) {
                      onLogout();
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// REUSABLE WIDGETS
// ============================================================

class _SummaryCard extends StatefulWidget {
  const _SummaryCard({
    required this.title,
    this.amount,
    this.onTap,
  });

  final String title;
  final num? amount;
  final VoidCallback? onTap;

  @override
  State<_SummaryCard> createState() => _SummaryCardState();
}

class _SummaryCardState extends State<_SummaryCard> {
  bool _showBalance = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
              colors: [LawraColors.green, LawraColors.cyan]),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.title,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w400)),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.account_balance_wallet,
                    color: Colors.white70, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _showBalance
                        ? _money(widget.amount)
                        : '••••••••',
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                ),
                IconButton(
                  icon: Icon(
                    _showBalance ? Icons.visibility_off : Icons.visibility,
                    color: Colors.white70,
                    size: 20,
                  ),
                  onPressed: () {
                    setState(() => _showBalance = !_showBalance);
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child, this.action});

  final String title;
  final Widget child;
  final Widget? action;

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
                const Spacer(),
                if (action != null) action!,
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

class _LoanTile extends StatelessWidget {
  const _LoanTile({required this.loan, this.onRepay});

  final LoanSummary loan;
  final VoidCallback? onRepay;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text('Gh¢ ${loan.amount}',
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(loan.virtualBank ?? loan.bank ?? '-'),
            Text(loan.tenure ?? '-'),
            if (loan.status == 'APPROVED')
              Text('Outstanding: ${_money(loan.outstandingAmount)} · ${(loan.repaymentStatus ?? 'PENDING').replaceAll('_', ' ')}'),
          ],
        ),
        isThreeLine: loan.status == 'APPROVED',
        trailing: onRepay == null
            ? _StatusChip(status: loan.status)
            : ElevatedButton(onPressed: onRepay, child: const Text('Repay')),
      ),
    );
  }
}

class _PackageTile extends StatelessWidget {
  const _PackageTile({required this.package, this.onTap});

  final LoanPackage package;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(
          package.name.isNotEmpty ? package.name : 'Package #${package.id}',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(package.virtualBank?.name ?? '-'),
            Text('Interest: ${package.interestRate}%'),
          ],
        ),
        isThreeLine: true,
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: LawraColors.green.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(_money(package.balance),
              style: const TextStyle(
                  color: LawraColors.green, fontWeight: FontWeight.w600)),
        ),
        onTap: onTap,
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
            const Icon(Icons.error_outline,
                size: 48, color: LawraColors.destructive),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: LawraColors.textMuted)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
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
      'APPROVED' => LawraColors.approve,
      'REJECTED' => LawraColors.destructive,
      'COMPLETED' => LawraColors.info,
      'DEFAULTED' => LawraColors.warning,
      _ => LawraColors.textMuted,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        status,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
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

class _DrawerTile extends StatelessWidget {
  const _DrawerTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: LawraColors.green),
      title: Text(title,
          style: const TextStyle(
              color: LawraColors.textDark, fontWeight: FontWeight.w500)),
      trailing: trailing,
      onTap: onTap,
    );
  }
}

class _Notice {
  _Notice(
      {required this.id,
      required this.message,
      required this.type,
      required this.timestamp});

  final String id;
  final String message;
  final String type;
  final DateTime timestamp;
}

String _money(num? amount) {
  final value = amount ?? 0;
  final formatted = value.toStringAsFixed(2);
  final parts = formatted.split('.');
  final intPart = parts[0];
  final buffer = StringBuffer();
  for (var i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 == 0) buffer.write(',');
    buffer.write(intPart[i]);
  }
  return 'Gh¢ ${buffer.toString()}.${parts[1]}';
}

String _timeLabel(DateTime timestamp) {
  final local = timestamp.toLocal();
  return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
}

String _normalizedRole(String? role) {
  final value = role?.trim() ?? '';
  if (value.startsWith('ROLE_')) {
    return value.substring(5).toUpperCase();
  }
  return value.toUpperCase();
}
