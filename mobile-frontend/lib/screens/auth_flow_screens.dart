import 'package:flutter/material.dart';

import '../data/lawra_api.dart';
import '../data/session_store.dart';
import '../theme/lawra_theme.dart';
import '../widgets/lawra_widgets.dart';
import 'dashboard_shell.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final LawraApi _api = LawraApi();
  final _loginFormKey = GlobalKey<FormState>();
  final _signupFormKey = GlobalKey<FormState>();
  bool _isLogin = true;
  bool _isLoadingTenants = true;
  bool _isSubmitting = false;
  List<Tenant> _tenants = [];

  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();
  String? _loginTenantId;

  final _signupEmailController = TextEditingController();
  final _signupFullNameController = TextEditingController();
  final _signupPhoneController = TextEditingController();
  final _signupPasswordController = TextEditingController();
  final _signupConfirmPasswordController = TextEditingController();
  String _signupRole = 'BORROWER';
  String? _signupTenantId;

  @override
  void initState() {
    super.initState();
    _loadTenants();
  }

  @override
  void dispose() {
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _signupEmailController.dispose();
    _signupFullNameController.dispose();
    _signupPhoneController.dispose();
    _signupPasswordController.dispose();
    _signupConfirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _loadTenants() async {
    try {
      final tenants = await _api.fetchTenants();
      if (!mounted) {
        return;
      }
      setState(() {
        _tenants = tenants;
        _loginTenantId = tenants.isNotEmpty ? tenants.first.id : null;
        _signupTenantId = tenants.isNotEmpty ? tenants.first.id : null;
        _isLoadingTenants = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isLoadingTenants = false;
      });
      _showMessage(error is LawraApiException ? error.message : error.toString());
    }
  }

  Future<void> _login() async {
    if (!(_loginFormKey.currentState?.validate() ?? false)) {
      return;
    }

    final tenantId = _loginTenantId;
    if (tenantId == null || tenantId.isEmpty) {
      _showMessage('Choose a tenant before signing in.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final session = await _api.login(
        email: _loginEmailController.text.trim(),
        password: _loginPasswordController.text,
        tenantId: tenantId,
      );
      await SessionStore.saveAuth(session);
      if (!mounted) {
        return;
      }
      _goToDashboard(session);
    } on LawraApiException catch (error) {
      if (error.statusCode == 403 && error.body is Map<String, dynamic> && (error.body as Map<String, dynamic>)['requiresPasswordReset'] == true) {
        _showMessage('Password reset is required before login.');
        setState(() => _isLogin = true);
      } else {
        _showMessage(error.message);
      }
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _signup() async {
    if (!(_signupFormKey.currentState?.validate() ?? false)) {
      return;
    }

    final tenantId = _signupTenantId;
    if (tenantId == null || tenantId.isEmpty) {
      _showMessage('Choose a tenant before signing up.');
      return;
    }

    final password = _signupPasswordController.text;
    if (password != _signupConfirmPasswordController.text) {
      _showMessage('Passwords do not match.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await _api.createUser(
        email: _signupEmailController.text.trim(),
        fullName: _signupFullNameController.text.trim(),
        phoneNumber: _signupPhoneController.text.trim(),
        password: password,
        tenantId: tenantId,
        role: _signupRole,
      );
      final session = await _api.login(
        email: _signupEmailController.text.trim(),
        password: password,
        tenantId: tenantId,
      );
      await SessionStore.saveAuth(session);
      if (!mounted) {
        return;
      }
      _goToDashboard(session);
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

  void _goToDashboard(AuthSession session) {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => DashboardShell(
          session: session,
          onSignedOut: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const AuthScreen()),
              (_) => false,
            );
          },
        ),
      ),
      (_) => false,
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.36,
              width: double.infinity,
              child: Image.asset(
                _isLogin ? 'assets/design/page-0007.png' : 'assets/design/page-0006.png',
                fit: BoxFit.fitWidth,
                alignment: Alignment.topCenter,
              ),
            ),
            Container(
              color: LawraColors.cyan,
              child: Row(
                children: [
                  _AuthTab(label: 'Sign in', selected: _isLogin, onTap: () => setState(() => _isLogin = true)),
                  _AuthTab(label: 'Sign up', selected: !_isLogin, onTap: () => setState(() => _isLogin = false)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _isLogin ? _buildLoginForm() : _buildSignupForm(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Form(
      key: _loginFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Sign in', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: LawraColors.textDark)),
          const SizedBox(height: 8),
          const Text('Enter your workspace credentials to continue', style: TextStyle(color: LawraColors.textMuted)),
          const SizedBox(height: 22),
          TextFormField(
            controller: _loginEmailController,
            decoration: const InputDecoration(labelText: 'Email'),
            validator: (value) => (value == null || value.trim().isEmpty) ? 'Email is required' : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _loginTenantId,
            decoration: const InputDecoration(labelText: 'Tenant'),
            items: _tenantItems(),
            onChanged: (value) => setState(() => _loginTenantId = value),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _loginPasswordController,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
            validator: (value) => (value == null || value.isEmpty) ? 'Password is required' : null,
          ),
          const SizedBox(height: 20),
          GradientButton(
            label: _isLoadingTenants ? 'Loading tenants...' : _isSubmitting ? 'Signing in...' : 'Continue',
            onTap: (_isLoadingTenants || _isSubmitting) ? () {} : _login,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => ForgotPasswordScreen(api: _api, tenants: _tenants)),
              );
            },
            child: const Text('Forgot your password?'),
          ),
        ],
      ),
    );
  }

  Widget _buildSignupForm() {
    return Form(
      key: _signupFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Signup', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: LawraColors.textDark)),
          const SizedBox(height: 8),
          const Text('Create your profile to join the Lawra network', style: TextStyle(color: LawraColors.textMuted)),
          const SizedBox(height: 22),
          TextFormField(
            controller: _signupFullNameController,
            decoration: const InputDecoration(labelText: 'Full name'),
            validator: (value) => (value == null || value.trim().isEmpty) ? 'Full name is required' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _signupEmailController,
            decoration: const InputDecoration(labelText: 'Email'),
            validator: (value) => (value == null || value.trim().isEmpty) ? 'Email is required' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _signupPhoneController,
            decoration: const InputDecoration(labelText: 'Phone number'),
            validator: (value) => (value == null || value.trim().isEmpty) ? 'Phone number is required' : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _signupRole,
            decoration: const InputDecoration(labelText: 'Account type'),
            items: const [
              DropdownMenuItem(value: 'BORROWER', child: Text('Borrower')),
              DropdownMenuItem(value: 'PAYMASTER', child: Text('Paymaster')),
            ],
            onChanged: (value) {
              if (value != null) {
                setState(() => _signupRole = value);
              }
            },
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _signupTenantId,
            decoration: const InputDecoration(labelText: 'Tenant'),
            items: _tenantItems(),
            onChanged: (value) => setState(() => _signupTenantId = value),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _signupPasswordController,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
            validator: (value) => (value == null || value.isEmpty) ? 'Password is required' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _signupConfirmPasswordController,
            decoration: const InputDecoration(labelText: 'Confirm password'),
            obscureText: true,
            validator: (value) => (value == null || value.isEmpty) ? 'Please confirm your password' : null,
          ),
          const SizedBox(height: 20),
          GradientButton(
            label: _isLoadingTenants ? 'Loading tenants...' : _isSubmitting ? 'Signing up...' : 'Create account',
            onTap: (_isLoadingTenants || _isSubmitting) ? () {} : _signup,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () {
              setState(() => _isLogin = true);
            },
            child: const Text('Already have an account? Sign in'),
          ),
        ],
      ),
    );
  }

  List<DropdownMenuItem<String>> _tenantItems() {
    return _tenants
        .map(
          (tenant) => DropdownMenuItem(
            value: tenant.id,
            child: Text(tenant.name),
          ),
        )
        .toList();
  }
}

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, required this.api, required this.tenants});

  final LawraApi api;
  final List<Tenant> tenants;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  String? _tenantId;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tenantId = widget.tenants.isNotEmpty ? widget.tenants.first.id : null;
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    if (_tenantId == null) {
      _showMessage('Choose a tenant.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await widget.api.requestPasswordReset(email: _emailController.text.trim(), tenantId: _tenantId!);
      if (!mounted) {
        return;
      }
      _showMessage('If the account exists, a reset link was sent.');
      Navigator.of(context).pop();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
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
    return Scaffold(
      appBar: AppBar(title: const Text('Forgot password')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Enter your email and tenant to receive a password reset link.',
                style: TextStyle(color: LawraColors.textMuted),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (value) => (value == null || value.trim().isEmpty) ? 'Email is required' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _tenantId,
                decoration: const InputDecoration(labelText: 'Tenant'),
                items: widget.tenants
                    .map((tenant) => DropdownMenuItem(value: tenant.id, child: Text(tenant.name)))
                    .toList(),
                onChanged: (value) => setState(() => _tenantId = value),
              ),
              const SizedBox(height: 20),
              GradientButton(
                label: _isSubmitting ? 'Sending link...' : 'Send reset link',
                onTap: _isSubmitting ? () {} : _submit,
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => ResetPasswordScreen(api: widget.api)),
                  );
                },
                child: const Text('Have a reset token? Reset password'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Back to sign in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, required this.api, this.initialToken = ''});

  final LawraApi api;
  final String initialToken;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tokenController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tokenController.text = widget.initialToken;
  }

  @override
  void dispose() {
    _tokenController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    if (_newPasswordController.text != _confirmPasswordController.text) {
      _showMessage('Passwords do not match.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await widget.api.resetPassword(token: _tokenController.text.trim(), newPassword: _newPasswordController.text);
      if (!mounted) {
        return;
      }
      _showMessage('Password updated.');
      Navigator.of(context).pop();
    } on LawraApiException catch (error) {
      _showMessage(error.message);
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
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _tokenController,
                decoration: const InputDecoration(labelText: 'Reset token'),
                validator: (value) => (value == null || value.trim().isEmpty) ? 'Token is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _newPasswordController,
                decoration: const InputDecoration(labelText: 'New password'),
                obscureText: true,
                validator: (value) => (value == null || value.isEmpty) ? 'New password is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _confirmPasswordController,
                decoration: const InputDecoration(labelText: 'Confirm password'),
                obscureText: true,
                validator: (value) => (value == null || value.isEmpty) ? 'Confirm your password' : null,
              ),
              const SizedBox(height: 20),
              GradientButton(
                label: _isSubmitting ? 'Updating password...' : 'Update password',
                onTap: _isSubmitting ? () {} : _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthTab extends StatelessWidget {
  const _AuthTab({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: selected ? LawraColors.green : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(label, style: const TextStyle(fontSize: 17, color: Colors.white)),
        ),
      ),
    );
  }
}
