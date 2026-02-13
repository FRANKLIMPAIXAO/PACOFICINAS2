-- =====================================================
-- MIGRAÇÃO: Corrigir Falta de RLS em parametros_municipais
-- =====================================================
-- Esta tabela armazena dados públicos/comuns (cidades, alíquotas)
-- mas precisa de RLS para evitar escrita não autorizada.
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE parametros_municipais ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Leitura Pública (Authenticated + Anon se necessário, ou só Authenticated)
-- Como são parâmetros de sistema, qualquer usuário logado deve poder ler.
CREATE POLICY "Todos podem ver parametros_municipais" ON parametros_municipais
    FOR SELECT USING (true); 

-- 3. Policy: Apenas Admin pode gerenciar (Insert/Update/Delete)
-- Restringir escrita apenas para administradores do sistema (se houver role superadmin)
-- Ou administradores de qualquer empresa (para manter o cache atualizado?)
-- Geralmente parametros municipais sao mantidos pelo sistema/admin global.
-- Vamos assumir que apenas usuarios com perfil 'admin' podem alterar.

CREATE POLICY "Admin pode gerenciar parametros_municipais" ON parametros_municipais
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'admin')
    );

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'RLS habilitado em parametros_municipais' as resultado;
