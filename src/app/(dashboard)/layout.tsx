import { Sidebar, Header } from '@/components/layout';
import { ReactNode } from 'react';

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
