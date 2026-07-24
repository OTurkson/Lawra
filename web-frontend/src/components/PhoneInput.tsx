import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const COUNTRY_CODES = [
  { code: "GH", dial: "+233", name: "Ghana" },
  { code: "NG", dial: "+234", name: "Nigeria" },
  { code: "KE", dial: "+254", name: "Kenya" },
  { code: "ZA", dial: "+27", name: "South Africa" },
  { code: "TZ", dial: "+255", name: "Tanzania" },
  { code: "UG", dial: "+256", name: "Uganda" },
  { code: "RW", dial: "+250", name: "Rwanda" },
  { code: "CM", dial: "+237", name: "Cameroon" },
  { code: "SN", dial: "+221", name: "Senegal" },
  { code: "CI", dial: "+225", name: "Côte d'Ivoire" },
  { code: "US", dial: "+1", name: "United States" },
  { code: "GB", dial: "+44", name: "United Kingdom" },
  { code: "CA", dial: "+1", name: "Canada" },
  { code: "AU", dial: "+61", name: "Australia" },
  { code: "DE", dial: "+49", name: "Germany" },
  { code: "FR", dial: "+33", name: "France" },
  { code: "IN", dial: "+91", name: "India" },
  { code: "CN", dial: "+86", name: "China" },
  { code: "BR", dial: "+55", name: "Brazil" },
  { code: "MX", dial: "+52", name: "Mexico" },
  { code: "EG", dial: "+20", name: "Egypt" },
  { code: "ET", dial: "+251", name: "Ethiopia" },
  { code: "ZM", dial: "+260", name: "Zambia" },
  { code: "BW", dial: "+267", name: "Botswana" },
  { code: "MU", dial: "+230", name: "Mauritius" },
  { code: "MW", dial: "+265", name: "Malawi" },
  { code: "SL", dial: "+232", name: "Sierra Leone" },
  { code: "LR", dial: "+231", name: "Liberia" },
  { code: "BF", dial: "+226", name: "Burkina Faso" },
  { code: "ML", dial: "+223", name: "Mali" },
  { code: "TG", dial: "+228", name: "Togo" },
  { code: "BJ", dial: "+229", name: "Benin" },
  { code: "CD", dial: "+243", name: "DR Congo" },
  { code: "AO", dial: "+244", name: "Angola" },
  { code: "RU", dial: "+7", name: "Russia" },
  { code: "NL", dial: "+31", name: "Netherlands" },
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

function FlagImage({ code }: { code: string }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w40/${code.toLowerCase()}.png 2x`}
      width={20}
      height={15}
      alt={`${code} flag`}
      className="inline-block rounded-sm"
    />
  );
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
                <FlagImage code={selectedCountry.code} />
                <span>{selectedCountry.dial}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((cc) => (
            <SelectItem key={`${cc.code}-${cc.dial}`} value={cc.dial}>
              <span className="flex items-center gap-2">
                <FlagImage code={cc.code} />
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