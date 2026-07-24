import 'package:flutter/material.dart';

import '../../data/lawra_api.dart';
import '../../data/session_store.dart';
import '../../theme/lawra_theme.dart';
import '../../widgets/auth/auth_header.dart';
import '../../widgets/auth/phone_input.dart';
import '../../widgets/lawra_widgets.dart';
import '../dashboard_shell.dart';
import 'forgot_password_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, this.initialIsLogin = true});

  /// When false, the sign-up tab is selected on first paint.
  final bool initialIsLogin;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final LawraApi _api = LawraApi();
  final _loginFormKey = GlobalKey<FormState>();
  final _signupFormKey = GlobalKey<FormState>();
  late bool _isLogin = widget.initialIsLogin;
  bool _isLoadingTenants = true;
  bool _isSubmitting = false;
  List<Tenant> _tenants = [];

  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();
  String? _loginTenantId;

  final _signupEmailController = TextEditingController();
  final _signupFullNameController = TextEditingController();
  final _signupPasswordController = TextEditingController();
  final _signupConfirmPasswordController = TextEditingController();
  String _signupPhoneNumber = '';
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
        phoneNumber: _signupPhoneNumber.trim(),
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
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.32,
              width: double.infinity,
              child: const AuthHeaderIllustration(),
            ),
            AuthTabBar(
              isLogin: _isLogin,
              onLoginTap: () => setState(() => _isLogin = true),
              onSignupTap: () => setState(() => _isLogin = false),
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
          PhoneInput(
            value: _signupPhoneNumber,
            onChanged: (value) => _signupPhoneNumber = value,
            placeholder: 'Phone number',
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
