-- =====================================================
-- PAC OFICINAS - Schema Completo para Supabase
-- Sistema Multi-Tenant para Oficinas Mecânicas
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE perfil_usuario AS ENUM ('admin', 'atendente', 'mecanico', 'financeiro', 'contador');
CREATE TYPE regime_tributario AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei');
CREATE TYPE status_orcamento AS ENUM ('aberto', 'aprovado', 'recusado', 'expirado');
CREATE TYPE status_os AS ENUM ('aberta', 'em_execucao', 'aguardando_peca', 'finalizada', 'faturada', 'cancelada');
CREATE TYPE status_conta AS ENUM ('aberto', 'pago', 'atrasado', 'cancelado');
CREATE TYPE tipo_item AS ENUM ('produto', 'servico');
CREATE TYPE origem_conta AS ENUM ('os', 'manual', 'xml');

-- =====================================================
-- TABELA: EMPRESAS (Tenants)
-- =====================================================

CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(20),
    inscricao_municipal VARCHAR(20),
    regime_tributario regime_tributario DEFAULT 'simples_nacional',
    
    -- Endereço
    cep VARCHAR(9),
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    
    -- Contato
    telefone VARCHAR(20),
    email VARCHAR(200),
    
    -- Fiscal
    certificado_a1_base64 TEXT,
    certificado_a1_senha VARCHAR(100),
    certificado_validade DATE,
    
    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: USUÁRIOS
-- =====================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    perfil perfil_usuario DEFAULT 'atendente',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);

-- =====================================================
-- TABELA: CLIENTES
-- =====================================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    cpf_cnpj VARCHAR(18),
    telefone VARCHAR(20),
    telefone2 VARCHAR(20),
    email VARCHAR(200),
    
    -- Endereço
    cep VARCHAR(9),
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(empresa_id, cpf_cnpj);

-- =====================================================
-- TABELA: VEÍCULOS
-- =====================================================

CREATE TABLE veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    placa VARCHAR(10) NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(100),
    ano_fabricacao INTEGER,
    ano_modelo INTEGER,
    cor VARCHAR(50),
    chassi VARCHAR(50),
    renavam VARCHAR(20),
    km_atual INTEGER DEFAULT 0,
    combustivel VARCHAR(30),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_veiculos_empresa ON veiculos(empresa_id);
CREATE INDEX idx_veiculos_cliente ON veiculos(cliente_id);
CREATE INDEX idx_veiculos_placa ON veiculos(empresa_id, placa);

-- =====================================================
-- TABELA: PRODUTOS / PEÇAS
-- =====================================================

CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    codigo_barras VARCHAR(50),
    descricao VARCHAR(300) NOT NULL,
    unidade VARCHAR(10) DEFAULT 'UN',
    
    -- Fiscal
    ncm VARCHAR(10),
    cest VARCHAR(10),
    cfop_dentro VARCHAR(5) DEFAULT '5102',
    cfop_fora VARCHAR(5) DEFAULT '6102',
    cst VARCHAR(5),
    origem VARCHAR(2) DEFAULT '0',
    
    -- Preços
    preco_custo DECIMAL(15,2) DEFAULT 0,
    preco_venda DECIMAL(15,2) DEFAULT 0,
    margem_lucro DECIMAL(5,2) DEFAULT 0,
    
    -- Estoque
    estoque_atual DECIMAL(15,3) DEFAULT 0,
    estoque_minimo DECIMAL(15,3) DEFAULT 0,
    localizacao VARCHAR(50),
    
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX idx_produtos_codigo ON produtos(empresa_id, codigo);
CREATE INDEX idx_produtos_descricao ON produtos(empresa_id, descricao);

-- =====================================================
-- TABELA: SERVIÇOS
-- =====================================================

CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    descricao VARCHAR(300) NOT NULL,
    
    -- Fiscal (NFS-e)
    codigo_servico VARCHAR(20),
    aliquota_iss DECIMAL(5,2) DEFAULT 5.00,
    
    preco DECIMAL(15,2) DEFAULT 0,
    tempo_estimado INTEGER, -- em minutos
    
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_servicos_empresa ON servicos(empresa_id);

-- =====================================================
-- TABELA: ORÇAMENTOS
-- =====================================================

CREATE TABLE orcamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero SERIAL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
    
    data_orcamento DATE DEFAULT CURRENT_DATE,
    validade_dias INTEGER DEFAULT 7,
    
    valor_produtos DECIMAL(15,2) DEFAULT 0,
    valor_servicos DECIMAL(15,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) DEFAULT 0,
    
    status status_orcamento DEFAULT 'aberto',
    observacoes TEXT,
    
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orcamentos_empresa ON orcamentos(empresa_id);
CREATE INDEX idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX idx_orcamentos_status ON orcamentos(empresa_id, status);

-- =====================================================
-- TABELA: ITENS DO ORÇAMENTO
-- =====================================================

CREATE TABLE orcamento_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
    tipo tipo_item NOT NULL,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
    descricao VARCHAR(300) NOT NULL,
    quantidade DECIMAL(15,3) DEFAULT 1,
    valor_unitario DECIMAL(15,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);

-- =====================================================
-- TABELA: ORDENS DE SERVIÇO
-- =====================================================

CREATE TABLE ordens_servico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero SERIAL,
    orcamento_id UUID REFERENCES orcamentos(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
    
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_previsao TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    
    km_entrada INTEGER,
    
    valor_produtos DECIMAL(15,2) DEFAULT 0,
    valor_servicos DECIMAL(15,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) DEFAULT 0,
    
    status status_os DEFAULT 'aberta',
    mecanico_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    
    diagnostico TEXT,
    observacoes TEXT,
    observacoes_internas TEXT,
    
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_os_empresa ON ordens_servico(empresa_id);
CREATE INDEX idx_os_cliente ON ordens_servico(cliente_id);
CREATE INDEX idx_os_status ON ordens_servico(empresa_id, status);
CREATE INDEX idx_os_mecanico ON ordens_servico(mecanico_id);

-- =====================================================
-- TABELA: ITENS DA OS
-- =====================================================

CREATE TABLE os_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    tipo tipo_item NOT NULL,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
    descricao VARCHAR(300) NOT NULL,
    quantidade DECIMAL(15,3) DEFAULT 1,
    valor_unitario DECIMAL(15,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) DEFAULT 0,
    baixou_estoque BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_os_itens_os ON os_itens(os_id);

-- =====================================================
-- TABELA: CONTAS A PAGAR
-- =====================================================

CREATE TABLE contas_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    descricao VARCHAR(300) NOT NULL,
    fornecedor VARCHAR(200),
    valor DECIMAL(15,2) NOT NULL,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    valor_pago DECIMAL(15,2),
    status status_conta DEFAULT 'aberto',
    origem origem_conta DEFAULT 'manual',
    xml_import_id UUID,
    categoria VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contas_pagar_empresa ON contas_pagar(empresa_id);
CREATE INDEX idx_contas_pagar_vencimento ON contas_pagar(empresa_id, data_vencimento);
CREATE INDEX idx_contas_pagar_status ON contas_pagar(empresa_id, status);

-- =====================================================
-- TABELA: CONTAS A RECEBER
-- =====================================================

CREATE TABLE contas_receber (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    os_id UUID REFERENCES ordens_servico(id) ON DELETE SET NULL,
    descricao VARCHAR(300) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    valor_recebido DECIMAL(15,2),
    status status_conta DEFAULT 'aberto',
    origem origem_conta DEFAULT 'manual',
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contas_receber_empresa ON contas_receber(empresa_id);
CREATE INDEX idx_contas_receber_vencimento ON contas_receber(empresa_id, data_vencimento);
CREATE INDEX idx_contas_receber_status ON contas_receber(empresa_id, status);
CREATE INDEX idx_contas_receber_cliente ON contas_receber(cliente_id);

-- =====================================================
-- TABELA: IMPORTAÇÕES DE XML
-- =====================================================

CREATE TABLE xml_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    chave_nfe VARCHAR(50) UNIQUE,
    numero_nfe VARCHAR(20),
    serie VARCHAR(5),
    data_emissao DATE,
    fornecedor_cnpj VARCHAR(18),
    fornecedor_nome VARCHAR(200),
    valor_total DECIMAL(15,2),
    xml_content TEXT,
    produtos_importados INTEGER DEFAULT 0,
    processado BOOLEAN DEFAULT false,
    erro TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_xml_imports_empresa ON xml_imports(empresa_id);
CREATE INDEX idx_xml_imports_chave ON xml_imports(chave_nfe);

-- =====================================================
-- TABELA: MOVIMENTAÇÃO DE ESTOQUE
-- =====================================================

CREATE TABLE estoque_movimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL, -- 'entrada', 'saida', 'ajuste'
    quantidade DECIMAL(15,3) NOT NULL,
    quantidade_anterior DECIMAL(15,3),
    quantidade_atual DECIMAL(15,3),
    custo_unitario DECIMAL(15,2),
    referencia_tipo VARCHAR(20), -- 'os', 'xml', 'manual'
    referencia_id UUID,
    observacao TEXT,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_estoque_mov_empresa ON estoque_movimentos(empresa_id);
CREATE INDEX idx_estoque_mov_produto ON estoque_movimentos(produto_id);

-- =====================================================
-- FUNÇÕES DE TRIGGER
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_servicos_updated_at BEFORE UPDATE ON servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON orcamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_os_updated_at BEFORE UPDATE ON ordens_servico FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON contas_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON contas_receber FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- FUNÇÃO: Obter empresa_id do usuário atual
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT empresa_id FROM usuarios WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE xml_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentos ENABLE ROW LEVEL SECURITY;

-- Políticas para EMPRESAS (usuário vê apenas sua empresa)
CREATE POLICY "Usuarios podem ver sua empresa" ON empresas
    FOR SELECT USING (id = get_user_empresa_id());

CREATE POLICY "Admin pode atualizar empresa" ON empresas
    FOR UPDATE USING (
        id = get_user_empresa_id() AND 
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'admin')
    );

-- Políticas para USUARIOS
CREATE POLICY "Usuarios da mesma empresa podem ver" ON usuarios
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Admin pode gerenciar usuarios" ON usuarios
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND 
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'admin')
    );

-- Políticas para CLIENTES
CREATE POLICY "Ver clientes da empresa" ON clientes
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar clientes da empresa" ON clientes
    FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para VEICULOS
CREATE POLICY "Ver veiculos da empresa" ON veiculos
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar veiculos da empresa" ON veiculos
    FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para PRODUTOS
CREATE POLICY "Ver produtos da empresa" ON produtos
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar produtos da empresa" ON produtos
    FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para SERVICOS
CREATE POLICY "Ver servicos da empresa" ON servicos
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar servicos da empresa" ON servicos
    FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para ORCAMENTOS
CREATE POLICY "Ver orcamentos da empresa" ON orcamentos
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar orcamentos da empresa" ON orcamentos
    FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para ORCAMENTO_ITENS
CREATE POLICY "Ver itens de orcamento" ON orcamento_itens
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orcamentos WHERE id = orcamento_itens.orcamento_id AND empresa_id = get_user_empresa_id())
    );

CREATE POLICY "Gerenciar itens de orcamento" ON orcamento_itens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM orcamentos WHERE id = orcamento_itens.orcamento_id AND empresa_id = get_user_empresa_id())
    );

-- Políticas para ORDENS_SERVICO
CREATE POLICY "Ver OS da empresa" ON ordens_servico
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar OS da empresa" ON ordens_servico
    FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para OS_ITENS
CREATE POLICY "Ver itens de OS" ON os_itens
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM ordens_servico WHERE id = os_itens.os_id AND empresa_id = get_user_empresa_id())
    );

CREATE POLICY "Gerenciar itens de OS" ON os_itens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM ordens_servico WHERE id = os_itens.os_id AND empresa_id = get_user_empresa_id())
    );

-- Políticas para CONTAS_PAGAR
CREATE POLICY "Ver contas a pagar da empresa" ON contas_pagar
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar contas a pagar" ON contas_pagar
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'financeiro'))
    );

-- Políticas para CONTAS_RECEBER
CREATE POLICY "Ver contas a receber da empresa" ON contas_receber
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar contas a receber" ON contas_receber
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'financeiro'))
    );

-- Políticas para XML_IMPORTS
CREATE POLICY "Ver imports da empresa" ON xml_imports
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar imports da empresa" ON xml_imports
    FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para ESTOQUE_MOVIMENTOS
CREATE POLICY "Ver movimentos da empresa" ON estoque_movimentos
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Criar movimentos da empresa" ON estoque_movimentos
    FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Produtos com estoque baixo
CREATE OR REPLACE VIEW vw_estoque_baixo AS
SELECT 
    p.id,
    p.empresa_id,
    p.codigo,
    p.descricao,
    p.estoque_atual,
    p.estoque_minimo,
    (p.estoque_minimo - p.estoque_atual) as quantidade_repor
FROM produtos p
WHERE p.estoque_atual <= p.estoque_minimo AND p.ativo = true;

-- View: OS abertas com dados do cliente
CREATE OR REPLACE VIEW vw_os_abertas AS
SELECT 
    os.id,
    os.empresa_id,
    os.numero,
    os.data_abertura,
    os.status,
    os.valor_total,
    c.nome as cliente_nome,
    v.placa as veiculo_placa,
    v.marca || ' ' || v.modelo as veiculo_descricao,
    u.nome as mecanico_nome
FROM ordens_servico os
LEFT JOIN clientes c ON os.cliente_id = c.id
LEFT JOIN veiculos v ON os.veiculo_id = v.id
LEFT JOIN usuarios u ON os.mecanico_id = u.id
WHERE os.status NOT IN ('faturada', 'cancelada');

-- View: Contas vencidas
CREATE OR REPLACE VIEW vw_contas_vencidas AS
SELECT 
    'pagar' as tipo,
    cp.id,
    cp.empresa_id,
    cp.descricao,
    cp.valor,
    cp.data_vencimento,
    CURRENT_DATE - cp.data_vencimento as dias_atraso
FROM contas_pagar cp
WHERE cp.status = 'aberto' AND cp.data_vencimento < CURRENT_DATE
UNION ALL
SELECT 
    'receber' as tipo,
    cr.id,
    cr.empresa_id,
    cr.descricao,
    cr.valor,
    cr.data_vencimento,
    CURRENT_DATE - cr.data_vencimento as dias_atraso
FROM contas_receber cr
WHERE cr.status = 'aberto' AND cr.data_vencimento < CURRENT_DATE;
