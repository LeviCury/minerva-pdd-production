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
        additionalContext: ''
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        // Carregar API key salva
        state.apiKey = localStorage.getItem('minerva_openai_key') || '';
        if (state.apiKey) {
            const input = document.getElementById('apiKey');
            if (input) input.value = state.apiKey;
            showApiStatus(true);
        }

        // Event listeners
        document.getElementById('projectText')?.addEventListener('input', updateStats);
        document.getElementById('apiKey')?.addEventListener('change', saveApiKey);
        
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

    function showApiStatus(connected) {
        const indicator = document.getElementById('apiStatus');
        if (indicator) {
            indicator.className = `api-status ${connected ? 'connected' : ''}`;
            indicator.title = connected ? 'IA Conectada' : 'IA Desconectada';
        }
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

        if (!state.apiKey) {
            showToast('Configure a API Key da OpenAI primeiro', 'error');
            document.getElementById('apiKey')?.focus();
            return;
        }

        state.rawText = text;
        state.isAnalyzing = true;
        state.additionalContext = '';
        
        showLoading('🤖 Analisando com IA', 'Extraindo requisitos, regras de negócio e estrutura do PDD...');

        try {
            const pddData = await AIAnalyzer.analyze(text, state.apiKey);
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

        let html = `
            <div class="gaps-header">
                <div class="gaps-icon">⚠️</div>
                <h3>Informações Importantes Não Identificadas</h3>
                <p>A IA identificou algumas informações que podem melhorar o PDD. Você pode:</p>
            </div>

            <div class="gaps-options">
                <div class="gap-option" onclick="App.proceedWithoutGaps()">
                    <div class="option-icon">✅</div>
                    <div class="option-content">
                        <strong>Gerar PDD mesmo assim</strong>
                        <span>Continuar com as informações disponíveis. O PDD será gerado com o contexto atual.</span>
                    </div>
                </div>
                <div class="gap-option" onclick="App.showGapInputs()">
                    <div class="option-icon">✏️</div>
                    <div class="option-content">
                        <strong>Adicionar informações faltantes</strong>
                        <span>Responder às perguntas abaixo para um PDD mais completo.</span>
                    </div>
                </div>
            </div>

            <div class="gaps-list">
                <h4>📋 ${gaps.length} informação(ões) não identificada(s):</h4>
        `;

        gaps.forEach((gap, i) => {
            const impactoClass = gap.impacto === 'ALTO' ? 'high' : gap.impacto === 'MEDIO' ? 'medium' : 'low';
            html += `
                <div class="gap-item ${impactoClass}">
                    <div class="gap-badge">${gap.impacto}</div>
                    <div class="gap-info">
                        <strong>${gap.descricao}</strong>
                        <span class="gap-question">${gap.sugestao_pergunta}</span>
                    </div>
                </div>
            `;
        });

        html += `
            </div>

            <div id="gapInputsContainer" class="gap-inputs-container" style="display: none;">
                <h4>📝 Preencha as informações:</h4>
        `;

        gaps.forEach((gap, i) => {
            html += `
                <div class="gap-input-field">
                    <label>${gap.sugestao_pergunta}</label>
                    <input type="text" id="gap_input_${i}" placeholder="Digite aqui..." data-campo="${gap.campo}" />
                </div>
            `;
        });

        html += `
                <div class="gap-inputs-actions">
                    <button class="btn-secondary" onclick="App.hideGapInputs()">Voltar</button>
                    <button class="btn-primary" onclick="App.submitGapInputs()">
                        🔄 Reanalisar com novas informações
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

        let html = `
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
            const doc = PDDBuilder.build(pddData, {
                incluirCapa: true,
                incluirSumario: true,
                incluirCronograma: true,
                incluirRiscos: true,
                incluirRequisitos: true,
                incluirRegras: true,
                incluirIntegracoes: true
            });

            const blob = await docx.Packer.toBlob(doc);
            
            const fileName = `PDD_${pddData.projeto.nome.replace(/[^a-zA-Z0-9À-ÿ]/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;
            saveAs(blob, fileName);

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
        proceedWithoutGaps,
        showGapInputs,
        hideGapInputs,
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
        exportDiagramsAsPDF
    };

})();

document.addEventListener('DOMContentLoaded', App.init);
