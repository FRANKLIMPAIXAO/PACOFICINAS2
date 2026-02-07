'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simular login (substituir pela integração real com Supabase)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Por enquanto, qualquer login funciona
        if (email && password) {
            router.push('/');
        } else {
            setError('Preencha todos os campos');
        }

        setLoading(false);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                padding: 'var(--spacing-lg)',
            }}
        >
            <div
                style={{
                    background: 'var(--card)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    width: '100%',
                    maxWidth: '420px',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                        padding: 'var(--spacing-2xl) var(--spacing-xl)',
                        textAlign: 'center',
                        color: 'white',
                    }}
                >
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            background: 'white',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-md)',
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: '#1e40af',
                        }}
                    >
                        P
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                        PAC Oficinas
                    </h1>
                    <p style={{ opacity: 0.8, fontSize: '0.875rem' }}>
                        Sistema de Gestão para Oficinas
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-xl)' }}>
                    {error && (
                        <div
                            className="alert alert-error mb-lg"
                            style={{ marginBottom: 'var(--spacing-lg)' }}
                        >
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">E-mail</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                            <input type="checkbox" />
                            <span className="text-sm">Lembrar de mim</span>
                        </label>
                        <a href="#" className="action-link text-sm">
                            Esqueci a senha
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 20, height: 20 }}></span>
                                Entrando...
                            </>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div
                    style={{
                        padding: 'var(--spacing-lg) var(--spacing-xl)',
                        background: 'var(--gray-50)',
                        textAlign: 'center',
                        borderTop: '1px solid var(--border)',
                    }}
                >
                    <p className="text-sm text-muted">
                        Não tem uma conta?{' '}
                        <a href="#" className="action-link">
                            Fale conosco
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
