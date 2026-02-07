'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  // Auto-redirect to dashboard after 2 seconds (opcional)
  // useEffect(() => {
  //     const timer = setTimeout(() => router.push('/clientes'), 2000);
  //     return () => clearTimeout(timer);
  // }, [router]);

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Logo & Hero */}
        <div className="landing-hero">
          <div className="landing-logo">
            <span className="logo-icon">🔧</span>
            <h1>PAC Oficinas</h1>
          </div>
          <p className="landing-subtitle">
            Sistema de gestão simples e intuitivo para oficinas mecânicas e autopeças
          </p>
        </div>

        {/* Features */}
        <div className="landing-features">
          <div className="feature-card">
            <span className="feature-icon">👥</span>
            <h3>Clientes</h3>
            <p>Cadastro completo com veículos vinculados</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🚗</span>
            <h3>Veículos</h3>
            <p>Histórico de serviços e manutenções</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📦</span>
            <h3>Estoque</h3>
            <p>Controle de peças com alertas</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📋</span>
            <h3>Ordens de Serviço</h3>
            <p>Fluxo completo de atendimento</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💰</span>
            <h3>Financeiro</h3>
            <p>Contas a pagar e receber</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Relatórios</h3>
            <p>Análises e indicadores</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="landing-actions">
          <Link href="/clientes" className="btn btn-primary btn-lg">
            🚀 Acessar Sistema
          </Link>
          <Link href="/login" className="btn btn-secondary btn-lg">
            🔐 Fazer Login
          </Link>
        </div>

        {/* Quick Links */}
        <div className="landing-links">
          <p>Acesso rápido aos módulos:</p>
          <div className="quick-links">
            <Link href="/clientes">Clientes</Link>
            <Link href="/veiculos">Veículos</Link>
            <Link href="/estoque">Estoque</Link>
            <Link href="/servicos">Serviços</Link>
            <Link href="/orcamentos">Orçamentos</Link>
            <Link href="/os">Ordens de Serviço</Link>
            <Link href="/financeiro">Financeiro</Link>
            <Link href="/relatorios">Relatórios</Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="landing-footer">
          <p>© 2024 PAC Sistemas - Todos os direitos reservados</p>
        </footer>
      </div>

      <style jsx>{`
                .landing-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }

                .landing-container {
                    max-width: 900px;
                    width: 100%;
                    text-align: center;
                }

                .landing-hero {
                    margin-bottom: 3rem;
                }

                .landing-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .logo-icon {
                    font-size: 3rem;
                }

                .landing-logo h1 {
                    font-size: 3rem;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                    background: linear-gradient(90deg, #00d4ff, #7c3aed);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .landing-subtitle {
                    font-size: 1.25rem;
                    color: #94a3b8;
                    max-width: 500px;
                    margin: 0 auto;
                }

                .landing-features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 1rem;
                    margin-bottom: 3rem;
                }

                .feature-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 1.5rem 1rem;
                    transition: all 0.3s ease;
                }

                .feature-card:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #7c3aed;
                    transform: translateY(-4px);
                }

                .feature-icon {
                    font-size: 2rem;
                    display: block;
                    margin-bottom: 0.5rem;
                }

                .feature-card h3 {
                    color: white;
                    font-size: 1rem;
                    margin: 0 0 0.25rem 0;
                }

                .feature-card p {
                    color: #94a3b8;
                    font-size: 0.75rem;
                    margin: 0;
                }

                .landing-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .landing-actions .btn {
                    padding: 1rem 2rem;
                    font-size: 1.1rem;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .landing-actions .btn-primary {
                    background: linear-gradient(90deg, #7c3aed, #00d4ff);
                    color: white;
                    border: none;
                }

                .landing-actions .btn-primary:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);
                }

                .landing-actions .btn-secondary {
                    background: transparent;
                    color: white;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                }

                .landing-actions .btn-secondary:hover {
                    border-color: white;
                    background: rgba(255, 255, 255, 0.1);
                }

                .landing-links {
                    margin-bottom: 2rem;
                }

                .landing-links > p {
                    color: #64748b;
                    font-size: 0.875rem;
                    margin-bottom: 0.75rem;
                }

                .quick-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    justify-content: center;
                }

                .quick-links a {
                    color: #94a3b8;
                    text-decoration: none;
                    padding: 0.5rem 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                }

                .quick-links a:hover {
                    background: rgba(124, 58, 237, 0.3);
                    color: white;
                }

                .landing-footer {
                    color: #475569;
                    font-size: 0.75rem;
                }

                .landing-footer p {
                    margin: 0;
                }
            `}</style>
    </div>
  );
}
