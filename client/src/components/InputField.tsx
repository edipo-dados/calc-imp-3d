import { useState, useEffect } from 'react';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  placeholder?: string;
}

export function InputField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  error,
  placeholder,
}: InputFieldProps) {
  const [displayValue, setDisplayValue] = useState<string>(String(value));

  // Sync display when value changes externally (profile/impressora selection)
  useEffect(() => {
    setDisplayValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    // Only propagate valid numbers
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (raw === '' || raw === '-') {
      // Allow empty/minus but don't propagate yet
    }
  };

  const handleBlur = () => {
    // On blur, if empty or invalid, reset to 0
    const parsed = parseFloat(displayValue);
    if (isNaN(parsed)) {
      setDisplayValue('0');
      onChange(0);
    } else {
      setDisplayValue(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-wrapper">
        <input
          type="number"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          aria-label={label}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
