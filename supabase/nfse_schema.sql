-- =====================================================
-- PAC OFICINAS - Schema NFS-e (Sistema Nacional)
-- =====================================================

-- ENUM para status NFS-e
CREATE TYPE status_nfse AS ENUM (
    'pendente',      -- Aguardando envio
    'processando',   -- Enviado, aguardando resposta
    'autorizada',    -- NFS-e gerada com sucesso
    'cancelada',     -- Cancelada via evento
    'substituida',   -- Substituída por outra NFS-e
    'erro'           -- Erro na validação/emissão
);

CREATE TYPE tipo_evento_nfse AS ENUM (
    'cancelamento',
    'substituicao',
    'manifestacao_confirmacao',
    'manifestacao_rejeicao'
);

-- =====================================================
-- TABELA: NFS-e
-- =====================================================

CREATE TABLE nfse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    os_id UUID REFERENCES ordens_servico(id) ON DELETE SET NULL,
    
    -- Identificação da Nota
    chave_acesso VARCHAR(50) UNIQUE,
    numero INTEGER,
    serie VARCHAR(5) DEFAULT '1',
    codigo_verificacao VARCHAR(20),
    
    -- Identificação da DPS (para rastrear antes da autorização)
    id_dps VARCHAR(50),
    
    -- Datas
    data_emissao TIMESTAMP WITH TIME ZONE,
    competencia DATE,
    
    -- Valores
    valor_servicos DECIMAL(15,2) NOT NULL,
    valor_deducoes DECIMAL(15,2) DEFAULT 0,
    valor_pis DECIMAL(15,2) DEFAULT 0,
    valor_cofins DECIMAL(15,2) DEFAULT 0,
    valor_inss DECIMAL(15,2) DEFAULT 0,
    valor_ir DECIMAL(15,2) DEFAULT 0,
    valor_csll DECIMAL(15,2) DEFAULT 0,
    valor_iss DECIMAL(15,2),
    aliquota_iss DECIMAL(5,2),
    valor_liquido DECIMAL(15,2),
    iss_retido BOOLEAN DEFAULT false,
    
    -- Prestador (dados da empresa no momento da emissão)
    prestador_cnpj VARCHAR(18),
    prestador_inscricao_municipal VARCHAR(20),
    prestador_razao_social VARCHAR(200),
    
    -- Tomador (cliente)
    tomador_cpf_cnpj VARCHAR(18),
    tomador_nome VARCHAR(200),
    tomador_email VARCHAR(200),
    tomador_telefone VARCHAR(20),
    tomador_cep VARCHAR(9),
    tomador_logradouro VARCHAR(200),
    tomador_numero VARCHAR(20),
    tomador_complemento VARCHAR(100),
    tomador_bairro VARCHAR(100),
    tomador_cidade VARCHAR(100),
    tomador_uf CHAR(2),
    tomador_codigo_municipio VARCHAR(7),
    
    -- Serviço
    codigo_servico VARCHAR(20),
    cnae VARCHAR(10),
    codigo_tributacao_nacional VARCHAR(20),
    discriminacao TEXT,
    codigo_municipio_incidencia VARCHAR(7),
    nome_municipio_incidencia VARCHAR(100),
    
    -- Regime Especial
    regime_especial_tributacao INTEGER,
    optante_simples_nacional BOOLEAN DEFAULT false,
    
    -- Controle
    status status_nfse DEFAULT 'pendente',
    ambiente VARCHAR(20) DEFAULT 'homologacao', -- 'homologacao' ou 'producao'
    xml_dps TEXT,
    xml_nfse TEXT,
    protocolo VARCHAR(50),
    mensagem_retorno TEXT,
    
    -- Substituição/Cancelamento
    motivo_cancelamento TEXT,
    nfse_substituida_id UUID REFERENCES nfse(id),
    
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_nfse_empresa ON nfse(empresa_id);
CREATE INDEX idx_nfse_os ON nfse(os_id);
CREATE INDEX idx_nfse_chave ON nfse(chave_acesso);
CREATE INDEX idx_nfse_status ON nfse(empresa_id, status);
CREATE INDEX idx_nfse_data ON nfse(empresa_id, data_emissao);

-- =====================================================
-- TABELA: EVENTOS NFS-e
-- =====================================================

CREATE TABLE nfse_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nfse_id UUID NOT NULL REFERENCES nfse(id) ON DELETE CASCADE,
    
    tipo_evento tipo_evento_nfse NOT NULL,
    numero_sequencial INTEGER DEFAULT 1,
    data_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Dados do evento
    descricao TEXT,
    codigo_cancelamento INTEGER,
    
    -- XML e resposta
    xml_pedido TEXT,
    xml_evento TEXT,
    protocolo VARCHAR(50),
    
    -- Controle
    processado BOOLEAN DEFAULT false,
    erro TEXT,
    
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_nfse_eventos_nfse ON nfse_eventos(nfse_id);

-- =====================================================
-- TABELA: PARÂMETROS MUNICIPAIS (Cache)
-- =====================================================

CREATE TABLE parametros_municipais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_municipio VARCHAR(7) UNIQUE NOT NULL,
    nome_municipio VARCHAR(200),
    uf CHAR(2),
    
    -- Convênio
    conveniado BOOLEAN DEFAULT false,
    data_adesao DATE,
    
    -- Alíquotas
    aliquota_minima DECIMAL(5,2),
    aliquota_maxima DECIMAL(5,2),
    
    -- Configurações
    permite_deducao BOOLEAN DEFAULT false,
    exige_inscricao_municipal BOOLEAN DEFAULT false,
    
    -- Dados JSON
    regimes_especiais JSONB,
    servicos JSONB,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Goiânia e Aparecida de Goiânia
INSERT INTO parametros_municipais (codigo_municipio, nome_municipio, uf, conveniado) VALUES
    ('5208707', 'Goiânia', 'GO', true),
    ('5201405', 'Aparecida de Goiânia', 'GO', true);

-- =====================================================
-- ADICIONAR CAMPOS NA TABELA EMPRESAS
-- =====================================================

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS codigo_municipio_ibge VARCHAR(7);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ambiente_nfse VARCHAR(20) DEFAULT 'homologacao';

-- Comentário: Para facilitar, podemos popular o código IBGE via trigger ou API de CEP

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfse_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas para NFS-e
CREATE POLICY "Ver nfse da empresa" ON nfse
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar nfse da empresa" ON nfse
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'financeiro'))
    );

-- Políticas para Eventos
CREATE POLICY "Ver eventos nfse da empresa" ON nfse_eventos
    FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Gerenciar eventos nfse" ON nfse_eventos
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'financeiro'))
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_nfse_updated_at 
    BEFORE UPDATE ON nfse 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- VIEW: NFS-e com dados completos
-- =====================================================

CREATE OR REPLACE VIEW vw_nfse_completa AS
SELECT 
    n.id,
    n.empresa_id,
    n.numero,
    n.serie,
    n.chave_acesso,
    n.data_emissao,
    n.valor_servicos,
    n.valor_iss,
    n.valor_liquido,
    n.status,
    n.tomador_nome,
    n.tomador_cpf_cnpj,
    n.discriminacao,
    os.numero as os_numero,
    c.nome as cliente_nome,
    v.placa as veiculo_placa
FROM nfse n
LEFT JOIN ordens_servico os ON n.os_id = os.id
LEFT JOIN clientes c ON os.cliente_id = c.id
LEFT JOIN veiculos v ON os.veiculo_id = v.id;
