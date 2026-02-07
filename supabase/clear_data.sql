-- Script para limpar dados fictícios do banco
-- ATENÇÃO: Isso vai apagar TODOS os dados das tabelas!

-- Desabilitar triggers temporariamente para evitar problemas com foreign keys
SET session_replication_role = 'replica';

-- Limpar dados das tabelas (em ordem para respeitar foreign keys)
-- Usando CASCADE para limpar automaticamente tabelas dependentes
TRUNCATE TABLE nfse CASCADE;
TRUNCATE TABLE nfe CASCADE;
TRUNCATE TABLE contas_receber CASCADE;
TRUNCATE TABLE contas_pagar CASCADE;
TRUNCATE TABLE ordens_servico CASCADE;
TRUNCATE TABLE orcamentos CASCADE;
TRUNCATE TABLE veiculos CASCADE;
TRUNCATE TABLE clientes CASCADE;
TRUNCATE TABLE produtos CASCADE;
TRUNCATE TABLE servicos CASCADE;

-- Limpar empresas (você pode ajustar o ID da empresa que deseja manter)
-- DELETE FROM empresas WHERE id != '00000000-0000-0000-0000-000000000001';

-- Nota: Usuários não foram removidos. Se quiser remover usuários específicos,
-- vá em Configurações > Usuários ou execute manualmente:
-- DELETE FROM usuarios WHERE email = 'email@exemplo.com';

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- Resetar sequences (contadores de número)
ALTER SEQUENCE IF EXISTS orcamentos_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ordens_servico_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS nfse_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS nfe_numero_seq RESTART WITH 1;

SELECT 'Dados fictícios removidos com sucesso!' as resultado;
