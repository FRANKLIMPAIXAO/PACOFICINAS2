-- =====================================================
-- MIGRAÇÃO: Sistema de Comissionamento de Mecânicos
-- =====================================================
-- Criação de tabelas para gerenciar comissões de mecânicos
-- baseadas em Ordens de Serviço
-- =====================================================

-- =====================================================
-- ENUM: Status de Comissão
-- =====================================================

CREATE TYPE status_comissao AS ENUM ('pendente', 'paga', 'cancelada');

-- =====================================================
-- TABELA: Configuração de Comissões
-- =====================================================

CREATE TABLE comissoes_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    mecanico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Tipo de cálculo
    tipo_calculo VARCHAR(20) DEFAULT 'percentual_servicos',
    -- Opções: 'percentual_servicos', 'percentual_total', 'valor_fixo', 'misto'
    
    -- Valores de comissão
    percentual_servicos DECIMAL(5,2) DEFAULT 0, -- Ex: 10.00 = 10%
    percentual_total DECIMAL(5,2) DEFAULT 0,    -- Ex: 5.00 = 5%
    valor_fixo DECIMAL(15,2) DEFAULT 0,         -- Ex: 50.00 = R$ 50,00
    
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Um mecânico só pode ter uma configuração por empresa
    UNIQUE(empresa_id, mecanico_id)
);

CREATE INDEX idx_comissoes_config_empresa ON comissoes_config(empresa_id);
CREATE INDEX idx_comissoes_config_mecanico ON comissoes_config(mecanico_id);

-- =====================================================
-- TABELA: Comissões (Registro de cada comissão)
-- =====================================================

CREATE TABLE comissoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    mecanico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Valores base para cálculo (snapshot no momento da criação)
    valor_servicos DECIMAL(15,2) DEFAULT 0,
    valor_total_os DECIMAL(15,2) DEFAULT 0,
    
    -- Comissão calculada
    tipo_calculo VARCHAR(20),
    percentual_aplicado DECIMAL(5,2),
    valor_fixo_aplicado DECIMAL(15,2),
    valor_comissao DECIMAL(15,2) NOT NULL,
    
    -- Controle de pagamento
    status status_comissao DEFAULT 'pendente',
    data_pagamento DATE,
    observacoes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Uma OS só pode ter uma comissão por mecânico
    UNIQUE(os_id, mecanico_id)
);

CREATE INDEX idx_comissoes_empresa ON comissoes(empresa_id);
CREATE INDEX idx_comissoes_mecanico ON comissoes(mecanico_id);
CREATE INDEX idx_comissoes_os ON comissoes(os_id);
CREATE INDEX idx_comissoes_status ON comissoes(empresa_id, status);
CREATE INDEX idx_comissoes_data_pagamento ON comissoes(empresa_id, data_pagamento);

-- =====================================================
-- TRIGGER: Atualizar updated_at
-- =====================================================

CREATE TRIGGER update_comissoes_config_updated_at 
    BEFORE UPDATE ON comissoes_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comissoes_updated_at 
    BEFORE UPDATE ON comissoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE comissoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: comissoes_config
-- =====================================================

-- Ver configurações da empresa
CREATE POLICY "Ver config comissoes da empresa" ON comissoes_config
    FOR SELECT USING (empresa_id = get_user_empresa_id());

-- Admin pode gerenciar configurações
CREATE POLICY "Admin pode gerenciar config comissoes" ON comissoes_config
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'admin')
    );

-- =====================================================
-- POLICIES: comissoes
-- =====================================================

-- Ver comissões da empresa OU suas próprias comissões (mecânico)
CREATE POLICY "Ver comissoes da empresa ou proprias" ON comissoes
    FOR SELECT USING (
        empresa_id = get_user_empresa_id() OR
        mecanico_id = auth.uid()
    );

-- Admin e Financeiro podem criar comissões
CREATE POLICY "Admin pode criar comissoes" ON comissoes
    FOR INSERT WITH CHECK (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'financeiro'))
    );

-- Admin e Financeiro podem atualizar comissões
CREATE POLICY "Admin pode atualizar comissoes" ON comissoes
    FOR UPDATE USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'financeiro'))
    );

-- Admin pode deletar comissões
CREATE POLICY "Admin pode deletar comissoes" ON comissoes
    FOR DELETE USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'admin')
    );

-- =====================================================
-- FUNÇÃO: Calcular Comissão
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_comissao(
    p_mecanico_id UUID,
    p_valor_servicos DECIMAL,
    p_valor_total DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_config RECORD;
    v_comissao DECIMAL := 0;
BEGIN
    -- Buscar configuração do mecânico
    SELECT * INTO v_config
    FROM comissoes_config
    WHERE mecanico_id = p_mecanico_id
    AND ativo = true
    LIMIT 1;
    
    -- Se não tem configuração, retorna 0
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calcular baseado no tipo
    CASE v_config.tipo_calculo
        WHEN 'percentual_servicos' THEN
            v_comissao := p_valor_servicos * (v_config.percentual_servicos / 100);
        
        WHEN 'percentual_total' THEN
            v_comissao := p_valor_total * (v_config.percentual_total / 100);
        
        WHEN 'valor_fixo' THEN
            v_comissao := v_config.valor_fixo;
        
        WHEN 'misto' THEN
            v_comissao := (p_valor_servicos * (v_config.percentual_servicos / 100)) + v_config.valor_fixo;
        
        ELSE
            v_comissao := 0;
    END CASE;
    
    RETURN COALESCE(v_comissao, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: Resumo de Comissões por Mecânico
-- =====================================================

CREATE OR REPLACE VIEW vw_comissoes_mecanico AS
SELECT 
    c.mecanico_id,
    u.nome as mecanico_nome,
    c.empresa_id,
    c.status,
    COUNT(*) as quantidade_os,
    SUM(c.valor_comissao) as total_comissao,
    MIN(c.created_at) as primeira_comissao,
    MAX(c.created_at) as ultima_comissao
FROM comissoes c
LEFT JOIN usuarios u ON c.mecanico_id = u.id
GROUP BY c.mecanico_id, u.nome, c.empresa_id, c.status;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Migração de comissões concluída com sucesso!' as resultado;
SELECT 'Tabelas criadas: comissoes_config, comissoes' as info;
SELECT 'Função criada: calcular_comissao()' as info2;
