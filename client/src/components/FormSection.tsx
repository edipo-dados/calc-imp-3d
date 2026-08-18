import { useState, ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  icon?: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export function FormSection({ title, icon, children, defaultCollapsed = false }: FormSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="form-section">
      <div
        className="form-section-header"
        onClick={() => setCollapsed(!collapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCollapsed(!collapsed);
          }
        }}
      >
        <h3 className="form-section-title">
          {icon && <span>{icon}</span>}
          {title}
        </h3>
        <span className={`form-section-toggle ${collapsed ? 'collapsed' : ''}`}>
          ▼
        </span>
      </div>
      <div className={`form-section-content ${collapsed ? 'collapsed' : ''}`}>
        {children}
      </div>
    </div>
  );
}
