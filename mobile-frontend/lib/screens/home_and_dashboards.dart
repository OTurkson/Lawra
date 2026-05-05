import 'package:flutter/material.dart';

import '../theme/lawra_theme.dart';
import '../widgets/lawra_widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _roleTab = 0;
  int _bottom = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Builder(
                    builder: (context) => IconButton(
                      icon: const Icon(Icons.menu, color: LawraColors.green),
                      onPressed: () => Scaffold.of(context).openDrawer(),
                    ),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text('Home', style: TextStyle(color: LawraColors.textMuted, fontSize: 20)),
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
            ),
            const ProfileHeader(),
            Row(
              children: [
                _RoleTab(label: 'Borrower', selected: _roleTab == 0, onTap: () => setState(() => _roleTab = 0)),
                _RoleTab(label: 'Lender', selected: _roleTab == 1, onTap: () => setState(() => _roleTab = 1)),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: _roleTab == 0 ? const BorrowerGrid() : const LenderGrid(),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _bottom,
        selectedItemColor: LawraColors.green,
        unselectedItemColor: Colors.black38,
        onTap: (v) => setState(() => _bottom = v),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
          BottomNavigationBarItem(icon: Icon(Icons.notifications_none), label: 'Notifications'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Discover'),
        ],
      ),
    );
  }
}

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          CircleAvatar(radius: 36, backgroundImage: AssetImage('assets/design/page-0004.png')),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Bahubali Anthonio', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                Text('Unilever Ghana', style: TextStyle(color: LawraColors.textMuted)),
                Text('Staff ID', style: TextStyle(color: LawraColors.textMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleTab extends StatelessWidget {
  const _RoleTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.only(bottom: 10, top: 2),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: selected ? LawraColors.cyan : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 25,
              color: selected ? const Color(0xFF666A70) : const Color(0xFF868B90),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

class BorrowerGrid extends StatelessWidget {
  const BorrowerGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      children: [
        DashboardCard(
          label: 'Virtual Bank',
          icon: Icons.account_balance,
          onTap: () => _push(context, const BorrowerDashboardScreen()),
        ),
        DashboardCard(
          label: 'Loan Application',
          icon: Icons.assignment_outlined,
          onTap: () => _push(context, const LoanApplicationScreen()),
        ),
        DashboardCard(label: 'Profile', icon: Icons.person_outline, onTap: () {}),
        DashboardCard(
          label: 'Tracking Loan',
          icon: Icons.trending_up,
          onTap: () => _push(context, const TrackingLoanScreen()),
        ),
      ],
    );
  }
}

class LenderGrid extends StatelessWidget {
  const LenderGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      children: [
        DashboardCard(
          label: 'Lend Money',
          icon: Icons.volunteer_activism_outlined,
          onTap: () => _push(context, const LendMoneyScreen()),
        ),
        DashboardCard(
          label: 'Verify Payment',
          icon: Icons.verified,
          onTap: () => _push(context, const VerifyPaymentScreen()),
        ),
        DashboardCard(
          label: 'Loan Listing',
          icon: Icons.list_alt,
          onTap: () => _push(context, const LenderDashboardScreen()),
        ),
        DashboardCard(
          label: 'Tracking Loan',
          icon: Icons.query_stats,
          onTap: () => _push(context, const TrackingInvestmentScreen()),
        ),
      ],
    );
  }
}

void _push(BuildContext context, Widget page) {
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
}

class DashboardCard extends StatelessWidget {
  const DashboardCard({
    super.key,
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE7E7E7))),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 82,
                height: 82,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: [LawraColors.green, LawraColors.cyan]),
                ),
                child: Icon(icon, color: Colors.white, size: 36),
              ),
              const SizedBox(height: 12),
              Text(label, style: const TextStyle(fontSize: 18)),
            ],
          ),
        ),
      ),
    );
  }
}

class DashboardScaffold extends StatelessWidget {
  const DashboardScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.body,
    this.showDrawer = false,
  });

  final String title;
  final String subtitle;
  final Widget body;
  final bool showDrawer;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: showDrawer ? const AppDrawer() : null,
      body: Column(
        children: [
          Container(
            height: 260,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomRight,
                colors: [LawraColors.cyan, LawraColors.green],
              ),
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Column(
                  children: [
                    Row(
                      children: [
                        if (showDrawer)
                          Builder(
                            builder: (context) => IconButton(
                              icon: const Icon(Icons.menu, color: Colors.white),
                              onPressed: () => Scaffold.of(context).openDrawer(),
                            ),
                          )
                        else
                          IconButton(
                            icon: const Icon(Icons.arrow_back, color: Colors.white),
                            onPressed: () => Navigator.of(context).pop(),
                          ),
                        const Spacer(),
                        const Text('Dashboard', style: TextStyle(color: Colors.white70, fontSize: 20)),
                        const Spacer(),
                        const SizedBox(width: 36),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 26.7,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        subtitle,
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: LawraColors.lightBg,
                borderRadius: BorderRadius.only(topLeft: Radius.circular(80)),
              ),
              child: body,
            ),
          ),
        ],
      ),
    );
  }
}

class LenderDashboardScreen extends StatelessWidget {
  const LenderDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DashboardScaffold(
      showDrawer: true,
      title: 'LOAN LISTING',
      subtitle: 'See all loans requested by colleagues',
      body: _LoanList(items: [
        LoanListItem(name: 'Philip Kwaku', amount: '₵1,100'),
        LoanListItem(name: 'Bahubali Antonio', amount: '₵2,200'),
        LoanListItem(name: 'Wanzam', amount: '₵6,500'),
      ]),
    );
  }
}

class BorrowerDashboardScreen extends StatelessWidget {
  const BorrowerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DashboardScaffold(
      showDrawer: true,
      title: 'VIRTUAL BANK',
      subtitle: 'A display of all your uploaded loans',
      body: _LoanList(items: [
        LoanListItem(name: 'Abusua Fund', amount: '₵2,000'),
        LoanListItem(name: 'Bahubali & Co. Funds', amount: '₵5,000'),
        LoanListItem(name: 'Philip Bank', amount: '₵6,500'),
      ]),
    );
  }
}

class TrackingInvestmentScreen extends StatelessWidget {
  const TrackingInvestmentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DashboardScaffold(
      title: 'TRACKING INVESTMENT',
      subtitle: 'Follow progress of your investment',
      body: _LoanList(items: [
        LoanListItem(name: 'Abusua Fund', amount: '₵6,500'),
        LoanListItem(name: 'Crowd Fund', amount: '₵5,000'),
        LoanListItem(name: 'Philip Bank', amount: '₵3,000'),
      ]),
    );
  }
}

class _LoanList extends StatelessWidget {
  const _LoanList({required this.items});
  final List<LoanListItem> items;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 20),
      children: items,
    );
  }
}

class LoanListItem extends StatelessWidget {
  const LoanListItem({super.key, required this.name, required this.amount});

  final String name;
  final String amount;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE0E0E0))),
      ),
      child: Row(
        children: [
          Container(
            width: 70,
            height: 70,
            color: const Color(0xFFEBEBEB),
            child: const Icon(Icons.image, color: Colors.black26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontSize: 16.9)),
                Text(amount, style: const TextStyle(color: LawraColors.green, fontSize: 20)),
                const Text('Wed, Nov 21st 2019, 13:40', style: TextStyle(color: Colors.black38)),
              ],
            ),
          ),
          const GradientChip(label: 'Make an offer'),
        ],
      ),
    );
  }
}

class LoanApplicationScreen extends StatelessWidget {
  const LoanApplicationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DashboardScaffold(
      title: 'LOAN APPLICATION',
      subtitle: 'Apply for a quick loan from this page',
      body: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        child: Column(
          children: [
            const StepCard(title: 'Borrower Details', subtitle: 'Enter your name'),
            const StepCard(title: 'Employment Details', subtitle: 'Enter your company credentials'),
            const StepCard(title: 'Loan Details', subtitle: 'Choose a photo'),
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.check_circle, color: LawraColors.cyan),
                SizedBox(width: 10),
                Text('Agree to Terms and Conditions of Loan'),
              ],
            ),
            const Spacer(),
            GradientButton(label: 'Submit', onTap: () {}),
          ],
        ),
      ),
    );
  }
}

class LendMoneyScreen extends StatelessWidget {
  const LendMoneyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DashboardScaffold(
      title: 'LEND MONEY',
      subtitle: 'Lend a helping hand',
      body: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        child: Column(
          children: [
            const StepCard(title: 'Lender(s) Details', subtitle: 'Enter your bank details'),
            const StepCard(title: 'Fund Details', subtitle: 'Amount to lend'),
            const StepCard(title: 'Select Icon', subtitle: 'Choose an icon to represent your funds'),
            const SizedBox(height: 10),
            const Row(
              children: [
                Icon(Icons.check_circle, color: LawraColors.cyan),
                SizedBox(width: 10),
                Text('Agree to Terms and Conditions of Loan offer'),
              ],
            ),
            const Spacer(),
            GradientButton(label: 'Submit', onTap: () {}),
          ],
        ),
      ),
    );
  }
}

class StepCard extends StatelessWidget {
  const StepCard({super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE1E1E1))),
      ),
      child: Row(
        children: [
          Container(
            width: 76,
            height: 76,
            color: const Color(0xFFE9E9E9),
            child: const Icon(Icons.image, color: Colors.black26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 18.3, fontWeight: FontWeight.w500)),
                Text(subtitle, style: const TextStyle(color: LawraColors.textMuted)),
              ],
            ),
          ),
          const Icon(Icons.arrow_drop_down_circle, color: LawraColors.cyan),
        ],
      ),
    );
  }
}

class VerifyPaymentScreen extends StatefulWidget {
  const VerifyPaymentScreen({super.key});

  @override
  State<VerifyPaymentScreen> createState() => _VerifyPaymentScreenState();
}

class _VerifyPaymentScreenState extends State<VerifyPaymentScreen> {
  bool bankTab = false;

  @override
  Widget build(BuildContext context) {
    return DashboardScaffold(
      title: 'VERIFY PAYMENT',
      subtitle: bankTab
          ? 'Input transaction details from your bank'
          : 'Input transaction details from mobile money',
      body: Column(
        children: [
          Row(
            children: [
              _VerifyTab(
                label: 'Mobile Money',
                icon: Icons.currency_exchange,
                selected: !bankTab,
                onTap: () => setState(() => bankTab = false),
              ),
              _VerifyTab(
                label: 'Bank Transaction',
                icon: Icons.account_balance,
                selected: bankTab,
                onTap: () => setState(() => bankTab = true),
              ),
            ],
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(18),
              children: [
                const LawraLineInput(label: 'Amount Sent'),
                const SizedBox(height: 10),
                LawraLineInput(label: bankTab ? 'Bank' : 'Mobile Money', dropdown: true),
                const SizedBox(height: 10),
                LawraLineInput(label: bankTab ? 'Branch Name' : 'Mobile Money Number'),
                const SizedBox(height: 10),
                LawraLineInput(label: bankTab ? 'Account Name' : 'Transaction ID'),
                if (bankTab) ...[
                  const SizedBox(height: 10),
                  const LawraLineInput(label: 'Account Number'),
                  const SizedBox(height: 10),
                  const LawraLineInput(label: 'Date and Time of Sending Money', dropdown: true),
                ],
                const SizedBox(height: 30),
                GradientButton(label: 'Verify', onTap: () {}),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VerifyTab extends StatelessWidget {
  const _VerifyTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          color: selected ? const Color(0xFFECECEC) : const Color(0xFFF8F8F8),
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Column(
            children: [
              Icon(icon, color: LawraColors.cyan, size: 30),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(fontSize: 17)),
            ],
          ),
        ),
      ),
    );
  }
}

class TrackingLoanScreen extends StatelessWidget {
  const TrackingLoanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DashboardScaffold(
      title: 'TRACKING LOAN',
      subtitle: 'Follow progress of your loan application',
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: const [
          LoanListItem(name: 'Loan Pending', amount: '₵2,000'),
          SizedBox(height: 14),
          _TrackingTable(),
        ],
      ),
    );
  }
}

class _TrackingTable extends StatelessWidget {
  const _TrackingTable();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(12),
      child: const Column(
        children: [
          _InfoRow('Name of Borrower', 'Nana Yaw'),
          _InfoRow('Amount (Ghc)', '700'),
          _InfoRow('Interest', '12.5%'),
          _InfoRow('Tenor', '6 months'),
          _InfoRow('Installments', '110'),
          _InfoRow('Bank', 'GCB Bank'),
          _InfoRow('Acc. Name', 'Nana Yaw Mensah'),
          _InfoRow('Bank Account', '038746289643928'),
          _InfoRow('Remaining Loan', '350'),
          _InfoRow('Month left to pay', '3 months'),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.keyText, this.value);

  final String keyText;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(keyText, style: const TextStyle(color: Colors.black54))),
          Text(value),
        ],
      ),
    );
  }
}

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [LawraColors.cyan, LawraColors.green],
          ),
        ),
        child: ListView(
          padding: EdgeInsets.zero,
          children: const [
            DrawerHeader(
              decoration: BoxDecoration(color: Colors.white),
              child: ProfileHeader(),
            ),
            _DrawerTile(icon: Icons.home_outlined, title: 'Main page'),
            _DrawerTile(icon: Icons.handshake_outlined, title: 'Lender Dashboard'),
            _DrawerTile(icon: Icons.currency_exchange, title: 'Borrower Dashboard'),
            _DrawerTile(icon: Icons.person_outline, title: 'Profile'),
            _DrawerTile(icon: Icons.support_agent, title: 'Help and Contact'),
            _DrawerTile(icon: Icons.public, title: 'Visit Site'),
            _DrawerTile(icon: Icons.notifications_none, title: 'Notification'),
            _DrawerTile(icon: Icons.logout, title: 'Logout'),
          ],
        ),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  const _DrawerTile({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 18),
      ),
      onTap: () => Navigator.of(context).pop(),
    );
  }
}
