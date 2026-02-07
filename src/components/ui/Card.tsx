'use client';

import { ReactNode } from 'react';

// Stat Card
interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    trend?: {
        value: number;
        label: string;
    };
}

const colorMap = {
    blue: { bg: 'var(--primary-100)', color: 'var(--primary-600)' },
    green: { bg: 'var(--success-100)', color: 'var(--success-600)' },
    yellow: { bg: 'var(--warning-100)', color: 'var(--warning-600)' },
    red: { bg: 'var(--error-100)', color: 'var(--error-600)' },
    purple: { bg: '#f3e8ff', color: '#9333ea' },
};

export function StatCard({ icon, label, value, color, trend }: StatCardProps) {
    const colors = colorMap[color];

    return (
        <div className="stat-card">
            <div
                className="stat-card-icon"
                style={{ background: colors.bg, color: colors.color }}
            >
                {icon}
            </div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
            {trend && (
                <div
                    className="text-sm mt-md"
                    style={{ color: trend.value >= 0 ? 'var(--success-600)' : 'var(--error-600)' }}
                >
                    {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                </div>
            )}
        </div>
    );
}

// Card Component
interface CardProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    actions?: ReactNode;
    noPadding?: boolean;
    className?: string;
}

export function Card({ title, subtitle, children, actions, noPadding, className = '' }: CardProps) {
    return (
        <div className={`card ${className}`}>
            {(title || actions) && (
                <div className="card-header">
                    <div>
                        {title && <h3 className="card-title">{title}</h3>}
                        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex gap-sm">{actions}</div>}
                </div>
            )}
            <div className={noPadding ? '' : 'card-body'}>{children}</div>
        </div>
    );
}

// Empty State
interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-text">{description}</p>
            {action}
        </div>
    );
}

// Loading Spinner
export function Loading({ size = 24 }: { size?: number }) {
    return (
        <div className="flex justify-center items-center p-lg">
            <div className="spinner" style={{ width: size, height: size }}></div>
        </div>
    );
}

// Full Page Loading
export function PageLoading() {
    return (
        <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
            <div className="flex flex-col items-center gap-md">
                <div className="spinner" style={{ width: 40, height: 40 }}></div>
                <p className="text-muted">Carregando...</p>
            </div>
        </div>
    );
}

// Status Badge
interface StatusBadgeProps {
    status: string;
    type?: 'orcamento' | 'os' | 'conta';
}

const statusLabels: Record<string, string> = {
    aberto: 'Em Aberto',
    aprovado: 'Aprovado',
    recusado: 'Recusado',
    expirado: 'Expirado',
    aberta: 'Aberta',
    em_execucao: 'Em Execução',
    aguardando_peca: 'Aguardando Peça',
    finalizada: 'Finalizada',
    faturada: 'Faturada',
    cancelada: 'Cancelada',
    cancelado: 'Cancelado',
    pago: 'Pago',
    atrasado: 'Atrasado',
};

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span className={`badge status-${status}`}>
            {statusLabels[status] || status}
        </span>
    );
}

// Alert
interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    children: ReactNode;
    onClose?: () => void;
}

const alertIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

export function Alert({ type, children, onClose }: AlertProps) {
    return (
        <div className={`alert alert-${type}`}>
            <span>{alertIcons[type]}</span>
            <div style={{ flex: 1 }}>{children}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: 0.7,
                    }}
                >
                    ✕
                </button>
            )}
        </div>
    );
}
