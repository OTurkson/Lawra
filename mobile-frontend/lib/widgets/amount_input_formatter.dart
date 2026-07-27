import 'package:flutter/services.dart';

/// A [TextInputFormatter] that inserts thousand separators (commas)
/// as the user types a numeric amount. Also allows one decimal point.
///
/// Example: 1234.56 → "1,234.56"
class AmountInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Allow empty field
    if (newValue.text.isEmpty) return newValue;

    // Remove any existing commas for re-formatting
    final raw = newValue.text.replaceAll(',', '');

    // Only allow digits and at most one decimal point
    if (!RegExp(r'^\d*\.?\d*$').hasMatch(raw)) return oldValue;

    // Split on decimal point
    final parts = raw.split('.');
    final integerPart = parts[0];
    final decimalPart = parts.length > 1 ? '.${parts[1]}' : '';

    // Add thousand separators to the integer part
    final buffer = StringBuffer();
    for (var i = 0; i < integerPart.length; i++) {
      if (i > 0 && (integerPart.length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(integerPart[i]);
    }

    final formatted = buffer.toString() + decimalPart;

    // Preserve cursor position relative to the formatted text
    final cursorOffset = newValue.selection.baseOffset;
    // Count how many commas were added before the cursor position
    int commasBeforeCursor = 0;
    for (int i = 0; i < formatted.length && i < cursorOffset + commasBeforeCursor; i++) {
      if (formatted[i] == ',') commasBeforeCursor++;
    }
    final newOffset = cursorOffset + commasBeforeCursor;
    if (newOffset > formatted.length) {
      return TextEditingValue(
        text: formatted,
        selection: TextSelection.collapsed(offset: formatted.length),
      );
    }

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: newOffset),
    );
  }
}

/// Strips commas from a formatted amount string and returns the raw numeric string.
/// Returns `null` if the string is empty or not a valid number.
String? parseAmount(String formatted) {
  final raw = formatted.replaceAll(',', '');
  if (raw.isEmpty) return null;
  return raw;
}