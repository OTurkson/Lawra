import 'package:flutter/material.dart';

import '../data/lawra_api.dart';
import '../data/session_store.dart';
import '../theme/lawra_theme.dart';

/// Shows a modal bottom sheet with logout confirmation.
/// Returns `true` if the user confirmed logout, `false` if cancelled.
Future<bool> showLogoutConfirmation(
  BuildContext context, {
  required AuthSession session,
  required UserProfile? currentUser,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (sheetContext) {
      return _LogoutSheet(
        session: session,
        currentUser: currentUser,
      );
    },
  );
  return result ?? false;
}

class _LogoutSheet extends StatefulWidget {
  const _LogoutSheet({
    required this.session,
    required this.currentUser,
  });

  final AuthSession session;
  final UserProfile? currentUser;

  @override
  State<_LogoutSheet> createState() => _LogoutSheetState();
}

class _LogoutSheetState extends State<_LogoutSheet> {
  bool _isLoggingOut = false;

  Future<void> _handleLogout() async {
    setState(() => _isLoggingOut = true);

    // Brief delay to show loading state
    await Future.delayed(const Duration(milliseconds: 500));

    if (mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.currentUser;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),

              // Avatar
              CircleAvatar(
                radius: 36,
                backgroundColor: LawraColors.green.withOpacity(0.15),
                child: const Icon(
                  Icons.person,
                  size: 36,
                  color: LawraColors.green,
                ),
              ),
              const SizedBox(height: 12),

              // User name
              Text(
                user?.fullName ?? 'Current User',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: LawraColors.textDark,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),

              // User email
              Text(
                user?.email ?? '',
                style: const TextStyle(
                  color: LawraColors.textMuted,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),

              // User role
              Text(
                widget.session.role,
                style: const TextStyle(
                  color: LawraColors.textMuted,
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),

              // Buttons
              Row(
                children: [
                  // Cancel button
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(false),
                        style: OutlinedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                          side: const BorderSide(color: LawraColors.borderLight),
                        ),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Logout button
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: FilledButton(
                        onPressed: _isLoggingOut ? null : _handleLogout,
                        style: FilledButton.styleFrom(
                          backgroundColor: LawraColors.destructive,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                        ),
                        child: _isLoggingOut
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'Logout',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                              ),
                      ),
                    ),
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
