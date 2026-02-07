-- Script para configurar o Supabase para testes
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard/project/gzscndbxfpymjpbinxmx/sql/new

-- 1. Criar empresa de teste
INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, regime_tributario, cidade, uf, ativo)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Oficina Teste LTDA',
    'Oficina Teste',
    '00.000.000/0001-00',
    'simples_nacional',
    'São Paulo',
    'SP',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Desabilitar RLS temporariamente para testes (REMOVER EM PRODUÇÃO!)
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE servicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens DISABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico DISABLE ROW LEVEL SECURITY;
ALTER TABLE os_itens DISABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar DISABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 'Empresa criada e RLS desabilitado para testes!' as status;
SELECT * FROM empresas;
