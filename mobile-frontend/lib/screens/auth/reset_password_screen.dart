import 'package:flutter/material.dart';
import 'package:mobile_frontend/theme/lawra_theme.dart';

import '../../data/lawra_api.dart';
import '../../widgets/lawra_widgets.dart';

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
      appBar: AppBar(title: const Text('Reset password',
      style: TextStyle(color: LawraColors.green),)),
      body: SafeArea(
        child: SingleChildScrollView(
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
      ),
    );
  }
}
