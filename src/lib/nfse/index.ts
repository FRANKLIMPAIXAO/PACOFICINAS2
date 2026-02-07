// =====================================================
// PAC OFICINAS - Módulo NFS-e
// =====================================================

export { NFSeService, criarNFSeService } from './nfse-service';
export { gerarXMLDPS, gerarIdDPS, validarDadosDPS, type DPSData } from './dps-builder';
export {
    NFSE_API_URLS,
    NFSE_ENDPOINTS,
    MUNICIPIOS_GO,
    CODIGOS_SERVICO_OFICINAS,
    REGIMES_ESPECIAIS,
    CODIGOS_CANCELAMENTO,
    VERSAO_LEIAUTE,
} from './constants';
