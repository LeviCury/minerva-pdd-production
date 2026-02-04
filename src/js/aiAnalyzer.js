/**
 * MINERVA PDD GENERATOR - AI Analyzer Module
 * Análise inteligente com GPT-4 para construção de PDD
 */

const AIAnalyzer = (function() {
    'use strict';

    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    // Prompt otimizado para extração de informações de PDD
    const SYSTEM_PROMPT = `Você é um especialista em análise de projetos de automação RPA da Minerva S.A.
Sua tarefa é analisar textos descritivos de projetos e extrair informações estruturadas para gerar um PDD (Process Definition Document).

IMPORTANTE: Responda APENAS com JSON válido, sem markdown, sem explicações.

O JSON deve seguir EXATAMENTE esta estrutura:
{
  "projeto": {
    "nome": "Nome do Projeto",
    "objetivo": "Objetivo detalhado do projeto",
    "escopo": "O que está incluído no escopo",
    "fora_escopo": "O que NÃO está incluído (se mencionado)",
    "beneficios": ["Benefício 1", "Benefício 2"],
    "sistemas_envolvidos": ["Sistema 1", "Sistema 2"],
    "areas_envolvidas": ["Área 1", "Área 2"]
  },
  "rpas": [
    {
      "numero": 1,
      "nome": "Nome do RPA",
      "descricao": "O que este RPA faz",
      "trigger": "O que dispara a execução (ex: E-mail, Agendamento, Manual)",
      "frequencia": "Frequência de execução (ex: Diário, Por demanda)",
      "input": ["Entrada 1", "Entrada 2"],
      "output": ["Saída 1", "Saída 2"],
      "sistemas": ["Sistema usado por este RPA"],
      "passos": ["Passo 1", "Passo 2", "Passo 3"],
      "excecoes": ["Possível exceção 1", "Possível exceção 2"]
    }
  ],
  "infraestrutura": {
    "servidores": [{"nome": "SERVIDOR", "funcao": "Função"}],
    "bancos_dados": [{"nome": "banco", "servidor": "SERVIDOR", "funcao": "Função"}],
    "tecnologias": ["UiPath", "Python", "SQL Server"]
  },
  "stakeholders": {
    "sponsor": "Nome ou Área (se mencionado)",
    "responsavel_negocio": "Nome ou Área",
    "responsavel_tecnico": "Nome ou Área"
  },
  "cronograma": {
    "fases": [
      {"fase": "Desenvolvimento", "duracao_estimada": "X semanas"},
      {"fase": "Testes", "duracao_estimada": "X semanas"},
      {"fase": "Implantação", "duracao_estimada": "X semanas"}
    ]
  },
  "riscos": [
    {"risco": "Descrição do risco", "mitigacao": "Como mitigar"}
  ],
  "observacoes": "Qualquer informação adicional relevante"
}

REGRAS:
1. Extraia TODAS as informações possíveis do texto
2. Se uma informação não foi mencionada, use null ou array vazio []
3. Seja específico nos passos de cada RPA
4. Identifique todos os sistemas, bancos e servidores mencionados
5. Infira informações lógicas (ex: se menciona "envio de e-mail ao final", é provavelmente um trigger de agendamento)
6. Para riscos, pense em riscos comuns de projetos RPA mesmo que não mencionados
7. SEMPRE retorne JSON válido`;

    /**
     * Analisa o texto do projeto usando GPT
     */
    async function analyze(text, apiKey) {
        if (!apiKey) {
            throw new Error('API Key não configurada');
        }

        if (!text || text.trim().length < 50) {
            throw new Error('Texto muito curto para análise');
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `Analise o seguinte texto de projeto e extraia as informações para o PDD:\n\n${text}` }
                ],
                temperature: 0.3,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 401) {
                throw new Error('API Key inválida');
            }
            if (response.status === 429) {
                throw new Error('Limite de requisições excedido. Aguarde um momento.');
            }
            throw new Error(error.error?.message || `Erro na API: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Resposta vazia da IA');
        }

        // Tentar parsear o JSON
        try {
            // Remover possíveis marcadores de código
            const cleanContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            return JSON.parse(cleanContent);
        } catch (e) {
            console.error('Erro ao parsear JSON:', content);
            throw new Error('Erro ao processar resposta da IA. Tente novamente.');
        }
    }

    /**
     * Gera sugestões para campos não preenchidos
     */
    async function suggestField(fieldName, context, apiKey) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { 
                        role: 'system', 
                        content: 'Você é um assistente que sugere conteúdo para documentos PDD. Responda de forma direta e concisa.' 
                    },
                    { 
                        role: 'user', 
                        content: `Contexto do projeto: ${context}\n\nSugira um conteúdo apropriado para o campo "${fieldName}" de um PDD.` 
                    }
                ],
                temperature: 0.5,
                max_tokens: 500
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * Melhora/expande um texto existente
     */
    async function improveText(text, fieldName, apiKey) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { 
                        role: 'system', 
                        content: 'Você melhora e expande textos para documentos técnicos PDD. Mantenha o tom profissional e técnico.' 
                    },
                    { 
                        role: 'user', 
                        content: `Melhore e expanda o seguinte texto para o campo "${fieldName}" de um PDD:\n\n${text}` 
                    }
                ],
                temperature: 0.4,
                max_tokens: 500
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || text;
    }

    return {
        analyze,
        suggestField,
        improveText
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalyzer;
}
