/**
 * MINERVA PDD GENERATOR - Diagram Generator Module
 * Gera diagramas Mermaid automaticamente a partir dos dados do PDD
 */

const DiagramGenerator = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // GERADOR DE FLUXO DOS RPAs
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Gera diagrama de fluxo entre RPAs
     */
    function generateRPAFlowDiagram(rpas) {
        if (!rpas || rpas.length === 0) {
            return null;
        }

        let mermaid = 'flowchart LR\n';
        mermaid += '    %% Estilo\n';
        mermaid += '    classDef rpa fill:#C41E3A,stroke:#8B0000,color:#fff,stroke-width:2px\n';
        mermaid += '    classDef trigger fill:#17a2b8,stroke:#138496,color:#fff\n';
        mermaid += '    classDef output fill:#28a745,stroke:#1e7e34,color:#fff\n\n';

        // Trigger inicial
        const firstRpa = rpas[0];
        const triggerType = firstRpa.trigger?.tipo || 'MANUAL';
        const triggerIcon = getTriggerIcon(triggerType);
        
        mermaid += `    TRIGGER[("${triggerIcon} ${triggerType}")]:::trigger\n`;
        
        // Nós dos RPAs
        rpas.forEach((rpa, i) => {
            const code = rpa.codigo || `RPA-${(i+1).toString().padStart(3, '0')}`;
            const name = rpa.nome || `RPA ${i + 1}`;
            const shortName = name.length > 25 ? name.substring(0, 22) + '...' : name;
            mermaid += `    ${code.replace('-', '')}["🤖 ${code}<br/>${shortName}"]:::rpa\n`;
        });

        // Output final
        mermaid += `    OUTPUT[("📤 Output Final")]:::output\n\n`;

        // Conexões
        mermaid += `    TRIGGER --> ${rpas[0].codigo?.replace('-', '') || 'RPA001'}\n`;
        
        for (let i = 0; i < rpas.length - 1; i++) {
            const current = rpas[i].codigo?.replace('-', '') || `RPA${(i+1).toString().padStart(3, '0')}`;
            const next = rpas[i+1].codigo?.replace('-', '') || `RPA${(i+2).toString().padStart(3, '0')}`;
            mermaid += `    ${current} --> ${next}\n`;
        }
        
        const lastRpa = rpas[rpas.length - 1].codigo?.replace('-', '') || `RPA${rpas.length.toString().padStart(3, '0')}`;
        mermaid += `    ${lastRpa} --> OUTPUT\n`;

        return {
            type: 'rpa-flow',
            title: 'Fluxo dos RPAs',
            mermaid: mermaid
        };
    }

    /**
     * Gera diagrama detalhado de um RPA específico
     */
    function generateRPADetailDiagram(rpa, index) {
        if (!rpa) return null;

        const code = rpa.codigo || `RPA-${(index+1).toString().padStart(3, '0')}`;
        let mermaid = 'flowchart TD\n';
        mermaid += '    classDef step fill:#fff,stroke:#C41E3A,stroke-width:2px\n';
        mermaid += '    classDef decision fill:#ffc107,stroke:#e0a800,color:#000\n';
        mermaid += '    classDef io fill:#17a2b8,stroke:#138496,color:#fff\n\n';

        // Entrada
        const entrada = rpa.entrada?.dados?.join(', ') || 'Dados de entrada';
        mermaid += `    INPUT[/"📥 ${truncate(entrada, 30)}"/]:::io\n`;

        // Passos do fluxo
        if (rpa.fluxo_execucao && rpa.fluxo_execucao.length > 0) {
            rpa.fluxo_execucao.forEach((passo, i) => {
                const acao = typeof passo === 'string' ? passo : (passo.acao || passo.descricao || `Passo ${i+1}`);
                mermaid += `    STEP${i+1}["${i+1}. ${truncate(acao, 35)}"]:::step\n`;
            });

            // Conexões
            mermaid += `\n    INPUT --> STEP1\n`;
            for (let i = 1; i < rpa.fluxo_execucao.length; i++) {
                mermaid += `    STEP${i} --> STEP${i+1}\n`;
            }
            mermaid += `    STEP${rpa.fluxo_execucao.length} --> OUTPUT\n`;
        } else {
            mermaid += `    PROCESS["⚙️ Processamento"]:::step\n`;
            mermaid += `\n    INPUT --> PROCESS\n`;
            mermaid += `    PROCESS --> OUTPUT\n`;
        }

        // Saída
        const saida = rpa.saida?.dados?.join(', ') || 'Dados de saída';
        mermaid += `    OUTPUT[/"📤 ${truncate(saida, 30)}"/]:::io\n`;

        // Tratamento de exceção (se houver)
        if (rpa.excecoes && rpa.excecoes.length > 0) {
            mermaid += `    ERROR{{"⚠️ Exceção"}}:::decision\n`;
            mermaid += `    HANDLE["🔧 Tratamento"]:::step\n`;
            const lastStep = rpa.fluxo_execucao?.length || 1;
            mermaid += `    STEP${lastStep} -.->|erro| ERROR\n`;
            mermaid += `    ERROR --> HANDLE\n`;
        }

        return {
            type: 'rpa-detail',
            title: `Fluxo Detalhado: ${code}`,
            mermaid: mermaid
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GERADOR DE ARQUITETURA
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Gera diagrama de arquitetura do sistema
     */
    function generateArchitectureDiagram(pddData) {
        let mermaid = 'flowchart TB\n';
        mermaid += '    classDef rpa fill:#C41E3A,stroke:#8B0000,color:#fff\n';
        mermaid += '    classDef system fill:#3498db,stroke:#2980b9,color:#fff\n';
        mermaid += '    classDef database fill:#27ae60,stroke:#1e8449,color:#fff\n';
        mermaid += '    classDef server fill:#9b59b6,stroke:#8e44ad,color:#fff\n\n';

        // Subgraph de RPAs
        mermaid += '    subgraph RPAS["🤖 Camada de Automação"]\n';
        if (pddData.rpas && pddData.rpas.length > 0) {
            pddData.rpas.forEach((rpa, i) => {
                const code = rpa.codigo || `RPA${(i+1).toString().padStart(3, '0')}`;
                const name = rpa.nome || `RPA ${i+1}`;
                mermaid += `        ${code.replace('-', '')}["${code}<br/>${truncate(name, 20)}"]:::rpa\n`;
            });
        }
        mermaid += '    end\n\n';

        // Sistemas externos
        const sistemas = pddData.projeto?.sistemas_envolvidos || [];
        const integracoes = pddData.integracoes || [];
        
        if (sistemas.length > 0 || integracoes.length > 0) {
            mermaid += '    subgraph SYSTEMS["💻 Sistemas Integrados"]\n';
            
            const allSystems = new Set([
                ...sistemas,
                ...integracoes.map(i => i.sistema_externo).filter(Boolean)
            ]);
            
            allSystems.forEach((sys, i) => {
                if (sys) {
                    const sysId = `SYS${i}`;
                    mermaid += `        ${sysId}["${sys}"]:::system\n`;
                }
            });
            mermaid += '    end\n\n';
        }

        // Bancos de dados
        const bancos = pddData.infraestrutura?.bancos_dados || [];
        if (bancos.length > 0) {
            mermaid += '    subgraph DBS["🗄️ Bancos de Dados"]\n';
            bancos.forEach((db, i) => {
                const dbId = `DB${i}`;
                mermaid += `        ${dbId}[("${db.nome}<br/>@${db.servidor || 'server'}")]:::database\n`;
            });
            mermaid += '    end\n\n';
        }

        // Conexões
        mermaid += '    %% Conexões\n';
        
        // RPAs para sistemas
        if (pddData.rpas && sistemas.length > 0) {
            pddData.rpas.forEach((rpa, i) => {
                const rpaId = (rpa.codigo || `RPA${(i+1).toString().padStart(3, '0')}`).replace('-', '');
                if (rpa.sistemas_utilizados?.length > 0) {
                    rpa.sistemas_utilizados.forEach((sys, j) => {
                        const sysIndex = [...new Set([...sistemas, ...integracoes.map(i => i.sistema_externo)])].indexOf(sys);
                        if (sysIndex >= 0) {
                            mermaid += `    ${rpaId} <--> SYS${sysIndex}\n`;
                        }
                    });
                } else if (i === 0) {
                    mermaid += `    ${rpaId} <--> SYS0\n`;
                }
            });
        }

        // RPAs para bancos
        if (pddData.rpas && bancos.length > 0) {
            pddData.rpas.forEach((rpa, i) => {
                const rpaId = (rpa.codigo || `RPA${(i+1).toString().padStart(3, '0')}`).replace('-', '');
                mermaid += `    ${rpaId} <-.-> DB${i % bancos.length}\n`;
            });
        }

        return {
            type: 'architecture',
            title: 'Arquitetura da Solução',
            mermaid: mermaid
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GERADOR DE SEQUÊNCIA DE INTEGRAÇÕES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Gera diagrama de sequência das integrações
     */
    function generateIntegrationSequence(pddData) {
        if (!pddData.integracoes || pddData.integracoes.length === 0) {
            return null;
        }

        let mermaid = 'sequenceDiagram\n';
        mermaid += '    autonumber\n';
        
        // Participantes
        mermaid += '    participant RPA as 🤖 RPA\n';
        
        const sistemas = new Set();
        pddData.integracoes.forEach(int => {
            if (int.sistema_externo) {
                sistemas.add(int.sistema_externo);
            }
        });
        
        sistemas.forEach(sys => {
            const sysId = sys.replace(/[^a-zA-Z0-9]/g, '');
            mermaid += `    participant ${sysId} as 💻 ${sys}\n`;
        });
        
        mermaid += '\n';

        // Interações
        pddData.integracoes.forEach(int => {
            if (int.sistema_externo) {
                const sysId = int.sistema_externo.replace(/[^a-zA-Z0-9]/g, '');
                const proposito = truncate(int.proposito || 'Integração', 30);
                
                if (int.direcao === 'ENTRADA') {
                    mermaid += `    ${sysId}->>RPA: ${proposito}\n`;
                } else if (int.direcao === 'SAIDA') {
                    mermaid += `    RPA->>+${sysId}: ${proposito}\n`;
                    mermaid += `    ${sysId}-->>-RPA: Confirmação\n`;
                } else {
                    mermaid += `    RPA->>+${sysId}: ${proposito}\n`;
                    mermaid += `    ${sysId}-->>-RPA: Resposta\n`;
                }
            }
        });

        return {
            type: 'integration-sequence',
            title: 'Sequência de Integrações',
            mermaid: mermaid
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GERADOR DE TIMELINE/CRONOGRAMA
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Gera diagrama de timeline do cronograma
     */
    function generateTimelineDiagram(cronograma) {
        if (!cronograma?.fases || cronograma.fases.length === 0) {
            // Cronograma padrão
            return {
                type: 'timeline',
                title: 'Cronograma do Projeto',
                mermaid: `gantt
    title Cronograma do Projeto
    dateFormat YYYY-MM-DD
    section Desenvolvimento
        Desenvolvimento     :a1, 2024-01-01, 30d
    section Testes
        Testes Integrados   :a2, after a1, 14d
    section Homologação
        UAT                 :a3, after a2, 14d
    section Implantação
        Go-live             :a4, after a3, 7d`
            };
        }

        let mermaid = 'gantt\n';
        mermaid += '    title Cronograma do Projeto\n';
        mermaid += '    dateFormat YYYY-MM-DD\n';
        
        let lastTask = null;
        cronograma.fases.forEach((fase, i) => {
            const taskId = `task${i}`;
            const duracao = parseDuration(fase.duracao_estimada);
            
            mermaid += `    section ${fase.fase}\n`;
            
            if (i === 0) {
                mermaid += `        ${fase.fase}     :${taskId}, 2024-01-01, ${duracao}d\n`;
            } else {
                mermaid += `        ${fase.fase}     :${taskId}, after ${lastTask}, ${duracao}d\n`;
            }
            
            lastTask = taskId;
        });

        return {
            type: 'timeline',
            title: 'Cronograma do Projeto',
            mermaid: mermaid
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function getTriggerIcon(tipo) {
        const icons = {
            'EMAIL': '📧',
            'AGENDAMENTO': '⏰',
            'MANUAL': '👆',
            'EVENTO': '⚡',
            'API': '🔌'
        };
        return icons[tipo] || '▶️';
    }

    function truncate(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    function parseDuration(duracao) {
        if (!duracao) return 14;
        
        const match = duracao.match(/(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (duracao.toLowerCase().includes('semana')) {
                return num * 7;
            }
            if (duracao.toLowerCase().includes('mês') || duracao.toLowerCase().includes('mes')) {
                return num * 30;
            }
            return num;
        }
        return 14;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GERADOR PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Gera todos os diagramas possíveis para o PDD
     */
    function generateAllDiagrams(pddData) {
        const diagrams = [];

        // Fluxo dos RPAs
        const rpaFlow = generateRPAFlowDiagram(pddData.rpas);
        if (rpaFlow) diagrams.push(rpaFlow);

        // Arquitetura
        const architecture = generateArchitectureDiagram(pddData);
        if (architecture) diagrams.push(architecture);

        // Sequência de integrações
        const integrationSeq = generateIntegrationSequence(pddData);
        if (integrationSeq) diagrams.push(integrationSeq);

        // Timeline
        const timeline = generateTimelineDiagram(pddData.cronograma_sugerido);
        if (timeline) diagrams.push(timeline);

        // Detalhes de cada RPA
        if (pddData.rpas) {
            pddData.rpas.forEach((rpa, i) => {
                const rpaDetail = generateRPADetailDiagram(rpa, i);
                if (rpaDetail) diagrams.push(rpaDetail);
            });
        }

        return diagrams;
    }

    /**
     * Renderiza um diagrama Mermaid em um elemento
     */
    async function renderDiagram(container, mermaidCode, id) {
        if (typeof mermaid === 'undefined') {
            console.error('Mermaid.js não está carregado');
            return false;
        }

        try {
            const { svg } = await mermaid.render(id || `diagram-${Date.now()}`, mermaidCode);
            container.innerHTML = svg;
            return true;
        } catch (e) {
            console.error('Erro ao renderizar diagrama:', e);
            container.innerHTML = `<pre class="mermaid-error">${mermaidCode}</pre>`;
            return false;
        }
    }

    /**
     * Exporta diagrama como SVG
     */
    function exportAsSVG(container) {
        const svg = container.querySelector('svg');
        if (!svg) return null;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        return URL.createObjectURL(blob);
    }

    /**
     * Exporta diagrama como PNG
     */
    async function exportAsPNG(container, width = 1200) {
        const svg = container.querySelector('svg');
        if (!svg) return null;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        return new Promise((resolve) => {
            img.onload = () => {
                canvas.width = width;
                canvas.height = (width / img.width) * img.height;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDERIZAÇÃO PARA WORD/EXPORTAÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Renderiza um diagrama e retorna como base64 PNG
     * Para uso no Word document
     */
    async function renderToBase64(mermaidCode, width = 800) {
        return new Promise(async (resolve, reject) => {
            try {
                // Criar container temporário
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'absolute';
                tempContainer.style.left = '-9999px';
                tempContainer.style.top = '-9999px';
                document.body.appendChild(tempContainer);

                // Renderizar o diagrama
                const id = `temp-diagram-${Date.now()}`;
                const { svg } = await mermaid.render(id, mermaidCode);
                tempContainer.innerHTML = svg;

                const svgElement = tempContainer.querySelector('svg');
                if (!svgElement) {
                    document.body.removeChild(tempContainer);
                    resolve(null);
                    return;
                }

                // Obter dimensões
                const bbox = svgElement.getBBox();
                const svgWidth = bbox.width || 800;
                const svgHeight = bbox.height || 400;

                // Criar canvas
                const canvas = document.createElement('canvas');
                const scale = width / svgWidth;
                canvas.width = width;
                canvas.height = svgHeight * scale;
                const ctx = canvas.getContext('2d');

                // Fundo branco
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Converter SVG para imagem
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(url);
                    document.body.removeChild(tempContainer);
                    
                    // Retornar base64
                    const base64 = canvas.toDataURL('image/png').split(',')[1];
                    resolve({
                        base64: base64,
                        width: canvas.width,
                        height: canvas.height
                    });
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    document.body.removeChild(tempContainer);
                    resolve(null);
                };
                img.src = url;

            } catch (e) {
                console.error('Erro ao renderizar diagrama:', e);
                resolve(null);
            }
        });
    }

    /**
     * Renderiza todos os diagramas como base64 para o Word
     */
    async function renderAllForWord(pddData) {
        const diagrams = generateAllDiagrams(pddData);
        const rendered = [];

        for (const diagram of diagrams) {
            try {
                const result = await renderToBase64(diagram.mermaid, 700);
                if (result) {
                    rendered.push({
                        title: diagram.title,
                        type: diagram.type,
                        ...result
                    });
                }
            } catch (e) {
                console.warn(`Não foi possível renderizar: ${diagram.title}`, e);
            }
        }

        return rendered;
    }

    /**
     * Exporta todos os diagramas como um ZIP de PNGs
     */
    async function exportAllAsPNG(pddData, projectName = 'PDD') {
        const diagrams = generateAllDiagrams(pddData);
        const images = [];

        for (let i = 0; i < diagrams.length; i++) {
            const diagram = diagrams[i];
            try {
                const result = await renderToBase64(diagram.mermaid, 1200);
                if (result) {
                    images.push({
                        name: `${i + 1}_${diagram.type}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
                        title: diagram.title,
                        data: result.base64
                    });
                }
            } catch (e) {
                console.warn(`Erro ao exportar: ${diagram.title}`, e);
            }
        }

        return images;
    }

    /**
     * Download de uma imagem específica
     */
    function downloadImage(base64Data, filename) {
        const link = document.createElement('a');
        link.href = 'data:image/png;base64,' + base64Data;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        generateAllDiagrams,
        generateRPAFlowDiagram,
        generateRPADetailDiagram,
        generateArchitectureDiagram,
        generateIntegrationSequence,
        generateTimelineDiagram,
        renderDiagram,
        exportAsSVG,
        exportAsPNG,
        // Novas funções para Word/Export
        renderToBase64,
        renderAllForWord,
        exportAllAsPNG,
        downloadImage
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagramGenerator;
}
