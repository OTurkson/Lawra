import 'package:flutter/material.dart';

class CountryCode {
  final String code;
  final String dial;
  final String name;

  const CountryCode({
    required this.code,
    required this.dial,
    required this.name,
  });
}

const List<CountryCode> countryCodes = [
  CountryCode(code: 'GH', dial: '+233', name: 'Ghana'),
  CountryCode(code: 'NG', dial: '+234', name: 'Nigeria'),
  CountryCode(code: 'KE', dial: '+254', name: 'Kenya'),
  CountryCode(code: 'ZA', dial: '+27', name: 'South Africa'),
  CountryCode(code: 'TZ', dial: '+255', name: 'Tanzania'),
  CountryCode(code: 'UG', dial: '+256', name: 'Uganda'),
  CountryCode(code: 'RW', dial: '+250', name: 'Rwanda'),
  CountryCode(code: 'CM', dial: '+237', name: 'Cameroon'),
  CountryCode(code: 'SN', dial: '+221', name: 'Senegal'),
  CountryCode(code: 'CI', dial: '+225', name: "Côte d'Ivoire"),
  CountryCode(code: 'US', dial: '+1', name: 'United States'),
  CountryCode(code: 'GB', dial: '+44', name: 'United Kingdom'),
  CountryCode(code: 'CA', dial: '+1', name: 'Canada'),
  CountryCode(code: 'AU', dial: '+61', name: 'Australia'),
  CountryCode(code: 'DE', dial: '+49', name: 'Germany'),
  CountryCode(code: 'FR', dial: '+33', name: 'France'),
  CountryCode(code: 'IN', dial: '+91', name: 'India'),
  CountryCode(code: 'CN', dial: '+86', name: 'China'),
  CountryCode(code: 'BR', dial: '+55', name: 'Brazil'),
  CountryCode(code: 'MX', dial: '+52', name: 'Mexico'),
  CountryCode(code: 'EG', dial: '+20', name: 'Egypt'),
  CountryCode(code: 'ET', dial: '+251', name: 'Ethiopia'),
  CountryCode(code: 'ZM', dial: '+260', name: 'Zambia'),
  CountryCode(code: 'BW', dial: '+267', name: 'Botswana'),
  CountryCode(code: 'MU', dial: '+230', name: 'Mauritius'),
  CountryCode(code: 'MW', dial: '+265', name: 'Malawi'),
  CountryCode(code: 'SL', dial: '+232', name: 'Sierra Leone'),
  CountryCode(code: 'LR', dial: '+231', name: 'Liberia'),
  CountryCode(code: 'BF', dial: '+226', name: 'Burkina Faso'),
  CountryCode(code: 'ML', dial: '+223', name: 'Mali'),
  CountryCode(code: 'TG', dial: '+228', name: 'Togo'),
  CountryCode(code: 'BJ', dial: '+229', name: 'Benin'),
  CountryCode(code: 'CD', dial: '+243', name: 'DR Congo'),
  CountryCode(code: 'AO', dial: '+244', name: 'Angola'),
  CountryCode(code: 'RU', dial: '+7', name: 'Russia'),
  CountryCode(code: 'NL', dial: '+31', name: 'Netherlands'),
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
        // Country code dropdown
        DropdownButtonFormField<String>(
          value: _selectedDial,
          decoration: const InputDecoration(
            labelText: 'Code',
            contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 14),
          ),
          isExpanded: false,
          items: countryCodes.map((cc) {
            return DropdownMenuItem<String>(
              value: cc.dial,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: Image.network(
                      'https://flagcdn.com/w20/${cc.code.toLowerCase()}.png',
                      width: 20,
                      height: 15,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const SizedBox(width: 20, height: 15),
                    ),
                  ),
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