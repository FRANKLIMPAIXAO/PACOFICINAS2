import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout';

const SUPER_ADMIN_EMAIL = 'paixaoassessoriacontabil@gmail.com';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
        redirect('/dashboard');
    }

    return (
        <div className="page-container">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
