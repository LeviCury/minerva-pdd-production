/**
 * MINERVA PDD GENERATOR - PDD Builder Module v3.0
 * Constrói documento Word completo e profissional do PDD
 * 
 * Inclui: RF (Requisitos Funcionais), RN (Regras de Negócio),
 * INT (Integrações), Riscos, Cronograma e todas seções padrão
 */

const PDDBuilder = (function() {
    'use strict';

    const PRIMARY_COLOR = 'C41E3A';
    const SECONDARY_COLOR = '8B0000';
    const HEADER_BG = 'F5F5F5';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUTOR PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════════════

    function build(pddData, options = {}) {
        const {
            incluirCapa = true,
            incluirSumario = true,
            incluirCronograma = true,
            incluirRiscos = true,
            incluirRequisitos = true,
            incluirRegras = true,
            incluirIntegracoes = true
        } = options;

        const children = [];
        const projectName = pddData.projeto?.nome || 'Documento de Projeto';
        const projectCode = pddData.projeto?.nome_codigo || 'PDD-001';

        // ═══════════════════════════════════════════════════════════════
        // CAPA
        // ═══════════════════════════════════════════════════════════════
        if (incluirCapa) {
            children.push(...buildCoverPage(projectName, projectCode));
        }

        // ═══════════════════════════════════════════════════════════════
        // SUMÁRIO
        // ═══════════════════════════════════════════════════════════════
        if (incluirSumario) {
            children.push(...buildTableOfContents());
        }

        // ═══════════════════════════════════════════════════════════════
        // 1. INFORMAÇÕES DO DOCUMENTO
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('1. INFORMAÇÕES DO DOCUMENTO', 1));
        children.push(...buildDocumentInfo(pddData));

        // ═══════════════════════════════════════════════════════════════
        // 2. RESUMO EXECUTIVO
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('2. RESUMO EXECUTIVO', 1));
        children.push(...buildExecutiveSummary(pddData));

        // ═══════════════════════════════════════════════════════════════
        // 3. OBJETIVO E JUSTIFICATIVA
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('3. OBJETIVO E JUSTIFICATIVA', 1));
        children.push(...buildSection('3.1 Objetivo', 2));
        children.push(buildParagraph(pddData.projeto?.objetivo || 'A ser definido.'));
        
        if (pddData.projeto?.justificativa) {
            children.push(...buildSection('3.2 Justificativa', 2));
            children.push(buildParagraph(pddData.projeto.justificativa));
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. ESCOPO
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('4. ESCOPO DO PROJETO', 1));
        children.push(...buildSection('4.1 Incluído no Escopo', 2));
        if (pddData.projeto?.escopo?.incluido?.length > 0) {
            pddData.projeto.escopo.incluido.forEach(item => {
                children.push(buildBullet(item));
            });
        } else {
            children.push(buildParagraph('A ser definido.'));
        }
        
        if (pddData.projeto?.escopo?.excluido?.length > 0) {
            children.push(...buildSection('4.2 Fora do Escopo', 2));
            pddData.projeto.escopo.excluido.forEach(item => {
                children.push(buildBullet(item));
            });
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. BENEFÍCIOS ESPERADOS
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('5. BENEFÍCIOS ESPERADOS', 1));
        
        if (pddData.projeto?.beneficios?.tangiveis?.length > 0) {
            children.push(...buildSection('5.1 Benefícios Tangíveis', 2));
            pddData.projeto.beneficios.tangiveis.forEach(b => {
                children.push(buildBullet(b));
            });
        }
        
        if (pddData.projeto?.beneficios?.intangiveis?.length > 0) {
            children.push(...buildSection('5.2 Benefícios Intangíveis', 2));
            pddData.projeto.beneficios.intangiveis.forEach(b => {
                children.push(buildBullet(b));
            });
        }

        if (!pddData.projeto?.beneficios?.tangiveis?.length && !pddData.projeto?.beneficios?.intangiveis?.length) {
            children.push(buildParagraph('Benefícios a serem definidos durante o projeto.'));
        }

        // ═══════════════════════════════════════════════════════════════
        // 6. ARQUITETURA DA SOLUÇÃO
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('6. ARQUITETURA DA SOLUÇÃO', 1));
        children.push(...buildArchitecture(pddData));

        // ═══════════════════════════════════════════════════════════════
        // 7. DETALHAMENTO DOS RPAs
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('7. DETALHAMENTO DOS RPAs', 1));
        
        if (pddData.rpas?.length > 0) {
            pddData.rpas.forEach((rpa, index) => {
                children.push(...buildRPASection(rpa, index + 1));
            });
        } else {
            children.push(buildParagraph('Nenhum RPA definido.'));
        }

        // ═══════════════════════════════════════════════════════════════
        // 8. REQUISITOS FUNCIONAIS
        // ═══════════════════════════════════════════════════════════════
        if (incluirRequisitos && pddData.requisitos_funcionais?.length > 0) {
            children.push(...buildSection('8. REQUISITOS FUNCIONAIS', 1));
            children.push(...buildRequirements(pddData.requisitos_funcionais));
        }

        // ═══════════════════════════════════════════════════════════════
        // 9. REGRAS DE NEGÓCIO
        // ═══════════════════════════════════════════════════════════════
        if (incluirRegras && pddData.regras_negocio?.length > 0) {
            children.push(...buildSection('9. REGRAS DE NEGÓCIO', 1));
            children.push(...buildBusinessRules(pddData.regras_negocio));
        }

        // ═══════════════════════════════════════════════════════════════
        // 10. INTEGRAÇÕES
        // ═══════════════════════════════════════════════════════════════
        if (incluirIntegracoes && pddData.integracoes?.length > 0) {
            children.push(...buildSection('10. INTEGRAÇÕES', 1));
            children.push(...buildIntegrations(pddData.integracoes));
        }

        // ═══════════════════════════════════════════════════════════════
        // 11. INFRAESTRUTURA
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('11. INFRAESTRUTURA', 1));
        children.push(...buildInfrastructure(pddData.infraestrutura));

        // ═══════════════════════════════════════════════════════════════
        // 12. CRONOGRAMA
        // ═══════════════════════════════════════════════════════════════
        if (incluirCronograma) {
            children.push(...buildSection('12. CRONOGRAMA SUGERIDO', 1));
            children.push(...buildSchedule(pddData.cronograma_sugerido));
        }

        // ═══════════════════════════════════════════════════════════════
        // 13. ANÁLISE DE RISCOS
        // ═══════════════════════════════════════════════════════════════
        if (incluirRiscos) {
            children.push(...buildSection('13. ANÁLISE DE RISCOS', 1));
            children.push(...buildRisks(pddData.riscos || []));
        }

        // ═══════════════════════════════════════════════════════════════
        // 14. STAKEHOLDERS
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('14. STAKEHOLDERS', 1));
        children.push(...buildStakeholders(pddData.stakeholders));

        // ═══════════════════════════════════════════════════════════════
        // 15. PREMISSAS E RESTRIÇÕES
        // ═══════════════════════════════════════════════════════════════
        if ((pddData.premissas?.length > 0) || (pddData.restricoes?.length > 0)) {
            children.push(...buildSection('15. PREMISSAS E RESTRIÇÕES', 1));
            
            if (pddData.premissas?.length > 0) {
                children.push(...buildSection('15.1 Premissas', 2));
                pddData.premissas.forEach(p => children.push(buildBullet(p)));
            }
            
            if (pddData.restricoes?.length > 0) {
                children.push(...buildSection('15.2 Restrições', 2));
                pddData.restricoes.forEach(r => children.push(buildBullet(r)));
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 16. OBSERVAÇÕES
        // ═══════════════════════════════════════════════════════════════
        if (pddData.observacoes) {
            children.push(...buildSection('16. OBSERVAÇÕES', 1));
            children.push(buildParagraph(pddData.observacoes));
        }

        // ═══════════════════════════════════════════════════════════════
        // 17. GLOSSÁRIO
        // ═══════════════════════════════════════════════════════════════
        if (pddData.glossario?.length > 0) {
            children.push(...buildSection('17. GLOSSÁRIO', 1));
            children.push(...buildGlossary(pddData.glossario));
        }

        // ═══════════════════════════════════════════════════════════════
        // APROVAÇÕES
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('18. APROVAÇÕES', 1));
        children.push(...buildApprovals(pddData));

        // ═══════════════════════════════════════════════════════════════
        // CRIAR DOCUMENTO
        // ═══════════════════════════════════════════════════════════════
        return new docx.Document({
            styles: buildStyles(),
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: docx.convertInchesToTwip(1),
                            right: docx.convertInchesToTwip(1),
                            bottom: docx.convertInchesToTwip(1),
                            left: docx.convertInchesToTwip(1.2)
                        }
                    }
                },
                headers: {
                    default: new docx.Header({
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ 
                                        text: `${projectCode} | ${projectName}`, 
                                        size: 18, 
                                        color: "999999" 
                                    })
                                ],
                                alignment: docx.AlignmentType.RIGHT
                            })
                        ]
                    })
                },
                footers: {
                    default: new docx.Footer({
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ 
                                        text: `Minerva S.A. | Process Definition Document | Confidencial`, 
                                        size: 18, 
                                        color: "999999" 
                                    })
                                ],
                                alignment: docx.AlignmentType.CENTER
                            })
                        ]
                    })
                },
                children: children
            }]
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BUILDERS DE SEÇÕES ESPECÍFICAS
    // ═══════════════════════════════════════════════════════════════════════════

    function buildCoverPage(projectName, projectCode) {
        return [
            new docx.Paragraph({ spacing: { before: 1500 } }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "MINERVA S.A.", bold: true, size: 44, color: PRIMARY_COLOR })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "━".repeat(35), color: PRIMARY_COLOR, size: 24 })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 500 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "PROCESS DEFINITION DOCUMENT", bold: true, size: 32, color: "444444" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 80 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "(PDD)", size: 26, color: "666666" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 600 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: projectName, bold: true, size: 52, color: PRIMARY_COLOR })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: projectCode, size: 28, color: "666666", italics: true })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 800 }
            }),
            new docx.Paragraph({ spacing: { before: 1200 } }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, size: 22, color: "666666" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "Versão: 1.0", size: 22, color: "666666" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "Status: Em Elaboração", size: 22, color: "666666" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 300 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "CONFIDENCIAL - USO INTERNO", size: 20, color: PRIMARY_COLOR, bold: true })],
                alignment: docx.AlignmentType.CENTER
            }),
            new docx.Paragraph({ children: [new docx.PageBreak()] })
        ];
    }

    function buildTableOfContents() {
        return [
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "SUMÁRIO", bold: true, size: 36, color: PRIMARY_COLOR })],
                spacing: { after: 300 },
                border: { bottom: { color: PRIMARY_COLOR, space: 8, size: 16, style: docx.BorderStyle.SINGLE } }
            }),
            new docx.Paragraph({ spacing: { after: 200 } }),
            new docx.TableOfContents("Sumário", { hyperlink: true, headingStyleRange: "1-3" }),
            new docx.Paragraph({ children: [new docx.PageBreak()] })
        ];
    }

    function buildSection(title, level) {
        const sizes = { 1: 30, 2: 24, 3: 20 };
        const headings = { 1: docx.HeadingLevel.HEADING_1, 2: docx.HeadingLevel.HEADING_2, 3: docx.HeadingLevel.HEADING_3 };
        
        const paragraph = new docx.Paragraph({
            children: [new docx.TextRun({ 
                text: title, 
                bold: true, 
                size: sizes[level] || 22, 
                color: level === 1 ? PRIMARY_COLOR : "333333" 
            })],
            heading: headings[level] || docx.HeadingLevel.HEADING_3,
            spacing: { before: level === 1 ? 400 : 200, after: 120 }
        });

        if (level === 1) {
            return [paragraph, new docx.Paragraph({ spacing: { after: 80 } })];
        }
        
        return [paragraph];
    }

    function buildDocumentInfo(pddData) {
        const rows = [
            ['Nome do Projeto', pddData.projeto?.nome || '-'],
            ['Código do Projeto', pddData.projeto?.nome_codigo || '-'],
            ['Data de Criação', new Date().toLocaleDateString('pt-BR')],
            ['Versão', '1.0'],
            ['Status', 'Em Elaboração'],
            ['Complexidade', pddData.projeto?.complexidade || '-'],
            ['Criticidade', pddData.projeto?.criticidade || '-'],
            ['Sponsor', pddData.stakeholders?.sponsor || '-'],
            ['Product Owner', pddData.stakeholders?.product_owner || '-'],
            ['Responsável Técnico', pddData.stakeholders?.responsavel_tecnico || '-'],
            ['Responsável Negócio', pddData.stakeholders?.responsavel_negocio || '-'],
            ['Confidencialidade', 'Uso Interno']
        ];

        return [buildTable(['Campo', 'Informação'], rows)];
    }

    function buildExecutiveSummary(pddData) {
        const elements = [];
        const numRPAs = pddData.rpas?.length || 0;
        const sistemas = pddData.projeto?.sistemas_envolvidos?.join(', ') || 'N/A';
        
        let summary = pddData.projeto?.objetivo || 'Objetivo a ser definido.';
        elements.push(buildParagraph(summary));

        if (numRPAs > 0) {
            elements.push(new docx.Paragraph({ spacing: { before: 150 } }));
            elements.push(new docx.Paragraph({
                children: [new docx.TextRun({ 
                    text: `A solução será composta por ${numRPAs} automação(ões) RPA:`, 
                    bold: true, 
                    size: 22 
                })],
                spacing: { before: 100, after: 80 }
            }));

            pddData.rpas.forEach((rpa, i) => {
                elements.push(buildBullet(`${rpa.codigo || 'RPA-' + (i+1).toString().padStart(3, '0')}: ${rpa.nome || 'A definir'} - ${rpa.descricao || ''}`));
            });
        }

        if (sistemas !== 'N/A') {
            elements.push(new docx.Paragraph({ spacing: { before: 150 } }));
            elements.push(buildField('Sistemas Envolvidos', sistemas));
        }

        if (pddData.projeto?.areas_envolvidas?.length > 0) {
            elements.push(buildField('Áreas Envolvidas', pddData.projeto.areas_envolvidas.join(', ')));
        }

        return elements;
    }

    function buildArchitecture(pddData) {
        const elements = [];

        // Diagrama de fluxo em texto
        if (pddData.rpas?.length > 0) {
            elements.push(new docx.Paragraph({
                children: [new docx.TextRun({ text: 'Fluxo da Solução:', bold: true, size: 22 })],
                spacing: { before: 100, after: 100 }
            }));

            let flowText = '';
            pddData.rpas.forEach((rpa, i) => {
                flowText += `[${rpa.codigo || 'RPA-' + (i+1).toString().padStart(3, '0')}: ${rpa.nome || 'RPA ' + (i + 1)}]`;
                if (i < pddData.rpas.length - 1) flowText += ' → ';
            });

            elements.push(new docx.Paragraph({
                children: [new docx.TextRun({ text: flowText, font: 'Consolas', size: 18, color: '333333' })],
                shading: { type: docx.ShadingType.SOLID, color: 'F5F5F5' },
                spacing: { before: 100, after: 200 },
                alignment: docx.AlignmentType.CENTER
            }));
        }

        // Sistemas
        if (pddData.projeto?.sistemas_envolvidos?.length > 0) {
            elements.push(...buildSection('6.1 Sistemas Envolvidos', 2));
            pddData.projeto.sistemas_envolvidos.forEach(sistema => {
                elements.push(buildBullet(sistema));
            });
        }

        // Bancos de dados
        if (pddData.infraestrutura?.bancos_dados?.length > 0) {
            elements.push(...buildSection('6.2 Bancos de Dados', 2));
            const headers = ['Banco', 'Servidor', 'Tipo', 'Função'];
            const rows = pddData.infraestrutura.bancos_dados.map(db => [
                db.nome || '-', db.servidor || '-', db.tipo || '-', db.funcao || '-'
            ]);
            elements.push(buildTable(headers, rows));
        }

        return elements;
    }

    function buildRPASection(rpa, numero) {
        const elements = [];
        const rpaCode = rpa.codigo || `RPA-${numero.toString().padStart(3, '0')}`;
        const rpaTitle = `7.${numero} ${rpaCode} - ${rpa.nome || 'A DEFINIR'}`;
        
        elements.push(new docx.Paragraph({
            children: [new docx.TextRun({ text: rpaTitle, bold: true, size: 26, color: PRIMARY_COLOR })],
            heading: docx.HeadingLevel.HEADING_2,
            spacing: { before: 350, after: 150 },
            shading: { type: docx.ShadingType.SOLID, color: 'FFF5F5' },
            border: { bottom: { color: PRIMARY_COLOR, space: 4, size: 8, style: docx.BorderStyle.SINGLE } }
        }));

        // Descrição
        if (rpa.descricao) {
            elements.push(buildParagraph(rpa.descricao));
        }

        // Objetivo
        if (rpa.objetivo) {
            elements.push(new docx.Paragraph({ spacing: { before: 100 } }));
            elements.push(buildField('Objetivo', rpa.objetivo));
        }

        // Tabela de configuração
        const configRows = [
            ['Código', rpaCode],
            ['Tipo de Trigger', rpa.trigger?.tipo || '-'],
            ['Descrição do Trigger', rpa.trigger?.descricao || '-'],
            ['Frequência', rpa.trigger?.frequencia || '-'],
            ['Volume Estimado', rpa.trigger?.volume_estimado || '-'],
            ['Dados de Entrada', (rpa.entrada?.dados || []).join(', ') || '-'],
            ['Origem dos Dados', rpa.entrada?.origem || '-'],
            ['Dados de Saída', (rpa.saida?.dados || []).join(', ') || '-'],
            ['Destino dos Dados', rpa.saida?.destino || '-'],
            ['Sistemas Utilizados', (rpa.sistemas_utilizados || []).join(', ') || '-']
        ];
        
        elements.push(new docx.Paragraph({ spacing: { before: 150 } }));
        elements.push(buildTable(['Configuração', 'Valor'], configRows));

        // Fluxo de Execução
        if (rpa.fluxo_execucao?.length > 0) {
            elements.push(...buildSection(`7.${numero}.1 Fluxo de Execução`, 3));
            rpa.fluxo_execucao.forEach((passo, i) => {
                const texto = typeof passo === 'string' ? passo : passo.acao || passo.descricao || '';
                elements.push(buildNumbered(i + 1, texto));
            });
        }

        // Exceções
        if (rpa.excecoes?.length > 0) {
            elements.push(...buildSection(`7.${numero}.2 Tratamento de Exceções`, 3));
            rpa.excecoes.forEach(excecao => {
                const texto = typeof excecao === 'string' ? excecao : excecao.cenario || excecao.descricao || '';
                elements.push(buildBullet(texto));
            });
        }

        // Dependências
        if (rpa.dependencias) {
            elements.push(...buildSection(`7.${numero}.3 Dependências`, 3));
            if (rpa.dependencias.rpas_anteriores?.length > 0) {
                elements.push(buildField('RPAs Anteriores', rpa.dependencias.rpas_anteriores.join(', ')));
            }
            if (rpa.dependencias.sistemas_obrigatorios?.length > 0) {
                elements.push(buildField('Sistemas Obrigatórios', rpa.dependencias.sistemas_obrigatorios.join(', ')));
            }
        }

        // Métricas
        if (rpa.metricas) {
            elements.push(...buildSection(`7.${numero}.4 Métricas Esperadas`, 3));
            if (rpa.metricas.tempo_execucao_estimado) {
                elements.push(buildField('Tempo de Execução', rpa.metricas.tempo_execucao_estimado));
            }
            if (rpa.metricas.volume_processamento) {
                elements.push(buildField('Volume de Processamento', rpa.metricas.volume_processamento));
            }
            if (rpa.metricas.taxa_sucesso_esperada) {
                elements.push(buildField('Taxa de Sucesso Esperada', rpa.metricas.taxa_sucesso_esperada));
            }
        }

        return elements;
    }

    function buildRequirements(requisitos) {
        const elements = [];
        
        elements.push(buildParagraph('Esta seção detalha os requisitos funcionais identificados para o projeto.'));
        elements.push(new docx.Paragraph({ spacing: { after: 150 } }));

        // Tabela resumo
        const headers = ['Código', 'Título', 'Prioridade', 'Complexidade'];
        const rows = requisitos.map(rf => [
            rf.codigo || '-',
            rf.titulo || '-',
            rf.prioridade || 'SHOULD',
            rf.complexidade || 'MEDIA'
        ]);
        elements.push(buildTable(headers, rows));
        elements.push(new docx.Paragraph({ spacing: { after: 200 } }));

        // Detalhamento
        requisitos.forEach((rf, i) => {
            elements.push(new docx.Paragraph({
                children: [
                    new docx.TextRun({ text: `${rf.codigo || 'RF-' + (i+1).toString().padStart(3, '0')}: `, bold: true, color: PRIMARY_COLOR, size: 22 }),
                    new docx.TextRun({ text: rf.titulo || 'Sem título', bold: true, size: 22 })
                ],
                spacing: { before: 200, after: 80 }
            }));

            if (rf.descricao) {
                elements.push(buildParagraph(rf.descricao));
            }

            if (rf.fluxo_principal?.length > 0) {
                elements.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: 'Fluxo Principal:', bold: true, size: 20 })],
                    spacing: { before: 80, after: 40 }
                }));
                rf.fluxo_principal.forEach((passo, j) => {
                    elements.push(buildNumbered(j + 1, passo));
                });
            }

            if (rf.criterios_aceitacao?.length > 0) {
                elements.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: 'Critérios de Aceitação:', bold: true, size: 20 })],
                    spacing: { before: 80, after: 40 }
                }));
                rf.criterios_aceitacao.forEach(criterio => {
                    elements.push(buildBullet(criterio));
                });
            }
        });

        return elements;
    }

    function buildBusinessRules(regras) {
        const elements = [];
        
        elements.push(buildParagraph('Esta seção documenta as regras de negócio que governam o comportamento do sistema.'));
        elements.push(new docx.Paragraph({ spacing: { after: 150 } }));

        // Tabela resumo
        const headers = ['Código', 'Tipo', 'Título'];
        const rows = regras.map(rn => [
            rn.codigo || '-',
            rn.tipo || 'VAL',
            rn.titulo || rn.descricao?.substring(0, 50) || '-'
        ]);
        elements.push(buildTable(headers, rows));
        elements.push(new docx.Paragraph({ spacing: { after: 200 } }));

        // Detalhamento
        regras.forEach((rn, i) => {
            elements.push(new docx.Paragraph({
                children: [
                    new docx.TextRun({ text: `${rn.codigo || 'RN-' + (i+1).toString().padStart(3, '0')} `, bold: true, color: PRIMARY_COLOR, size: 22 }),
                    new docx.TextRun({ text: `[${rn.tipo || 'VAL'}] `, size: 20, color: '666666' }),
                    new docx.TextRun({ text: rn.titulo || '', bold: true, size: 22 })
                ],
                spacing: { before: 200, after: 80 }
            }));

            if (rn.descricao) {
                elements.push(buildParagraph(rn.descricao));
            }

            if (rn.logica) {
                elements.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: rn.logica, font: 'Consolas', size: 18 })],
                    shading: { type: docx.ShadingType.SOLID, color: 'F5F5F5' },
                    spacing: { before: 60, after: 60 }
                }));
            }

            if (rn.exemplos?.length > 0) {
                elements.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: 'Exemplos:', bold: true, size: 20 })],
                    spacing: { before: 60, after: 40 }
                }));
                rn.exemplos.forEach(ex => {
                    elements.push(buildBullet(`${ex.cenario}: ${ex.resultado || ''}`));
                });
            }
        });

        return elements;
    }

    function buildIntegrations(integracoes) {
        const elements = [];
        
        elements.push(buildParagraph('Esta seção descreve as integrações com sistemas externos necessárias para a solução.'));
        elements.push(new docx.Paragraph({ spacing: { after: 150 } }));

        // Tabela resumo
        const headers = ['Código', 'Sistema', 'Direção', 'Protocolo', 'Frequência'];
        const rows = integracoes.map(int => [
            int.codigo || '-',
            int.sistema_externo || '-',
            int.direcao || '-',
            int.protocolo || '-',
            int.frequencia || '-'
        ]);
        elements.push(buildTable(headers, rows));
        elements.push(new docx.Paragraph({ spacing: { after: 200 } }));

        // Detalhamento
        integracoes.forEach((int, i) => {
            elements.push(new docx.Paragraph({
                children: [
                    new docx.TextRun({ text: `${int.codigo || 'INT-' + (i+1).toString().padStart(3, '0')}: `, bold: true, color: PRIMARY_COLOR, size: 22 }),
                    new docx.TextRun({ text: int.sistema_externo || 'Sistema', bold: true, size: 22 })
                ],
                spacing: { before: 200, after: 80 }
            }));

            if (int.proposito) {
                elements.push(buildField('Propósito', int.proposito));
            }

            if (int.dados_trafegados?.length > 0) {
                elements.push(buildField('Dados Trafegados', int.dados_trafegados.join(', ')));
            }

            if (int.tratamento_erros) {
                elements.push(buildField('Tratamento de Erros', int.tratamento_erros));
            }
        });

        return elements;
    }

    function buildInfrastructure(infra) {
        const elements = [];

        // Servidores
        if (infra?.servidores?.length > 0) {
            elements.push(...buildSection('11.1 Servidores', 2));
            const headers = ['Servidor', 'Tipo', 'Função'];
            const rows = infra.servidores.map(s => [s.nome || '-', s.tipo || '-', s.funcao || '-']);
            elements.push(buildTable(headers, rows));
        }

        // Bancos
        if (infra?.bancos_dados?.length > 0) {
            elements.push(...buildSection('11.2 Bancos de Dados', 2));
            const headers = ['Banco', 'Servidor', 'Tipo', 'Função'];
            const rows = infra.bancos_dados.map(b => [b.nome || '-', b.servidor || '-', b.tipo || '-', b.funcao || '-']);
            elements.push(buildTable(headers, rows));
        }

        // Tecnologias
        if (infra?.tecnologias?.length > 0) {
            elements.push(...buildSection('11.3 Tecnologias Utilizadas', 2));
            infra.tecnologias.forEach(tech => {
                elements.push(buildBullet(tech));
            });
        }

        // Requisitos de Ambiente
        if (infra?.requisitos_ambiente?.length > 0) {
            elements.push(...buildSection('11.4 Requisitos de Ambiente', 2));
            infra.requisitos_ambiente.forEach(req => {
                elements.push(buildBullet(req));
            });
        }

        if (!infra?.servidores?.length && !infra?.tecnologias?.length) {
            elements.push(buildParagraph('Infraestrutura a ser definida durante o desenvolvimento.'));
        }

        return elements;
    }

    function buildSchedule(cronograma) {
        const elements = [];

        if (cronograma?.fases?.length > 0) {
            const headers = ['Fase', 'Duração Estimada', 'Entregas'];
            const rows = cronograma.fases.map(f => [
                f.fase || '-', 
                f.duracao_estimada || '-',
                (f.entregas || []).join(', ') || '-'
            ]);
            elements.push(buildTable(headers, rows));

            if (cronograma.marcos_principais?.length > 0) {
                elements.push(new docx.Paragraph({ spacing: { before: 150 } }));
                elements.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: 'Marcos Principais:', bold: true, size: 22 })],
                    spacing: { after: 80 }
                }));
                cronograma.marcos_principais.forEach(marco => {
                    elements.push(buildBullet(`${marco.marco}: ${marco.criterio_conclusao || ''}`));
                });
            }
        } else {
            // Cronograma padrão
            const defaultRows = [
                ['Desenvolvimento', '4-6 semanas', 'Código desenvolvido e testado unitariamente'],
                ['Testes Integrados', '1-2 semanas', 'Testes de integração e performance'],
                ['Homologação (UAT)', '1-2 semanas', 'Validação com usuários de negócio'],
                ['Implantação', '1 semana', 'Deploy em produção e go-live']
            ];
            elements.push(buildTable(['Fase', 'Duração Estimada', 'Entregas'], defaultRows));
            elements.push(new docx.Paragraph({ spacing: { before: 100 } }));
            elements.push(new docx.Paragraph({
                children: [new docx.TextRun({ text: 'Nota: Cronograma sugerido, sujeito a ajustes conforme complexidade identificada.', italics: true, size: 20, color: '666666' })]
            }));
        }

        return elements;
    }

    function buildRisks(riscos) {
        const elements = [];

        if (riscos?.length > 0) {
            const headers = ['Código', 'Risco', 'Prob.', 'Impacto', 'Mitigação'];
            const rows = riscos.map((r, i) => [
                r.codigo || `RISK-${(i+1).toString().padStart(3, '0')}`,
                r.descricao || '-',
                r.probabilidade || 'MEDIA',
                r.impacto || 'MEDIO',
                r.mitigacao || '-'
            ]);
            elements.push(buildTable(headers, rows));
        } else {
            // Riscos padrão
            const defaultRisks = [
                ['RISK-001', 'Indisponibilidade de sistemas integrados', 'MEDIA', 'ALTO', 'Implementar retry com backoff e alertas'],
                ['RISK-002', 'Mudança de layout/estrutura dos sistemas fonte', 'MEDIA', 'ALTO', 'Monitoramento proativo e versionamento'],
                ['RISK-003', 'Volume de dados acima do esperado', 'BAIXA', 'MEDIO', 'Processamento em lotes e escalabilidade'],
                ['RISK-004', 'Falha de conectividade de rede', 'BAIXA', 'ALTO', 'Redundância e tratamento de timeout']
            ];
            elements.push(buildTable(['Código', 'Risco', 'Prob.', 'Impacto', 'Mitigação'], defaultRisks));
        }

        return elements;
    }

    function buildStakeholders(stakeholders) {
        const rows = [];
        
        if (stakeholders?.sponsor) rows.push(['Sponsor', stakeholders.sponsor, 'Patrocinador do projeto']);
        if (stakeholders?.product_owner) rows.push(['Product Owner', stakeholders.product_owner, 'Dono do produto/processo']);
        if (stakeholders?.responsavel_negocio) rows.push(['Responsável Negócio', stakeholders.responsavel_negocio, 'Ponto focal da área de negócio']);
        if (stakeholders?.responsavel_tecnico) rows.push(['Responsável Técnico', stakeholders.responsavel_tecnico, 'Ponto focal técnico']);
        
        if (stakeholders?.usuarios_finais?.length > 0) {
            rows.push(['Usuários Finais', stakeholders.usuarios_finais.join(', '), 'Usuários que utilizarão a solução']);
        }
        
        if (stakeholders?.areas_impactadas?.length > 0) {
            rows.push(['Áreas Impactadas', stakeholders.areas_impactadas.join(', '), 'Áreas afetadas pelo projeto']);
        }
        
        if (rows.length === 0) {
            return [buildParagraph('Stakeholders a serem definidos.')];
        }
        
        return [buildTable(['Papel', 'Nome/Área', 'Responsabilidade'], rows)];
    }

    function buildGlossary(glossario) {
        const headers = ['Termo', 'Definição'];
        const rows = glossario.map(g => [g.termo || '-', g.definicao || '-']);
        return [buildTable(headers, rows)];
    }

    function buildApprovals(pddData) {
        const rows = [
            ['Sponsor', pddData.stakeholders?.sponsor || '_________________', '', '___/___/______'],
            ['Responsável Negócio', pddData.stakeholders?.responsavel_negocio || '_________________', '', '___/___/______'],
            ['Responsável Técnico', pddData.stakeholders?.responsavel_tecnico || '_________________', '', '___/___/______'],
            ['Gerente de Projeto', '_________________', '', '___/___/______']
        ];

        return [
            buildParagraph('As assinaturas abaixo confirmam a revisão e aprovação deste documento.'),
            new docx.Paragraph({ spacing: { after: 150 } }),
            buildTable(['Papel', 'Nome', 'Assinatura', 'Data'], rows)
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BUILDERS DE ELEMENTOS
    // ═══════════════════════════════════════════════════════════════════════════

    function buildParagraph(text) {
        return new docx.Paragraph({
            children: [new docx.TextRun({ text: text || '', size: 22 })],
            spacing: { before: 60, after: 60 },
            alignment: docx.AlignmentType.JUSTIFIED
        });
    }

    function buildBullet(text) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({ text: "• ", color: PRIMARY_COLOR, size: 22 }),
                new docx.TextRun({ text: text || '', size: 22 })
            ],
            spacing: { before: 40, after: 40 },
            indent: { left: docx.convertInchesToTwip(0.25) }
        });
    }

    function buildNumbered(num, text) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({ text: `${num}. `, bold: true, color: PRIMARY_COLOR, size: 22 }),
                new docx.TextRun({ text: text || '', size: 22 })
            ],
            spacing: { before: 40, after: 40 },
            indent: { left: docx.convertInchesToTwip(0.25) }
        });
    }

    function buildField(key, value) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({ text: `${key}: `, bold: true, size: 22, color: PRIMARY_COLOR }),
                new docx.TextRun({ text: value || '', size: 22 })
            ],
            spacing: { before: 50, after: 50 }
        });
    }

    function buildTable(headers, rows) {
        const tableRows = [];
        
        // Header
        tableRows.push(new docx.TableRow({
            children: headers.map(h => new docx.TableCell({
                children: [new docx.Paragraph({
                    children: [new docx.TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })],
                    spacing: { before: 50, after: 50 }
                })],
                shading: { type: docx.ShadingType.SOLID, color: PRIMARY_COLOR },
                verticalAlign: docx.VerticalAlign.CENTER,
                margins: { top: 60, bottom: 60, left: 100, right: 100 }
            })),
            tableHeader: true
        }));

        // Rows
        rows.forEach((row, idx) => {
            tableRows.push(new docx.TableRow({
                children: row.map(cell => new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [new docx.TextRun({ text: String(cell || ''), size: 20 })],
                        spacing: { before: 30, after: 30 }
                    })],
                    shading: idx % 2 === 0 ? { type: docx.ShadingType.SOLID, color: "F9F9F9" } : undefined,
                    margins: { top: 50, bottom: 50, left: 100, right: 100 }
                }))
            }));
        });

        return new docx.Table({
            rows: tableRows,
            width: { size: 100, type: docx.WidthType.PERCENTAGE }
        });
    }

    function buildStyles() {
        return {
            default: {
                document: {
                    run: { font: "Calibri", size: 22 }
                }
            },
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 30, bold: true, color: PRIMARY_COLOR }
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 24, bold: true }
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 20, bold: true, italics: true }
                }
            ]
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        build
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDDBuilder;
}
