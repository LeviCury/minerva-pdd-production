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
            mermaid += `    ${code.replace(/-/g, '')}["${code}<br/>${sanitize(shortName)}"]:::rpa\n`;
        });

        // Output final
        mermaid += `    OUTPUT[("📤 Output Final")]:::output\n\n`;

        // Conexões
        mermaid += `    TRIGGER --> ${rpas[0].codigo?.replace(/-/g, '') || 'RPA001'}\n`;
        
        for (let i = 0; i < rpas.length - 1; i++) {
            const current = rpas[i].codigo?.replace(/-/g, '') || `RPA${(i+1).toString().padStart(3, '0')}`;
            const next = rpas[i+1].codigo?.replace(/-/g, '') || `RPA${(i+2).toString().padStart(3, '0')}`;
            mermaid += `    ${current} --> ${next}\n`;
        }
        
        const lastRpa = rpas[rpas.length - 1].codigo?.replace(/-/g, '') || `RPA${rpas.length.toString().padStart(3, '0')}`;
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
        mermaid += `    INPUT[/"${sanitize(truncate(entrada, 30))}"/]:::io\n`;

        // Passos do fluxo
        if (rpa.fluxo_execucao && rpa.fluxo_execucao.length > 0) {
            rpa.fluxo_execucao.forEach((passo, i) => {
                const acao = typeof passo === 'string' ? passo : (passo.titulo || passo.acao || passo.descricao || `Passo ${i+1}`);
                mermaid += `    STEP${i+1}["${i+1}. ${sanitize(truncate(acao, 35))}"]:::step\n`;
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
        const saida = rpa.saida?.dados?.join(', ') || 'Dados de saida';
        mermaid += `    OUTPUT[/"${sanitize(truncate(saida, 30))}"/]:::io\n`;

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
                mermaid += `        ${code.replace(/-/g, '')}["${code}<br/>${sanitize(truncate(name, 20))}"]:::rpa\n`;
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
            
            [...allSystems].forEach((sys, i) => {
                if (sys) {
                    const sysId = `SYS${i}`;
                    mermaid += `        ${sysId}["${sanitize(sys)}"]:::system\n`;
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
                const rpaId = (rpa.codigo || `RPA${(i+1).toString().padStart(3, '0')}`).replace(/-/g, '');
                if (rpa.sistemas_utilizados?.length > 0) {
                    rpa.sistemas_utilizados.forEach((sys, j) => {
                        const allSysList = [...new Set([...sistemas, ...integracoes.map(x => x.sistema_externo)])];
                        const sysIndex = allSysList.indexOf(sys);
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
                const rpaId = (rpa.codigo || `RPA${(i+1).toString().padStart(3, '0')}`).replace(/-/g, '');
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
            const sysId = safeId(sys);
            mermaid += `    participant ${sysId} as ${sanitize(sys)}\n`;
        });
        
        mermaid += '\n';

        // Interações
        pddData.integracoes.forEach(int => {
            if (int.sistema_externo) {
                const sysId = safeId(int.sistema_externo);
                const proposito = sanitize(truncate(int.proposito || 'Integração', 30));
                
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
            // Cronograma padrão com data dinâmica
            const today = new Date().toISOString().split('T')[0];
            return {
                type: 'timeline',
                title: 'Cronograma do Projeto',
                mermaid: `gantt
    title Cronograma do Projeto
    dateFormat YYYY-MM-DD
    section Desenvolvimento
        Desenvolvimento     :a1, ${today}, 30d
    section Testes
        Testes Integrados   :a2, after a1, 14d
    section Homologacao
        UAT                 :a3, after a2, 14d
    section Implantacao
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
            
            const faseName = sanitize(fase.fase || `Fase ${i+1}`);
            mermaid += `    section ${faseName}\n`;
            
            if (i === 0) {
                const today = new Date().toISOString().split('T')[0];
                mermaid += `        ${faseName}     :${taskId}, ${today}, ${duracao}d\n`;
            } else {
                mermaid += `        ${faseName}     :${taskId}, after ${lastTask}, ${duracao}d\n`;
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

    /**
     * Sanitiza texto para uso em diagramas Mermaid
     * Remove caracteres que quebram a sintaxe Mermaid
     */
    function sanitize(text) {
        if (!text) return '';
        return text
            .replace(/"/g, "'")        // Aspas duplas -> simples
            .replace(/[[\](){}]/g, '')  // Remove colchetes/parênteses/chaves
            .replace(/[<>]/g, '')       // Remove < >
            .replace(/[#;]/g, '')       // Remove # e ;
            .replace(/\n/g, ' ')        // Newlines -> espaço
            .replace(/\s+/g, ' ')       // Múltiplos espaços -> um
            .trim();
    }

    /**
     * Gera ID seguro para Mermaid a partir de texto
     */
    function safeId(text) {
        if (!text) return 'UNKNOWN';
        return text.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || 'UNKNOWN';
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

        console.log('Gerando diagramas a partir do PDD...');

        // Fluxo dos RPAs
        const rpaFlow = generateRPAFlowDiagram(pddData.rpas);
        if (rpaFlow) {
            diagrams.push(rpaFlow);
            console.log('  + Fluxo dos RPAs');
        }

        // Arquitetura
        const architecture = generateArchitectureDiagram(pddData);
        if (architecture) {
            diagrams.push(architecture);
            console.log('  + Arquitetura');
        }

        // Sequência de integrações
        const integrationSeq = generateIntegrationSequence(pddData);
        if (integrationSeq) {
            diagrams.push(integrationSeq);
            console.log('  + Sequência de Integrações');
        }

        // Timeline
        const timeline = generateTimelineDiagram(pddData.cronograma_sugerido);
        if (timeline) {
            diagrams.push(timeline);
            console.log('  + Timeline/Cronograma');
        }

        // Detalhes de cada RPA
        if (pddData.rpas) {
            pddData.rpas.forEach((rpa, i) => {
                const rpaDetail = generateRPADetailDiagram(rpa, i);
                if (rpaDetail) {
                    diagrams.push(rpaDetail);
                    console.log(`  + Detalhe RPA-${String(i + 1).padStart(3, '0')}`);
                }
            });
        }

        console.log(`Total de diagramas gerados: ${diagrams.length}`);
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
        let tempContainer = null;
        
        try {
            // Criar container temporário visível (necessário para getBBox funcionar corretamente)
            tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '1200px';
            tempContainer.style.height = 'auto';
            tempContainer.style.background = 'white';
            tempContainer.style.zIndex = '-1';
            document.body.appendChild(tempContainer);

            // Renderizar o diagrama com ID único
            const id = `temp-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const { svg } = await mermaid.render(id, mermaidCode);
            tempContainer.innerHTML = svg;

            // Aguardar um frame para garantir renderização
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const svgElement = tempContainer.querySelector('svg');
            if (!svgElement) {
                throw new Error('SVG não encontrado após renderização');
            }

            // Obter dimensões de várias formas (fallback)
            let svgWidth, svgHeight;
            
            try {
                const bbox = svgElement.getBBox();
                svgWidth = bbox.width || 800;
                svgHeight = bbox.height || 400;
            } catch (bboxError) {
                // Fallback para viewBox ou atributos
                const viewBox = svgElement.getAttribute('viewBox');
                if (viewBox) {
                    const [, , w, h] = viewBox.split(' ').map(Number);
                    svgWidth = w || 800;
                    svgHeight = h || 400;
                } else {
                    svgWidth = parseFloat(svgElement.getAttribute('width')) || 800;
                    svgHeight = parseFloat(svgElement.getAttribute('height')) || 400;
                }
            }

            // Garantir dimensões mínimas
            svgWidth = Math.max(svgWidth, 200);
            svgHeight = Math.max(svgHeight, 100);

            // Criar canvas
            const canvas = document.createElement('canvas');
            const scale = width / svgWidth;
            canvas.width = Math.round(width);
            canvas.height = Math.round(svgHeight * scale);
            const ctx = canvas.getContext('2d');

            // Fundo branco
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Preparar SVG para conversão
            // Garantir que o SVG tenha dimensões explícitas
            svgElement.setAttribute('width', svgWidth);
            svgElement.setAttribute('height', svgHeight);
            
            // Serializar SVG
            const svgData = new XMLSerializer().serializeToString(svgElement);
            
            // Usar base64 diretamente (mais confiável que blob URL)
            const base64Svg = btoa(unescape(encodeURIComponent(svgData)));
            const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

            // Converter para PNG via Image
            return new Promise((resolve) => {
                const img = new Image();
                
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Limpar container
                    if (tempContainer && tempContainer.parentNode) {
                        document.body.removeChild(tempContainer);
                    }
                    
                    // Retornar base64
                    const base64 = canvas.toDataURL('image/png').split(',')[1];
                    resolve({
                        base64: base64,
                        width: canvas.width,
                        height: canvas.height
                    });
                };
                
                img.onerror = (e) => {
                    console.error('Erro ao carregar imagem SVG:', e);
                    if (tempContainer && tempContainer.parentNode) {
                        document.body.removeChild(tempContainer);
                    }
                    resolve(null);
                };
                
                img.src = dataUrl;
            });

        } catch (e) {
            console.error('Erro ao renderizar diagrama:', e);
            if (tempContainer && tempContainer.parentNode) {
                document.body.removeChild(tempContainer);
            }
            return null;
        }
    }

    /**
     * Renderiza todos os diagramas como base64 para o Word
     * Com timeout para evitar travamento
     */
    async function renderAllForWord(pddData) {
        // Verificar se mermaid está disponível
        if (typeof mermaid === 'undefined') {
            console.warn('Mermaid não está carregado, pulando diagramas');
            return [];
        }

        const diagrams = generateAllDiagrams(pddData);
        const rendered = [];

        console.log(`Gerando ${diagrams.length} diagramas para o Word...`);

        // Processar diagramas um por um com pausa entre eles
        for (let i = 0; i < diagrams.length; i++) {
            const diagram = diagrams[i];
            
            try {
                console.log(`[${i + 1}/${diagrams.length}] Renderizando: ${diagram.title}...`);
                
                // Timeout maior para diagramas complexos (gantt, flowchart)
                const timeout = diagram.type === 'timeline' ? 20000 : 15000;
                
                const result = await Promise.race([
                    renderToBase64(diagram.mermaid, 650),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error(`Timeout após ${timeout/1000}s`)), timeout)
                    )
                ]);
                
                if (result) {
                    rendered.push({
                        title: diagram.title,
                        type: diagram.type,
                        description: diagram.description || '',
                        ...result
                    });
                    console.log(`✓ [${i + 1}/${diagrams.length}] Sucesso: ${diagram.title}`);
                } else {
                    console.warn(`✗ [${i + 1}/${diagrams.length}] Resultado nulo: ${diagram.title}`);
                }
                
                // Pequena pausa entre diagramas para evitar sobrecarga do browser
                if (i < diagrams.length - 1) {
                    await new Promise(r => setTimeout(r, 300));
                }
                
            } catch (e) {
                console.warn(`✗ [${i + 1}/${diagrams.length}] Erro em ${diagram.title}:`, e.message);
                // Continua para o próximo diagrama
            }
        }

        console.log(`═══ Total de diagramas renderizados: ${rendered.length}/${diagrams.length} ═══`);
        return rendered;
    }

    /**
     * Exporta um diagrama como PNG - versão simplificada e rápida
     */
    async function exportSingleAsPNG(container, filename) {
        const svg = container.querySelector('svg');
        if (!svg) return false;

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width * 2;
                    canvas.height = img.height * 2;
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    
                    URL.revokeObjectURL(url);
                    resolve(true);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(false);
                };
                img.src = url;
            });
        } catch (e) {
            console.error('Erro ao exportar PNG:', e);
            return false;
        }
    }

    /**
     * Exporta todos os diagramas visíveis como PDF
     */
    async function exportAllAsPDF(projectName = 'PDD') {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF não carregado');
            return false;
        }

        const { jsPDF } = jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
        
        const containers = document.querySelectorAll('[id^="diagram-"]');
        if (containers.length === 0) return false;

        let firstPage = true;

        for (const container of containers) {
            const svg = container.querySelector('svg');
            if (!svg) continue;

            if (!firstPage) {
                pdf.addPage();
            }
            firstPage = false;

            try {
                // Converter SVG para canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const svgData = new XMLSerializer().serializeToString(svg);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        canvas.width = img.width * 2;
                        canvas.height = img.height * 2;
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // Adicionar ao PDF
                        const imgData = canvas.toDataURL('image/png');
                        const pdfWidth = 280; // A4 landscape width - margins
                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                        
                        // Título
                        const title = container.closest('.diagram-card')?.querySelector('h3')?.textContent || 'Diagrama';
                        pdf.setFontSize(14);
                        pdf.text(title, 15, 15);
                        
                        // Imagem
                        const maxHeight = 180;
                        const finalHeight = Math.min(pdfHeight, maxHeight);
                        const finalWidth = (finalHeight / pdfHeight) * pdfWidth;
                        
                        pdf.addImage(imgData, 'PNG', 15, 25, finalWidth, finalHeight);
                        
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.src = url;
                });
            } catch (e) {
                console.warn('Erro ao adicionar diagrama ao PDF:', e);
            }
        }

        // Salvar PDF
        pdf.save(`Diagramas_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        return true;
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
        // Funções para Word/Export
        renderToBase64,
        renderAllForWord,
        exportSingleAsPNG,
        exportAllAsPDF,
        downloadImage
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagramGenerator;
}
