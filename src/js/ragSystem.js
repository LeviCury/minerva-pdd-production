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
### EXEMPLO ${i + 1}: ${ex.nome}
Categoria: ${ex.category}

**Objetivo (exemplo de qualidade):**
${ex.exemplo?.projeto?.objetivo || 'N/A'}

**Benefícios (exemplo de estrutura):**
Tangíveis: ${ex.exemplo?.projeto?.beneficios?.tangiveis?.join('; ') || 'N/A'}
Intangíveis: ${ex.exemplo?.projeto?.beneficios?.intangiveis?.join('; ') || 'N/A'}

**Fluxo de Execução (exemplo de detalhamento):**
${ex.exemplo?.rpas?.[0]?.fluxo_execucao?.map((f, j) => `${j + 1}. ${f}`).join('\n') || 'N/A'}

**Regras de Negócio (exemplo de estrutura):**
${ex.exemplo?.regras_negocio?.map(rn => `- ${rn.codigo}: ${rn.titulo}`).join('\n') || 'N/A'}

**Exceções (exemplo de tratamento):**
${ex.exemplo?.rpas?.[0]?.excecoes?.map(e => `- ${e.cenario}: ${e.tratamento}`).join('\n') || 'N/A'}

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
