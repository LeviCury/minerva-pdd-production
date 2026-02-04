/**
 * MINERVA PDD GENERATOR - Document Generator Module
 * Módulo responsável por gerar o documento Word
 */

const DocGenerator = (function() {
    'use strict';

    // Cores dos temas
    const THEMES = {
        minerva: { primary: 'C41E3A', secondary: '8B0000', name: 'Minerva' },
        blue: { primary: '2563eb', secondary: '1d4ed8', name: 'Profissional' },
        purple: { primary: '7c3aed', secondary: '6d28d9', name: 'Elegante' },
        green: { primary: '059669', secondary: '047857', name: 'Moderno' }
    };

    /**
     * Gera o documento Word a partir dos elementos parseados
     */
    function generate(projectName, elements, options = {}) {
        const {
            structure = 'full',
            theme = 'minerva'
        } = options;

        const themeColors = THEMES[theme] || THEMES.minerva;
        const primaryColor = themeColors.primary;
        const children = [];

        // ═══════════════════════════════════════════════════════════════
        // CAPA
        // ═══════════════════════════════════════════════════════════════
        if (structure === 'full') {
            children.push(
                new docx.Paragraph({ spacing: { before: 2500 } }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "MINERVA S.A.", bold: true, size: 36, color: primaryColor })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 300 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "PROCESS DEFINITION DOCUMENT (PDD)", bold: true, size: 26, color: "666666" })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 800 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: projectName, bold: true, size: 52, color: primaryColor })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 500 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "━".repeat(40), color: primaryColor, size: 20 })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 1500 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: `Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, size: 24, color: "666666" })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Versão: 1.0", size: 24, color: "666666" })],
                    alignment: docx.AlignmentType.CENTER
                }),
                new docx.Paragraph({ children: [new docx.PageBreak()] })
            );
        }

        // ═══════════════════════════════════════════════════════════════
        // SUMÁRIO
        // ═══════════════════════════════════════════════════════════════
        if (structure === 'full' || structure === 'standard') {
            children.push(
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "SUMÁRIO", bold: true, size: 34, color: primaryColor })],
                    spacing: { after: 400 },
                    border: { bottom: { color: primaryColor, space: 8, size: 16, style: docx.BorderStyle.SINGLE } }
                }),
                new docx.Paragraph({ spacing: { after: 200 } }),
                new docx.TableOfContents("Sumário", { hyperlink: true, headingStyleRange: "1-3" }),
                new docx.Paragraph({ children: [new docx.PageBreak()] })
            );
        }

        // ═══════════════════════════════════════════════════════════════
        // TÍTULO (se minimal)
        // ═══════════════════════════════════════════════════════════════
        if (structure === 'minimal') {
            children.push(
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: projectName, bold: true, size: 48, color: primaryColor })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 200 },
                    border: { bottom: { color: primaryColor, space: 10, size: 20, style: docx.BorderStyle.SINGLE } }
                }),
                new docx.Paragraph({ spacing: { after: 400 } })
            );
        }

        // ═══════════════════════════════════════════════════════════════
        // CONTEÚDO
        // ═══════════════════════════════════════════════════════════════
        elements.forEach((el, index) => {
            const paragraphs = renderElement(el, primaryColor, index);
            children.push(...paragraphs);
        });

        // ═══════════════════════════════════════════════════════════════
        // RODAPÉ
        // ═══════════════════════════════════════════════════════════════
        const footer = new docx.Footer({
            children: [
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: `Minerva S.A. | ${projectName} | PDD`, size: 18, color: "999999" })
                    ],
                    alignment: docx.AlignmentType.CENTER
                })
            ]
        });

        // ═══════════════════════════════════════════════════════════════
        // DOCUMENTO FINAL
        // ═══════════════════════════════════════════════════════════════
        return new docx.Document({
            styles: {
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
                        run: { size: 32, bold: true, color: primaryColor }
                    },
                    {
                        id: "Heading2",
                        name: "Heading 2",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: { size: 28, bold: true }
                    },
                    {
                        id: "Heading3",
                        name: "Heading 3",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: { size: 24, bold: true, italics: true }
                    }
                ]
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: docx.convertInchesToTwip(0.9),
                            right: docx.convertInchesToTwip(0.9),
                            bottom: docx.convertInchesToTwip(0.9),
                            left: docx.convertInchesToTwip(1.1)
                        }
                    }
                },
                footers: { default: footer },
                children: children
            }]
        });
    }

    /**
     * Renderiza um elemento como parágrafos do Word
     */
    function renderElement(el, primaryColor, index) {
        const paragraphs = [];

        switch (el.type) {
            // ═══════════════════════════════════════════════════════════
            // TÍTULOS
            // ═══════════════════════════════════════════════════════════
            case 'h1':
                paragraphs.push(new docx.Paragraph({
                    children: [new docx.TextRun({ 
                        text: el.fullTitle || el.title, 
                        bold: true, 
                        size: 32, 
                        color: primaryColor 
                    })],
                    heading: docx.HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                    border: {
                        bottom: { color: primaryColor, space: 6, size: 12, style: docx.BorderStyle.SINGLE }
                    }
                }));
                break;

            case 'h2':
                paragraphs.push(new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: "▎ ", color: primaryColor, size: 28 }),
                        new docx.TextRun({ text: el.fullTitle || el.title, bold: true, size: 28, color: "333333" })
                    ],
                    heading: docx.HeadingLevel.HEADING_2,
                    spacing: { before: 320, after: 160 }
                }));
                break;

            case 'h3':
                paragraphs.push(new docx.Paragraph({
                    children: [new docx.TextRun({ 
                        text: el.fullTitle || el.title, 
                        bold: true, 
                        size: 24, 
                        color: "444444",
                        italics: true 
                    })],
                    heading: docx.HeadingLevel.HEADING_3,
                    spacing: { before: 240, after: 120 }
                }));
                break;

            // ═══════════════════════════════════════════════════════════
            // RPA
            // ═══════════════════════════════════════════════════════════
            case 'rpa':
                paragraphs.push(new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: `RPA ${el.number}`, bold: true, size: 32, color: primaryColor }),
                        new docx.TextRun({ text: el.title ? ` - ${el.title}` : '', bold: true, size: 32, color: "333333" })
                    ],
                    heading: docx.HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                    shading: { type: docx.ShadingType.SOLID, color: "FFF5F5" },
                    border: {
                        bottom: { color: primaryColor, space: 6, size: 12, style: docx.BorderStyle.SINGLE }
                    }
                }));
                break;

            // ═══════════════════════════════════════════════════════════
            // CAMPO: VALOR
            // ═══════════════════════════════════════════════════════════
            case 'field':
                paragraphs.push(new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: `${el.key}: `, bold: true, size: 22, color: primaryColor }),
                        new docx.TextRun({ text: el.value, size: 22 })
                    ],
                    spacing: { before: 60, after: 60 }
                }));
                break;

            // ═══════════════════════════════════════════════════════════
            // TABELA
            // ═══════════════════════════════════════════════════════════
            case 'table':
                if (el.headers && el.rows) {
                    const tableRows = [];
                    
                    // Header row
                    tableRows.push(new docx.TableRow({
                        children: el.headers.map(h => new docx.TableCell({
                            children: [new docx.Paragraph({
                                children: [new docx.TextRun({ 
                                    text: h || '', 
                                    bold: true, 
                                    color: "FFFFFF", 
                                    size: 20 
                                })],
                                spacing: { before: 40, after: 40 }
                            })],
                            shading: { type: docx.ShadingType.SOLID, color: primaryColor },
                            verticalAlign: docx.VerticalAlign.CENTER,
                            margins: {
                                top: 60,
                                bottom: 60,
                                left: 80,
                                right: 80
                            }
                        })),
                        tableHeader: true
                    }));

                    // Data rows
                    el.rows.forEach((row, rowIdx) => {
                        tableRows.push(new docx.TableRow({
                            children: row.map(cell => new docx.TableCell({
                                children: [new docx.Paragraph({
                                    children: [new docx.TextRun({ text: cell || '', size: 20 })],
                                    spacing: { before: 30, after: 30 }
                                })],
                                shading: rowIdx % 2 === 0 
                                    ? { type: docx.ShadingType.SOLID, color: "F9F9F9" } 
                                    : undefined,
                                margins: {
                                    top: 40,
                                    bottom: 40,
                                    left: 80,
                                    right: 80
                                }
                            }))
                        }));
                    });

                    paragraphs.push(new docx.Paragraph({ spacing: { before: 150 } }));
                    paragraphs.push(new docx.Table({
                        rows: tableRows,
                        width: { size: 100, type: docx.WidthType.PERCENTAGE }
                    }));
                    paragraphs.push(new docx.Paragraph({ spacing: { after: 150 } }));
                }
                break;

            // ═══════════════════════════════════════════════════════════
            // CÓDIGO
            // ═══════════════════════════════════════════════════════════
            case 'code':
                // Label da linguagem
                paragraphs.push(new docx.Paragraph({
                    children: [new docx.TextRun({ 
                        text: `[${el.language || 'código'}]`, 
                        size: 16, 
                        color: "666666", 
                        italics: true 
                    })],
                    spacing: { before: 150, after: 50 }
                }));

                // Linhas de código
                const codeLines = el.content.split('\n');
                codeLines.forEach(line => {
                    paragraphs.push(new docx.Paragraph({
                        children: [new docx.TextRun({ 
                            text: line || ' ', 
                            font: 'Consolas', 
                            size: 18, 
                            color: "1e1e1e" 
                        })],
                        shading: { type: docx.ShadingType.SOLID, color: "F5F5F5" },
                        spacing: { before: 0, after: 0 },
                        indent: { left: docx.convertInchesToTwip(0.15) }
                    }));
                });

                paragraphs.push(new docx.Paragraph({ spacing: { after: 150 } }));
                break;

            // ═══════════════════════════════════════════════════════════
            // DIAGRAMA ASCII
            // ═══════════════════════════════════════════════════════════
            case 'ascii_diagram':
                const diagramLines = el.content.split('\n');
                diagramLines.forEach(line => {
                    paragraphs.push(new docx.Paragraph({
                        children: [new docx.TextRun({ 
                            text: line || ' ', 
                            font: 'Consolas', 
                            size: 16, 
                            color: "333333" 
                        })],
                        shading: { type: docx.ShadingType.SOLID, color: "F8F9FA" },
                        spacing: { before: 0, after: 0 }
                    }));
                });
                paragraphs.push(new docx.Paragraph({ spacing: { after: 150 } }));
                break;

            // ═══════════════════════════════════════════════════════════
            // LISTAS
            // ═══════════════════════════════════════════════════════════
            case 'bullet':
                paragraphs.push(new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: "• ", color: primaryColor, size: 22 }),
                        new docx.TextRun({ text: el.content, size: 22 })
                    ],
                    spacing: { before: 50, after: 50 },
                    indent: { left: docx.convertInchesToTwip(0.25) }
                }));
                break;

            case 'numbered':
                paragraphs.push(new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: `${el.number}. `, bold: true, color: primaryColor, size: 22 }),
                        new docx.TextRun({ text: el.content, size: 22 })
                    ],
                    spacing: { before: 50, after: 50 },
                    indent: { left: docx.convertInchesToTwip(0.25) }
                }));
                break;

            // ═══════════════════════════════════════════════════════════
            // CHECKLISTS
            // ═══════════════════════════════════════════════════════════
            case 'checklist_yes':
                paragraphs.push(new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: "✓ ", bold: true, color: "28a745", size: 22 }),
                        new docx.TextRun({ text: el.content, size: 22 })
                    ],
                    spacing: { before: 50, after: 50 },
                    indent: { left: docx.convertInchesToTwip(0.25) }
                }));
                break;

            case 'checklist_no':
                paragraphs.push(new docx.Paragraph({
                    children: [
                        new docx.TextRun({ text: "✗ ", bold: true, color: primaryColor, size: 22 }),
                        new docx.TextRun({ text: el.content, size: 22 })
                    ],
                    spacing: { before: 50, after: 50 },
                    indent: { left: docx.convertInchesToTwip(0.25) }
                }));
                break;

            // ═══════════════════════════════════════════════════════════
            // LEGENDA
            // ═══════════════════════════════════════════════════════════
            case 'legend':
                paragraphs.push(new docx.Paragraph({
                    children: [new docx.TextRun({ 
                        text: el.content, 
                        size: 18, 
                        color: "666666",
                        italics: true 
                    })],
                    spacing: { before: 80, after: 80 }
                }));
                break;

            // ═══════════════════════════════════════════════════════════
            // SEPARADOR
            // ═══════════════════════════════════════════════════════════
            case 'separator':
                paragraphs.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: "─".repeat(60), color: "CCCCCC" })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { before: 150, after: 150 }
                }));
                break;

            // ═══════════════════════════════════════════════════════════
            // PARÁGRAFO
            // ═══════════════════════════════════════════════════════════
            case 'paragraph':
                paragraphs.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: el.content, size: 22 })],
                    spacing: { before: 80, after: 80 },
                    alignment: docx.AlignmentType.JUSTIFIED
                }));
                break;
        }

        return paragraphs;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        generate: generate,
        THEMES: THEMES
    };

})();

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocGenerator;
}
