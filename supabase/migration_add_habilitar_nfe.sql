-- Adiciona campo para habilitar emissão de NFE
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS habilitar_nfe BOOLEAN DEFAULT false;

-- Atualizar view de empresas se necessário (mas não temos view de empresas no schema.sql)
