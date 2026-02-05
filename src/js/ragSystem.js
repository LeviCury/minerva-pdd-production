/**
 * MINERVA PDD GENERATOR - RAG System Module
 * Sistema de Retrieval Augmented Generation para PDDs
 * 
 * Armazena exemplos de PDDs aprovados e usa para melhorar a geração
 */

const RAGSystem = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // BANCO DE EXEMPLOS DE PDDs
    // ═══════════════════════════════════════════════════════════════════════════

    const PDD_EXAMPLES = [
        {
            id: 'conciliacao_bancaria',
            keywords: ['banco', 'bancário', 'conciliação', 'extrato', 'financeiro', 'tesouraria', 'itau', 'bradesco', 'santander'],
            category: 'FINANCEIRO',
            exemplo: {
                projeto: {
                    nome: "Automação de Conciliação Bancária",
                    objetivo: "Automatizar o processo diário de conciliação entre extratos bancários e lançamentos contábeis no SAP, eliminando o trabalho manual e reduzindo erros de reconciliação.",
                    beneficios: {
                        tangiveis: [
                            "Redução de 4 horas diárias de trabalho manual",
                            "Eliminação de 95% dos erros de conciliação",
                            "Processamento de 500+ transações em 15 minutos"
                        ],
                        intangiveis: [
                            "Maior confiabilidade nos dados financeiros",
                            "Liberação da equipe para análises estratégicas"
                        ]
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
                        { cenario: "Portal bancário indisponível", tratamento: "Retry em 30min, máx 3 tentativas, após alerta" },
                        { cenario: "Transação sem correspondência", tratamento: "Registrar em planilha de pendências" },
                        { cenario: "Diferença de valor < R$0,50", tratamento: "Conciliar automaticamente (arredondamento)" }
                    ]
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Tolerância de Valor", descricao: "Diferenças de até R$ 0,50 são aceitas como arredondamento", logica: "SE ABS(valor_banco - valor_sap) <= 0.50 ENTÃO conciliar_automatico()" },
                    { codigo: "RN-002", tipo: "REST", titulo: "Janela de Conciliação", descricao: "Transações são buscadas em janela de D-5 a D+2", logica: "data_busca BETWEEN (data_transacao - 5) AND (data_transacao + 2)" },
                    { codigo: "RN-003", tipo: "INF", titulo: "Tarifas Bancárias", descricao: "Tarifas são conciliadas automaticamente com conta contábil específica", logica: "SE tipo = 'TARIFA' ENTÃO conta_destino = '4.1.3.001'" }
                ]
            }
        },
        {
            id: 'nfe_entrada',
            keywords: ['nota fiscal', 'nfe', 'nf-e', 'entrada', 'xml', 'danfe', 'fiscal', 'tributário', 'sefaz'],
            category: 'FISCAL',
            exemplo: {
                projeto: {
                    nome: "Automação de Entrada de NF-e",
                    objetivo: "Automatizar o download, validação e lançamento de Notas Fiscais Eletrônicas de entrada no SAP, garantindo compliance fiscal e agilidade no processo.",
                    beneficios: {
                        tangiveis: [
                            "Redução de 6 horas diárias no processo de entrada",
                            "Zero atrasos em lançamentos fiscais",
                            "Eliminação de multas por notas não manifestadas"
                        ],
                        intangiveis: [
                            "Conformidade fiscal garantida",
                            "Rastreabilidade completa do processo"
                        ]
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
                        "Manifestar ciência da operação na SEFAZ",
                        "Arquivar XML em pasta estruturada"
                    ],
                    excecoes: [
                        { cenario: "Fornecedor não cadastrado", tratamento: "Enviar para fila de cadastro, não lançar" },
                        { cenario: "Divergência de valor > 5%", tratamento: "Encaminhar para aprovação manual" },
                        { cenario: "Certificado expirado", tratamento: "Alertar TI imediatamente, pausar processo" }
                    ]
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "VAL", titulo: "Validação de CNPJ", descricao: "Fornecedor deve estar ativo no cadastro SAP", logica: "SE fornecedor.status != 'ATIVO' ENTÃO rejeitar_nfe()" },
                    { codigo: "RN-002", tipo: "CALC", titulo: "Conferência de Impostos", descricao: "Recalcular impostos e comparar com XML", logica: "diferenca_imposto = ABS(calculado - xml); SE diferenca > 1.00 ENTÃO alertar()" },
                    { codigo: "RN-003", tipo: "TIME", titulo: "Prazo de Manifestação", descricao: "Manifestar NF-e em até 48h do recebimento", logica: "SE (agora - data_emissao) > 48h ENTÃO prioridade = 'URGENTE'" }
                ]
            }
        },
        {
            id: 'folha_pagamento',
            keywords: ['folha', 'pagamento', 'rh', 'recursos humanos', 'salário', 'holerite', 'benefícios', 'ponto', 'frequência'],
            category: 'RH',
            exemplo: {
                projeto: {
                    nome: "Automação de Processamento de Folha",
                    objetivo: "Automatizar a coleta de dados variáveis, cálculo de benefícios e geração de arquivos bancários para pagamento de folha.",
                    beneficios: {
                        tangiveis: [
                            "Redução de 3 dias no fechamento da folha",
                            "Eliminação de erros de digitação",
                            "Processamento de 5.000 colaboradores em 2 horas"
                        ],
                        intangiveis: [
                            "Maior satisfação dos colaboradores",
                            "Conformidade trabalhista garantida"
                        ]
                    }
                },
                rpas: [{
                    nome: "RPA Folha de Pagamento",
                    trigger: { tipo: "MANUAL", frequencia: "Mensal (dia 20)", volume_estimado: "5.000 colaboradores" },
                    fluxo_execucao: [
                        "Coletar marcações de ponto do sistema de frequência",
                        "Calcular horas extras, faltas e atrasos",
                        "Buscar eventos variáveis (comissões, bônus, descontos)",
                        "Importar dados no sistema de folha",
                        "Executar cálculo da folha",
                        "Gerar relatório de conferência",
                        "Após aprovação, gerar arquivo bancário CNAB",
                        "Enviar arquivo para banco",
                        "Gerar holerites em PDF",
                        "Distribuir holerites por email"
                    ]
                }],
                regras_negocio: [
                    { codigo: "RN-001", tipo: "CALC", titulo: "Hora Extra", descricao: "HE 50% dias úteis, HE 100% domingos/feriados", logica: "SE dia IN (DOM, FERIADO) ENTÃO fator = 2.0 SENÃO fator = 1.5" },
                    { codigo: "RN-002", tipo: "REST", titulo: "Limite de Desconto", descricao: "Descontos não podem ultrapassar 30% do salário líquido", logica: "SE total_descontos > (salario_liquido * 0.30) ENTÃO ajustar_parcelas()" }
                ]
            }
        },
        {
            id: 'pedido_compra',
            keywords: ['compra', 'pedido', 'requisição', 'fornecedor', 'cotação', 'procurement', 'suprimentos', 'mm'],
            category: 'COMPRAS',
            exemplo: {
                projeto: {
                    nome: "Automação de Pedidos de Compra",
                    objetivo: "Automatizar o fluxo de criação de pedidos de compra a partir de requisições aprovadas, incluindo cotação automática e envio para fornecedores.",
                    beneficios: {
                        tangiveis: [
                            "Redução de 2 dias no ciclo de compras",
                            "Economia de 5% via cotação automatizada"
                        ],
                        intangiveis: [
                            "Padronização do processo de compras",
                            "Melhor relacionamento com fornecedores"
                        ]
                    }
                },
                rpas: [{
                    nome: "RPA Pedido de Compra",
                    trigger: { tipo: "EVENTO", frequencia: "Ao aprovar requisição", volume_estimado: "50 requisições/dia" },
                    fluxo_execucao: [
                        "Monitorar requisições aprovadas no SAP",
                        "Identificar fornecedores homologados para o material",
                        "Enviar solicitação de cotação por email",
                        "Aguardar respostas (timeout 24h)",
                        "Comparar cotações recebidas",
                        "Selecionar menor preço com prazo adequado",
                        "Criar pedido de compra no SAP (ME21N)",
                        "Enviar pedido para fornecedor vencedor",
                        "Atualizar status da requisição"
                    ]
                }]
            }
        },
        {
            id: 'relatorio_gerencial',
            keywords: ['relatório', 'report', 'dashboard', 'bi', 'indicador', 'kpi', 'gestão', 'gerencial', 'consolidação'],
            category: 'GESTAO',
            exemplo: {
                projeto: {
                    nome: "Automação de Relatórios Gerenciais",
                    objetivo: "Automatizar a geração e distribuição de relatórios gerenciais diários/semanais, consolidando dados de múltiplas fontes.",
                    beneficios: {
                        tangiveis: [
                            "Economia de 10 horas semanais em geração de relatórios",
                            "Disponibilidade dos dados às 7h (antes era 10h)"
                        ],
                        intangiveis: [
                            "Decisões baseadas em dados atualizados",
                            "Padronização de métricas"
                        ]
                    }
                },
                rpas: [{
                    nome: "RPA Relatórios",
                    trigger: { tipo: "AGENDAMENTO", frequencia: "Diária às 6h", volume_estimado: "15 relatórios/dia" },
                    fluxo_execucao: [
                        "Conectar às fontes de dados (SAP, CRM, Excel)",
                        "Extrair dados conforme queries predefinidas",
                        "Consolidar em base temporária",
                        "Aplicar regras de cálculo de KPIs",
                        "Gerar relatórios em Excel/PDF",
                        "Publicar em pasta SharePoint",
                        "Enviar email com resumo para gestores"
                    ]
                }]
            }
        }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // FUNÇÕES DE BUSCA E MATCHING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Busca exemplos relevantes baseado no texto do usuário
     */
    function findRelevantExamples(userText, maxResults = 2) {
        const textLower = userText.toLowerCase();
        const scores = [];

        PDD_EXAMPLES.forEach(example => {
            let score = 0;
            
            // Pontuação por keywords encontradas
            example.keywords.forEach(keyword => {
                if (textLower.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            });

            // Pontuação por categoria mencionada
            if (textLower.includes(example.category.toLowerCase())) {
                score += 5;
            }

            if (score > 0) {
                scores.push({ example, score });
            }
        });

        // Ordenar por score e retornar top N
        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, maxResults).map(s => s.example);
    }

    /**
     * Gera contexto de exemplos para o prompt da IA
     */
    function generateExamplesContext(userText) {
        const relevantExamples = findRelevantExamples(userText, 2);
        
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
### EXEMPLO ${i + 1}: ${ex.exemplo.projeto.nome}
Categoria: ${ex.category}

**Objetivo (exemplo de qualidade):**
${ex.exemplo.projeto.objetivo}

**Benefícios (exemplo de estrutura):**
Tangíveis:
${ex.exemplo.projeto.beneficios?.tangiveis?.map(b => `- ${b}`).join('\n') || '- N/A'}

Intangíveis:
${ex.exemplo.projeto.beneficios?.intangiveis?.map(b => `- ${b}`).join('\n') || '- N/A'}

**Fluxo de Execução (exemplo de detalhamento):**
${ex.exemplo.rpas?.[0]?.fluxo_execucao?.map((f, j) => `${j + 1}. ${f}`).join('\n') || 'N/A'}

**Regras de Negócio (exemplo de estrutura):**
${ex.exemplo.regras_negocio?.map(rn => `- ${rn.codigo}: ${rn.titulo} - ${rn.descricao}`).join('\n') || 'N/A'}

**Exceções (exemplo de tratamento):**
${ex.exemplo.rpas?.[0]?.excecoes?.map(e => `- ${e.cenario}: ${e.tratamento}`).join('\n') || 'N/A'}

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

    /**
     * Lista todas as categorias disponíveis
     */
    function getCategories() {
        return [...new Set(PDD_EXAMPLES.map(e => e.category))];
    }

    /**
     * Busca exemplo por ID
     */
    function getExampleById(id) {
        return PDD_EXAMPLES.find(e => e.id === id);
    }

    /**
     * Adiciona novo exemplo ao banco (runtime only)
     */
    function addExample(example) {
        if (example.id && example.keywords && example.exemplo) {
            PDD_EXAMPLES.push(example);
            return true;
        }
        return false;
    }

    /**
     * Retorna estatísticas do banco de exemplos
     */
    function getStats() {
        return {
            totalExamples: PDD_EXAMPLES.length,
            categories: getCategories(),
            totalKeywords: PDD_EXAMPLES.reduce((acc, e) => acc + e.keywords.length, 0)
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        findRelevantExamples,
        generateExamplesContext,
        getCategories,
        getExampleById,
        addExample,
        getStats
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RAGSystem;
}
