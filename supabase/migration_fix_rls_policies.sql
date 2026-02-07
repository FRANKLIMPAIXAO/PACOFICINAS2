-- =====================================================
-- MIGRAÇÃO: Refatorar RLS Policies para Usar Tabela usuarios
-- =====================================================
-- Esta migração corrige a vulnerabilidade crítica de segurança
-- onde as RLS policies dependem de user_metadata (mutável)
-- ao invés da tabela usuarios (imutável e confiável)
-- =====================================================

-- Remover função antiga que usa user_metadata
DROP FUNCTION IF EXISTS get_user_empresa_id();

-- Criar nova função que busca empresa_id da tabela usuarios
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT empresa_id 
        FROM usuarios 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RECRIAR TODAS AS POLICIES COM A NOVA FUNÇÃO
-- =====================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Usuarios podem ver sua empresa" ON empresas;
DROP POLICY IF EXISTS "Admin pode atualizar empresa" ON empresas;
DROP POLICY IF EXISTS "Usuarios da mesma empresa podem ver" ON usuarios;
DROP POLICY IF EXISTS "Admin pode gerenciar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Ver clientes da empresa" ON clientes;
DROP POLICY IF EXISTS "Gerenciar clientes da empresa" ON clientes;
DROP POLICY IF EXISTS "Ver veiculos da empresa" ON veiculos;
DROP POLICY IF EXISTS "Gerenciar veiculos da empresa" ON veiculos;
DROP POLICY IF EXISTS "Ver produtos da empresa" ON produtos;
DROP POLICY IF EXISTS "Gerenciar produtos da empresa" ON produtos;
DROP POLICY IF EXISTS "Ver servicos da empresa" ON servicos;
DROP POLICY IF EXISTS "Gerenciar servicos da empresa" ON servicos;
DROP POLICY IF EXISTS "Ver orcamentos da empresa" ON orcamentos;
DROP POLICY IF EXISTS "Gerenciar orcamentos da empresa" ON orcamentos;
DROP POLICY IF EXISTS "Ver itens de orcamento" ON orcamento_itens;
DROP POLICY IF EXISTS "Gerenciar itens de orcamento" ON orcamento_itens;
DROP POLICY IF EXISTS "Ver OS da empresa" ON ordens_servico;
DROP POLICY IF EXISTS "Gerenciar OS da empresa" ON ordens_servico;
DROP POLICY IF EXISTS "Ver itens de OS" ON os_itens;
DROP POLICY IF EXISTS "Gerenciar itens de OS" ON os_itens;
DROP POLICY IF EXISTS "Ver contas a pagar da empresa" ON contas_pagar;
DROP POLICY IF EXISTS "Gerenciar contas a pagar" ON contas_pagar;
DROP POLICY IF EXISTS "Ver contas a receber da empresa" ON contas_receber;
DROP POLICY IF EXISTS "Gerenciar contas a receber" ON contas_receber;
DROP POLICY IF EXISTS "Ver imports da empresa" ON xml_imports;
DROP POLICY IF EXISTS "Gerenciar imports da empresa" ON xml_imports;
DROP POLICY IF EXISTS "Ver movimentos da empresa" ON estoque_movimentos;
DROP POLICY IF EXISTS "Criar movimentos da empresa" ON estoque_movimentos;

-- =====================================================
-- POLÍTICAS PARA EMPRESAS
-- =====================================================

CREATE POLICY "Usuarios podem ver sua empresa" ON empresas
    FOR SELECT USING (
        id = get_user_empresa_id()
    );

CREATE POLICY "Admin pode atualizar empresa" ON empresas
    FOR UPDATE USING (
        id = get_user_empresa_id() AND 
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'admin')
    );

-- =====================================================
-- POLÍTICAS PARA USUARIOS
-- =====================================================

CREATE POLICY "Usuarios da mesma empresa podem ver" ON usuarios
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Admin pode gerenciar usuarios" ON usuarios
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND 
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'admin')
    );

-- =====================================================
-- POLÍTICAS PARA CLIENTES
-- =====================================================

CREATE POLICY "Ver clientes da empresa" ON clientes
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar clientes da empresa" ON clientes
    FOR ALL USING (
        empresa_id = get_user_empresa_id()
    );

-- =====================================================
-- POLÍTICAS PARA VEICULOS
-- =====================================================

CREATE POLICY "Ver veiculos da empresa" ON veiculos
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar veiculos da empresa" ON veiculos
    FOR ALL USING (
        empresa_id = get_user_empresa_id()
    );

-- =====================================================
-- POLÍTICAS PARA PRODUTOS
-- =====================================================

CREATE POLICY "Ver produtos da empresa" ON produtos
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar produtos da empresa" ON produtos
    FOR ALL USING (
        empresa_id = get_user_empresa_id()
    );

-- =====================================================
-- POLÍTICAS PARA SERVICOS
-- =====================================================

CREATE POLICY "Ver servicos da empresa" ON servicos
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar servicos da empresa" ON servicos
    FOR ALL USING (
        empresa_id = get_user_empresa_id()
    );

-- =====================================================
-- POLÍTICAS PARA ORCAMENTOS
-- =====================================================

CREATE POLICY "Ver orcamentos da empresa" ON orcamentos
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar orcamentos da empresa" ON orcamentos
    FOR ALL USING (
        empresa_id = get_user_empresa_id()
    );

-- =====================================================
-- POLÍTICAS PARA ORCAMENTO_ITENS
-- =====================================================

CREATE POLICY "Ver itens de orcamento" ON orcamento_itens
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orcamentos WHERE id = orcamento_itens.orcamento_id AND empresa_id = get_user_empresa_id())
    );

CREATE POLICY "Gerenciar itens de orcamento" ON orcamento_itens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM orcamentos WHERE id = orcamento_itens.orcamento_id AND empresa_id = get_user_empresa_id())
    );

-- =====================================================
-- POLÍTICAS PARA ORDENS_SERVICO
-- =====================================================

CREATE POLICY "Ver OS da empresa" ON ordens_servico
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar OS da empresa" ON ordens_servico
    FOR ALL USING (
        empresa_id = get_user_empresa_id()
    );

-- =====================================================
-- POLÍTICAS PARA OS_ITENS
-- =====================================================

CREATE POLICY "Ver itens de OS" ON os_itens
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM ordens_servico WHERE id = os_itens.os_id AND empresa_id = get_user_empresa_id())
    );

CREATE POLICY "Gerenciar itens de OS" ON os_itens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM ordens_servico WHERE id = os_itens.os_id AND empresa_id = get_user_empresa_id())
    );

-- =====================================================
-- POLÍTICAS PARA CONTAS_PAGAR
-- =====================================================

CREATE POLICY "Ver contas a pagar da empresa" ON contas_pagar
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar contas a pagar" ON contas_pagar
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'financeiro'))
    );

-- =====================================================
-- POLÍTICAS PARA CONTAS_RECEBER
-- =====================================================

CREATE POLICY "Ver contas a receber da empresa" ON contas_receber
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar contas a receber" ON contas_receber
    FOR ALL USING (
        empresa_id = get_user_empresa_id() AND
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'financeiro'))
    );

-- =====================================================
-- POLÍTICAS PARA XML_IMPORTS
-- =====================================================

CREATE POLICY "Ver imports da empresa" ON xml_imports
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Gerenciar imports da empresa" ON xml_imports
    FOR ALL USING (
        empresa_id = get_user_empresa_id()
    );

-- =====================================================
-- POLÍTICAS PARA ESTOQUE_MOVIMENTOS
-- =====================================================

CREATE POLICY "Ver movimentos da empresa" ON estoque_movimentos
    FOR SELECT USING (
        empresa_id = get_user_empresa_id()
    );

CREATE POLICY "Criar movimentos da empresa" ON estoque_movimentos
    FOR INSERT WITH CHECK (
        empresa_id = get_user_empresa_id()
    );

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Migração concluída com sucesso!' as resultado;
SELECT 'RLS Policies agora usam a tabela usuarios ao invés de user_metadata' as info;
