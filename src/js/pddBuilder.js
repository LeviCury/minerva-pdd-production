/**
 * MINERVA PDD GENERATOR - Document Builder Module v4.0
 * Gerador de Documento Word Profissional com Formatação Avançada
 * 
 * Baseado nas especificações de formatação PDD Minerva
 */

const PDDBuilder = (function() {
    'use strict';

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
            WidthType, AlignmentType, HeadingLevel, BorderStyle, 
            PageBreak, Header, Footer, PageNumber, NumberFormat,
            TableOfContents, StyleLevel, ShadingType, VerticalAlign,
            convertInchesToTwip, PageOrientation, LevelFormat,
            SectionType, TabStopType, TabStopPosition, ImageRun } = docx;

    // ═══════════════════════════════════════════════════════════════════════════
    // PALETA DE CORES MINERVA
    // ═══════════════════════════════════════════════════════════════════════════

    const COLORS = {
        // Cores Principais - Executivo/Corporativo
        PRIMARY: '1a365d',        // Azul Escuro (Títulos Nível 1)
        SECONDARY: '2c5282',      // Azul Médio (Títulos Nível 2)
        TERTIARY: '4a5568',       // Cinza Escuro (Títulos Nível 3)
        
        // Cores Funcionais - Tons sóbrios
        RF_GREEN: '276749',       // Verde Escuro para RF
        RN_ORANGE: '975a16',      // Dourado/Ocre para RN
        RNF_PURPLE: '553c9a',     // Roxo Escuro para RNF
        INT_TEAL: '285e61',       // Verde Petróleo para INT
        
        // Cores de Status - Mais sutis
        SUCCESS: '276749',        // Verde Escuro
        WARNING: '975a16',        // Dourado Escuro
        ERROR: '9b2c2c',          // Vermelho Escuro
        INFO: '2c5282',           // Azul Médio
        
        // Fundos - Tons neutros
        BG_NOTE: 'f7fafc',        // Cinza muito claro
        BG_WARNING: 'fffff0',     // Creme suave
        BG_ERROR: 'fff5f5',       // Rosa muito suave
        BG_SUCCESS: 'f0fff4',     // Verde muito suave
        BG_CODE: 'f7fafc',        // Cinza claro
        BG_HEADER: '1a365d',      // Azul Escuro
        
        // Textos
        WHITE: 'FFFFFF',
        BLACK: '1a202c',
        GRAY: '4a5568',
        LIGHT_GRAY: 'e2e8f0'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURAÇÕES DE FONTE
    // ═══════════════════════════════════════════════════════════════════════════

    const FONTS = {
        TITLE: 'Segoe UI',
        BODY: 'Segoe UI',
        CODE: 'Consolas'
    };

    const SIZES = {
        TITLE_1: 36,    // 18pt
        TITLE_2: 28,    // 14pt
        TITLE_3: 24,    // 12pt
        BODY: 22,       // 11pt
        SMALL: 20,      // 10pt
        TINY: 18,       // 9pt
        CODE: 20        // 10pt
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUTOR PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════════════

    async function build(pddData, options = {}) {
        // Gerar diagramas se solicitado
        let diagramImages = [];
        if (options.incluirDiagramas !== false && typeof DiagramGenerator !== 'undefined') {
            try {
                console.log('Iniciando renderização de diagramas para Word...');
                diagramImages = await DiagramGenerator.renderAllForWord(pddData);
                console.log(`Diagramas recebidos para Word: ${diagramImages.length}`);
                diagramImages.forEach((d, i) => console.log(`  ${i + 1}. ${d.title} (${d.type})`));
            } catch (e) {
                console.warn('Não foi possível gerar diagramas:', e);
            }
        }

        const doc = new Document({
            creator: 'Minerva PDD Generator',
            title: pddData.projeto?.nome || 'Documento de Escopo PDD',
            description: 'Documento de Escopo - Prompt Driven Development',
            styles: buildStyles(),
            sections: [
                // SEÇÃO 0: CAPA (sem cabeçalho/rodapé)
                buildCoverSection(pddData),
                
                // SEÇÃO 1: CONTROLE DE VERSÕES + SUMÁRIO EXECUTIVO
                buildPreTextualSection(pddData),
                
                // SEÇÃO 2: CORPO DO DOCUMENTO
                buildMainSection(pddData, options, diagramImages)
            ]
        });

        const blob = await Packer.toBlob(doc);
        const fileName = `PDD_${(pddData.projeto?.nome || 'Projeto').replace(/[^a-zA-Z0-9]/g, '_')}_v1.0.docx`;
        saveAs(blob, fileName);

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ESTILOS DO DOCUMENTO
    // ═══════════════════════════════════════════════════════════════════════════

    function buildStyles() {
        return {
            default: {
                document: {
                    run: {
                        font: FONTS.BODY,
                        size: SIZES.BODY
                    },
                    paragraph: {
                        spacing: { after: 120, line: 276 } // 1.15 line spacing
                    }
                },
                heading1: {
                    run: {
                        font: FONTS.TITLE,
                        size: SIZES.TITLE_1,
                        bold: true,
                        color: COLORS.PRIMARY
                    },
                    paragraph: {
                        spacing: { before: 480, after: 240 }
                    }
                },
                heading2: {
                    run: {
                        font: FONTS.TITLE,
                        size: SIZES.TITLE_2,
                        bold: true,
                        color: COLORS.SECONDARY
                    },
                    paragraph: {
                        spacing: { before: 360, after: 120 }
                    }
                },
                heading3: {
                    run: {
                        font: FONTS.TITLE,
                        size: SIZES.TITLE_3,
                        bold: true,
                        color: COLORS.TERTIARY
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 }
                    }
                }
            },
            paragraphStyles: [
                {
                    id: 'PDDCorpo',
                    name: 'PDD Corpo',
                    basedOn: 'Normal',
                    run: { font: FONTS.BODY, size: SIZES.BODY },
                    paragraph: { 
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120, line: 276 }
                    }
                },
                {
                    id: 'PDDCodigo',
                    name: 'PDD Código',
                    basedOn: 'Normal',
                    run: { font: FONTS.CODE, size: SIZES.CODE },
                    paragraph: { 
                        shading: { fill: COLORS.BG_CODE },
                        spacing: { after: 60 }
                    }
                }
            ]
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEÇÃO 0: CAPA
    // ═══════════════════════════════════════════════════════════════════════════

    function buildCoverSection(pddData) {
        const projeto = pddData.projeto || {};
        const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        const rpasCount = pddData.rpas?.length || 0;
        const complexidade = projeto.complexidade || 'N/D';
        const criticidade = projeto.criticidade || 'N/D';

        // Tabela de informações da capa (estilo executivo)
        const infoTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header da tabela
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: 'INFORMAÇÕES DO DOCUMENTO', font: FONTS.TITLE, size: SIZES.SMALL, bold: true, color: COLORS.WHITE })]
                            })],
                            shading: { fill: COLORS.PRIMARY, type: ShadingType.CLEAR },
                            columnSpan: 2,
                            verticalAlign: VerticalAlign.CENTER
                        })
                    ]
                }),
                // Linhas de dados
                ...buildCoverInfoRows([
                    ['Projeto', projeto.nome || 'A definir'],
                    ['Código', projeto.nome_codigo || 'A definir'],
                    ['Área Solicitante', projeto.areas_envolvidas?.[0] || 'A definir'],
                    ['Analista Responsável', pddData.stakeholders?.responsavel_tecnico || 'MBS TI'],
                    ['Departamento', 'MBS TI - Automação RPA'],
                    ['Nº de RPAs', `${rpasCount} automação${rpasCount !== 1 ? 'ões' : ''}`],
                    ['Complexidade', complexidade],
                    ['Criticidade', criticidade],
                    ['Data de Emissão', dataAtual],
                    ['Versão', '1.0'],
                    ['Status', 'DRAFT - Gerado por IA']
                ])
            ]
        });

        return {
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.98),
                        bottom: convertInchesToTwip(0.98),
                        left: convertInchesToTwip(1.18),
                        right: convertInchesToTwip(0.79)
                    },
                    size: {
                        width: convertInchesToTwip(8.27),
                        height: convertInchesToTwip(11.69)
                    }
                },
                type: SectionType.NEXT_PAGE
            },
            children: [
                // Espaçamento superior generoso
                new Paragraph({ spacing: { before: 800 } }),
                
                // Logo corporativa
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: 'MINERVA FOODS', font: FONTS.TITLE, size: 56, bold: true, color: COLORS.PRIMARY })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: 'MBS TI - Centro de Excelência em Automação', font: FONTS.BODY, size: SIZES.SMALL, color: COLORS.GRAY, italics: true })
                    ],
                    spacing: { after: 500 }
                }),
                
                // Barra decorativa superior
                buildColorBar(),
                
                // Espaço
                new Paragraph({ spacing: { before: 500 } }),
                
                // Tipo de documento
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: 'DOCUMENTO DE ESCOPO', font: FONTS.TITLE, size: 28, bold: true, color: COLORS.TERTIARY, allCaps: true }),
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: 'Prompt Driven Development (PDD)', font: FONTS.TITLE, size: 22, color: COLORS.SECONDARY })
                    ],
                    spacing: { after: 500 }
                }),
                
                // Nome do projeto - destaque principal
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: (projeto.nome || 'Nome do Projeto').toUpperCase(), font: FONTS.TITLE, size: 44, bold: true, color: COLORS.PRIMARY })
                    ],
                    spacing: { after: 100 }
                }),
                
                // Código do projeto
                projeto.nome_codigo ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: `[ ${projeto.nome_codigo} ]`, font: 'Consolas', size: 22, color: COLORS.GRAY })
                    ],
                    spacing: { after: 500 }
                }) : new Paragraph({ spacing: { after: 500 } }),
                
                // Barra decorativa inferior
                buildColorBar(),
                
                // Espaço antes da tabela
                new Paragraph({ spacing: { before: 500 } }),
                
                // Tabela de informações executivas
                infoTable,
                
                // Espaço final
                new Paragraph({ spacing: { before: 800 } }),
                
                // Classificação e confidencialidade
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: 'CONFIDENCIAL - USO INTERNO', font: FONTS.BODY, size: SIZES.TINY, bold: true, color: COLORS.ERROR }),
                        new TextRun({ text: '  |  ', font: FONTS.BODY, size: SIZES.TINY, color: COLORS.LIGHT_GRAY }),
                        new TextRun({ text: 'Powered by MAIA (GPT-5.2)', font: FONTS.BODY, size: SIZES.TINY, italics: true, color: COLORS.GRAY })
                    ]
                })
            ]
        };
    }

    /**
     * Helper: Barra colorida decorativa para a capa
     */
    function buildColorBar() {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    height: { value: 120, rule: 'exact' },
                    children: [
                        new TableCell({
                            children: [new Paragraph('')],
                            shading: { fill: '8B0000', type: ShadingType.CLEAR },
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        }),
                        new TableCell({
                            children: [new Paragraph('')],
                            shading: { fill: COLORS.PRIMARY, type: ShadingType.CLEAR },
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        }),
                        new TableCell({
                            children: [new Paragraph('')],
                            shading: { fill: COLORS.SECONDARY, type: ShadingType.CLEAR },
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        }),
                        new TableCell({
                            children: [new Paragraph('')],
                            shading: { fill: COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        })
                    ]
                })
            ]
        });
    }

    /**
     * Helper: Constrói linhas da tabela de informações da capa
     */
    function buildCoverInfoRows(items) {
        return items.map((item, i) => {
            const isEven = i % 2 === 0;
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: item[0], font: FONTS.BODY, size: SIZES.SMALL, bold: true, color: COLORS.PRIMARY })],
                            spacing: { before: 40, after: 40 }
                        })],
                        width: { size: 35, type: WidthType.PERCENTAGE },
                        shading: { fill: isEven ? 'f7fafc' : COLORS.WHITE, type: ShadingType.CLEAR },
                        verticalAlign: VerticalAlign.CENTER
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: item[1], font: FONTS.BODY, size: SIZES.SMALL, color: COLORS.BLACK })],
                            spacing: { before: 40, after: 40 }
                        })],
                        width: { size: 65, type: WidthType.PERCENTAGE },
                        shading: { fill: isEven ? 'f7fafc' : COLORS.WHITE, type: ShadingType.CLEAR },
                        verticalAlign: VerticalAlign.CENTER
                    })
                ]
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEÇÃO 1: ELEMENTOS PRÉ-TEXTUAIS
    // ═══════════════════════════════════════════════════════════════════════════

    function buildPreTextualSection(pddData) {
        const children = [];
        
        // CONTROLE DE VERSÕES
        children.push(...buildVersionControl(pddData));
        
        // QUEBRA DE PÁGINA
        children.push(new Paragraph({ children: [new PageBreak()] }));
        
        // SUMÁRIO EXECUTIVO
        children.push(...buildExecutiveSummary(pddData));
        
        // QUEBRA DE PÁGINA
        children.push(new Paragraph({ children: [new PageBreak()] }));
        
        // SUMÁRIO (TOC)
        children.push(...buildTableOfContents());

        return {
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.98),
                        bottom: convertInchesToTwip(0.98),
                        left: convertInchesToTwip(1.18),
                        right: convertInchesToTwip(0.79)
                    }
                },
                type: SectionType.NEXT_PAGE
            },
            headers: {
                default: new Header({
                    children: [buildHeaderParagraph(pddData.projeto?.nome || 'PDD')]
                })
            },
            footers: {
                default: new Footer({
                    children: [buildFooterParagraph(pddData.projeto?.nome || 'PDD', true)]
                })
            },
            children: children
        };
    }

    function buildVersionControl(pddData) {
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const autor = pddData.stakeholders?.responsavel_tecnico || 'Analista';
        
        return [
            // Título
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [
                    new TextRun({
                        text: 'CONTROLE DE VERSÕES',
                        font: FONTS.TITLE,
                        size: SIZES.TITLE_1,
                        bold: true,
                        color: COLORS.PRIMARY
                    })
                ],
                spacing: { before: 200, after: 400 }
            }),
            
            // Tabela de versões
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    // Cabeçalho
                    new TableRow({
                        tableHeader: true,
                        children: [
                            buildHeaderCell('Versão', 12),
                            buildHeaderCell('Data', 18),
                            buildHeaderCell('Autor', 20),
                            buildHeaderCell('Aprovador', 20),
                            buildHeaderCell('Mudanças', 30)
                        ]
                    }),
                    // Versão inicial
                    new TableRow({
                        children: [
                            buildBodyCell('0.1'),
                            buildBodyCell(dataAtual),
                            buildBodyCell(autor),
                            buildBodyCell('-'),
                            buildBodyCell('Versão inicial (rascunho)')
                        ]
                    }),
                    // Versão 1.0
                    new TableRow({
                        children: [
                            buildBodyCell('1.0'),
                            buildBodyCell(dataAtual),
                            buildBodyCell(autor),
                            buildBodyCell(pddData.stakeholders?.sponsor || 'A definir'),
                            buildBodyCell('Versão para aprovação')
                        ]
                    })
                ]
            }),
            
            new Paragraph({ spacing: { after: 400 } })
        ];
    }

    function buildExecutiveSummary(pddData) {
        const projeto = pddData.projeto || {};
        const children = [];

        // Título
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
                new TextRun({
                    text: 'SUMÁRIO EXECUTIVO',
                    font: FONTS.TITLE,
                    size: SIZES.TITLE_1,
                    bold: true,
                    color: COLORS.PRIMARY
                })
            ],
            spacing: { before: 200, after: 400 }
        }));

        // Caixa de destaque - Dados do Projeto
        children.push(...buildHighlightBox('DADOS DO PROJETO', [
            `• Nome: ${projeto.nome || 'A definir'}`,
            `• Código: ${projeto.nome_codigo || 'A definir'}`,
            `• Área/Cliente: ${projeto.areas_envolvidas?.join(', ') || 'A definir'}`,
            `• Complexidade: ${projeto.complexidade || 'MÉDIA'}`,
            `• Criticidade: ${projeto.criticidade || 'MÉDIA'}`,
            `• Sistemas: ${projeto.sistemas_envolvidos?.join(', ') || 'A definir'}`
        ], COLORS.BG_NOTE, COLORS.SECONDARY));

        // Visão Geral
        children.push(buildSubtitle('Visão Geral'));
        children.push(buildParagraph(projeto.objetivo || 'Objetivo do projeto a ser definido.'));

        // Justificativa
        if (projeto.justificativa) {
            children.push(buildSubtitle('Justificativa'));
            children.push(buildParagraph(projeto.justificativa));
        }

        // AS-IS / TO-BE
        children.push(buildSubtitle('📍 Situação Atual (AS-IS)'));
        if (projeto.escopo?.excluido?.length > 0) {
            projeto.escopo.excluido.forEach(item => {
                children.push(buildBullet(item));
            });
        } else {
            children.push(buildBullet('Processo manual com alto volume de trabalho'));
            children.push(buildBullet('Suscetível a erros humanos'));
            children.push(buildBullet('Tempo elevado de execução'));
        }

        children.push(buildSubtitle('Situação Desejada (TO-BE)'));
        if (projeto.escopo?.incluido?.length > 0) {
            projeto.escopo.incluido.forEach(item => {
                children.push(buildBullet(item));
            });
        } else {
            children.push(buildBullet('Processo automatizado via RPA'));
            children.push(buildBullet('Redução significativa de erros'));
            children.push(buildBullet('Ganho de produtividade'));
        }

        // Benefícios
        if (projeto.beneficios?.tangiveis?.length > 0 || projeto.beneficios?.intangiveis?.length > 0) {
            children.push(...buildHighlightBox('PROPOSTA DE VALOR', [
                ...(projeto.beneficios?.tangiveis || []).map(b => `• ${b}`),
                ...(projeto.beneficios?.intangiveis || []).map(b => `• ${b}`)
            ], COLORS.BG_SUCCESS, COLORS.SUCCESS));
        }

        return children;
    }

    function buildTableOfContents() {
        return [
            // Título SUMÁRIO
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'SUMÁRIO',
                        font: FONTS.TITLE,
                        size: SIZES.TITLE_1,
                        bold: true,
                        color: COLORS.PRIMARY
                    })
                ],
                spacing: { before: 200, after: 100 },
                border: {
                    bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.PRIMARY, space: 8 }
                }
            }),
            new Paragraph({ spacing: { after: 200 } }),
            
            // Sumário automático
            new TableOfContents('Sumário', {
                hyperlink: true,
                headingStyleRange: '1-3'
            }),
            
            // Nota explicativa em tabela
            new Paragraph({ spacing: { before: 400 } }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY },
                    left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY },
                    right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY }
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                shading: { fill: 'f7fafc' },
                                children: [new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({
                                        text: 'Para atualizar o sumário no Word: clique no sumário → Atualizar Tabela → Atualizar índice inteiro',
                                        font: FONTS.BODY,
                                        size: SIZES.TINY,
                                        italics: true,
                                        color: COLORS.GRAY
                                    })]
                                })],
                                margins: { top: 80, bottom: 80, left: 120, right: 120 }
                            })
                        ]
                    })
                ]
            })
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEÇÃO 2: CORPO DO DOCUMENTO
    // ═══════════════════════════════════════════════════════════════════════════

    function buildMainSection(pddData, options, diagramImages = []) {
        const children = [];
        let sectionNum = 1;

        // Espaçador entre seções (mais elegante que page break)
        const sectionSpacer = () => new Paragraph({ spacing: { before: 400, after: 200 } });
        
        // Quebra de página apenas para seções principais
        const majorBreak = () => new Paragraph({ children: [new PageBreak()] });

        // 1. OBJETIVOS DO PROJETO
        children.push(...buildObjectivesSection(pddData, sectionNum++));
        children.push(majorBreak());

        // 2. STAKEHOLDERS
        children.push(...buildStakeholdersSection(pddData, sectionNum++));
        children.push(sectionSpacer());

        // 3. RPAs (AUTOMAÇÕES) - Seção principal, merece quebra
        children.push(...buildRPAsSection(pddData, sectionNum++));
        children.push(majorBreak());

        // 4. REQUISITOS FUNCIONAIS
        if (options.incluirRequisitos !== false) {
            children.push(...buildRequirementsSection(pddData, sectionNum++));
            children.push(sectionSpacer());
        }

        // 5. REGRAS DE NEGÓCIO
        if (options.incluirRegras !== false) {
            children.push(...buildBusinessRulesSection(pddData, sectionNum++));
            children.push(sectionSpacer());
        }

        // 6. INTEGRAÇÕES
        if (options.incluirIntegracoes !== false) {
            children.push(...buildIntegrationsSection(pddData, sectionNum++));
            children.push(majorBreak());
        }

        // 7. INFRAESTRUTURA
        children.push(...buildInfrastructureSection(pddData, sectionNum++));
        children.push(sectionSpacer());

        // 8. CRONOGRAMA
        children.push(...buildScheduleSection(pddData, sectionNum++));
        children.push(sectionSpacer());

        // 9. RISCOS
        children.push(...buildRisksSection(pddData, sectionNum++));
        children.push(sectionSpacer());

        // 10. PREMISSAS E RESTRIÇÕES
        children.push(...buildPremissasSection(pddData, sectionNum++));
        children.push(sectionSpacer());

        // 11. ROADMAP / FASES DO PROJETO
        if (pddData.roadmap?.fases?.length > 0) {
            children.push(...buildRoadmapSection(pddData, sectionNum++));
            children.push(majorBreak());
        }

        // 12. LACUNAS CRÍTICAS
        if (pddData.lacunas_criticas?.length > 0) {
            children.push(...buildGapsSection(pddData, sectionNum++));
            children.push(sectionSpacer());
        }

        // 13. PERGUNTAS DE CLARIFICAÇÃO
        if (pddData.perguntas_clarificacao?.length > 0) {
            children.push(...buildClarificationQuestionsSection(pddData, sectionNum++));
            children.push(sectionSpacer());
        }

        // 14. REQUISITOS INFERIDOS
        if (pddData.requisitos_inferidos?.length > 0) {
            children.push(...buildInferredRequirementsSection(pddData, sectionNum++));
            children.push(sectionSpacer());
        }

        // 15. CENÁRIOS DE TESTE
        {
            const allTests = (pddData.requisitos_funcionais || []).filter(r => r.cenarios_teste?.length > 0);
            if (allTests.length > 0) {
                children.push(...buildTestScenariosSection(pddData, sectionNum++));
                children.push(majorBreak());
            }
        }

        // 16. MATRIZ DE RASTREABILIDADE
        if (pddData.matriz_rastreabilidade && pddData.matriz_rastreabilidade.length > 0) {
            children.push(...buildTraceabilityMatrixSection(pddData, sectionNum++));
            children.push(majorBreak());
        }

        // 17. ANÁLISE CRÍTICA DO CAMINHO FELIZ
        if (pddData.analise_critica_caminho_feliz) {
            children.push(...buildCriticalAnalysisSection(pddData, sectionNum++));
            children.push(majorBreak());
        }

        // 18. ESPECIFICAÇÃO DE TELAS
        const todasTelas = extrairTodasTelas(pddData);
        if (todasTelas.length > 0) {
            children.push(...buildScreenSpecificationSection(todasTelas, sectionNum++));
            children.push(majorBreak());
        }

        // 19. DIAGRAMAS (se houver)
        if (diagramImages && diagramImages.length > 0) {
            children.push(...buildDiagramsSection(diagramImages, sectionNum++));
            children.push(majorBreak());
        }

        // 20. GLOSSÁRIO
        children.push(...buildGlossarySection(pddData, sectionNum++));
        children.push(sectionSpacer());

        // 21. APROVAÇÕES
        children.push(...buildApprovalsSection(pddData, sectionNum++));

        return {
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.98),
                        bottom: convertInchesToTwip(0.98),
                        left: convertInchesToTwip(1.18),
                        right: convertInchesToTwip(0.79)
                    }
                },
                type: SectionType.NEXT_PAGE
            },
            headers: {
                default: new Header({
                    children: [buildHeaderParagraph(pddData.projeto?.nome || 'PDD')]
                })
            },
            footers: {
                default: new Footer({
                    children: [buildFooterParagraph(pddData.projeto?.nome || 'PDD', false)]
                })
            },
            children: children
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEÇÕES DO CORPO
    // ═══════════════════════════════════════════════════════════════════════════

    function buildObjectivesSection(pddData, num) {
        const projeto = pddData.projeto || {};
        const children = [];

        children.push(buildSectionTitle(`${num}. OBJETIVOS DO PROJETO`));
        
        children.push(buildHeading2(`${num}.1 Objetivo Geral`));
        children.push(buildParagraph(projeto.objetivo || 'Automatizar processos de negócio utilizando tecnologia RPA, visando aumentar a eficiência operacional e reduzir erros manuais.'));

        children.push(buildHeading2(`${num}.2 Objetivos Específicos`));
        const objetivos = [
            'Eliminar atividades manuais repetitivas',
            'Reduzir tempo de processamento',
            'Aumentar acuracidade das informações',
            'Liberar colaboradores para atividades estratégicas',
            'Garantir rastreabilidade das operações'
        ];
        objetivos.forEach((obj, i) => {
            children.push(buildNumberedItem(`${i + 1}. ${obj}`));
        });

        children.push(buildHeading2(`${num}.3 Escopo do Projeto`));
        
        children.push(buildHeading3(`${num}.3.1 Incluído no Escopo`));
        (projeto.escopo?.incluido || ['Automação dos processos descritos neste documento']).forEach(item => {
            children.push(buildBullet(item, COLORS.SUCCESS));
        });

        children.push(buildHeading3(`${num}.3.2 Fora do Escopo`));
        (projeto.escopo?.excluido || ['Alterações em sistemas legados', 'Desenvolvimento de novas integrações não previstas']).forEach(item => {
            children.push(buildBullet(item, COLORS.ERROR));
        });

        return children;
    }

    function buildStakeholdersSection(pddData, num) {
        const stakeholders = pddData.stakeholders || {};
        const children = [];

        children.push(buildSectionTitle(`${num}. STAKEHOLDERS E USUÁRIOS`));
        
        children.push(buildHeading2(`${num}.1 Mapa de Stakeholders`));

        // Tabela de stakeholders
        const rows = [
            new TableRow({
                tableHeader: true,
                children: [
                    buildHeaderCell('Papel', 25),
                    buildHeaderCell('Nome/Área', 35),
                    buildHeaderCell('Responsabilidade', 40)
                ]
            })
        ];

        const stakeholdersList = [
            ['👨‍💼 Sponsor', stakeholders.sponsor || 'A definir', 'Patrocinador do projeto, aprovação final'],
            ['Product Owner', stakeholders.product_owner || 'A definir', 'Definição de requisitos e prioridades'],
            ['🏢 Responsável Negócio', stakeholders.responsavel_negocio || 'A definir', 'Validação de regras de negócio'],
            ['Responsável Técnico', stakeholders.responsavel_tecnico || 'MBS TI', 'Implementação técnica']
        ];

        stakeholdersList.forEach((s, i) => {
            rows.push(new TableRow({
                children: [
                    buildBodyCell(s[0], i % 2 === 1),
                    buildBodyCell(s[1], i % 2 === 1),
                    buildBodyCell(s[2], i % 2 === 1)
                ]
            }));
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));

        children.push(buildHeading2(`${num}.2 Usuários Finais`));
        (stakeholders.usuarios_finais || ['Equipe operacional da área']).forEach(user => {
            children.push(buildBullet(`👤 ${user}`));
        });

        children.push(buildHeading2(`${num}.3 Áreas Impactadas`));
        (stakeholders.areas_impactadas || pddData.projeto?.areas_envolvidas || ['Área solicitante']).forEach(area => {
            children.push(buildBullet(`🏢 ${area}`));
        });

        return children;
    }

    function buildRPAsSection(pddData, num) {
        const rpas = pddData.rpas || [];
        const children = [];

        children.push(buildSectionTitle(`${num}. ESPECIFICAÇÃO DOS RPAs`));

        if (rpas.length === 0) {
            children.push(...buildWarningBox('PENDÊNCIA', 'Nenhum RPA foi identificado na descrição do projeto. Favor detalhar os processos a serem automatizados.'));
            return children;
        }

        // Tabela resumo
        children.push(buildHeading2(`${num}.1 Visão Geral dos RPAs`));
        
        const summaryRows = [
            new TableRow({
                tableHeader: true,
                children: [
                    buildHeaderCell('Código', 15),
                    buildHeaderCell('Nome', 35),
                    buildHeaderCell('Trigger', 20),
                    buildHeaderCell('Frequência', 30)
                ]
            })
        ];

        rpas.forEach((rpa, i) => {
            summaryRows.push(new TableRow({
                children: [
                    buildBodyCell(rpa.codigo || `RPA-${(i+1).toString().padStart(3, '0')}`, i % 2 === 1),
                    buildBodyCell(rpa.nome || `RPA ${i+1}`, i % 2 === 1),
                    buildBodyCell(rpa.trigger?.tipo || 'MANUAL', i % 2 === 1),
                    buildBodyCell(rpa.trigger?.frequencia || 'Sob demanda', i % 2 === 1)
                ]
            }));
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: summaryRows }));
        children.push(new Paragraph({ spacing: { after: 300 } }));

        // Detalhamento de cada RPA
        rpas.forEach((rpa, i) => {
            const code = rpa.codigo || `RPA-${(i+1).toString().padStart(3, '0')}`;
            children.push(buildHeading2(`${num}.${i+2} ${code}: ${rpa.nome || 'RPA'}`));

            // Caixa de identificação
            children.push(...buildRPABox(rpa, i));

            // Fluxo de Execução COM SUBPASSOS
            if (rpa.fluxo_execucao && rpa.fluxo_execucao.length > 0) {
                children.push(buildHeading3('Fluxo de Execução Detalhado'));
                
                rpa.fluxo_execucao.forEach((passo, j) => {
                    if (typeof passo === 'string') {
                        // Formato antigo (string simples)
                        children.push(buildNumberedItem(`${j+1}. ${passo}`));
                    } else {
                        // Formato novo com subpassos
                        const titulo = passo.titulo || passo.acao || passo.descricao || `Passo ${j+1}`;
                        children.push(buildParagraph('')); // Espaço
                        children.push(new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Passo ${passo.passo || j+1}: ${titulo}`,
                                    font: FONTS.BODY,
                                    size: SIZES.BODY,
                                    bold: true,
                                    color: COLORS.PRIMARY
                                })
                            ],
                            spacing: { before: 150, after: 80 }
                        }));

                        if (passo.descricao && passo.descricao !== titulo) {
                            children.push(buildParagraph(passo.descricao));
                        }

                        // Sistema e RNs aplicadas
                        if (passo.sistema || passo.regras_negocio?.length > 0) {
                            const meta = [];
                            if (passo.sistema) meta.push(`Sistema: ${passo.sistema}`);
                            if (passo.regras_negocio?.length > 0) meta.push(`RNs: ${passo.regras_negocio.join(', ')}`);
                            children.push(new Paragraph({
                                children: [new TextRun({
                                    text: meta.join(' | '),
                                    font: FONTS.BODY,
                                    size: SIZES.TINY,
                                    italics: true,
                                    color: COLORS.GRAY
                                })],
                                spacing: { after: 60 }
                            }));
                        }

                        // Subpassos (MICRO)
                        if (passo.subpassos && passo.subpassos.length > 0) {
                            const subpassoRows = [
                                new TableRow({
                                    tableHeader: true,
                                    children: [
                                        buildTableHeaderCell('#'),
                                        buildTableHeaderCell('Ação'),
                                        buildTableHeaderCell('Dados'),
                                        buildTableHeaderCell('RNs'),
                                        buildTableHeaderCell('Elemento/Seletor')
                                    ]
                                })
                            ];

                            passo.subpassos.forEach(sub => {
                                const seletor = sub.elemento_tela?.seletor_css || sub.elemento_tela?.xpath || '-';
                                subpassoRows.push(new TableRow({
                                    children: [
                                        buildTableCell(sub.numero || '-'),
                                        buildTableCell(sub.acao || ''),
                                        buildTableCell(sub.dados || '-'),
                                        buildTableCell((sub.regras_aplicadas || []).join(', ') || '-'),
                                        buildTableCell(seletor)
                                    ]
                                }));
                            });

                            children.push(new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                rows: subpassoRows
                            }));
                        }

                        // Validações do passo
                        if (passo.validacoes?.length > 0) {
                            children.push(new Paragraph({
                                children: [new TextRun({
                                    text: 'Validações: ',
                                    font: FONTS.BODY,
                                    size: SIZES.TINY,
                                    bold: true
                                }), new TextRun({
                                    text: passo.validacoes.join('; '),
                                    font: FONTS.BODY,
                                    size: SIZES.TINY
                                })],
                                spacing: { before: 60 }
                            }));
                        }
                    }
                });
            }

            // Exceções com probabilidade e recuperação
            if (rpa.excecoes && rpa.excecoes.length > 0) {
                children.push(buildHeading3('Tratamento de Exceções'));
                
                // Tabela de exceções
                const excRows = [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            buildTableHeaderCell('Código'),
                            buildTableHeaderCell('Cenário'),
                            buildTableHeaderCell('Prob.'),
                            buildTableHeaderCell('Tratamento'),
                            buildTableHeaderCell('Recuperação')
                        ]
                    })
                ];

                rpa.excecoes.forEach((exc) => {
                    if (typeof exc === 'string') {
                        excRows.push(new TableRow({
                            children: [
                                buildTableCell('-'),
                                buildTableCell(exc),
                                buildTableCell('-'),
                                buildTableCell('-'),
                                buildTableCell('-')
                            ]
                        }));
                    } else {
                        excRows.push(new TableRow({
                            children: [
                                buildTableCell(exc.codigo || '-'),
                                buildTableCell(exc.cenario || exc.descricao || ''),
                                buildTableCell(exc.probabilidade || '-'),
                                buildTableCell(exc.tratamento || '-'),
                                buildTableCell(exc.acao_recuperacao || exc.acao_fallback || '-')
                            ]
                        }));
                    }
                });

                children.push(new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: excRows
                }));
            }

            children.push(new Paragraph({ spacing: { after: 400 } }));
        });

        return children;
    }

    function buildRPABox(rpa, index) {
        const code = rpa.codigo || `RPA-${(index+1).toString().padStart(3, '0')}`;
        
        return buildHighlightBox(`${code}: ${rpa.nome || 'RPA'}`, [
            '',
            'IDENTIFICAÇÃO',
            `   • Código: ${code}`,
            `   • Trigger: ${rpa.trigger?.tipo || 'MANUAL'}`,
            `   • Frequência: ${rpa.trigger?.frequencia || 'Sob demanda'}`,
            `   • Volume Estimado: ${rpa.trigger?.volume_estimado || 'A definir'}`,
            '',
            'DESCRIÇÃO',
            `   ${rpa.descricao || rpa.objetivo || 'Automação de processo de negócio.'}`,
            '',
            'ENTRADA',
            `   • Origem: ${rpa.entrada?.origem || 'A definir'}`,
            `   • Dados: ${rpa.entrada?.dados?.join(', ') || 'A definir'}`,
            '',
            'SAÍDA',
            `   • Destino: ${rpa.saida?.destino || 'A definir'}`,
            `   • Dados: ${rpa.saida?.dados?.join(', ') || 'A definir'}`,
            '',
            'SISTEMAS',
            `   ${rpa.sistemas_utilizados?.join(', ') || 'A definir'}`
        ], COLORS.BG_NOTE, COLORS.SECONDARY);
    }

    function buildRequirementsSection(pddData, num) {
        const requisitos = pddData.requisitos_funcionais || [];
        const children = [];

        children.push(buildSectionTitle(`${num}. REQUISITOS FUNCIONAIS`));

        if (requisitos.length === 0) {
            children.push(...buildInfoBox('NOTA', 'Os requisitos funcionais serão detalhados com base nos RPAs especificados na seção anterior.'));
            return children;
        }

        // Tabela resumo
        children.push(buildHeading2(`${num}.1 Matriz de Requisitos`));
        
        const summaryRows = [
            new TableRow({
                tableHeader: true,
                children: [
                    buildHeaderCell('Código', 12),
                    buildHeaderCell('Título', 40),
                    buildHeaderCell('Prioridade', 15),
                    buildHeaderCell('Complexidade', 15),
                    buildHeaderCell('RPA', 18)
                ]
            })
        ];

        requisitos.forEach((rf, i) => {
            summaryRows.push(new TableRow({
                children: [
                    buildBodyCell(rf.codigo || `RF-${(i+1).toString().padStart(3, '0')}`, i % 2 === 1),
                    buildBodyCell(rf.titulo || 'Requisito', i % 2 === 1),
                    buildPriorityCell(rf.prioridade || 'SHOULD', i % 2 === 1),
                    buildBodyCell(rf.complexidade || 'MÉDIA', i % 2 === 1),
                    buildBodyCell(rf.rpa_relacionado || '-', i % 2 === 1)
                ]
            }));
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: summaryRows }));
        children.push(new Paragraph({ spacing: { after: 400 } }));

        // Detalhamento
        children.push(buildHeading2(`${num}.2 Detalhamento dos Requisitos`));

        requisitos.forEach((rf, i) => {
            const code = rf.codigo || `RF-${(i+1).toString().padStart(3, '0')}`;
            children.push(...buildRequirementBox(rf, code, COLORS.RF_GREEN));
        });

        return children;
    }

    function buildRequirementBox(rf, code, color) {
        const children = [];
        const rows = [];

        // Cabeçalho da tabela
        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: COLORS.PRIMARY },
                    columnSpan: 2,
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: `${code}: ${rf.titulo || 'Requisito Funcional'}`,
                            font: FONTS.TITLE,
                            size: SIZES.BODY,
                            bold: true,
                            color: COLORS.WHITE
                        })]
                    })],
                    margins: { top: 80, bottom: 80, left: 120, right: 120 }
                })
            ]
        }));

        // Linha de metadados
        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: 'f7fafc' },
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'Módulo', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                    })],
                    margins: { top: 60, bottom: 60, left: 120, right: 60 }
                }),
                new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                        children: [new TextRun({ text: rf.modulo || 'Geral', font: FONTS.BODY, size: SIZES.SMALL })]
                    })],
                    margins: { top: 60, bottom: 60, left: 60, right: 120 }
                })
            ]
        }));

        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: 'f7fafc' },
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'Prioridade', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                    })],
                    margins: { top: 60, bottom: 60, left: 120, right: 60 }
                }),
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: rf.prioridade || 'SHOULD', font: FONTS.BODY, size: SIZES.SMALL })]
                    })],
                    margins: { top: 60, bottom: 60, left: 60, right: 120 }
                })
            ]
        }));

        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: 'f7fafc' },
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'Complexidade', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                    })],
                    margins: { top: 60, bottom: 60, left: 120, right: 60 }
                }),
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: rf.complexidade || 'MÉDIA', font: FONTS.BODY, size: SIZES.SMALL })]
                    })],
                    margins: { top: 60, bottom: 60, left: 60, right: 120 }
                })
            ]
        }));

        // Descrição
        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: 'f7fafc' },
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'Descrição', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                    })],
                    margins: { top: 60, bottom: 60, left: 120, right: 60 }
                }),
                new TableCell({
                    children: [new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [new TextRun({ text: rf.descricao || 'Descrição do requisito.', font: FONTS.BODY, size: SIZES.SMALL })]
                    })],
                    margins: { top: 60, bottom: 60, left: 60, right: 120 }
                })
            ]
        }));

        // Fluxo principal (se houver)
        if (rf.fluxo_principal?.length > 0) {
            const fluxoTexto = rf.fluxo_principal.map((p, i) => `${i+1}. ${p}`).join('\n');
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Fluxo Principal', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        children: rf.fluxo_principal.map((p, i) => new Paragraph({
                            children: [new TextRun({ text: `${i+1}. ${p}`, font: FONTS.BODY, size: SIZES.SMALL })]
                        })),
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        // Critérios de aceitação (se houver)
        if (rf.criterios_aceitacao?.length > 0) {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Critérios de Aceitação', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        children: rf.criterios_aceitacao.map(ca => new Paragraph({
                            children: [new TextRun({ text: `• ${ca}`, font: FONTS.BODY, size: SIZES.SMALL })]
                        })),
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        children.push(new Paragraph({ spacing: { before: 200 } }));
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                right: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY }
            },
            rows: rows
        }));
        children.push(new Paragraph({ spacing: { after: 200 } }));

        return children;
    }

    function buildBusinessRulesSection(pddData, num) {
        const regras = pddData.regras_negocio || [];
        const children = [];

        children.push(buildSectionTitle(`${num}. REGRAS DE NEGÓCIO`));

        if (regras.length === 0) {
            children.push(...buildInfoBox('NOTA', 'As regras de negócio serão extraídas durante a fase de detalhamento dos requisitos.'));
            return children;
        }

        // Tabela resumo
        children.push(buildHeading2(`${num}.1 Matriz de Regras`));
        
        const summaryRows = [
            new TableRow({
                tableHeader: true,
                children: [
                    buildHeaderCell('Código', 12),
                    buildHeaderCell('Tipo', 12),
                    buildHeaderCell('Título', 46),
                    buildHeaderCell('RF Relacionados', 30)
                ]
            })
        ];

        regras.forEach((rn, i) => {
            summaryRows.push(new TableRow({
                children: [
                    buildBodyCell(rn.codigo || `RN-${(i+1).toString().padStart(3, '0')}`, i % 2 === 1),
                    buildBodyCell(rn.tipo || 'VAL', i % 2 === 1),
                    buildBodyCell(rn.titulo || 'Regra', i % 2 === 1),
                    buildBodyCell(rn.requisitos_relacionados?.join(', ') || '-', i % 2 === 1)
                ]
            }));
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: summaryRows }));
        children.push(new Paragraph({ spacing: { after: 400 } }));

        // Detalhamento
        children.push(buildHeading2(`${num}.2 Detalhamento das Regras`));

        regras.forEach((rn, i) => {
            const code = rn.codigo || `RN-${(i+1).toString().padStart(3, '0')}`;
            children.push(...buildBusinessRuleBox(rn, code));
        });

        return children;
    }

    function buildBusinessRuleBox(rn, code) {
        const children = [];
        const rows = [];

        // Cabeçalho
        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: COLORS.SECONDARY },
                    columnSpan: 2,
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: `${code}: ${rn.titulo || 'Regra de Negócio'}`,
                            font: FONTS.TITLE,
                            size: SIZES.BODY,
                            bold: true,
                            color: COLORS.WHITE
                        })]
                    })],
                    margins: { top: 80, bottom: 80, left: 120, right: 120 }
                })
            ]
        }));

        // Tipo e Categoria
        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: 'f7fafc' },
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'Tipo', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                    })],
                    margins: { top: 60, bottom: 60, left: 120, right: 60 }
                }),
                new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                        children: [new TextRun({ text: rn.tipo || 'VALIDAÇÃO', font: FONTS.BODY, size: SIZES.SMALL })]
                    })],
                    margins: { top: 60, bottom: 60, left: 60, right: 120 }
                })
            ]
        }));

        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: 'f7fafc' },
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'Categoria', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                    })],
                    margins: { top: 60, bottom: 60, left: 120, right: 60 }
                }),
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: rn.categoria || 'Geral', font: FONTS.BODY, size: SIZES.SMALL })]
                    })],
                    margins: { top: 60, bottom: 60, left: 60, right: 120 }
                })
            ]
        }));

        // Descrição
        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: 'f7fafc' },
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'Descrição', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                    })],
                    margins: { top: 60, bottom: 60, left: 120, right: 60 }
                }),
                new TableCell({
                    children: [new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [new TextRun({ text: rn.descricao || 'Descrição da regra.', font: FONTS.BODY, size: SIZES.SMALL })]
                    })],
                    margins: { top: 60, bottom: 60, left: 60, right: 120 }
                })
            ]
        }));

        // Lógica (se houver)
        if (rn.logica) {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Lógica', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: rn.logica, font: FONTS.CODE, size: SIZES.SMALL })]
                        })],
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        // Exceções (se houver)
        if (rn.excecoes?.length > 0) {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Exceções', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        children: rn.excecoes.map(exc => new Paragraph({
                            children: [new TextRun({ text: `• ${exc}`, font: FONTS.BODY, size: SIZES.SMALL })]
                        })),
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        children.push(new Paragraph({ spacing: { before: 200 } }));
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                right: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY }
            },
            rows: rows
        }));
        children.push(new Paragraph({ spacing: { after: 200 } }));

        return children;
    }

    function buildIntegrationsSection(pddData, num) {
        const integracoes = pddData.integracoes || [];
        const children = [];

        children.push(buildSectionTitle(`${num}. INTEGRAÇÕES E INTERFACES`));

        if (integracoes.length === 0) {
            children.push(...buildInfoBox('NOTA', 'As integrações serão identificadas com base nos sistemas mencionados nos RPAs.'));
            return children;
        }

        // Tabela resumo
        children.push(buildHeading2(`${num}.1 Matriz de Integrações`));
        
        const summaryRows = [
            new TableRow({
                tableHeader: true,
                children: [
                    buildHeaderCell('Código', 12),
                    buildHeaderCell('Sistema', 25),
                    buildHeaderCell('Direção', 15),
                    buildHeaderCell('Protocolo', 15),
                    buildHeaderCell('Propósito', 33)
                ]
            })
        ];

        integracoes.forEach((int, i) => {
            summaryRows.push(new TableRow({
                children: [
                    buildBodyCell(int.codigo || `INT-${(i+1).toString().padStart(3, '0')}`, i % 2 === 1),
                    buildBodyCell(int.sistema_externo || 'Sistema', i % 2 === 1),
                    buildDirectionCell(int.direcao || 'BIDIRECIONAL', i % 2 === 1),
                    buildBodyCell(int.protocolo || 'API', i % 2 === 1),
                    buildBodyCell(int.proposito || '-', i % 2 === 1)
                ]
            }));
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: summaryRows }));
        children.push(new Paragraph({ spacing: { after: 400 } }));

        // Detalhamento
        children.push(buildHeading2(`${num}.2 Detalhamento das Integrações`));

        integracoes.forEach((int, i) => {
            const code = int.codigo || `INT-${(i+1).toString().padStart(3, '0')}`;
            children.push(...buildIntegrationBox(int, code));
        });

        return children;
    }

    function buildIntegrationBox(int, code) {
        const children = [];
        const rows = [];

        // Cabeçalho
        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: COLORS.TERTIARY },
                    columnSpan: 2,
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: `${code}: Integração com ${int.sistema_externo || 'Sistema'}`,
                            font: FONTS.TITLE,
                            size: SIZES.BODY,
                            bold: true,
                            color: COLORS.WHITE
                        })]
                    })],
                    margins: { top: 80, bottom: 80, left: 120, right: 120 }
                })
            ]
        }));

        // Dados básicos
        const dados = [
            ['Sistema Externo', int.sistema_externo || 'A definir'],
            ['Direção', int.direcao || 'BIDIRECIONAL'],
            ['Protocolo', int.protocolo || 'API'],
            ['Frequência', int.frequencia || 'REAL_TIME'],
            ['Propósito', int.proposito || 'Integração de dados entre sistemas.']
        ];

        dados.forEach(([label, value], i) => {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({
                            children: [new TextRun({ text: label, font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        width: { size: 75, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({
                            children: [new TextRun({ text: value, font: FONTS.BODY, size: SIZES.SMALL })]
                        })],
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        });

        // ENDPOINT/TRANSAÇÃO (novo campo)
        if (int.endpoint) {
            const endpointInfo = [];
            if (int.endpoint.metodo && int.endpoint.url) {
                endpointInfo.push(`${int.endpoint.metodo} ${int.endpoint.url}`);
            }
            if (int.endpoint.transacao_sap) {
                endpointInfo.push(`SAP: ${int.endpoint.transacao_sap}`);
            }
            if (int.endpoint.tabela_banco) {
                endpointInfo.push(`Tabela: ${int.endpoint.tabela_banco}`);
            }
            
            if (endpointInfo.length > 0) {
                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: 'edf2f7' },
                            children: [new Paragraph({
                                children: [new TextRun({ text: 'Endpoint/Transação', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                            })],
                            margins: { top: 60, bottom: 60, left: 120, right: 60 }
                        }),
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: endpointInfo.join('\n'), font: FONTS.MONO || FONTS.BODY, size: SIZES.TINY })]
                            })],
                            margins: { top: 60, bottom: 60, left: 60, right: 120 }
                        })
                    ]
                }));
            }
        }

        // AUTENTICAÇÃO (novo campo)
        if (int.autenticacao) {
            const authInfo = [];
            if (int.autenticacao.tipo) authInfo.push(`Tipo: ${int.autenticacao.tipo}`);
            if (int.autenticacao.headers?.length > 0) authInfo.push(`Headers: ${int.autenticacao.headers.join(', ')}`);
            if (int.autenticacao.observacoes) authInfo.push(int.autenticacao.observacoes);
            
            if (authInfo.length > 0) {
                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: 'f7fafc' },
                            children: [new Paragraph({
                                children: [new TextRun({ text: 'Autenticação', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                            })],
                            margins: { top: 60, bottom: 60, left: 120, right: 60 }
                        }),
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: authInfo.join(' | '), font: FONTS.BODY, size: SIZES.SMALL })]
                            })],
                            margins: { top: 60, bottom: 60, left: 60, right: 120 }
                        })
                    ]
                }));
            }
        }

        // PAYLOAD DE EXEMPLO (novo campo)
        if (int.payload_exemplo) {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'e6fffa' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Payload (Request)', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        shading: { fill: 'f0fff4' },
                        children: [new Paragraph({
                            children: [new TextRun({ 
                                text: int.payload_exemplo.exemplo_json || int.payload_exemplo.descricao || JSON.stringify(int.payload_exemplo, null, 2), 
                                font: FONTS.MONO || FONTS.BODY, 
                                size: SIZES.TINY 
                            })]
                        })],
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        // RESPONSE ESPERADA (novo campo)
        if (int.response_esperada) {
            // Response de sucesso
            if (int.response_esperada.sucesso) {
                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: 'c6f6d5' },
                            children: [new Paragraph({
                                children: [new TextRun({ text: `Response Sucesso (${int.response_esperada.sucesso.http_code || 200})`, font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                            })],
                            margins: { top: 60, bottom: 60, left: 120, right: 60 }
                        }),
                        new TableCell({
                            shading: { fill: 'f0fff4' },
                            children: [new Paragraph({
                                children: [new TextRun({ 
                                    text: int.response_esperada.sucesso.exemplo || JSON.stringify(int.response_esperada.sucesso, null, 2), 
                                    font: FONTS.MONO || FONTS.BODY, 
                                    size: SIZES.TINY 
                                })]
                            })],
                            margins: { top: 60, bottom: 60, left: 60, right: 120 }
                        })
                    ]
                }));
            }

            // Códigos de erro
            if (int.response_esperada.erros?.length > 0) {
                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: 'fed7d7' },
                            children: [new Paragraph({
                                children: [new TextRun({ text: 'Códigos de Erro', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                            })],
                            margins: { top: 60, bottom: 60, left: 120, right: 60 }
                        }),
                        new TableCell({
                            shading: { fill: 'fff5f5' },
                            children: int.response_esperada.erros.map(erro => new Paragraph({
                                children: [new TextRun({ 
                                    text: `${erro.codigo}: ${erro.significado} → ${erro.tratamento}`, 
                                    font: FONTS.BODY, 
                                    size: SIZES.TINY 
                                })]
                            })),
                            margins: { top: 60, bottom: 60, left: 60, right: 120 }
                        })
                    ]
                }));
            }
        }

        // Timeout e Retry (novo campo)
        if (int.timeout_segundos || int.retry_config) {
            const configInfo = [];
            if (int.timeout_segundos) configInfo.push(`Timeout: ${int.timeout_segundos}s`);
            if (int.retry_config) {
                configInfo.push(`Retry: ${int.retry_config.tentativas}x a cada ${int.retry_config.intervalo_segundos}s`);
                if (int.retry_config.backoff_exponencial) configInfo.push('(backoff exponencial)');
            }
            
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Configuração', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: configInfo.join(' | '), font: FONTS.BODY, size: SIZES.SMALL })]
                        })],
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        // Dados trafegados (se houver)
        if (int.dados_trafegados?.length > 0) {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Dados Trafegados', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        children: int.dados_trafegados.map(dado => new Paragraph({
                            children: [new TextRun({ text: `• ${dado}`, font: FONTS.BODY, size: SIZES.SMALL })]
                        })),
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        // RPAs que usam (novo campo)
        if (int.rpas_que_usam?.length > 0) {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Utilizado por', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: int.rpas_que_usam.join(', '), font: FONTS.BODY, size: SIZES.SMALL })]
                        })],
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        // Tratamento de erros legado (se houver e não tiver o novo formato)
        if (int.tratamento_erros && !int.response_esperada) {
            rows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: 'f7fafc' },
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'Tratamento de Erros', font: FONTS.BODY, size: SIZES.SMALL, bold: true })]
                        })],
                        margins: { top: 60, bottom: 60, left: 120, right: 60 }
                    }),
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: int.tratamento_erros, font: FONTS.BODY, size: SIZES.SMALL })]
                        })],
                        margins: { top: 60, bottom: 60, left: 60, right: 120 }
                    })
                ]
            }));
        }

        children.push(new Paragraph({ spacing: { before: 200 } }));
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                right: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY }
            },
            rows: rows
        }));
        children.push(new Paragraph({ spacing: { after: 200 } }));

        return children;
    }

    function buildInfrastructureSection(pddData, num) {
        const infra = pddData.infraestrutura || {};
        const children = [];

        children.push(buildSectionTitle(`${num}. INFRAESTRUTURA TÉCNICA`));

        // Servidores
        children.push(buildHeading2(`${num}.1 Servidores`));
        
        if (infra.servidores?.length > 0) {
            const serverRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        buildHeaderCell('Nome', 30),
                        buildHeaderCell('Tipo', 25),
                        buildHeaderCell('Função', 45)
                    ]
                })
            ];

            infra.servidores.forEach((srv, i) => {
                serverRows.push(new TableRow({
                    children: [
                        buildBodyCell(srv.nome || `Servidor ${i+1}`, i % 2 === 1),
                        buildBodyCell(srv.tipo || 'Aplicação', i % 2 === 1),
                        buildBodyCell(srv.funcao || 'Execução de RPAs', i % 2 === 1)
                    ]
                }));
            });

            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: serverRows }));
        } else {
            children.push(buildBullet('A definir durante fase de implementação'));
        }

        // Bancos de Dados
        children.push(buildHeading2(`${num}.2 Bancos de Dados`));
        
        if (infra.bancos_dados?.length > 0) {
            const dbRows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        buildHeaderCell('Nome', 25),
                        buildHeaderCell('Servidor', 25),
                        buildHeaderCell('Tipo', 20),
                        buildHeaderCell('Função', 30)
                    ]
                })
            ];

            infra.bancos_dados.forEach((db, i) => {
                dbRows.push(new TableRow({
                    children: [
                        buildBodyCell(db.nome || `DB ${i+1}`, i % 2 === 1),
                        buildBodyCell(db.servidor || '-', i % 2 === 1),
                        buildBodyCell(db.tipo || 'SQL Server', i % 2 === 1),
                        buildBodyCell(db.funcao || 'Armazenamento', i % 2 === 1)
                    ]
                }));
            });

            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: dbRows }));
        } else {
            children.push(buildBullet('A definir durante fase de implementação'));
        }

        // Tecnologias
        children.push(buildHeading2(`${num}.3 Tecnologias Utilizadas`));
        (infra.tecnologias || ['UiPath Studio', 'Orchestrator', '.NET Framework']).forEach(tech => {
            children.push(buildBullet(`${tech}`));
        });

        return children;
    }

    function buildScheduleSection(pddData, num) {
        const cronograma = pddData.cronograma_sugerido || {};
        const children = [];

        children.push(buildSectionTitle(`${num}. CRONOGRAMA SUGERIDO`));

        // Fases
        children.push(buildHeading2(`${num}.1 Fases do Projeto`));
        
        const fases = cronograma.fases || [
            { fase: 'Desenvolvimento', duracao_estimada: '3 semanas', entregas: ['RPAs desenvolvidos', 'Testes unitários'] },
            { fase: 'Testes Integrados', duracao_estimada: '1 semana', entregas: ['Relatório de testes', 'Correções'] },
            { fase: 'Homologação (UAT)', duracao_estimada: '1 semana', entregas: ['Aceite do usuário'] },
            { fase: 'Implantação', duracao_estimada: '1 semana', entregas: ['Deploy em produção', 'Documentação'] }
        ];

        const scheduleRows = [
            new TableRow({
                tableHeader: true,
                children: [
                    buildHeaderCell('Fase', 25),
                    buildHeaderCell('Duração Estimada', 25),
                    buildHeaderCell('Entregas', 50)
                ]
            })
        ];

        fases.forEach((fase, i) => {
            scheduleRows.push(new TableRow({
                children: [
                    buildBodyCell(fase.fase, i % 2 === 1),
                    buildBodyCell(fase.duracao_estimada, i % 2 === 1),
                    buildBodyCell(fase.entregas?.join(', ') || '-', i % 2 === 1)
                ]
            }));
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: scheduleRows }));

        // Marcos principais
        children.push(buildHeading2(`${num}.2 Marcos Principais`));
        const marcos = cronograma.marcos_principais || [
            'Kickoff do projeto',
            'Entrega dos RPAs em DEV',
            'Início dos testes integrados',
            'Aprovação em homologação',
            'Go-live em produção'
        ];
        marcos.forEach((marco, i) => {
            children.push(buildNumberedItem(`${i+1}. ${marco}`));
        });

        // Nota sobre cronograma
        children.push(...buildInfoBox('NOTA', 'O cronograma apresentado é uma estimativa inicial e pode ser ajustado durante o planejamento detalhado do projeto.'));

        return children;
    }

    function buildRisksSection(pddData, num) {
        const riscos = pddData.riscos || [];
        const children = [];

        children.push(buildSectionTitle(`${num}. RISCOS IDENTIFICADOS`));

        // Matriz de riscos
        children.push(buildHeading2(`${num}.1 Matriz de Riscos`));

        const defaultRisks = [
            { codigo: 'RISK-001', descricao: 'Mudanças nos sistemas fonte durante o desenvolvimento', probabilidade: 'MÉDIA', impacto: 'ALTO', mitigacao: 'Validar estabilidade dos sistemas antes do início' },
            { codigo: 'RISK-002', descricao: 'Indisponibilidade de ambiente de testes', probabilidade: 'BAIXA', impacto: 'MÉDIO', mitigacao: 'Solicitar ambiente com antecedência' },
            { codigo: 'RISK-003', descricao: 'Mudanças no escopo durante o projeto', probabilidade: 'MÉDIA', impacto: 'ALTO', mitigacao: 'Controle de mudanças rigoroso' }
        ];

        const risksList = riscos.length > 0 ? riscos : defaultRisks;

        const riskRows = [
            new TableRow({
                tableHeader: true,
                children: [
                    buildHeaderCell('Código', 12),
                    buildHeaderCell('Descrição', 35),
                    buildHeaderCell('Prob.', 12),
                    buildHeaderCell('Impacto', 12),
                    buildHeaderCell('Mitigação', 29)
                ]
            })
        ];

        risksList.forEach((risk, i) => {
            riskRows.push(new TableRow({
                children: [
                    buildBodyCell(risk.codigo || `RISK-${(i+1).toString().padStart(3, '0')}`, i % 2 === 1),
                    buildBodyCell(risk.descricao, i % 2 === 1),
                    buildProbabilityCell(risk.probabilidade || 'MÉDIA', i % 2 === 1),
                    buildImpactCell(risk.impacto || 'MÉDIO', i % 2 === 1),
                    buildBodyCell(risk.mitigacao || 'A definir', i % 2 === 1)
                ]
            }));
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: riskRows }));

        // Legenda
        children.push(new Paragraph({ spacing: { after: 200 } }));
        children.push(new Paragraph({
            children: [
                new TextRun({ text: 'Legenda: ', font: FONTS.BODY, size: SIZES.TINY, bold: true }),
                new TextRun({ text: '🔴 ALTA/ALTO  ', font: FONTS.BODY, size: SIZES.TINY }),
                new TextRun({ text: '🟡 MÉDIA/MÉDIO  ', font: FONTS.BODY, size: SIZES.TINY }),
                new TextRun({ text: '🟢 BAIXA/BAIXO', font: FONTS.BODY, size: SIZES.TINY })
            ]
        }));

        return children;
    }

    function buildPremissasSection(pddData, num) {
        const children = [];

        children.push(buildSectionTitle(`${num}. PREMISSAS E RESTRIÇÕES`));

        // Premissas
        children.push(buildHeading2(`${num}.1 Premissas`));
        const premissas = pddData.premissas?.length > 0 ? pddData.premissas : [
            'Os sistemas fonte estarão disponíveis durante o desenvolvimento',
            'Os acessos necessários serão concedidos em tempo hábil',
            'O ambiente de homologação reflete produção',
            'Os stakeholders estarão disponíveis para validações'
        ];
        premissas.forEach(p => {
            children.push(buildBullet(`${p}`, COLORS.SUCCESS));
        });

        // Restrições
        children.push(buildHeading2(`${num}.2 Restrições`));
        const restricoes = pddData.restricoes?.length > 0 ? pddData.restricoes : [
            'Não serão realizadas alterações em sistemas legados',
            'O projeto deve seguir os padrões de segurança da empresa',
            'Integração limitada às APIs disponíveis'
        ];
        restricoes.forEach(r => {
            children.push(buildBullet(`${r}`, COLORS.WARNING));
        });

        // Observações
        if (pddData.observacoes) {
            children.push(buildHeading2(`${num}.3 Observações Gerais`));
            children.push(buildParagraph(pddData.observacoes));
        }

        // Pendências
        if (pddData.pendencias?.length > 0) {
            children.push(buildHeading2(`${num}.4 Pendências`));
            pddData.pendencias.forEach(p => {
                children.push(buildBullet(`🔴 ${p}`, COLORS.ERROR));
            });
        }

        return children;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NOVAS SEÇÕES: RASTREABILIDADE, ANÁLISE CRÍTICA, ESPECIFICAÇÃO DE TELAS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Extrai todas as especificações de telas de todos os RPAs
     */
    function extrairTodasTelas(pddData) {
        const telas = [];
        if (pddData.rpas) {
            pddData.rpas.forEach(rpa => {
                if (rpa.especificacao_telas) {
                    rpa.especificacao_telas.forEach(tela => {
                        telas.push({ ...tela, rpa: rpa.codigo || rpa.nome });
                    });
                }
            });
        }
        return telas;
    }

    /**
     * Seção: Matriz de Rastreabilidade
     */
    function buildTraceabilityMatrixSection(pddData, num) {
        const children = [];

        children.push(buildSectionTitle(`${num}. MATRIZ DE RASTREABILIDADE`));
        children.push(buildParagraph('Esta matriz apresenta a rastreabilidade completa entre requisitos, regras de negócio, RPAs, passos e integrações, garantindo que cada elemento esteja devidamente documentado e vinculado.'));
        children.push(new Paragraph({ spacing: { after: 300 } }));

        const matriz = pddData.matriz_rastreabilidade || [];

        if (matriz.length > 0) {
            // Criar tabela de rastreabilidade
            const headerRow = new TableRow({
                tableHeader: true,
                children: [
                    buildTableHeaderCell('Requisito'),
                    buildTableHeaderCell('Regras de Negócio'),
                    buildTableHeaderCell('RPA'),
                    buildTableHeaderCell('Passos'),
                    buildTableHeaderCell('Integrações')
                ]
            });

            const dataRows = matriz.map(item => new TableRow({
                children: [
                    buildTableCell(`${item.requisito}\n${item.titulo_requisito || ''}`),
                    buildTableCell((item.regras_negocio || []).join(', ')),
                    buildTableCell((item.rpas || []).join(', ')),
                    buildTableCell((item.passos || []).join(', ')),
                    buildTableCell((item.integracoes || []).join(', '))
                ]
            }));

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [headerRow, ...dataRows]
            }));
        } else {
            children.push(...buildInfoBox('NOTA', 'A matriz de rastreabilidade será preenchida durante a fase de detalhamento técnico.'));
        }

        return children;
    }

    /**
     * Seção: Análise Crítica do Caminho Feliz
     */
    function buildCriticalAnalysisSection(pddData, num) {
        const children = [];
        const analise = pddData.analise_critica_caminho_feliz || {};

        children.push(buildSectionTitle(`${num}. ANÁLISE CRÍTICA DO FLUXO`));
        children.push(buildParagraph('Esta seção apresenta uma análise crítica dos fluxos propostos, identificando potenciais pontos de falha, exceções não óbvias e recomendações de resiliência.'));
        children.push(new Paragraph({ spacing: { after: 300 } }));

        // Resumo da análise
        if (analise.resumo) {
            children.push(buildHeading2(`${num}.1 Resumo da Análise`));
            children.push(...buildHighlightBox('ANÁLISE', analise.resumo, COLORS.PRIMARY));

            if (analise.total_excecoes_identificadas) {
                children.push(buildParagraph(`Total de exceções identificadas: ${analise.total_excecoes_identificadas}`));
            }

            if (analise.excecoes_por_categoria) {
                const cats = analise.excecoes_por_categoria;
                children.push(new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                buildTableHeaderCell('Categoria'),
                                buildTableHeaderCell('Quantidade')
                            ]
                        }),
                        ...Object.entries(cats).map(([cat, qtd]) => new TableRow({
                            children: [
                                buildTableCell(cat.charAt(0).toUpperCase() + cat.slice(1)),
                                buildTableCell(String(qtd))
                            ]
                        }))
                    ]
                }));
            }
        }

        // Pontos críticos
        if (analise.pontos_criticos?.length > 0) {
            children.push(buildHeading2(`${num}.2 Pontos Críticos Identificados`));
            
            analise.pontos_criticos.forEach((ponto, i) => {
                children.push(buildHeading3(`Ponto ${i + 1}: Passo ${ponto.passo}`));
                if (ponto.descricao_passo) {
                    children.push(buildParagraph(ponto.descricao_passo));
                }

                if (ponto.vulnerabilidades?.length > 0) {
                    const vulnRows = ponto.vulnerabilidades.map(vuln => new TableRow({
                        children: [
                            buildTableCell(vuln.tipo || 'N/D'),
                            buildTableCell(vuln.descricao || ''),
                            buildTableCell(vuln.probabilidade || 'N/D'),
                            buildTableCell(vuln.impacto || 'N/D'),
                            buildTableCell(vuln.mitigacao_sugerida || '')
                        ]
                    }));

                    children.push(new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                tableHeader: true,
                                children: [
                                    buildTableHeaderCell('Tipo'),
                                    buildTableHeaderCell('Descrição'),
                                    buildTableHeaderCell('Prob.'),
                                    buildTableHeaderCell('Impacto'),
                                    buildTableHeaderCell('Mitigação')
                                ]
                            }),
                            ...vulnRows
                        ]
                    }));
                }
                children.push(new Paragraph({ spacing: { after: 200 } }));
            });
        }

        // Perguntas não respondidas
        if (analise.perguntas_nao_respondidas?.length > 0) {
            children.push(buildHeading2(`${num}.3 Pontos a Esclarecer com Cliente`));
            
            analise.perguntas_nao_respondidas.forEach(pergunta => {
                children.push(new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { fill: COLORS.WARNING },
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: 'PERGUNTA', bold: true, color: 'FFFFFF', font: FONTS.BODY, size: SIZES.SMALL })]
                                    })]
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: pergunta.pergunta, font: FONTS.BODY, size: SIZES.NORMAL })]
                                    })]
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { fill: COLORS.ERROR },
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: 'IMPACTO', bold: true, color: 'FFFFFF', font: FONTS.BODY, size: SIZES.SMALL })]
                                    })]
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: pergunta.impacto_se_nao_definido || '', font: FONTS.BODY, size: SIZES.NORMAL })]
                                    })]
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { fill: COLORS.SUCCESS },
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: 'SUGESTÃO', bold: true, color: 'FFFFFF', font: FONTS.BODY, size: SIZES.SMALL })]
                                    })]
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ text: pergunta.sugestao_tratamento || '', font: FONTS.BODY, size: SIZES.NORMAL })]
                                    })]
                                })
                            ]
                        })
                    ]
                }));
                children.push(new Paragraph({ spacing: { after: 200 } }));
            });
        }

        // Recomendações de resiliência
        if (analise.recomendacoes_resiliencia?.length > 0) {
            children.push(buildHeading2(`${num}.4 Recomendações de Resiliência`));
            
            analise.recomendacoes_resiliencia.forEach((rec, i) => {
                children.push(buildBullet(`${rec}`, COLORS.SUCCESS));
            });
        }

        return children;
    }

    /**
     * Seção: Especificação de Telas
     */
    function buildScreenSpecificationSection(telas, num) {
        const children = [];

        children.push(buildSectionTitle(`${num}. ESPECIFICAÇÃO DE TELAS`));
        children.push(buildParagraph('Esta seção detalha as especificações técnicas de cada tela utilizada pelos RPAs, incluindo seletores de elementos, estados e pré-condições.'));
        children.push(new Paragraph({ spacing: { after: 300 } }));

        telas.forEach((tela, i) => {
            children.push(buildHeading2(`${num}.${i + 1} ${tela.tela || tela.nome || 'Tela ' + (i + 1)}`));
            
            // Info básica
            const infoItems = [];
            if (tela.sistema) infoItems.push(`Sistema: ${tela.sistema}`);
            if (tela.rpa) infoItems.push(`Utilizado por: ${tela.rpa}`);
            if (tela.url_ou_caminho) infoItems.push(`Caminho: ${tela.url_ou_caminho}`);
            
            if (infoItems.length > 0) {
                children.push(buildParagraph(infoItems.join(' | ')));
            }

            // Elementos
            if (tela.elementos?.length > 0) {
                children.push(buildHeading3('Elementos da Tela'));
                
                const elementRows = tela.elementos.map(el => new TableRow({
                    children: [
                        buildTableCell(el.nome || ''),
                        buildTableCell(el.tipo || ''),
                        buildTableCell(el.seletor_css || ''),
                        buildTableCell(el.xpath_alternativo || ''),
                        buildTableCell(el.obrigatorio ? 'Sim' : 'Não'),
                        buildTableCell(el.timeout_segundos ? `${el.timeout_segundos}s` : '10s')
                    ]
                }));

                children.push(new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                buildTableHeaderCell('Elemento'),
                                buildTableHeaderCell('Tipo'),
                                buildTableHeaderCell('Seletor CSS'),
                                buildTableHeaderCell('XPath'),
                                buildTableHeaderCell('Obrig.'),
                                buildTableHeaderCell('Timeout')
                            ]
                        }),
                        ...elementRows
                    ]
                }));
            }

            // Estados
            if (tela.estados) {
                children.push(buildHeading3('Estados da Tela'));
                const estados = tela.estados;
                
                if (estados.loading) {
                    children.push(buildBullet(`Loading: ${estados.loading}`, COLORS.INFO));
                }
                if (estados.sucesso) {
                    children.push(buildBullet(`Sucesso: ${estados.sucesso}`, COLORS.SUCCESS));
                }
                if (estados.erro) {
                    children.push(buildBullet(`Erro: ${estados.erro}`, COLORS.ERROR));
                }
            }

            // Pré-condições
            if (tela.pre_condicoes?.length > 0) {
                children.push(buildHeading3('Pré-condições'));
                tela.pre_condicoes.forEach(pre => {
                    children.push(buildBullet(pre, COLORS.WARNING));
                });
            }

            children.push(new Paragraph({ spacing: { after: 300 } }));
        });

        return children;
    }

    function buildDiagramsSection(diagramImages, num) {
        const children = [];

        children.push(buildSectionTitle(`${num}. DIAGRAMAS E FLUXOS`));

        children.push(buildParagraph('Esta seção apresenta os diagramas visuais do projeto, incluindo fluxos de processos, arquitetura e integrações. Os diagramas foram gerados automaticamente a partir das especificações do PDD.'));
        children.push(new Paragraph({ spacing: { after: 300 } }));

        // Descrições por tipo de diagrama
        const diagramDescriptions = {
            'rpa-flow': 'Visão geral do fluxo de execução entre os RPAs do projeto, mostrando a sequência de processamento e dependências.',
            'architecture': 'Arquitetura técnica do projeto, apresentando os sistemas envolvidos, bancos de dados, APIs e suas interconexões.',
            'integration-sequence': 'Diagrama de sequência das integrações, detalhando a ordem das chamadas entre sistemas e os dados trafegados.',
            'timeline': 'Linha do tempo do projeto com as principais etapas e marcos do cronograma de implementação.',
            'rpa-detail': 'Fluxo detalhado de execução do RPA, com todos os passos, decisões e tratamentos de exceção.'
        };

        // Organizar diagramas por categoria
        const categories = {
            'visao-geral': { title: 'Visão Geral do Projeto', diagrams: [] },
            'arquitetura': { title: 'Arquitetura e Integrações', diagrams: [] },
            'fluxos-rpa': { title: 'Fluxos Detalhados dos RPAs', diagrams: [] },
            'cronograma': { title: 'Cronograma', diagrams: [] }
        };

        // Classificar diagramas
        diagramImages.forEach(diagram => {
            if (diagram.type === 'rpa-flow') {
                categories['visao-geral'].diagrams.push(diagram);
            } else if (diagram.type === 'architecture' || diagram.type === 'integration-sequence') {
                categories['arquitetura'].diagrams.push(diagram);
            } else if (diagram.type === 'rpa-detail') {
                categories['fluxos-rpa'].diagrams.push(diagram);
            } else if (diagram.type === 'timeline') {
                categories['cronograma'].diagrams.push(diagram);
            } else {
                categories['visao-geral'].diagrams.push(diagram);
            }
        });

        let subSection = 1;
        let figureNum = 1;

        // Renderizar cada categoria
        Object.entries(categories).forEach(([key, category]) => {
            if (category.diagrams.length === 0) return;

            // Título da categoria
            children.push(buildHeading2(`${num}.${subSection} ${category.title}`));
            subSection++;

            // Cada diagrama da categoria
            category.diagrams.forEach((diagram) => {
                // Subtítulo do diagrama
                children.push(buildHeading3(diagram.title));

                // Descrição do tipo
                const desc = diagramDescriptions[diagram.type] || diagram.description || '';
                if (desc) {
                    children.push(buildParagraph(desc));
                }

                // Imagem do diagrama
                try {
                    const imageWidth = Math.min(diagram.width || 600, 580);
                    const aspectRatio = (diagram.height || 300) / (diagram.width || 600);
                    const imageHeight = Math.round(imageWidth * aspectRatio);

                    children.push(new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: Uint8Array.from(atob(diagram.base64), c => c.charCodeAt(0)),
                                transformation: {
                                    width: imageWidth,
                                    height: imageHeight
                                }
                            })
                        ],
                        spacing: { before: 200, after: 150 }
                    }));

                    // Legenda centralizada em tabela para ficar mais profissional
                    children.push(new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE }
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({
                                                text: `Figura ${figureNum}: ${diagram.title}`,
                                                font: FONTS.BODY,
                                                size: SIZES.TINY,
                                                italics: true,
                                                color: COLORS.GRAY
                                            })]
                                        })],
                                        borders: {
                                            top: { style: BorderStyle.NONE },
                                            bottom: { style: BorderStyle.NONE },
                                            left: { style: BorderStyle.NONE },
                                            right: { style: BorderStyle.NONE }
                                        }
                                    })
                                ]
                            })
                        ]
                    }));
                    children.push(new Paragraph({ spacing: { after: 300 } }));

                    figureNum++;

                } catch (e) {
                    console.warn(`Erro ao inserir diagrama ${diagram.title}:`, e);
                    children.push(buildParagraph(`[Diagrama: ${diagram.title} - não foi possível renderizar]`));
                }
            });
        });

        // Nota final
        children.push(new Paragraph({ spacing: { before: 200 } }));
        children.push(...buildInfoBox('NOTA', 'Os diagramas foram gerados automaticamente a partir da especificação do projeto utilizando Mermaid.js. Para edição, os códigos-fonte podem ser exportados no formato Mermaid através da interface web.'));

        return children;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NOVAS SEÇÕES: ROADMAP, LACUNAS, PERGUNTAS, REQUISITOS INFERIDOS, TESTES
    // ═══════════════════════════════════════════════════════════════════════════

    function buildRoadmapSection(pddData, num) {
        const children = [];
        const fases = pddData.roadmap?.fases || [];

        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: `${num}. ROADMAP DO PROJETO`, font: FONTS.TITLE, size: SIZES.TITLE_1, bold: true, color: COLORS.PRIMARY })],
            spacing: { before: 200, after: 300 }
        }));

        children.push(buildParagraph('Fases planejadas para implementação, com critérios MoSCoW de priorização.'));

        // Tabela de fases
        const headerRow = new TableRow({
            tableHeader: true,
            children: [
                buildHeaderCell('Fase', 8),
                buildHeaderCell('Nome', 20),
                buildHeaderCell('Prioridade', 14),
                buildHeaderCell('Requisitos', 20),
                buildHeaderCell('Entrega de Valor', 38)
            ]
        });

        const dataRows = fases.map(fase => new TableRow({
            children: [
                buildBodyCell(String(fase.numero || '-')),
                buildBodyCell(fase.nome || '-'),
                buildBodyCell(fase.criterio_moscow || '-'),
                buildBodyCell((fase.requisitos || []).join(', ') || '-'),
                buildBodyCell(fase.entrega_valor || '-')
            ]
        }));

        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
        }));

        // Critério Go/No-Go se existir
        fases.forEach(fase => {
            if (fase.criterio_go_nogo) {
                children.push(new Paragraph({ spacing: { before: 200 } }));
                children.push(...buildHighlightBox(`FASE ${fase.numero} - GO/NO-GO`, [
                    `• ${fase.criterio_go_nogo}`
                ], COLORS.BG_WARNING, COLORS.WARNING));
            }
        });

        // Grafo de dependências
        if (pddData.roadmap?.grafo_dependencias) {
            children.push(buildSubtitle('Grafo de Dependências'));
            const grafo = pddData.roadmap.grafo_dependencias;
            Object.keys(grafo).forEach(req => {
                const deps = grafo[req];
                const depText = deps.depende_de?.length > 0 ? `Depende de: ${deps.depende_de.join(', ')}` : 'Sem dependências';
                const needText = deps.necessario_para?.length > 0 ? `Necessário para: ${deps.necessario_para.join(', ')}` : '';
                children.push(buildBullet(`${req}: ${depText}${needText ? ' | ' + needText : ''}`));
            });
        }

        return children;
    }

    function buildGapsSection(pddData, num) {
        const children = [];
        const gaps = pddData.lacunas_criticas || [];

        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: `${num}. LACUNAS CRÍTICAS IDENTIFICADAS`, font: FONTS.TITLE, size: SIZES.TITLE_1, bold: true, color: COLORS.PRIMARY })],
            spacing: { before: 200, after: 300 }
        }));

        children.push(buildParagraph(`Foram identificadas ${gaps.length} lacunas no texto do projeto que requerem atenção.`));

        // Tabela de lacunas
        const headerRow = new TableRow({
            tableHeader: true,
            children: [
                buildHeaderCell('Campo', 20),
                buildHeaderCell('Impacto', 10),
                buildHeaderCell('Descrição', 35),
                buildHeaderCell('Pergunta Sugerida', 35)
            ]
        });

        const dataRows = gaps.map(gap => new TableRow({
            children: [
                buildBodyCell(gap.campo || '-'),
                buildBodyCell(gap.impacto || '-'),
                buildBodyCell(gap.descricao || '-'),
                buildBodyCell(gap.sugestao_pergunta || '-')
            ]
        }));

        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
        }));

        // Score de completude
        const score = pddData.analise_qualidade?.completude_score;
        if (score) {
            children.push(new Paragraph({ spacing: { before: 300 } }));
            children.push(...buildHighlightBox('SCORE DE COMPLETUDE', [
                `• Score Geral: ${score.score_geral || 0}%`,
                `• Requisitos: ${score.requisitos?.percentual || 0}% (${score.requisitos?.itens_completos || 0}/${score.requisitos?.total_itens || 0})`,
                `• Regras de Negócio: ${score.regras_negocio?.percentual || 0}% (${score.regras_negocio?.itens_completos || 0}/${score.regras_negocio?.total_itens || 0})`,
                `• Integrações: ${score.integracoes?.percentual || 0}% (${score.integracoes?.itens_completos || 0}/${score.integracoes?.total_itens || 0})`,
                `• Status: ${score.status || 'N/A'}`
            ], score.score_geral >= 70 ? COLORS.BG_SUCCESS : COLORS.BG_ERROR,
               score.score_geral >= 70 ? COLORS.SUCCESS : COLORS.ERROR));
        }

        return children;
    }

    function buildClarificationQuestionsSection(pddData, num) {
        const children = [];
        const perguntas = pddData.perguntas_clarificacao || [];

        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: `${num}. PERGUNTAS DE CLARIFICAÇÃO`, font: FONTS.TITLE, size: SIZES.TITLE_1, bold: true, color: COLORS.PRIMARY })],
            spacing: { before: 200, after: 300 }
        }));

        children.push(buildParagraph('Perguntas que devem ser respondidas pelo solicitante para completar o PDD.'));

        perguntas.forEach((p, i) => {
            const obrigatoria = p.obrigatoria ? ' [OBRIGATÓRIA]' : ' [OPCIONAL]';
            children.push(new Paragraph({
                heading: HeadingLevel.HEADING_3,
                children: [new TextRun({ text: `${p.id || `PC-${i+1}`}: ${p.tipo || 'GERAL'}${obrigatoria}`, font: FONTS.TITLE, size: SIZES.TITLE_3, bold: true, color: COLORS.TERTIARY })],
                spacing: { before: 200, after: 100 }
            }));

            if (p.trecho_original) {
                children.push(buildParagraph(`Trecho: "${p.trecho_original}"`));
            }
            if (p.problema_detectado) {
                children.push(buildParagraph(`Problema: ${p.problema_detectado}`));
            }
            children.push(...buildHighlightBox('PERGUNTA', [`${p.pergunta || '-'}`], COLORS.BG_WARNING, COLORS.WARNING));
            if (p.contexto) {
                children.push(buildParagraph(`Contexto: ${p.contexto}`));
            }
        });

        return children;
    }

    function buildInferredRequirementsSection(pddData, num) {
        const children = [];
        const inferidos = pddData.requisitos_inferidos || [];

        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: `${num}. REQUISITOS INFERIDOS`, font: FONTS.TITLE, size: SIZES.TITLE_1, bold: true, color: COLORS.PRIMARY })],
            spacing: { before: 200, after: 300 }
        }));

        children.push(...buildHighlightBox('NOTA', [
            '• Estes requisitos foram INFERIDOS automaticamente pela IA e NÃO estavam explícitos no texto.',
            '• Devem ser VALIDADOS com o solicitante antes de serem incluídos no escopo.'
        ], COLORS.BG_WARNING, COLORS.WARNING));

        // Tabela de requisitos inferidos
        const headerRow = new TableRow({
            tableHeader: true,
            children: [
                buildHeaderCell('ID', 10),
                buildHeaderCell('Tipo', 14),
                buildHeaderCell('Código', 12),
                buildHeaderCell('Título', 25),
                buildHeaderCell('Justificativa', 25),
                buildHeaderCell('Confiança', 14)
            ]
        });

        const dataRows = inferidos.map(ri => new TableRow({
            children: [
                buildBodyCell(ri.id || '-'),
                buildBodyCell(ri.tipo_inferencia || '-'),
                buildBodyCell(ri.requisito_sugerido?.codigo || '-'),
                buildBodyCell(ri.requisito_sugerido?.titulo || '-'),
                buildBodyCell(ri.requisito_sugerido?.justificativa || '-'),
                buildBodyCell(ri.requisito_sugerido?.confianca || '-')
            ]
        }));

        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
        }));

        return children;
    }

    function buildTestScenariosSection(pddData, num) {
        const children = [];

        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: `${num}. CENÁRIOS DE TESTE`, font: FONTS.TITLE, size: SIZES.TITLE_1, bold: true, color: COLORS.PRIMARY })],
            spacing: { before: 200, after: 300 }
        }));

        children.push(buildParagraph('Cenários de teste gerados automaticamente no formato Gherkin (Given-When-Then).'));

        const reqs = (pddData.requisitos_funcionais || []).filter(r => r.cenarios_teste?.length > 0);
        
        reqs.forEach(req => {
            children.push(new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [new TextRun({ text: `${req.codigo || 'RF'}: ${req.titulo || 'Requisito'}`, font: FONTS.TITLE, size: SIZES.TITLE_2, bold: true, color: COLORS.SECONDARY })],
                spacing: { before: 300, after: 150 }
            }));

            (req.cenarios_teste || []).forEach(ct => {
                children.push(new Paragraph({
                    heading: HeadingLevel.HEADING_3,
                    children: [new TextRun({ text: `Cenário: ${ct.cenario || ct.titulo || 'Teste'}`, font: FONTS.TITLE, size: SIZES.TITLE_3, bold: true, color: COLORS.TERTIARY })],
                    spacing: { before: 150, after: 80 }
                }));

                // Gherkin steps
                const steps = [];
                if (ct.dado || ct.given) steps.push(`DADO ${ct.dado || ct.given}`);
                if (ct.quando || ct.when) steps.push(`QUANDO ${ct.quando || ct.when}`);
                if (ct.entao || ct.then) steps.push(`ENTÃO ${ct.entao || ct.then}`);
                
                if (steps.length > 0) {
                    steps.forEach(step => {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: step, font: FONTS.CODE, size: SIZES.CODE, color: COLORS.GRAY })],
                            spacing: { after: 40 },
                            indent: { left: 400 }
                        }));
                    });
                }

                if (ct.tipo) {
                    children.push(buildParagraph(`Tipo: ${ct.tipo}`));
                }
            });
        });

        return children;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIM DAS NOVAS SEÇÕES
    // ═══════════════════════════════════════════════════════════════════════════

    function buildGlossarySection(pddData, num) {
        const children = [];

        children.push(buildSectionTitle(`${num}. GLOSSÁRIO`));

        const defaultTerms = [
            { termo: 'RPA', definicao: 'Robotic Process Automation - Automação Robótica de Processos' },
            { termo: 'PDD', definicao: 'Prompt Driven Development - Desenvolvimento Guiado por Prompts' },
            { termo: 'UAT', definicao: 'User Acceptance Testing - Teste de Aceite do Usuário' },
            { termo: 'RF', definicao: 'Requisito Funcional' },
            { termo: 'RN', definicao: 'Regra de Negócio' },
            { termo: 'INT', definicao: 'Integração' },
            { termo: 'API', definicao: 'Application Programming Interface - Interface de Programação de Aplicações' }
        ];

        const glossario = pddData.glossario?.length > 0 ? pddData.glossario : defaultTerms;

        const glossaryRows = [
            new TableRow({
                tableHeader: true,
                children: [
                    buildHeaderCell('Termo', 25),
                    buildHeaderCell('Definição', 75)
                ]
            })
        ];

        glossario.forEach((item, i) => {
            glossaryRows.push(new TableRow({
                children: [
                    new TableCell({
                        shading: { fill: i % 2 === 1 ? 'F5F5F5' : 'FFFFFF' },
                        children: [new Paragraph({
                            children: [new TextRun({
                                text: item.termo,
                                font: FONTS.BODY,
                                size: SIZES.SMALL,
                                bold: true
                            })]
                        })],
                        verticalAlign: VerticalAlign.CENTER
                    }),
                    buildBodyCell(item.definicao, i % 2 === 1)
                ]
            }));
        });

        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: glossaryRows }));

        return children;
    }

    function buildApprovalsSection(pddData, num) {
        const children = [];

        children.push(buildSectionTitle(`${num}. APROVAÇÕES`));

        children.push(buildParagraph('Este documento foi revisado e aprovado pelos stakeholders abaixo:'));
        children.push(new Paragraph({ spacing: { after: 400 } }));

        // Linhas de assinatura
        const aprovadores = [
            { papel: 'Sponsor', nome: pddData.stakeholders?.sponsor || '________________________________' },
            { papel: 'Product Owner', nome: pddData.stakeholders?.product_owner || '________________________________' },
            { papel: 'Responsável Técnico', nome: pddData.stakeholders?.responsavel_tecnico || '________________________________' },
            { papel: 'Responsável Negócio', nome: pddData.stakeholders?.responsavel_negocio || '________________________________' }
        ];

        aprovadores.forEach(apr => {
            children.push(new Paragraph({ spacing: { after: 600 } }));
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: '________________________________________________',
                        font: FONTS.BODY,
                        size: SIZES.BODY
                    })
                ]
            }));
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: apr.nome,
                        font: FONTS.BODY,
                        size: SIZES.BODY,
                        bold: true
                    })
                ]
            }));
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: apr.papel,
                        font: FONTS.BODY,
                        size: SIZES.SMALL,
                        color: COLORS.GRAY
                    })
                ]
            }));
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: 'Data: ____/____/________',
                        font: FONTS.BODY,
                        size: SIZES.SMALL,
                        color: COLORS.GRAY
                    })
                ]
            }));
        });

        return children;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS - ELEMENTOS DE CONSTRUÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    function buildSectionTitle(text) {
        return new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
                new TextRun({
                    text: text.toUpperCase(),
                    font: FONTS.TITLE,
                    size: SIZES.TITLE_1,
                    bold: true,
                    color: COLORS.PRIMARY
                })
            ],
            spacing: { before: 200, after: 200 },
            border: {
                bottom: { style: BorderStyle.SINGLE, size: 16, color: COLORS.PRIMARY, space: 8 }
            }
        });
    }

    function buildHeading2(text) {
        return new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
                new TextRun({
                    text: text,
                    font: FONTS.TITLE,
                    size: SIZES.TITLE_2,
                    bold: true,
                    color: COLORS.SECONDARY
                })
            ],
            spacing: { before: 300, after: 120 },
            border: {
                bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY, space: 4 }
            }
        });
    }

    function buildHeading3(text) {
        return new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
                new TextRun({
                    text: text,
                    font: FONTS.TITLE,
                    size: SIZES.TITLE_3,
                    bold: true,
                    color: COLORS.TERTIARY
                })
            ],
            spacing: { before: 200, after: 80 }
        });
    }

    function buildSubtitle(text) {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    font: FONTS.TITLE,
                    size: SIZES.TITLE_3,
                    bold: true,
                    color: COLORS.TERTIARY
                })
            ],
            spacing: { before: 240, after: 80 }
        });
    }

    function buildParagraph(text) {
        return new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
                new TextRun({
                    text: text,
                    font: FONTS.BODY,
                    size: SIZES.BODY
                })
            ],
            spacing: { after: 120 }
        });
    }

    /**
     * Cria célula de cabeçalho de tabela
     */
    function buildTableHeaderCell(text) {
        return new TableCell({
            shading: { fill: COLORS.PRIMARY },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                    text: text,
                    font: FONTS.BODY,
                    size: SIZES.SMALL,
                    bold: true,
                    color: 'FFFFFF'
                })]
            })]
        });
    }

    /**
     * Cria célula de dados de tabela
     */
    function buildTableCell(text) {
        return new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
                children: [new TextRun({
                    text: text || '',
                    font: FONTS.BODY,
                    size: SIZES.SMALL
                })]
            })],
            margins: {
                top: 50,
                bottom: 50,
                left: 80,
                right: 80
            }
        });
    }

    function buildBullet(text, color = COLORS.BLACK) {
        return new Paragraph({
            bullet: { level: 0 },
            children: [
                new TextRun({
                    text: text,
                    font: FONTS.BODY,
                    size: SIZES.BODY,
                    color: color
                })
            ],
            spacing: { after: 60 }
        });
    }

    function buildNumberedItem(text) {
        return new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    font: FONTS.BODY,
                    size: SIZES.BODY
                })
            ],
            spacing: { after: 60 },
            indent: { left: 400 }
        });
    }

    /**
     * Cria uma tabela formatada com título e conteúdo
     */
    function buildHighlightBox(title, lines, bgColor, borderColor) {
        const children = [];
        
        // Criar tabela com duas colunas: rótulo e valor
        const rows = [];
        
        // Linha de cabeçalho com título
        rows.push(new TableRow({
            children: [
                new TableCell({
                    shading: { fill: borderColor || COLORS.PRIMARY },
                    columnSpan: 2,
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: title,
                            font: FONTS.TITLE,
                            size: SIZES.BODY,
                            bold: true,
                            color: COLORS.WHITE
                        })],
                        spacing: { before: 80, after: 80 }
                    })],
                    margins: { top: 80, bottom: 80, left: 120, right: 120 }
                })
            ]
        }));

        // Linhas de conteúdo
        lines.forEach((line, i) => {
            if (line.trim() === '') return; // Pular linhas vazias
            
            // Verificar se é um par label: valor
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0 && colonIndex < 30 && !line.startsWith('   ')) {
                const label = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                
                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: 'f7fafc' },
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({
                                children: [new TextRun({
                                    text: label,
                                    font: FONTS.BODY,
                                    size: SIZES.SMALL,
                                    bold: true,
                                    color: COLORS.TERTIARY
                                })]
                            })],
                            margins: { top: 60, bottom: 60, left: 120, right: 60 }
                        }),
                        new TableCell({
                            shading: { fill: i % 2 === 0 ? 'FFFFFF' : 'f7fafc' },
                            width: { size: 75, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({
                                children: [new TextRun({
                                    text: value,
                                    font: FONTS.BODY,
                                    size: SIZES.SMALL
                                })]
                            })],
                            margins: { top: 60, bottom: 60, left: 60, right: 120 }
                        })
                    ]
                }));
            } else {
                // Linha de texto simples (span 2 colunas)
                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            shading: { fill: i % 2 === 0 ? 'FFFFFF' : 'f7fafc' },
                            columnSpan: 2,
                            children: [new Paragraph({
                                children: [new TextRun({
                                    text: line.replace(/^   /, '    • '),
                                    font: FONTS.BODY,
                                    size: SIZES.SMALL
                                })]
                            })],
                            margins: { top: 60, bottom: 60, left: 120, right: 120 }
                        })
                    ]
                }));
            }
        });

        children.push(new Paragraph({ spacing: { before: 200 } }));
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                left: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                right: { style: BorderStyle.SINGLE, size: 8, color: COLORS.LIGHT_GRAY },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLORS.LIGHT_GRAY }
            },
            rows: rows
        }));
        children.push(new Paragraph({ spacing: { after: 200 } }));

        return children;
    }

    function buildInfoBox(title, content) {
        return buildHighlightBox(title, [content], COLORS.BG_NOTE, COLORS.INFO);
    }

    function buildWarningBox(title, content) {
        return buildHighlightBox(title, [content], COLORS.BG_ERROR, COLORS.ERROR);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS - TABELAS
    // ═══════════════════════════════════════════════════════════════════════════

    function buildHeaderCell(text, width = 20) {
        return new TableCell({
            shading: { fill: COLORS.BG_HEADER, type: ShadingType.CLEAR },
            width: { size: width, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                    text: text.toUpperCase(),
                    font: FONTS.TITLE,
                    size: SIZES.SMALL,
                    bold: true,
                    color: COLORS.WHITE
                })],
                spacing: { before: 60, after: 60 }
            })],
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 80, right: 80 }
        });
    }

    function buildBodyCell(text, alternate = false) {
        return new TableCell({
            shading: { fill: alternate ? 'f7fafc' : 'FFFFFF', type: ShadingType.CLEAR },
            children: [new Paragraph({
                children: [new TextRun({
                    text: text || '-',
                    font: FONTS.BODY,
                    size: SIZES.SMALL,
                    color: COLORS.BLACK
                })],
                spacing: { before: 40, after: 40 }
            })],
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 40, bottom: 40, left: 100, right: 100 }
        });
    }

    function buildPriorityCell(priority, alternate = false) {
        const colors = {
            'MUST': { bg: 'FFEBEE', text: 'C00000' },
            'SHOULD': { bg: 'FFF3E0', text: 'FF8C00' },
            'COULD': { bg: 'E3F2FD', text: '0066CC' },
            'WONT': { bg: 'F5F5F5', text: '666666' }
        };
        const style = colors[priority] || colors['SHOULD'];

        return new TableCell({
            shading: { fill: alternate ? 'F5F5F5' : style.bg },
            children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                    text: priority,
                    font: FONTS.BODY,
                    size: SIZES.SMALL,
                    bold: true,
                    color: style.text
                })]
            })],
            verticalAlign: VerticalAlign.CENTER
        });
    }

    function buildDirectionCell(direction, alternate = false) {
        const arrows = {
            'ENTRADA': '← ENTRADA',
            'SAIDA': 'SAÍDA →',
            'BIDIRECIONAL': '↔ BIDI'
        };
        return buildBodyCell(arrows[direction] || direction, alternate);
    }

    function buildProbabilityCell(prob, alternate = false) {
        const icons = { 'ALTA': '🔴', 'MÉDIA': '🟡', 'MEDIA': '🟡', 'BAIXA': '🟢' };
        return buildBodyCell(`${icons[prob] || '🟡'} ${prob}`, alternate);
    }

    function buildImpactCell(impact, alternate = false) {
        const icons = { 'ALTO': '🔴', 'CRÍTICO': '🔴', 'CRITICO': '🔴', 'MÉDIO': '🟡', 'MEDIO': '🟡', 'BAIXO': '🟢' };
        return buildBodyCell(`${icons[impact] || '🟡'} ${impact}`, alternate);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS - CABEÇALHO E RODAPÉ
    // ═══════════════════════════════════════════════════════════════════════════

    function buildHeaderParagraph(projectName) {
        return new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
                bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.PRIMARY }
            },
            children: [
                new TextRun({
                    text: 'MINERVA FOODS',
                    font: FONTS.TITLE,
                    size: SIZES.TINY,
                    bold: true,
                    color: COLORS.PRIMARY
                }),
                new TextRun({
                    text: '  |  ',
                    font: FONTS.BODY,
                    size: SIZES.TINY,
                    color: COLORS.LIGHT_GRAY
                }),
                new TextRun({
                    text: `PDD - ${projectName}`,
                    font: FONTS.BODY,
                    size: SIZES.TINY,
                    bold: true,
                    color: COLORS.TERTIARY
                })
            ],
            spacing: { after: 200 }
        });
    }

    function buildFooterParagraph(projectName, isRoman = false) {
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        return new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.PRIMARY }
            },
            children: [
                new TextRun({
                    text: `${projectName} | Versão 1.0 | ${dataAtual}`,
                    font: FONTS.BODY,
                    size: SIZES.TINY,
                    color: COLORS.GRAY
                }),
                new TextRun({
                    text: '          Página ',
                    font: FONTS.BODY,
                    size: SIZES.TINY,
                    color: COLORS.GRAY
                }),
                new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONTS.BODY,
                    size: SIZES.TINY,
                    color: COLORS.GRAY
                }),
                new TextRun({
                    text: ' de ',
                    font: FONTS.BODY,
                    size: SIZES.TINY,
                    color: COLORS.GRAY
                }),
                new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONTS.BODY,
                    size: SIZES.TINY,
                    color: COLORS.GRAY
                })
            ],
            spacing: { before: 200 }
        });
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
