import 'package:flutter/material.dart';

import '../../data/lawra_api.dart';
import '../../theme/lawra_theme.dart';
import '../../widgets/lawra_widgets.dart';
import 'reset_password_screen.dart';

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
