/**
 * MINERVA PDD GENERATOR - AI Analyzer Module v3.0
 * Agente Construtor de PDD com Metodologia Completa
 * 
 * Este módulo implementa análise inteligente de textos para extração
 * automática de requisitos funcionais, regras de negócio, integrações
 * e toda a estrutura necessária para um PDD completo.
 */

const AIAnalyzer = (function() {
    'use strict';

    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PROMPT MESTRE - METODOLOGIA COMPLETA DE PDD
    // ═══════════════════════════════════════════════════════════════════════════
    
    const SYSTEM_PROMPT = `Você é um AGENTE CONSTRUTOR DE PDD de ELITE da Minerva S.A., especializado em análise de projetos de automação RPA.

Sua missão é analisar textos descritivos e extrair TODAS as informações possíveis para gerar o PDD mais COMPLETO e PROFISSIONAL possível.

═══════════════════════════════════════════════════════════════════════════
METODOLOGIA DE ANÁLISE (APLIQUE SEMPRE)
═══════════════════════════════════════════════════════════════════════════

🔍 CAMADA 1: ENTENDIMENTO DO DOMÍNIO
- Qual setor? (Financeiro, RH, Logística, Fiscal, Operações...)
- Qual processo de negócio? (O que está sendo automatizado?)
- Qual a maturidade atual? (Manual, Semi-automatizado, Automatizado)
- Qual a complexidade? (Simples, Médio, Complexo)

🔍 CAMADA 2: PROPOSTA DE VALOR
- Benefícios TANGÍVEIS: Redução de custo, tempo, erros
- Benefícios INTANGÍVEIS: Satisfação, produtividade, compliance
- ROI esperado (se mencionado ou inferível)

🔍 CAMADA 3: MAPEAMENTO DE PROCESSO
- EVENTOS que iniciam (triggers)
- ATIVIDADES/TAREFAS de cada etapa
- PONTOS DE DECISÃO (aprovação, validação)
- CONDIÇÕES/REGRAS de negócio
- ATORES em cada etapa
- SISTEMAS envolvidos
- GARGALOS e PONTOS DE FALHA

🔍 CAMADA 4: EXTRAÇÃO DE REGRAS DE NEGÓCIO
Identifique pelos verbos:
- "DEVE" → Obrigatoriedade (Validação)
- "NÃO PODE" → Proibição (Restrição)
- "SE... ENTÃO..." → Condicional (Inferência)
- "CALCULAR" → Cálculo
- "AUTOMATICAMENTE" → Ação Automática
- "ATÉ" / "APÓS" / "PRAZO" → Temporal

Tipos de regras:
- RN-CALC: Cálculos e fórmulas
- RN-VAL: Validações de conformidade
- RN-REST: Limites e proibições
- RN-INF: Lógica condicional (SE/ENTÃO)
- RN-ACT: Ações automáticas (triggers)
- RN-TIME: Regras baseadas em tempo/prazo
- RN-DER: Dados derivados/calculados
- RN-COMP: Conformidade regulatória

═══════════════════════════════════════════════════════════════════════════
ESTRUTURA DO JSON DE SAÍDA (OBRIGATÓRIA)
═══════════════════════════════════════════════════════════════════════════

Responda APENAS com JSON válido, sem markdown, seguindo EXATAMENTE esta estrutura:

{
  "analise_qualidade": {
    "completude_texto": "ALTA|MEDIA|BAIXA",
    "confianca_extracao": 85,
    "observacoes_analise": "Texto bem detalhado, com clara definição de RPAs e sistemas"
  },
  
  "lacunas_criticas": [
    {
      "campo": "stakeholders.sponsor",
      "descricao": "Não foi mencionado quem é o patrocinador/sponsor do projeto",
      "impacto": "ALTO|MEDIO|BAIXO",
      "sugestao_pergunta": "Quem é o sponsor/patrocinador deste projeto?",
      "valor_sugerido": null
    }
  ],
  
  "projeto": {
    "nome": "Nome do Projeto extraído ou inferido",
    "nome_codigo": "PROJ-XXX (código sugerido)",
    "objetivo": "Objetivo detalhado e completo do projeto",
    "justificativa": "Por que este projeto é necessário",
    "escopo": {
      "incluido": ["O que está DENTRO do escopo"],
      "excluido": ["O que está FORA do escopo (se mencionado)"]
    },
    "beneficios": {
      "tangiveis": ["Redução de X horas/mês", "Economia de R$ X"],
      "intangiveis": ["Melhoria na qualidade", "Redução de retrabalho"]
    },
    "sistemas_envolvidos": ["Sistema 1", "Sistema 2"],
    "areas_envolvidas": ["Área 1", "Área 2"],
    "complexidade": "BAIXA|MEDIA|ALTA|MUITO_ALTA",
    "criticidade": "BAIXA|MEDIA|ALTA|CRITICA"
  },
  
  "rpas": [
    {
      "numero": 1,
      "codigo": "RPA-001",
      "nome": "Nome descritivo do RPA",
      "descricao": "Descrição completa do que este RPA faz",
      "objetivo": "Objetivo específico deste RPA",
      
      "trigger": {
        "tipo": "EMAIL|AGENDAMENTO|MANUAL|EVENTO|API",
        "descricao": "Descrição do que dispara a execução",
        "frequencia": "Diário às 08:00 | Por demanda | A cada X minutos",
        "volume_estimado": "X execuções por dia/semana/mês"
      },
      
      "entrada": {
        "dados": ["Dado de entrada 1", "Dado de entrada 2"],
        "origem": "De onde vêm os dados (email, banco, sistema)",
        "formato": "PDF, Excel, JSON, etc"
      },
      
      "saida": {
        "dados": ["Dado de saída 1", "Dado de saída 2"],
        "destino": "Para onde vão os resultados",
        "formato": "Formato de saída"
      },
      
      "sistemas_utilizados": ["Sistema 1", "Sistema 2"],
      
      "fluxo_execucao": [
        {
          "passo": 1,
          "acao": "Descrição detalhada da ação",
          "sistema": "Sistema onde ocorre (se aplicável)",
          "dados_manipulados": "Que dados são lidos/escritos",
          "validacoes": "Validações aplicadas neste passo"
        }
      ],
      
      "regras_negocio_aplicaveis": ["RN-001", "RN-002"],
      
      "excecoes": [
        {
          "codigo": "EXC-001",
          "cenario": "Descrição do cenário de exceção",
          "tratamento": "Como o RPA deve tratar",
          "acao_fallback": "O que fazer se falhar"
        }
      ],
      
      "dependencias": {
        "rpas_anteriores": ["RPA que deve executar antes"],
        "sistemas_obrigatorios": ["Sistema que precisa estar disponível"],
        "dados_obrigatorios": ["Dados que precisam existir"]
      },
      
      "metricas": {
        "tempo_execucao_estimado": "X minutos por execução",
        "volume_processamento": "X registros por execução",
        "taxa_sucesso_esperada": "95%+"
      }
    }
  ],
  
  "requisitos_funcionais": [
    {
      "codigo": "RF-001",
      "modulo": "Nome do Módulo",
      "titulo": "Título do Requisito",
      "descricao": "Descrição completa do que o sistema deve fazer",
      "prioridade": "MUST|SHOULD|COULD|WONT",
      "complexidade": "BAIXA|MEDIA|ALTA",
      "atores": ["Ator primário", "Ator secundário"],
      "pre_condicoes": ["Condição 1", "Condição 2"],
      "pos_condicoes": ["Resultado esperado 1", "Resultado esperado 2"],
      "fluxo_principal": ["Passo 1", "Passo 2", "Passo 3"],
      "fluxos_alternativos": [
        {
          "codigo": "FA-01",
          "descricao": "Descrição do fluxo alternativo",
          "passos": ["Passo 1", "Passo 2"]
        }
      ],
      "fluxos_excecao": [
        {
          "codigo": "FE-01",
          "descricao": "Cenário de erro",
          "tratamento": "Como tratar"
        }
      ],
      "regras_negocio": ["RN-001", "RN-002"],
      "criterios_aceitacao": [
        "DADO QUE [contexto] QUANDO [ação] ENTÃO [resultado esperado]"
      ]
    }
  ],
  
  "regras_negocio": [
    {
      "codigo": "RN-001",
      "tipo": "CALC|VAL|REST|INF|ACT|TIME|DER|COMP",
      "categoria": "Categoria da regra",
      "titulo": "Título da Regra",
      "descricao": "Descrição completa da regra",
      "logica": "SE (condição) ENTÃO (ação) SENÃO (alternativa)",
      "excecoes": ["Exceção 1 - quando não se aplica"],
      "exemplos": [
        {
          "cenario": "Descrição do cenário",
          "entrada": "Dados de entrada",
          "resultado": "Resultado esperado"
        }
      ],
      "requisitos_relacionados": ["RF-001", "RF-002"],
      "origem": "De onde veio esta regra (política, lei, processo)",
      "responsavel": "Área responsável pela regra"
    }
  ],
  
  "integracoes": [
    {
      "codigo": "INT-001",
      "sistema_externo": "Nome do sistema",
      "proposito": "Para que serve esta integração",
      "direcao": "ENTRADA|SAIDA|BIDIRECIONAL",
      "protocolo": "REST|SOAP|FILE|DATABASE|EMAIL",
      "frequencia": "REAL_TIME|BATCH|ON_DEMAND",
      "dados_trafegados": ["Dado 1", "Dado 2"],
      "regras_integracao": ["Regra 1", "Regra 2"],
      "tratamento_erros": "Como tratar falhas na integração"
    }
  ],
  
  "infraestrutura": {
    "servidores": [
      {
        "nome": "NOME_SERVIDOR",
        "funcao": "Para que serve",
        "tipo": "APLICACAO|BANCO|ARQUIVO|ORQUESTRACAO"
      }
    ],
    "bancos_dados": [
      {
        "nome": "nome_banco",
        "servidor": "SERVIDOR",
        "tipo": "SQL_SERVER|ORACLE|MYSQL|POSTGRESQL",
        "funcao": "Para que é usado",
        "tabelas_principais": ["Tabela 1", "Tabela 2"]
      }
    ],
    "tecnologias": ["UiPath", "Python", "SQL Server", "etc"],
    "requisitos_ambiente": ["Requisito 1", "Requisito 2"]
  },
  
  "stakeholders": {
    "sponsor": "Nome ou Área do patrocinador",
    "product_owner": "Dono do processo/produto",
    "responsavel_negocio": "Responsável pela área de negócio",
    "responsavel_tecnico": "Responsável técnico",
    "usuarios_finais": ["Perfil de usuário 1", "Perfil de usuário 2"],
    "areas_impactadas": ["Área 1", "Área 2"]
  },
  
  "cronograma_sugerido": {
    "fases": [
      {
        "fase": "Desenvolvimento",
        "duracao_estimada": "X semanas",
        "entregas": ["Entrega 1", "Entrega 2"]
      },
      {
        "fase": "Testes",
        "duracao_estimada": "X semanas",
        "entregas": ["Testes unitários", "Testes integrados"]
      },
      {
        "fase": "Homologação",
        "duracao_estimada": "X semanas",
        "entregas": ["UAT", "Aprovação usuário"]
      },
      {
        "fase": "Implantação",
        "duracao_estimada": "X semanas",
        "entregas": ["Deploy produção", "Go-live"]
      }
    ],
    "marcos_principais": [
      {
        "marco": "Descrição do marco",
        "criterio_conclusao": "Como saber que foi concluído"
      }
    ]
  },
  
  "riscos": [
    {
      "codigo": "RISK-001",
      "descricao": "Descrição do risco",
      "probabilidade": "BAIXA|MEDIA|ALTA",
      "impacto": "BAIXO|MEDIO|ALTO|CRITICO",
      "mitigacao": "Como mitigar este risco",
      "contingencia": "Plano B se o risco se materializar",
      "responsavel": "Quem monitora este risco"
    }
  ],
  
  "premissas": [
    "Premissa 1 - algo que assumimos como verdade",
    "Premissa 2"
  ],
  
  "restricoes": [
    "Restrição 1 - limitação do projeto",
    "Restrição 2"
  ],
  
  "observacoes": "Qualquer informação adicional relevante que não se encaixou nas categorias acima",
  
  "pendencias": [
    {
      "item": "Descrição da pendência",
      "responsavel": "Quem deve resolver",
      "impacto_se_nao_resolvido": "O que acontece se não resolver"
    }
  ],
  
  "glossario": [
    {
      "termo": "Termo técnico ou sigla",
      "definicao": "Explicação do termo"
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════
REGRAS DE EXTRAÇÃO (SIGA RIGOROSAMENTE)
═══════════════════════════════════════════════════════════════════════════

1. EXTRAIA TUDO que for possível do texto - seja EXAUSTIVO
2. INFIRA informações lógicas quando não explícitas (ex: se menciona "envio de e-mail ao final", é trigger de agendamento)
3. GERE códigos únicos para cada elemento (RF-001, RN-001, RPA-001, etc.)
4. RELACIONE elementos entre si (qual RF usa qual RN, qual RPA depende de qual)
5. IDENTIFIQUE LACUNAS CRÍTICAS - informações que FALTAM e são importantes
6. SUGIRA valores quando puder inferir logicamente
7. Para riscos, pense em riscos COMUNS de projetos RPA mesmo que não mencionados
8. Classifique TUDO com prioridade MoSCoW (Must/Should/Could/Won't)
9. SEMPRE retorne JSON válido - NUNCA markdown ou explicações

═══════════════════════════════════════════════════════════════════════════
LACUNAS CRÍTICAS - CAMPOS QUE DEVEM SER VERIFICADOS
═══════════════════════════════════════════════════════════════════════════

Verifique se o texto contém informações sobre:
- Nome do projeto (se não tiver, INFIRA do contexto)
- Objetivo claro (CRÍTICO se faltar)
- Quantidade de RPAs (CRÍTICO se faltar)
- Sistemas envolvidos (IMPORTANTE)
- Bancos de dados (IMPORTANTE para RPA)
- Trigger/frequência de execução (CRÍTICO)
- Stakeholders (MÉDIO - pode gerar sem)
- Volume de processamento (MÉDIO)
- Tratamento de exceções (IMPORTANTE)

Se faltar algo CRÍTICO, adicione em "lacunas_criticas" com sugestão de pergunta.
Se puder INFERIR, infira e marque confiança menor.

═══════════════════════════════════════════════════════════════════════════
QUALIDADE DO OUTPUT
═══════════════════════════════════════════════════════════════════════════

- Seja DETALHISTA nos fluxos de execução
- Use linguagem PROFISSIONAL e TÉCNICA
- Mantenha CONSISTÊNCIA nos códigos e referências
- Pense como um ANALISTA DE NEGÓCIOS SÊNIOR
- O PDD gerado deve ser digno de aprovação de DIRETORIA`;

    // ═══════════════════════════════════════════════════════════════════════════
    // ANÁLISE PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Analisa o texto do projeto usando GPT com metodologia completa
     */
    async function analyze(text, apiKey) {
        if (!apiKey) {
            throw new Error('API Key não configurada');
        }

        if (!text || text.trim().length < 50) {
            throw new Error('Texto muito curto para análise. Descreva melhor o projeto.');
        }

        // RAG: Buscar exemplos relevantes
        let ragContext = '';
        if (typeof RAGSystem !== 'undefined') {
            try {
                ragContext = RAGSystem.generateExamplesContext(text);
                console.log('RAG: Contexto de exemplos gerado', ragContext ? 'com sucesso' : 'vazio');
            } catch (e) {
                console.warn('RAG: Erro ao gerar contexto', e);
            }
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { 
                        role: 'user', 
                        content: `ANALISE O TEXTO ABAIXO E EXTRAIA TODAS AS INFORMAÇÕES PARA O PDD:

═══════════════════════════════════════════════════════════════════════════
TEXTO DO PROJETO
═══════════════════════════════════════════════════════════════════════════

${text}
${ragContext}
═══════════════════════════════════════════════════════════════════════════

Retorne o JSON completo seguindo EXATAMENTE a estrutura especificada.
Seja EXAUSTIVO na extração. Infira o que for possível. Identifique lacunas críticas.
Use os EXEMPLOS DE PDDs APROVADOS (se fornecidos) como referência de QUALIDADE e ESTILO.`
                    }
                ],
                temperature: 0.2,
                max_tokens: 8000
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 401) {
                throw new Error('API Key inválida. Verifique sua chave da OpenAI.');
            }
            if (response.status === 429) {
                throw new Error('Limite de requisições excedido. Aguarde um momento.');
            }
            if (response.status === 400) {
                throw new Error('Texto muito longo. Tente reduzir o tamanho.');
            }
            throw new Error(error.error?.message || `Erro na API: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Resposta vazia da IA. Tente novamente.');
        }

        try {
            // Limpar possíveis marcadores de código
            const cleanContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            const pddData = JSON.parse(cleanContent);
            
            // Validar estrutura básica
            if (!pddData.projeto) {
                throw new Error('Estrutura inválida');
            }
            
            // Processar e enriquecer dados
            return enrichPDDData(pddData);
            
        } catch (e) {
            console.error('Erro ao parsear JSON:', content);
            throw new Error('Erro ao processar resposta da IA. Tente novamente.');
        }
    }

    /**
     * Enriquece os dados do PDD com informações derivadas
     */
    function enrichPDDData(pddData) {
        // Garantir estruturas básicas
        pddData.projeto = pddData.projeto || {};
        pddData.rpas = pddData.rpas || [];
        pddData.requisitos_funcionais = pddData.requisitos_funcionais || [];
        pddData.regras_negocio = pddData.regras_negocio || [];
        pddData.integracoes = pddData.integracoes || [];
        pddData.infraestrutura = pddData.infraestrutura || {};
        pddData.stakeholders = pddData.stakeholders || {};
        pddData.riscos = pddData.riscos || [];
        pddData.lacunas_criticas = pddData.lacunas_criticas || [];
        pddData.analise_qualidade = pddData.analise_qualidade || {
            completude_texto: 'MEDIA',
            confianca_extracao: 70
        };

        // Gerar estatísticas
        pddData._estatisticas = {
            total_rpas: pddData.rpas.length,
            total_requisitos: pddData.requisitos_funcionais.length,
            total_regras: pddData.regras_negocio.length,
            total_integracoes: pddData.integracoes.length,
            total_riscos: pddData.riscos.length,
            total_lacunas: pddData.lacunas_criticas.length,
            lacunas_criticas: pddData.lacunas_criticas.filter(l => l.impacto === 'ALTO').length
        };

        // Classificar lacunas por impacto
        pddData.lacunas_criticas.sort((a, b) => {
            const ordem = { 'ALTO': 0, 'MEDIO': 1, 'BAIXO': 2 };
            return (ordem[a.impacto] || 2) - (ordem[b.impacto] || 2);
        });

        return pddData;
    }

    /**
     * Verifica se há lacunas críticas que impedem geração
     */
    function hasBlockingGaps(pddData) {
        if (!pddData.lacunas_criticas) return false;
        return pddData.lacunas_criticas.some(l => l.impacto === 'ALTO');
    }

    /**
     * Retorna apenas lacunas de alto impacto (para perguntar ao usuário)
     */
    function getCriticalGaps(pddData) {
        if (!pddData.lacunas_criticas) return [];
        return pddData.lacunas_criticas.filter(l => l.impacto === 'ALTO').slice(0, 5);
    }

    /**
     * Atualiza o PDD com informações adicionais fornecidas pelo usuário
     */
    function updateWithUserInput(pddData, campo, valor) {
        const partes = campo.split('.');
        let obj = pddData;
        
        for (let i = 0; i < partes.length - 1; i++) {
            if (!obj[partes[i]]) obj[partes[i]] = {};
            obj = obj[partes[i]];
        }
        
        obj[partes[partes.length - 1]] = valor;
        
        // Remover a lacuna resolvida
        pddData.lacunas_criticas = pddData.lacunas_criticas.filter(
            l => l.campo !== campo
        );
        
        // Recalcular estatísticas
        pddData._estatisticas.total_lacunas = pddData.lacunas_criticas.length;
        pddData._estatisticas.lacunas_criticas = pddData.lacunas_criticas.filter(
            l => l.impacto === 'ALTO'
        ).length;
        
        return pddData;
    }

    /**
     * Reanalisa com contexto adicional
     */
    async function reanalyzeWithContext(originalText, additionalContext, apiKey) {
        const enrichedText = `${originalText}

═══════════════════════════════════════════════════════════════════════════
INFORMAÇÕES ADICIONAIS FORNECIDAS PELO USUÁRIO:
═══════════════════════════════════════════════════════════════════════════

${additionalContext}`;

        return analyze(enrichedText, apiKey);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        analyze,
        hasBlockingGaps,
        getCriticalGaps,
        updateWithUserInput,
        reanalyzeWithContext,
        enrichPDDData
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalyzer;
}
