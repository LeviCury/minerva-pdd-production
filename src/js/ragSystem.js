/**
 * MINERVA PDD GENERATOR - RAG System Module v2.0
 * Sistema de Retrieval Augmented Generation para PDDs
 * 
 * Repositório de exemplos com persistência em localStorage
 */

const RAGSystem = (function() {
    'use strict';

    const STORAGE_KEY = 'minerva_rag_examples';

    // ═══════════════════════════════════════════════════════════════════════════
    // BANCO DE EXEMPLOS PADRÃO (Built-in)
    // ═══════════════════════════════════════════════════════════════════════════

    const DEFAULT_EXAMPLES = [
        {
            id: 'conciliacao_bancaria',
            keywords: ['banco', 'bancário', 'conciliação', 'extrato', 'financeiro', 'tesouraria', 'itau', 'bradesco', 'santander', 'reconciliação'],
            category: 'FINANCEIRO',
            nome: 'Automação de Conciliação Bancária',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Automação de Conciliação Bancária",
                    objetivo: "Automatizar o processo diário de conciliação entre extratos bancários e lançamentos contábeis no SAP, eliminando o trabalho manual e reduzindo erros de reconciliação.",
                    beneficios: {
                        tangiveis: ["Redução de 4 horas diárias de trabalho manual", "Eliminação de 95% dos erros de conciliação", "Processamento de 500+ transações em 15 minutos"],
                        intangiveis: ["Maior confiabilidade nos dados financeiros", "Liberação da equipe para análises estratégicas"]
                    }
                },
                rpas: [{
                    nome: "RPA Conciliação Bancária",
                    trigger: { tipo: "AGENDAMENTO", frequencia: "Diária às 7h", volume_estimado: "500 transações/dia" },
                    fluxo_execucao: [
                        "Acessar portal do banco via credenciais seguras",
                        "Baixar extrato do dia anterior em formato OFX/CSV",
                        "Parsear arquivo e extrair transações",
                        "Para cada transação, buscar correspondência no SAP (FBL3N)",
                        "Aplicar regras de matching (valor, data, referência)",
                        "Marcar itens conciliados no SAP",
                        "Gerar relatório de pendências",
                        "Enviar email com resumo para equipe"
                    ],
                    excecoes: [
                        { cenario: "Portal bancário indisponível", tratamento: "Retry em 30min, máx 3 tentativas" },
                        { cenario: "Transação sem correspondência", tratamento: "Registrar em planilha de pendências" },
                        { cenario: "Diferença de valor < R$0,50", tratamento: "Conciliar automaticamente" }
                    ]
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Tolerância de Valor", descricao: "Diferenças de até R$ 0,50 são aceitas", logica: "SE ABS(valor_banco - valor_sap) <= 0.50 ENTÃO conciliar_automatico()" },
                    { codigo: "RN-002", tipo: "TIME", titulo: "Janela de Conciliação", descricao: "Buscar em D-5 a D+2", logica: "data_busca BETWEEN (data_transacao - 5) AND (data_transacao + 2)" }
                ]
            }
        },
        {
            id: 'entrada_nfe',
            keywords: ['nota fiscal', 'nfe', 'nf-e', 'entrada', 'xml', 'danfe', 'fiscal', 'tributário', 'sefaz', 'miro'],
            category: 'FISCAL',
            nome: 'Automação de Entrada de NF-e',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Automação de Entrada de NF-e",
                    objetivo: "Automatizar o download, validação e lançamento de Notas Fiscais Eletrônicas de entrada no SAP.",
                    beneficios: {
                        tangiveis: ["Redução de 6 horas diárias", "Zero atrasos fiscais", "Eliminação de multas"],
                        intangiveis: ["Conformidade fiscal garantida", "Rastreabilidade completa"]
                    }
                },
                rpas: [{
                    nome: "RPA Entrada NF-e",
                    trigger: { tipo: "AGENDAMENTO", frequencia: "A cada 2 horas", volume_estimado: "200 NF-e/dia" },
                    fluxo_execucao: [
                        "Acessar SEFAZ via certificado digital",
                        "Consultar NF-e destinadas ao CNPJ",
                        "Baixar XMLs das notas pendentes",
                        "Validar estrutura e assinatura do XML",
                        "Extrair dados: fornecedor, itens, valores, impostos",
                        "Validar fornecedor no cadastro SAP",
                        "Verificar pedido de compra vinculado",
                        "Criar MIRO no SAP com dados da NF-e",
                        "Manifestar ciência na SEFAZ",
                        "Arquivar XML em pasta estruturada"
                    ],
                    excecoes: [
                        { cenario: "Fornecedor não cadastrado", tratamento: "Enviar para fila de cadastro" },
                        { cenario: "Divergência de valor > 5%", tratamento: "Encaminhar para aprovação manual" }
                    ]
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Validação de CNPJ", descricao: "Fornecedor deve estar ativo", logica: "SE fornecedor.status != 'ATIVO' ENTÃO rejeitar_nfe()" },
                    { codigo: "RN-002", tipo: "TIME", titulo: "Prazo de Manifestação", descricao: "Manifestar em até 48h", logica: "SE (agora - data_emissao) > 48h ENTÃO prioridade = 'URGENTE'" }
                ]
            }
        },
        {
            id: 'folha_pagamento',
            keywords: ['folha', 'pagamento', 'rh', 'recursos humanos', 'salário', 'holerite', 'benefícios', 'ponto', 'frequência', 'fopag'],
            category: 'RH',
            nome: 'Automação de Processamento de Folha',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Automação de Processamento de Folha",
                    objetivo: "Automatizar coleta de dados variáveis, cálculo de benefícios e geração de arquivos bancários.",
                    beneficios: {
                        tangiveis: ["Redução de 3 dias no fechamento", "Zero erros de digitação", "5.000 colaboradores em 2 horas"],
                        intangiveis: ["Maior satisfação dos colaboradores", "Conformidade trabalhista"]
                    }
                },
                rpas: [{
                    nome: "RPA Folha de Pagamento",
                    trigger: { tipo: "MANUAL", frequencia: "Mensal (dia 20)", volume_estimado: "5.000 colaboradores" },
                    fluxo_execucao: [
                        "Coletar marcações de ponto",
                        "Calcular horas extras, faltas e atrasos",
                        "Buscar eventos variáveis",
                        "Importar dados no sistema de folha",
                        "Executar cálculo",
                        "Gerar relatório de conferência",
                        "Gerar arquivo CNAB",
                        "Enviar para banco",
                        "Gerar holerites PDF",
                        "Distribuir por email"
                    ]
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "CALC", titulo: "Hora Extra", descricao: "HE 50% dias úteis, HE 100% domingos", logica: "SE dia IN (DOM, FERIADO) ENTÃO fator = 2.0 SENÃO fator = 1.5" },
                    { codigo: "RN-002", tipo: "REST", titulo: "Limite de Desconto", descricao: "Máx 30% do líquido", logica: "SE total_descontos > (salario_liquido * 0.30) ENTÃO ajustar_parcelas()" }
                ]
            }
        },
        {
            id: 'pedido_compra',
            keywords: ['compra', 'pedido', 'requisição', 'fornecedor', 'cotação', 'procurement', 'suprimentos', 'mm', 'me21n'],
            category: 'COMPRAS',
            nome: 'Automação de Pedidos de Compra',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Automação de Pedidos de Compra",
                    objetivo: "Automatizar criação de pedidos a partir de requisições aprovadas.",
                    beneficios: {
                        tangiveis: ["Redução de 2 dias no ciclo", "Economia de 5% via cotação automática"],
                        intangiveis: ["Padronização do processo", "Melhor relacionamento com fornecedores"]
                    }
                },
                rpas: [{
                    nome: "RPA Pedido de Compra",
                    trigger: { tipo: "EVENTO", frequencia: "Ao aprovar requisição", volume_estimado: "50 requisições/dia" },
                    fluxo_execucao: [
                        "Monitorar requisições aprovadas",
                        "Identificar fornecedores homologados",
                        "Enviar solicitação de cotação",
                        "Aguardar respostas (timeout 24h)",
                        "Comparar cotações",
                        "Selecionar menor preço",
                        "Criar pedido ME21N",
                        "Enviar para fornecedor"
                    ]
                }]
            }
        },
        {
            id: 'relatorio_gerencial',
            keywords: ['relatório', 'report', 'dashboard', 'bi', 'indicador', 'kpi', 'gestão', 'gerencial', 'consolidação'],
            category: 'GESTAO',
            nome: 'Automação de Relatórios Gerenciais',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Automação de Relatórios Gerenciais",
                    objetivo: "Automatizar geração e distribuição de relatórios diários/semanais.",
                    beneficios: {
                        tangiveis: ["Economia de 10 horas semanais", "Dados disponíveis às 7h"],
                        intangiveis: ["Decisões baseadas em dados atualizados", "Padronização de métricas"]
                    }
                },
                rpas: [{
                    nome: "RPA Relatórios",
                    trigger: { tipo: "AGENDAMENTO", frequencia: "Diária às 6h", volume_estimado: "15 relatórios/dia" },
                    fluxo_execucao: [
                        "Conectar às fontes de dados",
                        "Extrair dados conforme queries",
                        "Consolidar em base temporária",
                        "Calcular KPIs",
                        "Gerar relatórios Excel/PDF",
                        "Publicar no SharePoint",
                        "Enviar email para gestores"
                    ]
                }]
            }
        },
        // ═══════════════════════════════════════════════════════════════════════════
        // EXEMPLOS MINERVA S.A. - PDDs REAIS APROVADOS
        // ═══════════════════════════════════════════════════════════════════════════
        {
            id: 'faturamento_outras_saidas_to_go_mt',
            keywords: ['faturamento', 'nota fiscal', 'couro verde', 'sap', 'jira', 'sefaz', 'logistica', 'remessa', 'industrializacao', 'balancao', 'xml', 'pdf', 'dcpoa', 'zsd007', 'va01', 'vl01n', 'vf01', 'vf03', 'picking', 'transportador', 'outras saidas'],
            category: 'FISCAL',
            nome: 'Faturamento Outras Saídas - TO GO MT (Couro Verde)',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Faturamento Outras Saídas – TO GO MT",
                    objetivo: "Monitorar o recebimento de solicitações de emissão de notas fiscais de couro verde via JIRA, realizar o faturamento completo no SAP (ZSD007B, VA01, VL01N, VF01, ZSD007), baixar PDF/XML das notas via API, validar dados, anexar documentos no JIRA e gerar solicitação de DCPOA.",
                    justificativa: "Automatizar processo manual de faturamento de notas fiscais de couro verde para os estados TO, GO e MT, eliminando retrabalho e garantindo rastreabilidade completa via banco de dados.",
                    beneficios: {
                        tangiveis: ["Processamento contínuo 24h, todos os dias da semana", "Eliminação de erros de digitação no SAP", "Rastreabilidade completa via banco de dados", "Redução do tempo de emissão de notas fiscais"],
                        intangiveis: ["Padronização do processo de faturamento", "Controle e auditoria de todas as operações", "Liberação da equipe de logística para atividades estratégicas"]
                    },
                    sistemas_envolvidos: ["SAP ERP", "JIRA", "DUX", "API Balanção", "API SEFAZ", "Banco de Dados SQL Server", "E-mail Outlook"],
                    areas_envolvidas: ["Logística", "TI", "Fiscal"]
                },
                rpas: [{
                    nome: "RPA Faturamento Outras Saídas - Couro Verde",
                    descricao: "Robô responsável por processar solicitações de faturamento de couro verde do JIRA, executar rotinas SAP para geração de notas fiscais, validar dados, baixar documentos e atualizar status.",
                    trigger: { 
                        tipo: "AGENDAMENTO", 
                        frequencia: "Diário, contínuo 24h, todos os dias inclusive feriados", 
                        volume_estimado: "Variável conforme demanda de cards no JIRA" 
                    },
                    entrada: {
                        origem: "JIRA (cards pendentes) + API Balanção",
                        dados: ["Número do JIRA", "Código empresa/estabelecimento", "Pedido mãe", "Peso líquido", "Quantidade de peças", "Número da carga", "Transportador", "Placa", "UF"]
                    },
                    saida: {
                        destino: "SAP + JIRA + Banco de Dados + E-mail",
                        dados: ["Notas fiscais geradas (PDF/XML)", "Registros de controle", "Relatório de processamento"]
                    },
                    sistemas_utilizados: ["SAP ERP (ZSD007B, VA01, VL01N, VF01, VF03, ZSD007)", "JIRA", "DUX", "API Balanção", "Banco de Dados SQL Server", "Outlook"],
                    fluxo_execucao: [
                        "Recuperar parâmetros do Tenant (credenciais, e-mails, caminhos)",
                        "Registrar início na API de monitoramento",
                        "Acessar JIRA e ler primeiro card pendente da fila",
                        "Validar status do card (Pendente, Faturado1, Faturado2, DCPOA)",
                        "Validar origem do card (Palmeiras de Goiás, etc. - estados TO, GO, MT)",
                        "Buscar dados na API do Balanção (peso líquido, peças, carga, transportador, placa, UF)",
                        "Armazenar dados na tabela de controle RPA_Faturamento_OS",
                        "Acessar SAP e fazer login com credenciais do cofre",
                        "Executar rotina ZSD007B - Automação Couro Verde ZENC",
                        "Informar data início do mês e documento de remessa (pedido mãe)",
                        "Preencher peso líquido no campo quantidade de remessa",
                        "Gravar documento e capturar número da nota fiscal série 2",
                        "Acessar VF03 e copiar documento FAT gerado",
                        "Executar VA01 - Criar ordem ZRIN com referência ao documento FAT",
                        "Marcar campo 'Não possui ICMS' e gravar remessa industrialização",
                        "Executar VL01N - Criar entrega para ordem de cliente",
                        "Informar local de expedição, picking (peso líquido), pesos e volume",
                        "Informar quantidade de peças nos campos adicionais",
                        "Configurar transportador, placa e UF nos dados de parceiro",
                        "Clicar em Registrar SM e capturar número da entrega industrial",
                        "Executar VF01 - Faturamento e gravar nota fiscal",
                        "Baixar PDF e XML da nota fiscal via API",
                        "Validar dados da nota (quantidade, peso bruto, peso líquido)",
                        "Se nota não autorizada pela SEFAZ: mover card para fila pendente e notificar",
                        "Se divergência nos dados: registrar erro, mover card e notificar",
                        "Executar ZSD007 - Processar entrada de couro verde",
                        "Selecionar última nota e processar documento",
                        "Validar preenchimento das colunas e capturar notas geradas",
                        "Baixar PDF e XML da nota de entrada de couro verde",
                        "Anexar todas as notas (PDF e XML) no JIRA via API",
                        "Mover card para fila de qualidade",
                        "Gerar solicitação de DCPOA",
                        "Registrar conclusão na tabela de controle",
                        "Enviar e-mail de resumo ao final do dia"
                    ],
                    excecoes: [
                        { codigo: "EX01", cenario: "Falhas no acesso a sistemas SAP, Portal ou navegação", tratamento: "Enviar notificação para lista de e-mails, avaliar continuidade, encerrar se necessário" },
                        { codigo: "EX02", cenario: "Falta de informações ou inconsistências nos dados", tratamento: "Notificar área, registrar no banco, avaliar se pode continuar" },
                        { codigo: "EX03", cenario: "Erros na geração ou download de PDF/XML", tratamento: "Notificar área, registrar erro, encerrar processamento do card" },
                        { codigo: "EX04", cenario: "Inconsistências na validação de campos entre nota e SAP", tratamento: "Corrigir valores editáveis ou encerrar, registrar erro e continuar próximo card" },
                        { codigo: "EX05", cenario: "Nota fiscal não autorizada pela SEFAZ", tratamento: "Mover card para fila pendente, indicar etapa de parada, notificar para tratamento manual" }
                    ],
                    dependencias: {
                        sistemas_obrigatorios: ["SAP ERP disponível", "JIRA acessível", "API Balanção funcionando", "Banco de dados online", "Serviço de e-mail ativo"],
                        dados_obrigatorios: ["Credenciais SAP válidas", "Parâmetros no Tenant configurados", "Cards na fila do JIRA"]
                    }
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Validação de Status JIRA", descricao: "Card deve ter status válido para processamento", logica: "SE status IN ('Pendente', 'Faturado1', 'Faturado2', 'DCPOA') ENTÃO processar conforme etapa" },
                    { codigo: "RN-002", tipo: "VAL", titulo: "Validação de Origem", descricao: "Card deve ser de unidade dos estados TO, GO ou MT", logica: "SE origem IN ('Palmeiras de Goiás', ...) ENTÃO processar" },
                    { codigo: "RN-003", tipo: "VAL", titulo: "Validação de Dados da Nota", descricao: "Comparar quantidade, peso bruto e peso líquido com dados do balanção", logica: "SE dados_nota != dados_balancao ENTÃO registrar_divergencia()" },
                    { codigo: "RN-004", tipo: "ACT", titulo: "Retomada de Processamento", descricao: "Se card retornar à fila, continuar da etapa onde parou", logica: "SE status = 'Faturado1' ENTÃO iniciar_da_etapa_x()" },
                    { codigo: "RN-005", tipo: "TIME", titulo: "Execução Contínua", descricao: "Robô executa 24h, todos os dias, inclusive feriados", logica: "executar_sempre = TRUE" },
                    { codigo: "RN-006", tipo: "ACT", titulo: "Registro de Auditoria", descricao: "Toda operação deve ser registrada no banco de dados", logica: "PARA cada_acao FAZER registrar_banco()" }
                ],
                integracoes: [
                    { codigo: "INT-001", sistema_externo: "JIRA", proposito: "Leitura de cards, atualização de status, anexo de documentos", direcao: "BIDIRECIONAL", protocolo: "API REST" },
                    { codigo: "INT-002", sistema_externo: "SAP ERP", proposito: "Execução de transações ZSD007B, VA01, VL01N, VF01, VF03, ZSD007", direcao: "BIDIRECIONAL", protocolo: "GUI/Desktop" },
                    { codigo: "INT-003", sistema_externo: "API Balanção", proposito: "Consulta de dados de carga, peso, transportador", direcao: "ENTRADA", protocolo: "API REST" },
                    { codigo: "INT-004", sistema_externo: "API NF/SEFAZ", proposito: "Download de PDF e XML das notas fiscais", direcao: "ENTRADA", protocolo: "API REST" },
                    { codigo: "INT-005", sistema_externo: "Banco de Dados SQL Server", proposito: "Controle, auditoria e rastreabilidade (tabela RPA_Faturamento_OS)", direcao: "BIDIRECIONAL", protocolo: "SQL" }
                ],
                infraestrutura: {
                    servidores: [
                        { nome: "Servidor RPA", funcao: "Execução do robô IBM RPA", tipo: "APLICACAO" },
                        { nome: "Servidor BD", funcao: "Banco de dados SQL Server para controle", tipo: "BANCO" }
                    ],
                    bancos_dados: [
                        { nome: "RPA_Faturamento_OS", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Tabela de controle e auditoria do processamento" }
                    ],
                    tecnologias: ["IBM RPA (WDG)", "SAP GUI", "SQL Server", "API REST", "Outlook"]
                }
            }
        },
        {
            id: 'faturamento_outras_saidas_sp_mg',
            keywords: ['faturamento', 'nota fiscal', 'couro verde', 'sap', 'jira', 'sefaz', 'logistica', 'remessa', 'industrializacao', 'balancao', 'xml', 'pdf', 'dcpoa', 'zsd007', 'vl01n', 'vf01', 'picking', 'transportador', 'outras saidas', 'barretos', 'jose bonifacio', 'janauba', 'sp', 'mg'],
            category: 'FISCAL',
            nome: 'Faturamento Outras Saídas - SP e MG (Couro Verde)',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Faturamento Outras Saídas – SP e MG",
                    objetivo: "Monitorar o recebimento de solicitações de emissão de notas fiscais de couro verde via JIRA para unidades de Barretos, José Bonifácio e Janaúba, realizar o faturamento completo no SAP (VL01N, VF01, ZSD007), baixar PDF/XML das notas via API, validar dados, anexar documentos no JIRA e gerar solicitação de DCPOA.",
                    justificativa: "Automatizar processo manual de faturamento de notas fiscais de couro verde para os estados SP e MG, eliminando retrabalho e garantindo rastreabilidade completa. Notas de couro não passam pelo DUX.",
                    beneficios: {
                        tangiveis: ["Processamento contínuo 24h, todos os dias da semana", "Eliminação de erros de digitação no SAP", "Rastreabilidade completa via banco de dados", "Redução do tempo de emissão de notas fiscais"],
                        intangiveis: ["Padronização do processo de faturamento", "Controle e auditoria de todas as operações", "Liberação da equipe de logística para atividades estratégicas"]
                    },
                    sistemas_envolvidos: ["SAP ERP", "JIRA", "DUX", "API Balanção", "API SEFAZ", "Banco de Dados SQL Server", "E-mail Outlook"],
                    areas_envolvidas: ["Logística", "TI", "Fiscal"]
                },
                rpas: [{
                    nome: "RPA Faturamento Outras Saídas - SP/MG - Couro Verde",
                    descricao: "Robô responsável por processar solicitações de faturamento de couro verde do JIRA para unidades de Barretos, José Bonifácio e Janaúba, executar rotinas SAP para geração de notas fiscais, validar dados, baixar documentos e atualizar status.",
                    trigger: { 
                        tipo: "AGENDAMENTO", 
                        frequencia: "Diário, contínuo 24h, todos os dias inclusive feriados", 
                        volume_estimado: "Variável conforme demanda de cards no JIRA" 
                    },
                    entrada: {
                        origem: "JIRA (cards pendentes) + API Balanção",
                        dados: ["Número do JIRA", "Código empresa/estabelecimento", "Local de expedição", "Pedido mãe", "Peso líquido", "Quantidade de peças", "Número da carga", "Transportador", "Placa", "UF"]
                    },
                    saida: {
                        destino: "SAP + JIRA + Banco de Dados + E-mail",
                        dados: ["Notas fiscais geradas (PDF/XML)", "Registros de controle", "Relatório de processamento"]
                    },
                    sistemas_utilizados: ["SAP ERP (VL01N, VF01, ZSD007)", "JIRA", "DUX", "API Balanção", "Banco de Dados SQL Server", "Outlook"],
                    fluxo_execucao: [
                        "Recuperar parâmetros do Tenant (credenciais, e-mails, caminhos)",
                        "Recuperar nome das cidades que se encaixam no processamento SP e MG",
                        "Registrar início na API de monitoramento",
                        "Acessar JIRA e ler primeiro card pendente da fila",
                        "Validar status do card (Pendente, Faturado1, Faturado2, DCPOA)",
                        "Validar origem do card (Barretos, José Bonifácio, Janaúba)",
                        "Extrair dados do JIRA: número, estabelecimento/local expedição, pedido mãe",
                        "Buscar dados na API do Balanção (peso líquido, peças, carga, transportador, placa, UF)",
                        "Armazenar dados na tabela de controle RPA_Faturamento_OS",
                        "Acessar SAP e fazer login com credenciais do cofre",
                        "Selecionar pasta Faturamento BT-JB-JNB (Barretos/José Bonifácio/Janaúba)",
                        "Executar VL01N - Criar entrega s/interface",
                        "Informar local de expedição, data de seleção e número do pedido",
                        "Preencher aba Picking: Qtd.Fornd e Qtd.Picking com peso líquido do balanção",
                        "Informar peso bruto, peso líquido, volume (quantidade de peças) e tipo ZPC",
                        "Acessar campos adicionais e informar quantidade de peças",
                        "Acessar menu Ir Para > Cabeçalho > Picking para conferência",
                        "Acessar aba Parceiros e informar transportadora do balanção",
                        "Acessar campos adicionais e informar placa e UF da placa",
                        "Clicar em Registrar SM e capturar número da entrega s/interface",
                        "Gravar número da entrega industrial na tabela de controle",
                        "Executar VF01 - Criar documento de faturamento",
                        "Gravar documento e capturar número da nota fiscal e série",
                        "Baixar PDF e XML da nota fiscal via API",
                        "Se nota não autorizada pela SEFAZ: mover card para fila pendente, registrar etapa e notificar",
                        "Executar ZSD007 - Automação de Couro Verde",
                        "Preencher data do processamento e selecionar nota sem remessa preenchida",
                        "Clicar em Processar e aguardar mensagem de conclusão",
                        "Clicar em Visualização e capturar dados das notas geradas",
                        "Gravar números e séries das notas na tabela de controle",
                        "Baixar PDF e XML da nota de entrada de couro verde via API",
                        "Conferir dados das duas notas: quantidade, peso bruto, peso líquido",
                        "Se divergência nos dados: mover card para fila pendente, registrar motivo e notificar",
                        "Anexar todas as notas (PDF e XML) no JIRA via API",
                        "Mover card para fila de Qualidade",
                        "Gerar solicitação de DCPOA (módulo separado - Projeto 7.2)",
                        "Registrar conclusão na tabela de controle",
                        "Enviar e-mail de resumo ao final do dia"
                    ],
                    excecoes: [
                        { codigo: "EX01", cenario: "Falhas no acesso a sistemas SAP, Portal ou navegação", tratamento: "Enviar notificação para lista de e-mails, avaliar continuidade, encerrar se necessário" },
                        { codigo: "EX02", cenario: "Falta de informações ou inconsistências nos dados", tratamento: "Notificar área, registrar no banco, avaliar se pode continuar" },
                        { codigo: "EX03", cenario: "Erros na geração ou download de PDF/XML", tratamento: "Notificar área, registrar erro, encerrar processamento do card" },
                        { codigo: "EX04", cenario: "Inconsistências na validação de campos entre nota e SAP", tratamento: "Corrigir valores editáveis ou encerrar, registrar erro e continuar próximo card" },
                        { codigo: "EX05", cenario: "Nota fiscal não autorizada pela SEFAZ", tratamento: "Mover card para fila pendente, indicar etapa VF01, notificar para tratamento manual" }
                    ],
                    dependencias: {
                        sistemas_obrigatorios: ["SAP ERP disponível", "JIRA acessível", "API Balanção funcionando", "Banco de dados online", "Serviço de e-mail ativo"],
                        dados_obrigatorios: ["Credenciais SAP válidas", "Parâmetros no Tenant configurados", "Cards na fila do JIRA", "Pedido mãe mensal configurado"]
                    }
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Validação de Status JIRA", descricao: "Card deve ter status válido para processamento", logica: "SE status IN ('Pendente', 'Faturado1', 'Faturado2', 'DCPOA') ENTÃO processar conforme etapa" },
                    { codigo: "RN-002", tipo: "VAL", titulo: "Validação de Origem SP/MG", descricao: "Card deve ser de unidade Barretos, José Bonifácio ou Janaúba", logica: "SE origem IN ('Barretos', 'Jose Bonifácio', 'Janaúba') ENTÃO processar" },
                    { codigo: "RN-003", tipo: "VAL", titulo: "Validação de Dados da Nota", descricao: "Comparar quantidade, peso bruto e peso líquido com dados do balanção", logica: "SE dados_nota != dados_balancao ENTÃO registrar_divergencia()" },
                    { codigo: "RN-004", tipo: "ACT", titulo: "Retomada de Processamento", descricao: "Se card retornar à fila, continuar da etapa onde parou (VF01 ou ZSD007)", logica: "SE status = 'Faturado1' ENTÃO iniciar_da_etapa_vf01()" },
                    { codigo: "RN-005", tipo: "REST", titulo: "Notas de Couro não passam pelo DUX", descricao: "Na criação de DCPOA, não atualizar o DUX", logica: "SE tipo = 'COURO_VERDE' ENTÃO skip_dux = TRUE" },
                    { codigo: "RN-006", tipo: "ACT", titulo: "Registro de Auditoria", descricao: "Toda operação deve ser registrada no banco de dados", logica: "PARA cada_acao FAZER registrar_banco()" }
                ],
                integracoes: [
                    { codigo: "INT-001", sistema_externo: "JIRA", proposito: "Leitura de cards, atualização de status, anexo de documentos", direcao: "BIDIRECIONAL", protocolo: "API REST" },
                    { codigo: "INT-002", sistema_externo: "SAP ERP", proposito: "Execução de transações VL01N, VF01, ZSD007", direcao: "BIDIRECIONAL", protocolo: "GUI/Desktop" },
                    { codigo: "INT-003", sistema_externo: "API Balanção", proposito: "Consulta de dados de carga, peso, transportador", direcao: "ENTRADA", protocolo: "API REST" },
                    { codigo: "INT-004", sistema_externo: "API NF/SEFAZ", proposito: "Download de PDF e XML das notas fiscais", direcao: "ENTRADA", protocolo: "API REST" },
                    { codigo: "INT-005", sistema_externo: "Banco de Dados SQL Server", proposito: "Controle, auditoria e rastreabilidade (tabela RPA_Faturamento_OS)", direcao: "BIDIRECIONAL", protocolo: "SQL" }
                ],
                infraestrutura: {
                    servidores: [
                        { nome: "Servidor RPA", funcao: "Execução do robô IBM RPA", tipo: "APLICACAO" },
                        { nome: "Servidor BD", funcao: "Banco de dados SQL Server para controle", tipo: "BANCO" }
                    ],
                    bancos_dados: [
                        { nome: "RPA_Faturamento_OS", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Tabela de controle e auditoria do processamento" }
                    ],
                    tecnologias: ["IBM RPA (WDG)", "SAP GUI", "SQL Server", "API REST", "Outlook"]
                }
            }
        },
        {
            id: 'consulta_parecer_csi_csn',
            keywords: ['csi', 'csn', 'certificado sanitario', 'sigsif', 'parecer', 'dcpoa', 'exportacao', 'importacao', 'internacional', 'nacional', 'sif', 'documento transito', 'secretaria agricultura', 'dux', 'jira', 'reemissao', 'rascunho', 'reprovado', 'carta correcao', 'laudo', 'mercado externo'],
            category: 'FISCAL',
            nome: 'Consulta de Emissão de Parecer CSI/CSN',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Consulta de Emissão de Parecer CSI/CSN",
                    objetivo: "Efetuar a consulta do status das solicitações de parecer de certificados sanitários (CSI - Internacional e CSN - Nacional) no portal SIGSIF, registrar o status no DUX e nas tabelas de controle do RPA, validar divergências de peso/volume, monitorar atrasos em status Rascunho, e gerar JIRA para reemissão quando necessário.",
                    justificativa: "Automatizar o monitoramento de certificados sanitários para exportação e mercado nacional, garantindo rastreabilidade, identificação de atrasos e divergências, e geração automática de solicitações de reemissão.",
                    beneficios: {
                        tangiveis: ["Monitoramento contínuo 24h de certificados", "Identificação automática de divergências de peso/volume", "Geração automática de JIRA para reemissão", "Rastreabilidade completa via banco de dados"],
                        intangiveis: ["Redução de atrasos na emissão de certificados", "Conformidade com requisitos de exportação", "Visibilidade do status de certificados para a área"]
                    },
                    sistemas_envolvidos: ["Portal SIGSIF", "DUX", "JIRA", "API DUX", "Banco de Dados SQL Server", "E-mail Outlook", "Google Chrome"],
                    areas_envolvidas: ["Logística", "TI", "Qualidade"]
                },
                rpas: [{
                    nome: "RPA Consulta Parecer CSI/CSN",
                    descricao: "Robô responsável por consultar status de certificados sanitários no portal SIGSIF, processar em lote e por número de referência, validar divergências, monitorar status Rascunho, criar JIRA de reemissão e atualizar DUX.",
                    trigger: { 
                        tipo: "AGENDAMENTO", 
                        frequencia: "Diário, contínuo 24h, todos os dias inclusive feriados", 
                        volume_estimado: "Variável conforme quantidade de solicitações pendentes" 
                    },
                    entrada: {
                        origem: "API DUX (solicitações pendentes) + Portal SIGSIF + Planilha de Emissores/SIF",
                        dados: ["Estabelecimento", "Nr_Solicitacao/Processo", "Tipo Documentação (CSI/CSN/DCPOA)", "Data_Criacao", "Número do Jira", "Lista de SIFs Minerva", "Lista de Exportadores"]
                    },
                    saida: {
                        destino: "DUX + JIRA + Banco de Dados + E-mail",
                        dados: ["Status dos certificados", "Dados dos documentos de trânsito", "JIRA de reemissão", "Planilha de processamento"]
                    },
                    sistemas_utilizados: ["Portal SIGSIF (sigsif.agricultura.gov.br)", "DUX", "JIRA", "Google Chrome", "Banco de Dados SQL Server", "Outlook"],
                    fluxo_execucao: [
                        "Recuperar parâmetros do Tenant (credenciais, e-mails, dias de consulta, dias para Rascunho)",
                        "Carregar via API lista de SIFs da Minerva e nomes de exportadores",
                        "Carregar lista de Emissores e SIF a serem consultados da planilha de rede",
                        "Registrar início na API de monitoramento",
                        "PROCESSAMENTO EM LOTE:",
                        "Abrir Google Chrome e acessar portal SIGSIF",
                        "Fazer login com usuário e senha do cofre",
                        "Navegar para Menu > Documentos de Trânsito > Consulta",
                        "Para cada Emissor/SIF da lista:",
                        "  - Selecionar Emissor e informar SIF",
                        "  - Informar período (hoje - dias_consulta até hoje)",
                        "  - Clicar Consultar e aguardar carregamento",
                        "  - Para cada página de resultados (18 registros por página):",
                        "    - Copiar dados e salvar na tabela Tab_controle_certificado_sanitario",
                        "    - Usar Nº Referência como chave",
                        "    - Atualizar status conforme Nº Documento de Trânsito (Rascunho/Sem Parecer/Reprovada/Emitido)",
                        "    - Navegar para próxima página",
                        "  - Conferir total de registros copiados",
                        "PROCESSAMENTO POR REFERÊNCIA:",
                        "Consultar API DUX para obter solicitações pendentes",
                        "Para cada referência:",
                        "  - Pesquisar no SIGSIF por Nº Referência",
                        "  - Copiar dados e atualizar tabela de controle",
                        "  - Clicar no Nº Documento de Trânsito para ver detalhes",
                        "  - Validar se é da Minerva (pesquisar exportador ou SIF)",
                        "  - Extrair Modelo Documento de Trânsito (CSI/CSN/DCPOA/Carta_Correcao)",
                        "  - Definir Mercado: CSN=Nacional, CSI=Internacional",
                        "  - Verificar se é modelo antigo",
                        "  - Extrair dados: Nr Volumes, Peso Líquido, Peso Total, Nr Ordem, Nr NF",
                        "VALIDAÇÕES:",
                        "Agrupar por Nota Fiscal e totalizar Peso_Liquido, Peso_Total, Nr_Volumes",
                        "Buscar dados da NF via API e comparar com certificado",
                        "Se divergência: marcar campo Divergência e Desc_Divergencia",
                        "Verificar certificados em status Rascunho há mais que o parâmetro de dias",
                        "Se vencido: marcar Regra_Rascunho com dias de atraso",
                        "CRIAR JIRA REEMISSÃO:",
                        "Para certificados rejeitados sem JIRA de reemissão:",
                        "  - Buscar PDF da NF via API",
                        "  - Criar JIRA de Correção/Substituição/Reemissão via navegação ou API",
                        "  - Preencher: Motivo, Empresa, Unidade, Tipo Documento, Reemissão Espelho",
                        "  - Anexar cópia da NF",
                        "  - Gravar número do JIRA gerado na tabela",
                        "ATUALIZAÇÃO DUX:",
                        "Para cada registro processado:",
                        "  - Verificar se existe no DUX",
                        "  - Se não existe: incluir via API (SIF, Ordem, NF, Tipo, Categoria, Referência)",
                        "  - Se existe: atualizar (Nº Referência, Data emissão, Status)",
                        "CONCLUSÃO:",
                        "Criar planilha XLSX com abas Dados Extraídos e Resultado",
                        "Enviar e-mail de conclusão com planilha anexa"
                    ],
                    excecoes: [
                        { codigo: "EX01", cenario: "Falhas no acesso ao portal SIGSIF ou navegação", tratamento: "Enviar notificação, encerrar processamento" },
                        { codigo: "EX02", cenario: "Falta de informações ou inconsistências no processo", tratamento: "Notificar, avaliar continuidade ou encerrar" },
                        { codigo: "EX03", cenario: "Usuário ou senha inválidos no SIGSIF", tratamento: "Notificar TI, encerrar processamento" },
                        { codigo: "EX04", cenario: "Problemas no banco de dados (select/insert/update/delete)", tratamento: "Notificar, encerrar processamento" }
                    ],
                    dependencias: {
                        sistemas_obrigatorios: ["Portal SIGSIF disponível", "DUX acessível", "JIRA acessível", "Banco de dados online", "API DUX funcionando"],
                        dados_obrigatorios: ["Credenciais SIGSIF válidas", "Lista de SIFs Minerva", "Lista de Exportadores", "Parâmetros de dias no Tenant"]
                    }
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Identificação Minerva por Exportador", descricao: "Pesquisar nome do exportador na lista Minerva", logica: "SE campo_exportador CONTAINS lista_exportadores_minerva ENTÃO Emissor = 'Minerva S/A'" },
                    { codigo: "RN-002", tipo: "VAL", titulo: "Identificação Minerva por SIF", descricao: "Se não achou exportador, pesquisar SIF na lista Minerva", logica: "SE campo_sif IN lista_sif_minerva ENTÃO Emissor = 'Minerva S/A'" },
                    { codigo: "RN-003", tipo: "INF", titulo: "Classificação de Mercado", descricao: "CSN é Nacional, CSI é Internacional", logica: "SE tipo_documento = 'CSN' ENTÃO Mercado = 'Nacional' SENÃO SE tipo_documento = 'CSI' ENTÃO Mercado = 'Internacional'" },
                    { codigo: "RN-004", tipo: "VAL", titulo: "Validação de Divergência", descricao: "Comparar peso/volume do certificado com NF", logica: "SE (peso_certificado != peso_nf OR volume_certificado != volume_nf) ENTÃO Divergencia = 'Sim'" },
                    { codigo: "RN-005", tipo: "TIME", titulo: "Controle de Rascunho Vencido", descricao: "Monitorar certificados em Rascunho além do prazo", logica: "SE (hoje - Dt_Rascunho) > param_dias_rascunho ENTÃO Regra_Rascunho = 'Vencido há X Dias'" },
                    { codigo: "RN-006", tipo: "ACT", titulo: "Geração de JIRA Reemissão", descricao: "Criar JIRA para certificados rejeitados", logica: "SE Status = 'Rejeitado' AND Jira_Reemissao IS NULL ENTÃO criar_jira_reemissao()" },
                    { codigo: "RN-007", tipo: "REST", titulo: "Impressão CSI", descricao: "Certificados CSI não podem ser impressos pelo RPA", logica: "SE tipo_documento = 'CSI' ENTÃO skip_impressao = TRUE (deve ser impresso pelo usuário Doutor)" },
                    { codigo: "RN-008", tipo: "ACT", titulo: "Anexar CSN no JIRA", descricao: "Apenas CSN tem cópia anexada ao JIRA", logica: "SE tipo_documento = 'CSN' AND Status = 'Emitido' ENTÃO anexar_certificado_jira()" }
                ],
                integracoes: [
                    { codigo: "INT-001", sistema_externo: "Portal SIGSIF", proposito: "Consulta de status de certificados sanitários", direcao: "ENTRADA", protocolo: "WEB/Navegação" },
                    { codigo: "INT-002", sistema_externo: "DUX", proposito: "Consulta de solicitações pendentes e atualização de status", direcao: "BIDIRECIONAL", protocolo: "API REST" },
                    { codigo: "INT-003", sistema_externo: "JIRA", proposito: "Criação de JIRA para reemissão de certificados", direcao: "SAIDA", protocolo: "API REST/WEB" },
                    { codigo: "INT-004", sistema_externo: "API NF", proposito: "Download de PDF e dados da Nota Fiscal", direcao: "ENTRADA", protocolo: "API REST" },
                    { codigo: "INT-005", sistema_externo: "Banco de Dados SQL Server", proposito: "Controle e auditoria (Tab_controle_certificado_sanitario)", direcao: "BIDIRECIONAL", protocolo: "SQL" }
                ],
                infraestrutura: {
                    servidores: [
                        { nome: "Servidor RPA", funcao: "Execução do robô IBM RPA", tipo: "APLICACAO" },
                        { nome: "Servidor BD", funcao: "Banco de dados SQL Server para controle", tipo: "BANCO" }
                    ],
                    bancos_dados: [
                        { nome: "Tab_controle_certificado_sanitario", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Tabela de controle de certificados sanitários com status, divergências, datas" }
                    ],
                    tecnologias: ["IBM RPA (WDG)", "Google Chrome", "SQL Server", "API REST", "Outlook"]
                }
            }
        },
        {
            id: 'consulta_parecer_dcpoa',
            keywords: ['dcpoa', 'certificado sanitario', 'ministerio agricultura', 'parecer', 'exportacao', 'dux', 'jira', 'produtos embarcados', 'peso liquido', 'caixas', 'cancelado', 'emitido', 'rascunho', 'finalidade'],
            category: 'FISCAL',
            nome: 'Consulta de Emissão de Parecer DCPOA',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Consulta de Emissão de Parecer DCPOA",
                    objetivo: "Efetuar a consulta do status das solicitações de parecer DCPOA no portal do Ministério da Agricultura, registrar o status no DUX e nas tabelas de controle, validar divergências de peso/caixas contra NF, e anexar certificado emitido no JIRA.",
                    justificativa: "Automatizar o monitoramento de certificados DCPOA para exportação, garantindo rastreabilidade, identificação de divergências de peso/quantidade, e atualização automática do DUX e JIRA.",
                    beneficios: {
                        tangiveis: ["Monitoramento contínuo 24h de certificados DCPOA", "Identificação automática de divergências peso/caixas", "Download e anexo automático do certificado no JIRA", "Rastreabilidade completa via banco de dados"],
                        intangiveis: ["Redução de atrasos na emissão de certificados", "Conformidade com requisitos de exportação", "Visibilidade do status para a área de logística"]
                    },
                    sistemas_envolvidos: ["Portal Ministério da Agricultura", "DUX", "JIRA", "API DUX", "Banco de Dados SQL Server (DBFATUR)", "E-mail Outlook"],
                    areas_envolvidas: ["Logística", "TI", "Qualidade"]
                },
                rpas: [{
                    nome: "RPA Consulta Parecer DCPOA",
                    descricao: "Robô responsável por consultar status de certificados DCPOA no portal do Ministério da Agricultura, validar produtos embarcados, verificar divergências de peso/caixas, baixar certificado emitido, anexar no JIRA e atualizar DUX.",
                    trigger: { 
                        tipo: "AGENDAMENTO", 
                        frequencia: "Diário, contínuo 24h, todos os dias inclusive feriados", 
                        volume_estimado: "Variável conforme quantidade de solicitações DCPOA pendentes" 
                    },
                    entrada: {
                        origem: "API DUX (solicitações DCPOA pendentes)",
                        dados: ["Cod_Empresa", "Cod_Solicitacao", "Dt_Solicitacao", "Nr_Jira_Emissao"]
                    },
                    saida: {
                        destino: "DUX + JIRA + Banco de Dados + E-mail",
                        dados: ["Status dos certificados DCPOA", "PDF do certificado emitido", "Planilha de processamento"]
                    },
                    sistemas_utilizados: ["Portal Ministério da Agricultura", "DUX", "JIRA", "Banco de Dados SQL Server", "Outlook"],
                    fluxo_execucao: [
                        "Recuperar parâmetros do Tenant (credenciais, e-mails, dias de consulta)",
                        "Buscar via API lista de solicitações DCPOA pendentes",
                        "Atribuir Cod_Empresa, Num_Processo, Data_Processo, Num_Jira",
                        "Filtrar somente solicitações DCPOA",
                        "Registrar início na API de monitoramento",
                        "Abrir navegador e acessar portal do Ministério da Agricultura",
                        "Realizar login com usuário e senha do cofre",
                        "Navegar para Menu > Documentos > DCPOA",
                        "Para cada DCPOA a ser pesquisado:",
                        "  - Preencher campo Estabelecimento",
                        "  - Preencher Número DCPOA",
                        "  - Selecionar Situação: tentar Cancelado, Emitido ou Rascunho (nesta prioridade)",
                        "  - Preencher Data de Cadastro Inicial (hoje - dias_consulta)",
                        "  - Clicar em Consultar",
                        "  - Se encontrar processo:",
                        "    - Clicar no Número do Processo",
                        "    - Copiar Finalidade da DCPOA e atualizar tabela de controle",
                        "    - Acessar aba Produtos Embarcados",
                        "    - Para cada produto com Situação Ativo:",
                        "      - Acumular Peso Líquido e Quantidade de Caixas",
                        "      - Baixar dados da NF via API",
                        "      - Validar caixas da NF com caixas do DCPOA",
                        "      - Validar peso líquido da NF com peso do DCPOA",
                        "      - Se divergência: registrar erro e enviar alerta",
                        "    - Se Status = Cancelado:",
                        "      - Atualizar status, dt_cancelado, st_Cancelado = Sim",
                        "    - Se Status = Emitido:",
                        "      - Copiar número do DCPOA",
                        "      - Clicar em Visualizar DCPOA e salvar PDF",
                        "      - Renomear arquivo para DCPOA + número",
                        "      - Anexar PDF no JIRA via API ou navegação",
                        "      - Alterar fila do JIRA para Certificado Emitido",
                        "      - Atualizar DUX via API com número e data de liberação",
                        "  - Voltar para tela de pesquisa",
                        "Fechar navegador",
                        "Criar planilha XLSX com aba Resultado",
                        "Enviar e-mail de conclusão com planilha anexa"
                    ],
                    excecoes: [
                        { codigo: "EX01", cenario: "Falhas no acesso ao portal ou navegação WEB", tratamento: "Enviar notificação, encerrar processamento" },
                        { codigo: "EX02", cenario: "Falta de informações ou inconsistências (DCPOA não encontrado)", tratamento: "Tentar com Cancelado/Emitido/Rascunho, se não encontrar notificar" },
                        { codigo: "EX03", cenario: "Usuário ou senha inválidos no portal", tratamento: "Notificar TI, encerrar processamento" },
                        { codigo: "EX04", cenario: "Problemas no banco de dados", tratamento: "Notificar, encerrar processamento" }
                    ],
                    dependencias: {
                        sistemas_obrigatorios: ["Portal Ministério da Agricultura disponível", "DUX acessível", "JIRA acessível", "Banco de dados DBFATUR online", "API DUX funcionando"],
                        dados_obrigatorios: ["Credenciais do portal válidas", "Solicitações DCPOA na API", "Parâmetros de dias no Tenant"]
                    }
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Prioridade de Consulta por Situação", descricao: "Tentar consulta na ordem: Cancelado, Emitido, Rascunho", logica: "tentar_situacao(['Cancelado', 'Emitido', 'Rascunho'])" },
                    { codigo: "RN-002", tipo: "VAL", titulo: "Validação de Caixas", descricao: "Comparar quantidade de caixas do DCPOA com NF", logica: "SE caixas_dcpoa != caixas_nf ENTÃO registrar_divergencia()" },
                    { codigo: "RN-003", tipo: "VAL", titulo: "Validação de Peso Líquido", descricao: "Comparar soma do peso líquido do DCPOA com NF", logica: "SE peso_liquido_dcpoa != peso_liquido_nf ENTÃO registrar_divergencia()" },
                    { codigo: "RN-004", tipo: "ACT", titulo: "Download Certificado Emitido", descricao: "Baixar PDF quando status é Emitido", logica: "SE status = 'Emitido' ENTÃO baixar_pdf() E anexar_jira()" },
                    { codigo: "RN-005", tipo: "ACT", titulo: "Atualização DUX", descricao: "Atualizar DUX com número e data do certificado", logica: "SE status = 'Emitido' ENTÃO atualizar_dux(numero_dcpoa, data_liberacao)" },
                    { codigo: "RN-006", tipo: "ACT", titulo: "Nomenclatura do Arquivo", descricao: "Renomear PDF baixado com padrão", logica: "nome_arquivo = 'DCPOA' + numero_dcpoa" }
                ],
                integracoes: [
                    { codigo: "INT-001", sistema_externo: "Portal Ministério da Agricultura", proposito: "Consulta de status de certificados DCPOA", direcao: "ENTRADA", protocolo: "WEB/Navegação" },
                    { codigo: "INT-002", sistema_externo: "DUX", proposito: "Consulta de solicitações pendentes e atualização de status/certificado", direcao: "BIDIRECIONAL", protocolo: "API REST" },
                    { codigo: "INT-003", sistema_externo: "JIRA", proposito: "Anexo de certificado e mudança de fila", direcao: "SAIDA", protocolo: "API REST/WEB" },
                    { codigo: "INT-004", sistema_externo: "API NF", proposito: "Download de dados da Nota Fiscal para validação", direcao: "ENTRADA", protocolo: "API REST" },
                    { codigo: "INT-005", sistema_externo: "Banco de Dados DBFATUR", proposito: "Controle e auditoria (Tab_controle_certificado_sanitario)", direcao: "BIDIRECIONAL", protocolo: "SQL" }
                ],
                infraestrutura: {
                    servidores: [
                        { nome: "Servidor RPA", funcao: "Execução do robô IBM RPA", tipo: "APLICACAO" },
                        { nome: "Servidor BD DBFATUR", funcao: "Banco de dados SQL Server para controle", tipo: "BANCO" }
                    ],
                    bancos_dados: [
                        { nome: "Tab_controle_certificado_sanitario", servidor: "DBFATUR", tipo: "SQL_SERVER", funcao: "Tabela de controle de certificados com status, divergências, datas" }
                    ],
                    tecnologias: ["IBM RPA (WDG)", "Navegador Web", "SQL Server", "API REST", "Outlook"]
                }
            }
        },
        {
            id: 'emissao_nf_exportacao',
            keywords: ['emissao', 'nota fiscal', 'exportacao', 'dux', 'jira', 'sefaz', 'danfe', 'packing list', 'certificate traceability', 'instrucao embarque', 'carga comex', 'balancao', 'faturamento', 'exportador', 'eagle faturamento', 'xml nfe', 'relatorio sintetico', 'container', 'carga'],
            category: 'FISCAL',
            nome: 'Emissão de Nota Fiscal de Exportação',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Emissão de Nota Fiscal de Exportação",
                    objetivo: "Efetuar a emissão de notas fiscais de venda para produtos destinados à exportação, desde a solicitação no JIRA, validação dos dados do balanção, emissão da NF no ERP DUX, envio e autorização na SEFAZ, geração da documentação acessória (DANFE, Relatório Sintético, Certificate of Traceability, Instrução de Embarque, Packing List), e finalização com devolutiva dos documentos no JIRA.",
                    justificativa: "Automatizar o processo completo de emissão de notas fiscais de exportação, eliminando trabalho manual, garantindo conformidade com SEFAZ, e rastreabilidade completa de todo o processo de faturamento.",
                    beneficios: {
                        tangiveis: ["Processamento 24h/dia, 7 dias por semana", "Emissão automática de NF com autorização SEFAZ", "Geração automática de 5 tipos de documentos", "Eliminação de erros de digitação no DUX"],
                        intangiveis: ["Rastreabilidade completa via banco de dados", "Notificação automática ao solicitante", "Redução do tempo de faturamento", "Conformidade fiscal garantida"]
                    },
                    sistemas_envolvidos: ["ERP DUX (Eagle Faturamento)", "API JIRA", "SEFAZ", "Banco de Dados SQL Server", "E-mail Outlook"],
                    areas_envolvidas: ["Logística", "TI", "Fiscal", "Exportação"]
                },
                rpas: [{
                    nome: "RPA Emissão NF Exportação",
                    descricao: "Robô responsável por obter solicitações de faturamento do JIRA, ler dados do balanção (PDF), emitir nota fiscal no DUX, enviar para SEFAZ, gerar documentação acessória, anexar no JIRA e notificar solicitante.",
                    trigger: { 
                        tipo: "AGENDAMENTO", 
                        frequencia: "Contínuo 24h, todos os dias inclusive feriados", 
                        volume_estimado: "Variável conforme cards na fila do JIRA" 
                    },
                    entrada: {
                        origem: "API JIRA (cards aptos a faturar) + PDF Balanção + View BD",
                        dados: ["Chave JIRA", "Código empresa", "Código carga", "Código ordem", "E-mail solicitante", "Arquivo Balanção (PDF)", "Container", "Texto"]
                    },
                    saida: {
                        destino: "DUX + SEFAZ + JIRA + Pastas servidor/rede + E-mail",
                        dados: ["Nota Fiscal autorizada (DANFE PDF)", "Relatório Sintético", "Certificate of Traceability", "Instrução de Embarque", "Packing List (XLSX)", "Planilha de processamento"]
                    },
                    sistemas_utilizados: ["ERP DUX Desktop (Eagle Faturamento)", "API JIRA", "SEFAZ", "Banco de Dados SQL Server", "Outlook", "OCR para PDF"],
                    fluxo_execucao: [
                        "Recuperar parâmetros do Tenant (credenciais, pastas, filas JIRA, dias retenção)",
                        "Executar limpeza de arquivos antigos no servidor (conforme parâmetro de dias)",
                        "Registrar início no banco de dados de controle",
                        "OBTENÇÃO DE DADOS DO JIRA:",
                        "Acessar API JIRA e obter cards da fila configurada com status e responsável corretos",
                        "Para cada card, gravar dados na tabela RPA-SolicitacoesNFExp",
                        "Obter anexos 'Balanção' (PDF) via API JIRA e salvar nas pastas",
                        "Ler código da carga do arquivo Balanção via OCR/leitura PDF",
                        "Buscar dados complementares via View do cliente (Container, Texto)",
                        "Comparar carga do JIRA com carga do Balanção, atualizar se diferente",
                        "EMISSÃO NO DUX:",
                        "Abrir ERP DUX Desktop e fazer login",
                        "Acessar módulo Eagle Faturamento",
                        "Loop por empresa: Configurar servidor de conexão para cada empresa",
                        "Loop por carga: Filtrar carga e verificar status",
                        "Se já faturada: registrar erro, comentar no JIRA, mover para fila de problemas",
                        "Se não faturada: clicar em Calcular Carga / Ativar Notas Fiscais",
                        "Abrir tela Montagem de Carga Comex e verificar erros",
                        "Acessar Despesas e transferir dados se necessário",
                        "Clicar em Calcular para calcular a nota fiscal",
                        "Acessar detalhes da nota (ícone Lápis) para validação",
                        "Se país destino diferente do parâmetro: acessar aba Impor Peso, Calcular, selecionar CAIXAS",
                        "Gerar espelho da nota fiscal (ícone Texto) e aguardar processamento",
                        "Ativar nota fiscal e enviar para SEFAZ",
                        "Aguardar resposta SEFAZ: '100 - Autorizado o uso da NF-e' e 'ATIVA'",
                        "Se erro SEFAZ: registrar, comentar no JIRA, mover para fila de problemas",
                        "Salvar DANFE (PDF) nas pastas servidor e rede com padrão de nomenclatura",
                        "GERAÇÃO DE DOCUMENTOS:",
                        "Avançar para etapa 4 - Imprimir documentos",
                        "Selecionar: Relatório Sintético, Packing List, Instrução de Embarque",
                        "Gerar Relatório Sintético com Certificate of Traceability",
                        "Salvar arquivos nas pastas com nomenclatura padrão",
                        "Gerar Instrução de Embarque conforme tipo de frete (Rodoviário/Marítimo/Aéreo/Couro)",
                        "Exportar Packing List para Excel (XLSX)",
                        "FINALIZAÇÃO:",
                        "Registrar conclusão na tabela de controle (Doctos_Gerados = Sim)",
                        "Enviar comentário no JIRA: 'Arquivos do Faturamento Gerados com Sucesso'",
                        "Anexar todos os arquivos no JIRA via API",
                        "Enviar e-mail para solicitante informando emissão da NF",
                        "Clicar em Finalizar e passar para próxima carga/empresa",
                        "Ao concluir tudo, criar planilha XLSX de processamento e enviar por e-mail"
                    ],
                    excecoes: [
                        { codigo: "EX01", cenario: "Falhas no acesso ao ERP DUX ou navegação", tratamento: "Enviar notificação, encerrar processamento" },
                        { codigo: "EX02", cenario: "Arquivo Balanção não encontrado ou fora do padrão", tratamento: "Notificar, avaliar continuidade" },
                        { codigo: "EX03", cenario: "Usuário ou senha inválidos no DUX", tratamento: "Notificar TI, encerrar processamento" },
                        { codigo: "EX04", cenario: "Problemas no banco de dados", tratamento: "Notificar, encerrar processamento" },
                        { codigo: "EX05", cenario: "Falha na API JIRA (token, post, get)", tratamento: "Notificar, avaliar continuidade" }
                    ],
                    dependencias: {
                        sistemas_obrigatorios: ["ERP DUX disponível", "API JIRA funcionando", "SEFAZ respondendo", "Banco de dados online", "Rede disponível"],
                        dados_obrigatorios: ["Credenciais DUX válidas", "Cards na fila do JIRA", "Arquivos Balanção anexados", "View do cliente liberada"]
                    }
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Validação de Carga Balanção vs JIRA", descricao: "Comparar código da carga do Balanção com o do JIRA", logica: "SE carga_balancao != carga_jira ENTÃO atualizar_jira(carga_balancao) E comentar_alteracao()" },
                    { codigo: "RN-002", tipo: "VAL", titulo: "Verificação de Nota Já Faturada", descricao: "Se status é Faturada Integral, não processar", logica: "SE status = 'Faturada Integral' ENTÃO registrar_erro() E mover_fila_problemas()" },
                    { codigo: "RN-003", tipo: "VAL", titulo: "Validação Autorização SEFAZ", descricao: "Nota deve ter Status SEFAZ 100 e Status Faturamento ATIVA", logica: "SE status_sefaz != '100' OR status_fat != 'ATIVA' ENTÃO erro_autorizacao()" },
                    { codigo: "RN-004", tipo: "INF", titulo: "Tratativa País Destino", descricao: "Se país diferente do parâmetro, processar aba Impor Peso", logica: "SE nom_grupo_paises != param_pais ENTÃO processar_impor_peso()" },
                    { codigo: "RN-005", tipo: "ACT", titulo: "Nomenclatura Padrão de Arquivos", descricao: "Arquivos salvos com padrão carga_nf_empresa_tipo", logica: "nome = carga + '_' + num_nf + '_' + cod_empresa + '_' + tipo + extensao" },
                    { codigo: "RN-006", tipo: "REST", titulo: "Empresas Faturamento Manual", descricao: "Algumas empresas não fazem faturamento automático", logica: "SE cod_empresa IN lista_manual ENTÃO skip_empresa()" },
                    { codigo: "RN-007", tipo: "TIME", titulo: "Retenção de Arquivos", descricao: "Excluir arquivos do servidor após X dias", logica: "SE (hoje - data_criacao) > param_dias ENTÃO excluir_arquivo()" },
                    { codigo: "RN-008", tipo: "ACT", titulo: "Notificação ao Solicitante", descricao: "Enviar e-mail informando emissão da NF", logica: "APÓS emissao_ok FAZER enviar_email(solicitante, anexo_danfe)" }
                ],
                integracoes: [
                    { codigo: "INT-001", sistema_externo: "API JIRA", proposito: "Obter cards, anexos, enviar comentários, mudar fila/status, anexar arquivos", direcao: "BIDIRECIONAL", protocolo: "API REST" },
                    { codigo: "INT-002", sistema_externo: "ERP DUX Desktop", proposito: "Emissão de nota fiscal via Eagle Faturamento", direcao: "BIDIRECIONAL", protocolo: "Desktop/GUI" },
                    { codigo: "INT-003", sistema_externo: "SEFAZ", proposito: "Envio e autorização da NF-e", direcao: "BIDIRECIONAL", protocolo: "WebService (via DUX)" },
                    { codigo: "INT-004", sistema_externo: "View BD Cliente", proposito: "Obter dados complementares (Container, Texto, Tipo Frete)", direcao: "ENTRADA", protocolo: "SQL" },
                    { codigo: "INT-005", sistema_externo: "Banco de Dados SQL Server", proposito: "Controle e auditoria (RPA-SolicitacoesNFExp, RPA-BalancaoNFExp)", direcao: "BIDIRECIONAL", protocolo: "SQL" }
                ],
                infraestrutura: {
                    servidores: [
                        { nome: "Servidor RPA", funcao: "Execução do robô IBM RPA", tipo: "APLICACAO" },
                        { nome: "Servidor BD", funcao: "Banco de dados SQL Server para controle", tipo: "BANCO" },
                        { nome: "Pasta Servidor", funcao: "Armazenamento temporário de arquivos gerados", tipo: "ARQUIVO" },
                        { nome: "Pasta Rede", funcao: "Armazenamento compartilhado de arquivos", tipo: "ARQUIVO" }
                    ],
                    bancos_dados: [
                        { nome: "RPA-SolicitacoesNFExp", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Controle de solicitações de faturamento" },
                        { nome: "RPA-BalancaoNFExp", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Dados extraídos dos arquivos Balanção" }
                    ],
                    tecnologias: ["IBM RPA (WDG)", "ERP DUX Desktop", "OCR", "SQL Server", "API REST JIRA", "Outlook", "Excel"]
                }
            }
        },
        {
            id: 'faturamento_nf_mercado_interno_externo',
            keywords: ['faturamento', 'nota fiscal', 'couro', 'mercado interno', 'mercado externo', 'exportacao', 'sap', 'vl02n', 'vf01', 'j1b3n', 'va01', 'vl01n', 'boleto', 'portal minerva', 'pdf', 'xml', 'picking', 'cfop', 'transportadora', 'cobertura', 'quimico', 'industrializacao', 'zfiblt', 'registro sm', 'durlicouros', 'sol couros'],
            category: 'FISCAL',
            nome: 'Faturamento Notas Fiscais Mercado Interno e Externo',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Faturamento Notas Fiscais Mercado Interno e Externo",
                    objetivo: "Monitorar recebimento de solicitações de emissão de notas fiscais de couro via e-mail/JIRA, validar dados do PDF da Nota Fiscal contra SAP, realizar faturamento no SAP (VL02N, VF01, J1B3N), baixar PDF/XML do Portal Minerva Foods, e para Mercado Interno gerar boleto. Processo cobre 4 tipos: Venda Exportação (ME), Mercado Interno (MI), Cobertura e Químico.",
                    justificativa: "Automatizar o faturamento de notas fiscais de couro para mercados interno e externo, com validação completa de dados, geração de documentos fiscais e boletos, garantindo conformidade e rastreabilidade.",
                    beneficios: {
                        tangiveis: ["Processamento contínuo 24h/dia", "Eliminação de erros de digitação no SAP", "Geração automática de NF, PDF, XML e boletos", "Rastreabilidade completa via banco de dados"],
                        intangiveis: ["Padronização do processo de faturamento", "Conformidade fiscal com CFOPs corretos", "Liberação da equipe para atividades estratégicas"]
                    },
                    sistemas_envolvidos: ["SAP Easy Access", "Portal Minerva Foods", "E-mail Outlook", "JIRA", "API de Notas", "Banco de Dados SQL Server"],
                    areas_envolvidas: ["Logística", "TI", "Fiscal", "Financeiro"]
                },
                rpas: [{
                    nome: "RPA Faturamento NF Couro - MI/ME",
                    descricao: "Robô responsável por processar 4 tipos de faturamento de notas fiscais de couro: Venda Exportação, Mercado Interno (com boleto), Cobertura e Químico. Valida dados do PDF contra SAP, faz faturamento, baixa documentos do Portal e atualiza JIRA.",
                    trigger: {
                        tipo: "AGENDAMENTO",
                        frequencia: "Diário, contínuo 24h, todos os dias inclusive feriados",
                        volume_estimado: "Variável conforme e-mails/cards recebidos"
                    },
                    entrada: {
                        origem: "E-mail/JIRA (PDF Nota Fiscal anexo)",
                        dados: ["Nro. Confirmação SAP", "Tipo Nota Fiscal (1-VENDA EXPORTAÇÃO, 2-MERCADO INTERNO)", "Pés/Pallet", "Kg/Pallet", "Peso Líquido", "Placa Caminhão", "Motorista", "CPF", "Transportadora", "Peças", "Cliente"]
                    },
                    saida: {
                        destino: "SAP + Portal Minerva + JIRA + E-mail",
                        dados: ["Nota Fiscal emitida (PDF)", "XML da NF", "Boleto (Mercado Interno)", "Planilha de processamento"]
                    },
                    sistemas_utilizados: ["SAP Easy Access (VL02N, VF01, J1B3N, VA01, VL01N, ZFIBLT)", "Portal Minerva Foods", "E-mail Outlook", "JIRA", "API de Notas", "SQL Server"],
                    fluxo_execucao: [
                        "FLUXO COMUM - OBTENÇÃO DE DADOS:",
                        "Recuperar parâmetros do Tenant (credenciais, e-mails, pastas)",
                        "Monitorar e-mail/JIRA para chegada de solicitações com 'Nota Fiscal' no assunto",
                        "Baixar PDF da Nota Fiscal anexada",
                        "Validar tipo de solicitação pelo campo 'Tipo Nota Fiscal'",
                        "Extrair dados: Nro. Confirmação SAP, Pés, Kg, Peso Líquido, Placa, Motorista, CPF, Transportadora, Peças",
                        "---------------------------------------------",
                        "FLUXO 1 - VENDA EXPORTAÇÃO (ME):",
                        "Acessar SAP e executar VL02N - Modificar entrega com Nro. Confirmação SAP",
                        "Validar aba Picking: Material, Qtd.fornd., Qtd.picking vs PDF",
                        "Validar Peso bruto, Peso líquido nos detalhes do item",
                        "Validar aba Processamento Financeiro: CFOP = 7105/AA",
                        "Validar Campos Adicionais: Qtde. Estoque Real, Total de peças",
                        "Validar Cabeçalho > Parceiro: Transportadora, Placa, UF Placa, Motorista",
                        "Se divergência em campo editável: corrigir com valor do PDF",
                        "Se divergência em campo não editável: registrar erro, notificar, mover para fila problemas",
                        "Clicar em Registrar SM e copiar número da Entrega",
                        "Executar VF01 - Criar documento de faturamento e Salvar",
                        "Executar J1B3N - Exibir nota fiscal e copiar Nº 9 posições",
                        "Acessar Portal Minerva Foods ou API de Notas",
                        "Pesquisar por número da NF e baixar PDF e XML",
                        "Validar campos da nota: Emitente, Destinatário, Natureza Operação, Transportadora, Quantidade, Peso, CFOP",
                        "Validar cálculos: Valor Total = US$ * Dólar do dia",
                        "Anexar arquivos no JIRA e enviar e-mail com documentos",
                        "---------------------------------------------",
                        "FLUXO 2 - MERCADO INTERNO (MI):",
                        "Mesmo fluxo inicial de VL02N, VF01, J1B3N",
                        "CFOP para MI = 6105/AA (fora do estado) ou 5105/AA (dentro do estado)",
                        "Baixar PDF e XML do Portal",
                        "Verificar se nota possui campo Fatura/Duplicata",
                        "Se não possui: gerar boleto via ZFIBLT",
                        "Selecionar aplicativo de impressão conforme estado (ImprimirBoletosBT para SP, ImprimirBoletosLK outros)",
                        "Aguardar geração do boleto (até 15 minutos para fora do estado)",
                        "Validar dados do boleto: Data criação, Valor documento, Nro Documento, Sacador",
                        "Responder e-mail com PDF, XML e Boleto anexados",
                        "---------------------------------------------",
                        "FLUXO 3 - COBERTURA:",
                        "Receber e-mail com NF de fornecedor (ex: Interlatex, JBS)",
                        "Validar Identificação do Emitente, Destinatário = Minerva SA, Transportadora",
                        "Executar VA01 - Criar ordem cliente tipo ZRIN",
                        "Preencher: Emissor da ordem, Receb.mercad., Nº do pedido, Data do pedido",
                        "Informar Material e Quantidade da ordem",
                        "Validar CFOP = 5901/AA, marcar 'Não tem ICMS'",
                        "Processar Fornecedor e Centro receb.CV com códigos parametrizados",
                        "Executar VL01N - Criar entrega p/ordem de cliente",
                        "Preencher Depósito, Qtd.picking, Peso bruto/líquido, Volume, Transportadora",
                        "Registrar SM e executar VF01",
                        "Adicionar texto: 'COBERTURA REF. NF [número] - [data] - [fornecedor]'",
                        "Baixar PDF e XML do Portal e anexar no JIRA",
                        "---------------------------------------------",
                        "FLUXO 4 - QUÍMICO:",
                        "Fluxo similar ao Cobertura, mas com mensagem específica",
                        "Texto: 'MERCADORIA REMETIDA POR BRASICAL... CONFORME NF DE VENDA [código]'",
                        "Salvar na pasta INDUSTRIALIZAÇÕES com nome padrão",
                        "---------------------------------------------",
                        "FINALIZAÇÃO:",
                        "Registrar processamento no banco de dados",
                        "Criar planilha XLSX de resumo do dia",
                        "Enviar e-mail de conclusão com planilha anexa"
                    ],
                    excecoes: [
                        { codigo: "EX01", cenario: "Falhas no acesso ao SAP, Portal ou navegação", tratamento: "Notificar, avaliar continuidade ou encerrar" },
                        { codigo: "EX02", cenario: "Falta de informações ou inconsistências nos dados", tratamento: "Notificar, avaliar continuidade ou encerrar" },
                        { codigo: "EX03", cenario: "Erros na geração ou download de PDF/XML/Boleto", tratamento: "Notificar, avaliar continuidade ou encerrar" },
                        { codigo: "EX04", cenario: "Inconsistências na validação dos campos SAP vs PDF", tratamento: "Corrigir editáveis, encerrar se não editável, registrar erro" },
                        { codigo: "EX05", cenario: "Divergência nos dados do boleto (Mercado Interno)", tratamento: "Cancelar boleto, reiniciar processo de emissão" }
                    ],
                    dependencias: {
                        sistemas_obrigatorios: ["SAP Easy Access disponível", "Portal Minerva Foods acessível", "Serviço de e-mail ativo", "Banco de dados online"],
                        dados_obrigatorios: ["Credenciais SAP válidas", "E-mails com PDF de Nota Fiscal", "Parâmetros de CFOP configurados"]
                    }
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Identificação do Tipo de Nota", descricao: "Campo 'Tipo Nota Fiscal' define o fluxo", logica: "SE tipo = '1-VENDA EXPORTAÇÃO' ENTÃO fluxo_ME() SENÃO SE tipo = '2-MERCADO INTERNO' ENTÃO fluxo_MI()" },
                    { codigo: "RN-002", tipo: "VAL", titulo: "CFOP Venda Exportação", descricao: "Exportação usa CFOP 7105/AA", logica: "SE tipo = 'EXPORTACAO' ENTÃO cfop = '7105/AA'" },
                    { codigo: "RN-003", tipo: "VAL", titulo: "CFOP Mercado Interno", descricao: "MI fora do estado usa 6105/AA", logica: "SE tipo = 'MI' AND uf_destino != 'SP' ENTÃO cfop = '6105/AA'" },
                    { codigo: "RN-004", tipo: "VAL", titulo: "CFOP Cobertura/Químico", descricao: "Cobertura e Químico usam 5901/AA", logica: "SE tipo IN ('COBERTURA', 'QUIMICO') ENTÃO cfop = '5901/AA'" },
                    { codigo: "RN-005", tipo: "ACT", titulo: "Geração de Boleto MI", descricao: "Gerar boleto apenas se não existir Fatura/Duplicata", logica: "SE tipo = 'MI' AND fatura_duplicata IS NULL ENTÃO gerar_boleto()" },
                    { codigo: "RN-006", tipo: "INF", titulo: "Aplicativo Impressão Boleto", descricao: "SP usa BT, outros estados usam LK", logica: "SE titulo_email CONTAINS '(SOL)' ENTÃO app = 'ImprimirBoletosBT' SENÃO app = 'ImprimirBoletosLK'" },
                    { codigo: "RN-007", tipo: "VAL", titulo: "Validação Campos Editáveis", descricao: "Corrigir campos editáveis com valor do PDF", logica: "SE campo_editavel AND valor_sap != valor_pdf ENTÃO atualizar_sap(valor_pdf)" },
                    { codigo: "RN-008", tipo: "REST", titulo: "Campos Não Editáveis", descricao: "Divergência em campo não editável encerra processamento", logica: "SE NOT campo_editavel AND valor_sap != valor_pdf ENTÃO erro_encerrar()" },
                    { codigo: "RN-009", tipo: "ACT", titulo: "Texto Cobertura", descricao: "Adicionar referência da NF original", logica: "texto = 'COBERTURA REF. NF ' + num_nf + ' - ' + data + ' - ' + fornecedor" },
                    { codigo: "RN-010", tipo: "ACT", titulo: "Marcar Não Tem ICMS", descricao: "Cobertura e Químico marcam checkbox", logica: "SE tipo IN ('COBERTURA', 'QUIMICO') ENTÃO marcar('Não tem ICMS')" }
                ],
                integracoes: [
                    { codigo: "INT-001", sistema_externo: "SAP Easy Access", proposito: "Faturamento via VL02N, VF01, J1B3N, VA01, VL01N, ZFIBLT", direcao: "BIDIRECIONAL", protocolo: "Desktop/GUI" },
                    { codigo: "INT-002", sistema_externo: "Portal Minerva Foods", proposito: "Download de PDF e XML das notas emitidas", direcao: "ENTRADA", protocolo: "WEB/API" },
                    { codigo: "INT-003", sistema_externo: "API de Notas", proposito: "Busca alternativa de PDF e XML", direcao: "ENTRADA", protocolo: "API REST" },
                    { codigo: "INT-004", sistema_externo: "E-mail Outlook", proposito: "Recebimento de solicitações e envio de documentos", direcao: "BIDIRECIONAL", protocolo: "IMAP/SMTP" },
                    { codigo: "INT-005", sistema_externo: "JIRA", proposito: "Registro de cards, anexo de arquivos, atualização de status", direcao: "BIDIRECIONAL", protocolo: "API REST" },
                    { codigo: "INT-006", sistema_externo: "Banco de Dados SQL Server", proposito: "Controle e auditoria do processamento", direcao: "BIDIRECIONAL", protocolo: "SQL" }
                ],
                infraestrutura: {
                    servidores: [
                        { nome: "Servidor RPA", funcao: "Execução do robô IBM RPA", tipo: "APLICACAO" },
                        { nome: "Servidor BD", funcao: "Banco de dados SQL Server para controle", tipo: "BANCO" }
                    ],
                    bancos_dados: [
                        { nome: "RPA_Faturamento_MIME", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Tabela de controle de faturamento MI/ME com status, erros, arquivos" }
                    ],
                    tecnologias: ["IBM RPA (WDG)", "SAP GUI", "Google Chrome", "SQL Server", "API REST", "Outlook"]
                }
            }
        },
        {
            id: 'lancamento_fretes_email',
            keywords: ['lancamento', 'frete', 'email', 'dux', 'sap', 'integracao', 'fatura', 'invoice', 'exportlogistics', 'controle despesas', 'procedure', 'liberado', 'cancelado', 'processamento', 'despesas exportacao', 'gerar titulos', 'chave referencia'],
            category: 'FINANCEIRO',
            nome: 'Lançamento dos Fretes por E-mail',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Lançamento dos Fretes por E-mail",
                    objetivo: "Obter faturas de frete aptas a serem integradas ao SAP via procedure do cliente, acessar sistema DUX módulo ExportLogistics, efetuar integração das faturas liberadas com o SAP, registrar status e gerar relatório de processamento. Segunda parte do processo (primeira é Leitura dos Fretes por E-Mail).",
                    justificativa: "Automatizar a integração de faturas de frete com o SAP, garantindo controle de status (Liberado, Não Liberado, Cancelado/Abortado), rastreabilidade completa e relatório de acompanhamento.",
                    beneficios: {
                        tangiveis: ["Integração automática de faturas com SAP", "Controle de status de liberação", "Relatório diário de processamento", "Rastreabilidade completa via banco de dados"],
                        intangiveis: ["Eliminação de erros manuais de integração", "Visibilidade do status das faturas", "Histórico de processamento para auditoria"]
                    },
                    sistemas_envolvidos: ["Sistema DUX (ExportLogistics)", "Banco de Dados SQL Server (procedure cliente)", "E-mail Outlook"],
                    areas_envolvidas: ["TI", "Financeiro", "Logística"]
                },
                rpas: [{
                    nome: "RPA Lançamento Fretes E-mail",
                    descricao: "Robô responsável por consultar procedure do cliente para obter faturas liberadas, acessar DUX ExportLogistics, integrar faturas com SAP via Controle Despesas, tratar 3 status (Liberado, Não Liberado, Cancelado), registrar resultados e enviar relatório.",
                    trigger: {
                        tipo: "AGENDAMENTO",
                        frequencia: "Diário, 1x ao dia (08h ou após 1º robô)",
                        volume_estimado: "Variável conforme faturas liberadas"
                    },
                    entrada: {
                        origem: "Procedure cliente (dbintegracao.dbo.spr_list_integration_pending_process_invoice_rpa) + Tabela TB_FaturaFrete",
                        dados: ["Invoice", "Ind_Process (0-Não Liberado, 1-Liberado, 2-Cancelado/Abortado)", "Status"]
                    },
                    saida: {
                        destino: "SAP (via DUX) + Banco de Dados + E-mail",
                        dados: ["Faturas integradas no SAP", "Chave Referência SAP", "Planilha XLSX com abas Processadas e Aguardando"]
                    },
                    sistemas_utilizados: ["Sistema DUX Desktop (ExportLogistics)", "Banco de Dados SQL Server", "Procedure Cliente", "Outlook"],
                    fluxo_execucao: [
                        "Recuperar parâmetros do Tenant (credenciais DUX, BD, e-mails, pasta servidor)",
                        "Executar limpeza de arquivos antigos na pasta do servidor",
                        "Registrar início no banco de dados de controle",
                        "VERIFICAÇÃO DE DADOS:",
                        "Consultar tabela TB_FaturaFrete onde Finalizada='Não', Enviada='Sim', LancadoSAP='Não'",
                        "Executar procedure do cliente spr_list_integration_pending_process_invoice_rpa",
                        "Contar registros com Ind_Process='Liberado'",
                        "Se não há registros liberados ou pendentes: registrar, enviar e-mail e encerrar",
                        "ACESSO AO DUX:",
                        "Abrir sistema DUX Desktop e fazer login (Ambiente Produção)",
                        "Acessar módulo ExportLogistics",
                        "Se aparecer atualização de versão: confirmar e aguardar",
                        "Clicar no ícone 'Controle Despesas'",
                        "Clicar no botão 'Integrar SAP'",
                        "Na tela 'Geração e Processamento de Despesas de Exportação', clicar em 'Gerar Títulos'",
                        "Selecionar usuário da automação na lista e confirmar",
                        "Aguardar carga dos dados",
                        "LOOP DE PROCESSAMENTO POR FATURA:",
                        "Executar procedure novamente para obter status atualizado",
                        "TRATAMENTO STATUS 'NÃO LIBERADO' (Ind_Process=0):",
                        "  - Localizar fatura na TB_FaturaFrete",
                        "  - Atualizar coluna Observação com Status da procedure",
                        "  - Criar registro em TB_LogRetornoFatura",
                        "  - Ir para próxima fatura",
                        "TRATAMENTO STATUS 'CANCELADO/ABORTADO' (Ind_Process=2):",
                        "  - Localizar fatura na TB_FaturaFrete",
                        "  - Atualizar Finalizada='Sim', Observação com Status",
                        "  - Criar registro em TB_LogRetornoFatura",
                        "  - Ir para próxima fatura (não processa mais)",
                        "TRATAMENTO STATUS 'LIBERADO' (Ind_Process=1):",
                        "  - Localizar fatura na TB_FaturaFrete",
                        "  - Se já Finalizada='Sim': pular",
                        "  - Informar código da Invoice no campo Documento",
                        "  - Clicar em Pesquisar",
                        "  - Clicar direito no primeiro item > Selecionar Todos",
                        "  - Clicar direito > Integrar Documento(s)",
                        "  - Confirmar integração e aguardar processamento",
                        "  - Verificar se Desc.Status mudou para 'Integrada'",
                        "  - Se não integrou: tentar novamente",
                        "  - Clicar em Editar na linha do registro",
                        "  - Obter 'Chave Referência' (10 primeiros caracteres)",
                        "  - Atualizar TB_FaturaFrete: Finalizada='Sim', LancadoSAP='Sim', RegistroSAP=Chave",
                        "  - Criar registro em TB_LogRetornoFatura e TB_LogLiberaFatura",
                        "Ao concluir todos: fechar telas do DUX",
                        "RELATÓRIO:",
                        "Criar planilha XLSX com nome padrão RPA-LancFretesEmail_DDMMAA-HHMM",
                        "Aba 'Processadas': Data/Hora, Invoice, SAP, Chave SAP, Finalizada, Observação, Status Retorno",
                        "Aba 'Aguardando': Data/Hora, Invoice, Emissão, Vencimento, Valor, Status Retorno",
                        "Salvar planilha na pasta do servidor",
                        "Enviar e-mail de conclusão com planilha anexa"
                    ],
                    excecoes: [
                        { codigo: "EX01", cenario: "Falhas no sistema DUX (acesso, navegação, clique)", tratamento: "Notificar, encerrar processamento" },
                        { codigo: "EX02", cenario: "Usuário ou senha inválidos (DUX ou BD)", tratamento: "Notificar, encerrar processamento" },
                        { codigo: "EX03", cenario: "Problemas no banco de dados (select, insert, update, procedure)", tratamento: "Notificar, encerrar processamento" }
                    ],
                    dependencias: {
                        sistemas_obrigatorios: ["Sistema DUX disponível", "Banco de dados online", "Procedure do cliente acessível", "Serviço de e-mail ativo"],
                        dados_obrigatorios: ["Credenciais DUX válidas", "Faturas na TB_FaturaFrete", "Procedure retornando dados"]
                    }
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Status Não Liberado", descricao: "Ind_Process=0 não processa, apenas registra", logica: "SE Ind_Process = 0 ENTÃO atualizar_observacao() E criar_log() E pular()" },
                    { codigo: "RN-002", tipo: "VAL", titulo: "Status Cancelado/Abortado", descricao: "Ind_Process=2 finaliza sem processar", logica: "SE Ind_Process = 2 ENTÃO Finalizada='Sim' E criar_log() E pular()" },
                    { codigo: "RN-003", tipo: "ACT", titulo: "Status Liberado", descricao: "Ind_Process=1 executa integração com SAP", logica: "SE Ind_Process = 1 ENTÃO integrar_sap()" },
                    { codigo: "RN-004", tipo: "VAL", titulo: "Verificação de Fatura Já Finalizada", descricao: "Não reprocessar faturas já finalizadas", logica: "SE Finalizada = 'Sim' ENTÃO pular()" },
                    { codigo: "RN-005", tipo: "ACT", titulo: "Retry de Integração", descricao: "Se não integrou, tentar novamente", logica: "SE Desc_Status != 'Integrada' ENTÃO retry_integracao()" },
                    { codigo: "RN-006", tipo: "ACT", titulo: "Captura Chave SAP", descricao: "Extrair 10 primeiros caracteres da Chave Referência", logica: "RegistroSAP = substring(Chave_Referencia, 0, 10)" },
                    { codigo: "RN-007", tipo: "TIME", titulo: "Retenção de Arquivos", descricao: "Excluir arquivos antigos conforme parâmetro", logica: "SE dias_criacao > param_dias ENTÃO excluir()" },
                    { codigo: "RN-008", tipo: "ACT", titulo: "Compartilhamento de Tabela", descricao: "TB_FaturaFrete compartilhada com 1º RPA do processo", logica: "usar_tabela_compartilhada('TB_FaturaFrete')" }
                ],
                integracoes: [
                    { codigo: "INT-001", sistema_externo: "Sistema DUX (ExportLogistics)", proposito: "Integração de faturas com SAP via Controle Despesas", direcao: "BIDIRECIONAL", protocolo: "Desktop/GUI" },
                    { codigo: "INT-002", sistema_externo: "Procedure Cliente", proposito: "Consulta de status de liberação das faturas", direcao: "ENTRADA", protocolo: "SQL (Stored Procedure)" },
                    { codigo: "INT-003", sistema_externo: "Banco de Dados SQL Server", proposito: "Controle e auditoria (TB_FaturaFrete, TB_LogRetornoFatura, TB_LogLiberaFatura)", direcao: "BIDIRECIONAL", protocolo: "SQL" },
                    { codigo: "INT-004", sistema_externo: "E-mail Outlook", proposito: "Envio de relatório de conclusão e notificações", direcao: "SAIDA", protocolo: "SMTP" }
                ],
                infraestrutura: {
                    servidores: [
                        { nome: "Servidor RPA", funcao: "Execução do robô IBM RPA", tipo: "APLICACAO" },
                        { nome: "Servidor BD", funcao: "Banco de dados SQL Server para controle", tipo: "BANCO" },
                        { nome: "Pasta Servidor", funcao: "Armazenamento de planilhas de processamento", tipo: "ARQUIVO" }
                    ],
                    bancos_dados: [
                        { nome: "TB_FaturaFrete", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Tabela compartilhada com 1º RPA - dados das faturas" },
                        { nome: "TB_LogRetornoFatura", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Log de retorno de cada processamento" },
                        { nome: "TB_LogLiberaFatura", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Log de faturas liberadas e integradas" }
                    ],
                    tecnologias: ["IBM RPA (WDG)", "Sistema DUX Desktop", "SQL Server", "Stored Procedure", "Outlook"]
                }
            }
        },
        {
            id: 'leitura_fretes_email',
            keywords: ['leitura', 'frete', 'email', 'pdf', 'csv', 'python', 'json', 'base64', 'invoice', 'container', 'unishipping', 'yang ming', 'sea lead', 'hmm', 'procedure', 'fornecedor', 'transportadora', 'fatura', 'carrier', 'bl number', 'bank details', 'shipper'],
            category: 'FINANCEIRO',
            nome: 'Leitura dos Fretes por E-mail',
            isDefault: true,
            exemplo: {
                projeto: {
                    nome: "Leitura dos Fretes por E-mail",
                    objetivo: "Acessar caixa de e-mail, ler e-mails de fornecedores do grupo UniShipping (8 empresas), acessar links das faturas, baixar PDFs, executar aplicativo Python para converter PDF em CSV, extrair dados (Invoice, Carrier, Containers, Services, Bank Details), gravar em banco de dados, e enviar via procedure JSON + PDF base64. Primeira parte do processo (segunda é Lançamento dos Fretes).",
                    justificativa: "Automatizar a leitura e extração de dados de faturas de frete de múltiplos fornecedores com layouts diferentes, garantindo validação de expedidor/fornecedor, rastreabilidade e preparação dos dados para integração SAP.",
                    beneficios: {
                        tangiveis: ["Leitura automática de faturas de 8 fornecedores", "Extração de dados via Python/CSV", "Envio estruturado via JSON", "Validação prévia de expedidor e fornecedor"],
                        intangiveis: ["Padronização da extração de diferentes layouts", "Antecipação de erros antes do lançamento", "Rastreabilidade completa do processo"]
                    },
                    sistemas_envolvidos: ["E-mail (caixa de leitura)", "Navegador Chrome (links faturas)", "Aplicativo Python (PDF_Reader.exe)", "Banco de Dados SQL Server", "Procedure Cliente"],
                    areas_envolvidas: ["TI", "Financeiro", "Logística"]
                },
                rpas: [{
                    nome: "RPA Leitura Fretes E-mail",
                    descricao: "Robô responsável por ler e-mails de fornecedores UniShipping, baixar PDFs via links, executar Python para gerar CSV, extrair dados estruturados, validar expedidor/fornecedor, gravar em banco e enviar via procedure JSON com PDF em base64.",
                    trigger: {
                        tipo: "AGENDAMENTO",
                        frequencia: "Diário, 1x ao dia (06h)",
                        volume_estimado: "Variável conforme e-mails recebidos"
                    },
                    entrada: {
                        origem: "E-mail (pastas por fornecedor) + Links PDF + CSV gerado por Python",
                        dados: ["Remetente e-mail", "Link fatura PDF", "Invoice Number", "Carrier", "Issue Date", "Due Date", "Total", "Containers", "BL Number", "Services/Charges", "Bank Details"]
                    },
                    saida: {
                        destino: "Banco de Dados + Procedure Cliente (JSON + base64)",
                        dados: ["Registros nas tabelas TB_FaturaFrete, TB_FaturaItem, TB_FaturaContainer, TB_DadosBcoFretes", "JSON estruturado com PDF em base64", "Planilha XLSX com abas Faturas e Itens"]
                    },
                    sistemas_utilizados: ["E-mail Outlook/Web", "Google Chrome", "Python (PDF_Reader.exe)", "Banco de Dados SQL Server", "Procedure Cliente"],
                    fluxo_execucao: [
                        "Recuperar parâmetros do Tenant (credenciais e-mail leitura/envio, pastas, aplicativo Python)",
                        "Executar limpeza de arquivos antigos na pasta do servidor",
                        "Registrar início no banco de dados de controle",
                        "LEITURA DOS E-MAILS:",
                        "Conectar à caixa de e-mail de leitura das faturas",
                        "Navegar até pasta específica do fornecedor (conforme TB_FornecFretes)",
                        "Obter e-mails não lidos cujo remetente/domínio está na tabela de fornecedores ativos",
                        "Para cada e-mail: abrir e obter link(s) da(s) fatura(s) no corpo",
                        "Identificar links que terminam com '.pdf' (texto padrão: 'Link to download BL/Invoice(s)')",
                        "DOWNLOAD E PROCESSAMENTO PDF:",
                        "Abrir navegador Chrome e acessar link da fatura",
                        "Efetuar download do PDF para pasta do servidor",
                        "Executar aplicativo Python (PDF_Reader.exe) com parâmetros:",
                        "  - Arquivo PDF de entrada",
                        "  - Arquivo CSV de saída (mesmo nome, extensão .csv)",
                        "Abrir CSV gerado pelo Python",
                        "EXTRAÇÃO DE DADOS DO CSV:",
                        "Obter nome do fornecedor (primeira informação do CSV)",
                        "Validar se fornecedor existe e está ativo na TB_FornecFretes",
                        "Obter Shipper/Consignee e CNPJ do contratante",
                        "Validar se expedidor existe e está ativo na TB_Expedidora",
                        "Extrair campos: Invoice Number, Carrier, Issue Date, Due Date, Total",
                        "Verificar se Invoice já existe na TB_FaturaFrete (evitar duplicação)",
                        "Criar registro na TB_FaturaFrete com todos os dados",
                        "Extrair Containers (pode ter nenhum, um ou vários)",
                        "Criar registros na TB_FaturaContainer",
                        "Extrair Services/Items: BL Number, Charges/Expense, Amount/Value, Moeda",
                        "Criar registros na TB_FaturaItem",
                        "Se fornecedor tem DadosBancarios='Sim': extrair Bank Details",
                        "  - Bank Name, Bank Address, Account Name, NBR/Branch, Bank Account",
                        "  - Instructions 1-4",
                        "Criar registro na TB_DadosBcoFretes",
                        "ENVIO VIA PROCEDURE:",
                        "Para cada fatura não enviada (Enviada='Não'):",
                        "Montar JSON com estrutura definida:",
                        "  - error_code (array: 0=sem erro, 1=sem itens, 2=sem dados bancários, 3=sem container)",
                        "  - company_name, shipper, cnpj, invoice_number, carrier, dates",
                        "  - company_bank_code/info da TB_InfoBancaria",
                        "  - containers (array), services (array), bank_details (object)",
                        "  - invoice_base64 (PDF convertido para base64)",
                        "Executar procedure: EXEC dbintegracao.dbo.spr_insert_process_invoice_rpa @p_json",
                        "Verificar retorno (true/false) e atualizar status Enviada",
                        "RELATÓRIO:",
                        "Criar planilha XLSX com nome padrão RPA-FretesEmail-Leitura_DDMMAA-HHMM",
                        "Aba 'Faturas': Data, Fornecedor, Contratante, Invoice, Emissão, Vencimento, Carrier, Valor, Arquivo, Email, Enviada, Observação",
                        "Aba 'Itens': Invoice, BL_Number, Serviço, Moeda, Valor, Observação",
                        "Salvar planilha e enviar e-mail de conclusão"
                    ],
                    excecoes: [
                        { codigo: "EX01", cenario: "Falhas no processamento de e-mails, links ou downloads", tratamento: "Notificar, encerrar processamento" },
                        { codigo: "EX02", cenario: "Usuário ou senha inválidos (e-mail ou BD)", tratamento: "Notificar, encerrar processamento" },
                        { codigo: "EX03", cenario: "Problemas no banco de dados", tratamento: "Notificar, encerrar processamento" },
                        { codigo: "EX04", cenario: "Arquivo CSV com problemas (vazio, formato incorreto)", tratamento: "Notificar, ir para próximo e-mail" },
                        { codigo: "EX05", cenario: "Falhas na aplicação Python (não encontrado, sem retorno)", tratamento: "Notificar, encerrar processamento" }
                    ],
                    dependencias: {
                        sistemas_obrigatorios: ["Caixa de e-mail acessível", "Links das faturas respondendo", "Aplicativo Python funcionando", "Banco de dados online", "Procedure do cliente disponível"],
                        dados_obrigatorios: ["Credenciais e-mail válidas", "Fornecedores cadastrados na TB_FornecFretes", "Expedidores cadastrados na TB_Expedidora", "Canais bancários na TB_InfoBancaria"]
                    }
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Validação de Fornecedor", descricao: "Fornecedor deve existir e estar ativo", logica: "SE fornecedor NOT IN TB_FornecFretes OR Ativo='Não' ENTÃO pular_email()" },
                    { codigo: "RN-002", tipo: "VAL", titulo: "Validação de Expedidor", descricao: "CNPJ do expedidor deve existir e estar ativo", logica: "SE cnpj NOT IN TB_Expedidora OR Ativa='Não' ENTÃO pular_email()" },
                    { codigo: "RN-003", tipo: "VAL", titulo: "Validação de Duplicidade", descricao: "Invoice não pode já existir para o fornecedor", logica: "SE invoice EXISTS IN TB_FaturaFrete ENTÃO pular_email()" },
                    { codigo: "RN-004", tipo: "ACT", titulo: "Leitura por Fornecedor", descricao: "Cada fornecedor tem layout específico de fatura", logica: "layout = get_layout_by_fornecedor(nome_fornecedor)" },
                    { codigo: "RN-005", tipo: "ACT", titulo: "Conversão PDF via Python", descricao: "Executar PDF_Reader.exe para gerar CSV", logica: "PDF_Reader.exe input.pdf output.csv" },
                    { codigo: "RN-006", tipo: "ACT", titulo: "Dados Bancários Condicionais", descricao: "Só extrai se DadosBancarios='Sim' no fornecedor", logica: "SE TB_FornecFretes.DadosBancarios = 'Sim' ENTÃO extrair_bank_details()" },
                    { codigo: "RN-007", tipo: "ACT", titulo: "BL Number Propagação", descricao: "BL não se repete, usar anterior se linha vazia", logica: "SE bl_number IS EMPTY ENTÃO bl_number = bl_anterior" },
                    { codigo: "RN-008", tipo: "ACT", titulo: "JSON Error Code", descricao: "Array indica erros: 0=ok, 1=sem itens, 2=sem banco, 3=sem container", logica: "SE sem_erros ENTÃO [0] SENÃO [códigos_erro]" },
                    { codigo: "RN-009", tipo: "ACT", titulo: "PDF em Base64", descricao: "Converter PDF para base64 para envio no JSON", logica: "invoice_base64 = base64_encode(pdf_file)" },
                    { codigo: "RN-010", tipo: "TIME", titulo: "Retenção de Arquivos", descricao: "Excluir arquivos antigos conforme parâmetro", logica: "SE dias_criacao > param_dias ENTÃO excluir()" }
                ],
                integracoes: [
                    { codigo: "INT-001", sistema_externo: "E-mail (Caixa Leitura)", proposito: "Leitura de e-mails de fornecedores com links de faturas", direcao: "ENTRADA", protocolo: "IMAP/Web" },
                    { codigo: "INT-002", sistema_externo: "Links Web (Faturas PDF)", proposito: "Download dos PDFs das faturas via navegador", direcao: "ENTRADA", protocolo: "HTTP/HTTPS" },
                    { codigo: "INT-003", sistema_externo: "Aplicativo Python", proposito: "Conversão de PDF para CSV estruturado", direcao: "BIDIRECIONAL", protocolo: "Linha de Comando" },
                    { codigo: "INT-004", sistema_externo: "Procedure Cliente", proposito: "Recepção dos dados via JSON + PDF base64", direcao: "SAIDA", protocolo: "SQL (Stored Procedure)" },
                    { codigo: "INT-005", sistema_externo: "Banco de Dados SQL Server", proposito: "Armazenamento de faturas, itens, containers, dados bancários", direcao: "BIDIRECIONAL", protocolo: "SQL" }
                ],
                infraestrutura: {
                    servidores: [
                        { nome: "Servidor RPA", funcao: "Execução do robô IBM RPA", tipo: "APLICACAO" },
                        { nome: "Servidor BD", funcao: "Banco de dados SQL Server para controle", tipo: "BANCO" },
                        { nome: "Pasta Servidor", funcao: "Armazenamento de PDFs e CSVs", tipo: "ARQUIVO" }
                    ],
                    bancos_dados: [
                        { nome: "TB_FornecFretes", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Cadastro de fornecedores (8 do grupo UniShipping)" },
                        { nome: "TB_Expedidora", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Cadastro de expedidores/contratantes" },
                        { nome: "TB_InfoBancaria", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Canais bancários por fornecedor" },
                        { nome: "TB_FaturaFrete", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Dados principais das faturas (compartilhada com 2º RPA)" },
                        { nome: "TB_FaturaItem", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Itens/serviços de cada fatura" },
                        { nome: "TB_FaturaContainer", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Containers de cada fatura" },
                        { nome: "TB_DadosBcoFretes", servidor: "SQL Server", tipo: "SQL_SERVER", funcao: "Dados bancários extraídos da fatura" }
                    ],
                    tecnologias: ["IBM RPA (WDG)", "Google Chrome", "Python (PDF_Reader.exe)", "SQL Server", "JSON", "Base64", "Outlook"]
                }
            }
        }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // GESTÃO DE EXEMPLOS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Carrega todos os exemplos (padrão + customizados)
     */
    function getAllExamples() {
        const customExamples = loadCustomExamples();
        return [...DEFAULT_EXAMPLES, ...customExamples];
    }

    /**
     * Carrega exemplos customizados do localStorage
     */
    function loadCustomExamples() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Erro ao carregar exemplos customizados:', e);
            return [];
        }
    }

    /**
     * Salva exemplos customizados no localStorage
     */
    function saveCustomExamples(examples) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(examples));
            return true;
        } catch (e) {
            console.error('Erro ao salvar exemplos:', e);
            return false;
        }
    }

    /**
     * Adiciona novo exemplo ao repositório
     */
    function addExample(example) {
        if (!example.id || !example.keywords || !example.nome) {
            throw new Error('Exemplo inválido: requer id, keywords e nome');
        }

        const customExamples = loadCustomExamples();
        
        // Verificar se já existe
        const exists = customExamples.find(e => e.id === example.id) || 
                       DEFAULT_EXAMPLES.find(e => e.id === example.id);
        if (exists) {
            throw new Error(`Exemplo com id "${example.id}" já existe`);
        }

        example.isDefault = false;
        example.createdAt = new Date().toISOString();
        customExamples.push(example);
        
        saveCustomExamples(customExamples);
        return example;
    }

    /**
     * Atualiza um exemplo existente (apenas customizados)
     */
    function updateExample(id, updates) {
        const customExamples = loadCustomExamples();
        const index = customExamples.findIndex(e => e.id === id);
        
        if (index === -1) {
            throw new Error('Exemplo não encontrado ou é padrão (não editável)');
        }

        customExamples[index] = { ...customExamples[index], ...updates, updatedAt: new Date().toISOString() };
        saveCustomExamples(customExamples);
        return customExamples[index];
    }

    /**
     * Remove um exemplo (apenas customizados)
     */
    function removeExample(id) {
        const customExamples = loadCustomExamples();
        const index = customExamples.findIndex(e => e.id === id);
        
        if (index === -1) {
            throw new Error('Exemplo não encontrado ou é padrão (não removível)');
        }

        customExamples.splice(index, 1);
        saveCustomExamples(customExamples);
        return true;
    }

    /**
     * Importa exemplo de JSON
     */
    function importFromJSON(jsonString) {
        try {
            const example = JSON.parse(jsonString);
            return addExample(example);
        } catch (e) {
            throw new Error('JSON inválido: ' + e.message);
        }
    }

    /**
     * Exporta exemplo para JSON
     */
    function exportToJSON(id) {
        const allExamples = getAllExamples();
        const example = allExamples.find(e => e.id === id);
        if (!example) throw new Error('Exemplo não encontrado');
        return JSON.stringify(example, null, 2);
    }

    /**
     * Cria exemplo a partir de texto (estrutura básica)
     */
    function createFromText(text, metadata = {}) {
        const id = metadata.id || 'custom_' + Date.now();
        const keywords = extractKeywords(text);
        
        return {
            id: id,
            keywords: keywords,
            category: metadata.category || 'OUTROS',
            nome: metadata.nome || 'Exemplo Customizado',
            descricao_original: text,
            isDefault: false,
            exemplo: {
                projeto: {
                    nome: metadata.nome || 'Projeto',
                    objetivo: text.substring(0, 500)
                },
                rpas: [],
                regras_negocio: []
            }
        };
    }

    /**
     * Extrai keywords do texto automaticamente
     */
    function extractKeywords(text) {
        const stopWords = ['de', 'da', 'do', 'para', 'com', 'em', 'que', 'uma', 'um', 'os', 'as', 'no', 'na', 'por', 'ser', 'ao', 'ou', 'e', 'o', 'a'];
        const words = text.toLowerCase()
            .replace(/[^a-záàâãéèêíïóôõöúçñ\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.includes(w));
        
        // Contar frequência
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        
        // Retornar top 10
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BUSCA E MATCHING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Busca exemplos relevantes baseado no texto
     */
    function findRelevantExamples(userText, maxResults = 2) {
        const allExamples = getAllExamples();
        const textLower = userText.toLowerCase();
        const scores = [];

        allExamples.forEach(example => {
            let score = 0;
            
            // Pontuação por keywords
            example.keywords.forEach(keyword => {
                if (textLower.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            });

            // Pontuação por categoria
            if (example.category && textLower.includes(example.category.toLowerCase())) {
                score += 5;
            }

            // Pontuação por nome
            if (example.nome && textLower.includes(example.nome.toLowerCase().split(' ')[0])) {
                score += 8;
            }

            if (score > 0) {
                scores.push({ example, score });
            }
        });

        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, maxResults).map(s => s.example);
    }

    /**
     * Gera contexto para o prompt da IA
     */
    function generateExamplesContext(userText) {
        const relevantExamples = findRelevantExamples(userText, 1);
        
        if (relevantExamples.length === 0) {
            return '';
        }

        let context = `

═══════════════════════════════════════════════════════════════════════════════
EXEMPLOS DE PDDs APROVADOS (USE COMO REFERÊNCIA DE QUALIDADE E ESTILO)
═══════════════════════════════════════════════════════════════════════════════

`;

        relevantExamples.forEach((ex, i) => {
            context += `
### EXEMPLO ${i + 1}: ${ex.nome}
Categoria: ${ex.category}

**Objetivo (exemplo de qualidade):**
${ex.exemplo?.projeto?.objetivo || 'N/A'}

**Benefícios (exemplo de estrutura):**
Tangíveis: ${ex.exemplo?.projeto?.beneficios?.tangiveis?.join('; ') || 'N/A'}
Intangíveis: ${ex.exemplo?.projeto?.beneficios?.intangiveis?.join('; ') || 'N/A'}

**Fluxo de Execução (exemplo de detalhamento - primeiros 10 passos):**
${ex.exemplo?.rpas?.[0]?.fluxo_execucao?.slice(0, 10).map((f, j) => `${j + 1}. ${f}`).join('\n') || 'N/A'}

**Regras de Negócio (exemplo - primeiras 5):**
${ex.exemplo?.regras_negocio?.slice(0, 5).map(rn => `- ${rn.codigo}: ${rn.titulo}`).join('\n') || 'N/A'}

**Exceções (exemplo - primeiras 5):**
${ex.exemplo?.rpas?.[0]?.excecoes?.slice(0, 5).map(e => `- ${e.cenario}: ${e.tratamento}`).join('\n') || 'N/A'}

---
`;
        });

        context += `
INSTRUÇÃO: Use os exemplos acima como REFERÊNCIA de qualidade, estilo e nível de detalhamento.
Adapte ao contexto específico do projeto do usuário, não copie literalmente.
═══════════════════════════════════════════════════════════════════════════════

`;

        return context;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ESTATÍSTICAS E INFO
    // ═══════════════════════════════════════════════════════════════════════════

    function getCategories() {
        const allExamples = getAllExamples();
        return [...new Set(allExamples.map(e => e.category).filter(Boolean))];
    }

    function getExampleById(id) {
        return getAllExamples().find(e => e.id === id);
    }

    function getStats() {
        const allExamples = getAllExamples();
        const customExamples = loadCustomExamples();
        
        return {
            total: allExamples.length,
            default: DEFAULT_EXAMPLES.length,
            custom: customExamples.length,
            categories: getCategories(),
            keywords: allExamples.reduce((acc, e) => acc + (e.keywords?.length || 0), 0)
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        // Gestão
        getAllExamples,
        addExample,
        updateExample,
        removeExample,
        importFromJSON,
        exportToJSON,
        createFromText,
        
        // Busca
        findRelevantExamples,
        generateExamplesContext,
        
        // Info
        getCategories,
        getExampleById,
        getStats
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RAGSystem;
}
