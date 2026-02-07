'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

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
                            <div className="px-md py-sm border-b border-gray-200">
                                <div className="font-medium text-sm">Usuário</div>
                                <div className="text-xs text-muted">usuario@empresa.com</div>
                            </div>
                            <button
                                className="dropdown-item w-full text-left"
                                onClick={() => router.push('/configuracoes')}
                            >
                                👤 Meu Perfil
                            </button>
                            <button
                                className="dropdown-item w-full text-left"
                                onClick={() => router.push('/configuracoes')}
                            >
                                🏢 Minha Empresa
                            </button>
                            <div className="dropdown-divider"></div>
                            <button
                                className="dropdown-item w-full text-left text-red-600 hover:bg-red-50"
                                onClick={handleLogout}
                            >
                                🚪 Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
