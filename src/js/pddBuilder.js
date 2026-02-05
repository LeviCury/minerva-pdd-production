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
        // Cores Principais
        PRIMARY: '003366',        // Azul Minerva (Títulos Nível 1)
        SECONDARY: '0066CC',      // Azul Médio (Títulos Nível 2)
        TERTIARY: '404040',       // Cinza Escuro (Títulos Nível 3)
        
        // Cores Funcionais
        RF_GREEN: '008000',       // Verde para RF
        RN_ORANGE: 'FF8C00',      // Laranja para RN
        RNF_PURPLE: '660099',     // Roxo para RNF
        INT_TEAL: '008080',       // Azul Petróleo para INT
        
        // Cores de Status
        SUCCESS: '009900',        // Verde Sucesso
        WARNING: 'FFA500',        // Laranja Atenção
        ERROR: 'C00000',          // Vermelho Erro
        INFO: '0066CC',           // Azul Informação
        
        // Fundos
        BG_NOTE: 'E6F2FF',        // Fundo Nota (Azul Claro)
        BG_WARNING: 'FFF9E6',     // Fundo Atenção (Amarelo Claro)
        BG_ERROR: 'FFE6E6',       // Fundo Erro (Rosa Claro)
        BG_SUCCESS: 'E6FFE6',     // Fundo Sucesso (Verde Claro)
        BG_CODE: 'F0F0F0',        // Fundo Código (Cinza Claro)
        BG_HEADER: '003366',      // Fundo Cabeçalho Tabela
        
        // Textos
        WHITE: 'FFFFFF',
        BLACK: '000000',
        GRAY: '666666',
        LIGHT_GRAY: 'CCCCCC'
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
                diagramImages = await DiagramGenerator.renderAllForWord(pddData);
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
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        return {
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.98),    // 2.5cm
                        bottom: convertInchesToTwip(0.98), // 2.5cm
                        left: convertInchesToTwip(1.18),   // 3.0cm
                        right: convertInchesToTwip(0.79)   // 2.0cm
                    },
                    size: {
                        width: convertInchesToTwip(8.27),  // A4 width
                        height: convertInchesToTwip(11.69) // A4 height
                    }
                },
                type: SectionType.NEXT_PAGE
            },
            children: [
                // Espaçamento superior
                new Paragraph({ spacing: { before: 1000 } }),
                
                // Logo placeholder
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: '🏢 MINERVA FOODS',
                            font: FONTS.TITLE,
                            size: 48,
                            bold: true,
                            color: COLORS.PRIMARY
                        })
                    ],
                    spacing: { after: 600 }
                }),
                
                // Linha decorativa
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: '═══════════════════════════════════════════',
                            color: COLORS.PRIMARY,
                            size: SIZES.BODY
                        })
                    ],
                    spacing: { after: 400 }
                }),
                
                // Tipo de documento
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: 'DOCUMENTO DE ESCOPO',
                            font: FONTS.TITLE,
                            size: 32,
                            bold: true,
                            color: COLORS.TERTIARY
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: 'PROMPT DRIVEN DEVELOPMENT (PDD)',
                            font: FONTS.TITLE,
                            size: 24,
                            color: COLORS.SECONDARY
                        })
                    ],
                    spacing: { after: 400 }
                }),
                
                // Linha decorativa
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: '═══════════════════════════════════════════',
                            color: COLORS.PRIMARY,
                            size: SIZES.BODY
                        })
                    ],
                    spacing: { after: 800 }
                }),
                
                // Nome do projeto
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: projeto.nome || 'Nome do Projeto',
                            font: FONTS.TITLE,
                            size: 48,
                            bold: true,
                            color: COLORS.PRIMARY
                        })
                    ],
                    spacing: { after: 200 }
                }),
                
                // Código do projeto (se houver)
                projeto.nome_codigo ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: `[${projeto.nome_codigo}]`,
                            font: FONTS.TITLE,
                            size: 28,
                            color: COLORS.GRAY
                        })
                    ],
                    spacing: { after: 800 }
                }) : new Paragraph({}),
                
                // Versão e Data
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: 'Versão: 1.0',
                            font: FONTS.BODY,
                            size: SIZES.BODY,
                            color: COLORS.TERTIARY
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: `Data: ${dataAtual}`,
                            font: FONTS.BODY,
                            size: SIZES.BODY,
                            color: COLORS.TERTIARY
                        })
                    ],
                    spacing: { after: 1200 }
                }),
                
                // Linha separadora
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: '─────────────────────────────────────────',
                            color: COLORS.LIGHT_GRAY,
                            size: SIZES.SMALL
                        })
                    ],
                    spacing: { after: 400 }
                }),
                
                // Informações adicionais
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: `Área/Cliente: ${projeto.areas_envolvidas?.[0] || 'A definir'}`,
                            font: FONTS.BODY,
                            size: SIZES.SMALL,
                            color: COLORS.TERTIARY
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: `Analista: ${pddData.stakeholders?.responsavel_tecnico || 'MBS TI'}`,
                            font: FONTS.BODY,
                            size: SIZES.SMALL,
                            color: COLORS.TERTIARY
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: 'Departamento: MBS TI - Automação',
                            font: FONTS.BODY,
                            size: SIZES.SMALL,
                            color: COLORS.TERTIARY
                        })
                    ],
                    spacing: { after: 1600 }
                }),
                
                // Footer da capa
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: '🤖 Powered by MAIA',
                            font: FONTS.BODY,
                            size: SIZES.TINY,
                            italics: true,
                            color: COLORS.GRAY
                        })
                    ]
                })
            ]
        };
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
        children.push(...buildHighlightBox('📊 DADOS DO PROJETO', [
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

        children.push(buildSubtitle('🎯 Situação Desejada (TO-BE)'));
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
            children.push(...buildHighlightBox('✅ PROPOSTA DE VALOR', [
                ...(projeto.beneficios?.tangiveis || []).map(b => `• ${b}`),
                ...(projeto.beneficios?.intangiveis || []).map(b => `• ${b}`)
            ], COLORS.BG_SUCCESS, COLORS.SUCCESS));
        }

        return children;
    }

    function buildTableOfContents() {
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [
                    new TextRun({
                        text: 'SUMÁRIO',
                        font: FONTS.TITLE,
                        size: SIZES.TITLE_1,
                        bold: true,
                        color: COLORS.PRIMARY
                    })
                ],
                spacing: { before: 200, after: 400 }
            }),
            new TableOfContents('Sumário', {
                hyperlink: true,
                headingStyleRange: '1-3'
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: '(Atualize o sumário após edições: Ctrl+A → F9)',
                        font: FONTS.BODY,
                        size: SIZES.TINY,
                        italics: true,
                        color: COLORS.GRAY
                    })
                ],
                spacing: { before: 400 }
            })
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEÇÃO 2: CORPO DO DOCUMENTO
    // ═══════════════════════════════════════════════════════════════════════════

    function buildMainSection(pddData, options, diagramImages = []) {
        const children = [];
        let sectionNum = 1;

        // 1. OBJETIVOS DO PROJETO
        children.push(...buildObjectivesSection(pddData, sectionNum++));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 2. STAKEHOLDERS
        children.push(...buildStakeholdersSection(pddData, sectionNum++));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 3. RPAs (AUTOMAÇÕES)
        children.push(...buildRPAsSection(pddData, sectionNum++));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 4. REQUISITOS FUNCIONAIS
        if (options.incluirRequisitos !== false) {
            children.push(...buildRequirementsSection(pddData, sectionNum++));
            children.push(new Paragraph({ children: [new PageBreak()] }));
        }

        // 5. REGRAS DE NEGÓCIO
        if (options.incluirRegras !== false) {
            children.push(...buildBusinessRulesSection(pddData, sectionNum++));
            children.push(new Paragraph({ children: [new PageBreak()] }));
        }

        // 6. INTEGRAÇÕES
        if (options.incluirIntegracoes !== false) {
            children.push(...buildIntegrationsSection(pddData, sectionNum++));
            children.push(new Paragraph({ children: [new PageBreak()] }));
        }

        // 7. INFRAESTRUTURA
        children.push(...buildInfrastructureSection(pddData, sectionNum++));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 8. CRONOGRAMA
        children.push(...buildScheduleSection(pddData, sectionNum++));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 9. RISCOS
        children.push(...buildRisksSection(pddData, sectionNum++));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 10. PREMISSAS E RESTRIÇÕES
        children.push(...buildPremissasSection(pddData, sectionNum++));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 11. DIAGRAMAS (se houver)
        if (diagramImages && diagramImages.length > 0) {
            children.push(...buildDiagramsSection(diagramImages, sectionNum++));
            children.push(new Paragraph({ children: [new PageBreak()] }));
        }

        // 12. GLOSSÁRIO
        children.push(...buildGlossarySection(pddData, sectionNum++));
        children.push(new Paragraph({ children: [new PageBreak()] }));

        // 12. APROVAÇÕES
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
            ['📋 Product Owner', stakeholders.product_owner || 'A definir', 'Definição de requisitos e prioridades'],
            ['🏢 Responsável Negócio', stakeholders.responsavel_negocio || 'A definir', 'Validação de regras de negócio'],
            ['💻 Responsável Técnico', stakeholders.responsavel_tecnico || 'MBS TI', 'Implementação técnica']
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
            children.push(...buildWarningBox('⚠️ PENDÊNCIA', 'Nenhum RPA foi identificado na descrição do projeto. Favor detalhar os processos a serem automatizados.'));
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

            // Fluxo de Execução
            if (rpa.fluxo_execucao && rpa.fluxo_execucao.length > 0) {
                children.push(buildHeading3('🔄 Fluxo de Execução'));
                rpa.fluxo_execucao.forEach((passo, j) => {
                    const texto = typeof passo === 'string' ? passo : (passo.acao || passo.descricao || `Passo ${j+1}`);
                    children.push(buildNumberedItem(`${j+1}. ${texto}`));
                });
            }

            // Exceções
            if (rpa.excecoes && rpa.excecoes.length > 0) {
                children.push(buildHeading3('❌ Tratamento de Exceções'));
                rpa.excecoes.forEach((exc, j) => {
                    const cenario = typeof exc === 'string' ? exc : (exc.cenario || exc.descricao);
                    const tratamento = typeof exc === 'object' ? exc.tratamento : null;
                    children.push(buildBullet(`${cenario}${tratamento ? ` → ${tratamento}` : ''}`, COLORS.ERROR));
                });
            }

            children.push(new Paragraph({ spacing: { after: 400 } }));
        });

        return children;
    }

    function buildRPABox(rpa, index) {
        const code = rpa.codigo || `RPA-${(index+1).toString().padStart(3, '0')}`;
        
        return buildHighlightBox(`🤖 ${code}: ${rpa.nome || 'RPA'}`, [
            '',
            '📌 IDENTIFICAÇÃO',
            `   • Código: ${code}`,
            `   • Trigger: ${rpa.trigger?.tipo || 'MANUAL'}`,
            `   • Frequência: ${rpa.trigger?.frequencia || 'Sob demanda'}`,
            `   • Volume Estimado: ${rpa.trigger?.volume_estimado || 'A definir'}`,
            '',
            '📝 DESCRIÇÃO',
            `   ${rpa.descricao || rpa.objetivo || 'Automação de processo de negócio.'}`,
            '',
            '📥 ENTRADA',
            `   • Origem: ${rpa.entrada?.origem || 'A definir'}`,
            `   • Dados: ${rpa.entrada?.dados?.join(', ') || 'A definir'}`,
            '',
            '📤 SAÍDA',
            `   • Destino: ${rpa.saida?.destino || 'A definir'}`,
            `   • Dados: ${rpa.saida?.dados?.join(', ') || 'A definir'}`,
            '',
            '💻 SISTEMAS',
            `   ${rpa.sistemas_utilizados?.join(', ') || 'A definir'}`
        ], COLORS.BG_NOTE, COLORS.SECONDARY);
    }

    function buildRequirementsSection(pddData, num) {
        const requisitos = pddData.requisitos_funcionais || [];
        const children = [];

        children.push(buildSectionTitle(`${num}. REQUISITOS FUNCIONAIS`));

        if (requisitos.length === 0) {
            children.push(...buildInfoBox('ℹ️ NOTA', 'Os requisitos funcionais serão detalhados com base nos RPAs especificados na seção anterior.'));
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

        // Cabeçalho do requisito
        children.push(new Paragraph({
            shading: { fill: 'FFFDE7' }, // Amarelo claro
            border: {
                left: { style: BorderStyle.SINGLE, size: 24, color: color }
            },
            children: [
                new TextRun({
                    text: `${code}: ${rf.titulo || 'Requisito Funcional'}`,
                    font: FONTS.TITLE,
                    size: SIZES.BODY,
                    bold: true,
                    color: color
                })
            ],
            spacing: { before: 300, after: 120 }
        }));

        // Conteúdo
        const content = [
            `📌 Módulo: ${rf.modulo || 'Geral'}`,
            `⭐ Prioridade: ${rf.prioridade || 'SHOULD'}`,
            `📊 Complexidade: ${rf.complexidade || 'MÉDIA'}`,
            '',
            `📝 ${rf.descricao || 'Descrição do requisito.'}`
        ];

        if (rf.fluxo_principal?.length > 0) {
            content.push('', '🔄 FLUXO PRINCIPAL:');
            rf.fluxo_principal.forEach((passo, i) => {
                content.push(`   ${i+1}. ${passo}`);
            });
        }

        if (rf.criterios_aceitacao?.length > 0) {
            content.push('', '✓ CRITÉRIOS DE ACEITAÇÃO:');
            rf.criterios_aceitacao.forEach(ca => {
                content.push(`   • ${ca}`);
            });
        }

        content.forEach(line => {
            children.push(new Paragraph({
                shading: { fill: 'FFFDE7' },
                border: {
                    left: { style: BorderStyle.SINGLE, size: 24, color: color }
                },
                children: [
                    new TextRun({
                        text: line,
                        font: FONTS.BODY,
                        size: SIZES.SMALL
                    })
                ],
                spacing: { after: 40 }
            }));
        });

        children.push(new Paragraph({ spacing: { after: 200 } }));

        return children;
    }

    function buildBusinessRulesSection(pddData, num) {
        const regras = pddData.regras_negocio || [];
        const children = [];

        children.push(buildSectionTitle(`${num}. REGRAS DE NEGÓCIO`));

        if (regras.length === 0) {
            children.push(...buildInfoBox('ℹ️ NOTA', 'As regras de negócio serão extraídas durante a fase de detalhamento dos requisitos.'));
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

        // Cabeçalho
        children.push(new Paragraph({
            shading: { fill: 'FFF3E0' }, // Laranja claro
            border: {
                left: { style: BorderStyle.SINGLE, size: 24, color: COLORS.RN_ORANGE }
            },
            children: [
                new TextRun({
                    text: `${code}: ${rn.titulo || 'Regra de Negócio'}`,
                    font: FONTS.TITLE,
                    size: SIZES.BODY,
                    bold: true,
                    color: COLORS.RN_ORANGE
                })
            ],
            spacing: { before: 300, after: 120 }
        }));

        // Conteúdo
        const content = [
            `🏷️ Tipo: ${rn.tipo || 'VALIDAÇÃO'}`,
            `📂 Categoria: ${rn.categoria || 'Geral'}`,
            '',
            `📝 ${rn.descricao || 'Descrição da regra.'}`
        ];

        if (rn.logica) {
            content.push('', '⚙️ LÓGICA:');
            content.push(`   ${rn.logica}`);
        }

        if (rn.excecoes?.length > 0) {
            content.push('', '⚡ EXCEÇÕES:');
            rn.excecoes.forEach(exc => {
                content.push(`   • ${exc}`);
            });
        }

        content.forEach(line => {
            children.push(new Paragraph({
                shading: { fill: 'FFF3E0' },
                border: {
                    left: { style: BorderStyle.SINGLE, size: 24, color: COLORS.RN_ORANGE }
                },
                children: [
                    new TextRun({
                        text: line,
                        font: line.includes('LÓGICA') || line.startsWith('   ') && !line.includes('•') ? FONTS.CODE : FONTS.BODY,
                        size: SIZES.SMALL
                    })
                ],
                spacing: { after: 40 }
            }));
        });

        children.push(new Paragraph({ spacing: { after: 200 } }));

        return children;
    }

    function buildIntegrationsSection(pddData, num) {
        const integracoes = pddData.integracoes || [];
        const children = [];

        children.push(buildSectionTitle(`${num}. INTEGRAÇÕES E INTERFACES`));

        if (integracoes.length === 0) {
            children.push(...buildInfoBox('ℹ️ NOTA', 'As integrações serão identificadas com base nos sistemas mencionados nos RPAs.'));
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

        // Cabeçalho
        children.push(new Paragraph({
            shading: { fill: 'E0F2F1' }, // Teal claro
            border: {
                left: { style: BorderStyle.SINGLE, size: 24, color: COLORS.INT_TEAL }
            },
            children: [
                new TextRun({
                    text: `${code}: Integração com ${int.sistema_externo || 'Sistema'}`,
                    font: FONTS.TITLE,
                    size: SIZES.BODY,
                    bold: true,
                    color: COLORS.INT_TEAL
                })
            ],
            spacing: { before: 300, after: 120 }
        }));

        // Conteúdo
        const content = [
            '🔌 IDENTIFICAÇÃO',
            `   • Sistema: ${int.sistema_externo || 'A definir'}`,
            `   • Direção: ${int.direcao || 'BIDIRECIONAL'}`,
            `   • Protocolo: ${int.protocolo || 'API'}`,
            `   • Frequência: ${int.frequencia || 'REAL_TIME'}`,
            '',
            '🎯 PROPÓSITO',
            `   ${int.proposito || 'Integração de dados entre sistemas.'}`
        ];

        if (int.dados_trafegados?.length > 0) {
            content.push('', '📊 DADOS TRAFEGADOS');
            int.dados_trafegados.forEach(dado => {
                content.push(`   • ${dado}`);
            });
        }

        if (int.tratamento_erros) {
            content.push('', '❌ TRATAMENTO DE ERROS');
            content.push(`   ${int.tratamento_erros}`);
        }

        content.forEach(line => {
            children.push(new Paragraph({
                shading: { fill: 'E0F2F1' },
                border: {
                    left: { style: BorderStyle.SINGLE, size: 24, color: COLORS.INT_TEAL }
                },
                children: [
                    new TextRun({
                        text: line,
                        font: FONTS.BODY,
                        size: SIZES.SMALL
                    })
                ],
                spacing: { after: 40 }
            }));
        });

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
            children.push(buildBullet(`💻 ${tech}`));
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
            children.push(buildNumberedItem(`${i+1}. 🎯 ${marco}`));
        });

        // Nota sobre cronograma
        children.push(...buildInfoBox('ℹ️ NOTA', 'O cronograma apresentado é uma estimativa inicial e pode ser ajustado durante o planejamento detalhado do projeto.'));

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
            children.push(buildBullet(`✅ ${p}`, COLORS.SUCCESS));
        });

        // Restrições
        children.push(buildHeading2(`${num}.2 Restrições`));
        const restricoes = pddData.restricoes?.length > 0 ? pddData.restricoes : [
            'Não serão realizadas alterações em sistemas legados',
            'O projeto deve seguir os padrões de segurança da empresa',
            'Integração limitada às APIs disponíveis'
        ];
        restricoes.forEach(r => {
            children.push(buildBullet(`⚠️ ${r}`, COLORS.WARNING));
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

    function buildDiagramsSection(diagramImages, num) {
        const children = [];

        children.push(buildSectionTitle(`${num}. DIAGRAMAS E FLUXOS`));

        children.push(buildParagraph('Esta seção apresenta os diagramas visuais do projeto, incluindo fluxos de processos, arquitetura e integrações.'));
        children.push(new Paragraph({ spacing: { after: 300 } }));

        // Adicionar cada diagrama
        diagramImages.forEach((diagram, i) => {
            // Título do diagrama
            children.push(buildHeading2(`${num}.${i + 1} ${diagram.title}`));

            // Imagem do diagrama
            try {
                const imageWidth = Math.min(diagram.width || 600, 600);
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
                    spacing: { after: 200 }
                }));

                // Legenda
                children.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: `Figura ${i + 1}: ${diagram.title}`,
                            font: FONTS.BODY,
                            size: SIZES.TINY,
                            italics: true,
                            color: COLORS.GRAY
                        })
                    ],
                    spacing: { after: 400 }
                }));

            } catch (e) {
                console.warn(`Erro ao inserir diagrama ${diagram.title}:`, e);
                children.push(buildParagraph(`[Diagrama: ${diagram.title} - não foi possível renderizar]`));
            }
        });

        // Nota sobre os diagramas
        children.push(...buildInfoBox('ℹ️ NOTA', 'Os diagramas foram gerados automaticamente a partir da especificação do projeto. Para versões editáveis, exporte os diagramas em formato Mermaid.'));

        return children;
    }

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
                    text: text,
                    font: FONTS.TITLE,
                    size: SIZES.TITLE_1,
                    bold: true,
                    color: COLORS.PRIMARY
                })
            ],
            spacing: { before: 200, after: 300 },
            pageBreakBefore: true
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
            spacing: { before: 360, after: 120 }
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
            spacing: { before: 240, after: 80 }
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

    function buildHighlightBox(title, lines, bgColor, borderColor) {
        const children = [];
        
        // Título da caixa
        children.push(new Paragraph({
            shading: { fill: bgColor },
            border: {
                left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
                right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor }
            },
            children: [
                new TextRun({
                    text: title,
                    font: FONTS.TITLE,
                    size: SIZES.BODY,
                    bold: true,
                    color: borderColor
                })
            ],
            spacing: { before: 200, after: 60 }
        }));

        // Linhas do conteúdo
        lines.forEach((line, i) => {
            children.push(new Paragraph({
                shading: { fill: bgColor },
                border: {
                    left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                    right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
                    bottom: i === lines.length - 1 ? { style: BorderStyle.SINGLE, size: 1, color: borderColor } : undefined
                },
                children: [
                    new TextRun({
                        text: line,
                        font: FONTS.BODY,
                        size: SIZES.SMALL
                    })
                ],
                spacing: { after: i === lines.length - 1 ? 200 : 20 }
            }));
        });

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
            shading: { fill: COLORS.BG_HEADER },
            width: { size: width, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                    text: text,
                    font: FONTS.TITLE,
                    size: SIZES.SMALL,
                    bold: true,
                    color: COLORS.WHITE
                })]
            })],
            verticalAlign: VerticalAlign.CENTER
        });
    }

    function buildBodyCell(text, alternate = false) {
        return new TableCell({
            shading: { fill: alternate ? 'F5F5F5' : 'FFFFFF' },
            children: [new Paragraph({
                children: [new TextRun({
                    text: text || '-',
                    font: FONTS.BODY,
                    size: SIZES.SMALL
                })]
            })],
            verticalAlign: VerticalAlign.CENTER
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
                bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.PRIMARY }
            },
            children: [
                new TextRun({
                    text: '🏢 MINERVA FOODS  │  ',
                    font: FONTS.BODY,
                    size: SIZES.TINY,
                    color: COLORS.PRIMARY
                }),
                new TextRun({
                    text: `DOCUMENTO DE ESCOPO - ${projectName}`,
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
