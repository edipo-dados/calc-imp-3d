import { useState } from 'react';

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
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const handleFocus = () => {
    setEditing(true);
    setText(value === 0 ? '' : String(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const n = parseFloat(raw);
    if (!isNaN(n)) {
      onChange(n);
    }
  };

  const handleBlur = () => {
    setEditing(false);
    const n = parseFloat(text);
    if (isNaN(n) || text.trim() === '') {
      onChange(0);
    }
  };

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-wrapper">
        <input
          type="number"
          value={editing ? text : value}
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
