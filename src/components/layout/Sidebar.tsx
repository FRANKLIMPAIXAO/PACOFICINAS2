'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    href: string;
    icon: string;
    label: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const navigation: NavSection[] = [
    {
        title: 'Principal',
        items: [
            { href: '/', icon: '📊', label: 'Dashboard' },
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
            { href: '/relatorios', icon: '📈', label: 'Relatórios' },
        ],
    },
    {
        title: 'Sistema',
        items: [
            { href: '/xml-import', icon: '📄', label: 'Importar XML' },
            { href: '/configuracoes', icon: '⚙️', label: 'Configurações' },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();

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
                {navigation.map((section) => (
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
                <div className="nav-link" style={{ cursor: 'pointer' }}>
                    <span className="nav-link-icon">🚪</span>
                    <span>Sair</span>
                </div>
            </div>
        </aside>
    );
}
