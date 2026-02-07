'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
    href: string;
    icon: string;
    label: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const initialNavigation: NavSection[] = [
    {
        title: 'Principal',
        items: [
            { href: '/dashboard', icon: '📊', label: 'Dashboard' },
        ],
    },
    {
        title: 'Cadastros',
        items: [
            { href: '/clientes', icon: '👥', label: 'Clientes' },
            { href: '/veiculos', icon: '🚗', label: 'Veículos' },
            { href: '/estoque', icon: '📦', label: 'Estoque' },
            { href: '/servicos', icon: '🔧', label: 'Serviços' },
        ],
    },
    {
        title: 'Operacional',
        items: [
            { href: '/orcamentos', icon: '📝', label: 'Orçamentos' },
            { href: '/os', icon: '🔩', label: 'Ordens de Serviço' },
        ],
    },
    {
        title: 'Financeiro',
        items: [
            { href: '/nfe', icon: '🧾', label: 'NF-e' },
            { href: '/nfse', icon: '📄', label: 'NFS-e' },
            { href: '/financeiro', icon: '💰', label: 'Financeiro' },
            { href: '/comissoes', icon: '💵', label: 'Comissões' },
            { href: '/relatorios', icon: '📈', label: 'Relatórios' },
        ],
    },
    {
        title: 'Sistema',
        items: [
            { href: '/xml', icon: '📄', label: 'Importar XML' },
            { href: '/configuracoes', icon: '⚙️', label: 'Configurações' },
            { href: '/admin/empresas', icon: '🌍', label: 'Gestão Global' },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const supabase = createClient();
    const [perfil, setPerfil] = useState<string | null>(null);

    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const loadPerfil = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setPerfil(user.user_metadata?.perfil || null);
                setUserEmail(user.email || null);
            }
        };
        loadPerfil();
    }, []);

    const filteredNavigation = initialNavigation.map(section => ({
        ...section,
        items: section.items.filter(item => {
            if (item.href === '/configuracoes') {
                return perfil === 'admin';
            }
            if (item.href === '/comissoes') {
                return perfil === 'admin' || perfil === 'financeiro';
            }
            if (item.href === '/admin/empresas') {
                return userEmail === 'paixaoassessoriacontabil@gmail.com';
            }
            return true;
        })
    })).filter(section => section.items.length > 0);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">P</div>
                <div>
                    <div className="sidebar-title">PAC Oficinas</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Gestão Simplificada</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {filteredNavigation.map((section) => (
                    <div key={section.title} className="nav-section">
                        <div className="nav-section-title">{section.title}</div>
                        {section.items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                            >
                                <span className="nav-link-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="nav-link" style={{ cursor: 'pointer' }} onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                }}>
                    <span className="nav-link-icon">🚪</span>
                    <span>Sair</span>
                </div>
            </div>
        </aside>
    );
}
