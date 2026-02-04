/**
 * MINERVA PDD GENERATOR - Schema Validator Module
 * Validação de dados do PDD com JSON Schema
 */

const SchemaValidator = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // JSON SCHEMA DO PDD
    // ═══════════════════════════════════════════════════════════════════════════

    const PDD_SCHEMA = {
        type: 'object',
        required: ['projeto'],
        properties: {
            analise_qualidade: {
                type: 'object',
                properties: {
                    completude_texto: { type: 'string', enum: ['ALTA', 'MEDIA', 'BAIXA'] },
                    confianca_extracao: { type: 'number', minimum: 0, maximum: 100 },
                    observacoes_analise: { type: 'string' }
                }
            },
            
            lacunas_criticas: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['campo', 'descricao', 'impacto'],
                    properties: {
                        campo: { type: 'string' },
                        descricao: { type: 'string' },
                        impacto: { type: 'string', enum: ['ALTO', 'MEDIO', 'BAIXO'] },
                        sugestao_pergunta: { type: 'string' },
                        valor_sugerido: { type: ['string', 'null'] }
                    }
                }
            },
            
            projeto: {
                type: 'object',
                required: ['nome'],
                properties: {
                    nome: { type: 'string', minLength: 3 },
                    nome_codigo: { type: 'string' },
                    objetivo: { type: 'string' },
                    justificativa: { type: 'string' },
                    escopo: {
                        type: 'object',
                        properties: {
                            incluido: { type: 'array', items: { type: 'string' } },
                            excluido: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    beneficios: {
                        type: 'object',
                        properties: {
                            tangiveis: { type: 'array', items: { type: 'string' } },
                            intangiveis: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    sistemas_envolvidos: { type: 'array', items: { type: 'string' } },
                    areas_envolvidas: { type: 'array', items: { type: 'string' } },
                    complexidade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA', 'MUITO_ALTA'] },
                    criticidade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] }
                }
            },
            
            rpas: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['nome'],
                    properties: {
                        numero: { type: 'integer', minimum: 1 },
                        codigo: { type: 'string', pattern: '^RPA-\\d{3}$' },
                        nome: { type: 'string', minLength: 3 },
                        descricao: { type: 'string' },
                        objetivo: { type: 'string' },
                        trigger: {
                            type: 'object',
                            properties: {
                                tipo: { type: 'string', enum: ['EMAIL', 'AGENDAMENTO', 'MANUAL', 'EVENTO', 'API'] },
                                descricao: { type: 'string' },
                                frequencia: { type: 'string' },
                                volume_estimado: { type: 'string' }
                            }
                        },
                        entrada: {
                            type: 'object',
                            properties: {
                                dados: { type: 'array', items: { type: 'string' } },
                                origem: { type: 'string' },
                                formato: { type: 'string' }
                            }
                        },
                        saida: {
                            type: 'object',
                            properties: {
                                dados: { type: 'array', items: { type: 'string' } },
                                destino: { type: 'string' },
                                formato: { type: 'string' }
                            }
                        },
                        sistemas_utilizados: { type: 'array', items: { type: 'string' } },
                        fluxo_execucao: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    passo: { type: 'integer' },
                                    acao: { type: 'string' },
                                    sistema: { type: 'string' },
                                    dados_manipulados: { type: 'string' },
                                    validacoes: { type: 'string' }
                                }
                            }
                        },
                        excecoes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    codigo: { type: 'string' },
                                    cenario: { type: 'string' },
                                    tratamento: { type: 'string' },
                                    acao_fallback: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            },
            
            requisitos_funcionais: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['titulo'],
                    properties: {
                        codigo: { type: 'string', pattern: '^RF-\\d{3}$' },
                        modulo: { type: 'string' },
                        titulo: { type: 'string', minLength: 5 },
                        descricao: { type: 'string' },
                        prioridade: { type: 'string', enum: ['MUST', 'SHOULD', 'COULD', 'WONT'] },
                        complexidade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA'] },
                        atores: { type: 'array', items: { type: 'string' } },
                        pre_condicoes: { type: 'array', items: { type: 'string' } },
                        pos_condicoes: { type: 'array', items: { type: 'string' } },
                        fluxo_principal: { type: 'array', items: { type: 'string' } },
                        criterios_aceitacao: { type: 'array', items: { type: 'string' } }
                    }
                }
            },
            
            regras_negocio: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['titulo'],
                    properties: {
                        codigo: { type: 'string', pattern: '^RN-\\d{3}$' },
                        tipo: { type: 'string', enum: ['CALC', 'VAL', 'REST', 'INF', 'ACT', 'TIME', 'DER', 'COMP'] },
                        categoria: { type: 'string' },
                        titulo: { type: 'string', minLength: 5 },
                        descricao: { type: 'string' },
                        logica: { type: 'string' },
                        excecoes: { type: 'array', items: { type: 'string' } },
                        requisitos_relacionados: { type: 'array', items: { type: 'string' } }
                    }
                }
            },
            
            integracoes: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['sistema_externo'],
                    properties: {
                        codigo: { type: 'string', pattern: '^INT-\\d{3}$' },
                        sistema_externo: { type: 'string', minLength: 2 },
                        proposito: { type: 'string' },
                        direcao: { type: 'string', enum: ['ENTRADA', 'SAIDA', 'BIDIRECIONAL'] },
                        protocolo: { type: 'string', enum: ['REST', 'SOAP', 'FILE', 'DATABASE', 'EMAIL', 'API'] },
                        frequencia: { type: 'string', enum: ['REAL_TIME', 'BATCH', 'ON_DEMAND'] },
                        dados_trafegados: { type: 'array', items: { type: 'string' } },
                        tratamento_erros: { type: 'string' }
                    }
                }
            },
            
            infraestrutura: {
                type: 'object',
                properties: {
                    servidores: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                nome: { type: 'string' },
                                funcao: { type: 'string' },
                                tipo: { type: 'string' }
                            }
                        }
                    },
                    bancos_dados: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                nome: { type: 'string' },
                                servidor: { type: 'string' },
                                tipo: { type: 'string' },
                                funcao: { type: 'string' }
                            }
                        }
                    },
                    tecnologias: { type: 'array', items: { type: 'string' } }
                }
            },
            
            stakeholders: {
                type: 'object',
                properties: {
                    sponsor: { type: 'string' },
                    product_owner: { type: 'string' },
                    responsavel_negocio: { type: 'string' },
                    responsavel_tecnico: { type: 'string' },
                    usuarios_finais: { type: 'array', items: { type: 'string' } },
                    areas_impactadas: { type: 'array', items: { type: 'string' } }
                }
            },
            
            riscos: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['descricao'],
                    properties: {
                        codigo: { type: 'string', pattern: '^RISK-\\d{3}$' },
                        descricao: { type: 'string', minLength: 10 },
                        probabilidade: { type: 'string', enum: ['BAIXA', 'MEDIA', 'ALTA'] },
                        impacto: { type: 'string', enum: ['BAIXO', 'MEDIO', 'ALTO', 'CRITICO'] },
                        mitigacao: { type: 'string' },
                        contingencia: { type: 'string' },
                        responsavel: { type: 'string' }
                    }
                }
            },
            
            premissas: { type: 'array', items: { type: 'string' } },
            restricoes: { type: 'array', items: { type: 'string' } },
            observacoes: { type: 'string' }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDADOR SIMPLES (sem dependências externas)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Valida um valor contra um schema
     */
    function validateValue(value, schema, path = '') {
        const errors = [];

        if (schema.type) {
            const types = Array.isArray(schema.type) ? schema.type : [schema.type];
            const actualType = getType(value);
            
            if (!types.includes(actualType) && !(actualType === 'null' && types.includes('null'))) {
                if (value !== undefined && value !== null) {
                    errors.push({
                        path: path || 'root',
                        message: `Tipo inválido: esperado ${types.join(' ou ')}, recebido ${actualType}`,
                        value: value
                    });
                }
            }
        }

        if (schema.type === 'object' && typeof value === 'object' && value !== null) {
            // Verificar campos obrigatórios
            if (schema.required) {
                schema.required.forEach(field => {
                    if (value[field] === undefined || value[field] === null || value[field] === '') {
                        errors.push({
                            path: path ? `${path}.${field}` : field,
                            message: `Campo obrigatório não preenchido`,
                            field: field
                        });
                    }
                });
            }

            // Validar propriedades
            if (schema.properties) {
                Object.keys(schema.properties).forEach(key => {
                    if (value[key] !== undefined) {
                        const propErrors = validateValue(
                            value[key], 
                            schema.properties[key], 
                            path ? `${path}.${key}` : key
                        );
                        errors.push(...propErrors);
                    }
                });
            }
        }

        if (schema.type === 'array' && Array.isArray(value)) {
            if (schema.items) {
                value.forEach((item, index) => {
                    const itemErrors = validateValue(
                        item, 
                        schema.items, 
                        `${path}[${index}]`
                    );
                    errors.push(...itemErrors);
                });
            }
        }

        if (schema.type === 'string' && typeof value === 'string') {
            if (schema.minLength && value.length < schema.minLength) {
                errors.push({
                    path: path,
                    message: `Texto muito curto: mínimo ${schema.minLength} caracteres`,
                    value: value
                });
            }
            if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                errors.push({
                    path: path,
                    message: `Formato inválido: não corresponde ao padrão esperado`,
                    value: value
                });
            }
            if (schema.enum && !schema.enum.includes(value)) {
                errors.push({
                    path: path,
                    message: `Valor inválido: deve ser um de ${schema.enum.join(', ')}`,
                    value: value
                });
            }
        }

        if (schema.type === 'number' && typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push({
                    path: path,
                    message: `Valor abaixo do mínimo: ${schema.minimum}`,
                    value: value
                });
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push({
                    path: path,
                    message: `Valor acima do máximo: ${schema.maximum}`,
                    value: value
                });
            }
        }

        return errors;
    }

    function getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUNÇÕES PÚBLICAS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Valida os dados do PDD
     * @param {Object} pddData - Dados do PDD a validar
     * @returns {Object} - { valid: boolean, errors: Array, warnings: Array, stats: Object }
     */
    function validate(pddData) {
        const errors = validateValue(pddData, PDD_SCHEMA);
        const warnings = [];
        
        // Verificações adicionais (warnings, não erros)
        if (!pddData.projeto?.objetivo || pddData.projeto.objetivo.length < 50) {
            warnings.push({
                path: 'projeto.objetivo',
                message: 'Objetivo muito curto. Recomenda-se pelo menos 50 caracteres.',
                type: 'warning'
            });
        }

        if (!pddData.rpas || pddData.rpas.length === 0) {
            warnings.push({
                path: 'rpas',
                message: 'Nenhum RPA identificado. Verifique se a descrição menciona as automações.',
                type: 'warning'
            });
        }

        if (!pddData.riscos || pddData.riscos.length === 0) {
            warnings.push({
                path: 'riscos',
                message: 'Nenhum risco identificado. Todo projeto tem riscos.',
                type: 'warning'
            });
        }

        if (!pddData.stakeholders?.sponsor) {
            warnings.push({
                path: 'stakeholders.sponsor',
                message: 'Sponsor não identificado. Importante definir.',
                type: 'warning'
            });
        }

        // Estatísticas
        const stats = {
            projeto: pddData.projeto?.nome ? 1 : 0,
            rpas: pddData.rpas?.length || 0,
            requisitos: pddData.requisitos_funcionais?.length || 0,
            regras: pddData.regras_negocio?.length || 0,
            integracoes: pddData.integracoes?.length || 0,
            riscos: pddData.riscos?.length || 0,
            completude: calculateCompletude(pddData)
        };

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            stats: stats
        };
    }

    /**
     * Calcula índice de completude do PDD (0-100)
     */
    function calculateCompletude(pddData) {
        let score = 0;
        let total = 0;

        // Projeto (peso 20)
        total += 20;
        if (pddData.projeto?.nome) score += 5;
        if (pddData.projeto?.objetivo && pddData.projeto.objetivo.length > 30) score += 5;
        if (pddData.projeto?.escopo?.incluido?.length > 0) score += 5;
        if (pddData.projeto?.sistemas_envolvidos?.length > 0) score += 5;

        // RPAs (peso 30)
        total += 30;
        if (pddData.rpas?.length > 0) {
            score += 10;
            const rpaScore = pddData.rpas.reduce((acc, rpa) => {
                let s = 0;
                if (rpa.nome) s += 2;
                if (rpa.descricao) s += 2;
                if (rpa.trigger?.tipo) s += 2;
                if (rpa.fluxo_execucao?.length > 0) s += 4;
                return acc + Math.min(s, 10);
            }, 0);
            score += Math.min(rpaScore, 20);
        }

        // Requisitos (peso 15)
        total += 15;
        if (pddData.requisitos_funcionais?.length > 0) {
            score += 5 + Math.min(pddData.requisitos_funcionais.length, 10);
        }

        // Regras (peso 15)
        total += 15;
        if (pddData.regras_negocio?.length > 0) {
            score += 5 + Math.min(pddData.regras_negocio.length, 10);
        }

        // Integrações (peso 10)
        total += 10;
        if (pddData.integracoes?.length > 0) {
            score += Math.min(pddData.integracoes.length * 3, 10);
        }

        // Infraestrutura (peso 5)
        total += 5;
        if (pddData.infraestrutura?.servidores?.length > 0) score += 2;
        if (pddData.infraestrutura?.bancos_dados?.length > 0) score += 2;
        if (pddData.infraestrutura?.tecnologias?.length > 0) score += 1;

        // Stakeholders (peso 5)
        total += 5;
        if (pddData.stakeholders?.sponsor) score += 2;
        if (pddData.stakeholders?.responsavel_tecnico) score += 2;
        if (pddData.stakeholders?.responsavel_negocio) score += 1;

        return Math.round((score / total) * 100);
    }

    /**
     * Retorna o schema completo
     */
    function getSchema() {
        return PDD_SCHEMA;
    }

    /**
     * Formata erros para exibição
     */
    function formatErrors(errors) {
        return errors.map(e => `• ${e.path}: ${e.message}`).join('\n');
    }

    /**
     * Formata warnings para exibição
     */
    function formatWarnings(warnings) {
        return warnings.map(w => `⚠ ${w.path}: ${w.message}`).join('\n');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        validate,
        getSchema,
        formatErrors,
        formatWarnings,
        calculateCompletude
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemaValidator;
}
