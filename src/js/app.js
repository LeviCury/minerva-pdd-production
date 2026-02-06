/**
 * MINERVA PDD GENERATOR - Main Application v3.0
 * Agente Construtor de PDD com Detecção Inteligente de Lacunas
 */

const App = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // ESTADO DA APLICAÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    let state = {
        apiKey: '',
        rawText: '',
        pddData: null,
        isAnalyzing: false,
        pendingGaps: [],
        additionalContext: '',
        attachedImages: []  // Array de {file, base64, name}
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        // Configurar Maia como provider único
        setTimeout(() => {
            if (AIAnalyzer.setProvider) {
                AIAnalyzer.setProvider('maia');
            }
            showApiStatus(true, 'Maia (GPT-5.2)');
            console.log('Minerva PDD: Usando Maia (GPT-5.2) como provider');
        }, 100);

        // Event listeners
        document.getElementById('projectText')?.addEventListener('input', updateStats);
        
        // Fechar modais ao clicar fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeAllModals();
            });
        });
        
        // Tecla ESC fecha modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllModals();
        });
        
        updateStats();
        console.log('Minerva PDD Generator v3.0 - Agente Construtor Inteligente');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API KEY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function saveApiKey() {
        const key = document.getElementById('apiKey')?.value?.trim() || '';
        state.apiKey = key;
        if (key) {
            localStorage.setItem('minerva_openai_key', key);
            showApiStatus(true);
            showToast('API Key salva!', 'success');
        } else {
            localStorage.removeItem('minerva_openai_key');
            showApiStatus(false);
        }
    }

    /**
     * Altera o provider de IA (OpenAI ou Maia)
     */
    function changeProvider(provider) {
        const apiKeyInput = document.getElementById('apiKey');
        const providerSelect = document.getElementById('aiProvider');
        
        if (AIAnalyzer.setProvider) {
            AIAnalyzer.setProvider(provider);
        }
        
        // Salvar preferência
        localStorage.setItem('minerva_ai_provider', provider);
        
        if (provider === 'maia') {
            // Maia: esconder campo de API key
            if (apiKeyInput) apiKeyInput.style.display = 'none';
            showApiStatus(true, 'Maia (GPT-5.2)');
            showToast('🚀 Usando Maia com GPT-5.2', 'success');
        } else {
            // OpenAI: mostrar campo de API key
            if (apiKeyInput) apiKeyInput.style.display = 'block';
            if (state.apiKey) {
                showApiStatus(true, 'OpenAI (GPT-4o)');
            } else {
                showApiStatus(false);
                showToast('Configure sua API Key da OpenAI', 'warning');
            }
        }
    }

    /**
     * Carrega provider salvo
     */
    function loadSavedProvider() {
        const savedProvider = localStorage.getItem('minerva_ai_provider') || 'maia';
        const providerSelect = document.getElementById('aiProvider');
        
        if (providerSelect) {
            providerSelect.value = savedProvider;
        }
        
        changeProvider(savedProvider);
    }

    function showApiStatus(connected, providerName = '') {
        const indicator = document.getElementById('apiStatus');
        if (indicator) {
            indicator.className = `api-status ${connected ? 'connected' : ''}`;
            if (connected && providerName) {
                indicator.title = `✅ Conectado: ${providerName}`;
            } else if (connected) {
                indicator.title = '✅ IA Conectada';
            } else {
                indicator.title = '❌ IA Desconectada - Configure a API Key';
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GESTÃO DE IMAGENS ANEXADAS
    // ═══════════════════════════════════════════════════════════════════════════

    async function handleImageUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                showToast(`${file.name} não é uma imagem válida`, 'error');
                continue;
            }

            // Limitar tamanho (max 5MB por imagem)
            if (file.size > 5 * 1024 * 1024) {
                showToast(`${file.name} é muito grande (máx 5MB)`, 'error');
                continue;
            }

            try {
                const base64 = await fileToBase64(file);
                state.attachedImages.push({
                    file: file,
                    base64: base64,
                    name: file.name
                });
            } catch (err) {
                showToast(`Erro ao processar ${file.name}`, 'error');
            }
        }

        updateImagePreview();
        event.target.value = ''; // Reset input para permitir re-upload do mesmo arquivo
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function removeImage(index) {
        state.attachedImages.splice(index, 1);
        updateImagePreview();
    }

    function updateImagePreview() {
        const preview = document.getElementById('imagePreview');
        const countSpan = document.getElementById('attachmentCount');
        
        if (!preview) return;

        const count = state.attachedImages.length;
        
        // Atualizar contador
        if (countSpan) {
            countSpan.textContent = count === 0 
                ? 'Nenhuma imagem anexada' 
                : `${count} imagem${count > 1 ? 's' : ''} anexada${count > 1 ? 's' : ''}`;
        }

        // Gerar preview
        preview.innerHTML = state.attachedImages.map((img, i) => `
            <div class="attachment-item" title="${img.name}">
                <img src="${img.base64}" alt="${img.name}">
                <button class="remove-btn" onclick="App.removeImage(${i})">×</button>
            </div>
        `).join('');
    }

    function getAttachedImagesForAPI() {
        return state.attachedImages.map(img => ({
            type: 'image_url',
            image_url: {
                url: img.base64,
                detail: 'high'
            }
        }));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast show ${type}`;
            setTimeout(() => toast.classList.remove('show'), 4000);
        }
    }

    function showLoading(title, subtitle) {
        const loading = document.getElementById('loading');
        const titleEl = document.getElementById('loadingTitle');
        const subtitleEl = document.getElementById('loadingSubtitle');
        
        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
        if (loading) loading.classList.add('active');
    }

    function hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('active');
    }

    function updateStats() {
        const text = document.getElementById('projectText')?.value || '';
        const chars = text.length;
        const words = text.split(/\s+/).filter(w => w).length;

        const charCount = document.getElementById('charCount');
        const wordCount = document.getElementById('wordCount');
        
        if (charCount) charCount.textContent = `${chars.toLocaleString()} caracteres`;
        if (wordCount) wordCount.textContent = `${words.toLocaleString()} palavras`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ANÁLISE COM IA - FLUXO PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════════════

    async function analyzeProject() {
        const text = document.getElementById('projectText')?.value?.trim();
        
        if (!text) {
            showToast('Cole a descrição do projeto primeiro', 'error');
            return;
        }

        if (text.length < 100) {
            showToast('Texto muito curto. Descreva melhor o projeto para uma análise completa.', 'error');
            return;
        }

        state.rawText = text;
        state.isAnalyzing = true;
        state.additionalContext = '';
        
        const imageCount = state.attachedImages.length;
        const loadingMsg = imageCount > 0 
            ? `Analisando com Maia (GPT-5.2): texto + ${imageCount} imagem${imageCount > 1 ? 's' : ''}...`
            : `Analisando com Maia (GPT-5.2): extraindo requisitos, regras e estrutura...`;
        
        showLoading('🚀 Analisando com Maia', loadingMsg);

        try {
            // Passar imagens anexadas para a IA
            const images = getAttachedImagesForAPI();
            const pddData = await AIAnalyzer.analyze(text, state.apiKey, images);
            state.pddData = pddData;
            
            hideLoading();
            
            // Verificar lacunas críticas
            const criticalGaps = AIAnalyzer.getCriticalGaps(pddData);
            
            if (criticalGaps.length > 0) {
                // Mostrar modal de lacunas
                showGapsModal(criticalGaps, pddData);
            } else {
                // Ir direto para revisão
                showAnalysisResult(pddData);
            }
            
        } catch (error) {
            console.error('Erro na análise:', error);
            hideLoading();
            showToast(error.message || 'Erro na análise. Tente novamente.', 'error');
        }
        
        state.isAnalyzing = false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL DE LACUNAS CRÍTICAS
    // ═══════════════════════════════════════════════════════════════════════════

    function showGapsModal(gaps, pddData) {
        const modal = document.getElementById('gapsModal');
        const content = document.getElementById('gapsContent');
        
        if (!modal || !content) return;

        state.pendingGaps = gaps;
        
        // Agrupar por impacto
        const altos = gaps.filter(g => g.impacto === 'ALTO');
        const medios = gaps.filter(g => g.impacto === 'MEDIO');
        const baixos = gaps.filter(g => g.impacto === 'BAIXO');
        
        // Agrupar por categoria
        const categorias = {};
        gaps.forEach(g => {
            const cat = g.categoria || 'GERAL';
            if (!categorias[cat]) categorias[cat] = [];
            categorias[cat].push(g);
        });

        const catIcons = {
            'STAKEHOLDERS': '👥', 'OPERACIONAL': '⚙️', 'INTEGRAÇÃO': '🔗',
            'EXCEÇÕES': '🚨', 'COMUNICAÇÃO': '📧', 'REGRA DE NEGÓCIO': '📐',
            'SEGURANÇA': '🔒', 'GERAL': '📋', 'AMBIGUIDADE': '❓',
            'INCOMPLETUDE': '📝', 'TEMPORALIDADE': '⏰', 'ESPECIFICACAO': '🎯'
        };

        let html = `
            <div class="gaps-header-new">
                <div class="gaps-title-area">
                    <div class="gaps-main-icon">🔍</div>
                    <div>
                        <h3>Análise de Completude do PDD</h3>
                        <p>A IA identificou <strong>${gaps.length}</strong> pontos que precisam de atenção para gerar um PDD excelente.</p>
                    </div>
                </div>
                <div class="gaps-summary-bar">
                    <div class="gaps-count-pill high">
                        <span class="pill-count">${altos.length}</span>
                        <span class="pill-label">Críticas</span>
                    </div>
                    <div class="gaps-count-pill medium">
                        <span class="pill-count">${medios.length}</span>
                        <span class="pill-label">Importantes</span>
                    </div>
                    <div class="gaps-count-pill low">
                        <span class="pill-count">${baixos.length}</span>
                        <span class="pill-label">Opcionais</span>
                    </div>
                </div>
            </div>

            <div class="gaps-action-bar">
                <button class="gaps-action-btn primary" onclick="App.showGapInputs()">
                    <span class="action-icon">✏️</span>
                    <div class="action-text">
                        <strong>Responder e Enriquecer PDD</strong>
                        <span>Preencha as informações para um PDD excelente</span>
                    </div>
                </button>
                <button class="gaps-action-btn secondary" onclick="App.proceedWithoutGaps()">
                    <span class="action-icon">⚡</span>
                    <div class="action-text">
                        <strong>Gerar PDD Agora</strong>
                        <span>Continuar com as informações disponíveis</span>
                    </div>
                </button>
            </div>

            <div class="gaps-categories-list">
        `;

        // Render por categoria
        Object.keys(categorias).sort().forEach(cat => {
            const catGaps = categorias[cat];
            const icon = catIcons[cat] || '📋';
            const catAltos = catGaps.filter(g => g.impacto === 'ALTO').length;
            
            html += `
                <div class="gap-category-group">
                    <div class="gap-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
                        <div class="cat-header-left">
                            <span class="cat-icon">${icon}</span>
                            <span class="cat-name">${cat}</span>
                            <span class="cat-count">${catGaps.length} item${catGaps.length > 1 ? 's' : ''}</span>
                            ${catAltos > 0 ? `<span class="cat-critical">${catAltos} crítica${catAltos > 1 ? 's' : ''}</span>` : ''}
                        </div>
                        <span class="cat-toggle">▼</span>
                    </div>
                    <div class="gap-category-body">
            `;

            catGaps.forEach((gap, i) => {
                const impClass = gap.impacto === 'ALTO' ? 'high' : gap.impacto === 'MEDIO' ? 'medium' : 'low';
                const impLabel = gap.impacto === 'ALTO' ? 'CRÍTICA' : gap.impacto === 'MEDIO' ? 'IMPORTANTE' : 'OPCIONAL';
                const tipoIcon = gap.tipo === 'PERGUNTA' ? '❓' : '⚠️';
                
                html += `
                    <div class="gap-item-new ${impClass}">
                        <div class="gap-item-header">
                            <span class="gap-tipo-icon">${tipoIcon}</span>
                            <span class="gap-imp-badge ${impClass}">${impLabel}</span>
                            ${gap.trecho_original ? `<span class="gap-trecho">"${gap.trecho_original}"</span>` : ''}
                        </div>
                        <div class="gap-item-body">
                            <p class="gap-desc">${gap.descricao}</p>
                            <div class="gap-pergunta">
                                <span class="pergunta-icon">💬</span>
                                <span>${gap.sugestao_pergunta}</span>
                            </div>
                            ${gap.contexto ? `<p class="gap-contexto">📎 ${gap.contexto}</p>` : ''}
                            ${gap.valor_sugerido ? `<p class="gap-sugerido">💡 Sugestão: <em>${gap.valor_sugerido}</em></p>` : ''}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        // Seção de inputs (inicialmente oculta)
        html += `
            <div id="gapInputsContainer" class="gap-inputs-container-new" style="display: none;">
                <div class="gap-inputs-header-new">
                    <h4>📝 Preencha as informações faltantes</h4>
                    <p>Responda o máximo que puder. Campos em branco serão inferidos pela IA.</p>
                    <div class="gap-inputs-progress">
                        <div class="progress-bar-mini">
                            <div class="progress-fill-mini" id="gapProgressFill" style="width: 0%"></div>
                        </div>
                        <span class="progress-text" id="gapProgressText">0 de ${gaps.length} respondidas</span>
                    </div>
                </div>
        `;

        gaps.forEach((gap, i) => {
            const impClass = gap.impacto === 'ALTO' ? 'high' : gap.impacto === 'MEDIO' ? 'medium' : 'low';
            const impLabel = gap.impacto === 'ALTO' ? 'CRÍTICA' : gap.impacto === 'MEDIO' ? 'IMPORTANTE' : 'OPCIONAL';
            
            html += `
                <div class="gap-input-card ${impClass}">
                    <div class="gap-input-label">
                        <span class="gap-input-num">${i + 1}</span>
                        <span class="gap-imp-badge ${impClass}">${impLabel}</span>
                        <span class="gap-input-question">${gap.sugestao_pergunta}</span>
                    </div>
                    ${gap.valor_sugerido ? `<div class="gap-input-hint">💡 Sugestão: ${gap.valor_sugerido}</div>` : ''}
                    <textarea id="gap_input_${i}" 
                        class="gap-input-textarea" 
                        placeholder="Digite sua resposta aqui..." 
                        data-campo="${gap.campo}"
                        rows="2"
                        oninput="App.updateGapProgress()"></textarea>
                </div>
            `;
        });

        html += `
                <div class="gap-inputs-actions-new">
                    <button class="btn-secondary" onclick="App.hideGapInputs()">← Voltar</button>
                    <button class="btn-primary btn-large" onclick="App.submitGapInputs()">
                        🚀 Reanalisar com informações adicionais
                    </button>
                </div>
            </div>
        `;

        content.innerHTML = html;
        modal.classList.add('active');
    }

    function showGapInputs() {
        const container = document.getElementById('gapInputsContainer');
        const options = document.querySelector('.gaps-options');
        if (container) container.style.display = 'block';
        if (options) options.style.display = 'none';
    }

    function hideGapInputs() {
        const container = document.getElementById('gapInputsContainer');
        const options = document.querySelector('.gaps-options');
        if (container) container.style.display = 'none';
        if (options) options.style.display = 'flex';
    }

    function updateGapProgress() {
        const total = state.pendingGaps?.length || 0;
        let filled = 0;
        for (let i = 0; i < total; i++) {
            const input = document.getElementById(`gap_input_${i}`);
            if (input && input.value.trim()) filled++;
        }
        const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
        const fillEl = document.getElementById('gapProgressFill');
        const textEl = document.getElementById('gapProgressText');
        if (fillEl) fillEl.style.width = pct + '%';
        if (textEl) textEl.textContent = `${filled} de ${total} respondidas`;
    }

    async function submitGapInputs() {
        // Coletar respostas
        let additionalInfo = [];
        state.pendingGaps.forEach((gap, i) => {
            const input = document.getElementById(`gap_input_${i}`);
            if (input && input.value.trim()) {
                additionalInfo.push(`${gap.sugestao_pergunta}\nResposta: ${input.value.trim()}`);
            }
        });

        if (additionalInfo.length === 0) {
            showToast('Preencha pelo menos uma informação ou clique em "Gerar mesmo assim"', 'error');
            return;
        }

        closeAllModals();
        state.additionalContext = additionalInfo.join('\n\n');
        
        showLoading('🔄 Reanalisando', 'Incorporando novas informações ao PDD...');

        try {
            const pddData = await AIAnalyzer.reanalyzeWithContext(
                state.rawText, 
                state.additionalContext, 
                state.apiKey
            );
            state.pddData = pddData;
            
            hideLoading();
            showAnalysisResult(pddData);
            
        } catch (error) {
            console.error('Erro na reanálise:', error);
            hideLoading();
            showToast(error.message || 'Erro na reanálise', 'error');
        }
    }

    function proceedWithoutGaps() {
        closeAllModals();
        showAnalysisResult(state.pddData);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESULTADO DA ANÁLISE
    // ═══════════════════════════════════════════════════════════════════════════

    function showAnalysisResult(pddData) {
        const modal = document.getElementById('reviewModal');
        const content = document.getElementById('reviewContent');
        
        if (!modal || !content) return;

        const stats = pddData._estatisticas || {};
        const qualidade = pddData.analise_qualidade || {};

        // Calcular score de qualidade do PDD
        const pddScore = calculatePDDScore(pddData);
        
        let html = `
            <!-- Score de Qualidade do PDD -->
            <div class="pdd-quality-score" style="background: linear-gradient(135deg, ${pddScore.color}15, ${pddScore.color}05); border: 2px solid ${pddScore.color}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: ${pddScore.color};">Score de Qualidade do PDD</h3>
                    <div style="font-size: 28px; font-weight: bold; color: ${pddScore.color};">${pddScore.total}%</div>
                </div>
                <div style="background: #e2e8f0; border-radius: 8px; height: 12px; overflow: hidden; margin-bottom: 12px;">
                    <div style="background: ${pddScore.color}; height: 100%; width: ${pddScore.total}%; border-radius: 8px; transition: width 1s ease;"></div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; font-size: 12px;">
                    ${pddScore.items.map(item => `
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="color: ${item.ok ? '#276749' : '#9b2c2c'};">${item.ok ? '✅' : '❌'}</span>
                            <span>${item.label}</span>
                        </div>
                    `).join('')}
                </div>
                ${pddScore.warnings.length > 0 ? `
                    <div style="margin-top: 10px; padding: 8px; background: #fffff0; border-radius: 6px; font-size: 12px; color: #975a16;">
                        ${pddScore.warnings.map(w => `⚠️ ${w}`).join('<br/>')}
                    </div>
                ` : ''}
            </div>

            <!-- Resumo da Análise -->
            <div class="analysis-summary">
                <div class="summary-header">
                    <h3>📊 Resultado da Análise</h3>
                    <div class="confidence-badge ${getConfidenceClass(qualidade.confianca_extracao)}">
                        ${qualidade.confianca_extracao || 70}% de confiança
                    </div>
                </div>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_rpas || 0}</span>
                        <span class="stat-label">RPAs</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_requisitos || 0}</span>
                        <span class="stat-label">Requisitos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_regras || 0}</span>
                        <span class="stat-label">Regras</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_integracoes || 0}</span>
                        <span class="stat-label">Integrações</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_riscos || 0}</span>
                        <span class="stat-label">Riscos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${pddData.lacunas_criticas?.length || 0}</span>
                        <span class="stat-label">Lacunas</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${pddData.requisitos_inferidos?.length || 0}</span>
                        <span class="stat-label">Inferidos</span>
                    </div>
                </div>
                ${qualidade.observacoes_analise ? `<p class="analysis-notes">${escapeHtml(qualidade.observacoes_analise)}</p>` : ''}
            </div>

            <!-- Informações do Projeto -->
            <div class="review-section">
                <h3>📋 Informações do Projeto</h3>
                <div class="review-field">
                    <label>Nome do Projeto</label>
                    <input type="text" id="edit_projeto_nome" value="${escapeHtml(pddData.projeto?.nome || '')}" />
                </div>
                <div class="review-field">
                    <label>Código do Projeto</label>
                    <input type="text" id="edit_projeto_codigo" value="${escapeHtml(pddData.projeto?.nome_codigo || '')}" />
                </div>
                <div class="review-field">
                    <label>Objetivo</label>
                    <textarea id="edit_projeto_objetivo" rows="3">${escapeHtml(pddData.projeto?.objetivo || '')}</textarea>
                </div>
                <div class="review-field">
                    <label>Justificativa</label>
                    <textarea id="edit_projeto_justificativa" rows="2">${escapeHtml(pddData.projeto?.justificativa || '')}</textarea>
                </div>
                <div class="review-field">
                    <label>Escopo - Incluído (um por linha)</label>
                    <textarea id="edit_projeto_escopo_incluido" rows="3">${(pddData.projeto?.escopo?.incluido || []).join('\n')}</textarea>
                </div>
                <div class="review-field">
                    <label>Escopo - Excluído (um por linha)</label>
                    <textarea id="edit_projeto_escopo_excluido" rows="2">${(pddData.projeto?.escopo?.excluido || []).join('\n')}</textarea>
                </div>
                <div class="review-row">
                    <div class="review-field">
                        <label>Complexidade</label>
                        <select id="edit_projeto_complexidade">
                            <option value="BAIXA" ${pddData.projeto?.complexidade === 'BAIXA' ? 'selected' : ''}>Baixa</option>
                            <option value="MEDIA" ${pddData.projeto?.complexidade === 'MEDIA' ? 'selected' : ''}>Média</option>
                            <option value="ALTA" ${pddData.projeto?.complexidade === 'ALTA' ? 'selected' : ''}>Alta</option>
                            <option value="MUITO_ALTA" ${pddData.projeto?.complexidade === 'MUITO_ALTA' ? 'selected' : ''}>Muito Alta</option>
                        </select>
                    </div>
                    <div class="review-field">
                        <label>Criticidade</label>
                        <select id="edit_projeto_criticidade">
                            <option value="BAIXA" ${pddData.projeto?.criticidade === 'BAIXA' ? 'selected' : ''}>Baixa</option>
                            <option value="MEDIA" ${pddData.projeto?.criticidade === 'MEDIA' ? 'selected' : ''}>Média</option>
                            <option value="ALTA" ${pddData.projeto?.criticidade === 'ALTA' ? 'selected' : ''}>Alta</option>
                            <option value="CRITICA" ${pddData.projeto?.criticidade === 'CRITICA' ? 'selected' : ''}>Crítica</option>
                        </select>
                    </div>
                </div>
                <div class="review-field">
                    <label>Sistemas Envolvidos (separados por vírgula)</label>
                    <input type="text" id="edit_projeto_sistemas" value="${(pddData.projeto?.sistemas_envolvidos || []).join(', ')}" />
                </div>
                <div class="review-field">
                    <label>Áreas Envolvidas (separadas por vírgula)</label>
                    <input type="text" id="edit_projeto_areas" value="${(pddData.projeto?.areas_envolvidas || []).join(', ')}" />
                </div>
            </div>

            <!-- Benefícios -->
            <div class="review-section">
                <h3>💰 Benefícios Esperados</h3>
                <div class="review-field">
                    <label>Benefícios Tangíveis (um por linha)</label>
                    <textarea id="edit_beneficios_tangiveis" rows="3">${(pddData.projeto?.beneficios?.tangiveis || []).join('\n')}</textarea>
                </div>
                <div class="review-field">
                    <label>Benefícios Intangíveis (um por linha)</label>
                    <textarea id="edit_beneficios_intangiveis" rows="3">${(pddData.projeto?.beneficios?.intangiveis || []).join('\n')}</textarea>
                </div>
            </div>
        `;

        // RPAs
        if (pddData.rpas?.length > 0) {
            html += `<div class="review-section"><h3>🤖 RPAs Identificados (${pddData.rpas.length})</h3>`;
            
            pddData.rpas.forEach((rpa, i) => {
                html += `
                    <div class="rpa-card">
                        <div class="rpa-header">${rpa.codigo || 'RPA-' + (i+1).toString().padStart(3, '0')} - ${escapeHtml(rpa.nome || 'RPA ' + (i+1))}</div>
                        <div class="review-field">
                            <label>Nome</label>
                            <input type="text" id="edit_rpa_${i}_nome" value="${escapeHtml(rpa.nome || '')}" />
                        </div>
                        <div class="review-field">
                            <label>Descrição</label>
                            <textarea id="edit_rpa_${i}_descricao" rows="2">${escapeHtml(rpa.descricao || '')}</textarea>
                        </div>
                        <div class="review-row">
                            <div class="review-field">
                                <label>Tipo de Trigger</label>
                                <select id="edit_rpa_${i}_trigger_tipo">
                                    <option value="EMAIL" ${rpa.trigger?.tipo === 'EMAIL' ? 'selected' : ''}>E-mail</option>
                                    <option value="AGENDAMENTO" ${rpa.trigger?.tipo === 'AGENDAMENTO' ? 'selected' : ''}>Agendamento</option>
                                    <option value="MANUAL" ${rpa.trigger?.tipo === 'MANUAL' ? 'selected' : ''}>Manual</option>
                                    <option value="EVENTO" ${rpa.trigger?.tipo === 'EVENTO' ? 'selected' : ''}>Evento</option>
                                    <option value="API" ${rpa.trigger?.tipo === 'API' ? 'selected' : ''}>API</option>
                                </select>
                            </div>
                            <div class="review-field">
                                <label>Frequência</label>
                                <input type="text" id="edit_rpa_${i}_frequencia" value="${escapeHtml(rpa.trigger?.frequencia || '')}" />
                            </div>
                        </div>
                        <div class="review-field">
                            <label>Trigger - Descrição</label>
                            <input type="text" id="edit_rpa_${i}_trigger_desc" value="${escapeHtml(rpa.trigger?.descricao || '')}" />
                        </div>
                        <div class="review-row">
                            <div class="review-field">
                                <label>Entrada - Dados (vírgula)</label>
                                <input type="text" id="edit_rpa_${i}_entrada" value="${(rpa.entrada?.dados || []).join(', ')}" />
                            </div>
                            <div class="review-field">
                                <label>Saída - Dados (vírgula)</label>
                                <input type="text" id="edit_rpa_${i}_saida" value="${(rpa.saida?.dados || []).join(', ')}" />
                            </div>
                        </div>
                        <div class="review-field">
                            <label>Fluxo de Execução (um passo por linha)</label>
                            <textarea id="edit_rpa_${i}_fluxo" rows="4">${(rpa.fluxo_execucao || []).map(p => p.acao || p).join('\n')}</textarea>
                        </div>
                        <div class="review-field">
                            <label>Exceções/Tratamentos de Erro (um por linha)</label>
                            <textarea id="edit_rpa_${i}_excecoes" rows="2">${(rpa.excecoes || []).map(e => e.cenario || e).join('\n')}</textarea>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }

        // Requisitos Funcionais
        if (pddData.requisitos_funcionais?.length > 0) {
            html += `
                <div class="review-section collapsible">
                    <h3 onclick="App.toggleSection(this)">📝 Requisitos Funcionais (${pddData.requisitos_funcionais.length}) <span class="toggle-icon">▼</span></h3>
                    <div class="section-content">
            `;
            
            pddData.requisitos_funcionais.forEach((rf, i) => {
                html += `
                    <div class="rf-card">
                        <div class="rf-header">
                            <span class="rf-code">${rf.codigo || 'RF-' + (i+1).toString().padStart(3, '0')}</span>
                            <span class="rf-priority ${rf.prioridade?.toLowerCase()}">${rf.prioridade || 'SHOULD'}</span>
                        </div>
                        <div class="review-field">
                            <label>Título</label>
                            <input type="text" id="edit_rf_${i}_titulo" value="${escapeHtml(rf.titulo || '')}" />
                        </div>
                        <div class="review-field">
                            <label>Descrição</label>
                            <textarea id="edit_rf_${i}_descricao" rows="2">${escapeHtml(rf.descricao || '')}</textarea>
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }

        // Regras de Negócio
        if (pddData.regras_negocio?.length > 0) {
            html += `
                <div class="review-section collapsible">
                    <h3 onclick="App.toggleSection(this)">📐 Regras de Negócio (${pddData.regras_negocio.length}) <span class="toggle-icon">▼</span></h3>
                    <div class="section-content">
            `;
            
            pddData.regras_negocio.forEach((rn, i) => {
                html += `
                    <div class="rn-card">
                        <div class="rn-header">
                            <span class="rn-code">${rn.codigo || 'RN-' + (i+1).toString().padStart(3, '0')}</span>
                            <span class="rn-type">${rn.tipo || 'VAL'}</span>
                        </div>
                        <div class="review-field">
                            <label>Título</label>
                            <input type="text" id="edit_rn_${i}_titulo" value="${escapeHtml(rn.titulo || '')}" />
                        </div>
                        <div class="review-field">
                            <label>Lógica</label>
                            <textarea id="edit_rn_${i}_logica" rows="2">${escapeHtml(rn.logica || rn.descricao || '')}</textarea>
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }

        // Integrações
        if (pddData.integracoes?.length > 0) {
            html += `
                <div class="review-section collapsible">
                    <h3 onclick="App.toggleSection(this)">🔗 Integrações (${pddData.integracoes.length}) <span class="toggle-icon">▼</span></h3>
                    <div class="section-content">
            `;
            
            pddData.integracoes.forEach((int, i) => {
                html += `
                    <div class="int-card">
                        <div class="int-header">
                            <span class="int-code">${int.codigo || 'INT-' + (i+1).toString().padStart(3, '0')}</span>
                            <span class="int-dir">${int.direcao || 'BIDIRECIONAL'}</span>
                        </div>
                        <div class="review-field">
                            <label>Sistema Externo</label>
                            <input type="text" id="edit_int_${i}_sistema" value="${escapeHtml(int.sistema_externo || '')}" />
                        </div>
                        <div class="review-field">
                            <label>Propósito</label>
                            <input type="text" id="edit_int_${i}_proposito" value="${escapeHtml(int.proposito || '')}" />
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }

        // Infraestrutura
        html += `
            <div class="review-section">
                <h3>🖥️ Infraestrutura</h3>
                <div class="review-field">
                    <label>Servidores (formato: SERVIDOR - Função, um por linha)</label>
                    <textarea id="edit_infra_servidores" rows="3">${(pddData.infraestrutura?.servidores || []).map(s => `${s.nome} - ${s.funcao}`).join('\n')}</textarea>
                </div>
                <div class="review-field">
                    <label>Bancos de Dados (formato: banco@SERVIDOR - Função, um por linha)</label>
                    <textarea id="edit_infra_bancos" rows="3">${(pddData.infraestrutura?.bancos_dados || []).map(b => `${b.nome}@${b.servidor} - ${b.funcao}`).join('\n')}</textarea>
                </div>
                <div class="review-field">
                    <label>Tecnologias (separadas por vírgula)</label>
                    <input type="text" id="edit_infra_tecnologias" value="${(pddData.infraestrutura?.tecnologias || []).join(', ')}" />
                </div>
            </div>
        `;

        // Stakeholders
        html += `
            <div class="review-section">
                <h3>👥 Stakeholders</h3>
                <div class="review-row">
                    <div class="review-field">
                        <label>Sponsor</label>
                        <input type="text" id="edit_stake_sponsor" value="${escapeHtml(pddData.stakeholders?.sponsor || '')}" />
                    </div>
                    <div class="review-field">
                        <label>Product Owner</label>
                        <input type="text" id="edit_stake_po" value="${escapeHtml(pddData.stakeholders?.product_owner || '')}" />
                    </div>
                </div>
                <div class="review-row">
                    <div class="review-field">
                        <label>Responsável Negócio</label>
                        <input type="text" id="edit_stake_negocio" value="${escapeHtml(pddData.stakeholders?.responsavel_negocio || '')}" />
                    </div>
                    <div class="review-field">
                        <label>Responsável Técnico</label>
                        <input type="text" id="edit_stake_tecnico" value="${escapeHtml(pddData.stakeholders?.responsavel_tecnico || '')}" />
                    </div>
                </div>
            </div>
        `;

        // Riscos
        if (pddData.riscos?.length > 0) {
            html += `
                <div class="review-section collapsible">
                    <h3 onclick="App.toggleSection(this)">⚠️ Riscos Identificados (${pddData.riscos.length}) <span class="toggle-icon">▼</span></h3>
                    <div class="section-content">
                        <table class="risks-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Risco</th>
                                    <th>Prob.</th>
                                    <th>Impacto</th>
                                    <th>Mitigação</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            pddData.riscos.forEach((risk, i) => {
                html += `
                    <tr>
                        <td>${risk.codigo || 'RISK-' + (i+1).toString().padStart(3, '0')}</td>
                        <td><input type="text" id="edit_risk_${i}_desc" value="${escapeHtml(risk.descricao || '')}" /></td>
                        <td><span class="badge ${risk.probabilidade?.toLowerCase()}">${risk.probabilidade || 'MEDIA'}</span></td>
                        <td><span class="badge ${risk.impacto?.toLowerCase()}">${risk.impacto || 'MEDIO'}</span></td>
                        <td><input type="text" id="edit_risk_${i}_mit" value="${escapeHtml(risk.mitigacao || '')}" /></td>
                    </tr>
                `;
            });
            
            html += `</tbody></table></div></div>`;
        }

        // Premissas e Restrições
        html += `
            <div class="review-section">
                <h3>📌 Premissas e Restrições</h3>
                <div class="review-field">
                    <label>Premissas (uma por linha)</label>
                    <textarea id="edit_premissas" rows="3">${(pddData.premissas || []).join('\n')}</textarea>
                </div>
                <div class="review-field">
                    <label>Restrições (uma por linha)</label>
                    <textarea id="edit_restricoes" rows="3">${(pddData.restricoes || []).join('\n')}</textarea>
                </div>
            </div>
        `;

        // Observações
        html += `
            <div class="review-section">
                <h3>📝 Observações Gerais</h3>
                <textarea id="edit_observacoes" rows="3">${escapeHtml(pddData.observacoes || '')}</textarea>
            </div>
        `;

        content.innerHTML = html;
        modal.classList.add('active');
        
        showToast(`Análise concluída! ${stats.total_rpas} RPAs, ${stats.total_requisitos} requisitos, ${stats.total_regras} regras identificados.`, 'success');
    }

    /**
     * Calcula score de qualidade do PDD gerado
     * Avalia completude de todas as seções
     */
    function calculatePDDScore(pddData) {
        const items = [];
        const warnings = [];
        let score = 0;
        let maxScore = 0;

        // Seções e seus pesos
        const checks = [
            { label: 'Projeto', ok: !!pddData.projeto?.nome && !!pddData.projeto?.objetivo, weight: 10 },
            { label: 'RPAs', ok: pddData.rpas?.length > 0, weight: 15 },
            { label: 'Fluxo Execução', ok: pddData.rpas?.some(r => r.fluxo_execucao?.length > 0), weight: 10 },
            { label: 'Subpassos', ok: pddData.rpas?.some(r => r.fluxo_execucao?.some(f => f.subpassos?.length > 0)), weight: 8 },
            { label: 'Requisitos', ok: pddData.requisitos_funcionais?.length > 0, weight: 10 },
            { label: 'Regras Negócio', ok: pddData.regras_negocio?.length > 0, weight: 10 },
            { label: 'Integrações', ok: pddData.integracoes?.length > 0, weight: 8 },
            { label: 'Stakeholders', ok: !!pddData.stakeholders?.sponsor, weight: 5 },
            { label: 'Infraestrutura', ok: pddData.infraestrutura?.servidores?.length > 0 || pddData.infraestrutura?.tecnologias?.length > 0, weight: 5 },
            { label: 'Cronograma', ok: pddData.cronograma_sugerido?.fases?.length > 0, weight: 5 },
            { label: 'Riscos', ok: pddData.riscos?.length > 0, weight: 5 },
            { label: 'Glossário', ok: pddData.glossario?.length > 0, weight: 3 },
            { label: 'Escopo', ok: pddData.projeto?.escopo?.incluido?.length > 0, weight: 3 },
            { label: 'Benefícios', ok: pddData.projeto?.beneficios?.tangiveis?.length > 0, weight: 3 }
        ];

        checks.forEach(check => {
            maxScore += check.weight;
            if (check.ok) score += check.weight;
            items.push({ label: check.label, ok: check.ok });
        });

        const total = Math.round((score / maxScore) * 100);

        // Warnings
        if (!pddData.rpas?.length) warnings.push('Nenhum RPA identificado - seção principal vazia');
        if (!pddData.rpas?.some(r => r.fluxo_execucao?.some(f => f.subpassos?.length > 0))) {
            warnings.push('RPAs sem subpassos detalhados - fluxo pode ficar superficial');
        }
        if (pddData.lacunas_criticas?.length > 5) {
            warnings.push(`${pddData.lacunas_criticas.length} lacunas críticas - considere enriquecer o texto de entrada`);
        }
        if (!pddData.requisitos_funcionais?.length) warnings.push('Sem requisitos funcionais - PDD incompleto');

        const color = total >= 80 ? '#276749' : total >= 60 ? '#975a16' : '#9b2c2c';

        return { total, items, warnings, color };
    }

    function getConfidenceClass(confidence) {
        if (confidence >= 80) return 'high';
        if (confidence >= 60) return 'medium';
        return 'low';
    }

    function toggleSection(header) {
        const section = header.parentElement;
        section.classList.toggle('collapsed');
    }

    function closeReview() {
        document.getElementById('reviewModal')?.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLETA DE DADOS DO FORMULÁRIO
    // ═══════════════════════════════════════════════════════════════════════════

    function collectFormData() {
        const getValue = (id) => document.getElementById(id)?.value?.trim() || '';
        const getArray = (id) => getValue(id).split('\n').map(s => s.trim()).filter(s => s);
        const getCommaArray = (id) => getValue(id).split(',').map(s => s.trim()).filter(s => s);

        const pddData = {
            projeto: {
                nome: getValue('edit_projeto_nome'),
                nome_codigo: getValue('edit_projeto_codigo'),
                objetivo: getValue('edit_projeto_objetivo'),
                justificativa: getValue('edit_projeto_justificativa'),
                escopo: {
                    incluido: getArray('edit_projeto_escopo_incluido'),
                    excluido: getArray('edit_projeto_escopo_excluido')
                },
                beneficios: {
                    tangiveis: getArray('edit_beneficios_tangiveis'),
                    intangiveis: getArray('edit_beneficios_intangiveis')
                },
                sistemas_envolvidos: getCommaArray('edit_projeto_sistemas'),
                areas_envolvidas: getCommaArray('edit_projeto_areas'),
                complexidade: getValue('edit_projeto_complexidade'),
                criticidade: getValue('edit_projeto_criticidade')
            },
            rpas: [],
            requisitos_funcionais: state.pddData?.requisitos_funcionais || [],
            regras_negocio: state.pddData?.regras_negocio || [],
            integracoes: state.pddData?.integracoes || [],
            infraestrutura: {
                servidores: [],
                bancos_dados: [],
                tecnologias: getCommaArray('edit_infra_tecnologias')
            },
            stakeholders: {
                sponsor: getValue('edit_stake_sponsor'),
                product_owner: getValue('edit_stake_po'),
                responsavel_negocio: getValue('edit_stake_negocio'),
                responsavel_tecnico: getValue('edit_stake_tecnico')
            },
            riscos: state.pddData?.riscos || [],
            premissas: getArray('edit_premissas'),
            restricoes: getArray('edit_restricoes'),
            observacoes: getValue('edit_observacoes'),
            cronograma_sugerido: state.pddData?.cronograma_sugerido || {}
        };

        // Coletar RPAs
        let rpaIndex = 0;
        while (document.getElementById(`edit_rpa_${rpaIndex}_nome`)) {
            const originalRpa = state.pddData?.rpas?.[rpaIndex] || {};
            pddData.rpas.push({
                numero: rpaIndex + 1,
                codigo: originalRpa.codigo || `RPA-${(rpaIndex + 1).toString().padStart(3, '0')}`,
                nome: getValue(`edit_rpa_${rpaIndex}_nome`),
                descricao: getValue(`edit_rpa_${rpaIndex}_descricao`),
                trigger: {
                    tipo: getValue(`edit_rpa_${rpaIndex}_trigger_tipo`),
                    descricao: getValue(`edit_rpa_${rpaIndex}_trigger_desc`),
                    frequencia: getValue(`edit_rpa_${rpaIndex}_frequencia`)
                },
                entrada: {
                    dados: getCommaArray(`edit_rpa_${rpaIndex}_entrada`)
                },
                saida: {
                    dados: getCommaArray(`edit_rpa_${rpaIndex}_saida`)
                },
                fluxo_execucao: getArray(`edit_rpa_${rpaIndex}_fluxo`).map((acao, i) => ({
                    passo: i + 1,
                    acao: acao
                })),
                excecoes: getArray(`edit_rpa_${rpaIndex}_excecoes`).map(e => ({
                    cenario: e
                })),
                ...originalRpa
            });
            rpaIndex++;
        }

        // Parsear servidores
        getArray('edit_infra_servidores').forEach(line => {
            const parts = line.split('-').map(s => s.trim());
            if (parts.length >= 2) {
                pddData.infraestrutura.servidores.push({
                    nome: parts[0],
                    funcao: parts.slice(1).join(' - ')
                });
            }
        });

        // Parsear bancos
        getArray('edit_infra_bancos').forEach(line => {
            const match = line.match(/^(.+?)@(.+?)\s*-\s*(.+)$/);
            if (match) {
                pddData.infraestrutura.bancos_dados.push({
                    nome: match[1].trim(),
                    servidor: match[2].trim(),
                    funcao: match[3].trim()
                });
            }
        });

        // Atualizar requisitos funcionais editados
        let rfIndex = 0;
        while (document.getElementById(`edit_rf_${rfIndex}_titulo`)) {
            if (pddData.requisitos_funcionais[rfIndex]) {
                pddData.requisitos_funcionais[rfIndex].titulo = getValue(`edit_rf_${rfIndex}_titulo`);
                pddData.requisitos_funcionais[rfIndex].descricao = getValue(`edit_rf_${rfIndex}_descricao`);
            }
            rfIndex++;
        }

        // Atualizar regras de negócio editadas
        let rnIndex = 0;
        while (document.getElementById(`edit_rn_${rnIndex}_titulo`)) {
            if (pddData.regras_negocio[rnIndex]) {
                pddData.regras_negocio[rnIndex].titulo = getValue(`edit_rn_${rnIndex}_titulo`);
                pddData.regras_negocio[rnIndex].logica = getValue(`edit_rn_${rnIndex}_logica`);
            }
            rnIndex++;
        }

        // Atualizar integrações editadas
        let intIndex = 0;
        while (document.getElementById(`edit_int_${intIndex}_sistema`)) {
            if (pddData.integracoes[intIndex]) {
                pddData.integracoes[intIndex].sistema_externo = getValue(`edit_int_${intIndex}_sistema`);
                pddData.integracoes[intIndex].proposito = getValue(`edit_int_${intIndex}_proposito`);
            }
            intIndex++;
        }

        // Atualizar riscos editados
        let riskIndex = 0;
        while (document.getElementById(`edit_risk_${riskIndex}_desc`)) {
            if (pddData.riscos[riskIndex]) {
                pddData.riscos[riskIndex].descricao = getValue(`edit_risk_${riskIndex}_desc`);
                pddData.riscos[riskIndex].mitigacao = getValue(`edit_risk_${riskIndex}_mit`);
            }
            riskIndex++;
        }

        return pddData;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GERAÇÃO DO DOCUMENTO
    // ═══════════════════════════════════════════════════════════════════════════

    async function generateDocument() {
        const pddData = collectFormData();
        
        if (!pddData.projeto.nome) {
            showToast('Informe o nome do projeto', 'error');
            return;
        }

        showLoading('📄 Gerando PDD', 'Criando documento Word profissional completo...');

        try {
            // PDDBuilder.build() já salva o arquivo internamente
            await PDDBuilder.build(pddData, {
                incluirCapa: true,
                incluirSumario: true,
                incluirCronograma: true,
                incluirRiscos: true,
                incluirRequisitos: true,
                incluirRegras: true,
                incluirIntegracoes: true,
                incluirDiagramas: true  // Reativado com timeout de 5s por diagrama
            });

            hideLoading();
            closeReview();
            showToast('PDD gerado com sucesso! Documento baixado.', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar:', error);
            hideLoading();
            showToast('Erro ao gerar documento: ' + error.message, 'error');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUNÇÕES AUXILIARES
    // ═══════════════════════════════════════════════════════════════════════════

    function clearAll() {
        const textArea = document.getElementById('projectText');
        if (textArea) textArea.value = '';
        state.pddData = null;
        state.rawText = '';
        state.additionalContext = '';
        updateStats();
        showToast('Conteúdo limpo', 'info');
    }

    function showHelp() {
        const modal = document.getElementById('helpModal');
        if (modal) modal.classList.add('active');
    }

    function closeHelp() {
        const modal = document.getElementById('helpModal');
        if (modal) modal.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO DO PDD
    // ═══════════════════════════════════════════════════════════════════════════

    function validatePDD() {
        if (!state.pddData) {
            showToast('Analise um projeto primeiro', 'error');
            return;
        }

        const result = SchemaValidator.validate(state.pddData);
        showValidationResult(result);
    }

    function showValidationResult(result) {
        const modal = document.getElementById('validationModal');
        const content = document.getElementById('validationContent');
        
        if (!modal || !content) return;

        const completudeClass = result.stats.completude >= 80 ? 'high' : 
                                result.stats.completude >= 60 ? 'medium' : 'low';

        let html = `
            <div class="validation-summary">
                <div class="validation-status ${result.valid ? 'valid' : 'invalid'}">
                    ${result.valid ? '✅ PDD Válido' : '❌ PDD com Problemas'}
                </div>
                <div class="completude-meter">
                    <div class="completude-label">Completude: ${result.stats.completude}%</div>
                    <div class="completude-bar">
                        <div class="completude-fill ${completudeClass}" style="width: ${result.stats.completude}%"></div>
                    </div>
                </div>
            </div>

            <div class="validation-stats">
                <div class="stat-grid">
                    <div class="stat-box">
                        <span class="stat-num">${result.stats.rpas}</span>
                        <span class="stat-text">RPAs</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-num">${result.stats.requisitos}</span>
                        <span class="stat-text">Requisitos</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-num">${result.stats.regras}</span>
                        <span class="stat-text">Regras</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-num">${result.stats.integracoes}</span>
                        <span class="stat-text">Integrações</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-num">${result.stats.riscos}</span>
                        <span class="stat-text">Riscos</span>
                    </div>
                </div>
            </div>
        `;

        if (result.errors.length > 0) {
            html += `
                <div class="validation-section errors">
                    <h4>❌ Erros (${result.errors.length})</h4>
                    <ul>
                        ${result.errors.map(e => `<li><strong>${e.path}:</strong> ${e.message}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (result.warnings.length > 0) {
            html += `
                <div class="validation-section warnings">
                    <h4>⚠️ Avisos (${result.warnings.length})</h4>
                    <ul>
                        ${result.warnings.map(w => `<li><strong>${w.path}:</strong> ${w.message}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (result.errors.length === 0 && result.warnings.length === 0) {
            html += `
                <div class="validation-section success">
                    <h4>🎉 Excelente!</h4>
                    <p>O PDD está completo e bem estruturado. Pronto para gerar o documento.</p>
                </div>
            `;
        }

        content.innerHTML = html;
        modal.classList.add('active');
    }

    function closeValidation() {
        const modal = document.getElementById('validationModal');
        if (modal) modal.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DIAGRAMAS MERMAID
    // ═══════════════════════════════════════════════════════════════════════════

    async function showDiagrams() {
        if (!state.pddData) {
            showToast('Analise um projeto primeiro', 'error');
            return;
        }

        const modal = document.getElementById('diagramsModal');
        const content = document.getElementById('diagramsContent');
        
        if (!modal || !content) return;

        showLoading('📊 Gerando Diagramas', 'Criando visualizações do projeto...');

        try {
            const diagrams = DiagramGenerator.generateAllDiagrams(state.pddData);
            
            let html = '<div class="diagrams-container">';
            
            diagrams.forEach((diagram, i) => {
                html += `
                    <div class="diagram-card">
                        <div class="diagram-header">
                            <h3>${diagram.title}</h3>
                            <div class="diagram-actions">
                                <button class="btn-small" onclick="App.copyDiagramCode(${i})">📋 Copiar Código</button>
                            </div>
                        </div>
                        <div class="diagram-content" id="diagram-${i}">
                            <div class="diagram-loading">Renderizando...</div>
                        </div>
                        <details class="diagram-code">
                            <summary>Ver código Mermaid</summary>
                            <pre id="diagram-code-${i}">${escapeHtml(diagram.mermaid)}</pre>
                        </details>
                    </div>
                `;
            });

            html += '</div>';
            content.innerHTML = html;
            modal.classList.add('active');
            hideLoading();

            // Renderizar cada diagrama
            for (let i = 0; i < diagrams.length; i++) {
                const container = document.getElementById(`diagram-${i}`);
                if (container) {
                    await DiagramGenerator.renderDiagram(container, diagrams[i].mermaid, `mermaid-${i}`);
                }
            }

            // Salvar diagramas no state para exportação
            state.diagrams = diagrams;

        } catch (error) {
            console.error('Erro ao gerar diagramas:', error);
            hideLoading();
            showToast('Erro ao gerar diagramas: ' + error.message, 'error');
        }
    }

    function closeDiagrams() {
        const modal = document.getElementById('diagramsModal');
        if (modal) modal.classList.remove('active');
    }

    function copyDiagramCode(index) {
        if (!state.diagrams || !state.diagrams[index]) return;
        
        const code = state.diagrams[index].mermaid;
        navigator.clipboard.writeText(code).then(() => {
            showToast('Código Mermaid copiado!', 'success');
        }).catch(() => {
            showToast('Erro ao copiar', 'error');
        });
    }

    async function exportAllDiagrams() {
        if (!state.diagrams || state.diagrams.length === 0) {
            showToast('Nenhum diagrama para exportar', 'error');
            return;
        }

        showToast('Exportando diagramas...', 'info');

        // Criar um arquivo de texto com todos os códigos Mermaid
        let content = `# Diagramas do Projeto: ${state.pddData?.projeto?.nome || 'PDD'}\n`;
        content += `# Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;

        state.diagrams.forEach((diagram, i) => {
            content += `## ${diagram.title}\n\n`;
            content += '```mermaid\n';
            content += diagram.mermaid;
            content += '\n```\n\n';
        });

        const blob = new Blob([content], { type: 'text/markdown' });
        const fileName = `Diagramas_${state.pddData?.projeto?.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'PDD'}.md`;
        saveAs(blob, fileName);

        showToast('Diagramas exportados como Markdown!', 'success');
    }

    async function exportDiagramsAsPNG() {
        const containers = document.querySelectorAll('[id^="diagram-"]');
        if (containers.length === 0) {
            showToast('Nenhum diagrama para exportar', 'warning');
            return;
        }

        showToast('Exportando PNGs...', 'info');
        const projectName = state.pddData?.projeto?.nome || 'PDD';
        let count = 0;

        for (let i = 0; i < containers.length; i++) {
            const container = containers[i];
            const title = state.diagrams?.[i]?.type || `diagram_${i}`;
            const filename = `${i + 1}_${title}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            
            const success = await DiagramGenerator.exportSingleAsPNG(container, filename);
            if (success) count++;
            
            await new Promise(r => setTimeout(r, 300));
        }

        showToast(`${count} diagrama(s) exportado(s) como PNG!`, 'success');
    }

    async function exportDiagramsAsPDF() {
        const containers = document.querySelectorAll('[id^="diagram-"]');
        if (containers.length === 0) {
            showToast('Nenhum diagrama para exportar', 'warning');
            return;
        }

        showToast('Gerando PDF...', 'info');
        const projectName = state.pddData?.projeto?.nome || 'PDD';
        
        const success = await DiagramGenerator.exportAllAsPDF(projectName);
        
        if (success) {
            showToast('PDF exportado com sucesso!', 'success');
        } else {
            showToast('Erro ao gerar PDF', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GESTÃO DE EXEMPLOS (RAG)
    // ═══════════════════════════════════════════════════════════════════════════

    function showExamples() {
        const modal = document.getElementById('examplesModal');
        const content = document.getElementById('examplesContent');
        
        if (!modal || !content) return;

        const stats = RAGSystem.getStats();
        const examples = RAGSystem.getAllExamples();

        let html = `
            <div class="examples-stats">
                <div class="stat">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.default}</div>
                    <div class="stat-label">Padrão</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.custom}</div>
                    <div class="stat-label">Customizados</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.categories.length}</div>
                    <div class="stat-label">Categorias</div>
                </div>
            </div>

            <p style="margin-bottom: 16px; color: var(--text-muted); font-size: 0.9rem;">
                O sistema RAG usa esses exemplos para melhorar a qualidade das análises. 
                Quando você analisa um projeto, o sistema busca exemplos similares por keywords.
            </p>

            <div class="examples-list">
        `;

        examples.forEach(ex => {
            const isDefault = ex.isDefault !== false;
            html += `
                <div class="example-card ${isDefault ? 'default' : 'custom'}">
                    <div class="example-header">
                        <div class="example-title">${ex.nome || ex.id}</div>
                        <span class="example-badge ${isDefault ? 'default' : 'custom'}">
                            ${isDefault ? 'Padrão' : 'Customizado'}
                        </span>
                    </div>
                    <div class="example-category">${ex.category || 'SEM CATEGORIA'}</div>
                    <div class="example-keywords">
                        ${(ex.keywords || []).slice(0, 6).map(k => `<span class="example-keyword">${k}</span>`).join('')}
                        ${(ex.keywords || []).length > 6 ? `<span class="example-keyword">+${ex.keywords.length - 6}</span>` : ''}
                    </div>
                    <div class="example-actions">
                        <button class="btn-small" onclick="App.viewExample('${ex.id}')">👁️ Ver</button>
                        ${!isDefault ? `<button class="btn-small" onclick="App.deleteExample('${ex.id}')" style="color: var(--error);">🗑️ Remover</button>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        content.innerHTML = html;
        modal.classList.add('active');
    }

    function closeExamples() {
        const modal = document.getElementById('examplesModal');
        if (modal) modal.classList.remove('active');
    }

    function showAddExampleForm() {
        const modal = document.getElementById('addExampleModal');
        if (modal) modal.classList.add('active');
    }

    function closeAddExample() {
        const modal = document.getElementById('addExampleModal');
        if (modal) modal.classList.remove('active');
        
        // Limpar campos
        document.getElementById('exampleName').value = '';
        document.getElementById('exampleKeywords').value = '';
        document.getElementById('exampleText').value = '';
        
        // Limpar estado de extração
        extractedText = '';
        document.getElementById('extractedTextPreview').style.display = 'none';
        document.getElementById('pdfExtractionStatus').className = 'extraction-status';
        document.getElementById('wordExtractionStatus').className = 'extraction-status';
        
        // Resetar tabs para texto
        document.querySelectorAll('.input-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.input-tab').classList.add('active');
        document.querySelectorAll('.example-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById('exampleTabText').classList.add('active');
    }

    function saveNewExample() {
        const name = document.getElementById('exampleName').value.trim();
        const category = document.getElementById('exampleCategory').value;
        const keywordsStr = document.getElementById('exampleKeywords').value.trim();
        const textAreaText = document.getElementById('exampleText').value.trim();
        
        // Usar texto extraído de PDF/Word se disponível, senão usar textarea
        const text = extractedText || textAreaText;

        if (!name || !keywordsStr || !text) {
            showToast('Preencha todos os campos obrigatórios (nome, keywords e texto/arquivo)', 'error');
            return;
        }

        const keywords = keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
        
        if (keywords.length < 3) {
            showToast('Adicione pelo menos 3 keywords', 'error');
            return;
        }

        try {
            const id = name.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '_')
                .substring(0, 30);

            const example = {
                id: id + '_' + Date.now(),
                nome: name,
                category: category,
                keywords: keywords,
                descricao_original: text,
                exemplo: {
                    projeto: {
                        nome: name,
                        objetivo: text.substring(0, 500)
                    },
                    rpas: [],
                    regras_negocio: []
                }
            };

            RAGSystem.addExample(example);
            showToast('Exemplo adicionado com sucesso!', 'success');
            closeAddExample();
            showExamples(); // Atualizar lista

        } catch (e) {
            showToast('Erro ao salvar: ' + e.message, 'error');
        }
    }

    function deleteExample(id) {
        if (!confirm('Tem certeza que deseja remover este exemplo?')) return;
        
        try {
            RAGSystem.removeExample(id);
            showToast('Exemplo removido!', 'success');
            showExamples(); // Atualizar lista
        } catch (e) {
            showToast('Erro: ' + e.message, 'error');
        }
    }

    function viewExample(id) {
        const example = RAGSystem.getExampleById(id);
        if (!example) {
            showToast('Exemplo não encontrado', 'error');
            return;
        }

        const json = JSON.stringify(example, null, 2);
        
        // Criar modal temporário para visualização
        const content = document.getElementById('examplesContent');
        content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <button class="btn-secondary" onclick="App.showExamples()">← Voltar</button>
            </div>
            <h3 style="margin-bottom: 12px;">${example.nome}</h3>
            <pre style="background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.8rem; max-height: 400px;">${escapeHtml(json)}</pre>
            <div style="margin-top: 16px;">
                <button class="btn-secondary" onclick="navigator.clipboard.writeText(\`${json.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`).then(() => App.showToast('JSON copiado!', 'success'))">
                    📋 Copiar JSON
                </button>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UPLOAD E EXTRAÇÃO DE ARQUIVOS
    // ═══════════════════════════════════════════════════════════════════════════

    // Estado do texto extraído
    let extractedText = '';

    function switchExampleTab(tab) {
        // Atualizar tabs
        document.querySelectorAll('.input-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        // Atualizar conteúdo
        document.querySelectorAll('.example-tab-content').forEach(c => c.classList.remove('active'));
        
        if (tab === 'text') {
            document.getElementById('exampleTabText').classList.add('active');
        } else if (tab === 'pdf') {
            document.getElementById('exampleTabPdf').classList.add('active');
        } else if (tab === 'word') {
            document.getElementById('exampleTabWord').classList.add('active');
        }
    }

    async function handlePdfUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const statusEl = document.getElementById('pdfExtractionStatus');
        statusEl.className = 'extraction-status loading';
        statusEl.textContent = '⏳ Extraindo texto do PDF...';

        try {
            const text = await extractTextFromPDF(file);
            extractedText = text;
            
            showExtractedPreview(text);
            
            statusEl.className = 'extraction-status success';
            statusEl.textContent = `✅ Texto extraído com sucesso! (${text.length} caracteres)`;
            
            // Auto-preencher nome se vazio
            const nameInput = document.getElementById('exampleName');
            if (!nameInput.value) {
                nameInput.value = file.name.replace('.pdf', '').replace(/_/g, ' ');
            }

            // Auto-extrair keywords
            autoExtractKeywords(text);

        } catch (error) {
            statusEl.className = 'extraction-status error';
            statusEl.textContent = '❌ Erro ao extrair: ' + error.message;
            console.error('Erro PDF:', error);
        }
    }

    async function extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        
        return fullText.trim();
    }

    async function handleWordUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const statusEl = document.getElementById('wordExtractionStatus');
        statusEl.className = 'extraction-status loading';
        statusEl.textContent = '⏳ Extraindo texto do Word...';

        try {
            const text = await extractTextFromWord(file);
            extractedText = text;
            
            showExtractedPreview(text);
            
            statusEl.className = 'extraction-status success';
            statusEl.textContent = `✅ Texto extraído com sucesso! (${text.length} caracteres)`;
            
            // Auto-preencher nome se vazio
            const nameInput = document.getElementById('exampleName');
            if (!nameInput.value) {
                nameInput.value = file.name.replace('.docx', '').replace(/_/g, ' ');
            }

            // Auto-extrair keywords
            autoExtractKeywords(text);

        } catch (error) {
            statusEl.className = 'extraction-status error';
            statusEl.textContent = '❌ Erro ao extrair: ' + error.message;
            console.error('Erro Word:', error);
        }
    }

    async function extractTextFromWord(file) {
        // Para .docx, precisamos extrair o XML interno
        const arrayBuffer = await file.arrayBuffer();
        
        // DOCX é um ZIP com XMLs dentro
        // Vamos usar uma abordagem simples extraindo o document.xml
        const JSZip = window.JSZip;
        
        if (!JSZip) {
            // Se JSZip não estiver disponível, usar método alternativo
            return await extractWordAlternative(file);
        }
        
        const zip = await JSZip.loadAsync(arrayBuffer);
        const documentXml = await zip.file('word/document.xml')?.async('string');
        
        if (!documentXml) {
            throw new Error('Arquivo Word inválido');
        }
        
        // Extrair texto dos elementos <w:t>
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
        const textNodes = xmlDoc.getElementsByTagName('w:t');
        
        let text = '';
        for (let node of textNodes) {
            text += node.textContent + ' ';
        }
        
        return text.trim();
    }

    async function extractWordAlternative(file) {
        // Método alternativo: ler como texto/bytes e extrair conteúdo
        // Este é um fallback básico
        const text = await file.text();
        
        // Tentar extrair texto legível
        const readable = text.replace(/[^\x20-\x7E\n\r\tÀ-ÿ]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
        
        if (readable.length < 100) {
            throw new Error('Não foi possível extrair texto. Tente copiar e colar o conteúdo manualmente.');
        }
        
        return readable;
    }

    function showExtractedPreview(text) {
        const previewEl = document.getElementById('extractedTextPreview');
        const contentEl = document.getElementById('extractedTextContent');
        const charsEl = document.getElementById('extractedChars');
        const wordsEl = document.getElementById('extractedWords');
        
        // Mostrar prévia (primeiros 500 chars)
        const preview = text.length > 500 ? text.substring(0, 500) + '...' : text;
        contentEl.textContent = preview;
        
        // Stats
        charsEl.textContent = text.length.toLocaleString() + ' caracteres';
        wordsEl.textContent = text.split(/\s+/).filter(w => w).length.toLocaleString() + ' palavras';
        
        previewEl.style.display = 'block';
    }

    function autoExtractKeywords(text) {
        const keywordsInput = document.getElementById('exampleKeywords');
        if (keywordsInput.value) return; // Não sobrescrever se já preenchido

        // Palavras-chave comuns em PDDs
        const relevantTerms = [
            'sap', 'erp', 'excel', 'email', 'banco', 'pagamento', 'cobrança', 
            'nota fiscal', 'nfe', 'xml', 'relatório', 'dashboard', 'rpa', 
            'automação', 'processo', 'validação', 'aprovação', 'integração',
            'financeiro', 'fiscal', 'contábil', 'folha', 'rh', 'compras',
            'fornecedor', 'cliente', 'pedido', 'estoque', 'faturamento'
        ];

        const textLower = text.toLowerCase();
        const found = relevantTerms.filter(term => textLower.includes(term));
        
        // Também extrair palavras frequentes do texto
        const stopWords = ['de', 'da', 'do', 'para', 'com', 'em', 'que', 'uma', 'um', 'os', 'as', 'no', 'na', 'por', 'ser', 'ao', 'ou', 'e', 'o', 'a', 'se', 'não', 'mais', 'como', 'foi', 'são', 'tem'];
        const words = textLower
            .replace(/[^a-záàâãéèêíïóôõöúçñ\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 4 && !stopWords.includes(w));
        
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        
        const topWords = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);

        const allKeywords = [...new Set([...found, ...topWords])].slice(0, 10);
        keywordsInput.value = allKeywords.join(', ');
    }

    // Adicionar suporte a drag & drop
    function initDragAndDrop() {
        ['pdfDropZone', 'wordDropZone'].forEach(zoneId => {
            const zone = document.getElementById(zoneId);
            if (!zone) return;

            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('dragover');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('dragover');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
                
                const file = e.dataTransfer.files[0];
                if (!file) return;

                if (zoneId === 'pdfDropZone' && file.type === 'application/pdf') {
                    document.getElementById('pdfFileInput').files = e.dataTransfer.files;
                    handlePdfUpload({ target: { files: [file] } });
                } else if (zoneId === 'wordDropZone' && file.name.endsWith('.docx')) {
                    document.getElementById('wordFileInput').files = e.dataTransfer.files;
                    handleWordUpload({ target: { files: [file] } });
                }
            });
        });
    }

    // Inicializar drag & drop quando DOM estiver pronto
    document.addEventListener('DOMContentLoaded', initDragAndDrop);

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        init,
        analyzeProject,
        generateDocument,
        closeReview,
        clearAll,
        showHelp,
        closeHelp,
        saveApiKey,
        changeProvider,  // Novo: alternar entre OpenAI e Maia
        proceedWithoutGaps,
        showGapInputs,
        hideGapInputs,
        updateGapProgress,
        submitGapInputs,
        toggleSection,
        closeAllModals,
        // Novas funções
        validatePDD,
        closeValidation,
        showDiagrams,
        closeDiagrams,
        copyDiagramCode,
        exportAllDiagrams,
        exportDiagramsAsPNG,
        exportDiagramsAsPDF,
        // Gestão de exemplos
        showExamples,
        closeExamples,
        showAddExampleForm,
        closeAddExample,
        saveNewExample,
        deleteExample,
        viewExample,
        showToast,
        // Upload de arquivos
        switchExampleTab,
        handlePdfUpload,
        handleWordUpload,
        // Imagens anexadas
        handleImageUpload,
        removeImage
    };

})();

document.addEventListener('DOMContentLoaded', App.init);
