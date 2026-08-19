import { useState, useRef } from 'react';

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
  const [localValue, setLocalValue] = useState<string | null>(null);
  const isFocused = useRef(false);

  // When focused, use localValue. When not focused, use prop value.
  const displayValue = isFocused.current && localValue !== null ? localValue : String(value);

  const handleFocus = () => {
    isFocused.current = true;
    // If current value is 0, start with empty field for easier typing
    setLocalValue(value === 0 ? '' : String(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    const parsed = parseFloat(localValue || '');
    if (isNaN(parsed)) {
      onChange(0);
    }
    setLocalValue(null);
  };

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-wrapper">
        <input
          type="number"
          value={displayValue}
          onFocus={handleFocus}
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
