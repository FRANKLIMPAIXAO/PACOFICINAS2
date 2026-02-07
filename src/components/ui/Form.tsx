'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

// Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className = '', ...props }, ref) => {
        return (
            <div className="form-group">
                {label && (
                    <label className="form-label">
                        {label}
                        {props.required && <span style={{ color: 'var(--error-500)' }}> *</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
                    {...props}
                />
                {error && <p className="form-error">{error}</p>}
                {hint && !error && <p className="form-hint">{hint}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

// Select
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, className = '', ...props }, ref) => {
        return (
            <div className="form-group">
                {label && (
                    <label className="form-label">
                        {label}
                        {props.required && <span style={{ color: 'var(--error-500)' }}> *</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    className={`form-input form-select ${error ? 'form-input-error' : ''} ${className}`}
                    {...props}
                >
                    <option value="">Selecione...</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="form-error">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

// Textarea
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="form-group">
                {label && (
                    <label className="form-label">
                        {label}
                        {props.required && <span style={{ color: 'var(--error-500)' }}> *</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`form-input form-textarea ${error ? 'form-input-error' : ''} ${className}`}
                    {...props}
                />
                {error && <p className="form-error">{error}</p>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

// Search Input
interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: SearchInputProps) {
    return (
        <div className="search-bar" style={{ maxWidth: '300px' }}>
            <span className="search-bar-icon">🔍</span>
            <input
                type="search"
                className="form-input search-bar-input"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
            />
        </div>
    );
}

// Money Input
interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label?: string;
    error?: string;
    value: number;
    onChange: (value: number) => void;
}

export function MoneyInput({ label, error, value, onChange, ...props }: MoneyInputProps) {
    const formatMoney = (val: number) => {
        return val.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const numValue = parseInt(raw || '0', 10) / 100;
        onChange(numValue);
    };

    return (
        <div className="form-group">
            {label && <label className="form-label">{label}</label>}
            <div style={{ position: 'relative' }}>
                <span
                    style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--gray-500)',
                    }}
                >
                    R$
                </span>
                <input
                    type="text"
                    className={`form-input ${error ? 'form-input-error' : ''}`}
                    style={{ paddingLeft: '2.75rem' }}
                    value={formatMoney(value)}
                    onChange={handleChange}
                    {...props}
                />
            </div>
            {error && <p className="form-error">{error}</p>}
        </div>
    );
}

// Form Row (for two columns)
export function FormRow({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-md)' }}>
            {children}
        </div>
    );
}
