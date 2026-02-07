# PAC Oficinas

Sistema de gestão multi-tenant para oficinas mecânicas e autopeças brasileiras.

## 🚀 Funcionalidades

- **Dashboard** - Visão geral com métricas e ações rápidas
- **Clientes** - Cadastro completo com veículos vinculados
- **Veículos** - Gestão de frota dos clientes
- **Estoque** - Controle de peças com alertas de estoque baixo
- **Serviços** - Catálogo de serviços da oficina
- **Orçamentos** - Criação e aprovação de orçamentos
- **Ordens de Serviço** - Fluxo completo de atendimento
- **Financeiro** - Contas a pagar e receber
- **Relatórios** - Faturamento, OS e estoque
- **Importação XML** - Entrada automática de NFe

## 🛠️ Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (PostgreSQL + Auth + Storage)
- **CSS Moderno** (Design System próprio)

## 📦 Instalação

```bash
# Clonar o repositório
cd pac-oficinas

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Configurar as variáveis do Supabase no .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🗄️ Configuração do Banco de Dados

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie as credenciais para o `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Execute o schema SQL no SQL Editor do Supabase:
   - Abra o arquivo `supabase/schema.sql`
   - Execute no SQL Editor do seu projeto

## 👥 Multi-Tenant

O sistema é **multi-tenant por design**:

- Cada empresa (oficina) é um tenant isolado
- Todas as tabelas possuem `empresa_id`
- Row Level Security (RLS) garante isolamento
- Perfis de usuário: Admin, Atendente, Mecânico, Financeiro, Contador

## 📁 Estrutura do Projeto

```
pac-oficinas/
├── supabase/
│   └── schema.sql          # Schema completo do banco
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (dashboard)/    # Páginas logadas
│   │   ├── login/          # Autenticação
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/         # Sidebar, Header
│   │   └── ui/             # Cards, Forms, Tables, Modals
│   ├── lib/
│   │   └── supabase/       # Cliente Supabase
│   └── types/              # Tipos TypeScript
└── .env.example
```

## 🎨 Design System

O sistema inclui um design system completo em CSS:

- Variáveis de cores, espaçamentos e tipografia
- Componentes: Botões, Cards, Forms, Tables, Modals
- Badges de status com cores semânticas
- Responsivo para desktop e mobile

## 📋 Próximos Passos

- [ ] Integração completa com Supabase Auth
- [ ] Emissão de NF-e e NFS-e
- [ ] Integração com WhatsApp
- [ ] App mobile (React Native)
- [ ] IA para diagnóstico
- [ ] Portal do contador

## 📄 Licença

Projeto proprietário - PAC Sistemas
