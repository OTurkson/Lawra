import 'package:flutter/material.dart';

class CountryCode {
  final String code;
  final String dial;
  final String name;
  final String flagEmoji;

  const CountryCode({
    required this.code,
    required this.dial,
    required this.name,
    required this.flagEmoji,
  });
}

const List<CountryCode> countryCodes = [
  CountryCode(code: 'GH', dial: '+233', name: 'Ghana', flagEmoji: '🇬🇭'),
  CountryCode(code: 'NG', dial: '+234', name: 'Nigeria', flagEmoji: '🇳🇬'),
  CountryCode(code: 'US', dial: '+1', name: 'United States', flagEmoji: '🇺🇸'),
  CountryCode(code: 'GB', dial: '+44', name: 'United Kingdom', flagEmoji: '🇬🇧'),
  CountryCode(code: 'CA', dial: '+1', name: 'Canada', flagEmoji: '🇨🇦'),
  CountryCode(code: 'CM', dial: '+237', name: 'Cameroon', flagEmoji: '🇨🇲'),
  CountryCode(code: 'TG', dial: '+228', name: 'Togo', flagEmoji: '🇹🇬'),
  CountryCode(code: 'LR', dial: '+231', name: 'Liberia', flagEmoji: '🇱🇷'),
  CountryCode(code: 'FR', dial: '+33', name: 'France', flagEmoji: '🇫🇷'),
  CountryCode(code: 'BR', dial: '+55', name: 'Brazil', flagEmoji: '🇧🇷'),
  CountryCode(code: 'AR', dial: '+54', name: 'Argentina', flagEmoji: '🇦🇷'),
  CountryCode(code: 'DE', dial: '+49', name: 'Germany', flagEmoji: '🇩🇪'),
  CountryCode(code: 'IN', dial: '+91', name: 'India', flagEmoji: '🇮🇳'),
  CountryCode(code: 'CN', dial: '+86', name: 'China', flagEmoji: '🇨🇳'),
  CountryCode(code: 'AU', dial: '+61', name: 'Australia', flagEmoji: '🇦🇺'),
  CountryCode(code: 'ZA', dial: '+27', name: 'South Africa', flagEmoji: '🇿🇦'),
  CountryCode(code: 'CI', dial: '+225', name: "Côte d'Ivoire", flagEmoji: '🇨🇮'),
  CountryCode(code: 'RW', dial: '+250', name: 'Rwanda', flagEmoji: '🇷🇼'),
  CountryCode(code: 'TZ', dial: '+255', name: 'Tanzania', flagEmoji: '🇹🇿'),
  CountryCode(code: 'RU', dial: '+7', name: 'Russia', flagEmoji: '🇷🇺'),
  CountryCode(code: 'NL', dial: '+31', name: 'Netherlands', flagEmoji: '🇳🇱'),
  CountryCode(code: 'BF', dial: '+226', name: 'Burkina Faso', flagEmoji: '🇧🇫'),
  CountryCode(code: 'SN', dial: '+221', name: 'Senegal', flagEmoji: '🇸🇳'),
  CountryCode(code: 'ES', dial: '+34', name: 'Spain', flagEmoji: '🇪🇸'),
  CountryCode(code: 'PT', dial: '+351', name: 'Portugal', flagEmoji: '🇵🇹'),
  CountryCode(code: 'EG', dial: '+20', name: 'Egypt', flagEmoji: '🇪🇬'),
  CountryCode(code: 'UY', dial: '+598', name: 'Uruguay', flagEmoji: '🇺🇾'),
];

/// Parses a full phone string into a dial code and local number.
/// Defaults to Ghana (+233) if no known prefix is found.
({String dial, String number}) parsePhoneNumber(String fullNumber) {
  final trimmed = fullNumber.trim();
  for (final cc in countryCodes) {
    if (trimmed.startsWith(cc.dial)) {
      return (dial: cc.dial, number: trimmed.substring(cc.dial.length).trim());
    }
  }
  return (dial: '+233', number: trimmed);
}

/// Combines a dial code and local number into a full phone string.
String combinePhoneNumber(String dial, String number) {
  final local = number.trim();
  if (local.isEmpty) return '';
  return '$dial $local';
}

class PhoneInput extends StatefulWidget {
  final String value;
  final ValueChanged<String> onChanged;
  final String? placeholder;
  final TextEditingController? controller;
  final String? Function(String?)? validator;

  const PhoneInput({
    super.key,
    required this.value,
    required this.onChanged,
    this.placeholder,
    this.controller,
    this.validator,
  });

  @override
  State<PhoneInput> createState() => _PhoneInputState();
}

class _PhoneInputState extends State<PhoneInput> {
  late TextEditingController _numberController;
  late String _selectedDial;

  @override
  void initState() {
    super.initState();
    final parsed = parsePhoneNumber(widget.value);
    _selectedDial = parsed.dial;
    _numberController = widget.controller ?? TextEditingController(text: parsed.number);
  }

  @override
  void didUpdateWidget(PhoneInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != oldWidget.value && !_numberController.text.isNotEmpty) {
      final parsed = parsePhoneNumber(widget.value);
      _selectedDial = parsed.dial;
      _numberController.text = parsed.number;
    }
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _numberController.dispose();
    }
    super.dispose();
  }

  void _onDialChanged(String dial) {
    setState(() => _selectedDial = dial);
    widget.onChanged(combinePhoneNumber(dial, _numberController.text));
  }

  void _onNumberChanged(String number) {
    widget.onChanged(combinePhoneNumber(_selectedDial, number));
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Country code dropdown - Fixed width to prevent layout issues
        SizedBox(
          width: 110,
          child: DropdownButtonFormField<String>(
            value: _selectedDial,
            decoration: const InputDecoration(
              labelText: 'Code',
              contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 14),
            ),
            isExpanded: true,
            items: countryCodes.map((cc) {
              return DropdownMenuItem<String>(
                value: cc.dial,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(cc.flagEmoji, style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 4),
                    Text(cc.dial, style: const TextStyle(fontSize: 14)),
                  ],
                ),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) _onDialChanged(value);
            },
          ),
        ),
        const SizedBox(width: 8),
        // Phone number input
        Expanded(
          child: TextFormField(
            controller: _numberController,
            decoration: InputDecoration(
              labelText: widget.placeholder ?? 'Phone number',
            ),
            keyboardType: TextInputType.phone,
            onChanged: _onNumberChanged,
            validator: widget.validator,
          ),
        ),
      ],
    );
  }
}