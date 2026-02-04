/**
 * MINERVA PDD GENERATOR - PDD Builder Module
 * Constrói o documento Word do PDD a partir dos dados estruturados
 */

const PDDBuilder = (function() {
    'use strict';

    const PRIMARY_COLOR = 'C41E3A';
    const SECONDARY_COLOR = '8B0000';

    /**
     * Constrói o documento Word completo do PDD
     */
    function build(pddData, options = {}) {
        const {
            incluirCapa = true,
            incluirSumario = true,
            incluirCronograma = true,
            incluirRiscos = true
        } = options;

        const children = [];
        const projectName = pddData.projeto?.nome || 'Documento de Projeto';

        // ═══════════════════════════════════════════════════════════════
        // CAPA
        // ═══════════════════════════════════════════════════════════════
        if (incluirCapa) {
            children.push(...buildCoverPage(projectName));
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
        // 3. OBJETIVO
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('3. OBJETIVO', 1));
        children.push(buildParagraph(pddData.projeto?.objetivo || 'A ser definido.'));

        // ═══════════════════════════════════════════════════════════════
        // 4. ESCOPO
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('4. ESCOPO', 1));
        children.push(...buildSection('4.1 Incluído no Escopo', 2));
        children.push(buildParagraph(pddData.projeto?.escopo || 'A ser definido.'));
        
        if (pddData.projeto?.fora_escopo) {
            children.push(...buildSection('4.2 Fora do Escopo', 2));
            children.push(buildParagraph(pddData.projeto.fora_escopo));
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. BENEFÍCIOS
        // ═══════════════════════════════════════════════════════════════
        if (pddData.projeto?.beneficios?.length > 0) {
            children.push(...buildSection('5. BENEFÍCIOS ESPERADOS', 1));
            pddData.projeto.beneficios.forEach(beneficio => {
                children.push(buildBullet(beneficio));
            });
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
        // 8. INFRAESTRUTURA
        // ═══════════════════════════════════════════════════════════════
        children.push(...buildSection('8. INFRAESTRUTURA', 1));
        children.push(...buildInfrastructure(pddData.infraestrutura));

        // ═══════════════════════════════════════════════════════════════
        // 9. CRONOGRAMA
        // ═══════════════════════════════════════════════════════════════
        if (incluirCronograma && pddData.cronograma?.fases?.length > 0) {
            children.push(...buildSection('9. CRONOGRAMA', 1));
            children.push(...buildSchedule(pddData.cronograma));
        }

        // ═══════════════════════════════════════════════════════════════
        // 10. RISCOS
        // ═══════════════════════════════════════════════════════════════
        if (incluirRiscos && pddData.riscos?.length > 0) {
            children.push(...buildSection('10. ANÁLISE DE RISCOS', 1));
            children.push(...buildRisks(pddData.riscos));
        }

        // ═══════════════════════════════════════════════════════════════
        // 11. STAKEHOLDERS
        // ═══════════════════════════════════════════════════════════════
        if (pddData.stakeholders) {
            children.push(...buildSection('11. STAKEHOLDERS', 1));
            children.push(...buildStakeholders(pddData.stakeholders));
        }

        // ═══════════════════════════════════════════════════════════════
        // OBSERVAÇÕES
        // ═══════════════════════════════════════════════════════════════
        if (pddData.observacoes) {
            children.push(...buildSection('12. OBSERVAÇÕES', 1));
            children.push(buildParagraph(pddData.observacoes));
        }

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
                footers: {
                    default: new docx.Footer({
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.TextRun({ 
                                        text: `Minerva S.A. | ${projectName} | PDD`, 
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
    // BUILDERS DE SEÇÕES
    // ═══════════════════════════════════════════════════════════════════════════

    function buildCoverPage(projectName) {
        return [
            new docx.Paragraph({ spacing: { before: 2000 } }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "MINERVA S.A.", bold: true, size: 40, color: PRIMARY_COLOR })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "━".repeat(30), color: PRIMARY_COLOR, size: 24 })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "PROCESS DEFINITION DOCUMENT", bold: true, size: 28, color: "666666" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "(PDD)", size: 24, color: "666666" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 600 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: projectName, bold: true, size: 56, color: PRIMARY_COLOR })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 800 }
            }),
            new docx.Paragraph({ spacing: { before: 1500 } }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: `Data: ${new Date().toLocaleDateString('pt-BR')}`, size: 24, color: "666666" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "Versão: 1.0", size: 24, color: "666666" })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 100 }
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: "Confidencial - Uso Interno", size: 20, color: "999999", italics: true })],
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
        const sizes = { 1: 32, 2: 26, 3: 22 };
        const headings = { 1: docx.HeadingLevel.HEADING_1, 2: docx.HeadingLevel.HEADING_2, 3: docx.HeadingLevel.HEADING_3 };
        
        const paragraph = new docx.Paragraph({
            children: [new docx.TextRun({ 
                text: title, 
                bold: true, 
                size: sizes[level] || 24, 
                color: level === 1 ? PRIMARY_COLOR : "333333" 
            })],
            heading: headings[level] || docx.HeadingLevel.HEADING_3,
            spacing: { before: level === 1 ? 400 : 250, after: 150 }
        });

        if (level === 1) {
            return [
                paragraph,
                new docx.Paragraph({ spacing: { after: 100 } })
            ];
        }
        
        return [paragraph];
    }

    function buildDocumentInfo(pddData) {
        const rows = [
            ['Nome do Projeto', pddData.projeto?.nome || '-'],
            ['Data de Criação', new Date().toLocaleDateString('pt-BR')],
            ['Versão', '1.0'],
            ['Status', 'Em Elaboração'],
            ['Responsável Técnico', pddData.stakeholders?.responsavel_tecnico || '-'],
            ['Responsável Negócio', pddData.stakeholders?.responsavel_negocio || '-'],
            ['Sponsor', pddData.stakeholders?.sponsor || '-'],
            ['Confidencialidade', 'Uso Interno']
        ];

        return [buildTable(['Campo', 'Valor'], rows)];
    }

    function buildExecutiveSummary(pddData) {
        const numRPAs = pddData.rpas?.length || 0;
        const sistemas = pddData.projeto?.sistemas_envolvidos?.join(', ') || 'N/A';
        
        let summary = pddData.projeto?.objetivo || '';
        
        if (numRPAs > 0) {
            summary += `\n\nA solução será composta por ${numRPAs} automação(ões) RPA:`;
        }

        const elements = [buildParagraph(summary)];

        if (pddData.rpas?.length > 0) {
            pddData.rpas.forEach((rpa, i) => {
                elements.push(buildBullet(`RPA ${i + 1}: ${rpa.nome || 'A definir'} - ${rpa.descricao || ''}`));
            });
        }

        if (sistemas !== 'N/A') {
            elements.push(new docx.Paragraph({ spacing: { before: 150 } }));
            elements.push(buildField('Sistemas Envolvidos', sistemas));
        }

        return elements;
    }

    function buildArchitecture(pddData) {
        const elements = [];

        // Diagrama simplificado em texto
        if (pddData.rpas?.length > 0) {
            elements.push(new docx.Paragraph({
                children: [new docx.TextRun({ text: 'Fluxo da Solução:', bold: true, size: 22 })],
                spacing: { before: 100, after: 100 }
            }));

            // Criar representação visual do fluxo
            let flowText = '';
            pddData.rpas.forEach((rpa, i) => {
                flowText += `[RPA ${i + 1}: ${rpa.nome || 'RPA ' + (i + 1)}]`;
                if (i < pddData.rpas.length - 1) flowText += ' → ';
            });

            elements.push(new docx.Paragraph({
                children: [new docx.TextRun({ text: flowText, font: 'Consolas', size: 20, color: '333333' })],
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
            const headers = ['Banco', 'Servidor', 'Função'];
            const rows = pddData.infraestrutura.bancos_dados.map(db => [
                db.nome || '-', db.servidor || '-', db.funcao || '-'
            ]);
            elements.push(buildTable(headers, rows));
        }

        return elements;
    }

    function buildRPASection(rpa, numero) {
        const elements = [];
        const rpaTitle = `7.${numero} RPA ${numero} - ${rpa.nome || 'A DEFINIR'}`;
        
        elements.push(new docx.Paragraph({
            children: [new docx.TextRun({ text: rpaTitle, bold: true, size: 28, color: PRIMARY_COLOR })],
            heading: docx.HeadingLevel.HEADING_2,
            spacing: { before: 350, after: 150 },
            shading: { type: docx.ShadingType.SOLID, color: 'FFF5F5' },
            border: { bottom: { color: PRIMARY_COLOR, space: 4, size: 8, style: docx.BorderStyle.SINGLE } }
        }));

        // Descrição
        if (rpa.descricao) {
            elements.push(buildParagraph(rpa.descricao));
        }

        // Tabela de configuração
        const configRows = [
            ['Trigger', rpa.trigger || '-'],
            ['Frequência', rpa.frequencia || '-'],
            ['Input', Array.isArray(rpa.input) ? rpa.input.join(', ') : (rpa.input || '-')],
            ['Output', Array.isArray(rpa.output) ? rpa.output.join(', ') : (rpa.output || '-')],
            ['Sistemas', Array.isArray(rpa.sistemas) ? rpa.sistemas.join(', ') : (rpa.sistemas || '-')]
        ];
        
        elements.push(new docx.Paragraph({ spacing: { before: 150 } }));
        elements.push(buildTable(['Configuração', 'Valor'], configRows));

        // Passos/Fluxo
        if (rpa.passos?.length > 0) {
            elements.push(...buildSection(`7.${numero}.1 Fluxo de Execução`, 3));
            rpa.passos.forEach((passo, i) => {
                elements.push(buildNumbered(i + 1, passo));
            });
        }

        // Exceções
        if (rpa.excecoes?.length > 0) {
            elements.push(...buildSection(`7.${numero}.2 Tratamento de Exceções`, 3));
            rpa.excecoes.forEach(excecao => {
                elements.push(buildBullet(excecao));
            });
        }

        return elements;
    }

    function buildInfrastructure(infra) {
        const elements = [];

        // Servidores
        if (infra?.servidores?.length > 0) {
            elements.push(...buildSection('8.1 Servidores', 2));
            const headers = ['Servidor', 'Função'];
            const rows = infra.servidores.map(s => [s.nome || '-', s.funcao || '-']);
            elements.push(buildTable(headers, rows));
        }

        // Tecnologias
        if (infra?.tecnologias?.length > 0) {
            elements.push(...buildSection('8.2 Tecnologias Utilizadas', 2));
            infra.tecnologias.forEach(tech => {
                elements.push(buildBullet(tech));
            });
        }

        if (!infra?.servidores?.length && !infra?.tecnologias?.length) {
            elements.push(buildParagraph('A ser definido durante o desenvolvimento.'));
        }

        return elements;
    }

    function buildSchedule(cronograma) {
        const headers = ['Fase', 'Duração Estimada'];
        const rows = cronograma.fases.map(f => [f.fase || '-', f.duracao_estimada || '-']);
        return [buildTable(headers, rows)];
    }

    function buildRisks(riscos) {
        const headers = ['Risco', 'Mitigação'];
        const rows = riscos.map(r => [r.risco || '-', r.mitigacao || '-']);
        return [buildTable(headers, rows)];
    }

    function buildStakeholders(stakeholders) {
        const rows = [];
        if (stakeholders.sponsor) rows.push(['Sponsor', stakeholders.sponsor]);
        if (stakeholders.responsavel_negocio) rows.push(['Responsável Negócio', stakeholders.responsavel_negocio]);
        if (stakeholders.responsavel_tecnico) rows.push(['Responsável Técnico', stakeholders.responsavel_tecnico]);
        
        if (rows.length === 0) {
            return [buildParagraph('A ser definido.')];
        }
        
        return [buildTable(['Papel', 'Nome/Área'], rows)];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BUILDERS DE ELEMENTOS
    // ═══════════════════════════════════════════════════════════════════════════

    function buildParagraph(text) {
        return new docx.Paragraph({
            children: [new docx.TextRun({ text: text || '', size: 22 })],
            spacing: { before: 80, after: 80 },
            alignment: docx.AlignmentType.JUSTIFIED
        });
    }

    function buildBullet(text) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({ text: "• ", color: PRIMARY_COLOR, size: 22 }),
                new docx.TextRun({ text: text || '', size: 22 })
            ],
            spacing: { before: 50, after: 50 },
            indent: { left: docx.convertInchesToTwip(0.25) }
        });
    }

    function buildNumbered(num, text) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({ text: `${num}. `, bold: true, color: PRIMARY_COLOR, size: 22 }),
                new docx.TextRun({ text: text || '', size: 22 })
            ],
            spacing: { before: 50, after: 50 },
            indent: { left: docx.convertInchesToTwip(0.25) }
        });
    }

    function buildField(key, value) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({ text: `${key}: `, bold: true, size: 22, color: PRIMARY_COLOR }),
                new docx.TextRun({ text: value || '', size: 22 })
            ],
            spacing: { before: 60, after: 60 }
        });
    }

    function buildTable(headers, rows) {
        const tableRows = [];
        
        // Header
        tableRows.push(new docx.TableRow({
            children: headers.map(h => new docx.TableCell({
                children: [new docx.Paragraph({
                    children: [new docx.TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })],
                    spacing: { before: 60, after: 60 }
                })],
                shading: { type: docx.ShadingType.SOLID, color: PRIMARY_COLOR },
                verticalAlign: docx.VerticalAlign.CENTER,
                margins: { top: 80, bottom: 80, left: 120, right: 120 }
            })),
            tableHeader: true
        }));

        // Rows
        rows.forEach((row, idx) => {
            tableRows.push(new docx.TableRow({
                children: row.map(cell => new docx.TableCell({
                    children: [new docx.Paragraph({
                        children: [new docx.TextRun({ text: String(cell || ''), size: 20 })],
                        spacing: { before: 40, after: 40 }
                    })],
                    shading: idx % 2 === 0 ? { type: docx.ShadingType.SOLID, color: "F9F9F9" } : undefined,
                    margins: { top: 60, bottom: 60, left: 120, right: 120 }
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
                    run: { size: 32, bold: true, color: PRIMARY_COLOR }
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 26, bold: true }
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 22, bold: true, italics: true }
                }
            ]
        };
    }

    return {
        build
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDDBuilder;
}
