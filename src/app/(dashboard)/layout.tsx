import { Sidebar, Header } from '@/components/layout';
import { ReactNode } from 'react';

// Força todas as páginas do dashboard a serem renderizadas dinamicamente
// Isso evita erros de prerender quando variáveis de ambiente não estão disponíveis
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
