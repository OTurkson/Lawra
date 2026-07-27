import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const COUNTRY_CODES = [
  { code: "GH", dial: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "NG", dial: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "US", dial: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dial: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", dial: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "CM", dial: "+237", name: "Cameroon", flag: "🇨🇲" },
  { code: "TG", dial: "+228", name: "Togo", flag: "🇹🇬" },
  { code: "LR", dial: "+231", name: "Liberia", flag: "🇱🇷" },
  { code: "FR", dial: "+33", name: "France", flag: "🇫🇷" },
  { code: "BR", dial: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "AR", dial: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "DE", dial: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "IN", dial: "+91", name: "India", flag: "🇮🇳" },
  { code: "CN", dial: "+86", name: "China", flag: "🇨🇳" },
  { code: "AU", dial: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "ZA", dial: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "CI", dial: "+225", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "RW", dial: "+250", name: "Rwanda", flag: "🇷🇼" },
  { code: "TZ", dial: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "RU", dial: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "NL", dial: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "BF", dial: "+226", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "SN", dial: "+221", name: "Senegal", flag: "🇸🇳" },
  { code: "ES", dial: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "PT", dial: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "EG", dial: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "UY", dial: "+598", name: "Uruguay", flag: "🇺🇾" },
];

export type PhoneInputValue = {
  countryCode: string;
  number: string;
};

export function parsePhoneNumber(fullNumber: string): PhoneInputValue {
  const trimmed = fullNumber.trim();
  for (const cc of COUNTRY_CODES) {
    if (trimmed.startsWith(cc.dial)) {
      return {
        countryCode: cc.dial,
        number: trimmed.slice(cc.dial.length).trim(),
      };
    }
  }
  return { countryCode: "+233", number: trimmed };
}

export function combinePhoneNumber(countryCode: string, number: string): string {
  const local = number.trim();
  if (!local) return "";
  return `${countryCode} ${local}`;
}


type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  autoComplete?: string;
  id?: string;
};

export function PhoneInput({
  value,
  onChange,
  placeholder = "000 000 0000",
  className = "",
  inputRef,
  autoComplete = "off",
  id,
}: PhoneInputProps) {
  const parsed = parsePhoneNumber(value);
  const [selectedDial, setSelectedDial] = useState(parsed.countryCode);
  const [localNumber, setLocalNumber] = useState(parsed.number);
  // Track whether user is currently editing to avoid overwriting during typing
  const isInternalChange = useRef(false);

  const selectedCountry = COUNTRY_CODES.find((c) => c.dial === selectedDial);

  // Sync internal state when the external value changes (e.g. user selection populates the field)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const parsed = parsePhoneNumber(value);
    setSelectedDial(parsed.countryCode);
    setLocalNumber(parsed.number);
  }, [value]);

  const handleDialChange = (dial: string) => {
    isInternalChange.current = true;
    setSelectedDial(dial);
    onChange(combinePhoneNumber(dial, localNumber));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isInternalChange.current = true;
    const newNumber = e.target.value;
    setLocalNumber(newNumber);
    onChange(combinePhoneNumber(selectedDial, newNumber));
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={selectedDial} onValueChange={handleDialChange}>
        <SelectTrigger className="shrink-0 w-auto min-w-[70px] gap-1 px-2 py-3 rounded-full border border-primary/40 bg-card text-foreground focus:outline-none focus:border-primary transition-colors text-sm h-auto">
          <SelectValue>
            {selectedCountry && (
              <span className="flex items-center gap-1">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span>{selectedCountry.dial}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((cc) => (
            <SelectItem key={`${cc.code}-${cc.dial}`} value={cc.dial}>
              <span className="flex items-center gap-2">
                <span className="text-lg">{cc.flag}</span>
                <span>{cc.dial}</span>
                <span className="text-muted-foreground">{cc.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        type="tel"
        placeholder={placeholder}
        value={localNumber}
        onChange={handleNumberChange}
        ref={inputRef}
        autoComplete={autoComplete}
        id={id}
        className="flex-1 px-5 py-3 rounded-full border border-primary/40 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}