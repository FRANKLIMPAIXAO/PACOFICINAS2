// =====================================================
// PAC OFICINAS - Tipos TypeScript
// =====================================================

// Enums
export type PerfilUsuario = 'admin' | 'atendente' | 'mecanico' | 'financeiro' | 'contador';
export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | 'mei';
export type StatusOrcamento = 'aberto' | 'aprovado' | 'recusado' | 'expirado';
export type StatusOS = 'aberta' | 'em_execucao' | 'aguardando_peca' | 'finalizada' | 'faturada' | 'cancelada';
export type StatusConta = 'aberto' | 'pago' | 'atrasado' | 'cancelado';
export type TipoItem = 'produto' | 'servico';
export type OrigemConta = 'os' | 'manual' | 'xml';

// NFS-e Enums
export type StatusNFSe = 'pendente' | 'processando' | 'autorizada' | 'cancelada' | 'substituida' | 'erro';
export type TipoEventoNFSe = 'cancelamento' | 'substituicao' | 'manifestacao_confirmacao' | 'manifestacao_rejeicao';
export type AmbienteNFSe = 'homologacao' | 'producao';

// =====================================================
// Entidades Base
// =====================================================

export interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  regime_tributario: RegimeTributario;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
  certificado_validade: string | null;
  codigo_municipio_ibge: string | null;
  ambiente_nfse: AmbienteNFSe;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: PerfilUsuario;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  telefone2: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Veiculo {
  id: string;
  empresa_id: string;
  cliente_id: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  ano_fabricacao: number | null;
  ano_modelo: number | null;
  cor: string | null;
  chassi: string | null;
  renavam: string | null;
  km_atual: number;
  combustivel: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relações
  cliente?: Cliente;
}

export interface Produto {
  id: string;
  empresa_id: string;
  codigo: string | null;
  codigo_barras: string | null;
  descricao: string;
  unidade: string;
  ncm: string | null;
  cest: string | null;
  cfop_dentro: string;
  cfop_fora: string;
  cst: string | null;
  origem: string;
  preco_custo: number;
  preco_venda: number;
  margem_lucro: number;
  estoque_atual: number;
  estoque_minimo: number;
  localizacao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Servico {
  id: string;
  empresa_id: string;
  codigo: string | null;
  descricao: string;
  codigo_servico: string | null;
  aliquota_iss: number;
  preco: number;
  tempo_estimado: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Orçamentos e OS
// =====================================================

export interface Orcamento {
  id: string;
  empresa_id: string;
  numero: number;
  cliente_id: string | null;
  veiculo_id: string | null;
  data_orcamento: string;
  validade_dias: number;
  valor_produtos: number;
  valor_servicos: number;
  valor_desconto: number;
  valor_total: number;
  status: StatusOrcamento;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relações
  cliente?: Cliente;
  veiculo?: Veiculo;
  itens?: OrcamentoItem[];
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  tipo: TipoItem;
  produto_id: string | null;
  servico_id: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_desconto: number;
  valor_total: number;
  created_at: string;
}

export interface OrdemServico {
  id: string;
  empresa_id: string;
  numero: number;
  orcamento_id: string | null;
  cliente_id: string | null;
  veiculo_id: string | null;
  data_abertura: string;
  data_previsao: string | null;
  data_conclusao: string | null;
  km_entrada: number | null;
  valor_produtos: number;
  valor_servicos: number;
  valor_desconto: number;
  valor_total: number;
  status: StatusOS;
  mecanico_id: string | null;
  diagnostico: string | null;
  observacoes: string | null;
  observacoes_internas: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relações
  cliente?: Cliente;
  veiculo?: Veiculo;
  mecanico?: Usuario;
  itens?: OSItem[];
}

export interface OSItem {
  id: string;
  os_id: string;
  tipo: TipoItem;
  produto_id: string | null;
  servico_id: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_desconto: number;
  valor_total: number;
  baixou_estoque: boolean;
  created_at: string;
}

// =====================================================
// Financeiro
// =====================================================

export interface ContaPagar {
  id: string;
  empresa_id: string;
  descricao: string;
  fornecedor: string | null;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento: string | null;
  valor_pago: number | null;
  status: StatusConta;
  origem: OrigemConta;
  xml_import_id: string | null;
  categoria: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContaReceber {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  os_id: string | null;
  descricao: string;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  data_recebimento: string | null;
  valor_recebido: number | null;
  status: StatusConta;
  origem: OrigemConta;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Relações
  cliente?: Cliente;
}

// =====================================================
// XML Import
// =====================================================

export interface XMLImport {
  id: string;
  empresa_id: string;
  chave_nfe: string;
  numero_nfe: string | null;
  serie: string | null;
  data_emissao: string | null;
  fornecedor_cnpj: string | null;
  fornecedor_nome: string | null;
  valor_total: number | null;
  produtos_importados: number;
  processado: boolean;
  erro: string | null;
  created_at: string;
}

// =====================================================
// Estoque
// =====================================================

export interface EstoqueMovimento {
  id: string;
  empresa_id: string;
  produto_id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  quantidade_anterior: number | null;
  quantidade_atual: number | null;
  custo_unitario: number | null;
  referencia_tipo: string | null;
  referencia_id: string | null;
  observacao: string | null;
  created_by: string | null;
  created_at: string;
}

// =====================================================
// Views e Relatórios
// =====================================================

export interface EstoqueBaixo {
  id: string;
  empresa_id: string;
  codigo: string | null;
  descricao: string;
  estoque_atual: number;
  estoque_minimo: number;
  quantidade_repor: number;
}

export interface OSAberta {
  id: string;
  empresa_id: string;
  numero: number;
  data_abertura: string;
  status: StatusOS;
  valor_total: number;
  cliente_nome: string | null;
  veiculo_placa: string | null;
  veiculo_descricao: string | null;
  mecanico_nome: string | null;
}

export interface ContaVencida {
  tipo: 'pagar' | 'receber';
  id: string;
  empresa_id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  dias_atraso: number;
}

// =====================================================
// Dashboard Stats
// =====================================================

export interface DashboardStats {
  faturamentoMes: number;
  osAbertas: number;
  contasVencidas: number;
  estoqueBaixo: number;
}

// =====================================================
// NFS-e
// =====================================================

export interface NFSe {
  id: string;
  empresa_id: string;
  os_id: string | null;
  chave_acesso: string | null;
  numero: number | null;
  serie: string | null;
  codigo_verificacao: string | null;
  id_dps: string | null;
  data_emissao: string | null;
  competencia: string | null;
  valor_servicos: number;
  valor_deducoes: number;
  valor_pis: number;
  valor_cofins: number;
  valor_inss: number;
  valor_ir: number;
  valor_csll: number;
  valor_iss: number | null;
  aliquota_iss: number | null;
  valor_liquido: number | null;
  iss_retido: boolean;
  prestador_cnpj: string | null;
  prestador_inscricao_municipal: string | null;
  prestador_razao_social: string | null;
  tomador_cpf_cnpj: string | null;
  tomador_nome: string | null;
  tomador_email: string | null;
  tomador_telefone: string | null;
  tomador_cep: string | null;
  tomador_logradouro: string | null;
  tomador_numero: string | null;
  tomador_complemento: string | null;
  tomador_bairro: string | null;
  tomador_cidade: string | null;
  tomador_uf: string | null;
  tomador_codigo_municipio: string | null;
  codigo_servico: string | null;
  cnae: string | null;
  codigo_tributacao_nacional: string | null;
  discriminacao: string | null;
  codigo_municipio_incidencia: string | null;
  nome_municipio_incidencia: string | null;
  regime_especial_tributacao: number | null;
  optante_simples_nacional: boolean;
  status: StatusNFSe;
  ambiente: AmbienteNFSe;
  xml_dps: string | null;
  xml_nfse: string | null;
  protocolo: string | null;
  mensagem_retorno: string | null;
  motivo_cancelamento: string | null;
  nfse_substituida_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relações
  os?: OrdemServico;
}

export interface NFSeEvento {
  id: string;
  empresa_id: string;
  nfse_id: string;
  tipo_evento: TipoEventoNFSe;
  numero_sequencial: number;
  data_evento: string;
  descricao: string | null;
  codigo_cancelamento: number | null;
  xml_pedido: string | null;
  xml_evento: string | null;
  protocolo: string | null;
  processado: boolean;
  erro: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ParametrosMunicipais {
  id: string;
  codigo_municipio: string;
  nome_municipio: string;
  uf: string;
  conveniado: boolean;
  data_adesao: string | null;
  aliquota_minima: number | null;
  aliquota_maxima: number | null;
  permite_deducao: boolean;
  exige_inscricao_municipal: boolean;
  regimes_especiais: object | null;
  servicos: object | null;
  updated_at: string;
}

export interface NFSeListItem {
  id: string;
  numero: number | null;
  serie: string | null;
  chave_acesso: string | null;
  data_emissao: string | null;
  valor_servicos: number;
  valor_iss: number | null;
  valor_liquido: number | null;
  status: StatusNFSe;
  tomador_nome: string | null;
  tomador_cpf_cnpj: string | null;
  os_numero: number | null;
  cliente_nome: string | null;
  veiculo_placa: string | null;
}
