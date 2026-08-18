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
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-wrapper">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
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
