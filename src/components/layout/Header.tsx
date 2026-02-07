'use client';

import { useState } from 'react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <header className="header">
            <div className="header-left">
                <div>
                    <h1 className="header-title">{title}</h1>
                    {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
                </div>
            </div>

            <div className="header-right">
                {/* Search */}
                <div className="search-bar" style={{ display: 'none' }}>
                    <span className="search-bar-icon">🔍</span>
                    <input
                        type="search"
                        className="form-input search-bar-input"
                        placeholder="Buscar..."
                    />
                </div>

                {/* Notifications */}
                <button className="btn btn-ghost btn-icon" title="Notificações">
                    🔔
                </button>

                {/* User Menu */}
                <div className="dropdown">
                    <button
                        className="flex items-center gap-sm"
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <div className="avatar">U</div>
                    </button>

                    {showDropdown && (
                        <div className="dropdown-menu">
                            <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 500 }}>Usuário</div>
                                <div className="text-sm text-muted">usuario@empresa.com</div>
                            </div>
                            <div className="dropdown-item">👤 Meu Perfil</div>
                            <div className="dropdown-item">🏢 Minha Empresa</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item" style={{ color: 'var(--error-600)' }}>
                                🚪 Sair
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
