import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  danger: 'bg-white text-red-600 hover:bg-red-50 border-red-200',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function Button({ variant = 'secondary', icon, className, children, ...rest }: BtnProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
